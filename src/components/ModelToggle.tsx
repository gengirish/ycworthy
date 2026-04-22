"use client";
import { AIProvider } from "@/lib/types";
import clsx from "clsx";

interface Props {
  value: AIProvider;
  onChange: (v: AIProvider) => void;
  disabled?: boolean;
}

const PROVIDERS: { id: AIProvider; label: string; sub: string; color: string; activeClasses: string }[] = [
  {
    id: "claude",
    label: "Claude",
    sub: "Sonnet 4 · Web Search",
    color: "#CC8844",
    activeClasses: "border-provider-claude/35 bg-provider-claude/[0.08] text-provider-claude",
  },
  {
    id: "gemini",
    label: "Gemini",
    sub: "2.5 Flash · JSON Mode",
    color: "#4A9EFF",
    activeClasses: "border-provider-gemini/35 bg-provider-gemini/[0.08] text-provider-gemini",
  },
];

export function ModelToggle({ value, onChange, disabled }: Props) {
  return (
    <div
      role="radiogroup"
      aria-label="AI provider"
      className="inline-flex bg-yc-surface border border-yc-border-light/40 rounded-xl p-1 gap-1"
    >
      {PROVIDERS.map((p) => {
        const active = value === p.id;
        return (
          <button
            key={p.id}
            role="radio"
            aria-checked={active}
            onClick={() => !disabled && onChange(p.id)}
            disabled={disabled}
            className={clsx(
              "px-[18px] py-2 rounded-lg border transition-colors duration-200 text-left",
              active
                ? p.activeClasses
                : "border-transparent text-yc-dim bg-transparent hover:text-yc-text",
              disabled && "opacity-60 cursor-not-allowed",
              !disabled && "cursor-pointer"
            )}
          >
            <div className="font-display font-bold text-[13px] tracking-tight">
              {p.label}
            </div>
            <div
              className="text-[10px] mt-0.5 font-mono"
              style={{ color: active ? `${p.color}c0` : "#555" }}
            >
              {p.sub}
            </div>
          </button>
        );
      })}
    </div>
  );
}
