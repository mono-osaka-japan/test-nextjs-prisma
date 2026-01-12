'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  KPICard,
  Chart,
  AlertList,
  AlertModal,
  type Alert,
  type ChartDataPoint,
} from '@/components/features/dashboard';

interface DashboardData {
  kpis: {
    totalUsers: { value: number; change?: number; trend?: 'up' | 'down' | 'neutral' };
    totalPosts: { value: number; change?: number; trend?: 'up' | 'down' | 'neutral' };
    publishedPosts: { value: number };
    totalComments: { value: number };
    totalLikes: { value: number };
    totalViews: { value: number };
  };
  charts: {
    postsPerDay: ChartDataPoint[];
  };
}

// アイコンコンポーネント
const UsersIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
  </svg>
);

const PostsIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const CommentsIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const LikesIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

const ViewsIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const PublishedIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [dashboardRes, alertsRes] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/dashboard/alerts'),
      ]);

      if (!dashboardRes.ok || !alertsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const dashboardData = await dashboardRes.json();
      const alertsData = await alertsRes.json();

      setData(dashboardData);
      setAlerts(alertsData.alerts);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAlertClick = (alert: Alert) => {
    setSelectedAlert(alert);
    setIsModalOpen(true);
  };

  const handleMarkAsRead = async (alertId: string) => {
    try {
      await fetch('/api/dashboard/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId }),
      });

      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, isRead: true } : a))
      );
    } catch (err) {
      console.error('Failed to mark alert as read:', err);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAlert(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              ダッシュボード
            </h1>
            <button
              onClick={fetchData}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              更新
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Cards */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            サマリー
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <KPICard
              title="総ユーザー数"
              value={data?.kpis.totalUsers.value ?? 0}
              change={data?.kpis.totalUsers.change}
              changeLabel="過去7日間"
              trend={data?.kpis.totalUsers.trend as 'up' | 'down' | 'neutral'}
              icon={<UsersIcon />}
            />
            <KPICard
              title="総投稿数"
              value={data?.kpis.totalPosts.value ?? 0}
              change={data?.kpis.totalPosts.change}
              changeLabel="過去7日間"
              trend={data?.kpis.totalPosts.trend as 'up' | 'down' | 'neutral'}
              icon={<PostsIcon />}
            />
            <KPICard
              title="公開済み投稿"
              value={data?.kpis.publishedPosts.value ?? 0}
              icon={<PublishedIcon />}
            />
            <KPICard
              title="コメント数"
              value={data?.kpis.totalComments.value ?? 0}
              icon={<CommentsIcon />}
            />
            <KPICard
              title="いいね数"
              value={data?.kpis.totalLikes.value ?? 0}
              icon={<LikesIcon />}
            />
            <KPICard
              title="総閲覧数"
              value={data?.kpis.totalViews.value ?? 0}
              icon={<ViewsIcon />}
            />
          </div>
        </section>

        {/* Charts and Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart Section */}
          <section className="lg:col-span-2">
            <Chart
              title="日別投稿数（過去7日間）"
              data={data?.charts.postsPerDay ?? []}
              type="bar"
              height={250}
            />
          </section>

          {/* Alerts Section */}
          <section className="lg:col-span-1">
            <AlertList
              alerts={alerts}
              onAlertClick={handleAlertClick}
              maxItems={5}
            />
          </section>
        </div>
      </main>

      {/* Alert Modal */}
      <AlertModal
        alert={selectedAlert}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onMarkAsRead={handleMarkAsRead}
      />
    </div>
  );
}
