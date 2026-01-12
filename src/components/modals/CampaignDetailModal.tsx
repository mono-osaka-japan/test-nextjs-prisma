"use client";

import { useEffect, useState, useCallback } from "react";
import { Modal, Button, Badge, Input, Select, Textarea } from "@/components/ui";
import type { Campaign, CampaignInput, CampaignStatus, CampaignPriority } from "@/types/campaign";
import {
  CampaignStatusLabel,
  CampaignPriorityLabel,
  AuthTypeLabel,
} from "@/types/campaign";

interface CampaignDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId: string | null;
  onUpdate?: (campaign: Campaign) => void;
  onDelete?: (id: string) => void;
}

export function CampaignDetailModal({
  isOpen,
  onClose,
  campaignId,
  onUpdate,
  onDelete,
}: CampaignDetailModalProps) {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 編集フォームの状態
  const [formData, setFormData] = useState<Partial<CampaignInput>>({});

  const fetchCampaign = useCallback(async () => {
    if (!campaignId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/campaigns/${campaignId}`);
      if (!response.ok) {
        throw new Error("案件の取得に失敗しました");
      }
      const data = await response.json();
      setCampaign(data);
      setFormData({
        name: data.name,
        description: data.description || "",
        status: data.status,
        priority: data.priority,
        startDate: data.startDate?.split("T")[0] || "",
        endDate: data.endDate?.split("T")[0] || "",
        budget: data.budget || undefined,
        targetUrl: data.targetUrl || "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    if (isOpen && campaignId) {
      fetchCampaign();
      setIsEditing(false);
    }
  }, [isOpen, campaignId, fetchCampaign]);

  const handleSave = async () => {
    if (!campaignId) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "更新に失敗しました");
      }

      const updatedCampaign = await response.json();
      setCampaign(updatedCampaign);
      setIsEditing(false);
      onUpdate?.(updatedCampaign);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!campaignId) return;

    if (!confirm("この案件を削除してもよろしいですか？")) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("削除に失敗しました");
      }

      onDelete?.(campaignId);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsDeleting(false);
    }
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

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return "-";
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
    }).format(amount);
  };

  const renderViewMode = () => {
    if (!campaign) return null;

    return (
      <div className="space-y-6">
        {/* 基本情報 */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge variant={getStatusBadgeVariant(campaign.status as CampaignStatus)}>
              {CampaignStatusLabel[campaign.status as CampaignStatus]}
            </Badge>
            <Badge variant={getPriorityBadgeVariant(campaign.priority as CampaignPriority)}>
              {CampaignPriorityLabel[campaign.priority as CampaignPriority]}
            </Badge>
          </div>

          {campaign.description && (
            <p className="text-gray-600 dark:text-gray-400">{campaign.description}</p>
          )}
        </div>

        {/* 詳細情報 */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">開始日</span>
            <p className="font-medium">{formatDate(campaign.startDate)}</p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">終了日</span>
            <p className="font-medium">{formatDate(campaign.endDate)}</p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">予算</span>
            <p className="font-medium">{formatCurrency(campaign.budget)}</p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">担当者</span>
            <p className="font-medium">{campaign.owner?.name || campaign.owner?.email || "-"}</p>
          </div>
        </div>

        {/* URL・認証情報 */}
        {campaign.targetUrl && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              ターゲットURL
            </h4>
            <a
              href={campaign.targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline break-all"
            >
              {campaign.targetUrl}
            </a>
            {campaign.authType && (
              <p className="mt-2 text-sm text-gray-500">
                認証: {AuthTypeLabel[campaign.authType as keyof typeof AuthTypeLabel]}
              </p>
            )}
          </div>
        )}

        {/* タスク一覧 */}
        {campaign.tasks && campaign.tasks.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              タスク ({campaign.tasks.length})
            </h4>
            <ul className="space-y-2">
              {campaign.tasks.map((task) => (
                <li
                  key={task.id}
                  className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded"
                >
                  <span>{task.title}</span>
                  <Badge size="sm">{task.status}</Badge>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* メタ情報 */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 text-xs text-gray-500">
          <p>作成日: {formatDate(campaign.createdAt)}</p>
          <p>更新日: {formatDate(campaign.updatedAt)}</p>
        </div>
      </div>
    );
  };

  const renderEditMode = () => (
    <div className="space-y-4">
      <Input
        label="案件名"
        value={formData.name || ""}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />

      <Textarea
        label="説明"
        value={formData.description || ""}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        rows={3}
      />

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="ステータス"
          value={formData.status || "DRAFT"}
          onChange={(e) => setFormData({ ...formData, status: e.target.value as CampaignStatus })}
          options={Object.entries(CampaignStatusLabel).map(([value, label]) => ({
            value,
            label,
          }))}
        />

        <Select
          label="優先度"
          value={formData.priority || "MEDIUM"}
          onChange={(e) => setFormData({ ...formData, priority: e.target.value as CampaignPriority })}
          options={Object.entries(CampaignPriorityLabel).map(([value, label]) => ({
            value,
            label,
          }))}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="開始日"
          type="date"
          value={formData.startDate || ""}
          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
        />

        <Input
          label="終了日"
          type="date"
          value={formData.endDate || ""}
          onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
        />
      </div>

      <Input
        label="予算"
        type="number"
        value={formData.budget || ""}
        onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) || undefined })}
        placeholder="0"
      />

      <Input
        label="ターゲットURL"
        type="url"
        value={formData.targetUrl || ""}
        onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
        placeholder="https://example.com"
      />
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "案件を編集" : campaign?.name || "案件詳細"}
      size="lg"
      footer={
        <>
          {isEditing ? (
            <>
              <Button variant="ghost" onClick={() => setIsEditing(false)} disabled={isSaving}>
                キャンセル
              </Button>
              <Button onClick={handleSave} loading={isSaving}>
                保存
              </Button>
            </>
          ) : (
            <>
              <Button variant="danger" onClick={handleDelete} loading={isDeleting}>
                削除
              </Button>
              <Button variant="secondary" onClick={() => setIsEditing(true)}>
                編集
              </Button>
              <Button variant="ghost" onClick={onClose}>
                閉じる
              </Button>
            </>
          )}
        </>
      }
    >
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : isEditing ? (
        renderEditMode()
      ) : (
        renderViewMode()
      )}
    </Modal>
  );
}
