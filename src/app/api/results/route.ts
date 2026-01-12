/**
 * @file スクレイピング結果API
 * @description スクレイピング結果の取得・検索を行うAPI
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth/require-auth';
import { getJobs, getJob, JobStatus } from '@/lib/queue/scraping-queue';

// ============================================
// Validation Schemas
// ============================================

const listResultsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  jobName: z.string().optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  hasErrors: z.coerce.boolean().optional(),
});

// ============================================
// Types
// ============================================

interface ScrapingResultSummary {
  jobId: string;
  jobName: string;
  status: JobStatus;
  startedAt: Date | null;
  finishedAt: Date | null;
  duration: number | null;
  itemsCollected: number;
  errorCount: number;
  pagesVisited: number;
}

// ============================================
// GET /api/results
// ============================================

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult.error) return authResult.error;

  try {
    const { searchParams } = new URL(request.url);
    const query = listResultsSchema.parse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      jobName: searchParams.get('jobName') || undefined,
      fromDate: searchParams.get('fromDate') || undefined,
      toDate: searchParams.get('toDate') || undefined,
      hasErrors: searchParams.get('hasErrors') || undefined,
    });

    const start = (query.page - 1) * query.limit;
    const end = start + query.limit - 1;

    // 完了したジョブのみを取得
    const completedJobs = await getJobs(['completed', 'failed'], start, end + 100); // フィルタリング用に多めに取得

    // フィルタリング
    let filteredJobs = completedJobs;

    if (query.jobName) {
      filteredJobs = filteredJobs.filter((job) =>
        job.name.toLowerCase().includes(query.jobName!.toLowerCase())
      );
    }

    if (query.fromDate) {
      filteredJobs = filteredJobs.filter(
        (job) => job.finishedAt && new Date(job.finishedAt) >= query.fromDate!
      );
    }

    if (query.toDate) {
      filteredJobs = filteredJobs.filter(
        (job) => job.finishedAt && new Date(job.finishedAt) <= query.toDate!
      );
    }

    // ページネーション適用
    const paginatedJobs = filteredJobs.slice(0, query.limit);

    // 各ジョブの結果を取得してサマリーを作成
    const resultsWithNull = await Promise.all(
      paginatedJobs.map(async (jobInfo): Promise<ScrapingResultSummary | null> => {
        const job = await getJob(jobInfo.id);
        const result = job?.returnvalue;

        let itemsCollected = 0;
        let errorCount = 0;
        let pagesVisited = 0;
        let duration: number | null = null;
        let startedAt: Date | null = null;
        let finishedAt: Date | null = null;

        if (result) {
          const scrapingResult = result.result;
          if (scrapingResult) {
            itemsCollected = Object.values(scrapingResult.data || {}).reduce<number>(
              (sum, value) => sum + (Array.isArray(value) ? value.length : 1),
              0
            );
            errorCount = scrapingResult.errors?.length || 0;
            pagesVisited = scrapingResult.metadata?.pagesVisited?.length || 0;
            duration = scrapingResult.metadata?.duration || null;
            startedAt = scrapingResult.metadata?.startedAt
              ? new Date(scrapingResult.metadata.startedAt)
              : null;
            finishedAt = scrapingResult.metadata?.finishedAt
              ? new Date(scrapingResult.metadata.finishedAt)
              : null;
          }
        }

        // hasErrorsフィルタ
        if (query.hasErrors !== undefined) {
          if (query.hasErrors && errorCount === 0) {
            return null;
          }
          if (!query.hasErrors && errorCount > 0) {
            return null;
          }
        }

        return {
          jobId: jobInfo.id,
          jobName: jobInfo.name,
          status: jobInfo.status,
          startedAt,
          finishedAt,
          duration,
          itemsCollected,
          errorCount,
          pagesVisited,
        };
      })
    );

    // nullを除去
    const results = resultsWithNull.filter((r): r is ScrapingResultSummary => r !== null);

    return NextResponse.json({
      results,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: filteredJobs.length,
        hasMore: filteredJobs.length > query.limit,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'バリデーションエラー', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Failed to list scraping results:', error);
    return NextResponse.json(
      { error: '結果の取得に失敗しました' },
      { status: 500 }
    );
  }
}
