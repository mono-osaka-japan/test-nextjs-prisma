import { Queue, QueueEvents, Job, JobsOptions } from 'bullmq';
import { getRedisConnection, getQueueEventsConnection, closeQueueEventsConnection } from './connection';
import { ScrapingConfig, ScrapingResult } from '../scraper/engine';
import { VariableContext } from '../scraper/variable-resolver';

// ============================================
// Types
// ============================================

export interface ScrapingJobData {
  id: string;
  config: ScrapingConfig;
  context?: Partial<VariableContext>;
  priority?: number;
  scheduledAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface ScrapingJobResult {
  jobId: string;
  result: ScrapingResult;
  completedAt: Date;
}

export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
}

export type JobStatus = 'waiting' | 'active' | 'completed' | 'failed' | 'delayed';

export interface JobInfo {
  id: string;
  name: string;
  data: ScrapingJobData;
  status: JobStatus;
  progress: number;
  attemptsMade: number;
  failedReason?: string;
  createdAt: Date;
  processedAt?: Date;
  finishedAt?: Date;
}

// ============================================
// Queue Configuration
// ============================================

const QUEUE_NAME = 'scraping';

const DEFAULT_JOB_OPTIONS: JobsOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 5000,
  },
  removeOnComplete: {
    age: 24 * 3600, // 24時間後に削除
    count: 1000, // 最大1000件保持
  },
  removeOnFail: {
    age: 7 * 24 * 3600, // 7日後に削除
    count: 5000, // 最大5000件保持
  },
};

// ============================================
// Queue Singleton
// ============================================

let scrapingQueue: Queue<ScrapingJobData, ScrapingJobResult> | null = null;
let queueEvents: QueueEvents | null = null;

// ============================================
// Queue Management
// ============================================

export function getScrapingQueue(): Queue<ScrapingJobData, ScrapingJobResult> {
  if (!scrapingQueue) {
    scrapingQueue = new Queue(QUEUE_NAME, {
      connection: getRedisConnection(),
      defaultJobOptions: DEFAULT_JOB_OPTIONS,
    });
  }
  return scrapingQueue;
}

export function getQueueEvents(): QueueEvents {
  if (!queueEvents) {
    // BullMQはQueueEventsに専用接続を要求するため、共有接続を使用しない
    queueEvents = new QueueEvents(QUEUE_NAME, {
      connection: getQueueEventsConnection(),
    });
  }
  return queueEvents;
}

export async function closeQueue(): Promise<void> {
  if (queueEvents) {
    await queueEvents.close();
    queueEvents = null;
  }
  // QueueEvents用の専用接続もクローズしてライフサイクルの整合性を保つ
  await closeQueueEventsConnection();

  if (scrapingQueue) {
    await scrapingQueue.close();
    scrapingQueue = null;
  }
}

// ============================================
// Job Operations
// ============================================

export async function addScrapingJob(
  data: ScrapingJobData,
  options?: Partial<JobsOptions>
): Promise<Job<ScrapingJobData, ScrapingJobResult>> {
  const queue = getScrapingQueue();

  const jobOptions: JobsOptions = {
    ...DEFAULT_JOB_OPTIONS,
    ...options,
    priority: data.priority,
    delay: data.scheduledAt
      ? Math.max(0, data.scheduledAt.getTime() - Date.now())
      : undefined,
  };

  return queue.add(data.config.name, data, jobOptions);
}

export async function addBulkScrapingJobs(
  jobs: Array<{ data: ScrapingJobData; options?: Partial<JobsOptions> }>
): Promise<Job<ScrapingJobData, ScrapingJobResult>[]> {
  const queue = getScrapingQueue();

  const bulkJobs = jobs.map(({ data, options }) => ({
    name: data.config.name,
    data,
    opts: {
      ...DEFAULT_JOB_OPTIONS,
      ...options,
      priority: data.priority,
      delay: data.scheduledAt
        ? Math.max(0, data.scheduledAt.getTime() - Date.now())
        : undefined,
    },
  }));

  return queue.addBulk(bulkJobs);
}

export async function getJob(
  jobId: string
): Promise<Job<ScrapingJobData, ScrapingJobResult> | undefined> {
  const queue = getScrapingQueue();
  return queue.getJob(jobId);
}

export async function getJobInfo(jobId: string): Promise<JobInfo | null> {
  const job = await getJob(jobId);
  if (!job) return null;

  const state = await job.getState();

  return {
    id: job.id!,
    name: job.name,
    data: job.data,
    status: state as JobStatus,
    progress: typeof job.progress === 'number' ? job.progress : 0,
    attemptsMade: job.attemptsMade,
    failedReason: job.failedReason,
    createdAt: new Date(job.timestamp),
    processedAt: job.processedOn ? new Date(job.processedOn) : undefined,
    finishedAt: job.finishedOn ? new Date(job.finishedOn) : undefined,
  };
}

export async function removeJob(jobId: string): Promise<boolean> {
  const job = await getJob(jobId);
  if (!job) return false;

  await job.remove();
  return true;
}

export async function retryJob(jobId: string): Promise<boolean> {
  const job = await getJob(jobId);
  if (!job) return false;

  await job.retry();
  return true;
}

// ============================================
// Queue Operations
// ============================================

export async function getQueueStats(): Promise<QueueStats> {
  const queue = getScrapingQueue();

  const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
    queue.isPaused(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    paused: paused ? 1 : 0,
  };
}

export async function getJobs(
  status: JobStatus | JobStatus[],
  start: number = 0,
  end: number = 100
): Promise<JobInfo[]> {
  const queue = getScrapingQueue();
  const statuses = Array.isArray(status) ? status : [status];

  const jobs = await queue.getJobs(statuses, start, end);

  return Promise.all(
    jobs.map(async (job) => {
      const state = await job.getState();
      return {
        id: job.id!,
        name: job.name,
        data: job.data,
        status: state as JobStatus,
        progress: typeof job.progress === 'number' ? job.progress : 0,
        attemptsMade: job.attemptsMade,
        failedReason: job.failedReason,
        createdAt: new Date(job.timestamp),
        processedAt: job.processedOn ? new Date(job.processedOn) : undefined,
        finishedAt: job.finishedOn ? new Date(job.finishedOn) : undefined,
      };
    })
  );
}

export async function pauseQueue(): Promise<void> {
  const queue = getScrapingQueue();
  await queue.pause();
}

export async function resumeQueue(): Promise<void> {
  const queue = getScrapingQueue();
  await queue.resume();
}

export async function drainQueue(): Promise<void> {
  const queue = getScrapingQueue();
  await queue.drain();
}

export async function obliterateQueue(force: boolean = false): Promise<void> {
  const queue = getScrapingQueue();
  await queue.obliterate({ force });
}

// ============================================
// Event Listeners
// ============================================

export type JobEventListener = (jobId: string, result?: ScrapingJobResult) => void;
export type ProgressEventListener = (jobId: string, progress: number) => void;
export type FailedEventListener = (jobId: string, error: Error) => void;

export function onJobCompleted(listener: JobEventListener): () => void {
  const events = getQueueEvents();

  const handler = async ({ jobId, returnvalue }: { jobId: string; returnvalue: string }) => {
    const result = JSON.parse(returnvalue) as ScrapingJobResult;
    listener(jobId, result);
  };

  events.on('completed', handler);
  return () => events.off('completed', handler);
}

export function onJobFailed(listener: FailedEventListener): () => void {
  const events = getQueueEvents();

  const handler = ({ jobId, failedReason }: { jobId: string; failedReason: string }) => {
    listener(jobId, new Error(failedReason));
  };

  events.on('failed', handler);
  return () => events.off('failed', handler);
}

export function onJobProgress(listener: ProgressEventListener): () => void {
  const events = getQueueEvents();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handler = ({ jobId, data }: { jobId: string; data: any }) => {
    const progress = typeof data === 'number' ? data : 0;
    listener(jobId, progress);
  };

  events.on('progress', handler);
  return () => events.off('progress', handler);
}

// ============================================
// Scheduled Jobs
// ============================================

export async function scheduleScrapingJob(
  data: ScrapingJobData,
  scheduledTime: Date
): Promise<Job<ScrapingJobData, ScrapingJobResult>> {
  const delay = Math.max(0, scheduledTime.getTime() - Date.now());
  return addScrapingJob(
    { ...data, scheduledAt: scheduledTime },
    { delay }
  );
}

export async function scheduleRecurringJob(
  data: ScrapingJobData,
  cron: string,
  jobId?: string
): Promise<void> {
  const queue = getScrapingQueue();

  await queue.add(data.config.name, data, {
    ...DEFAULT_JOB_OPTIONS,
    repeat: { pattern: cron },
    jobId: jobId || `recurring-${data.id}`,
  });
}

/**
 * 定期ジョブを削除する
 *
 * @param repeatableKey getRecurringJobs()で取得したkeyを渡す（jobIdではない）
 *
 * 使用例:
 * ```ts
 * const jobs = await getRecurringJobs();
 * const targetJob = jobs.find(j => j.cron === '0 0 * * *');
 * if (targetJob) {
 *   await removeRecurringJob(targetJob.key);
 * }
 * ```
 */
export async function removeRecurringJob(repeatableKey: string): Promise<boolean> {
  const queue = getScrapingQueue();
  return queue.removeRepeatableByKey(repeatableKey);
}

export async function getRecurringJobs(): Promise<Array<{ key: string; cron: string; next: number }>> {
  const queue = getScrapingQueue();
  const repeatableJobs = await queue.getRepeatableJobs();

  return repeatableJobs.map((job) => ({
    key: job.key,
    cron: job.pattern || '',
    next: job.next || 0,
  }));
}
