/**
 * @file 共通型定義
 * @description Prismaスキーマに基づくアプリケーション全体の型定義
 */

import {
  USER_ROLES,
  POST_STATUS,
  NOTIFICATION_TYPES,
  AUDIT_ACTIONS,
} from '@/constants';

// ============================================
// Enum Types (derived from constants)
// ============================================

/** ユーザーロール */
export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

/** 投稿ステータス */
export type PostStatus = typeof POST_STATUS[keyof typeof POST_STATUS];

/** 通知タイプ */
export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];

/** 監査ログアクション */
export type AuditAction = typeof AUDIT_ACTIONS[keyof typeof AUDIT_ACTIONS];

// ============================================
// Base Entity Types
// ============================================

/** タイムスタンプを持つベースエンティティ */
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

/** 作成日のみを持つベースエンティティ */
export interface BaseEntityCreatedOnly {
  id: string;
  createdAt: Date;
}

// ============================================
// User Related Types
// ============================================

/** ユーザー基本情報 */
export interface User extends BaseEntity {
  email: string;
  name: string | null;
  passwordHash: string | null;
  avatarUrl: string | null;
  role: UserRole;
  emailVerified: Date | null;
}

/** ユーザー公開情報（パスワードハッシュを除く） */
export interface UserPublic {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: UserRole;
  createdAt: Date;
}

/** OAuthアカウント */
export interface Account {
  id: string;
  userId: string;
  type: string;
  provider: string;
  providerAccountId: string;
  refreshToken: string | null;
  accessToken: string | null;
  expiresAt: number | null;
  tokenType: string | null;
  scope: string | null;
  idToken: string | null;
  sessionState: string | null;
}

/** セッション */
export interface Session extends BaseEntityCreatedOnly {
  sessionToken: string;
  userId: string;
  expires: Date;
}

/** メール検証トークン */
export interface VerificationToken {
  identifier: string;
  token: string;
  expires: Date;
}

/** プロフィール */
export interface Profile extends BaseEntity {
  userId: string;
  bio: string | null;
  location: string | null;
  website: string | null;
  birthdate: Date | null;
}

// ============================================
// Content Related Types
// ============================================

/** カテゴリー */
export interface Category extends BaseEntity {
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
}

/** タグ */
export interface Tag extends BaseEntityCreatedOnly {
  name: string;
  slug: string;
}

/** 投稿 */
export interface Post extends BaseEntity {
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  coverImage: string | null;
  status: PostStatus;
  publishedAt: Date | null;
  viewCount: number;
  authorId: string;
  categoryId: string | null;
}

/** 投稿とタグの中間テーブル */
export interface PostTag {
  postId: string;
  tagId: string;
}

/** コメント */
export interface Comment extends BaseEntity {
  content: string;
  authorId: string;
  postId: string;
  parentId: string | null;
}

// ============================================
// Interaction Types
// ============================================

/** いいね */
export interface Like extends BaseEntityCreatedOnly {
  userId: string;
  postId: string;
}

/** ブックマーク */
export interface Bookmark extends BaseEntityCreatedOnly {
  userId: string;
  postId: string;
}

/** フォロー */
export interface Follow extends BaseEntityCreatedOnly {
  followerId: string;
  followingId: string;
}

// ============================================
// System Types
// ============================================

/** 通知 */
export interface Notification extends BaseEntityCreatedOnly {
  type: NotificationType;
  title: string;
  message: string | null;
  link: string | null;
  isRead: boolean;
  userId: string;
}

/** メディア */
export interface Media extends BaseEntityCreatedOnly {
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  alt: string | null;
  postId: string | null;
}

/** 監査ログ */
export interface AuditLog extends BaseEntityCreatedOnly {
  action: AuditAction;
  entity: string;
  entityId: string | null;
  oldValue: string | null;
  newValue: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  userId: string | null;
}

// ============================================
// Relation Types (with relations included)
// ============================================

/** ユーザー（リレーション付き） */
export interface UserWithRelations extends User {
  profile?: Profile | null;
  posts?: Post[];
  comments?: Comment[];
  followers?: Follow[];
  following?: Follow[];
}

/** 投稿（リレーション付き） */
export interface PostWithRelations extends Post {
  author?: UserPublic;
  category?: Category | null;
  tags?: Tag[];
  comments?: Comment[];
  likes?: Like[];
  _count?: {
    likes: number;
    comments: number;
    bookmarks: number;
  };
}

/** コメント（リレーション付き） */
export interface CommentWithRelations extends Comment {
  author?: UserPublic;
  replies?: Comment[];
  parent?: Comment | null;
}

// ============================================
// Input Types (for create/update operations)
// ============================================

/** ユーザー作成入力 */
export interface CreateUserInput {
  email: string;
  name?: string | null;
  password?: string;
  avatarUrl?: string | null;
  role?: UserRole;
}

/** ユーザー更新入力 */
export interface UpdateUserInput {
  email?: string;
  name?: string | null;
  avatarUrl?: string | null;
  role?: UserRole;
}

/** プロフィール更新入力 */
export interface UpdateProfileInput {
  bio?: string | null;
  location?: string | null;
  website?: string | null;
  birthdate?: Date | null;
}

/** 投稿作成入力 */
export interface CreatePostInput {
  title: string;
  content: string;
  excerpt?: string | null;
  coverImage?: string | null;
  status?: PostStatus;
  categoryId?: string | null;
  tagIds?: string[];
}

/** 投稿更新入力 */
export interface UpdatePostInput {
  title?: string;
  content?: string;
  excerpt?: string | null;
  coverImage?: string | null;
  status?: PostStatus;
  categoryId?: string | null;
  tagIds?: string[];
}

/** カテゴリー作成入力 */
export interface CreateCategoryInput {
  name: string;
  description?: string | null;
  sortOrder?: number;
}

/** タグ作成入力 */
export interface CreateTagInput {
  name: string;
}

/** コメント作成入力 */
export interface CreateCommentInput {
  content: string;
  postId: string;
  parentId?: string | null;
}

/** 通知作成入力 */
export interface CreateNotificationInput {
  type: NotificationType;
  title: string;
  message?: string | null;
  link?: string | null;
  userId: string;
}

// ============================================
// Query/Filter Types
// ============================================

/** ページネーションパラメータ */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/** ソートパラメータ */
export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/** 投稿フィルターパラメータ */
export interface PostFilterParams extends PaginationParams, SortParams {
  status?: PostStatus;
  authorId?: string;
  categoryId?: string;
  tagId?: string;
  search?: string;
}

/** ユーザーフィルターパラメータ */
export interface UserFilterParams extends PaginationParams, SortParams {
  role?: UserRole;
  search?: string;
}

/** ページネーション結果メタデータ */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/** ページネーション付きリスト結果 */
export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}
