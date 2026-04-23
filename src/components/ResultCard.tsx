"use client";
import {
  CheckCircle2,
  XCircle,
  MessageSquareQuote,
  ArrowLeft,
  Image as ImageIcon,
  Check,
} from "lucide-react";
import { useState } from "react";
import { AIProvider, AnalysisResult, GRADE_COLOR } from "@/lib/types";
import { GradeRing } from "./GradeRing";
import { CriteriaGrid } from "./CriteriaGrid";

// Likelihood colors mirror grade colors so the eye groups them visually.
// Mission Control palette — the same telemetry-grade vibrancy used for the
// six-axis grades, so the likelihood pill reads as part of the readout strip.
const LIKELIHOOD_COLOR: Record<string, string> = {
  Unlikely: "#FF6A6A",
  Possible: "#FFA040",
  Probable: "#FFD24A",
  Strong: "#00FFC2",
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
  const [copied, setCopied] = useState(false);

  // Edge-rendered Mission Control verdict card. The same query string can be
  // pasted into Twitter/LinkedIn/Slack — the link unfurl resolves to the OG.
  const ogShareUrl = `/api/og?${new URLSearchParams({
    grade: result.overall_grade,
    company: result.company,
    score: String(result.overall_score),
    tagline: result.tagline,
  }).toString()}`;

  return (
    <div className="animate-fade-up">
      {/* Verdict header — HUD instrument panel for the final readout */}
      <div
        className="hud-frame bg-yc-surface rounded-2xl p-7 mb-4 relative overflow-hidden"
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
              <h2 className="m-0 font-display text-[28px] font-semibold tracking-[-0.6px] leading-[1.05] text-yc-text">
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
            <p className="m-0 mb-2.5 text-yc-dim text-[13px]">
              {result.tagline}
            </p>
            <p className="m-0 text-[14px] text-yc-text/85 leading-[1.75]">
              {result.verdict}
            </p>
          </div>
        </div>

        {/* Telemetry readout strip */}
        <div className="mt-5 pt-4 border-t border-yc-border flex gap-5 flex-wrap">
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
            title: "Green Signals",
            items: result.green_flags,
            color: "#00FFC2",
            Icon: CheckCircle2,
          },
          {
            title: "Red Signals",
            items: result.red_flags,
            color: "#FF6A6A",
            Icon: XCircle,
          },
        ].map((panel) => {
          const PanelIcon = panel.Icon;
          return (
            <div
              key={panel.title}
              className="bg-yc-surface rounded-xl p-[18px_20px]"
              style={{ border: `1px solid ${panel.color}24` }}
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
                    className="text-[13px] text-yc-text/75 py-2 pl-6 relative leading-relaxed"
                    style={{
                      borderBottom:
                        i < panel.items.length - 1
                          ? "1px solid rgba(31,42,64,0.7)"
                          : "none",
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

      {/* YC Interview Question — pull-quote on its own instrument panel */}
      <div className="hud-frame bg-yc-surface border border-yc-accent/25 rounded-xl p-[20px_22px] mt-4 relative overflow-hidden">
        <div
          className="absolute -top-10 -right-10 w-40 h-40 pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${gradeColor}14, transparent 70%)`,
          }}
          aria-hidden
        />
        <div className="font-mono text-[10px] text-yc-accent tracking-[2px] uppercase mb-2.5 inline-flex items-center gap-1.5 relative z-10">
          <MessageSquareQuote className="w-3.5 h-3.5" strokeWidth={2.5} aria-hidden />
          Partner would ask
        </div>
        <p className="m-0 font-display text-[18px] text-yc-text leading-[1.55] relative z-10 tracking-[-0.3px]">
          &ldquo;{result.yc_interview_question}&rdquo;
        </p>
      </div>

      {/* Footer actions — share-card + reset */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => {
            const fullUrl =
              typeof window !== "undefined"
                ? `${window.location.origin}${ogShareUrl}`
                : ogShareUrl;
            navigator.clipboard.writeText(fullUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
          }}
          className="inline-flex items-center gap-2 bg-transparent border border-yc-accent/40 text-yc-accent px-6 py-2.5 rounded-lg cursor-pointer font-mono text-xs tracking-[1.5px] uppercase transition-colors duration-200 hover:bg-yc-accent/10"
          aria-label={copied ? "Share card URL copied" : "Copy verdict share-card image URL"}
        >
          {copied ? (
            <Check className="w-3.5 h-3.5" strokeWidth={2.5} aria-hidden />
          ) : (
            <ImageIcon className="w-3.5 h-3.5" strokeWidth={2.5} aria-hidden />
          )}
          {copied ? "Copied" : "Copy share card"}
        </button>
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 bg-transparent border border-yc-border text-yc-dim px-6 py-2.5 rounded-lg cursor-pointer font-mono text-xs tracking-[1.5px] uppercase transition-colors duration-200 hover:border-yc-accent/40 hover:text-yc-accent"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.5} aria-hidden />
          Run Another Target
        </button>
      </div>
    </div>
  );
}
