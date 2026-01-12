"use client";

import { useState, useEffect, useCallback } from "react";
import { usePatternDetail } from "@/hooks/usePatterns";
import type { StepAction, PatternStep } from "@/types/pattern";

interface PatternEditModalProps {
  patternId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
  authorId: string;
}

const STEP_ACTIONS: { value: StepAction; label: string; description: string }[] = [
  { value: "NOTIFY", label: "通知", description: "メールやSlackで通知を送信" },
  { value: "VALIDATE", label: "検証", description: "入力データを検証" },
  { value: "TRANSFORM", label: "変換", description: "データを変換・加工" },
  { value: "WEBHOOK", label: "Webhook", description: "外部APIを呼び出し" },
  { value: "CONDITION", label: "条件分岐", description: "条件に基づいて処理を分岐" },
  { value: "DELAY", label: "遅延", description: "指定時間待機" },
];

export function PatternEditModal({
  patternId,
  isOpen,
  onClose,
  onSave,
  authorId,
}: PatternEditModalProps) {
  const {
    pattern,
    loading,
    error,
    fetchPattern,
    updatePattern,
    addStep,
    updateStep,
    deleteStep,
    reorderSteps,
  } = usePatternDetail(patternId);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [editingStep, setEditingStep] = useState<PatternStep | null>(null);
  const [isAddingStep, setIsAddingStep] = useState(false);
  const [draggedStepId, setDraggedStepId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && patternId) {
      fetchPattern(patternId);
    }
  }, [isOpen, patternId, fetchPattern]);

  useEffect(() => {
    if (pattern) {
      setName(pattern.name);
      setDescription(pattern.description || "");
      setIsActive(pattern.isActive);
    }
  }, [pattern]);

  const handleSavePattern = async () => {
    try {
      await updatePattern({ name, description, isActive });
      onSave?.();
    } catch (err) {
      console.error("Failed to save pattern:", err);
    }
  };

  const handleAddStep = async (stepData: {
    name: string;
    action: StepAction;
    description: string;
    config: Record<string, unknown>;
  }) => {
    try {
      await addStep(stepData);
      setIsAddingStep(false);
    } catch (err) {
      console.error("Failed to add step:", err);
    }
  };

  const handleUpdateStep = async (
    stepId: string,
    stepData: Partial<PatternStep>
  ) => {
    try {
      await updateStep(stepId, {
        ...stepData,
        description: stepData.description ?? undefined,
      });
      setEditingStep(null);
    } catch (err) {
      console.error("Failed to update step:", err);
    }
  };

  const handleDeleteStep = async (stepId: string) => {
    if (!confirm("このステップを削除しますか？")) return;
    try {
      await deleteStep(stepId);
    } catch (err) {
      console.error("Failed to delete step:", err);
    }
  };

  const handleDragStart = (stepId: string) => {
    setDraggedStepId(stepId);
  };

  const handleDragOver = (e: React.DragEvent, targetStepId: string) => {
    e.preventDefault();
    if (!draggedStepId || draggedStepId === targetStepId) return;
  };

  const handleDrop = async (targetStepId: string) => {
    if (!draggedStepId || !pattern) return;

    const steps = [...pattern.steps];
    const draggedIndex = steps.findIndex((s) => s.id === draggedStepId);
    const targetIndex = steps.findIndex((s) => s.id === targetStepId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const [removed] = steps.splice(draggedIndex, 1);
    steps.splice(targetIndex, 0, removed);

    try {
      await reorderSteps(steps.map((s) => s.id));
    } catch (err) {
      console.error("Failed to reorder steps:", err);
    }

    setDraggedStepId(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-900 rounded-lg shadow-xl">
        <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            パターン編集
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
          {loading && (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
              {error}
            </div>
          )}

          {!loading && pattern && (
            <>
              {/* Pattern Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    パターン名
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="パターン名を入力"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    説明
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="パターンの説明を入力"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded border-zinc-300 dark:border-zinc-600"
                  />
                  <label
                    htmlFor="isActive"
                    className="text-sm text-zinc-700 dark:text-zinc-300"
                  >
                    有効
                  </label>
                </div>
                <button
                  onClick={handleSavePattern}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  パターン情報を保存
                </button>
              </div>

              {/* Steps Section */}
              <div className="border-t border-zinc-200 dark:border-zinc-700 pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
                    ステップ
                  </h3>
                  <button
                    onClick={() => setIsAddingStep(true)}
                    className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    ステップ追加
                  </button>
                </div>

                {pattern.steps.length === 0 ? (
                  <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                    ステップがありません。「ステップ追加」から追加してください。
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pattern.steps.map((step, index) => (
                      <StepItem
                        key={step.id}
                        step={step}
                        index={index}
                        isEditing={editingStep?.id === step.id}
                        onEdit={() => setEditingStep(step)}
                        onSave={(data) => handleUpdateStep(step.id, data)}
                        onCancel={() => setEditingStep(null)}
                        onDelete={() => handleDeleteStep(step.id)}
                        onDragStart={() => handleDragStart(step.id)}
                        onDragOver={(e) => handleDragOver(e, step.id)}
                        onDrop={() => handleDrop(step.id)}
                        isDragging={draggedStepId === step.id}
                      />
                    ))}
                  </div>
                )}

                {isAddingStep && (
                  <StepForm
                    onSave={handleAddStep}
                    onCancel={() => setIsAddingStep(false)}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface StepItemProps {
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

function StepItem({
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

interface StepFormProps {
  onSave: (data: {
    name: string;
    action: StepAction;
    description: string;
    config: Record<string, unknown>;
  }) => void;
  onCancel: () => void;
}

function StepForm({ onSave, onCancel }: StepFormProps) {
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

export default PatternEditModal;
