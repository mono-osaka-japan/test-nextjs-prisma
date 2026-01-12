"use client";

import { useState } from "react";
import { Modal, Button, Input, Badge } from "@/components/ui";
import type { UrlAnalysisResult, AuthConfig, AuthType } from "@/types/campaign";
import { AuthTypeLabel } from "@/types/campaign";

interface UrlAnalyzerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply?: (result: {
    url: string;
    authType: AuthType | null;
    authConfig: AuthConfig | null;
  }) => void;
  initialUrl?: string;
}

export function UrlAnalyzerModal({
  isOpen,
  onClose,
  onApply,
  initialUrl = "",
}: UrlAnalyzerModalProps) {
  const [url, setUrl] = useState(initialUrl);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<UrlAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!url.trim()) {
      setError("URLを入力してください");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/campaigns/analyze-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "解析に失敗しました");
      }

      const data: UrlAnalysisResult = await response.json();

      if (!data.isValid) {
        setError(data.error || "無効なURLです");
        return;
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApply = () => {
    if (!result) return;

    onApply?.({
      url: result.url,
      authType: result.authType,
      authConfig: result.authConfig,
    });
    handleClose();
  };

  const handleClose = () => {
    setUrl("");
    setResult(null);
    setError(null);
    onClose();
  };

  const renderAuthInfo = () => {
    if (!result?.authType || !result?.authConfig) {
      return (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            認証情報は検出されませんでした
          </p>
        </div>
      );
    }

    return (
      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="success">認証情報を検出</Badge>
          <span className="text-sm font-medium">
            {AuthTypeLabel[result.authType as keyof typeof AuthTypeLabel]}
          </span>
        </div>

        <div className="space-y-2 text-sm">
          {result.authConfig.username && (
            <div className="flex justify-between">
              <span className="text-gray-500">ユーザー名:</span>
              <code className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">
                {result.authConfig.username}
              </code>
            </div>
          )}
          {result.authConfig.password && (
            <div className="flex justify-between">
              <span className="text-gray-500">パスワード:</span>
              <code className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">
                {"*".repeat(result.authConfig.password.length)}
              </code>
            </div>
          )}
          {result.authConfig.token && (
            <div className="flex justify-between">
              <span className="text-gray-500">トークン:</span>
              <code className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded truncate max-w-[200px]">
                {result.authConfig.token.substring(0, 10)}...
              </code>
            </div>
          )}
          {result.authConfig.apiKey && (
            <div className="flex justify-between">
              <span className="text-gray-500">APIキー:</span>
              <code className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded truncate max-w-[200px]">
                {result.authConfig.apiKey.substring(0, 10)}...
              </code>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderUrlInfo = () => {
    if (!result) return null;

    return (
      <div className="space-y-4">
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">
            解析結果
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">プロトコル:</span>
              <span>{result.protocol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">ホスト:</span>
              <span>{result.host}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">パス:</span>
              <span className="truncate max-w-[200px]">{result.path || "/"}</span>
            </div>
          </div>
        </div>

        {/* クエリパラメータ */}
        {Object.keys(result.queryParams).length > 0 && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
              クエリパラメータ
            </h4>
            <div className="space-y-1 text-sm">
              {Object.entries(result.queryParams).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <code className="text-gray-500">{key}:</code>
                  <code className="truncate max-w-[200px]">{value}</code>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 認証情報 */}
        {renderAuthInfo()}

        {/* クリーンURL */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
            正規化されたURL
          </h4>
          <p className="text-sm break-all font-mono">{result.url}</p>
        </div>
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="URL解析"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose}>
            キャンセル
          </Button>
          {result && onApply && (
            <Button onClick={handleApply}>
              この設定を適用
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://user:pass@example.com/api?api_key=xxx"
              onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
            />
          </div>
          <Button onClick={handleAnalyze} loading={isAnalyzing}>
            解析
          </Button>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400">
          URLを入力すると、認証情報（Basic認証、Bearer Token、APIキーなど）を自動検出します。
        </p>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        {result && renderUrlInfo()}
      </div>
    </Modal>
  );
}
