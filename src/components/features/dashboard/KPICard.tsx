'use client';

import { ReactNode } from 'react';

export interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}

export function KPICard({
  title,
  value,
  change,
  changeLabel,
  icon,
  trend = 'neutral',
}: KPICardProps) {
  const trendColors = {
    up: 'text-green-600 dark:text-green-400',
    down: 'text-red-600 dark:text-red-400',
    neutral: 'text-gray-600 dark:text-gray-400',
  };

  const trendArrows = {
    up: '↑',
    down: '↓',
    neutral: '→',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {change !== undefined && (
            <p className={`mt-2 text-sm ${trendColors[trend]}`}>
              <span className="font-medium">
                {trendArrows[trend]} {change > 0 ? '+' : ''}
                {change}%
              </span>
              {changeLabel && (
                <span className="text-gray-500 dark:text-gray-400 ml-1">
                  {changeLabel}
                </span>
              )}
            </p>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
