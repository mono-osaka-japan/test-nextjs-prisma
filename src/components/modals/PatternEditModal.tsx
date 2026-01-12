"use client";

import { useState, useEffect } from "react";
import { usePatternDetail } from "@/hooks/usePatterns";
import { StepItem } from "@/components/features/patterns/StepItem";
import { StepForm } from "@/components/features/patterns/StepForm";
import type { StepAction, PatternStep } from "@/types/pattern";

interface PatternEditModalProps {
  patternId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
  authorId: string;
}

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

export default PatternEditModal;
