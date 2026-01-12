"use client";

import { useState } from "react";
import type { StepAction } from "@/types/pattern";
import { STEP_ACTIONS } from "./constants";

export interface StepFormProps {
  onSave: (data: {
    name: string;
    action: StepAction;
    description: string;
    config: Record<string, unknown>;
  }) => void;
  onCancel: () => void;
}

export function StepForm({ onSave, onCancel }: StepFormProps) {
  const [name, setName] = useState("");
  const [action, setAction] = useState<StepAction>("NOTIFY");
  const [description, setDescription] = useState("");
  const [config, setConfig] = useState("{}");

  const handleSubmit = () => {
    if (!name.trim()) {
      alert("ステップ名を入力してください");
      return;
    }
    try {
      const parsedConfig = JSON.parse(config);
      onSave({ name, action, description, config: parsedConfig });
    } catch {
      alert("設定のJSONが不正です");
    }
  };

  return (
    <div className="mt-4 border border-green-300 dark:border-green-700 rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
      <h4 className="font-medium text-zinc-900 dark:text-zinc-100 mb-3">
        新しいステップ
      </h4>
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
            placeholder="例: メール通知を送信"
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
            placeholder="このステップの説明"
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
            placeholder='{"message": "通知メッセージ"}'
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
          >
            追加
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

export default StepForm;
