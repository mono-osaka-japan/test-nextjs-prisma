import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
}

export interface AuthResult {
  user: SessionUser | null;
  error: string | null;
}

/**
 * リクエストからセッションユーザーを取得する
 *
 * 認証方式:
 * - 開発環境: X-User-Id ヘッダーによる簡易認証（開発・テスト用）
 * - 本番環境: 認証プロバイダー（NextAuth等）の実装が必要
 *
 * 本番環境での認証:
 * このモジュールは開発用の簡易認証のみを提供します。
 * 本番環境では NextAuth.js 等の認証プロバイダーを導入し、
 * そのセッション管理機能を使用してください。
 *
 * @see https://next-auth.js.org/ NextAuth.js
 */
export async function getSessionUser(request: NextRequest): Promise<AuthResult> {
  try {
    // 開発環境のみ: X-User-Id ヘッダーによる簡易認証
    // 本番環境ではこの認証方式は無効
    if (!isDevelopment()) {
      // 本番環境: この簡易認証モジュールは使用不可
      // NextAuth.js 等の認証プロバイダーを導入してください
      console.warn(
        "[Auth] Production environment requires proper authentication provider (e.g., NextAuth.js). " +
        "This simple auth module is for development only."
      );
      return {
        user: null,
        error: "本番環境では認証プロバイダーの設定が必要です"
      };
    }

    // 開発環境: X-User-Id ヘッダーからユーザーIDを取得
    const userId = request.headers.get("X-User-Id");

    if (!userId) {
      return { user: null, error: "認証が必要です" };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      return { user: null, error: "ユーザーが見つかりません" };
    }

    return { user, error: null };
  } catch (error) {
    console.error("Session error:", error);
    return { user: null, error: "認証エラー" };
  }
}

/**
 * 認証が必要なAPIルートで使用するヘルパー
 * 認証失敗時は NextResponse を返す
 */
export async function requireAuth(request: NextRequest): Promise<AuthResult> {
  return getSessionUser(request);
}

/**
 * 開発・テスト環境チェック
 * development または test 環境の場合に true を返す
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test";
}

/**
 * 開発環境専用: デモユーザーIDを返す
 * 本番では使用しない - seedスクリプトでユーザーを事前作成すること
 *
 * 注意: この関数はユーザーを作成しない
 * デモユーザーは prisma/seed.ts で作成される前提
 */
export function getDemoUserId(): string | null {
  if (!isDevelopment()) {
    return null;
  }
  return "demo-user-id";
}

/**
 * 開発環境専用: デモユーザーを取得
 * 本番では null を返す
 */
export async function getDemoUser(): Promise<SessionUser | null> {
  const demoUserId = getDemoUserId();
  if (!demoUserId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: demoUserId },
    select: { id: true, email: true, name: true },
  });

  return user;
}
