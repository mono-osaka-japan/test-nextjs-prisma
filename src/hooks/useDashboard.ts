'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Alert } from '@/components/features/dashboard';

export interface DashboardSummary {
  campaigns: {
    total: number;
    active: number;
    byStatus: Record<string, number>;
  };
  patterns: {
    total: number;
    active: number;
    byType: Record<string, number>;
  };
  systemGroups: {
    total: number;
    active: number;
  };
}

export interface RecentItem {
  id: string;
  name: string;
  createdAt: string;
  [key: string]: unknown;
}

export interface DashboardData {
  summary: DashboardSummary;
  recent: {
    campaigns: RecentItem[];
    patterns: RecentItem[];
  };
}

export interface UseDashboardReturn {
  data: DashboardData | null;
  alerts: Alert[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  markAlertAsRead: (alertId: string) => Promise<void>;
}

function isValidDashboardData(data: unknown): data is DashboardData {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return (
    d.summary !== undefined &&
    d.recent !== undefined &&
    typeof d.summary === 'object' &&
    typeof d.recent === 'object'
  );
}

export function useDashboard(): UseDashboardReturn {
  const [data, setData] = useState<DashboardData | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    // 前回のリクエストをキャンセル
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      setIsLoading(true);
      setError(null);

      const [dashboardRes, alertsRes] = await Promise.all([
        fetch('/api/dashboard', { signal }),
        fetch('/api/dashboard/alerts', { signal }),
      ]);

      if (!dashboardRes.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const dashboardData = await dashboardRes.json();

      // レスポンスの検証
      if (!isValidDashboardData(dashboardData)) {
        throw new Error('Invalid dashboard data format');
      }

      setData(dashboardData);

      // アラート取得の処理
      if (alertsRes.ok) {
        const alertsData = await alertsRes.json();
        setAlerts(alertsData.alerts || []);
      } else {
        // アラート取得失敗時はクリア
        setAlerts([]);
        console.warn('Failed to fetch alerts:', alertsRes.status);
      }
    } catch (err) {
      // AbortErrorは無視
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markAlertAsRead = useCallback(async (alertId: string) => {
    try {
      const res = await fetch('/api/dashboard/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId }),
      });

      if (res.ok) {
        setAlerts((prev) =>
          prev.map((a) => (a.id === alertId ? { ...a, isRead: true } : a))
        );
      }
    } catch (err) {
      console.error('Failed to mark alert as read:', err);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // クリーンアップ: アンマウント時にリクエストをキャンセル
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  return {
    data,
    alerts,
    isLoading,
    error,
    refetch: fetchData,
    markAlertAsRead,
  };
}
