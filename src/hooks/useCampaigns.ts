"use client";

import { useState, useCallback, useEffect } from "react";
import type {
  Campaign,
  CampaignInput,
  CampaignFilters,
  CampaignSort,
  Pagination,
  CampaignListResponse,
} from "@/types/campaign";

interface UseCampaignsOptions {
  initialFilters?: CampaignFilters;
  initialSort?: CampaignSort;
  initialLimit?: number;
  autoFetch?: boolean;
}

interface UseCampaignsReturn {
  // データ
  campaigns: Campaign[];
  pagination: Pagination;
  selectedCampaign: Campaign | null;

  // 状態
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;

  // フィルター・ソート
  filters: CampaignFilters;
  sort: CampaignSort;
  setFilters: (filters: CampaignFilters) => void;
  setSort: (sort: CampaignSort) => void;

  // CRUD操作
  fetchCampaigns: (page?: number) => Promise<void>;
  fetchCampaign: (id: string) => Promise<Campaign | null>;
  createCampaign: (input: CampaignInput) => Promise<Campaign | null>;
  updateCampaign: (id: string, input: Partial<CampaignInput>) => Promise<Campaign | null>;
  deleteCampaign: (id: string) => Promise<boolean>;

  // 選択
  selectCampaign: (campaign: Campaign | null) => void;

  // ユーティリティ
  clearError: () => void;
  refresh: () => Promise<void>;
}

export function useCampaigns(options: UseCampaignsOptions = {}): UseCampaignsReturn {
  const {
    initialFilters = {},
    initialSort = { field: "createdAt", direction: "desc" },
    initialLimit = 10,
    autoFetch = true,
  } = options;

  // 状態
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: initialLimit,
    total: 0,
    totalPages: 0,
  });
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<CampaignFilters>(initialFilters);
  const [sort, setSort] = useState<CampaignSort>(initialSort);

  // API呼び出しヘルパー
  const apiCall = useCallback(
    async <T>(
      url: string,
      options?: RequestInit
    ): Promise<{ data: T | null; error: string | null }> => {
      try {
        const response = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
          },
          ...options,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          return {
            data: null,
            error: errorData.message || `HTTP error ${response.status}`,
          };
        }

        const data = await response.json();
        return { data, error: null };
      } catch (err) {
        return {
          data: null,
          error: err instanceof Error ? err.message : "An error occurred",
        };
      }
    },
    []
  );

  // 一覧取得
  const fetchCampaigns = useCallback(
    async (page = 1) => {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: String(page),
        limit: String(pagination.limit),
        sortField: sort.field,
        sortDirection: sort.direction,
      });

      if (filters.status) params.set("status", filters.status);
      if (filters.priority) params.set("priority", filters.priority);
      if (filters.search) params.set("search", filters.search);
      if (filters.startDateFrom) params.set("startDateFrom", filters.startDateFrom);
      if (filters.startDateTo) params.set("startDateTo", filters.startDateTo);

      const { data, error: apiError } = await apiCall<CampaignListResponse>(
        `/api/campaigns?${params.toString()}`
      );

      if (apiError) {
        setError(apiError);
      } else if (data) {
        setCampaigns(data.campaigns);
        setPagination(data.pagination);
      }

      setIsLoading(false);
    },
    [apiCall, filters, sort, pagination.limit]
  );

  // 単一取得
  const fetchCampaign = useCallback(
    async (id: string): Promise<Campaign | null> => {
      setIsLoading(true);
      setError(null);

      const { data, error: apiError } = await apiCall<Campaign>(`/api/campaigns/${id}`);

      setIsLoading(false);

      if (apiError) {
        setError(apiError);
        return null;
      }

      return data;
    },
    [apiCall]
  );

  // 作成
  const createCampaign = useCallback(
    async (input: CampaignInput): Promise<Campaign | null> => {
      setIsCreating(true);
      setError(null);

      const { data, error: apiError } = await apiCall<Campaign>("/api/campaigns", {
        method: "POST",
        body: JSON.stringify(input),
      });

      setIsCreating(false);

      if (apiError) {
        setError(apiError);
        return null;
      }

      if (data) {
        setCampaigns((prev) => [data, ...prev]);
        setPagination((prev) => ({ ...prev, total: prev.total + 1 }));
      }

      return data;
    },
    [apiCall]
  );

  // 更新
  const updateCampaign = useCallback(
    async (id: string, input: Partial<CampaignInput>): Promise<Campaign | null> => {
      setIsUpdating(true);
      setError(null);

      const { data, error: apiError } = await apiCall<Campaign>(`/api/campaigns/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      });

      setIsUpdating(false);

      if (apiError) {
        setError(apiError);
        return null;
      }

      if (data) {
        setCampaigns((prev) =>
          prev.map((campaign) => (campaign.id === id ? data : campaign))
        );
        if (selectedCampaign?.id === id) {
          setSelectedCampaign(data);
        }
      }

      return data;
    },
    [apiCall, selectedCampaign?.id]
  );

  // 削除
  const deleteCampaign = useCallback(
    async (id: string): Promise<boolean> => {
      setIsDeleting(true);
      setError(null);

      const { error: apiError } = await apiCall<void>(`/api/campaigns/${id}`, {
        method: "DELETE",
      });

      setIsDeleting(false);

      if (apiError) {
        setError(apiError);
        return false;
      }

      setCampaigns((prev) => prev.filter((campaign) => campaign.id !== id));
      setPagination((prev) => ({ ...prev, total: prev.total - 1 }));

      if (selectedCampaign?.id === id) {
        setSelectedCampaign(null);
      }

      return true;
    },
    [apiCall, selectedCampaign?.id]
  );

  // 選択
  const selectCampaign = useCallback((campaign: Campaign | null) => {
    setSelectedCampaign(campaign);
  }, []);

  // エラークリア
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // リフレッシュ
  const refresh = useCallback(async () => {
    await fetchCampaigns(pagination.page);
  }, [fetchCampaigns, pagination.page]);

  // 初回読み込み
  useEffect(() => {
    if (autoFetch) {
      fetchCampaigns(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // フィルター・ソート変更時の再取得
  useEffect(() => {
    if (autoFetch) {
      fetchCampaigns(1);
    }
  }, [filters, sort, autoFetch, fetchCampaigns]);

  return {
    campaigns,
    pagination,
    selectedCampaign,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    error,
    filters,
    sort,
    setFilters,
    setSort,
    fetchCampaigns,
    fetchCampaign,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    selectCampaign,
    clearError,
    refresh,
  };
}
