"use client";

import { useState, useCallback } from "react";
import type {
  Pattern,
  PatternStep,
  PatternTestResult,
  CreatePatternRequest,
  UpdatePatternRequest,
  CreateStepRequest,
  UpdateStepRequest,
} from "@/types/pattern";

interface UsePatternsReturn {
  patterns: Pattern[];
  loading: boolean;
  error: string | null;
  fetchPatterns: (authorId?: string) => Promise<void>;
  createPattern: (data: CreatePatternRequest & { authorId: string }) => Promise<Pattern>;
  updatePattern: (id: string, data: UpdatePatternRequest) => Promise<Pattern>;
  deletePattern: (id: string) => Promise<void>;
}

export function usePatterns(): UsePatternsReturn {
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPatterns = useCallback(async (authorId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (authorId) params.set("authorId", authorId);

      const res = await fetch(`/api/patterns?${params}`);
      if (!res.ok) throw new Error("Failed to fetch patterns");

      const data = await res.json();
      setPatterns(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  const createPattern = useCallback(
    async (data: CreatePatternRequest & { authorId: string }): Promise<Pattern> => {
      const res = await fetch("/api/patterns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create pattern");

      const pattern = await res.json();
      setPatterns((prev) => [pattern, ...prev]);
      return pattern;
    },
    []
  );

  const updatePattern = useCallback(
    async (id: string, data: UpdatePatternRequest): Promise<Pattern> => {
      const res = await fetch(`/api/patterns/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update pattern");

      const pattern = await res.json();
      setPatterns((prev) =>
        prev.map((p) => (p.id === id ? pattern : p))
      );
      return pattern;
    },
    []
  );

  const deletePattern = useCallback(async (id: string) => {
    const res = await fetch(`/api/patterns/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete pattern");

    setPatterns((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return {
    patterns,
    loading,
    error,
    fetchPatterns,
    createPattern,
    updatePattern,
    deletePattern,
  };
}

interface UsePatternDetailReturn {
  pattern: Pattern | null;
  loading: boolean;
  error: string | null;
  fetchPattern: (id: string) => Promise<void>;
  updatePattern: (data: UpdatePatternRequest) => Promise<Pattern>;
  addStep: (data: CreateStepRequest) => Promise<PatternStep>;
  updateStep: (stepId: string, data: UpdateStepRequest) => Promise<PatternStep>;
  deleteStep: (stepId: string) => Promise<void>;
  reorderSteps: (stepIds: string[]) => Promise<PatternStep[]>;
}

export function usePatternDetail(patternId?: string): UsePatternDetailReturn {
  const [pattern, setPattern] = useState<Pattern | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPattern = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/patterns/${id}`);
      if (!res.ok) throw new Error("Failed to fetch pattern");

      const data = await res.json();
      setPattern(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePattern = useCallback(
    async (data: UpdatePatternRequest): Promise<Pattern> => {
      if (!patternId) throw new Error("Pattern ID is required");

      const res = await fetch(`/api/patterns/${patternId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update pattern");

      const updated = await res.json();
      setPattern(updated);
      return updated;
    },
    [patternId]
  );

  const addStep = useCallback(
    async (data: CreateStepRequest): Promise<PatternStep> => {
      if (!patternId) throw new Error("Pattern ID is required");

      const res = await fetch(`/api/patterns/${patternId}/steps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to add step");

      const step = await res.json();
      setPattern((prev) =>
        prev
          ? { ...prev, steps: [...prev.steps, step] }
          : null
      );
      return step;
    },
    [patternId]
  );

  const updateStep = useCallback(
    async (stepId: string, data: UpdateStepRequest): Promise<PatternStep> => {
      if (!patternId) throw new Error("Pattern ID is required");

      const res = await fetch(`/api/patterns/${patternId}/steps/${stepId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update step");

      const step = await res.json();
      setPattern((prev) =>
        prev
          ? {
              ...prev,
              steps: prev.steps.map((s) => (s.id === stepId ? step : s)),
            }
          : null
      );
      return step;
    },
    [patternId]
  );

  const deleteStep = useCallback(
    async (stepId: string) => {
      if (!patternId) throw new Error("Pattern ID is required");

      const res = await fetch(`/api/patterns/${patternId}/steps/${stepId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete step");

      setPattern((prev) =>
        prev
          ? { ...prev, steps: prev.steps.filter((s) => s.id !== stepId) }
          : null
      );
    },
    [patternId]
  );

  const reorderSteps = useCallback(
    async (stepIds: string[]): Promise<PatternStep[]> => {
      if (!patternId) throw new Error("Pattern ID is required");

      const res = await fetch(`/api/patterns/${patternId}/steps`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepIds }),
      });
      if (!res.ok) throw new Error("Failed to reorder steps");

      const steps = await res.json();
      setPattern((prev) => (prev ? { ...prev, steps } : null));
      return steps;
    },
    [patternId]
  );

  return {
    pattern,
    loading,
    error,
    fetchPattern,
    updatePattern,
    addStep,
    updateStep,
    deleteStep,
    reorderSteps,
  };
}

interface UsePatternTestReturn {
  results: PatternTestResult[];
  loading: boolean;
  error: string | null;
  runTest: (input?: Record<string, unknown>) => Promise<PatternTestResult>;
  fetchResults: () => Promise<void>;
}

export function usePatternTest(patternId?: string): UsePatternTestReturn {
  const [results, setResults] = useState<PatternTestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runTest = useCallback(
    async (input?: Record<string, unknown>): Promise<PatternTestResult> => {
      if (!patternId) throw new Error("Pattern ID is required");

      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/patterns/${patternId}/test`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input }),
        });
        if (!res.ok) throw new Error("Failed to run test");

        const result = await res.json();
        setResults((prev) => [result, ...prev]);
        return result;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [patternId]
  );

  const fetchResults = useCallback(async () => {
    if (!patternId) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/patterns/${patternId}/test`);
      if (!res.ok) throw new Error("Failed to fetch test results");

      const data = await res.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [patternId]);

  return {
    results,
    loading,
    error,
    runTest,
    fetchResults,
  };
}
