/**
 * @file API関連型定義
 * @description APIリクエスト・レスポンス、エラーハンドリングの型定義
 */

import type { PaginationMeta } from './index';

// ============================================
// API Response Types
// ============================================

/** APIレスポンスの基本形 */
export interface ApiResponse<T = unknown, M = Record<string, unknown>> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: M;
}

/** ページネーション付きAPIレスポンス */
export interface ApiPaginatedResponse<T> {
  success: boolean;
  data: T[];
  error?: ApiError;
  meta: PaginationMeta;
}

/** APIエラー */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  validationErrors?: ValidationError[];
}

/** バリデーションエラー */
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

// ============================================
// HTTP Types
// ============================================

/** HTTPメソッド */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** HTTPステータスコード */
export type HttpStatusCode =
  | 200 // OK
  | 201 // Created
  | 204 // No Content
  | 400 // Bad Request
  | 401 // Unauthorized
  | 403 // Forbidden
  | 404 // Not Found
  | 409 // Conflict
  | 422 // Unprocessable Entity
  | 429 // Too Many Requests
  | 500 // Internal Server Error
  | 502 // Bad Gateway
  | 503; // Service Unavailable

// ============================================
// Auth Types
// ============================================

/** ログインリクエスト */
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/** ログインレスポンス */
export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken?: string;
  expiresAt: string;
}

/** 認証済みユーザー情報 */
export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: string;
}

/** 登録リクエスト */
export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

/** パスワードリセットリクエスト */
export interface PasswordResetRequest {
  email: string;
}

/** パスワード変更リクエスト */
export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

/** トークンリフレッシュリクエスト */
export interface RefreshTokenRequest {
  refreshToken: string;
}

// ============================================
// Request Context Types
// ============================================

/** リクエストコンテキスト */
export interface RequestContext {
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  locale?: string;
}

/** 認証済みリクエストコンテキスト */
export interface AuthenticatedRequestContext extends RequestContext {
  userId: string;
  sessionId: string;
  user: AuthUser;
}

// ============================================
// Specific API Request/Response Types
// ============================================

/** 投稿一覧リクエスト */
export interface GetPostsRequest {
  page?: number;
  limit?: number;
  status?: string;
  authorId?: string;
  categoryId?: string;
  tagId?: string;
  search?: string;
  sortBy?: 'createdAt' | 'publishedAt' | 'viewCount' | 'title';
  sortOrder?: 'asc' | 'desc';
}

/** ユーザー一覧リクエスト */
export interface GetUsersRequest {
  page?: number;
  limit?: number;
  role?: string;
  search?: string;
  sortBy?: 'createdAt' | 'name' | 'email';
  sortOrder?: 'asc' | 'desc';
}

/** コメント一覧リクエスト */
export interface GetCommentsRequest {
  postId: string;
  page?: number;
  limit?: number;
  parentId?: string | null;
}

/** 通知一覧リクエスト */
export interface GetNotificationsRequest {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}

/** 通知既読更新リクエスト */
export interface MarkNotificationsReadRequest {
  notificationIds?: string[];
  markAll?: boolean;
}

// ============================================
// Webhook Types
// ============================================

/** Webhookペイロード */
export interface WebhookPayload<T = unknown> {
  event: string;
  timestamp: string;
  data: T;
  signature?: string;
}

/** Webhookイベントタイプ */
export type WebhookEventType =
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | 'post.created'
  | 'post.updated'
  | 'post.published'
  | 'post.deleted'
  | 'comment.created'
  | 'comment.deleted';

// ============================================
// Error Codes
// ============================================

/** エラーコード定数 */
export const ErrorCodes = {
  // 認証関連
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',

  // バリデーション関連
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',

  // リソース関連
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',

  // サーバー関連
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR: 'DATABASE_ERROR',

  // レート制限
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

// ============================================
// API Route Handler Types
// ============================================

/** APIハンドラーオプション */
export interface ApiHandlerOptions {
  requireAuth?: boolean;
  roles?: string[];
  rateLimit?: {
    requests: number;
    window: number; // seconds
  };
}

/** APIハンドラーの戻り値 */
export type ApiHandlerResult<T> = Promise<ApiResponse<T>>;
