"use client";
import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
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
        <span className="font-mono text-[10px] text-yc-dim uppercase tracking-[2px]">
          Recent Analyses
        </span>
        <button
          onClick={() => {
            clearHistory();
            setEntries([]);
          }}
          className="inline-flex items-center gap-1 font-mono text-[10px] text-yc-dim/70 hover:text-grade-d bg-transparent border-none cursor-pointer transition-colors duration-200"
          aria-label="Clear analysis history"
        >
          <Trash2 className="w-3 h-3" strokeWidth={2.25} aria-hidden />
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
              className="flex items-center gap-2 bg-yc-surface border border-yc-border rounded-lg px-3 py-2 cursor-pointer transition-colors duration-200 hover:border-yc-accent/40 group"
              aria-label={`Re-analyze ${entry.company}, grade ${entry.overall_grade}`}
            >
              <span
                className="font-display text-xs font-black"
                style={{ color }}
              >
                {entry.overall_grade}
              </span>
              <span className="text-[12px] text-yc-text/80 group-hover:text-yc-text transition-colors duration-200 truncate max-w-[160px]">
                {entry.company}
              </span>
              <span className="text-[10px] text-yc-dim font-mono">
                {entry.overall_score}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
