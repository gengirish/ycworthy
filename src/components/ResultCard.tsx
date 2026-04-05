"use client";
import { AIProvider, AnalysisResult, GRADE_COLOR } from "@/lib/types";
import { GradeRing } from "./GradeRing";
import { CriteriaGrid } from "./CriteriaGrid";

const LIKELIHOOD_COLOR: Record<string, string> = {
  Unlikely: "#FF6B6B",
  Possible: "#FF9F43",
  Probable: "#FFE048",
  Strong: "#00FFB2",
};

interface Props {
  result: AnalysisResult;
  provider: AIProvider | null;
  durationMs: number | null;
  onReset: () => void;
}

export function ResultCard({ result, provider, durationMs, onReset }: Props) {
  const gradeColor = GRADE_COLOR[result.overall_grade] ?? "#888";
  const likColor = LIKELIHOOD_COLOR[result.yc_likelihood] ?? "#888";

  return (
    <div className="animate-fade-up">
      {/* Verdict header */}
      <div
        className="bg-yc-surface rounded-2xl p-7 mb-4 relative overflow-hidden"
        style={{ border: `1px solid ${gradeColor}30` }}
      >
        <div
          className="absolute -top-10 -right-10 w-[200px] h-[200px] pointer-events-none"
          style={{ background: `radial-gradient(circle, ${gradeColor}12, transparent 70%)` }}
        />

        <div className="flex gap-[22px] items-start flex-wrap relative z-10">
          <GradeRing grade={result.overall_grade} size={88} />
          <div className="flex-1 min-w-[220px]">
            <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
              <h2 className="m-0 text-[22px] font-bold tracking-[-0.5px] text-[#f0f0f0]">
                {result.company}
              </h2>
              <span
                className="font-mono text-[10px] px-2.5 py-[3px] rounded-full font-bold tracking-[1px] uppercase"
                style={{
                  background: `${likColor}18`,
                  color: likColor,
                  border: `1px solid ${likColor}40`,
                }}
              >
                {result.yc_likelihood} chance
              </span>
            </div>
            <p className="m-0 mb-2.5 text-yc-muted text-[13px] italic">
              {result.tagline}
            </p>
            <p className="m-0 text-sm text-[#c0c0c0] leading-[1.75]">
              {result.verdict}
            </p>
          </div>
        </div>

        {/* Meta strip */}
        <div className="mt-5 pt-4 border-t border-[#1a1a1a] flex gap-5 flex-wrap">
          {[
            { label: "Overall Score", val: `${result.overall_score}/100` },
            { label: "Provider", val: provider === "claude" ? "Claude Sonnet" : "Gemini 1.5 Pro" },
            { label: "Analysis Time", val: durationMs ? `${(durationMs / 1000).toFixed(1)}s` : "—" },
          ].map((m) => (
            <div key={m.label}>
              <div className="font-mono text-[10px] text-yc-muted uppercase tracking-[2px]">
                {m.label}
              </div>
              <div className="font-mono text-sm text-yc-dim mt-0.5">
                {m.val}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Criteria */}
      <CriteriaGrid criteria={result.criteria} />

      {/* Flags */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
        {[
          { title: "Green Flags", icon: "▲", items: result.green_flags, color: "#00FFB2", check: "✓" },
          { title: "Red Flags", icon: "▼", items: result.red_flags, color: "#FF6B6B", check: "✗" },
        ].map((panel) => (
          <div
            key={panel.title}
            className="bg-yc-surface rounded-xl p-[18px_20px]"
            style={{ border: `1px solid ${panel.color}20` }}
          >
            <div
              className="font-mono text-[10px] tracking-[2px] uppercase mb-3"
              style={{ color: panel.color }}
            >
              {panel.icon} {panel.title}
            </div>
            <ul className="m-0 p-0 list-none">
              {panel.items.map((item, i) => (
                <li
                  key={i}
                  className="text-[13px] text-[#aaa] py-[7px] pl-[18px] relative leading-relaxed"
                  style={{
                    borderBottom: i < panel.items.length - 1 ? "1px solid #181818" : "none",
                  }}
                >
                  <span
                    className="absolute left-0 font-mono"
                    style={{ color: panel.color }}
                  >
                    {panel.check}
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* YC Interview Question */}
      <div className="bg-yc-surface border border-yc-accent/19 rounded-xl p-[18px_20px] mt-4">
        <div className="font-mono text-[10px] text-yc-accent tracking-[2px] uppercase mb-2.5">
          ◈ The YC Partner Would Ask...
        </div>
        <p className="m-0 text-[15px] text-[#e0e0e0] italic leading-[1.75]">
          &ldquo;{result.yc_interview_question}&rdquo;
        </p>
      </div>

      {/* Reset */}
      <div className="text-center mt-8">
        <button
          onClick={onReset}
          className="bg-transparent border border-yc-border text-yc-muted px-7 py-2.5 rounded-lg cursor-pointer font-mono text-xs tracking-[1px] uppercase transition-all hover:border-yc-border-light hover:text-yc-dim"
        >
          ← Analyze Another
        </button>
      </div>
    </div>
  );
}
