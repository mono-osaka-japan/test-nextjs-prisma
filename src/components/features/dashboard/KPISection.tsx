'use client';

import { ReactNode } from 'react';
import { KPICard } from './KPICard';

export interface KPIItem {
  title: string;
  value: number;
  change?: number;
  changeLabel?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: ReactNode;
}

export interface KPISectionProps {
  title?: string;
  items: KPIItem[];
}

export function KPISection({ title = 'サマリー', items }: KPISectionProps) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {title}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item, index) => (
          <KPICard
            key={index}
            title={item.title}
            value={item.value}
            change={item.change}
            changeLabel={item.changeLabel}
            trend={item.trend}
            icon={item.icon}
          />
        ))}
      </div>
    </section>
  );
}
