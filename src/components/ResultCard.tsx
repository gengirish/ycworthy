"use client";
import { CheckCircle2, XCircle, MessageSquareQuote, ArrowLeft } from "lucide-react";
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
          aria-hidden
        />

        <div className="flex gap-[22px] items-start flex-wrap relative z-10">
          <GradeRing grade={result.overall_grade} size={88} />
          <div className="flex-1 min-w-[220px]">
            <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
              <h2 className="m-0 font-display text-[24px] font-bold tracking-[-0.5px] text-[#f4f4f4]">
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
            <p className="m-0 mb-2.5 text-yc-dim text-[13px] italic">
              {result.tagline}
            </p>
            <p className="m-0 text-[14px] text-[#d0d0d0] leading-[1.75]">
              {result.verdict}
            </p>
          </div>
        </div>

        {/* Meta strip */}
        <div className="mt-5 pt-4 border-t border-[#1a1a1a] flex gap-5 flex-wrap">
          {[
            { label: "Overall Score", val: `${result.overall_score}/100` },
            {
              label: "Provider",
              val:
                provider === "gemini"
                  ? "Gemini 2.5 Flash"
                  : "NVIDIA Nemotron Ultra 253B",
            },
            { label: "Analysis Time", val: durationMs ? `${(durationMs / 1000).toFixed(1)}s` : "—" },
          ].map((m) => (
            <div key={m.label}>
              <div className="font-mono text-[10px] text-yc-dim uppercase tracking-[2px]">
                {m.label}
              </div>
              <div className="font-mono text-[13px] text-yc-text/85 mt-0.5">
                {m.val}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Criteria (Bento grid) */}
      <CriteriaGrid criteria={result.criteria} />

      {/* Flags */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
        {[
          {
            title: "Green Flags",
            items: result.green_flags,
            color: "#00FFB2",
            Icon: CheckCircle2,
          },
          {
            title: "Red Flags",
            items: result.red_flags,
            color: "#FF6B6B",
            Icon: XCircle,
          },
        ].map((panel) => {
          const PanelIcon = panel.Icon;
          return (
            <div
              key={panel.title}
              className="bg-yc-surface rounded-xl p-[18px_20px]"
              style={{ border: `1px solid ${panel.color}20` }}
            >
              <div
                className="font-mono text-[10px] tracking-[2px] uppercase mb-3 inline-flex items-center gap-1.5"
                style={{ color: panel.color }}
              >
                <PanelIcon className="w-3.5 h-3.5" strokeWidth={2.5} aria-hidden />
                {panel.title}
              </div>
              <ul className="m-0 p-0 list-none">
                {panel.items.map((item, i) => (
                  <li
                    key={i}
                    className="text-[13px] text-[#bdbdbd] py-2 pl-6 relative leading-relaxed"
                    style={{
                      borderBottom: i < panel.items.length - 1 ? "1px solid #181818" : "none",
                    }}
                  >
                    <PanelIcon
                      className="absolute left-0 top-2.5 w-3.5 h-3.5"
                      strokeWidth={2.5}
                      style={{ color: panel.color }}
                      aria-hidden
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* YC Interview Question */}
      <div className="bg-yc-surface border border-yc-accent/25 rounded-xl p-[20px_22px] mt-4 relative overflow-hidden">
        <div
          className="absolute -top-10 -right-10 w-40 h-40 pointer-events-none"
          style={{ background: `radial-gradient(circle, ${gradeColor}10, transparent 70%)` }}
          aria-hidden
        />
        <div className="font-mono text-[10px] text-yc-accent tracking-[2px] uppercase mb-2.5 inline-flex items-center gap-1.5 relative z-10">
          <MessageSquareQuote className="w-3.5 h-3.5" strokeWidth={2.5} aria-hidden />
          The YC Partner Would Ask…
        </div>
        <p className="m-0 font-serif text-[16px] text-[#ececec] italic leading-[1.7] relative z-10">
          &ldquo;{result.yc_interview_question}&rdquo;
        </p>
      </div>

      {/* Reset */}
      <div className="text-center mt-8">
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 bg-transparent border border-yc-border text-yc-dim px-7 py-2.5 rounded-lg cursor-pointer font-mono text-xs tracking-[1px] uppercase transition-colors duration-200 hover:border-yc-accent/40 hover:text-yc-accent"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.5} aria-hidden />
          Analyze Another
        </button>
      </div>
    </div>
  );
}
