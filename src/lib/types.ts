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

export const GRADE_COLOR: Record<Grade, string> = {
  S: "#00FFB2",
  A: "#7CFF6B",
  B: "#FFE048",
  C: "#FF9F43",
  D: "#FF6B6B",
  F: "#FF3860",
};

export const GRADE_BG: Record<Grade, string> = {
  S: "rgba(0,255,178,0.07)",
  A: "rgba(124,255,107,0.07)",
  B: "rgba(255,224,72,0.07)",
  C: "rgba(255,159,67,0.07)",
  D: "rgba(255,107,107,0.07)",
  F: "rgba(255,56,96,0.07)",
};

// CRITERIA_META moved to src/lib/criteria.tsx (now uses Lucide SVG icons).
// Re-export from there if you need it from a `.ts` file:
//   import { CRITERIA_META } from "@/lib/criteria";
export type { CriterionKey, CriterionMeta } from "./criteria";
