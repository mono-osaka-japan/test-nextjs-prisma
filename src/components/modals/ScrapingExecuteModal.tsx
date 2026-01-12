'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/button';

export interface ScrapingTask {
  id: string;
  url: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  error?: string;
  result?: Record<string, unknown>;
}

export interface ScrapingConfig {
  urls: string[];
  selector?: string;
  waitForSelector?: string;
  maxDepth?: number;
}

interface ScrapingExecuteModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ScrapingConfig;
  onExecute?: (config: ScrapingConfig) => Promise<ScrapingTask[]>;
  onCancel?: () => void;
}

type OverallStatus = 'idle' | 'running' | 'completed' | 'cancelled' | 'error';

export function ScrapingExecuteModal({
  isOpen,
  onClose,
  config,
  onExecute,
  onCancel,
}: ScrapingExecuteModalProps) {
  const [tasks, setTasks] = useState<ScrapingTask[]>([]);
  const [overallStatus, setOverallStatus] = useState<OverallStatus>('idle');
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const cancelledRef = useRef(false);

  // Initialize tasks from config (filter out empty URLs)
  useEffect(() => {
    if (isOpen) {
      cancelledRef.current = false;
      const validUrls = config.urls.filter((url) => url.trim() !== '');
      if (validUrls.length > 0) {
        setTasks(
          validUrls.map((url, index) => ({
            id: `task-${index}`,
            url,
            status: 'pending',
            progress: 0,
          }))
        );
      } else {
        setTasks([]);
      }
      setOverallStatus('idle');
      setStartTime(null);
      setElapsedTime(0);
    }
  }, [isOpen, config.urls]);

  // Timer for elapsed time
  useEffect(() => {
    if (overallStatus === 'running' && startTime) {
      timerRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime.getTime()) / 1000));
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [overallStatus, startTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const runSimulatedExecution = async () => {
    // Simulate progress updates for demo/default behavior
    for (let i = 0; i < tasks.length; i++) {
      // Check cancellation via ref (not state, which is stale in closure)
      if (cancelledRef.current) break;

      setTasks((prev) =>
        prev.map((task, idx) =>
          idx === i ? { ...task, status: 'running', progress: 0 } : task
        )
      );

      // Simulate progress
      for (let progress = 0; progress <= 100; progress += 20) {
        if (cancelledRef.current) break;
        await new Promise((resolve) => setTimeout(resolve, 200));
        if (cancelledRef.current) break;
        setTasks((prev) =>
          prev.map((task, idx) =>
            idx === i && task.status === 'running'
              ? { ...task, progress }
              : task
          )
        );
      }

      if (cancelledRef.current) break;

      // Mark as completed (simulate random failures)
      const failed = Math.random() < 0.1;
      setTasks((prev) =>
        prev.map((task, idx) =>
          idx === i
            ? {
                ...task,
                status: failed ? 'failed' : 'completed',
                progress: 100,
                error: failed ? 'タイムアウトしました' : undefined,
              }
            : task
        )
      );
    }
  };

  const handleStart = async () => {
    // Validate: require at least one URL
    if (tasks.length === 0) {
      return;
    }

    cancelledRef.current = false;
    setOverallStatus('running');
    setStartTime(new Date());

    try {
      if (onExecute) {
        // Use provided execution handler and update tasks with results
        const results = await onExecute(config);
        if (results && results.length > 0) {
          setTasks(results);
        }
      } else {
        // Only run simulated execution when no handler is provided
        await runSimulatedExecution();
      }

      // Only set completed if not cancelled
      if (!cancelledRef.current) {
        setOverallStatus('completed');
      }
    } catch {
      if (!cancelledRef.current) {
        setOverallStatus('error');
      }
    }
  };

  const handleCancel = useCallback(() => {
    cancelledRef.current = true;
    setOverallStatus('cancelled');
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (onCancel) {
      onCancel();
    }
  }, [onCancel]);

  const handleClose = () => {
    if (overallStatus === 'running') {
      handleCancel();
    }
    onClose();
  };

  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const failedCount = tasks.filter((t) => t.status === 'failed').length;
  const overallProgress =
    tasks.length > 0
      ? Math.round(
          tasks.reduce((sum, t) => sum + t.progress, 0) / tasks.length
        )
      : 0;

  const getStatusIcon = (status: ScrapingTask['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="h-4 w-4 rounded-full border-2 border-zinc-300 dark:border-zinc-600" />
        );
      case 'running':
        return (
          <svg
            className="h-4 w-4 animate-spin text-blue-500"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        );
      case 'completed':
        return (
          <svg
            className="h-4 w-4 text-green-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        );
      case 'failed':
        return (
          <svg
            className="h-4 w-4 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        );
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="スクレイピング実行" size="lg">
      {/* Summary Stats */}
      <div className="mb-4 grid grid-cols-4 gap-4">
        <div className="rounded-lg bg-zinc-100 p-3 text-center dark:bg-zinc-800">
          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {tasks.length}
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">合計</div>
        </div>
        <div className="rounded-lg bg-green-100 p-3 text-center dark:bg-green-900/30">
          <div className="text-2xl font-bold text-green-700 dark:text-green-400">
            {completedCount}
          </div>
          <div className="text-xs text-green-600 dark:text-green-500">完了</div>
        </div>
        <div className="rounded-lg bg-red-100 p-3 text-center dark:bg-red-900/30">
          <div className="text-2xl font-bold text-red-700 dark:text-red-400">
            {failedCount}
          </div>
          <div className="text-xs text-red-600 dark:text-red-500">失敗</div>
        </div>
        <div className="rounded-lg bg-blue-100 p-3 text-center dark:bg-blue-900/30">
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
            {formatTime(elapsedTime)}
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-500">経過時間</div>
        </div>
      </div>

      {/* Overall Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400 mb-1">
          <span>全体の進捗</span>
          <span>{overallProgress}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-700">
          <div
            className="h-2 rounded-full bg-blue-600 transition-all duration-300"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* Task List */}
      <div className="max-h-64 overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center gap-3 border-b border-zinc-200 px-4 py-3 last:border-b-0 dark:border-zinc-700"
          >
            {getStatusIcon(task.status)}
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm text-zinc-900 dark:text-zinc-100">
                {task.url}
              </div>
              {task.status === 'running' && (
                <div className="mt-1 h-1 w-full rounded-full bg-zinc-200 dark:bg-zinc-700">
                  <div
                    className="h-1 rounded-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
              )}
              {task.error && (
                <div className="mt-1 text-xs text-red-500">{task.error}</div>
              )}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              {task.status === 'running' && `${task.progress}%`}
              {task.status === 'completed' && '完了'}
              {task.status === 'failed' && '失敗'}
              {task.status === 'pending' && '待機中'}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-6 flex justify-between">
        <div className="text-sm text-zinc-500 dark:text-zinc-400">
          {overallStatus === 'completed' && (
            <span className="text-green-600 dark:text-green-400">
              スクレイピングが完了しました
            </span>
          )}
          {overallStatus === 'cancelled' && (
            <span className="text-yellow-600 dark:text-yellow-400">
              キャンセルされました
            </span>
          )}
          {overallStatus === 'error' && (
            <span className="text-red-600 dark:text-red-400">
              エラーが発生しました
            </span>
          )}
        </div>
        <div className="flex gap-3">
          {overallStatus === 'idle' && (
            <>
              <Button variant="secondary" onClick={handleClose}>
                キャンセル
              </Button>
              <Button
                variant="primary"
                onClick={handleStart}
                disabled={tasks.length === 0}
              >
                実行開始
              </Button>
            </>
          )}
          {overallStatus === 'running' && (
            <Button variant="danger" onClick={handleCancel}>
              中止
            </Button>
          )}
          {(overallStatus === 'completed' ||
            overallStatus === 'cancelled' ||
            overallStatus === 'error') && (
            <Button variant="secondary" onClick={handleClose}>
              閉じる
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
