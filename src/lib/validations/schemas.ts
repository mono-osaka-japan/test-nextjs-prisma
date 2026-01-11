/**
 * @file Zodバリデーションスキーマ
 * @description フォーム入力、APIリクエストのバリデーションに使用するZodスキーマ
 */

import { z } from 'zod';
import {
  USER_ROLES,
  POST_STATUS,
  NOTIFICATION_TYPES,
  VALIDATION_LIMITS,
  ERROR_MESSAGES,
} from '@/constants';

// ============================================
// Common Schemas
// ============================================

/**
 * CUID形式のID
 * @description Prismaで生成されるCUID形式のIDを検証
 */
export const cuidSchema = z.string().cuid();

/**
 * メールアドレス
 * @description 有効なメールアドレス形式を検証
 */
export const emailSchema = z
  .string()
  .min(1, ERROR_MESSAGES.REQUIRED_FIELD)
  .email(ERROR_MESSAGES.INVALID_EMAIL)
  .toLowerCase();

/**
 * パスワード
 * @description 最小8文字、大文字・小文字・数字を含むパスワードを検証
 */
export const passwordSchema = z
  .string()
  .min(VALIDATION_LIMITS.PASSWORD_MIN, ERROR_MESSAGES.PASSWORD_TOO_SHORT)
  .max(VALIDATION_LIMITS.PASSWORD_MAX)
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    ERROR_MESSAGES.PASSWORD_TOO_WEAK
  );

/**
 * URL
 * @description 有効なURL形式を検証
 */
export const urlSchema = z
  .string()
  .url('有効なURLを入力してください')
  .max(VALIDATION_LIMITS.WEBSITE_URL_MAX)
  .optional()
  .nullable();

/**
 * スラグ
 * @description 小文字英数字とハイフンのみを許可
 */
export const slugSchema = z
  .string()
  .regex(/^[a-z0-9-]+$/, 'スラグは小文字英数字とハイフンのみ使用できます')
  .min(1)
  .max(200);

// ============================================
// Pagination Schemas
// ============================================

/**
 * ページネーションパラメータ
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * ソートパラメータ
 */
export const sortSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================
// User Schemas
// ============================================

/**
 * ユーザーロール
 */
export const userRoleSchema = z.enum([
  USER_ROLES.USER,
  USER_ROLES.ADMIN,
  USER_ROLES.MODERATOR,
]);

/**
 * ユーザー登録スキーマ
 */
export const registerUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z
    .string()
    .min(VALIDATION_LIMITS.USERNAME_MIN, `名前は${VALIDATION_LIMITS.USERNAME_MIN}文字以上で入力してください`)
    .max(VALIDATION_LIMITS.USERNAME_MAX)
    .optional()
    .nullable(),
});

/**
 * ログインスキーマ
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, ERROR_MESSAGES.REQUIRED_FIELD),
  rememberMe: z.boolean().default(false),
});

/**
 * ユーザー更新スキーマ
 */
export const updateUserSchema = z.object({
  email: emailSchema.optional(),
  name: z
    .string()
    .min(VALIDATION_LIMITS.USERNAME_MIN)
    .max(VALIDATION_LIMITS.USERNAME_MAX)
    .optional()
    .nullable(),
  avatarUrl: urlSchema,
  role: userRoleSchema.optional(),
});

/**
 * パスワード変更スキーマ
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, ERROR_MESSAGES.REQUIRED_FIELD),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, ERROR_MESSAGES.REQUIRED_FIELD),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'パスワードが一致しません',
    path: ['confirmPassword'],
  });

/**
 * パスワードリセットリクエストスキーマ
 */
export const passwordResetRequestSchema = z.object({
  email: emailSchema,
});

/**
 * パスワードリセット実行スキーマ
 */
export const passwordResetSchema = z
  .object({
    token: z.string().min(1),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'パスワードが一致しません',
    path: ['confirmPassword'],
  });

// ============================================
// Profile Schemas
// ============================================

/**
 * プロフィール更新スキーマ
 */
export const updateProfileSchema = z.object({
  bio: z
    .string()
    .max(VALIDATION_LIMITS.BIO_MAX, `自己紹介は${VALIDATION_LIMITS.BIO_MAX}文字以内で入力してください`)
    .optional()
    .nullable(),
  location: z.string().max(100).optional().nullable(),
  website: urlSchema,
  birthdate: z.coerce.date().optional().nullable(),
});

// ============================================
// Post Schemas
// ============================================

/**
 * 投稿ステータス
 */
export const postStatusSchema = z.enum([
  POST_STATUS.DRAFT,
  POST_STATUS.PUBLISHED,
  POST_STATUS.ARCHIVED,
]);

/**
 * 投稿作成スキーマ
 */
export const createPostSchema = z.object({
  title: z
    .string()
    .min(1, ERROR_MESSAGES.REQUIRED_FIELD)
    .max(VALIDATION_LIMITS.POST_TITLE_MAX, `タイトルは${VALIDATION_LIMITS.POST_TITLE_MAX}文字以内で入力してください`),
  content: z
    .string()
    .min(1, ERROR_MESSAGES.REQUIRED_FIELD)
    .max(VALIDATION_LIMITS.POST_CONTENT_MAX),
  excerpt: z
    .string()
    .max(VALIDATION_LIMITS.POST_EXCERPT_MAX)
    .optional()
    .nullable(),
  coverImage: urlSchema,
  status: postStatusSchema.default(POST_STATUS.DRAFT),
  categoryId: cuidSchema.optional().nullable(),
  tagIds: z.array(cuidSchema).default([]),
});

/**
 * 投稿更新スキーマ
 */
export const updatePostSchema = createPostSchema.partial();

/**
 * 投稿フィルタースキーマ
 */
export const postFilterSchema = paginationSchema.merge(sortSchema).extend({
  status: postStatusSchema.optional(),
  authorId: cuidSchema.optional(),
  categoryId: cuidSchema.optional(),
  tagId: cuidSchema.optional(),
  search: z.string().max(200).optional(),
});

// ============================================
// Category Schemas
// ============================================

/**
 * カテゴリー作成スキーマ
 */
export const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, ERROR_MESSAGES.REQUIRED_FIELD)
    .max(VALIDATION_LIMITS.CATEGORY_NAME_MAX),
  description: z.string().max(500).optional().nullable(),
  sortOrder: z.number().int().min(0).default(0),
});

/**
 * カテゴリー更新スキーマ
 */
export const updateCategorySchema = createCategorySchema.partial();

// ============================================
// Tag Schemas
// ============================================

/**
 * タグ作成スキーマ
 */
export const createTagSchema = z.object({
  name: z
    .string()
    .min(1, ERROR_MESSAGES.REQUIRED_FIELD)
    .max(VALIDATION_LIMITS.TAG_NAME_MAX)
    .transform((val) => val.toLowerCase().trim()),
});

// ============================================
// Comment Schemas
// ============================================

/**
 * コメント作成スキーマ
 */
export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, ERROR_MESSAGES.REQUIRED_FIELD)
    .max(VALIDATION_LIMITS.COMMENT_MAX, `コメントは${VALIDATION_LIMITS.COMMENT_MAX}文字以内で入力してください`),
  postId: cuidSchema,
  parentId: cuidSchema.optional().nullable(),
});

/**
 * コメント更新スキーマ
 */
export const updateCommentSchema = z.object({
  content: z
    .string()
    .min(1, ERROR_MESSAGES.REQUIRED_FIELD)
    .max(VALIDATION_LIMITS.COMMENT_MAX),
});

// ============================================
// Notification Schemas
// ============================================

/**
 * 通知タイプ
 */
export const notificationTypeSchema = z.enum([
  NOTIFICATION_TYPES.LIKE,
  NOTIFICATION_TYPES.COMMENT,
  NOTIFICATION_TYPES.FOLLOW,
  NOTIFICATION_TYPES.MENTION,
  NOTIFICATION_TYPES.SYSTEM,
]);

/**
 * 通知作成スキーマ
 */
export const createNotificationSchema = z.object({
  type: notificationTypeSchema,
  title: z
    .string()
    .min(1)
    .max(VALIDATION_LIMITS.NOTIFICATION_TITLE_MAX),
  message: z
    .string()
    .max(VALIDATION_LIMITS.NOTIFICATION_MESSAGE_MAX)
    .optional()
    .nullable(),
  link: urlSchema,
  userId: cuidSchema,
});

/**
 * 通知既読更新スキーマ
 */
export const markNotificationsReadSchema = z.object({
  notificationIds: z.array(cuidSchema).optional(),
  markAll: z.boolean().default(false),
});

// ============================================
// Media Schemas
// ============================================

/**
 * メディアアップロードスキーマ
 */
export const mediaUploadSchema = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.string().min(1),
  size: z.number().int().positive(),
  alt: z.string().max(500).optional().nullable(),
});

// ============================================
// Search Schemas
// ============================================

/**
 * 検索クエリスキーマ
 */
export const searchQuerySchema = z.object({
  q: z.string().min(1).max(200),
  type: z.enum(['posts', 'users', 'tags', 'all']).default('all'),
  ...paginationSchema.shape,
});

// ============================================
// Type Exports
// ============================================

export type RegisterUserInput = z.infer<typeof registerUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type PostFilterInput = z.infer<typeof postFilterSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateTagInput = z.infer<typeof createTagSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type MarkNotificationsReadInput = z.infer<typeof markNotificationsReadSchema>;
export type MediaUploadInput = z.infer<typeof mediaUploadSchema>;
export type SearchQueryInput = z.infer<typeof searchQuerySchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type SortInput = z.infer<typeof sortSchema>;
