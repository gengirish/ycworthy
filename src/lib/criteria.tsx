import {
  Target,
  Globe2,
  Lightbulb,
  TrendingUp,
  UserCheck,
  Clock4,
  type LucideIcon,
} from "lucide-react";

export type CriterionKey =
  | "problem"
  | "market"
  | "solution"
  | "traction"
  | "founder"
  | "timing";

export interface CriterionMeta {
  key: CriterionKey;
  label: string;
  Icon: LucideIcon;
  desc: string;
}

export const CRITERIA_META: CriterionMeta[] = [
  { key: "problem",  label: "Problem Clarity",   Icon: Target,     desc: "Real, urgent, clearly articulated?" },
  { key: "market",   label: "Market Size",       Icon: Globe2,     desc: "TAM/SAM — big enough opportunity?" },
  { key: "solution", label: "Solution & Moat",   Icon: Lightbulb,  desc: "10x better, unique insight, defensible?" },
  { key: "traction", label: "Traction & Proof",  Icon: TrendingUp, desc: "Revenue, users, growth signals?" },
  { key: "founder",  label: "Founder-Market Fit",Icon: UserCheck,  desc: "Right domain expertise & passion?" },
  { key: "timing",   label: "Timing & Tailwinds",Icon: Clock4,     desc: "Why now? Market conditions?" },
];
