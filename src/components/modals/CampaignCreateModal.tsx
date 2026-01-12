"use client";

import { useState } from "react";
import { Modal, Button, Input, Select, Textarea } from "@/components/ui";
import type { Campaign, CampaignInput, CampaignStatus, CampaignPriority } from "@/types/campaign";
import { CampaignStatusLabel, CampaignPriorityLabel } from "@/types/campaign";

interface CampaignCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate?: (campaign: Campaign) => void;
  onOpenUrlAnalyzer?: () => void;
}

const initialFormData: CampaignInput = {
  name: "",
  description: "",
  status: "DRAFT",
  priority: "MEDIUM",
  startDate: "",
  endDate: "",
  budget: undefined,
  targetUrl: "",
};

export function CampaignCreateModal({
  isOpen,
  onClose,
  onCreate,
  onOpenUrlAnalyzer,
}: CampaignCreateModalProps) {
  const [formData, setFormData] = useState<CampaignInput>(initialFormData);
  const [isCreating, setIsCreating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "案件名は必須です";
    }

    if (formData.startDate && formData.endDate) {
      if (new Date(formData.startDate) > new Date(formData.endDate)) {
        newErrors.endDate = "終了日は開始日以降を指定してください";
      }
    }

    if (formData.budget !== undefined && formData.budget < 0) {
      newErrors.budget = "予算は0以上を指定してください";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsCreating(true);
    setApiError(null);

    try {
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          budget: formData.budget || null,
          startDate: formData.startDate || null,
          endDate: formData.endDate || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "作成に失敗しました");
      }

      const newCampaign = await response.json();
      onCreate?.(newCampaign);
      handleClose();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setFormData(initialFormData);
    setErrors({});
    setApiError(null);
    onClose();
  };

  const updateField = <K extends keyof CampaignInput>(
    field: K,
    value: CampaignInput[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // エラーをクリア
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="新規案件作成"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose} disabled={isCreating}>
            キャンセル
          </Button>
          <Button onClick={handleSubmit} loading={isCreating}>
            作成
          </Button>
        </>
      }
    >
      {apiError && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
          {apiError}
        </div>
      )}

      <div className="space-y-4">
        <Input
          label="案件名"
          value={formData.name}
          onChange={(e) => updateField("name", e.target.value)}
          error={errors.name}
          required
          placeholder="新規プロジェクト"
        />

        <Textarea
          label="説明"
          value={formData.description || ""}
          onChange={(e) => updateField("description", e.target.value)}
          rows={3}
          placeholder="案件の説明を入力..."
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="ステータス"
            value={formData.status || "DRAFT"}
            onChange={(e) => updateField("status", e.target.value as CampaignStatus)}
            options={Object.entries(CampaignStatusLabel).map(([value, label]) => ({
              value,
              label,
            }))}
          />

          <Select
            label="優先度"
            value={formData.priority || "MEDIUM"}
            onChange={(e) => updateField("priority", e.target.value as CampaignPriority)}
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
            onChange={(e) => updateField("startDate", e.target.value)}
          />

          <Input
            label="終了日"
            type="date"
            value={formData.endDate || ""}
            onChange={(e) => updateField("endDate", e.target.value)}
            error={errors.endDate}
          />
        </div>

        <Input
          label="予算"
          type="number"
          value={formData.budget ?? ""}
          onChange={(e) =>
            updateField("budget", e.target.value ? parseFloat(e.target.value) : undefined)
          }
          error={errors.budget}
          placeholder="0"
          min={0}
        />

        <div className="space-y-2">
          <Input
            label="ターゲットURL"
            type="url"
            value={formData.targetUrl || ""}
            onChange={(e) => updateField("targetUrl", e.target.value)}
            placeholder="https://example.com"
          />
          {onOpenUrlAnalyzer && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenUrlAnalyzer}
              type="button"
            >
              URLから認証情報を解析
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
