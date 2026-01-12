'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/button';
import { GeneralSettings } from '../features/settings/GeneralSettings';
import { NotificationSettings } from '../features/settings/NotificationSettings';
import { SecuritySettings } from '../features/settings/SecuritySettings';
import { ScrapingSettings } from '../features/settings/ScrapingSettings';

export interface Settings {
  general: {
    language: string;
    timezone: string;
    theme: 'light' | 'dark' | 'system';
  };
  notifications: {
    email: boolean;
    push: boolean;
    digest: 'none' | 'daily' | 'weekly';
  };
  security: {
    twoFactorEnabled: boolean;
    sessionTimeout: number;
  };
  scraping: {
    maxConcurrency: number;
    requestDelay: number;
    retryAttempts: number;
    timeout: number;
  };
}

const defaultSettings: Settings = {
  general: {
    language: 'ja',
    timezone: 'Asia/Tokyo',
    theme: 'system',
  },
  notifications: {
    email: true,
    push: true,
    digest: 'daily',
  },
  security: {
    twoFactorEnabled: false,
    sessionTimeout: 30,
  },
  scraping: {
    maxConcurrency: 3,
    requestDelay: 1000,
    retryAttempts: 3,
    timeout: 30000,
  },
};

type TabKey = 'general' | 'notifications' | 'security' | 'scraping';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'general', label: '一般' },
  { key: 'notifications', label: '通知' },
  { key: 'security', label: 'セキュリティ' },
  { key: 'scraping', label: 'スクレイピング' },
];

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSettings?: Settings;
  onSave?: (settings: Settings) => Promise<void>;
}

export function SettingsModal({
  isOpen,
  onClose,
  initialSettings = defaultSettings,
  onSave,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('general');
  const [settings, setSettings] = useState<Settings>(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const prevIsOpenRef = useRef(isOpen);

  // Sync settings only when modal opens (isOpen transitions from false to true)
  useEffect(() => {
    const wasOpen = prevIsOpenRef.current;
    prevIsOpenRef.current = isOpen;

    // Only reset when modal opens (false -> true transition)
    if (isOpen && !wasOpen) {
      setSettings(initialSettings);
      setHasChanges(false);
      setActiveTab('general');
    }
  }, [isOpen, initialSettings]);

  const updateSettings = useCallback(
    <K extends keyof Settings>(
      category: K,
      updates: Partial<Settings[K]>
    ) => {
      setSettings((prev) => ({
        ...prev,
        [category]: { ...prev[category], ...updates },
      }));
      setHasChanges(true);
    },
    []
  );

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (onSave) {
        await onSave(settings);
      }
      setHasChanges(false);
      onClose();
    } catch (error) {
      console.error('設定の保存に失敗しました:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      setShowConfirmDialog(true);
    } else {
      onClose();
    }
  };

  const handleConfirmClose = () => {
    setShowConfirmDialog(false);
    setSettings(initialSettings);
    setHasChanges(false);
    onClose();
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <GeneralSettings
            settings={settings.general}
            onChange={(updates) => updateSettings('general', updates)}
          />
        );
      case 'notifications':
        return (
          <NotificationSettings
            settings={settings.notifications}
            onChange={(updates) => updateSettings('notifications', updates)}
          />
        );
      case 'security':
        return (
          <SecuritySettings
            settings={settings.security}
            onChange={(updates) => updateSettings('security', updates)}
          />
        );
      case 'scraping':
        return (
          <ScrapingSettings
            settings={settings.scraping}
            onChange={(updates) => updateSettings('scraping', updates)}
          />
        );
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} title="設定" size="lg">
        <div className="flex min-h-[400px]">
          {/* Sidebar */}
          <div className="w-40 border-r border-zinc-200 pr-4 dark:border-zinc-700">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`w-full rounded-md px-3 py-2 text-left text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 pl-6">{renderTabContent()}</div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-700">
          <Button variant="secondary" onClick={handleClose}>
            キャンセル
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            isLoading={isSaving}
            disabled={!hasChanges}
          >
            保存
          </Button>
        </div>
      </Modal>

      {/* Confirm Dialog */}
      <Modal
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        title="変更を破棄しますか？"
        size="sm"
      >
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          保存されていない変更があります。このまま閉じると変更は失われます。
        </p>
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowConfirmDialog(false)}>
            戻る
          </Button>
          <Button variant="danger" onClick={handleConfirmClose}>
            破棄して閉じる
          </Button>
        </div>
      </Modal>
    </>
  );
}
