"use client";

import { useState, useEffect } from "react";
import { PatternList, CreatePatternModal } from "@/components/features/patterns";
import { PatternEditModal, PatternTestModal } from "@/components/modals";
import type { Pattern } from "@/types/pattern";

// Demo user ID - in production, this would come from auth
const DEMO_USER_ID = "demo-user-id";

export default function PatternsPage() {
  const [selectedPattern, setSelectedPattern] = useState<Pattern | null>(null);
  const [testingPattern, setTestingPattern] = useState<Pattern | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handlePatternCreated = (patternId: string) => {
    // After creating, open the edit modal for the new pattern
    setSelectedPattern({ id: patternId } as Pattern);
    setRefreshKey((k) => k + 1);
  };

  const handleEditClose = () => {
    setSelectedPattern(null);
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            パターン管理
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            自動化パターンの作成・編集・テストを行います
          </p>
        </header>

        <PatternList
          key={refreshKey}
          authorId={DEMO_USER_ID}
          onSelectPattern={setSelectedPattern}
          onCreatePattern={() => setIsCreateModalOpen(true)}
          onTestPattern={setTestingPattern}
        />

        <CreatePatternModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreated={handlePatternCreated}
          authorId={DEMO_USER_ID}
        />

        {selectedPattern && (
          <PatternEditModal
            patternId={selectedPattern.id}
            isOpen={true}
            onClose={handleEditClose}
            onSave={() => setRefreshKey((k) => k + 1)}
            authorId={DEMO_USER_ID}
          />
        )}

        {testingPattern && (
          <PatternTestModal
            patternId={testingPattern.id}
            isOpen={true}
            onClose={() => setTestingPattern(null)}
          />
        )}
      </div>
    </div>
  );
}
