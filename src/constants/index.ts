/**
 * @file アプリケーション定数
 * @description アプリケーション全体で使用する定数の定義
 */

// ============================================
// User Related Constants
// ============================================

/** ユーザーロール */
export const USER_ROLES = {
  USER: 'USER',
  ADMIN: 'ADMIN',
  MODERATOR: 'MODERATOR',
} as const;

/** ユーザーロールの表示名 */
export const USER_ROLE_LABELS: Record<string, string> = {
  USER: 'ユーザー',
  ADMIN: '管理者',
  MODERATOR: 'モデレーター',
};

// ============================================
// Post Related Constants
// ============================================

/** 投稿ステータス */
export const POST_STATUS = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
} as const;

/** 投稿ステータスの表示名 */
export const POST_STATUS_LABELS: Record<string, string> = {
  DRAFT: '下書き',
  PUBLISHED: '公開中',
  ARCHIVED: 'アーカイブ',
};

// ============================================
// Notification Constants
// ============================================

/** 通知タイプ */
export const NOTIFICATION_TYPES = {
  LIKE: 'LIKE',
  COMMENT: 'COMMENT',
  FOLLOW: 'FOLLOW',
  MENTION: 'MENTION',
  SYSTEM: 'SYSTEM',
} as const;

/** 通知タイプの表示名 */
export const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  LIKE: 'いいね',
  COMMENT: 'コメント',
  FOLLOW: 'フォロー',
  MENTION: 'メンション',
  SYSTEM: 'システム',
};

// ============================================
// Audit Log Constants
// ============================================

/** 監査ログアクション */
export const AUDIT_ACTIONS = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
} as const;

/** 監査ログアクションの表示名 */
export const AUDIT_ACTION_LABELS: Record<string, string> = {
  CREATE: '作成',
  UPDATE: '更新',
  DELETE: '削除',
  LOGIN: 'ログイン',
  LOGOUT: 'ログアウト',
};

// ============================================
// Pagination Constants
// ============================================

/** デフォルトのページサイズ */
export const DEFAULT_PAGE_SIZE = 20;

/** 最大ページサイズ */
export const MAX_PAGE_SIZE = 100;

/** ページサイズオプション */
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

// ============================================
// Validation Constants
// ============================================

/** バリデーション制限値 */
export const VALIDATION_LIMITS = {
  /** ユーザー名の最小文字数 */
  USERNAME_MIN: 2,
  /** ユーザー名の最大文字数 */
  USERNAME_MAX: 50,
  /** パスワードの最小文字数 */
  PASSWORD_MIN: 8,
  /** パスワードの最大文字数 */
  PASSWORD_MAX: 100,
  /** 投稿タイトルの最大文字数 */
  POST_TITLE_MAX: 200,
  /** 投稿抜粋の最大文字数 */
  POST_EXCERPT_MAX: 500,
  /** 投稿本文の最大文字数 */
  POST_CONTENT_MAX: 100000,
  /** コメントの最大文字数 */
  COMMENT_MAX: 5000,
  /** カテゴリー名の最大文字数 */
  CATEGORY_NAME_MAX: 50,
  /** カテゴリー説明の最大文字数 */
  CATEGORY_DESC_MAX: 500,
  /** タグ名の最大文字数 */
  TAG_NAME_MAX: 30,
  /** プロフィールBIOの最大文字数 */
  BIO_MAX: 500,
  /** 場所の最大文字数 */
  LOCATION_MAX: 100,
  /** ウェブサイトURLの最大文字数 */
  WEBSITE_URL_MAX: 200,
  /** 通知タイトルの最大文字数 */
  NOTIFICATION_TITLE_MAX: 100,
  /** 通知メッセージの最大文字数 */
  NOTIFICATION_MESSAGE_MAX: 500,
  /** スラグの最大文字数 */
  SLUG_MAX: 200,
  /** 検索クエリの最大文字数 */
  SEARCH_QUERY_MAX: 200,
  /** ファイル名の最大文字数 */
  FILENAME_MAX: 255,
  /** 画像ALTの最大文字数 */
  MEDIA_ALT_MAX: 500,
} as const;

// ============================================
// Media Constants
// ============================================

/** 許可されるMIMEタイプ */
export const ALLOWED_MIME_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  documents: ['application/pdf'],
} as const;

/** 最大ファイルサイズ（バイト） */
export const MAX_FILE_SIZE = {
  image: 5 * 1024 * 1024, // 5MB
  document: 10 * 1024 * 1024, // 10MB
} as const;

// ============================================
// Session Constants
// ============================================

/** セッション有効期限（秒） */
export const SESSION_EXPIRY = {
  /** 通常セッション: 24時間 */
  DEFAULT: 24 * 60 * 60,
  /** 記憶セッション: 30日 */
  REMEMBER_ME: 30 * 24 * 60 * 60,
} as const;

/** リフレッシュトークン有効期限（秒）: 7日 */
export const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60;

// ============================================
// Rate Limit Constants
// ============================================

/** レート制限設定 */
export const RATE_LIMITS = {
  /** ログイン試行: 5回/15分 */
  LOGIN: { requests: 5, window: 15 * 60 },
  /** API一般: 100回/分 */
  API_GENERAL: { requests: 100, window: 60 },
  /** 投稿作成: 10回/時間 */
  CREATE_POST: { requests: 10, window: 60 * 60 },
  /** コメント作成: 30回/時間 */
  CREATE_COMMENT: { requests: 30, window: 60 * 60 },
} as const;

// ============================================
// Slug Constants
// ============================================

/** スラグ生成用の置換パターン */
export const SLUG_REPLACEMENTS: Record<string, string> = {
  // 日本語の一般的な区切り文字
  '・': '-',
  '、': '-',
  '。': '',
  // スペースと特殊文字
  ' ': '-',
  '_': '-',
};

/** スラグで許可される文字のパターン */
export const SLUG_ALLOWED_CHARS = /^[a-z0-9-]+$/;

// ============================================
// Date/Time Constants
// ============================================

/** 日付フォーマット */
export const DATE_FORMATS = {
  /** ISO形式 */
  ISO: 'yyyy-MM-dd',
  /** 日本語形式 */
  JP_DATE: 'yyyy年M月d日',
  /** 日本語形式（時刻付き） */
  JP_DATETIME: 'yyyy年M月d日 HH:mm',
  /** 短い形式 */
  SHORT: 'MM/dd',
  /** 時刻のみ */
  TIME: 'HH:mm',
} as const;

// ============================================
// Error Messages
// ============================================

/** エラーメッセージ */
export const ERROR_MESSAGES = {
  // 認証関連
  INVALID_CREDENTIALS: 'メールアドレスまたはパスワードが正しくありません',
  SESSION_EXPIRED: 'セッションが期限切れです。再度ログインしてください',
  UNAUTHORIZED: '認証が必要です',
  FORBIDDEN: 'アクセス権限がありません',

  // バリデーション関連
  REQUIRED_FIELD: 'この項目は必須です',
  INVALID_EMAIL: '有効なメールアドレスを入力してください',
  INVALID_URL: '有効なURLを入力してください',
  INVALID_SLUG: 'スラグは小文字英数字とハイフンのみ使用できます',
  PASSWORD_TOO_SHORT: `パスワードは${VALIDATION_LIMITS.PASSWORD_MIN}文字以上で入力してください`,
  PASSWORD_TOO_WEAK: 'パスワードには大文字、小文字、数字を含めてください',
  PASSWORD_MISMATCH: 'パスワードが一致しません',

  // リソース関連
  NOT_FOUND: 'リソースが見つかりません',
  ALREADY_EXISTS: 'すでに存在しています',
  EMAIL_ALREADY_EXISTS: 'このメールアドレスは既に使用されています',

  // サーバー関連
  INTERNAL_ERROR: 'サーバーエラーが発生しました',
  SERVICE_UNAVAILABLE: 'サービスが一時的に利用できません',

  // レート制限
  RATE_LIMIT_EXCEEDED: 'リクエストが多すぎます。しばらく待ってから再試行してください',
} as const;

// ============================================
// Success Messages
// ============================================

/** 成功メッセージ */
export const SUCCESS_MESSAGES = {
  CREATED: '作成しました',
  UPDATED: '更新しました',
  DELETED: '削除しました',
  LOGIN_SUCCESS: 'ログインしました',
  LOGOUT_SUCCESS: 'ログアウトしました',
  PASSWORD_CHANGED: 'パスワードを変更しました',
  EMAIL_SENT: 'メールを送信しました',
} as const;

// ============================================
// API Endpoints (for client-side use)
// ============================================

/** APIエンドポイント */
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/api/auth/login',
  LOGOUT: '/api/auth/logout',
  REGISTER: '/api/auth/register',
  REFRESH: '/api/auth/refresh',
  ME: '/api/auth/me',

  // Users
  USERS: '/api/users',
  USER: (id: string) => `/api/users/${id}`,
  USER_PROFILE: (id: string) => `/api/users/${id}/profile`,

  // Posts
  POSTS: '/api/posts',
  POST: (id: string) => `/api/posts/${id}`,
  POST_COMMENTS: (id: string) => `/api/posts/${id}/comments`,
  POST_LIKES: (id: string) => `/api/posts/${id}/likes`,

  // Categories
  CATEGORIES: '/api/categories',
  CATEGORY: (id: string) => `/api/categories/${id}`,

  // Tags
  TAGS: '/api/tags',
  TAG: (id: string) => `/api/tags/${id}`,

  // Notifications
  NOTIFICATIONS: '/api/notifications',
  NOTIFICATION_READ: '/api/notifications/read',

  // Media
  MEDIA: '/api/media',
  MEDIA_UPLOAD: '/api/media/upload',
} as const;
