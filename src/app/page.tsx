'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SettingsModal } from '@/components/modals/SettingsModal';
import { ScrapingExecuteModal } from '@/components/modals/ScrapingExecuteModal';
import { ExportModal, ExportColumn } from '@/components/modals/ExportModal';

const sampleColumns: ExportColumn[] = [
  { key: 'id', label: 'ID', selected: true },
  { key: 'title', label: 'タイトル', selected: true },
  { key: 'author', label: '著者', selected: true },
  { key: 'createdAt', label: '作成日', selected: true },
  { key: 'status', label: 'ステータス', selected: false },
  { key: 'category', label: 'カテゴリー', selected: false },
];

const sampleData = [
  { id: 1, title: '記事1', author: '田中太郎', createdAt: '2024-01-15', status: 'published', category: 'tech' },
  { id: 2, title: '記事2', author: '鈴木花子', createdAt: '2024-01-16', status: 'draft', category: 'news' },
  { id: 3, title: '記事3', author: '佐藤次郎', createdAt: '2024-01-17', status: 'published', category: 'tech' },
];

export default function Home() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isScrapingOpen, setIsScrapingOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-8 py-32 px-16 bg-white dark:bg-black">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Phase 11: 設定・その他モーダル
        </h1>

        <div className="flex flex-col gap-4 w-full max-w-md">
          {/* Settings Modal */}
          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              設定モーダル
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              一般設定、通知、セキュリティ、スクレイピング設定を変更できます。
            </p>
            <Button onClick={() => setIsSettingsOpen(true)}>
              設定を開く
            </Button>
          </div>

          {/* Scraping Execute Modal */}
          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              スクレイピング実行モーダル
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              スクレイピングの実行状況を確認し、進捗を表示します。
            </p>
            <Button onClick={() => setIsScrapingOpen(true)}>
              スクレイピング実行
            </Button>
          </div>

          {/* Export Modal */}
          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              エクスポートモーダル
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              データをCSV、JSON、Excelなどの形式でエクスポートします。
            </p>
            <Button onClick={() => setIsExportOpen(true)}>
              データをエクスポート
            </Button>
          </div>
        </div>

        {/* Modals */}
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onSave={async (settings) => {
            console.log('Settings saved:', settings);
            await new Promise((resolve) => setTimeout(resolve, 500));
          }}
        />

        <ScrapingExecuteModal
          isOpen={isScrapingOpen}
          onClose={() => setIsScrapingOpen(false)}
          config={{
            urls: [
              'https://example.com/page1',
              'https://example.com/page2',
              'https://example.com/page3',
              'https://example.com/page4',
              'https://example.com/page5',
            ],
          }}
        />

        <ExportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          availableColumns={sampleColumns}
          data={sampleData}
          filename="exported-data"
        />
      </main>
    </div>
  );
}
