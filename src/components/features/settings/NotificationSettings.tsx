'use client';

interface NotificationSettingsProps {
  settings: {
    email: boolean;
    push: boolean;
    digest: 'none' | 'daily' | 'weekly';
  };
  onChange: (updates: Partial<NotificationSettingsProps['settings']>) => void;
}

const digestOptions = [
  { value: 'none', label: '受け取らない' },
  { value: 'daily', label: '毎日' },
  { value: 'weekly', label: '毎週' },
];

export function NotificationSettings({
  settings,
  onChange,
}: NotificationSettingsProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
        通知設定
      </h3>

      {/* Email Notifications */}
      <div className="flex items-center justify-between">
        <div>
          <label
            htmlFor="email-notifications"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            メール通知
          </label>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            重要な更新をメールで受け取ります
          </p>
        </div>
        <button
          id="email-notifications"
          type="button"
          role="switch"
          aria-checked={settings.email}
          onClick={() => onChange({ email: !settings.email })}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            settings.email ? 'bg-blue-600' : 'bg-zinc-300 dark:bg-zinc-600'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              settings.email ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Push Notifications */}
      <div className="flex items-center justify-between">
        <div>
          <label
            htmlFor="push-notifications"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            プッシュ通知
          </label>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            ブラウザのプッシュ通知を受け取ります
          </p>
        </div>
        <button
          id="push-notifications"
          type="button"
          role="switch"
          aria-checked={settings.push}
          onClick={() => onChange({ push: !settings.push })}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            settings.push ? 'bg-blue-600' : 'bg-zinc-300 dark:bg-zinc-600'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              settings.push ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Digest Frequency */}
      <div>
        <label
          htmlFor="digest"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          ダイジェストメール
        </label>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
          活動のまとめを受け取る頻度を選択
        </p>
        <select
          id="digest"
          value={settings.digest}
          onChange={(e) =>
            onChange({ digest: e.target.value as 'none' | 'daily' | 'weekly' })
          }
          className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        >
          {digestOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
