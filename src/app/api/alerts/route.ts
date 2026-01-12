/**
 * @file アラートAPI
 * @description スクレイピング結果に基づくアラートの作成・管理を行うAPI
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth/require-auth';
import {
  createSlackNotifierFromEnv,
  isSlackConfigured,
} from '@/lib/services/slack-notifier';

// ============================================
// Validation Schemas
// ============================================

const alertTypeSchema = z.enum(['price_drop', 'stock_change', 'new_item', 'threshold', 'custom']);

const createAlertSchema = z.object({
  name: z.string().min(1).max(100),
  type: alertTypeSchema,
  condition: z.object({
    field: z.string(),
    operator: z.enum(['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'contains', 'regex']),
    value: z.union([z.string(), z.number(), z.boolean()]),
    previousValueField: z.string().optional(), // 前回値との比較用
  }),
  notifySlack: z.boolean().default(false),
  slackChannel: z.string().optional(),
  enabled: z.boolean().default(true),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const updateAlertSchema = createAlertSchema.partial();

const listAlertsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: alertTypeSchema.optional(),
  enabled: z.coerce.boolean().optional(),
});

const triggerAlertSchema = z.object({
  alertId: z.string(),
  data: z.record(z.string(), z.unknown()),
  message: z.string().optional(),
});

// ============================================
// Types (Prismaモデルがない場合のインメモリストア)
// ============================================

interface Alert {
  id: string;
  name: string;
  type: string;
  condition: {
    field: string;
    operator: string;
    value: string | number | boolean;
    previousValueField?: string;
  };
  notifySlack: boolean;
  slackChannel?: string;
  enabled: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  triggeredCount: number;
  lastTriggeredAt?: Date;
}

interface AlertHistory {
  id: string;
  alertId: string;
  triggeredAt: Date;
  data: Record<string, unknown>;
  message?: string;
  notificationSent: boolean;
}

/**
 * インメモリストア
 * WARNING: 本番環境ではPrisma等の永続ストアに移行が必要
 * - プロセス再起動/スケールアウト/サーバレス実行で消失
 * - マルチインスタンス間で整合性が取れない
 */
const alertStore: Map<string, Alert> = new Map();
const alertHistoryStore: AlertHistory[] = [];

// ============================================
// Utility Functions
// ============================================

function generateId(): string {
  return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function evaluateCondition(
  condition: Alert['condition'],
  data: Record<string, unknown>
): boolean {
  const fieldValue = data[condition.field];
  const compareValue = condition.value;

  switch (condition.operator) {
    case 'eq':
      return fieldValue === compareValue;
    case 'ne':
      return fieldValue !== compareValue;
    case 'gt':
      return Number(fieldValue) > Number(compareValue);
    case 'gte':
      return Number(fieldValue) >= Number(compareValue);
    case 'lt':
      return Number(fieldValue) < Number(compareValue);
    case 'lte':
      return Number(fieldValue) <= Number(compareValue);
    case 'contains':
      return String(fieldValue).includes(String(compareValue));
    case 'regex':
      return new RegExp(String(compareValue)).test(String(fieldValue));
    default:
      return false;
  }
}

// ============================================
// GET /api/alerts
// ============================================

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult.error) return authResult.error;

  try {
    const { searchParams } = new URL(request.url);
    const query = listAlertsSchema.parse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      type: searchParams.get('type') || undefined,
      enabled: searchParams.get('enabled') || undefined,
    });

    // フィルタリング
    let alerts = Array.from(alertStore.values());

    if (query.type) {
      alerts = alerts.filter((a) => a.type === query.type);
    }

    if (query.enabled !== undefined) {
      alerts = alerts.filter((a) => a.enabled === query.enabled);
    }

    // ソート（作成日時の降順）
    alerts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // ページネーション
    const start = (query.page - 1) * query.limit;
    const paginatedAlerts = alerts.slice(start, start + query.limit);

    return NextResponse.json({
      alerts: paginatedAlerts,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: alerts.length,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'バリデーションエラー', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Failed to list alerts:', error);
    return NextResponse.json(
      { error: 'アラートの取得に失敗しました' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/alerts
// ============================================

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult.error) return authResult.error;

  try {
    const body = await request.json();

    // アラートトリガーアクション
    if (body.action === 'trigger') {
      const data = triggerAlertSchema.parse(body);

      const alert = alertStore.get(data.alertId);
      if (!alert) {
        return NextResponse.json(
          { error: 'アラートが見つかりません' },
          { status: 404 }
        );
      }

      if (!alert.enabled) {
        return NextResponse.json(
          { error: 'アラートが無効です' },
          { status: 400 }
        );
      }

      // 条件評価
      const triggered = evaluateCondition(alert.condition, data.data);

      if (!triggered) {
        return NextResponse.json({
          triggered: false,
          message: 'アラート条件を満たしていません',
        });
      }

      // アラート履歴に追加
      const historyId = generateId();
      const history: AlertHistory = {
        id: historyId,
        alertId: alert.id,
        triggeredAt: new Date(),
        data: data.data,
        message: data.message,
        notificationSent: false,
      };

      // Slack通知
      if (alert.notifySlack && isSlackConfigured()) {
        try {
          const notifier = createSlackNotifierFromEnv();
          await notifier.sendAlert(
            {
              id: historyId,
              type: alert.type as 'price_drop' | 'stock_change' | 'new_item' | 'threshold',
              title: alert.name,
              message: data.message || `アラート「${alert.name}」がトリガーされました`,
              metadata: data.data as Record<string, string | number>,
            },
            alert.slackChannel
          );
          history.notificationSent = true;
        } catch (e) {
          console.error('Failed to send Slack notification:', e);
        }
      }

      alertHistoryStore.push(history);

      // アラート統計を更新
      alert.triggeredCount++;
      alert.lastTriggeredAt = new Date();
      alert.updatedAt = new Date();

      return NextResponse.json({
        triggered: true,
        historyId,
        notificationSent: history.notificationSent,
      });
    }

    // 新規アラート作成
    const data = createAlertSchema.parse(body);

    const alert: Alert = {
      id: generateId(),
      name: data.name,
      type: data.type,
      condition: data.condition,
      notifySlack: data.notifySlack,
      slackChannel: data.slackChannel,
      enabled: data.enabled,
      metadata: data.metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
      triggeredCount: 0,
    };

    alertStore.set(alert.id, alert);

    return NextResponse.json(
      {
        message: 'アラートを作成しました',
        alert,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'バリデーションエラー', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Failed to create alert:', error);
    return NextResponse.json(
      { error: 'アラートの作成に失敗しました' },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH /api/alerts
// ============================================

export async function PATCH(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult.error) return authResult.error;

  try {
    const { searchParams } = new URL(request.url);
    const alertId = searchParams.get('id');

    if (!alertId) {
      return NextResponse.json(
        { error: 'アラートIDを指定してください' },
        { status: 400 }
      );
    }

    const alert = alertStore.get(alertId);

    if (!alert) {
      return NextResponse.json(
        { error: 'アラートが見つかりません' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const data = updateAlertSchema.parse(body);

    // 更新
    if (data.name !== undefined) alert.name = data.name;
    if (data.type !== undefined) alert.type = data.type;
    if (data.condition !== undefined) alert.condition = data.condition;
    if (data.notifySlack !== undefined) alert.notifySlack = data.notifySlack;
    if (data.slackChannel !== undefined) alert.slackChannel = data.slackChannel;
    if (data.enabled !== undefined) alert.enabled = data.enabled;
    if (data.metadata !== undefined) alert.metadata = data.metadata;
    alert.updatedAt = new Date();

    return NextResponse.json({
      message: 'アラートを更新しました',
      alert,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'バリデーションエラー', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Failed to update alert:', error);
    return NextResponse.json(
      { error: 'アラートの更新に失敗しました' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/alerts
// ============================================

export async function DELETE(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult.error) return authResult.error;

  try {
    const { searchParams } = new URL(request.url);
    const alertId = searchParams.get('id');

    if (!alertId) {
      return NextResponse.json(
        { error: 'アラートIDを指定してください' },
        { status: 400 }
      );
    }

    const alert = alertStore.get(alertId);

    if (!alert) {
      return NextResponse.json(
        { error: 'アラートが見つかりません' },
        { status: 404 }
      );
    }

    alertStore.delete(alertId);

    return NextResponse.json({
      message: 'アラートを削除しました',
      alertId,
    });
  } catch (error) {
    console.error('Failed to delete alert:', error);
    return NextResponse.json(
      { error: 'アラートの削除に失敗しました' },
      { status: 500 }
    );
  }
}
