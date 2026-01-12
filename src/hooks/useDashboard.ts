'use client';

import { useState, useEffect, useCallback } from 'react';
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

export function useDashboard(): UseDashboardReturn {
  const [data, setData] = useState<DashboardData | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [dashboardRes, alertsRes] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/dashboard/alerts'),
      ]);

      if (!dashboardRes.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const dashboardData = await dashboardRes.json();
      setData(dashboardData);

      if (alertsRes.ok) {
        const alertsData = await alertsRes.json();
        setAlerts(alertsData.alerts || []);
      }
    } catch (err) {
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
