'use client';

export type AlertType = 'LIKE' | 'COMMENT' | 'FOLLOW' | 'MENTION' | 'SYSTEM';
export type AlertSeverity = 'info' | 'warning' | 'error' | 'success';

export interface Alert {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
  severity?: AlertSeverity;
}

export interface AlertListProps {
  alerts: Alert[];
  onAlertClick?: (alert: Alert) => void;
  maxItems?: number;
}

const typeIcons: Record<AlertType, string> = {
  LIKE: '❤️',
  COMMENT: '💬',
  FOLLOW: '👤',
  MENTION: '@',
  SYSTEM: '🔔',
};

const severityStyles: Record<AlertSeverity, string> = {
  info: 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10',
  warning: 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/10',
  error: 'border-l-red-500 bg-red-50 dark:bg-red-900/10',
  success: 'border-l-green-500 bg-green-50 dark:bg-green-900/10',
};

export function AlertList({
  alerts,
  onAlertClick,
  maxItems = 5,
}: AlertListProps) {
  const displayedAlerts = alerts.slice(0, maxItems);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '今';
    if (minutes < 60) return `${minutes}分前`;
    if (hours < 24) return `${hours}時間前`;
    if (days < 7) return `${days}日前`;
    return date.toLocaleDateString('ja-JP');
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          アラート
        </h3>
        {alerts.filter((a) => !a.isRead).length > 0 && (
          <span className="px-2 py-1 text-xs font-medium bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full">
            {alerts.filter((a) => !a.isRead).length} 件未読
          </span>
        )}
      </div>

      {displayedAlerts.length === 0 ? (
        <div className="p-6 text-center text-gray-500 dark:text-gray-400">
          アラートはありません
        </div>
      ) : (
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {displayedAlerts.map((alert) => (
            <li
              key={alert.id}
              onClick={() => onAlertClick?.(alert)}
              className={`
                px-6 py-4 cursor-pointer transition-colors
                hover:bg-gray-50 dark:hover:bg-gray-700/50
                ${!alert.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}
                ${alert.severity ? `border-l-4 ${severityStyles[alert.severity]}` : ''}
              `}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl flex-shrink-0">
                  {typeIcons[alert.type]}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`text-sm font-medium truncate ${
                        alert.isRead
                          ? 'text-gray-700 dark:text-gray-300'
                          : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      {alert.title}
                    </p>
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                      {formatDate(alert.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                    {alert.message}
                  </p>
                </div>
                {!alert.isRead && (
                  <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {alerts.length > maxItems && (
        <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 text-center">
          <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
            すべてのアラートを表示 ({alerts.length})
          </button>
        </div>
      )}
    </div>
  );
}
