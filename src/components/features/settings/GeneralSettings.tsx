'use client';

interface GeneralSettingsProps {
  settings: {
    language: string;
    timezone: string;
    theme: 'light' | 'dark' | 'system';
  };
  onChange: (updates: Partial<GeneralSettingsProps['settings']>) => void;
}

const languages = [
  { value: 'ja', label: '日本語' },
  { value: 'en', label: 'English' },
  { value: 'zh', label: '中文' },
  { value: 'ko', label: '한국어' },
];

const timezones = [
  { value: 'Asia/Tokyo', label: '東京 (GMT+9)' },
  { value: 'America/New_York', label: 'ニューヨーク (GMT-5)' },
  { value: 'Europe/London', label: 'ロンドン (GMT+0)' },
  { value: 'Asia/Shanghai', label: '上海 (GMT+8)' },
];

const themes = [
  { value: 'light', label: 'ライト' },
  { value: 'dark', label: 'ダーク' },
  { value: 'system', label: 'システム設定に従う' },
];

export function GeneralSettings({ settings, onChange }: GeneralSettingsProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
        一般設定
      </h3>

      {/* Language */}
      <div>
        <label
          htmlFor="language"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          言語
        </label>
        <select
          id="language"
          value={settings.language}
          onChange={(e) => onChange({ language: e.target.value })}
          className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        >
          {languages.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>

      {/* Timezone */}
      <div>
        <label
          htmlFor="timezone"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          タイムゾーン
        </label>
        <select
          id="timezone"
          value={settings.timezone}
          onChange={(e) => onChange({ timezone: e.target.value })}
          className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        >
          {timezones.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>
      </div>

      {/* Theme */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          テーマ
        </label>
        <div className="mt-2 space-y-2">
          {themes.map((theme) => (
            <label
              key={theme.value}
              className="flex items-center gap-3 cursor-pointer"
            >
              <input
                type="radio"
                name="theme"
                value={theme.value}
                checked={settings.theme === theme.value}
                onChange={(e) =>
                  onChange({ theme: e.target.value as 'light' | 'dark' | 'system' })
                }
                className="h-4 w-4 border-zinc-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">
                {theme.label}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
