'use client';

import { useState } from 'react';
import {
  DashboardHeader,
  KPISection,
  AlertList,
  AlertModal,
  LoadingState,
  ErrorState,
  CampaignsIcon,
  PatternsIcon,
  SystemGroupsIcon,
  type Alert,
  type KPIItem,
} from '@/components/features/dashboard';
import { useDashboard } from '@/hooks/useDashboard';

export default function DashboardPage() {
  const { data, alerts, isLoading, error, refetch, markAlertAsRead } = useDashboard();
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAlertClick = (alert: Alert) => {
    setSelectedAlert(alert);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAlert(null);
  };

  if (isLoading) {
    return <LoadingState message="ダッシュボードを読み込み中..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={refetch} />;
  }

  const kpiItems: KPIItem[] = [
    {
      title: '案件数',
      value: data?.summary.campaigns.total ?? 0,
      change: data?.summary.campaigns.active,
      changeLabel: 'アクティブ',
      trend: (data?.summary.campaigns.active ?? 0) > 0 ? 'up' : 'neutral',
      icon: <CampaignsIcon />,
    },
    {
      title: 'パターン数',
      value: data?.summary.patterns.total ?? 0,
      change: data?.summary.patterns.active,
      changeLabel: 'アクティブ',
      trend: (data?.summary.patterns.active ?? 0) > 0 ? 'up' : 'neutral',
      icon: <PatternsIcon />,
    },
    {
      title: 'システムグループ数',
      value: data?.summary.systemGroups.total ?? 0,
      change: data?.summary.systemGroups.active,
      changeLabel: 'アクティブ',
      trend: (data?.summary.systemGroups.active ?? 0) > 0 ? 'up' : 'neutral',
      icon: <SystemGroupsIcon />,
    },
  ];

  return (
    <div className="space-y-6">
      <DashboardHeader title="ダッシュボード" onRefresh={refetch} />

      <KPISection title="サマリー" items={kpiItems} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Campaigns */}
        <section className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            最近の案件
          </h3>
          {data?.recent.campaigns.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">案件がありません</p>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {data?.recent.campaigns.map((campaign) => (
                <li key={campaign.id} className="py-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {campaign.name}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(campaign.createdAt).toLocaleDateString('ja-JP')}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Alerts */}
        <section className="lg:col-span-1">
          <AlertList
            alerts={alerts}
            onAlertClick={handleAlertClick}
            maxItems={5}
          />
        </section>
      </div>

      <AlertModal
        alert={selectedAlert}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onMarkAsRead={markAlertAsRead}
      />
    </div>
  );
}
