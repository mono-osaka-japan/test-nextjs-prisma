/**
 * @file Slack通知サービス
 * @description Slackに通知を送信するサービス
 */

// ============================================
// Types
// ============================================

export interface SlackConfig {
  /** Slack Webhook URL */
  webhookUrl: string;
  /** デフォルトのチャンネル名（オプション） */
  defaultChannel?: string;
  /** ボット名（オプション） */
  username?: string;
  /** アイコンEmoji（オプション） */
  iconEmoji?: string;
  /** アイコンURL（オプション） */
  iconUrl?: string;
}

export interface SlackAttachment {
  color?: string;
  pretext?: string;
  author_name?: string;
  author_link?: string;
  author_icon?: string;
  title?: string;
  title_link?: string;
  text?: string;
  fields?: Array<{
    title: string;
    value: string;
    short?: boolean;
  }>;
  image_url?: string;
  thumb_url?: string;
  footer?: string;
  footer_icon?: string;
  ts?: number;
}

export interface SlackBlock {
  type: string;
  text?: {
    type: string;
    text: string;
    emoji?: boolean;
  };
  elements?: Array<{
    type: string;
    text?: { type: string; text: string };
    url?: string;
    action_id?: string;
    value?: string;
  }>;
  accessory?: object;
  fields?: Array<{
    type: string;
    text: string;
  }>;
}

export interface SlackMessage {
  text: string;
  channel?: string;
  username?: string;
  icon_emoji?: string;
  icon_url?: string;
  attachments?: SlackAttachment[];
  blocks?: SlackBlock[];
  unfurl_links?: boolean;
  unfurl_media?: boolean;
}

export interface SlackSendResult {
  success: boolean;
  error?: string;
}

export type NotificationType = 'success' | 'warning' | 'error' | 'info';

// ============================================
// Constants
// ============================================

const NOTIFICATION_COLORS: Record<NotificationType, string> = {
  success: '#36a64f',
  warning: '#ffcc00',
  error: '#ff0000',
  info: '#3498db',
};

const NOTIFICATION_EMOJIS: Record<NotificationType, string> = {
  success: ':white_check_mark:',
  warning: ':warning:',
  error: ':x:',
  info: ':information_source:',
};

// ============================================
// Slack Notifier Service
// ============================================

export class SlackNotifier {
  private config: SlackConfig;

  constructor(config: SlackConfig) {
    this.config = config;
  }

  /**
   * Slackにメッセージを送信
   */
  async send(message: SlackMessage): Promise<SlackSendResult> {
    try {
      const payload = {
        ...message,
        channel: message.channel || this.config.defaultChannel,
        username: message.username || this.config.username,
        icon_emoji: message.icon_emoji || this.config.iconEmoji,
        icon_url: message.icon_url || this.config.iconUrl,
      };

      const response = await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `Slack API error: ${errorText}` };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * シンプルなテキストメッセージを送信
   */
  async sendText(text: string, channel?: string): Promise<SlackSendResult> {
    return this.send({ text, channel });
  }

  /**
   * 通知タイプ付きのメッセージを送信
   */
  async sendNotification(
    type: NotificationType,
    title: string,
    message: string,
    options?: {
      channel?: string;
      fields?: Array<{ title: string; value: string; short?: boolean }>;
      link?: { text: string; url: string };
    }
  ): Promise<SlackSendResult> {
    const color = NOTIFICATION_COLORS[type];
    const emoji = NOTIFICATION_EMOJIS[type];

    const attachment: SlackAttachment = {
      color,
      pretext: `${emoji} *${title}*`,
      text: message,
      fields: options?.fields,
      ts: Math.floor(Date.now() / 1000),
    };

    const slackMessage: SlackMessage = {
      text: `${emoji} ${title}`,
      channel: options?.channel,
      attachments: [attachment],
    };

    if (options?.link) {
      attachment.fields = [
        ...(attachment.fields || []),
        {
          title: 'リンク',
          value: `<${options.link.url}|${options.link.text}>`,
          short: false,
        },
      ];
    }

    return this.send(slackMessage);
  }

  /**
   * スクレイピング完了通知を送信
   */
  async sendScrapingComplete(
    jobId: string,
    data: {
      name: string;
      itemsCollected: number;
      duration: number;
      url?: string;
    },
    channel?: string
  ): Promise<SlackSendResult> {
    return this.sendNotification('success', 'スクレイピング完了', `ジョブ「${data.name}」が完了しました`, {
      channel,
      fields: [
        { title: 'ジョブID', value: jobId, short: true },
        { title: '取得件数', value: `${data.itemsCollected}件`, short: true },
        { title: '実行時間', value: `${(data.duration / 1000).toFixed(2)}秒`, short: true },
      ],
      link: data.url ? { text: '結果を確認', url: data.url } : undefined,
    });
  }

  /**
   * スクレイピングエラー通知を送信
   */
  async sendScrapingError(
    jobId: string,
    data: {
      name: string;
      error: string;
      url?: string;
    },
    channel?: string
  ): Promise<SlackSendResult> {
    return this.sendNotification('error', 'スクレイピングエラー', `ジョブ「${data.name}」でエラーが発生しました`, {
      channel,
      fields: [
        { title: 'ジョブID', value: jobId, short: true },
        { title: 'エラー', value: data.error, short: false },
      ],
      link: data.url ? { text: '詳細を確認', url: data.url } : undefined,
    });
  }

  /**
   * アラート通知を送信
   */
  async sendAlert(
    alert: {
      id: string;
      type: 'price_drop' | 'stock_change' | 'new_item' | 'threshold';
      title: string;
      message: string;
      metadata?: Record<string, string | number>;
    },
    channel?: string
  ): Promise<SlackSendResult> {
    const typeConfig: Record<string, { emoji: string; color: string }> = {
      price_drop: { emoji: ':chart_with_downwards_trend:', color: '#36a64f' },
      stock_change: { emoji: ':package:', color: '#ffcc00' },
      new_item: { emoji: ':new:', color: '#3498db' },
      threshold: { emoji: ':bell:', color: '#ff6600' },
    };

    const config = typeConfig[alert.type] || { emoji: ':bell:', color: '#808080' };

    const fields: SlackAttachment['fields'] = [];
    if (alert.metadata) {
      for (const [key, value] of Object.entries(alert.metadata)) {
        fields.push({ title: key, value: String(value), short: true });
      }
    }

    const attachment: SlackAttachment = {
      color: config.color,
      pretext: `${config.emoji} *${alert.title}*`,
      text: alert.message,
      fields,
      footer: `アラートID: ${alert.id}`,
      ts: Math.floor(Date.now() / 1000),
    };

    return this.send({
      text: `${config.emoji} ${alert.title}`,
      channel,
      attachments: [attachment],
    });
  }

  /**
   * データ同期完了通知を送信
   */
  async sendSyncComplete(
    data: {
      destination: string;
      rowsUpdated: number;
      rowsAppended: number;
    },
    channel?: string
  ): Promise<SlackSendResult> {
    return this.sendNotification(
      'success',
      'データ同期完了',
      `${data.destination}へのデータ同期が完了しました`,
      {
        channel,
        fields: [
          { title: '更新行数', value: `${data.rowsUpdated}行`, short: true },
          { title: '追加行数', value: `${data.rowsAppended}行`, short: true },
        ],
      }
    );
  }

  /**
   * 日次サマリー通知を送信
   */
  async sendDailySummary(
    data: {
      date: string;
      jobsCompleted: number;
      jobsFailed: number;
      itemsCollected: number;
      alertsTriggered: number;
    },
    channel?: string
  ): Promise<SlackSendResult> {
    const hasErrors = data.jobsFailed > 0;
    const type: NotificationType = hasErrors ? 'warning' : 'info';

    return this.sendNotification(
      type,
      '日次サマリー',
      `${data.date}のスクレイピング実行結果`,
      {
        channel,
        fields: [
          { title: '完了ジョブ', value: `${data.jobsCompleted}件`, short: true },
          { title: '失敗ジョブ', value: `${data.jobsFailed}件`, short: true },
          { title: '取得データ', value: `${data.itemsCollected}件`, short: true },
          { title: 'アラート', value: `${data.alertsTriggered}件`, short: true },
        ],
      }
    );
  }
}

// ============================================
// Factory Functions
// ============================================

/**
 * Slack Notifierを作成
 */
export function createSlackNotifier(config: SlackConfig): SlackNotifier {
  return new SlackNotifier(config);
}

/**
 * 環境変数からSlack Notifierを作成
 */
export function createSlackNotifierFromEnv(): SlackNotifier {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    throw new Error('SLACK_WEBHOOK_URL environment variable is not set');
  }

  return createSlackNotifier({
    webhookUrl,
    defaultChannel: process.env.SLACK_DEFAULT_CHANNEL,
    username: process.env.SLACK_BOT_USERNAME || 'Scraping Bot',
    iconEmoji: process.env.SLACK_BOT_ICON || ':robot_face:',
  });
}

/**
 * Slack Webhook URLが設定されているかチェック
 */
export function isSlackConfigured(): boolean {
  return Boolean(process.env.SLACK_WEBHOOK_URL);
}
