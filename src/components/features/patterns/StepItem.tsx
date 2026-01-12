"use client";

import { useState, useEffect } from "react";
import type { StepAction, PatternStep } from "@/types/pattern";
import { STEP_ACTIONS } from "./constants";

export interface StepItemProps {
  step: PatternStep;
  index: number;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (data: Partial<PatternStep>) => void;
  onCancel: () => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  isDragging: boolean;
}

export function StepItem({
  step,
  index,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging,
}: StepItemProps) {
  const [name, setName] = useState(step.name);
  const [description, setDescription] = useState(step.description || "");
  const [action, setAction] = useState<StepAction>(step.action as StepAction);
  const [config, setConfig] = useState(
    typeof step.config === "string" ? step.config : JSON.stringify(step.config, null, 2)
  );
  const [isEnabled, setIsEnabled] = useState(step.isEnabled);

  useEffect(() => {
    setName(step.name);
    setDescription(step.description || "");
    setAction(step.action as StepAction);
    setConfig(typeof step.config === "string" ? step.config : JSON.stringify(step.config, null, 2));
    setIsEnabled(step.isEnabled);
  }, [step]);

  const handleSave = () => {
    try {
      const parsedConfig = JSON.parse(config);
      onSave({ name, description, action, config: parsedConfig, isEnabled });
    } catch {
      alert("設定のJSONが不正です");
    }
  };

  const actionInfo = STEP_ACTIONS.find((a) => a.value === step.action);

  if (isEditing) {
    return (
      <div className="border border-blue-300 dark:border-blue-700 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              ステップ名
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              アクション
            </label>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value as StepAction)}
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            >
              {STEP_ACTIONS.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label} - {a.description}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              説明
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              設定 (JSON)
            </label>
            <textarea
              value={config}
              onChange={(e) => setConfig(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`step-enabled-${step.id}`}
              checked={isEnabled}
              onChange={(e) => setIsEnabled(e.target.checked)}
              className="rounded border-zinc-300 dark:border-zinc-600"
            />
            <label
              htmlFor={`step-enabled-${step.id}`}
              className="text-sm text-zinc-700 dark:text-zinc-300"
            >
              有効
            </label>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
            >
              保存
            </button>
            <button
              onClick={onCancel}
              className="px-3 py-1.5 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm rounded-md hover:bg-zinc-300 dark:hover:bg-zinc-600"
            >
              キャンセル
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 bg-white dark:bg-zinc-800 cursor-move transition-opacity ${
        isDragging ? "opacity-50" : ""
      } ${!step.isEnabled ? "opacity-60" : ""}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 flex items-center gap-2">
          <span className="text-zinc-400 cursor-grab">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
            </svg>
          </span>
          <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-sm flex items-center justify-center font-medium">
            {index + 1}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-zinc-900 dark:text-zinc-100">
              {step.name}
            </h4>
            <span className="px-2 py-0.5 text-xs rounded-full bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400">
              {actionInfo?.label || step.action}
            </span>
            {!step.isEnabled && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400">
                無効
              </span>
            )}
          </div>
          {step.description && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              {step.description}
            </p>
          )}
        </div>
        <div className="flex gap-1">
          <button
            onClick={onEdit}
            className="p-1.5 text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400"
            title="編集"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-zinc-500 hover:text-red-600 dark:hover:text-red-400"
            title="削除"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default StepItem;
