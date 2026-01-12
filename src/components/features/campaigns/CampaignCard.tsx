"use client";

import { Badge } from "@/components/ui";
import type { Campaign, CampaignStatus, CampaignPriority } from "@/types/campaign";
import { CampaignStatusLabel, CampaignPriorityLabel } from "@/types/campaign";

interface CampaignCardProps {
  campaign: Campaign;
  onClick?: () => void;
}

export function CampaignCard({ campaign, onClick }: CampaignCardProps) {
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
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString("ja-JP");
  };

  return (
    <div
      className={`
        p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg
        transition-shadow hover:shadow-md
        ${onClick ? "cursor-pointer" : ""}
      `}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">
          {campaign.name}
        </h3>
        <Badge variant={getPriorityBadgeVariant(campaign.priority as CampaignPriority)} size="sm">
          {CampaignPriorityLabel[campaign.priority as CampaignPriority]}
        </Badge>
      </div>

      {campaign.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
          {campaign.description}
        </p>
      )}

      <div className="flex items-center justify-between">
        <Badge variant={getStatusBadgeVariant(campaign.status as CampaignStatus)} size="sm">
          {CampaignStatusLabel[campaign.status as CampaignStatus]}
        </Badge>

        <div className="text-xs text-gray-500 dark:text-gray-400">
          {campaign.startDate && campaign.endDate ? (
            <span>
              {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
            </span>
          ) : campaign.startDate ? (
            <span>{formatDate(campaign.startDate)} ~</span>
          ) : null}
        </div>
      </div>

      {campaign._count?.tasks !== undefined && campaign._count.tasks > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            タスク: {campaign._count.tasks}件
          </span>
        </div>
      )}
    </div>
  );
}
