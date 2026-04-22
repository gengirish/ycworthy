"use client";
import { useEffect, useState } from "react";
import { AnalysisResult, GRADE_BG, GRADE_COLOR } from "@/lib/types";
import { CRITERIA_META } from "@/lib/criteria";

interface Props {
  criteria: AnalysisResult["criteria"];
}

function ScoreBar({ score, grade }: { score: number; grade: string }) {
  const color = GRADE_COLOR[grade as keyof typeof GRADE_COLOR] ?? "#888";
  const [w, setW] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setW(score), 150);
    return () => clearTimeout(t);
  }, [score]);

  return (
    <div
      className="h-[3px] bg-[#1a1a1a] rounded-sm mt-3"
      role="progressbar"
      aria-valuenow={score}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Score ${score} of 100`}
    >
      <div
        className="h-full rounded-sm transition-[width] duration-[1300ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          width: `${w}%`,
          background: `linear-gradient(90deg, ${color}88, ${color})`,
          boxShadow: `0 0 6px ${color}88`,
        }}
      />
    </div>
  );
}

export function CriteriaGrid({ criteria }: Props) {
  return (
    // Bento Grid Showcase pattern — first card highlighted, others stacked.
    <div className="grid grid-cols-1 md:grid-cols-6 gap-3 auto-rows-fr">
      {CRITERIA_META.map((meta, i) => {
        const result = criteria[meta.key];
        const color = GRADE_COLOR[result.grade] ?? "#888";
        const Icon = meta.Icon;

        // Bento sizing: highlight `problem` (hero criterion) as wide on md+
        const span =
          meta.key === "problem"
            ? "md:col-span-4"
            : meta.key === "market"
            ? "md:col-span-2"
            : "md:col-span-3";

        return (
          <div
            key={meta.key}
            className={`group relative rounded-2xl p-5 sm:p-[18px_22px] animate-fade-up overflow-hidden transition-colors duration-200 ${span}`}
            style={{
              background: GRADE_BG[result.grade] ?? "#0d0d0d",
              border: `1px solid ${color}2a`,
              animationDelay: `${i * 80}ms`,
            }}
          >
            {/* Subtle radial accent in top-right */}
            <div
              className="absolute -top-12 -right-12 w-40 h-40 pointer-events-none opacity-60 transition-opacity duration-300 group-hover:opacity-100"
              style={{
                background: `radial-gradient(circle, ${color}22, transparent 70%)`,
              }}
            />

            <div className="flex justify-between items-start gap-3 relative z-10">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="inline-flex items-center justify-center w-7 h-7 rounded-md"
                    style={{
                      background: `${color}1a`,
                      border: `1px solid ${color}33`,
                      color,
                    }}
                  >
                    <Icon className="w-4 h-4" strokeWidth={2.25} aria-hidden />
                  </span>
                  <span className="font-mono text-[10px] text-yc-dim uppercase tracking-[2px]">
                    {meta.label}
                  </span>
                </div>
                <p className="m-0 text-[13.5px] text-[#cfcfcf] leading-[1.65]">
                  {result.summary}
                </p>
              </div>
              <div
                className="font-display font-black text-[28px] leading-none shrink-0"
                style={{ color, textShadow: `0 0 16px ${color}55` }}
                aria-label={`Grade ${result.grade}`}
              >
                {result.grade}
              </div>
            </div>
            <ScoreBar score={result.score} grade={result.grade} />
          </div>
        );
      })}
    </div>
  );
}
