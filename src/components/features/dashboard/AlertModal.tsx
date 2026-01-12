'use client';

import { useEffect, useCallback } from 'react';
import type { Alert, AlertType } from './AlertList';

export interface AlertModalProps {
  alert: Alert | null;
  isOpen: boolean;
  onClose: () => void;
  onMarkAsRead?: (alertId: string) => void;
}

const typeLabels: Record<AlertType, string> = {
  LIKE: 'いいね',
  COMMENT: 'コメント',
  FOLLOW: 'フォロー',
  MENTION: 'メンション',
  SYSTEM: 'システム',
};

const typeColors: Record<AlertType, string> = {
  LIKE: 'bg-pink-100 text-pink-700 dark:bg-pink-900/20 dark:text-pink-400',
  COMMENT: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  FOLLOW: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
  MENTION: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
  SYSTEM: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

export function AlertModal({
  alert,
  isOpen,
  onClose,
  onMarkAsRead,
}: AlertModalProps) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';

      if (alert && !alert.isRead && onMarkAsRead) {
        onMarkAsRead(alert.id);
      }
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleEscape, alert, onMarkAsRead]);

  if (!isOpen || !alert) return null;

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-xl shadow-2xl transform transition-all">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${typeColors[alert.type]}`}
            >
              {typeLabels[alert.type]}
            </span>
            <h2
              id="modal-title"
              className="text-lg font-semibold text-gray-900 dark:text-white"
            >
              アラート詳細
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="閉じる"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {alert.title}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4 whitespace-pre-wrap">
            {alert.message}
          </p>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {formatDateTime(alert.createdAt)}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          {alert.link && (
            <a
              href={alert.link}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              詳細を見る
            </a>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
