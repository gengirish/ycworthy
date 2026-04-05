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
    sub: "Sonnet 4 + Web Search",
    color: "#CC8844",
    activeClasses: "border-provider-claude/25 bg-provider-claude/8 text-provider-claude",
  },
  {
    id: "gemini",
    label: "Gemini",
    sub: "1.5 Pro + JSON Mode",
    color: "#4A9EFF",
    activeClasses: "border-provider-gemini/25 bg-provider-gemini/8 text-provider-gemini",
  },
];

export function ModelToggle({ value, onChange, disabled }: Props) {
  return (
    <div className="inline-flex bg-yc-surface border border-yc-border-light/40 rounded-[10px] p-1 gap-1">
      {PROVIDERS.map((p) => {
        const active = value === p.id;
        return (
          <button
            key={p.id}
            onClick={() => !disabled && onChange(p.id)}
            disabled={disabled}
            className={clsx(
              "px-[18px] py-2 rounded-[7px] border transition-all text-left",
              active ? p.activeClasses : "border-transparent text-yc-muted bg-transparent",
              disabled && "opacity-60 cursor-not-allowed",
              !disabled && "cursor-pointer"
            )}
          >
            <div className="font-mono font-bold text-[13px]">{p.label}</div>
            <div
              className="text-[10px] mt-px"
              style={{ color: active ? `${p.color}99` : "#333" }}
            >
              {p.sub}
            </div>
          </button>
        );
      })}
    </div>
  );
}
