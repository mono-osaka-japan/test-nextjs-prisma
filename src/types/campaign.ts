// 案件ステータス
export const CampaignStatus = {
  DRAFT: "DRAFT",
  ACTIVE: "ACTIVE",
  PAUSED: "PAUSED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

export type CampaignStatus = (typeof CampaignStatus)[keyof typeof CampaignStatus];

export const CampaignStatusLabel: Record<CampaignStatus, string> = {
  DRAFT: "下書き",
  ACTIVE: "進行中",
  PAUSED: "一時停止",
  COMPLETED: "完了",
  CANCELLED: "キャンセル",
};

// 優先度
export const CampaignPriority = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  URGENT: "URGENT",
} as const;

export type CampaignPriority = (typeof CampaignPriority)[keyof typeof CampaignPriority];

export const CampaignPriorityLabel: Record<CampaignPriority, string> = {
  LOW: "低",
  MEDIUM: "中",
  HIGH: "高",
  URGENT: "緊急",
};

// 認証タイプ
export const AuthType = {
  NONE: "NONE",
  BASIC: "BASIC",
  BEARER: "BEARER",
  API_KEY: "API_KEY",
  OAUTH: "OAUTH",
} as const;

export type AuthType = (typeof AuthType)[keyof typeof AuthType];

export const AuthTypeLabel: Record<AuthType, string> = {
  NONE: "認証なし",
  BASIC: "Basic認証",
  BEARER: "Bearer Token",
  API_KEY: "APIキー",
  OAUTH: "OAuth",
};

// 認証設定
export interface AuthConfig {
  username?: string;
  password?: string;
  token?: string;
  apiKey?: string;
  apiKeyHeader?: string;
  clientId?: string;
  clientSecret?: string;
}

// 案件
export interface Campaign {
  id: string;
  name: string;
  description: string | null;
  status: CampaignStatus;
  priority: CampaignPriority;
  startDate: string | null;
  endDate: string | null;
  budget: number | null;
  targetUrl: string | null;
  authType: AuthType | null;
  authConfig: AuthConfig | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  owner?: {
    id: string;
    name: string | null;
    email: string;
  };
  tasks?: CampaignTask[];
  _count?: {
    tasks: number;
  };
}

// 案件タスク
export interface CampaignTask {
  id: string;
  title: string;
  description: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED";
  dueDate: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  campaignId: string;
  assigneeId: string | null;
  assignee?: {
    id: string;
    name: string | null;
    email: string;
  };
}

// 案件作成/更新リクエスト
export interface CampaignInput {
  name: string;
  description?: string;
  status?: CampaignStatus;
  priority?: CampaignPriority;
  startDate?: string;
  endDate?: string;
  budget?: number;
  targetUrl?: string;
  authType?: AuthType;
  authConfig?: AuthConfig;
  metadata?: Record<string, unknown>;
}

// フィルター
export interface CampaignFilters {
  status?: CampaignStatus;
  priority?: CampaignPriority;
  search?: string;
  startDateFrom?: string;
  startDateTo?: string;
}

// ソート
export interface CampaignSort {
  field: "name" | "status" | "priority" | "startDate" | "endDate" | "createdAt" | "updatedAt";
  direction: "asc" | "desc";
}

// ページネーション
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// 一覧レスポンス
export interface CampaignListResponse {
  campaigns: Campaign[];
  pagination: Pagination;
}

// URL解析結果
export interface UrlAnalysisResult {
  url: string;
  host: string;
  protocol: string;
  path: string;
  authType: AuthType | null;
  authConfig: AuthConfig | null;
  headers: Record<string, string>;
  queryParams: Record<string, string>;
  isValid: boolean;
  error?: string;
}
