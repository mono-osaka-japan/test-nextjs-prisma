import { Worker, Job } from 'bullmq';
import { getWorkerConnection, closeConnections, closeWorkerConnection } from '../src/lib/queue/connection';
import {
  ScrapingJobData,
  ScrapingJobResult,
} from '../src/lib/queue/scraping-queue';
import {
  ScrapingEngine,
  ScrapingResult,
  createScrapingEngine,
} from '../src/lib/scraper/engine';

// ============================================
// Types
// ============================================

export interface WorkerConfig {
  concurrency?: number;
  limiter?: {
    max: number;
    duration: number;
  };
  lockDuration?: number;
  stalledInterval?: number;
}

export interface WorkerStats {
  processed: number;
  failed: number;
  startedAt: Date;
  lastProcessedAt?: Date;
}

// ============================================
// Default Configuration
// ============================================

const DEFAULT_CONFIG: Required<WorkerConfig> = {
  concurrency: 5,
  limiter: {
    max: 10,
    duration: 1000, // 10 requests per second
  },
  lockDuration: 300000, // 5 minutes
  stalledInterval: 30000, // 30 seconds
};

const QUEUE_NAME = 'scraping';

// ============================================
// Worker Stats
// ============================================

const stats: WorkerStats = {
  processed: 0,
  failed: 0,
  startedAt: new Date(),
};

// ============================================
// Job Processor
// ============================================

async function processScrapingJob(
  job: Job<ScrapingJobData, ScrapingJobResult>
): Promise<ScrapingJobResult> {
  const { config, context, metadata } = job.data;

  console.log(`[Worker] Starting job ${job.id}: ${config.name}`);
  console.log(`[Worker] URL: ${config.startUrl}`);

  // Update progress: Starting
  await job.updateProgress(0);

  const engine: ScrapingEngine = createScrapingEngine(
    config,
    context,
    {
      onStepStart: (step) => {
        console.log(`[Worker] Step started: ${step.name}`);
      },
      onStepComplete: (step) => {
        console.log(`[Worker] Step completed: ${step.name}`);
      },
      onProgress: async ({ current, total, step }) => {
        const progress = Math.round((current / total) * 100);
        await job.updateProgress(progress);
        console.log(`[Worker] Progress: ${progress}% (${step})`);
      },
      onError: (error) => {
        console.error(`[Worker] Error in step ${error.step}: ${error.message}`);
      },
    }
  );

  // Execute scraping
  const result: ScrapingResult = await engine.run();

  // Update progress: Completed
  await job.updateProgress(100);

  if (!result.success) {
    console.error(`[Worker] Job ${job.id} failed:`, result.errors);
    throw new Error(result.errors.map((e) => e.message).join('; '));
  }

  console.log(`[Worker] Job ${job.id} completed successfully`);
  console.log(`[Worker] Requests: ${result.metadata.requestCount}`);
  console.log(`[Worker] Duration: ${result.metadata.duration}ms`);

  stats.processed++;
  stats.lastProcessedAt = new Date();

  return {
    jobId: job.id!,
    result,
    completedAt: new Date(),
  };
}

// ============================================
// Worker Factory
// ============================================

export function createScrapingWorker(
  config: WorkerConfig = {}
): Worker<ScrapingJobData, ScrapingJobResult> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  const worker = new Worker<ScrapingJobData, ScrapingJobResult>(
    QUEUE_NAME,
    processScrapingJob,
    {
      // BullMQはWorkerに専用接続を要求するため、共有接続を使用しない
      connection: getWorkerConnection(),
      concurrency: mergedConfig.concurrency,
      limiter: mergedConfig.limiter,
      lockDuration: mergedConfig.lockDuration,
      stalledInterval: mergedConfig.stalledInterval,
    }
  );

  // Event handlers
  worker.on('completed', (job, result) => {
    console.log(`[Worker] Job ${job.id} completed`);
  });

  worker.on('failed', (job, error) => {
    console.error(`[Worker] Job ${job?.id} failed:`, error.message);
    stats.failed++;
  });

  worker.on('error', (error) => {
    console.error('[Worker] Worker error:', error);
  });

  worker.on('stalled', (jobId) => {
    console.warn(`[Worker] Job ${jobId} stalled`);
  });

  worker.on('progress', (job, progress) => {
    console.log(`[Worker] Job ${job.id} progress: ${progress}%`);
  });

  return worker;
}

// ============================================
// Worker Runner
// ============================================

let worker: Worker<ScrapingJobData, ScrapingJobResult> | null = null;

export async function startWorker(config?: WorkerConfig): Promise<void> {
  if (worker) {
    console.warn('[Worker] Worker already running');
    return;
  }

  console.log('[Worker] Starting scraping worker...');
  worker = createScrapingWorker(config);

  // Wait for ready
  await worker.waitUntilReady();
  console.log('[Worker] Worker ready and listening for jobs');
}

export async function stopWorker(): Promise<void> {
  if (!worker) {
    console.warn('[Worker] No worker running');
    return;
  }

  console.log('[Worker] Stopping worker...');
  await worker.close();
  // Worker用の専用接続もクローズしてライフサイクルの整合性を保つ
  await closeWorkerConnection();
  worker = null;
  console.log('[Worker] Worker stopped');
}

export function getWorkerStats(): WorkerStats {
  return { ...stats };
}

export function isWorkerRunning(): boolean {
  return worker !== null && !worker.closing;
}

// ============================================
// Graceful Shutdown
// ============================================

async function gracefulShutdown(signal: string): Promise<void> {
  console.log(`[Worker] Received ${signal}, shutting down gracefully...`);

  try {
    await stopWorker();
    console.log('[Worker] Shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('[Worker] Error during shutdown:', error);
    process.exit(1);
  }
}

// ============================================
// Main Entry Point
// ============================================

async function main(): Promise<void> {
  // Register shutdown handlers
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Parse configuration from environment
  const config: WorkerConfig = {
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || '5', 10),
    limiter: {
      max: parseInt(process.env.WORKER_RATE_LIMIT_MAX || '10', 10),
      duration: parseInt(process.env.WORKER_RATE_LIMIT_DURATION || '1000', 10),
    },
  };

  try {
    await startWorker(config);

    // Keep the process running
    console.log('[Worker] Worker is running. Press Ctrl+C to stop.');
  } catch (error) {
    console.error('[Worker] Failed to start worker:', error);
    process.exit(1);
  }
}

// Run if this is the main module
if (require.main === module) {
  main();
}
