"use client";
import { useEffect, useState } from "react";
import { AnalysisResult, CRITERIA_META, GRADE_BG, GRADE_COLOR } from "@/lib/types";

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
    <div className="h-[3px] bg-[#1a1a1a] rounded-sm mt-2.5">
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {CRITERIA_META.map((meta, i) => {
        const result = criteria[meta.key];
        const color = GRADE_COLOR[result.grade] ?? "#888";
        return (
          <div
            key={meta.key}
            className="rounded-xl p-[18px_20px] animate-fade-up"
            style={{
              background: GRADE_BG[result.grade] ?? "#0d0d0d",
              border: `1px solid ${color}2a`,
              animationDelay: `${i * 80}ms`,
            }}
          >
            <div className="flex justify-between items-start gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-[7px] mb-1.5">
                  <span style={{ color }} className="text-sm">{meta.icon}</span>
                  <span className="font-mono text-[10px] text-yc-muted uppercase tracking-[2px]">
                    {meta.label}
                  </span>
                </div>
                <p className="m-0 text-[13px] text-[#bbb] leading-[1.65]">
                  {result.summary}
                </p>
              </div>
              <div
                className="font-mono text-[26px] font-black shrink-0"
                style={{ color, textShadow: `0 0 16px ${color}66` }}
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
