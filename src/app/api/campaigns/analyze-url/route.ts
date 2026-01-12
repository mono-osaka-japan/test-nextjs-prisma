import { NextRequest, NextResponse } from "next/server";
import type { AuthType, AuthConfig, UrlAnalysisResult } from "@/types/campaign";

// POST /api/campaigns/analyze-url - URL解析
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { message: "URLは必須です" },
        { status: 400 }
      );
    }

    const result = analyzeUrl(url);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to analyze URL:", error);
    return NextResponse.json(
      { message: "URLの解析に失敗しました" },
      { status: 500 }
    );
  }
}

function analyzeUrl(urlString: string): UrlAnalysisResult {
  try {
    // URLの正規化
    let normalizedUrl = urlString.trim();
    if (!normalizedUrl.match(/^https?:\/\//i)) {
      normalizedUrl = "https://" + normalizedUrl;
    }

    const url = new URL(normalizedUrl);

    // クエリパラメータを抽出
    const queryParams: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });

    // 認証情報を検出
    let authType: AuthType | null = null;
    let authConfig: AuthConfig | null = null;
    const headers: Record<string, string> = {};

    // Basic認証 (URLに含まれる場合)
    if (url.username && url.password) {
      authType = "BASIC";
      authConfig = {
        username: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password),
      };
      // URLからクレデンシャルを削除
      url.username = "";
      url.password = "";
    }

    // クエリパラメータから認証情報を検出
    const apiKeyParams = ["api_key", "apikey", "api-key", "key", "token", "access_token", "auth"];
    for (const param of apiKeyParams) {
      const value = queryParams[param];
      if (value) {
        if (!authType) {
          // Bearer token風のパラメータ
          if (param === "token" || param === "access_token" || param === "auth") {
            authType = "BEARER";
            authConfig = { token: value };
          } else {
            authType = "API_KEY";
            authConfig = {
              apiKey: value,
              apiKeyHeader: `X-API-Key`, // デフォルトヘッダー名
            };
          }
        }
        // 検出された認証パラメータを記録
        headers[`X-Detected-Auth-Param`] = param;
        break;
      }
    }

    // Authorizationヘッダー形式の検出（URL fragment等）
    const hash = url.hash;
    if (hash) {
      const hashParams = new URLSearchParams(hash.slice(1));
      const accessToken = hashParams.get("access_token");
      if (accessToken && !authType) {
        authType = "BEARER";
        authConfig = { token: accessToken };
      }
    }

    return {
      url: url.toString(),
      host: url.host,
      protocol: url.protocol.replace(":", ""),
      path: url.pathname,
      authType,
      authConfig,
      headers,
      queryParams,
      isValid: true,
    };
  } catch (error) {
    return {
      url: urlString,
      host: "",
      protocol: "",
      path: "",
      authType: null,
      authConfig: null,
      headers: {},
      queryParams: {},
      isValid: false,
      error: error instanceof Error ? error.message : "Invalid URL",
    };
  }
}
