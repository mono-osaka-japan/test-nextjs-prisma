'use client';

interface ScrapingSettingsProps {
  settings: {
    maxConcurrency: number;
    requestDelay: number;
    retryAttempts: number;
    timeout: number;
  };
  onChange: (updates: Partial<ScrapingSettingsProps['settings']>) => void;
}

export function ScrapingSettings({
  settings,
  onChange,
}: ScrapingSettingsProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
        スクレイピング設定
      </h3>

      {/* Max Concurrency */}
      <div>
        <label
          htmlFor="max-concurrency"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          最大同時実行数
        </label>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
          同時に実行するスクレイピングタスクの最大数
        </p>
        <input
          type="number"
          id="max-concurrency"
          min={1}
          max={10}
          value={settings.maxConcurrency}
          onChange={(e) =>
            onChange({ maxConcurrency: Math.max(1, Math.min(10, Number(e.target.value))) })
          }
          className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>

      {/* Request Delay */}
      <div>
        <label
          htmlFor="request-delay"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          リクエスト間隔 (ミリ秒)
        </label>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
          各リクエスト間の待機時間
        </p>
        <input
          type="number"
          id="request-delay"
          min={100}
          max={10000}
          step={100}
          value={settings.requestDelay}
          onChange={(e) =>
            onChange({ requestDelay: Math.max(100, Math.min(10000, Number(e.target.value))) })
          }
          className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
        <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          現在: {(settings.requestDelay / 1000).toFixed(1)}秒
        </div>
      </div>

      {/* Retry Attempts */}
      <div>
        <label
          htmlFor="retry-attempts"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          リトライ回数
        </label>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
          失敗時の再試行回数
        </p>
        <input
          type="number"
          id="retry-attempts"
          min={0}
          max={10}
          value={settings.retryAttempts}
          onChange={(e) =>
            onChange({ retryAttempts: Math.max(0, Math.min(10, Number(e.target.value))) })
          }
          className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>

      {/* Timeout */}
      <div>
        <label
          htmlFor="timeout"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          タイムアウト (ミリ秒)
        </label>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
          リクエストのタイムアウト時間
        </p>
        <input
          type="number"
          id="timeout"
          min={5000}
          max={120000}
          step={1000}
          value={settings.timeout}
          onChange={(e) =>
            onChange({ timeout: Math.max(5000, Math.min(120000, Number(e.target.value))) })
          }
          className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
        <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          現在: {(settings.timeout / 1000).toFixed(0)}秒
        </div>
      </div>
    </div>
  );
}
