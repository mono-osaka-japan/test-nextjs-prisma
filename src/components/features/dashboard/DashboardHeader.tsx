'use client';

export interface DashboardHeaderProps {
  title: string;
  onRefresh?: () => void;
}

export function DashboardHeader({ title, onRefresh }: DashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        {title}
      </h1>
      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          aria-label="データを更新"
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          更新
        </button>
      )}
    </div>
  );
}
