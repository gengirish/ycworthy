"use client";

import {
  Globe,
  Code2,
  Plug,
  Terminal,
  ArrowUpRight,
  Radio,
  FileJson,
  Check,
  Copy,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";

/**
 * "Deploy on any surface" — landing-page section that surfaces the four
 * endpoints into the YCWorthy pipeline (Web, REST API, MCP, CLI). Designed
 * to read like a control-room console panel: each surface is a deployment
 * target with a copy-pastable activation snippet.
 */

const REPO_DOCS = "https://github.com/gengirish/ycworthy/blob/master/docs";

interface Surface {
  id: string;
  Icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  snippet: string;
  ctaLabel: string;
  ctaHref: string;
  ctaInternal?: boolean;
}

const SURFACES: Surface[] = [
  {
    id: "web",
    Icon: Globe,
    eyebrow: "Surface · Browser",
    title: "Web console",
    description:
      "Paste a URL, get a YC partner verdict in under a minute. Mobile-ready, shareable, no signup, full telemetry on display.",
    snippet: "↑ paste any URL above\n  Run Analysis → instant scorecard",
    ctaLabel: "You're already here",
    ctaHref: "#top",
    ctaInternal: true,
  },
  {
    id: "rest",
    Icon: Code2,
    eyebrow: "Surface · REST",
    title: "Public HTTP endpoint",
    description:
      "OpenAPI 3.1 spec, CORS-enabled, request_id echoing, stable error_codes. Wire it into your CRM, Notion, or deal-flow pipeline.",
    snippet:
      'curl -X POST https://ycworthy.intelliforge.tech/api/analyze \\\n  -H "Content-Type: application/json" \\\n  -d \'{"url":"https://your-startup.com"}\'',
    ctaLabel: "API reference",
    ctaHref: `${REPO_DOCS}/API.md`,
  },
  {
    id: "mcp",
    Icon: Plug,
    eyebrow: "Surface · MCP",
    title: "Agent tool — analyze_startup",
    description:
      "One-line install for Cursor, Claude Desktop, Codex, and any MCP-compatible client. Your agent gets a structured analyze_startup tool.",
    snippet:
      '{\n  "mcpServers": {\n    "ycworthy": { "command": "npx", "args": ["ycworthy-mcp"] }\n  }\n}',
    ctaLabel: "MCP install guide",
    ctaHref: `${REPO_DOCS}/MCP.md`,
  },
  {
    id: "cli",
    Icon: Terminal,
    eyebrow: "Surface · CLI",
    title: "Pipeline-friendly binary",
    description:
      "Pipe the JSON into CI, n8n, GitHub Actions, or a quick bash loop. Pretty-print for humans, --json for everything else.",
    snippet:
      "npx ycworthy https://your-startup.com\nnpx ycworthy https://your-startup.com --json",
    ctaLabel: "Automation cookbook",
    ctaHref: `${REPO_DOCS}/AUTOMATION.md`,
  },
];

function SnippetBlock({ snippet }: { snippet: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // clipboard blocked — silently no-op
    }
  };
  return (
    <div className="relative mt-4">
      <pre
        className="p-3 pr-10 bg-yc-bg/80 border border-yc-border/70 rounded-lg overflow-x-auto font-mono text-[11.5px] leading-[1.6] text-yc-text/90 whitespace-pre"
        aria-label="Code snippet"
      >
        <code>{snippet}</code>
      </pre>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={copied ? "Copied" : "Copy snippet"}
        className="absolute top-2 right-2 inline-flex items-center justify-center w-7 h-7 rounded-md bg-yc-surface/70 border border-yc-border/60 text-yc-dim hover:text-yc-accent hover:border-yc-accent/40 transition-colors duration-200"
      >
        {copied ? (
          <Check className="w-3.5 h-3.5" strokeWidth={3} aria-hidden />
        ) : (
          <Copy className="w-3.5 h-3.5" strokeWidth={2.25} aria-hidden />
        )}
      </button>
    </div>
  );
}

export function PlatformSurfaces() {
  return (
    <section
      aria-labelledby="surfaces-title"
      className="mt-20 mb-12 animate-fade-up delay-200"
    >
      <div className="inline-flex items-center gap-2 mb-4 font-mono text-[10px] text-yc-accent tracking-[4px] uppercase border border-yc-accent/25 px-3 py-1 rounded-full bg-yc-accent/[0.04]">
        <Radio className="w-3 h-3" strokeWidth={2.5} aria-hidden />
        Deployment surfaces
      </div>

      <h2
        id="surfaces-title"
        className="font-display text-[clamp(34px,5.5vw,52px)] font-bold tracking-[-1.6px] leading-[1.05] text-yc-text"
      >
        One pipeline.<span className="text-yc-accent"> Four endpoints.</span>
      </h2>
      <p className="mt-3 font-sans text-yc-dim text-[15px] max-w-[620px] leading-[1.6]">
        The same six-axis YC partner pipeline serves every surface — Gemini 2.5
        Flash as primary, NVIDIA Nemotron Ultra 253B as secondary fallback, and
        xAI Grok as tertiary fallback. Pick whichever endpoint matches your
        workflow.
      </p>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        {SURFACES.map(
          ({
            id,
            Icon,
            eyebrow,
            title,
            description,
            snippet,
            ctaLabel,
            ctaHref,
            ctaInternal,
          }) => (
            <article
              key={id}
              className="hud-frame group flex flex-col p-5 bg-yc-surface border border-yc-border rounded-xl transition-colors duration-200 hover:border-yc-accent/40"
            >
              <div className="flex items-center gap-2 text-yc-dim mb-3">
                <Icon
                  className="w-4 h-4 text-yc-accent"
                  strokeWidth={2.25}
                  aria-hidden
                />
                <span className="font-mono text-[10px] tracking-[2px] uppercase">
                  {eyebrow}
                </span>
              </div>
              <h3 className="font-display text-[22px] font-semibold tracking-[-0.5px] text-yc-text leading-[1.15]">
                {title}
              </h3>
              <p className="mt-1.5 font-sans text-[14px] text-yc-dim leading-[1.6]">
                {description}
              </p>

              <SnippetBlock snippet={snippet} />

              <a
                href={ctaHref}
                target={ctaInternal ? undefined : "_blank"}
                rel={ctaInternal ? undefined : "noopener noreferrer"}
                className="mt-4 inline-flex items-center gap-1.5 self-start font-mono text-[11px] tracking-[1px] uppercase text-yc-dim group-hover:text-yc-accent transition-colors duration-200"
              >
                {ctaLabel}
                <ArrowUpRight
                  className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100"
                  strokeWidth={2.5}
                  aria-hidden
                />
                {!ctaInternal && (
                  <span className="sr-only">(opens in new tab)</span>
                )}
              </a>
            </article>
          )
        )}
      </div>

      {/* Status / spec / provider strip */}
      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[10px] text-yc-dim/80 tracking-[1.5px] uppercase">
        <a
          href="/api/health"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 hover:text-yc-accent transition-colors duration-200"
        >
          <span className="relative inline-flex w-2 h-2">
            <span className="absolute inset-0 rounded-full bg-grade-s/60 animate-ping" />
            <span className="relative inline-flex w-2 h-2 rounded-full bg-grade-s" />
          </span>
          Live status · /api/health
        </a>
        <a
          href="/api/openapi.json"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 hover:text-yc-accent transition-colors duration-200"
        >
          <FileJson className="w-3 h-3" strokeWidth={2.5} aria-hidden />
          OpenAPI 3.1 spec
        </a>
        <span
          className="inline-flex items-center gap-1.5 text-yc-dim/60"
          aria-label="Primary AI provider"
        >
          <span
            className="w-1.5 h-1.5 rounded-full bg-provider-gemini"
            aria-hidden
          />
          Gemini 2.5 Flash
        </span>
        <span
          className="inline-flex items-center gap-1.5 text-yc-dim/60"
          aria-label="Secondary fallback AI provider"
        >
          <span
            className="w-1.5 h-1.5 rounded-full bg-provider-nvidia"
            aria-hidden
          />
          NVIDIA Nemotron Ultra
        </span>
        <span
          className="inline-flex items-center gap-1.5 text-yc-dim/60"
          aria-label="Tertiary fallback AI provider"
        >
          <span
            className="w-1.5 h-1.5 rounded-full bg-yc-accent-2"
            aria-hidden
          />
          xAI Grok
        </span>
      </div>
    </section>
  );
}
