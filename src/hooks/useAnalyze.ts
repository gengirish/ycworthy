// src/hooks/useAnalyze.ts
"use client";
import { useState } from "react";
import { AIProvider, AnalysisResult } from "@/lib/types";

interface UseAnalyzeReturn {
  result: AnalysisResult | null;
  loading: boolean;
  error: string | null;
  provider: AIProvider | null;
  durationMs: number | null;
  analyze: (url: string, provider: AIProvider) => Promise<void>;
  reset: () => void;
}

export function useAnalyze(): UseAnalyzeReturn {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<AIProvider | null>(null);
  const [durationMs, setDurationMs] = useState<number | null>(null);

  const analyze = async (url: string, selectedProvider: AIProvider) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setProvider(null);
    setDurationMs(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, provider: selectedProvider }),
      });

      const json = await res.json();

      if (!res.ok || json.error) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }

      setResult(json.data);
      setProvider(json.provider);
      setDurationMs(json.duration_ms ?? null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
    setProvider(null);
    setDurationMs(null);
  };

  return { result, loading, error, provider, durationMs, analyze, reset };
}
