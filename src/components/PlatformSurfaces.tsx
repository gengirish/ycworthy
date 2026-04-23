"use client";

import {
  Globe,
  Code2,
  Plug,
  Terminal,
  ArrowUpRight,
  Activity,
  FileJson,
  Check,
  Copy,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";

/**
 * "Built for humans, agents & pipelines" — landing-page section that surfaces
 * the four ways into the YCWorthy pipeline (Web, REST API, MCP, CLI). Lives
 * directly on the homepage so anyone landing here can immediately see the
 * automation surface alongside the consumer UI.
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
    eyebrow: "Browser",
    title: "Web UI",
    description:
      "Paste a URL, get a YC partner verdict in under a minute. Mobile-ready, shareable, no signup.",
    snippet: "↑ paste any URL above\n  Rate It → instant scorecard",
    ctaLabel: "You're already here",
    ctaHref: "#top",
    ctaInternal: true,
  },
  {
    id: "rest",
    Icon: Code2,
    eyebrow: "Public REST API",
    title: "Hit it from any stack",
    description:
      "OpenAPI 3.1 spec, CORS-enabled, request_id echoing, stable error_codes. Wire it into your CRM, Notion, or signal pipeline.",
    snippet:
      'curl -X POST https://ycworthy.intelliforge.tech/api/analyze \\\n  -H "Content-Type: application/json" \\\n  -d \'{"url":"https://your-startup.com"}\'',
    ctaLabel: "API reference",
    ctaHref: `${REPO_DOCS}/API.md`,
  },
  {
    id: "mcp",
    Icon: Plug,
    eyebrow: "Model Context Protocol",
    title: "Plug into any agent",
    description:
      "One-line install for Cursor, Claude Desktop, Codex, and any MCP-compatible client. Your agent gets an analyze_startup tool.",
    snippet:
      '{\n  "mcpServers": {\n    "ycworthy": { "command": "npx", "args": ["ycworthy-mcp"] }\n  }\n}',
    ctaLabel: "MCP install guide",
    ctaHref: `${REPO_DOCS}/MCP.md`,
  },
  {
    id: "cli",
    Icon: Terminal,
    eyebrow: "Command Line",
    title: "Score from your terminal",
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
      <div className="inline-flex items-center gap-2 mb-4 font-mono text-[10px] text-yc-accent tracking-[4px] uppercase border border-yc-accent/25 px-3 py-1 rounded-full">
        <Activity className="w-3 h-3" strokeWidth={2.5} aria-hidden />
        Built for humans, agents &amp; pipelines
      </div>

      <h2
        id="surfaces-title"
        className="font-display font-display-opt text-[clamp(34px,5.5vw,52px)] font-semibold tracking-[-1.5px] leading-[1.05] text-yc-text"
      >
        One verdict.<span className="text-yc-accent"> Four ways</span> in.
      </h2>
      <p className="mt-3 font-serif text-yc-dim text-[15px] italic max-w-[600px] leading-[1.55]">
        The same YC partner pipeline backs every surface — Gemini 2.5 Flash as
        primary, NVIDIA Nemotron Ultra 253B as automatic fallback. Pick whichever
        interface matches your workflow.
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
              className="group flex flex-col p-5 bg-yc-surface border border-yc-border rounded-xl transition-colors duration-200 hover:border-yc-accent/40"
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
              <p className="mt-1.5 font-serif text-[14px] text-yc-dim leading-[1.55]">
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
          aria-label="Fallback AI provider"
        >
          <span
            className="w-1.5 h-1.5 rounded-full bg-provider-nvidia"
            aria-hidden
          />
          NVIDIA Nemotron Ultra
        </span>
      </div>
    </section>
  );
}
