"use client";

import { useState, useEffect } from "react";
import { usePatternTest, usePatternDetail } from "@/hooks/usePatterns";
import type { PatternTestResult } from "@/types/pattern";

interface PatternTestModalProps {
  patternId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function PatternTestModal({
  patternId,
  isOpen,
  onClose,
}: PatternTestModalProps) {
  const { pattern, fetchPattern } = usePatternDetail(patternId);
  const { results, loading, error, runTest, fetchResults } = usePatternTest(patternId);
  const [inputJson, setInputJson] = useState("{}");
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (isOpen && patternId) {
      fetchPattern(patternId);
      fetchResults();
    }
  }, [isOpen, patternId, fetchPattern, fetchResults]);

  const handleRunTest = async () => {
    try {
      const input = JSON.parse(inputJson);
      setIsRunning(true);
      await runTest(input);
    } catch (err) {
      if (err instanceof SyntaxError) {
        alert("入力JSONが不正です");
      } else {
        console.error("Test failed:", err);
      }
    } finally {
      setIsRunning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-900 rounded-lg shadow-xl">
        <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            パターンテスト
            {pattern && (
              <span className="text-zinc-500 dark:text-zinc-400 font-normal ml-2">
                - {pattern.name}
              </span>
            )}
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Test Input Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
              テスト入力
            </h3>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                入力データ (JSON)
              </label>
              <textarea
                value={inputJson}
                onChange={(e) => setInputJson(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder='{"key": "value"}'
              />
            </div>
            <button
              onClick={handleRunTest}
              disabled={isRunning || loading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isRunning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  テスト実行中...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  テスト実行
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
              {error}
            </div>
          )}

          {/* Pattern Steps Overview */}
          {pattern && pattern.steps.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
                実行ステップ
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                {pattern.steps.map((step, index) => (
                  <div
                    key={step.id}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                      step.isEnabled
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 line-through"
                    }`}
                  >
                    <span className="font-medium">{index + 1}.</span>
                    <span>{step.name}</span>
                    {index < pattern.steps.length - 1 && (
                      <svg className="w-4 h-4 ml-1 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Test Results Section */}
          <div className="border-t border-zinc-200 dark:border-zinc-700 pt-6 space-y-4">
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
              テスト結果履歴
            </h3>
            {loading && !isRunning && (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
              </div>
            )}
            {results.length === 0 && !loading ? (
              <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                テスト結果がありません
              </div>
            ) : (
              <div className="space-y-3">
                {results.map((result) => (
                  <TestResultCard key={result.id} result={result} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface TestResultCardProps {
  result: PatternTestResult;
}

function TestResultCard({ result }: TestResultCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const statusConfig = {
    PENDING: {
      label: "待機中",
      bgColor: "bg-zinc-100 dark:bg-zinc-800",
      textColor: "text-zinc-600 dark:text-zinc-400",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    RUNNING: {
      label: "実行中",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      textColor: "text-blue-600 dark:text-blue-400",
      icon: (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
      ),
    },
    SUCCESS: {
      label: "成功",
      bgColor: "bg-green-100 dark:bg-green-900/30",
      textColor: "text-green-600 dark:text-green-400",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
    FAILED: {
      label: "失敗",
      bgColor: "bg-red-100 dark:bg-red-900/30",
      textColor: "text-red-600 dark:text-red-400",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
    },
  };

  const status = statusConfig[result.status as keyof typeof statusConfig] || statusConfig.PENDING;

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const parseJson = (str: string | null | Record<string, unknown>): unknown => {
    if (!str) return null;
    if (typeof str === "object") return str;
    try {
      return JSON.parse(str);
    } catch {
      return str;
    }
  };

  return (
    <div className={`border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden`}>
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${status.bgColor} ${status.textColor}`}>
            {status.icon}
            <span className="text-sm font-medium">{status.label}</span>
          </div>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {formatDate(result.createdAt)}
          </span>
          {result.duration !== null && (
            <span className="text-sm text-zinc-400 dark:text-zinc-500">
              ({result.duration}ms)
            </span>
          )}
        </div>
        <svg
          className={`w-5 h-5 text-zinc-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {isExpanded && (
        <div className="border-t border-zinc-200 dark:border-zinc-700 p-4 space-y-4 bg-zinc-50 dark:bg-zinc-800/30">
          {result.error && (
            <div>
              <h4 className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">
                エラー
              </h4>
              <pre className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-md text-sm overflow-x-auto">
                {result.error}
              </pre>
            </div>
          )}

          {result.input && (
            <div>
              <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                入力
              </h4>
              <pre className="p-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-md text-sm overflow-x-auto">
                {JSON.stringify(parseJson(result.input), null, 2)}
              </pre>
            </div>
          )}

          {result.output && (
            <div>
              <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                出力
              </h4>
              <pre className="p-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-md text-sm overflow-x-auto max-h-64 overflow-y-auto">
                {JSON.stringify(parseJson(result.output), null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PatternTestModal;
