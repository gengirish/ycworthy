// src/lib/types.ts

export type Grade = "S" | "A" | "B" | "C" | "D" | "F";
export type YCLikelihood = "Unlikely" | "Possible" | "Probable" | "Strong";
export type AIProvider = "nvidia" | "gemini";

export interface CriterionResult {
  grade: Grade;
  score: number; // 0–100
  summary: string;
}

export interface AnalysisResult {
  company: string;
  tagline: string;
  overall_grade: Grade;
  overall_score: number;
  verdict: string;
  yc_likelihood: YCLikelihood;
  criteria: {
    problem: CriterionResult;
    market: CriterionResult;
    solution: CriterionResult;
    traction: CriterionResult;
    founder: CriterionResult;
    timing: CriterionResult;
  };
  red_flags: string[];
  green_flags: string[];
  yc_interview_question: string;
}

export interface AnalyzeRequest {
  url: string;
  provider: AIProvider;
}

export interface AnalyzeResponse {
  data?: AnalysisResult;
  error?: string;
  provider?: AIProvider;
  duration_ms?: number;
}

export interface AnalysisProvider {
  analyze(url: string): Promise<AnalysisResult>;
}

/**
 * Grade colors are *data* colors — they must remain distinct from the brand
 * HUD-teal accent (#00E0B8) and AI-violet secondary (#7C5CFF) so the eye
 * can separate "scorecard data" from "interactive UI". Mission Control
 * theme: each step is engineered for readability against the deep-navy
 * ground at small sizes (telemetry-grade vibrancy).
 */
export const GRADE_COLOR: Record<Grade, string> = {
  S: "#00FFC2",
  A: "#69E68A",
  B: "#FFD24A",
  C: "#FFA040",
  D: "#FF6A6A",
  F: "#FF3A6A",
};

export const GRADE_BG: Record<Grade, string> = {
  S: "rgba(0,255,194,0.07)",
  A: "rgba(105,230,138,0.07)",
  B: "rgba(255,210,74,0.07)",
  C: "rgba(255,160,64,0.07)",
  D: "rgba(255,106,106,0.07)",
  F: "rgba(255,58,106,0.07)",
};

// CRITERIA_META moved to src/lib/criteria.tsx (now uses Lucide SVG icons).
// Re-export from there if you need it from a `.ts` file:
//   import { CRITERIA_META } from "@/lib/criteria";
export type { CriterionKey, CriterionMeta } from "./criteria";
