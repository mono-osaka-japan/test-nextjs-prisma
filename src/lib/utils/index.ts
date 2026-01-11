/**
 * @file ユーティリティ関数
 * @description アプリケーション全体で使用するヘルパー関数
 */

import { SLUG_REPLACEMENTS, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@/constants';
import type { PaginationParams, PaginationMeta } from '@/types';

// ============================================
// String Utilities
// ============================================

/**
 * 文字列からスラグを生成する
 * @param text - 変換する文字列
 * @returns スラグ形式の文字列
 * @example
 * generateSlug('Hello World') // 'hello-world'
 * generateSlug('日本語タイトル') // 'ri-ben-yu-taitoru' (注: 実際のローマ字変換は別途実装が必要)
 */
export function generateSlug(text: string): string {
  let slug = text.toLowerCase().trim();

  // 特殊文字の置換
  for (const [from, to] of Object.entries(SLUG_REPLACEMENTS)) {
    slug = slug.split(from).join(to);
  }

  // 連続するハイフンを単一のハイフンに
  slug = slug.replace(/-+/g, '-');

  // 先頭と末尾のハイフンを削除
  slug = slug.replace(/^-+|-+$/g, '');

  // 許可されない文字を削除
  slug = slug.replace(/[^a-z0-9-]/g, '');

  return slug;
}

/**
 * 文字列を指定した長さで切り詰める
 * @param text - 切り詰める文字列
 * @param maxLength - 最大長
 * @param suffix - 末尾に追加する文字列（デフォルト: '...'）
 * @returns 切り詰められた文字列
 * @example
 * truncate('Hello World', 5) // 'Hello...'
 */
export function truncate(
  text: string,
  maxLength: number,
  suffix: string = '...'
): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * 文字列の最初の文字を大文字にする
 * @param text - 変換する文字列
 * @returns 最初の文字が大文字の文字列
 */
export function capitalize(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * HTMLタグを除去する
 * @param html - HTMLを含む文字列
 * @returns タグを除去した文字列
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

/**
 * 文字列をエスケープする（XSS対策）
 * @param text - エスケープする文字列
 * @returns エスケープされた文字列
 */
export function escapeHtml(text: string): string {
  const escapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
  };
  return text.replace(/[&<>"']/g, (char) => escapeMap[char] || char);
}

// ============================================
// Date Utilities
// ============================================

/**
 * 相対的な時間表示を取得する
 * @param date - 日付
 * @returns 相対的な時間文字列（例: '3分前', '2日前'）
 */
export function getRelativeTime(date: Date | string): string {
  const now = new Date();
  const target = new Date(date);
  const diffMs = now.getTime() - target.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffSec < 60) return 'たった今';
  if (diffMin < 60) return `${diffMin}分前`;
  if (diffHour < 24) return `${diffHour}時間前`;
  if (diffDay < 7) return `${diffDay}日前`;
  if (diffWeek < 4) return `${diffWeek}週間前`;
  if (diffMonth < 12) return `${diffMonth}ヶ月前`;
  return `${diffYear}年前`;
}

/**
 * 日付を日本語形式でフォーマットする
 * @param date - 日付
 * @param options - フォーマットオプション
 * @returns フォーマットされた日付文字列
 */
export function formatDate(
  date: Date | string,
  options: {
    includeTime?: boolean;
    includeSeconds?: boolean;
  } = {}
): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();

  let result = `${year}年${month}月${day}日`;

  if (options.includeTime) {
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    result += ` ${hours}:${minutes}`;

    if (options.includeSeconds) {
      const seconds = d.getSeconds().toString().padStart(2, '0');
      result += `:${seconds}`;
    }
  }

  return result;
}

/**
 * ISO形式の日付文字列を返す
 * @param date - 日付
 * @returns ISO形式の日付文字列（日付部分のみ）
 */
export function toISODateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

// ============================================
// Number Utilities
// ============================================

/**
 * 数値を3桁区切りでフォーマットする
 * @param num - 数値
 * @returns フォーマットされた文字列
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('ja-JP');
}

/**
 * 数値を短縮形式でフォーマットする
 * @param num - 数値
 * @returns 短縮形式の文字列（例: '1.2K', '3.5M'）
 */
export function formatCompactNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
}

/**
 * ファイルサイズを人間が読める形式にフォーマットする
 * @param bytes - バイト数
 * @returns フォーマットされたファイルサイズ
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let unitIndex = 0;
  let size = bytes;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

/**
 * 数値を指定した範囲内に収める
 * @param value - 対象の数値
 * @param min - 最小値
 * @param max - 最大値
 * @returns 範囲内に収められた数値
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// ============================================
// Pagination Utilities
// ============================================

/**
 * ページネーションパラメータを正規化する
 * @param params - ページネーションパラメータ
 * @returns 正規化されたパラメータ
 */
export function normalizePaginationParams(params: PaginationParams): Required<PaginationParams> {
  return {
    page: Math.max(1, params.page ?? 1),
    limit: clamp(params.limit ?? DEFAULT_PAGE_SIZE, 1, MAX_PAGE_SIZE),
  };
}

/**
 * ページネーションのオフセットを計算する
 * @param page - ページ番号（1始まり）
 * @param limit - 1ページあたりの件数
 * @returns オフセット値
 */
export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * ページネーションのメタデータを生成する
 * @param total - 総件数
 * @param page - 現在のページ
 * @param limit - 1ページあたりの件数
 * @returns ページネーションメタデータ
 */
export function createPaginationMeta(
  total: number,
  page: number,
  limit: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

// ============================================
// Object Utilities
// ============================================

/**
 * オブジェクトからundefinedとnullの値を除去する
 * @param obj - 対象のオブジェクト
 * @returns クリーンなオブジェクト
 */
export function removeNullish<T extends Record<string, unknown>>(
  obj: T
): Partial<T> {
  const result: Partial<T> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null) {
      (result as Record<string, unknown>)[key] = value;
    }
  }
  return result;
}

/**
 * オブジェクトから指定したキーを除外する
 * @param obj - 対象のオブジェクト
 * @param keys - 除外するキー
 * @returns キーが除外されたオブジェクト
 */
export function omit<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result;
}

/**
 * オブジェクトから指定したキーのみを抽出する
 * @param obj - 対象のオブジェクト
 * @param keys - 抽出するキー
 * @returns 指定したキーのみを持つオブジェクト
 */
export function pick<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}

// ============================================
// Array Utilities
// ============================================

/**
 * 配列から重複を除去する
 * @param array - 対象の配列
 * @param key - オブジェクト配列の場合、比較に使用するキー
 * @returns 重複が除去された配列
 */
export function unique<T>(array: T[], key?: keyof T): T[] {
  if (key) {
    const seen = new Set<T[keyof T]>();
    return array.filter((item) => {
      const value = item[key];
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    });
  }
  return [...new Set(array)];
}

/**
 * 配列をチャンクに分割する
 * @param array - 対象の配列
 * @param size - チャンクサイズ
 * @returns チャンクの配列
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * 配列をキーでグループ化する
 * @param array - 対象の配列
 * @param key - グループ化のキー
 * @returns グループ化されたオブジェクト
 */
export function groupBy<T extends Record<string, unknown>>(
  array: T[],
  key: keyof T
): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const groupKey = String(item[key]);
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

// ============================================
// Validation Utilities
// ============================================

/**
 * 有効なメールアドレスかどうかを判定する
 * @param email - 検証するメールアドレス
 * @returns メールアドレスが有効かどうか
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 有効なURLかどうかを判定する
 * @param url - 検証するURL
 * @returns URLが有効かどうか
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 空の値かどうかを判定する
 * @param value - 検証する値
 * @returns 空の値かどうか
 */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

// ============================================
// Async Utilities
// ============================================

/**
 * 指定した時間だけ待機する
 * @param ms - 待機時間（ミリ秒）
 * @returns Promise
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 非同期処理のエラーをキャッチしてタプルで返す
 * @param promise - 実行するPromise
 * @returns [エラー, 結果]のタプル
 */
export async function tryCatch<T, E = Error>(
  promise: Promise<T>
): Promise<[E, null] | [null, T]> {
  try {
    const result = await promise;
    return [null, result];
  } catch (error) {
    return [error as E, null];
  }
}

// ============================================
// ID Generation Utilities
// ============================================

/**
 * ランダムな文字列IDを生成する
 * @param length - 生成するIDの長さ（デフォルト: 21）
 * @returns ランダムなID
 */
export function generateId(length: number = 21): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
