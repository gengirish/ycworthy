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
    id: "gemini",
    label: "Gemini",
    sub: "2.5 Flash · Default",
    color: "#4A9EFF",
    activeClasses: "border-provider-gemini/35 bg-provider-gemini/[0.08] text-provider-gemini",
  },
  {
    id: "nvidia",
    label: "NVIDIA",
    sub: "Nemotron Ultra 253B",
    color: "#76B900",
    activeClasses: "border-provider-nvidia/35 bg-provider-nvidia/[0.08] text-provider-nvidia",
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
            <div className="font-display font-semibold text-[13px] tracking-tight inline-flex items-center gap-1.5">
              {active && (
                <span
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ background: p.color }}
                  aria-hidden
                />
              )}
              {p.label}
            </div>
            <div
              className="text-[10px] mt-0.5 font-mono"
              style={{ color: active ? `${p.color}c0` : "#5C6B85" }}
            >
              {p.sub}
            </div>
          </button>
        );
      })}
    </div>
  );
}
