/**
 * @file 個別スクレイピングジョブAPI
 * @description 特定のスクレイピングジョブの取得・更新・削除・再試行を行うAPI
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth/require-auth';
import {
  getJobInfo,
  getJob,
  removeJob,
  retryJob,
} from '@/lib/queue/scraping-queue';

// ============================================
// Types
// ============================================

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ============================================
// Validation Schemas
// ============================================

const actionSchema = z.object({
  action: z.enum(['retry', 'cancel']),
});

// ============================================
// GET /api/scraping/[id]
// ============================================

export async function GET(request: NextRequest, { params }: RouteParams) {
  const authResult = await requireAuth(request);
  if (authResult.error) return authResult.error;

  try {
    const { id } = await params;
    const jobInfo = await getJobInfo(id);

    if (!jobInfo) {
      return NextResponse.json(
        { error: 'ジョブが見つかりません' },
        { status: 404 }
      );
    }

    // ジョブの詳細結果も取得
    const job = await getJob(id);
    const result = job?.returnvalue;

    return NextResponse.json({
      ...jobInfo,
      result,
    });
  } catch (error) {
    console.error('Failed to get scraping job:', error);
    return NextResponse.json(
      { error: 'ジョブの取得に失敗しました' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/scraping/[id]
// ============================================

export async function POST(request: NextRequest, { params }: RouteParams) {
  const authResult = await requireAuth(request);
  if (authResult.error) return authResult.error;

  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = actionSchema.parse(body);

    const jobInfo = await getJobInfo(id);

    if (!jobInfo) {
      return NextResponse.json(
        { error: 'ジョブが見つかりません' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'retry': {
        if (jobInfo.status !== 'failed') {
          return NextResponse.json(
            { error: '失敗したジョブのみ再試行できます' },
            { status: 400 }
          );
        }

        const success = await retryJob(id);

        if (!success) {
          return NextResponse.json(
            { error: 'ジョブの再試行に失敗しました' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          message: 'ジョブを再試行しました',
          jobId: id,
        });
      }

      case 'cancel': {
        if (jobInfo.status === 'completed' || jobInfo.status === 'failed') {
          return NextResponse.json(
            { error: '完了または失敗したジョブはキャンセルできません' },
            { status: 400 }
          );
        }

        const success = await removeJob(id);

        if (!success) {
          return NextResponse.json(
            { error: 'ジョブのキャンセルに失敗しました' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          message: 'ジョブをキャンセルしました',
          jobId: id,
        });
      }

      default:
        return NextResponse.json(
          { error: '無効なアクションです' },
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

    console.error('Failed to perform action on scraping job:', error);
    return NextResponse.json(
      { error: 'ジョブの操作に失敗しました' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/scraping/[id]
// ============================================

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const authResult = await requireAuth(request);
  if (authResult.error) return authResult.error;

  try {
    const { id } = await params;
    const jobInfo = await getJobInfo(id);

    if (!jobInfo) {
      return NextResponse.json(
        { error: 'ジョブが見つかりません' },
        { status: 404 }
      );
    }

    // アクティブなジョブは削除できない
    if (jobInfo.status === 'active') {
      return NextResponse.json(
        { error: '実行中のジョブは削除できません' },
        { status: 400 }
      );
    }

    const success = await removeJob(id);

    if (!success) {
      return NextResponse.json(
        { error: 'ジョブの削除に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'ジョブを削除しました',
      jobId: id,
    });
  } catch (error) {
    console.error('Failed to delete scraping job:', error);
    return NextResponse.json(
      { error: 'ジョブの削除に失敗しました' },
      { status: 500 }
    );
  }
}
