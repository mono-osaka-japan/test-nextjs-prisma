"use client";

import { useState } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
  Badge,
  Button,
  Pagination,
} from "@/components/ui";
import { CampaignDetailModal, CampaignCreateModal, UrlAnalyzerModal } from "@/components/modals";
import { CampaignFilters } from "./CampaignFilters";
import { useCampaigns } from "@/hooks/useCampaigns";
import type { Campaign, CampaignStatus, CampaignPriority, CampaignSort } from "@/types/campaign";
import { CampaignStatusLabel, CampaignPriorityLabel } from "@/types/campaign";

export function CampaignList() {
  const {
    campaigns,
    pagination,
    isLoading,
    error,
    filters,
    sort,
    setFilters,
    setSort,
    fetchCampaigns,
    refresh,
  } = useCampaigns();

  // モーダル状態
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isUrlAnalyzerOpen, setIsUrlAnalyzerOpen] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

  const handleSort = (field: CampaignSort["field"]) => {
    if (sort.field === field) {
      setSort({ field, direction: sort.direction === "asc" ? "desc" : "asc" });
    } else {
      setSort({ field, direction: "desc" });
    }
  };

  const handleRowClick = (campaign: Campaign) => {
    setSelectedCampaignId(campaign.id);
    setIsDetailModalOpen(true);
  };

  const handleCreateSuccess = () => {
    refresh();
    setIsCreateModalOpen(false);
  };

  const handleUpdateSuccess = () => {
    refresh();
  };

  const handleDeleteSuccess = () => {
    refresh();
    setIsDetailModalOpen(false);
  };

  const getStatusBadgeVariant = (status: CampaignStatus) => {
    const variants: Record<CampaignStatus, "default" | "success" | "warning" | "danger" | "info"> = {
      DRAFT: "default",
      ACTIVE: "success",
      PAUSED: "warning",
      COMPLETED: "info",
      CANCELLED: "danger",
    };
    return variants[status] || "default";
  };

  const getPriorityBadgeVariant = (priority: CampaignPriority) => {
    const variants: Record<CampaignPriority, "default" | "success" | "warning" | "danger" | "info"> = {
      LOW: "default",
      MEDIUM: "info",
      HIGH: "warning",
      URGENT: "danger",
    };
    return variants[priority] || "default";
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("ja-JP");
  };

  const getSortState = (field: CampaignSort["field"]) => {
    if (sort.field !== field) return false;
    return sort.direction;
  };

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">案件一覧</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>新規作成</Button>
      </div>

      {/* フィルター */}
      <CampaignFilters filters={filters} onFiltersChange={setFilters} />

      {/* エラー表示 */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
          {error}
          <Button variant="ghost" size="sm" onClick={refresh} className="ml-2">
            再試行
          </Button>
        </div>
      )}

      {/* テーブル */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow hoverable={false}>
              <TableHead
                sortable
                sorted={getSortState("name")}
                onSort={() => handleSort("name")}
              >
                案件名
              </TableHead>
              <TableHead
                sortable
                sorted={getSortState("status")}
                onSort={() => handleSort("status")}
              >
                ステータス
              </TableHead>
              <TableHead
                sortable
                sorted={getSortState("priority")}
                onSort={() => handleSort("priority")}
              >
                優先度
              </TableHead>
              <TableHead
                sortable
                sorted={getSortState("startDate")}
                onSort={() => handleSort("startDate")}
              >
                開始日
              </TableHead>
              <TableHead
                sortable
                sorted={getSortState("endDate")}
                onSort={() => handleSort("endDate")}
              >
                終了日
              </TableHead>
              <TableHead>タスク</TableHead>
              <TableHead
                sortable
                sorted={getSortState("createdAt")}
                onSort={() => handleSort("createdAt")}
              >
                作成日
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow hoverable={false}>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                    <span className="ml-2 text-gray-500">読み込み中...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : campaigns.length === 0 ? (
              <TableEmpty colSpan={7} message="案件がありません" />
            ) : (
              campaigns.map((campaign) => (
                <TableRow
                  key={campaign.id}
                  onClick={() => handleRowClick(campaign)}
                  className="cursor-pointer"
                >
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(campaign.status as CampaignStatus)} size="sm">
                      {CampaignStatusLabel[campaign.status as CampaignStatus]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getPriorityBadgeVariant(campaign.priority as CampaignPriority)} size="sm">
                      {CampaignPriorityLabel[campaign.priority as CampaignPriority]}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(campaign.startDate)}</TableCell>
                  <TableCell>{formatDate(campaign.endDate)}</TableCell>
                  <TableCell>
                    {campaign._count?.tasks ?? 0}
                  </TableCell>
                  <TableCell className="text-gray-500 dark:text-gray-400">
                    {formatDate(campaign.createdAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ページネーション */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {pagination.total}件中 {(pagination.page - 1) * pagination.limit + 1} -{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)}件を表示
          </p>
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={fetchCampaigns}
          />
        </div>
      )}

      {/* モーダル */}
      <CampaignCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateSuccess}
        onOpenUrlAnalyzer={() => {
          setIsCreateModalOpen(false);
          setIsUrlAnalyzerOpen(true);
        }}
      />

      <CampaignDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedCampaignId(null);
        }}
        campaignId={selectedCampaignId}
        onUpdate={handleUpdateSuccess}
        onDelete={handleDeleteSuccess}
      />

      <UrlAnalyzerModal
        isOpen={isUrlAnalyzerOpen}
        onClose={() => setIsUrlAnalyzerOpen(false)}
        onApply={(result) => {
          // URL解析結果を適用して作成モーダルを再度開く
          setIsUrlAnalyzerOpen(false);
          setIsCreateModalOpen(true);
          // 実際のアプリでは、ここでフォームに値を設定する
          console.log("URL analysis result:", result);
        }}
      />
    </div>
  );
}
