"use client";
import { Grade, GRADE_COLOR } from "@/lib/types";

interface Props {
  grade: Grade;
  size?: number;
  animate?: boolean;
}

const GLOW_MAP: Record<Grade, string> = {
  S: "grade-glow-s",
  A: "grade-glow-a",
  B: "grade-glow-b",
  C: "grade-glow-c",
  D: "grade-glow-d",
  F: "grade-glow-f",
};

export function GradeRing({ grade, size = 80, animate = true }: Props) {
  const color = GRADE_COLOR[grade] ?? "#888";
  return (
    <div
      className={`flex items-center justify-center rounded-full font-display font-bold tracking-[-2px] shrink-0 transition-shadow duration-300 ${animate ? GLOW_MAP[grade] : ""}`}
      style={{
        width: size,
        height: size,
        border: `3px solid ${color}`,
        background: `radial-gradient(circle, ${color}1f 0%, transparent 70%)`,
        fontSize: size * 0.42,
        color,
        textShadow: `0 0 14px ${color}66`,
      }}
      role="img"
      aria-label={`Grade ${grade}`}
    >
      {grade}
    </div>
  );
}
