/**
 * @file 除外ルールAPI
 * @description スクレイピング対象からの除外ルールを管理するAPI
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth/require-auth';

// ============================================
// Validation Schemas
// ============================================

const exclusionTypeSchema = z.enum(['url', 'domain', 'pattern', 'content', 'selector']);

const createExclusionSchema = z.object({
  name: z.string().min(1).max(100),
  type: exclusionTypeSchema,
  value: z.string().min(1),
  description: z.string().max(500).optional(),
  enabled: z.boolean().default(true),
  priority: z.number().int().min(0).max(100).default(50),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const updateExclusionSchema = createExclusionSchema.partial();

const listExclusionsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: exclusionTypeSchema.optional(),
  enabled: z.coerce.boolean().optional(),
  search: z.string().optional(),
});

const checkExclusionSchema = z.object({
  url: z.string().url().optional(),
  content: z.string().optional(),
  selector: z.string().optional(),
});

// ============================================
// Types
// ============================================

interface Exclusion {
  id: string;
  name: string;
  type: string;
  value: string;
  description?: string;
  enabled: boolean;
  priority: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  matchCount: number;
}

/**
 * インメモリストア
 * WARNING: 本番環境ではPrisma等の永続ストアに移行が必要
 * - プロセス再起動/スケールアウト/サーバレス実行で消失
 * - マルチインスタンス間で整合性が取れない
 */
const exclusionStore: Map<string, Exclusion> = new Map();

// ============================================
// Utility Functions
// ============================================

function generateId(): string {
  return `excl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * URLが除外ルールにマッチするかチェック
 */
function checkUrlExclusion(url: string, exclusions: Exclusion[]): Exclusion | null {
  try {
    const parsedUrl = new URL(url);

    for (const exclusion of exclusions) {
      if (!exclusion.enabled) continue;

      switch (exclusion.type) {
        case 'url':
          if (url === exclusion.value || url.startsWith(exclusion.value)) {
            return exclusion;
          }
          break;

        case 'domain':
          if (
            parsedUrl.hostname === exclusion.value ||
            parsedUrl.hostname.endsWith(`.${exclusion.value}`)
          ) {
            return exclusion;
          }
          break;

        case 'pattern':
          try {
            const regex = new RegExp(exclusion.value);
            if (regex.test(url)) {
              return exclusion;
            }
          } catch {
            // 無効な正規表現はスキップ
          }
          break;
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * コンテンツが除外ルールにマッチするかチェック
 */
function checkContentExclusion(content: string, exclusions: Exclusion[]): Exclusion | null {
  for (const exclusion of exclusions) {
    if (!exclusion.enabled) continue;

    if (exclusion.type === 'content') {
      try {
        const regex = new RegExp(exclusion.value, 'i');
        if (regex.test(content)) {
          return exclusion;
        }
      } catch {
        // 文字列マッチにフォールバック
        if (content.includes(exclusion.value)) {
          return exclusion;
        }
      }
    }
  }

  return null;
}

// ============================================
// GET /api/exclusions
// ============================================

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult.error) return authResult.error;

  try {
    const { searchParams } = new URL(request.url);
    const query = listExclusionsSchema.parse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      type: searchParams.get('type') || undefined,
      enabled: searchParams.get('enabled') || undefined,
      search: searchParams.get('search') || undefined,
    });

    // フィルタリング
    let exclusions = Array.from(exclusionStore.values());

    if (query.type) {
      exclusions = exclusions.filter((e) => e.type === query.type);
    }

    if (query.enabled !== undefined) {
      exclusions = exclusions.filter((e) => e.enabled === query.enabled);
    }

    if (query.search) {
      const searchLower = query.search.toLowerCase();
      exclusions = exclusions.filter(
        (e) =>
          e.name.toLowerCase().includes(searchLower) ||
          e.value.toLowerCase().includes(searchLower) ||
          e.description?.toLowerCase().includes(searchLower)
      );
    }

    // ソート（優先度の降順、作成日時の降順）
    exclusions.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    // ページネーション
    const start = (query.page - 1) * query.limit;
    const paginatedExclusions = exclusions.slice(start, start + query.limit);

    return NextResponse.json({
      exclusions: paginatedExclusions,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: exclusions.length,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'バリデーションエラー', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Failed to list exclusions:', error);
    return NextResponse.json(
      { error: '除外ルールの取得に失敗しました' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/exclusions
// ============================================

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult.error) return authResult.error;

  try {
    const body = await request.json();

    // 除外チェックアクション
    if (body.action === 'check') {
      const data = checkExclusionSchema.parse(body);

      if (!data.url && !data.content) {
        return NextResponse.json(
          { error: 'urlまたはcontentを指定してください' },
          { status: 400 }
        );
      }

      const exclusions = Array.from(exclusionStore.values())
        .filter((e) => e.enabled)
        .sort((a, b) => b.priority - a.priority);

      let matchedExclusion: Exclusion | null = null;

      if (data.url) {
        matchedExclusion = checkUrlExclusion(data.url, exclusions);
      }

      if (!matchedExclusion && data.content) {
        matchedExclusion = checkContentExclusion(data.content, exclusions);
      }

      if (matchedExclusion) {
        // マッチカウントを更新
        matchedExclusion.matchCount++;
        matchedExclusion.updatedAt = new Date();

        return NextResponse.json({
          excluded: true,
          rule: {
            id: matchedExclusion.id,
            name: matchedExclusion.name,
            type: matchedExclusion.type,
            value: matchedExclusion.value,
          },
        });
      }

      return NextResponse.json({
        excluded: false,
        rule: null,
      });
    }

    // 新規除外ルール作成
    const data = createExclusionSchema.parse(body);

    // 正規表現の場合は構文チェック
    if (data.type === 'pattern' || data.type === 'content') {
      try {
        new RegExp(data.value);
      } catch {
        return NextResponse.json(
          { error: '無効な正規表現パターンです' },
          { status: 400 }
        );
      }
    }

    const exclusion: Exclusion = {
      id: generateId(),
      name: data.name,
      type: data.type,
      value: data.value,
      description: data.description,
      enabled: data.enabled,
      priority: data.priority,
      metadata: data.metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
      matchCount: 0,
    };

    exclusionStore.set(exclusion.id, exclusion);

    return NextResponse.json(
      {
        message: '除外ルールを作成しました',
        exclusion,
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

    console.error('Failed to create exclusion:', error);
    return NextResponse.json(
      { error: '除外ルールの作成に失敗しました' },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH /api/exclusions
// ============================================

export async function PATCH(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult.error) return authResult.error;

  try {
    const { searchParams } = new URL(request.url);
    const exclusionId = searchParams.get('id');

    if (!exclusionId) {
      return NextResponse.json(
        { error: '除外ルールIDを指定してください' },
        { status: 400 }
      );
    }

    const exclusion = exclusionStore.get(exclusionId);

    if (!exclusion) {
      return NextResponse.json(
        { error: '除外ルールが見つかりません' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const data = updateExclusionSchema.parse(body);

    // 正規表現の場合は構文チェック
    if (
      data.value &&
      (data.type === 'pattern' || data.type === 'content' ||
        (exclusion.type === 'pattern' && !data.type) ||
        (exclusion.type === 'content' && !data.type))
    ) {
      try {
        new RegExp(data.value);
      } catch {
        return NextResponse.json(
          { error: '無効な正規表現パターンです' },
          { status: 400 }
        );
      }
    }

    // 更新
    if (data.name !== undefined) exclusion.name = data.name;
    if (data.type !== undefined) exclusion.type = data.type;
    if (data.value !== undefined) exclusion.value = data.value;
    if (data.description !== undefined) exclusion.description = data.description;
    if (data.enabled !== undefined) exclusion.enabled = data.enabled;
    if (data.priority !== undefined) exclusion.priority = data.priority;
    if (data.metadata !== undefined) exclusion.metadata = data.metadata;
    exclusion.updatedAt = new Date();

    return NextResponse.json({
      message: '除外ルールを更新しました',
      exclusion,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'バリデーションエラー', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Failed to update exclusion:', error);
    return NextResponse.json(
      { error: '除外ルールの更新に失敗しました' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/exclusions
// ============================================

export async function DELETE(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult.error) return authResult.error;

  try {
    const { searchParams } = new URL(request.url);
    const exclusionId = searchParams.get('id');

    if (!exclusionId) {
      return NextResponse.json(
        { error: '除外ルールIDを指定してください' },
        { status: 400 }
      );
    }

    const exclusion = exclusionStore.get(exclusionId);

    if (!exclusion) {
      return NextResponse.json(
        { error: '除外ルールが見つかりません' },
        { status: 404 }
      );
    }

    exclusionStore.delete(exclusionId);

    return NextResponse.json({
      message: '除外ルールを削除しました',
      exclusionId,
    });
  } catch (error) {
    console.error('Failed to delete exclusion:', error);
    return NextResponse.json(
      { error: '除外ルールの削除に失敗しました' },
      { status: 500 }
    );
  }
}
