"use client";

import { Input, Select, Button } from "@/components/ui";
import type { CampaignFilters as FilterType, CampaignStatus, CampaignPriority } from "@/types/campaign";
import { CampaignStatusLabel, CampaignPriorityLabel } from "@/types/campaign";

interface CampaignFiltersProps {
  filters: FilterType;
  onFiltersChange: (filters: FilterType) => void;
}

export function CampaignFilters({ filters, onFiltersChange }: CampaignFiltersProps) {
  const updateFilter = <K extends keyof FilterType>(key: K, value: FilterType[K]) => {
    onFiltersChange({ ...filters, [key]: value || undefined });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== undefined && v !== "");

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Input
          placeholder="検索..."
          value={filters.search || ""}
          onChange={(e) => updateFilter("search", e.target.value)}
        />

        <Select
          value={filters.status || ""}
          onChange={(e) => updateFilter("status", e.target.value as CampaignStatus)}
          options={[
            { value: "", label: "すべてのステータス" },
            ...Object.entries(CampaignStatusLabel).map(([value, label]) => ({
              value,
              label,
            })),
          ]}
        />

        <Select
          value={filters.priority || ""}
          onChange={(e) => updateFilter("priority", e.target.value as CampaignPriority)}
          options={[
            { value: "", label: "すべての優先度" },
            ...Object.entries(CampaignPriorityLabel).map(([value, label]) => ({
              value,
              label,
            })),
          ]}
        />

        <Input
          type="date"
          placeholder="開始日（から）"
          value={filters.startDateFrom || ""}
          onChange={(e) => updateFilter("startDateFrom", e.target.value)}
        />

        <Input
          type="date"
          placeholder="開始日（まで）"
          value={filters.startDateTo || ""}
          onChange={(e) => updateFilter("startDateTo", e.target.value)}
        />
      </div>

      {hasActiveFilters && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            フィルターをクリア
          </Button>
        </div>
      )}
    </div>
  );
}
