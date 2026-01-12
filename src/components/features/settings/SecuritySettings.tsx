'use client';

interface SecuritySettingsProps {
  settings: {
    twoFactorEnabled: boolean;
    sessionTimeout: number;
  };
  onChange: (updates: Partial<SecuritySettingsProps['settings']>) => void;
}

const sessionTimeoutOptions = [
  { value: 15, label: '15分' },
  { value: 30, label: '30分' },
  { value: 60, label: '1時間' },
  { value: 120, label: '2時間' },
  { value: 480, label: '8時間' },
  { value: 1440, label: '24時間' },
];

export function SecuritySettings({
  settings,
  onChange,
}: SecuritySettingsProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
        セキュリティ設定
      </h3>

      {/* Two-Factor Authentication */}
      <div className="flex items-center justify-between">
        <div>
          <label
            htmlFor="two-factor"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            二要素認証
          </label>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            ログイン時に追加の認証を求めます
          </p>
        </div>
        <button
          id="two-factor"
          type="button"
          role="switch"
          aria-checked={settings.twoFactorEnabled}
          onClick={() => onChange({ twoFactorEnabled: !settings.twoFactorEnabled })}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            settings.twoFactorEnabled
              ? 'bg-blue-600'
              : 'bg-zinc-300 dark:bg-zinc-600'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              settings.twoFactorEnabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Session Timeout */}
      <div>
        <label
          htmlFor="session-timeout"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          セッションタイムアウト
        </label>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
          非アクティブ時に自動ログアウトするまでの時間
        </p>
        <select
          id="session-timeout"
          value={settings.sessionTimeout}
          onChange={(e) => onChange({ sessionTimeout: Number(e.target.value) })}
          className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        >
          {sessionTimeoutOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Password Change Button */}
      <div className="border-t border-zinc-200 pt-4 dark:border-zinc-700">
        <button
          type="button"
          className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          パスワードを変更
        </button>
      </div>
    </div>
  );
}
