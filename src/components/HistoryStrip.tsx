"use client";
import { useEffect, useState } from "react";
import { HistoryEntry, getHistory, clearHistory } from "@/lib/history";
import { GRADE_COLOR } from "@/lib/types";

interface Props {
  onSelect: (url: string) => void;
  refreshKey: number;
}

export function HistoryStrip({ onSelect, refreshKey }: Props) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setEntries(getHistory());
  }, [refreshKey]);

  if (entries.length === 0) return null;

  return (
    <div className="mt-6 animate-fade-up">
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[10px] text-yc-muted uppercase tracking-[2px]">
          Recent Analyses
        </span>
        <button
          onClick={() => {
            clearHistory();
            setEntries([]);
          }}
          className="font-mono text-[10px] text-yc-muted/60 hover:text-grade-d bg-transparent border-none cursor-pointer transition-colors"
        >
          Clear
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {entries.map((entry) => {
          const color = GRADE_COLOR[entry.overall_grade] ?? "#888";
          return (
            <button
              key={entry.url}
              onClick={() => onSelect(entry.url)}
              className="flex items-center gap-2 bg-yc-surface border border-yc-border rounded-lg px-3 py-2 cursor-pointer transition-all hover:border-yc-border-light group"
            >
              <span
                className="font-mono text-xs font-black"
                style={{ color }}
              >
                {entry.overall_grade}
              </span>
              <span className="text-[12px] text-yc-dim group-hover:text-yc-text transition-colors truncate max-w-[160px]">
                {entry.company}
              </span>
              <span className="text-[10px] text-yc-muted font-mono">
                {entry.overall_score}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
