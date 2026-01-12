/**
 * @file Slack通知API
 * @description Slack通知を送信するAPI
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth/require-auth';
import {
  createSlackNotifierFromEnv,
  isSlackConfigured,
  NotificationType,
  SlackBlock,
  SlackAttachment,
} from '@/lib/services/slack-notifier';
import { getJob } from '@/lib/queue/scraping-queue';

// ============================================
// Validation Schemas
// ============================================

const sendNotificationSchema = z.object({
  type: z.enum(['success', 'warning', 'error', 'info']),
  title: z.string().min(1).max(200),
  message: z.string().max(2000),
  channel: z.string().optional(),
  fields: z.array(z.object({
    title: z.string(),
    value: z.string(),
    short: z.boolean().optional(),
  })).optional(),
  link: z.object({
    text: z.string(),
    url: z.string().url(),
  }).optional(),
});

const sendJobNotificationSchema = z.object({
  jobId: z.string().min(1),
  channel: z.string().optional(),
  includeDetails: z.boolean().default(true),
});

const sendCustomSchema = z.object({
  text: z.string().min(1).max(4000),
  channel: z.string().optional(),
  blocks: z.array(z.record(z.string(), z.unknown())).optional(),
  attachments: z.array(z.record(z.string(), z.unknown())).optional(),
});

// ============================================
// POST /api/sync/slack
// ============================================

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult.error) return authResult.error;

  try {
    // Slack設定確認
    if (!isSlackConfigured()) {
      return NextResponse.json(
        { error: 'Slack Webhook URLが設定されていません' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const action = body.action as string;

    const notifier = createSlackNotifierFromEnv();

    switch (action) {
      case 'notification': {
        const data = sendNotificationSchema.parse(body);

        const result = await notifier.sendNotification(
          data.type as NotificationType,
          data.title,
          data.message,
          {
            channel: data.channel,
            fields: data.fields,
            link: data.link,
          }
        );

        if (!result.success) {
          return NextResponse.json(
            { error: '通知の送信に失敗しました', details: result.error },
            { status: 500 }
          );
        }

        return NextResponse.json({
          message: '通知を送信しました',
        });
      }

      case 'job': {
        const data = sendJobNotificationSchema.parse(body);

        const job = await getJob(data.jobId);

        if (!job) {
          return NextResponse.json(
            { error: 'ジョブが見つかりません' },
            { status: 404 }
          );
        }

        const state = await job.getState();
        const scrapingResult = job.returnvalue?.result;

        if (state === 'completed' && scrapingResult) {
          const itemsCollected = Object.values(scrapingResult.data || {}).reduce(
            (sum: number, value) => sum + (Array.isArray(value) ? value.length : 1),
            0
          );

          const result = await notifier.sendScrapingComplete(
            data.jobId,
            {
              name: job.name,
              itemsCollected,
              duration: scrapingResult.metadata?.duration || 0,
            },
            data.channel
          );

          if (!result.success) {
            return NextResponse.json(
              { error: '通知の送信に失敗しました', details: result.error },
              { status: 500 }
            );
          }
        } else if (state === 'failed') {
          const result = await notifier.sendScrapingError(
            data.jobId,
            {
              name: job.name,
              error: job.failedReason || '不明なエラー',
            },
            data.channel
          );

          if (!result.success) {
            return NextResponse.json(
              { error: '通知の送信に失敗しました', details: result.error },
              { status: 500 }
            );
          }
        } else {
          return NextResponse.json(
            { error: 'ジョブが完了または失敗していません' },
            { status: 400 }
          );
        }

        return NextResponse.json({
          message: 'ジョブ通知を送信しました',
        });
      }

      case 'custom': {
        const data = sendCustomSchema.parse(body);

        const result = await notifier.send({
          text: data.text,
          channel: data.channel,
          blocks: data.blocks as SlackBlock[] | undefined,
          attachments: data.attachments as SlackAttachment[] | undefined,
        });

        if (!result.success) {
          return NextResponse.json(
            { error: '通知の送信に失敗しました', details: result.error },
            { status: 500 }
          );
        }

        return NextResponse.json({
          message: 'カスタム通知を送信しました',
        });
      }

      default:
        return NextResponse.json(
          { error: 'actionを指定してください（notification, job, custom）' },
          { status: 400 }
        );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'バリデーションエラー', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Failed to send Slack notification:', error);
    return NextResponse.json(
      { error: 'Slack通知の送信に失敗しました' },
      { status: 500 }
    );
  }
}

// ============================================
// GET /api/sync/slack
// ============================================

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult.error) return authResult.error;

  try {
    const configured = isSlackConfigured();

    return NextResponse.json({
      configured,
      status: configured ? 'ready' : 'not_configured',
    });
  } catch (error) {
    console.error('Failed to check Slack configuration:', error);
    return NextResponse.json(
      { error: 'Slack設定の確認に失敗しました' },
      { status: 500 }
    );
  }
}
