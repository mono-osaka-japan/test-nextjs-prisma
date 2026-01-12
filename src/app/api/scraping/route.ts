/**
 * @file スクレイピングジョブAPI
 * @description スクレイピングジョブの一覧取得・作成・実行を行うAPI
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth/require-auth';
import {
  addScrapingJob,
  getJobs,
  getQueueStats,
  ScrapingJobData,
  JobStatus,
} from '@/lib/queue/scraping-queue';
import { ScrapingConfig } from '@/lib/scraper/engine';
import { cuid } from '@/lib/utils';

// ============================================
// Validation Schemas
// ============================================

const extractionRuleSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['css', 'xpath', 'regex', 'json', 'text']),
  selector: z.string().optional(),
  pattern: z.string().optional(),
  path: z.string().optional(),
  attribute: z.string().optional(),
  transform: z.enum(['trim', 'lowercase', 'uppercase', 'number', 'date', 'json', 'html']).optional(),
  multiple: z.boolean().optional(),
  default: z.union([z.string(), z.number(), z.boolean(), z.null()]).optional(),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const scrapingStepSchema: z.ZodType<any> = z.lazy(() =>
  z.discriminatedUnion('type', [
    z.object({
      name: z.string().min(1),
      type: z.literal('request'),
      description: z.string().optional(),
      continueOnError: z.boolean().optional(),
      url: z.string(),
      method: z.enum(['GET', 'POST']).optional(),
      headers: z.record(z.string(), z.string()).optional(),
      body: z.union([z.string(), z.record(z.string(), z.unknown())]).optional(),
      saveAs: z.string().optional(),
    }),
    z.object({
      name: z.string().min(1),
      type: z.literal('extract'),
      description: z.string().optional(),
      continueOnError: z.boolean().optional(),
      rules: z.array(extractionRuleSchema),
      source: z.string().optional(),
    }),
    z.object({
      name: z.string().min(1),
      type: z.literal('paginate'),
      description: z.string().optional(),
      continueOnError: z.boolean().optional(),
      nextPageSelector: z.string().optional(),
      maxPages: z.number().int().min(1).max(100).optional(),
      delay: z.number().int().min(0).optional(),
      steps: z.array(z.lazy(() => scrapingStepSchema)),
    }),
    z.object({
      name: z.string().min(1),
      type: z.literal('loop'),
      description: z.string().optional(),
      continueOnError: z.boolean().optional(),
      items: z.string(),
      as: z.string(),
      steps: z.array(z.lazy(() => scrapingStepSchema)),
    }),
    z.object({
      name: z.string().min(1),
      type: z.literal('condition'),
      description: z.string().optional(),
      continueOnError: z.boolean().optional(),
      condition: z.string(),
      then: z.array(z.lazy(() => scrapingStepSchema)),
      else: z.array(z.lazy(() => scrapingStepSchema)).optional(),
    }),
    z.object({
      name: z.string().min(1),
      type: z.literal('save'),
      description: z.string().optional(),
      continueOnError: z.boolean().optional(),
      variable: z.string(),
      value: z.string(),
    }),
  ])
);

const createJobSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  startUrl: z.string().url(),
  steps: z.array(scrapingStepSchema),
  httpConfig: z.object({
    timeout: z.number().int().min(1000).max(60000).optional(),
    retries: z.number().int().min(0).max(5).optional(),
    retryDelay: z.number().int().min(0).max(10000).optional(),
    followRedirects: z.boolean().optional(),
    headers: z.record(z.string(), z.string()).optional(),
  }).optional(),
  maxRetries: z.number().int().min(0).max(5).optional(),
  requestDelay: z.number().int().min(0).max(10000).optional(),
  priority: z.number().int().min(1).max(10).optional(),
  scheduledAt: z.coerce.date().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const listJobsSchema = z.object({
  status: z.enum(['waiting', 'active', 'completed', 'failed', 'delayed']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ============================================
// GET /api/scraping
// ============================================

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult.error) return authResult.error;

  try {
    const { searchParams } = new URL(request.url);
    const query = listJobsSchema.parse({
      status: searchParams.get('status') || undefined,
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
    });

    const start = (query.page - 1) * query.limit;
    const end = start + query.limit - 1;

    // ステータスが指定されていない場合は全ステータスを取得
    const statuses: JobStatus[] = query.status
      ? [query.status]
      : ['waiting', 'active', 'completed', 'failed', 'delayed'];

    const [jobs, stats] = await Promise.all([
      getJobs(statuses, start, end),
      getQueueStats(),
    ]);

    return NextResponse.json({
      jobs,
      stats,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: stats.waiting + stats.active + stats.completed + stats.failed + stats.delayed,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'バリデーションエラー', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Failed to list scraping jobs:', error);
    return NextResponse.json(
      { error: 'ジョブの取得に失敗しました' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/scraping
// ============================================

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult.error) return authResult.error;

  try {
    const body = await request.json();
    const data = createJobSchema.parse(body);

    const config: ScrapingConfig = {
      name: data.name,
      description: data.description,
      startUrl: data.startUrl,
      steps: data.steps as ScrapingConfig['steps'],
      httpConfig: data.httpConfig,
      maxRetries: data.maxRetries,
      requestDelay: data.requestDelay,
    };

    const jobData: ScrapingJobData = {
      id: cuid(),
      config,
      priority: data.priority,
      scheduledAt: data.scheduledAt,
      metadata: data.metadata,
    };

    const job = await addScrapingJob(jobData);

    return NextResponse.json(
      {
        message: 'スクレイピングジョブを作成しました',
        job: {
          id: job.id,
          name: job.name,
          data: job.data,
        },
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

    console.error('Failed to create scraping job:', error);
    return NextResponse.json(
      { error: 'ジョブの作成に失敗しました' },
      { status: 500 }
    );
  }
}
