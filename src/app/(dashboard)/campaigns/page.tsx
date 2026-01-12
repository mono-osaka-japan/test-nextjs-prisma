'use client';

import { CampaignList } from '@/components/features/campaigns';

export default function CampaignsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">案件管理</h1>
      </div>
      <CampaignList />
    </div>
  );
}
