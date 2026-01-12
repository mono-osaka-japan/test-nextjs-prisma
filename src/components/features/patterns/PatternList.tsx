"use client";

import { useEffect, useState } from "react";
import { usePatterns } from "@/hooks/usePatterns";
import type { Pattern } from "@/types/pattern";

interface PatternListProps {
  authorId?: string;
  onSelectPattern: (pattern: Pattern) => void;
  onCreatePattern: () => void;
  onTestPattern: (pattern: Pattern) => void;
}

export function PatternList({
  authorId,
  onSelectPattern,
  onCreatePattern,
  onTestPattern,
}: PatternListProps) {
  const { patterns, loading, error, fetchPatterns, deletePattern } = usePatterns();
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");

  useEffect(() => {
    fetchPatterns(authorId);
  }, [authorId, fetchPatterns]);

  const filteredPatterns = patterns.filter((pattern) => {
    if (filter === "active") return pattern.isActive;
    if (filter === "inactive") return !pattern.isActive;
    return true;
  });

  const handleDelete = async (e: React.MouseEvent, patternId: string) => {
    e.stopPropagation();
    if (!confirm("このパターンを削除しますか？")) return;
    try {
      await deletePattern(patternId);
    } catch (err) {
      console.error("Failed to delete pattern:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              filter === "all"
                ? "bg-blue-600 text-white"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            }`}
          >
            すべて ({patterns.length})
          </button>
          <button
            onClick={() => setFilter("active")}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              filter === "active"
                ? "bg-green-600 text-white"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            }`}
          >
            有効 ({patterns.filter((p) => p.isActive).length})
          </button>
          <button
            onClick={() => setFilter("inactive")}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              filter === "inactive"
                ? "bg-zinc-600 text-white"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            }`}
          >
            無効 ({patterns.filter((p) => !p.isActive).length})
          </button>
        </div>
        <button
          onClick={onCreatePattern}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新規作成
        </button>
      </div>

      {filteredPatterns.length === 0 ? (
        <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
          パターンがありません
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPatterns.map((pattern) => (
            <PatternCard
              key={pattern.id}
              pattern={pattern}
              onSelect={() => onSelectPattern(pattern)}
              onTest={() => onTestPattern(pattern)}
              onDelete={(e) => handleDelete(e, pattern.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface PatternCardProps {
  pattern: Pattern;
  onSelect: () => void;
  onTest: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

function PatternCard({ pattern, onSelect, onTest, onDelete }: PatternCardProps) {
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div
      onClick={onSelect}
      className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 bg-white dark:bg-zinc-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate pr-2">
          {pattern.name}
        </h3>
        <span
          className={`flex-shrink-0 px-2 py-0.5 text-xs rounded-full ${
            pattern.isActive
              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
              : "bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400"
          }`}
        >
          {pattern.isActive ? "有効" : "無効"}
        </span>
      </div>

      {pattern.description && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3 line-clamp-2">
          {pattern.description}
        </p>
      )}

      <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 mb-3">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <span>{pattern.steps.length} ステップ</span>
        <span className="text-zinc-300 dark:text-zinc-600">|</span>
        <span>{formatDate(pattern.updatedAt)}</span>
      </div>

      {pattern.steps.length > 0 && (
        <div className="flex items-center gap-1 mb-3 overflow-hidden">
          {pattern.steps.slice(0, 4).map((step, i) => (
            <span
              key={step.id}
              className={`px-2 py-0.5 text-xs rounded ${
                step.isEnabled
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                  : "bg-zinc-100 dark:bg-zinc-700 text-zinc-500"
              }`}
            >
              {step.name.length > 8 ? `${step.name.slice(0, 8)}...` : step.name}
            </span>
          ))}
          {pattern.steps.length > 4 && (
            <span className="text-xs text-zinc-400">+{pattern.steps.length - 4}</span>
          )}
        </div>
      )}

      <div className="flex gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-700">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTest();
          }}
          className="flex-1 px-3 py-1.5 text-sm bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors flex items-center justify-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          </svg>
          テスト
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          className="flex-1 px-3 py-1.5 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors flex items-center justify-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          編集
        </button>
        <button
          onClick={onDelete}
          className="px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default PatternList;
