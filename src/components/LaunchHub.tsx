"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Copy,
  Check,
  Image as ImageIcon,
  Film,
  Layers,
  Megaphone,
  Rocket,
  Newspaper,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

const SITE = "https://ycworthy.intelliforge.tech";
const OG = (params: Record<string, string>) =>
  `${SITE}/api/og?${new URLSearchParams(params).toString()}`;

/* ------------------------------- Demo script ------------------------------ */

interface Scene {
  t: string;
  visual: string;
  voiceover: string;
}

const DEMO_SCENES: Scene[] = [
  {
    t: "0.0–1.0s",
    visual:
      "Mission Control hero. Cursor lands in URL field. Eyebrow pulse-dot ticking.",
    voiceover: "“Drop any startup URL.”",
  },
  {
    t: "1.0–2.2s",
    visual:
      "Type out 'stripe.com' into the input. Caret blinks once at the end.",
    voiceover: "(typing SFX)",
  },
  {
    t: "2.2–2.8s",
    visual:
      "Hover → click 'Run Analysis'. Teal HUD frame on the input pulses.",
    voiceover: "“60 seconds.”",
  },
  {
    t: "2.8–4.5s",
    visual:
      "Loading steps cycle: Acquiring target signal → … → Compiling partner verdict.",
    voiceover: "(synth ticks, one per step)",
  },
  {
    t: "4.5–5.5s",
    visual:
      "Verdict header fades up. Grade-S ring glows in. Score climbs 0 → 98.",
    voiceover: "“Brutal. Evidence-based. Allowed to say no.”",
  },
  {
    t: "5.5–6.0s",
    visual:
      "Logo lockup + 'ycworthy.intelliforge.tech' + 'Web · API · MCP · CLI'.",
    voiceover: "“ycworthy dot intelliforge dot tech.”",
  },
];

/* ----------------------------- Carousel slides ---------------------------- */

interface Slide {
  num: string;
  eyebrow: string;
  headline: string;
  body: string;
  accent?: "teal" | "violet";
}

const CAROUSEL: Slide[] = [
  {
    num: "01",
    eyebrow: "The problem",
    headline: "Most AI startup tools are flattery machines.",
    body: "You paste your URL. They tell you you’re the next Stripe. You feel good for 4 minutes — then build the wrong thing for 4 months.",
  },
  {
    num: "02",
    eyebrow: "The fix",
    headline: "I built the opposite. YCWorthy.",
    body: "An AI that reads your site and gives you the verdict a YC partner would in week-1 office hours. S → A → B → C → D → F. No participation trophies.",
    accent: "teal",
  },
  {
    num: "03",
    eyebrow: "Six axes",
    headline: "Scored on what YC actually funds on.",
    body: "Problem · Market · Solution · Traction · Founder–Market Fit · Timing. Six grades. One overall verdict. One question a partner would ask in office hours.",
  },
  {
    num: "04",
    eyebrow: "Under the hood",
    headline: "Multi-agent failover. No excuses.",
    body: "Gemini 2.5 Flash as primary. NVIDIA Nemotron Ultra 253B as secondary fallback. xAI Grok as tertiary fallback. If one rate-limits, the chain still ships the verdict.",
    accent: "violet",
  },
  {
    num: "05",
    eyebrow: "Four surfaces",
    headline: "Web. REST API. MCP. CLI.",
    body: "Founders use the web. VCs wire the REST API into deal-flow. AI engineers drop the MCP server into Cursor / Claude Desktop. DevOps pipes the CLI into GitHub Actions.",
  },
  {
    num: "06",
    eyebrow: "Try it",
    headline: "ycworthy.intelliforge.tech",
    body: "Free. No signup. Brutally honest. Test it on your own startup, then post the screenshot — regardless of the grade. (Mine got an A. Stripe got an S.)",
    accent: "teal",
  },
];

/* ------------------------- Show HN / Product Hunt ------------------------- */

const SHOW_HN_TITLE = "Show HN: YCWorthy – AI YC partner with REST + MCP + CLI";
const SHOW_HN_BODY = `Hi HN — I built YCWorthy, an AI that pretends to be a YC partner and grades any startup URL across the six criteria YC actually funds on (Problem, Market, Solution, Traction, Founder–Market Fit, Timing). S → F. No participation trophies.

Demo: https://ycworthy.intelliforge.tech
Docs: https://github.com/gengirish/ycworthy

What might interest this crowd specifically:

• Same scoring pipeline ships on four surfaces from day one — web UI, public REST API (OpenAPI 3.1 spec at /api/openapi.json), MCP server (npx ycworthy-mcp, plug into Cursor / Claude Desktop / Codex), and a CLI (npx ycworthy <url>, --json mode for piping).
• Multi-provider failover — Gemini 2.5 Flash as primary, NVIDIA Nemotron Ultra 253B as secondary fallback, xAI Grok as tertiary fallback. The API surfaces fallback_used + X-Provider-Fallback so you know when failover fired.
• Edge OG image generation per verdict (next/og), so any shared verdict URL renders a Mission Control–themed scorecard in Twitter/Slack/LinkedIn previews.
• Stack: Next.js 14 App Router on Vercel, TypeScript strict, native fetch for both providers (no SDKs), zod everywhere, edge runtime for the OG route.

The honest motivation: I’ve watched too many founders polish a deck for 4 weeks before learning their idea has a problem-market mismatch a YC partner would catch in 90 seconds. This compresses that loop.

Free, no signup. I’d love your verdicts on the verdicts — especially the cases where the model is wrong. (And run it on your own startup; I dare you to share the screenshot regardless of the grade.)`;

const PH_TAGLINES_60 = [
  // ≤ 60 chars
  "An AI YC partner you can hit from web, API, MCP, or CLI",
  "Brutal AI verdict on any startup URL — 60 seconds, S → F",
  "Pretends to be a YC partner. Grades your startup. Honestly.",
  "YC partner verdict for any URL. Web · API · MCP · CLI.",
  "Six-axis YC scorecard for any startup URL — free, no signup",
];

const PH_DESCRIPTION = `YCWorthy is an AI startup evaluator that reads any URL and grades it across the six criteria Y Combinator actually funds on — Problem, Market, Solution, Traction, Founder–Market Fit, Timing — with an S-to-F verdict in under 60 seconds.

It’s the opposite of a flattery machine. The model is allowed to say no, surfaces red flags, and writes the actual question a YC partner would ask in week-1 office hours.

Built on Gemini 2.5 Flash with NVIDIA Nemotron Ultra 253B and xAI Grok as automatic failover chain — and shipped on four surfaces from day one: Web UI, public REST API (OpenAPI 3.1), MCP server (one-line install for Cursor / Claude Desktop / Codex), and a CLI for your pipelines.

Free. No signup. Brutally honest.`;

/* ----------------------------- Hashtag bundles ---------------------------- */

const HASHTAGS = {
  linkedin:
    "#YCombinator #AIstartups #BuildInPublic #LLM #DeveloperTools #IntelliForge",
  twitter:
    "#buildinpublic #YC #AI #LLM #MCP #devtools",
  producthunt: "AI · Developer Tools · Startups · Productivity",
};

/* -------------------------------- Component ------------------------------- */

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }}
      className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[1.5px] uppercase border border-yc-border rounded-md px-2.5 py-1 text-yc-dim hover:text-yc-accent hover:border-yc-accent/40 transition-colors duration-200"
      aria-label={copied ? "Copied" : label}
    >
      {copied ? (
        <Check className="w-3 h-3 text-yc-accent" strokeWidth={2.5} aria-hidden />
      ) : (
        <Copy className="w-3 h-3" strokeWidth={2.5} aria-hidden />
      )}
      {copied ? "Copied" : label}
    </button>
  );
}

function SectionHeader({
  Icon,
  eyebrow,
  title,
  blurb,
}: {
  Icon: typeof Rocket;
  eyebrow: string;
  title: string;
  blurb: string;
}) {
  return (
    <header className="mb-6">
      <div className="inline-flex items-center gap-2 mb-3 font-mono text-[10px] text-yc-accent tracking-[3px] uppercase border border-yc-accent/25 px-2.5 py-1 rounded-full bg-yc-accent/[0.04]">
        <Icon className="w-3 h-3" strokeWidth={2.5} aria-hidden />
        {eyebrow}
      </div>
      <h2 className="font-display text-[28px] sm:text-[34px] font-bold tracking-[-1px] leading-[1.1] text-yc-text">
        {title}
      </h2>
      <p className="mt-2 text-yc-dim text-[15px] leading-[1.55] max-w-[640px]">
        {blurb}
      </p>
    </header>
  );
}

export function LaunchHub() {
  // Verdict-card share generator state
  const [vCompany, setVCompany] = useState("Stripe");
  const [vGrade, setVGrade] = useState<"S" | "A" | "B" | "C" | "D" | "F">("S");
  const [vScore, setVScore] = useState("98");
  const [vTagline, setVTagline] = useState(
    "Payments infrastructure for the internet.",
  );

  const ogUrl = useMemo(
    () =>
      OG({
        grade: vGrade,
        company: vCompany,
        score: vScore,
        tagline: vTagline,
      }),
    [vGrade, vCompany, vScore, vTagline],
  );

  const shareLink = `${SITE}/?utm_source=launch&utm_medium=share`;

  return (
    <main className="min-h-screen bg-yc-bg text-yc-text font-sans relative">
      {/* HUD chrome to match the rest of the brand */}
      <div
        className="fixed inset-0 pointer-events-none bg-grid bg-[size:80px_80px] z-0"
        aria-hidden
      />
      <div
        className="fixed inset-0 pointer-events-none bg-film-grain opacity-[0.04] mix-blend-overlay z-0"
        aria-hidden
      />
      <div
        className="fixed inset-x-0 top-0 h-[420px] pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 100% at 50% 0%, rgba(0,224,184,0.10), transparent 70%)",
        }}
        aria-hidden
      />

      <div className="max-w-[1080px] mx-auto px-5 sm:px-8 py-12 sm:py-16 relative z-10">
        {/* Top breadcrumb */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 font-mono text-[10px] text-yc-dim tracking-[2px] uppercase hover:text-yc-accent transition-colors duration-200"
        >
          <ArrowLeft className="w-3 h-3" strokeWidth={2.5} aria-hidden />
          Back to YCWorthy
        </Link>

        {/* Hero */}
        <header className="mt-6 mb-14 animate-fade-up">
          <div className="inline-flex items-center gap-2 mb-4 font-mono text-[10px] text-yc-accent tracking-[4px] uppercase border border-yc-accent/25 px-3 py-1 rounded-full bg-yc-accent/[0.04]">
            <span className="relative inline-flex w-2 h-2" aria-hidden>
              <span className="absolute inset-0 rounded-full bg-yc-accent/60 animate-ping" />
              <span className="relative inline-flex w-2 h-2 rounded-full bg-yc-accent" />
            </span>
            Launch Hub · v1
          </div>
          <h1 className="font-display text-[clamp(40px,7vw,72px)] font-bold tracking-[-2.5px] leading-[0.96] text-yc-text">
            Ship the launch.
            <br />
            <span className="text-yc-accent">Not the demo deck.</span>
          </h1>
          <p className="mt-5 text-yc-dim text-[17px] max-w-[640px] leading-[1.55]">
            Everything you need to launch YCWorthy on LinkedIn, X, Show HN, and
            Product Hunt — copy-pastable post bodies, a 6-second demo script
            with scene timing, a 6-slide carousel, and a live verdict-card
            generator backed by edge-rendered OG images.
          </p>
        </header>

        {/* ============================ DEMO SCRIPT ========================== */}
        <section className="mb-16">
          <SectionHeader
            Icon={Film}
            eyebrow="6-second demo"
            title="Scene-by-scene script"
            blurb="Record once with QuickTime / OBS / Loom at 1080×1920 vertical for LinkedIn + Reels, then trim to 1080×1080 for X. Aim for ≤6 seconds — the algorithm rewards completion rate."
          />
          <div className="hud-frame bg-yc-surface border border-yc-border rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-yc-surface-2">
                <tr className="font-mono text-[10px] text-yc-dim tracking-[2px] uppercase">
                  <th className="px-4 py-3 w-[100px]">Time</th>
                  <th className="px-4 py-3">Visual</th>
                  <th className="px-4 py-3 w-[34%]">Voiceover / SFX</th>
                </tr>
              </thead>
              <tbody>
                {DEMO_SCENES.map((s, i) => (
                  <tr
                    key={s.t}
                    className={
                      i < DEMO_SCENES.length - 1
                        ? "border-b border-yc-border/60"
                        : ""
                    }
                  >
                    <td className="px-4 py-3 font-mono text-[12px] text-yc-accent align-top">
                      {s.t}
                    </td>
                    <td className="px-4 py-3 text-[13.5px] text-yc-text/85 leading-[1.55] align-top">
                      {s.visual}
                    </td>
                    <td className="px-4 py-3 text-[13.5px] text-yc-dim italic leading-[1.55] align-top">
                      {s.voiceover}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
            <p className="font-mono text-[11px] text-yc-dim tracking-[1.5px]">
              Pro tip: leave 0.5s of dead-air at the end so the loop replay
              doesn’t cut off your wordmark.
            </p>
            <CopyButton
              text={DEMO_SCENES.map(
                (s) => `${s.t}\n  Visual:    ${s.visual}\n  Voiceover: ${s.voiceover}`,
              ).join("\n\n")}
              label="Copy script"
            />
          </div>
        </section>

        {/* ============================ CAROUSEL ============================= */}
        <section className="mb-16">
          <SectionHeader
            Icon={Layers}
            eyebrow="Carousel · 6 slides"
            title="LinkedIn / X carousel copy"
            blurb="Build in Figma at 1080×1350 (LinkedIn portrait). Each card uses Mission Control colors — navy bg, HUD-teal accent, Space Grotesk display. Eyebrow + headline + body, that’s it."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {CAROUSEL.map((s) => (
              <article
                key={s.num}
                className="hud-frame bg-yc-surface border border-yc-border rounded-xl p-5 flex flex-col"
              >
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`font-mono text-[10px] tracking-[2px] uppercase ${
                      s.accent === "teal"
                        ? "text-yc-accent"
                        : s.accent === "violet"
                        ? "text-yc-accent-2"
                        : "text-yc-dim"
                    }`}
                  >
                    {s.eyebrow}
                  </span>
                  <span className="font-mono text-[10px] text-yc-dim/70 tabular-nums">
                    {s.num} / 06
                  </span>
                </div>
                <h3 className="font-display text-[20px] font-semibold tracking-[-0.5px] leading-[1.15] text-yc-text mb-2">
                  {s.headline}
                </h3>
                <p className="text-[13.5px] text-yc-dim leading-[1.6] flex-1">
                  {s.body}
                </p>
                <div className="mt-3 pt-3 border-t border-yc-border/60">
                  <CopyButton
                    text={`${s.eyebrow.toUpperCase()}\n\n${s.headline}\n\n${s.body}`}
                    label={`Copy slide ${s.num}`}
                  />
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ============================ SHOW HN ============================== */}
        <section className="mb-16">
          <SectionHeader
            Icon={Newspaper}
            eyebrow="Show HN"
            title="Hacker News post"
            blurb="Submit on a Tuesday or Wednesday between 8–10am ET. Lead with the title below; paste the body as the first comment so the post itself stays a Show HN entry."
          />
          <div className="space-y-3">
            <div className="hud-frame bg-yc-surface border border-yc-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] text-yc-accent tracking-[2px] uppercase">
                  Title (≤80 chars)
                </span>
                <CopyButton text={SHOW_HN_TITLE} />
              </div>
              <p className="font-display text-[18px] font-semibold tracking-[-0.5px] text-yc-text leading-[1.3]">
                {SHOW_HN_TITLE}
              </p>
            </div>

            <div className="hud-frame bg-yc-surface border border-yc-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] text-yc-accent tracking-[2px] uppercase">
                  Body (paste as first comment)
                </span>
                <CopyButton text={SHOW_HN_BODY} />
              </div>
              <pre className="font-mono text-[12px] text-yc-text/85 leading-[1.65] whitespace-pre-wrap break-words">
                {SHOW_HN_BODY}
              </pre>
            </div>
          </div>
        </section>

        {/* =========================== PRODUCT HUNT ========================== */}
        <section className="mb-16">
          <SectionHeader
            Icon={Rocket}
            eyebrow="Product Hunt"
            title="Tagline + description"
            blurb="Schedule the launch for 12:01am PT on a Tuesday. Pick one tagline (≤60 chars). Use the description below verbatim."
          />
          <div className="space-y-3">
            <div className="hud-frame bg-yc-surface border border-yc-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[10px] text-yc-accent tracking-[2px] uppercase">
                  Taglines (≤60 chars)
                </span>
              </div>
              <ul className="space-y-2">
                {PH_TAGLINES_60.map((t) => (
                  <li
                    key={t}
                    className="flex items-center justify-between gap-3 bg-yc-bg/60 border border-yc-border/70 rounded-md px-3 py-2"
                  >
                    <span className="text-[13.5px] text-yc-text/90 font-mono">
                      {t}
                    </span>
                    <span className="flex items-center gap-3 shrink-0">
                      <span className="font-mono text-[10px] text-yc-dim/80 tabular-nums">
                        {t.length}c
                      </span>
                      <CopyButton text={t} />
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="hud-frame bg-yc-surface border border-yc-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] text-yc-accent tracking-[2px] uppercase">
                  Description
                </span>
                <CopyButton text={PH_DESCRIPTION} />
              </div>
              <pre className="font-sans text-[14px] text-yc-text/90 leading-[1.65] whitespace-pre-wrap break-words">
                {PH_DESCRIPTION}
              </pre>
            </div>

            <div className="hud-frame bg-yc-surface border border-yc-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] text-yc-accent tracking-[2px] uppercase">
                  Topics
                </span>
                <CopyButton text={HASHTAGS.producthunt} />
              </div>
              <p className="text-[13.5px] text-yc-text/85 font-mono">
                {HASHTAGS.producthunt}
              </p>
            </div>
          </div>
        </section>

        {/* ============================= HASHTAGS ============================ */}
        <section className="mb-16">
          <SectionHeader
            Icon={Megaphone}
            eyebrow="Hashtags"
            title="Channel-specific bundles"
            blurb="LinkedIn rewards 3–5 specific tags; X rewards 1–2; PH uses topics not hashtags. Don’t cross-paste."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="hud-frame bg-yc-surface border border-yc-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] text-yc-accent tracking-[2px] uppercase">
                  LinkedIn
                </span>
                <CopyButton text={HASHTAGS.linkedin} />
              </div>
              <p className="text-[13px] text-yc-text/85 font-mono break-words">
                {HASHTAGS.linkedin}
              </p>
            </div>
            <div className="hud-frame bg-yc-surface border border-yc-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] text-yc-accent tracking-[2px] uppercase">
                  X / Twitter
                </span>
                <CopyButton text={HASHTAGS.twitter} />
              </div>
              <p className="text-[13px] text-yc-text/85 font-mono break-words">
                {HASHTAGS.twitter}
              </p>
            </div>
          </div>
        </section>

        {/* ========================= SHARE-CARD GENERATOR ===================== */}
        <section className="mb-16">
          <SectionHeader
            Icon={ImageIcon}
            eyebrow="Verdict share card"
            title="Live OG image generator"
            blurb="Edge-rendered at /api/og — 1200×630, cached for a year per unique input. Use this URL anywhere a link preview is rendered (Twitter, LinkedIn, Slack, Discord, iMessage)."
          />

          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
            {/* Inputs */}
            <div className="hud-frame bg-yc-surface border border-yc-border rounded-xl p-4 space-y-4">
              <label className="block">
                <span className="font-mono text-[10px] text-yc-dim tracking-[2px] uppercase">
                  Company
                </span>
                <input
                  value={vCompany}
                  onChange={(e) => setVCompany(e.target.value)}
                  className="mt-1.5 w-full bg-yc-bg border border-yc-border rounded-md px-3 py-2 text-yc-text text-sm font-mono outline-none focus:border-yc-accent/60"
                  maxLength={32}
                />
              </label>
              <label className="block">
                <span className="font-mono text-[10px] text-yc-dim tracking-[2px] uppercase">
                  Grade
                </span>
                <div
                  className="mt-1.5 grid grid-cols-6 gap-1"
                  role="radiogroup"
                  aria-label="Grade"
                >
                  {(["S", "A", "B", "C", "D", "F"] as const).map((g) => {
                    const active = vGrade === g;
                    return (
                      <button
                        key={g}
                        role="radio"
                        aria-checked={active}
                        onClick={() => setVGrade(g)}
                        className={`py-2 rounded-md font-display font-bold text-[15px] tracking-[-0.5px] transition-colors duration-150 ${
                          active
                            ? "bg-yc-accent/15 border border-yc-accent text-yc-accent"
                            : "bg-yc-bg border border-yc-border text-yc-dim hover:text-yc-text hover:border-yc-border-light"
                        }`}
                      >
                        {g}
                      </button>
                    );
                  })}
                </div>
              </label>
              <label className="block">
                <span className="font-mono text-[10px] text-yc-dim tracking-[2px] uppercase">
                  Score (0–100)
                </span>
                <input
                  value={vScore}
                  onChange={(e) =>
                    setVScore(e.target.value.replace(/[^0-9]/g, "").slice(0, 3))
                  }
                  inputMode="numeric"
                  className="mt-1.5 w-full bg-yc-bg border border-yc-border rounded-md px-3 py-2 text-yc-text text-sm font-mono outline-none focus:border-yc-accent/60"
                />
              </label>
              <label className="block">
                <span className="font-mono text-[10px] text-yc-dim tracking-[2px] uppercase">
                  Tagline
                </span>
                <textarea
                  value={vTagline}
                  onChange={(e) =>
                    setVTagline(e.target.value.slice(0, 120))
                  }
                  rows={3}
                  className="mt-1.5 w-full bg-yc-bg border border-yc-border rounded-md px-3 py-2 text-yc-text text-sm leading-[1.5] outline-none focus:border-yc-accent/60 resize-none"
                />
                <span className="mt-1 block font-mono text-[10px] text-yc-dim/70 tabular-nums">
                  {vTagline.length} / 120
                </span>
              </label>

              <div className="pt-2 space-y-2">
                <CopyButton text={ogUrl} label="Copy OG URL" />
                <a
                  href={ogUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[1.5px] uppercase border border-yc-border rounded-md px-2.5 py-1 text-yc-dim hover:text-yc-accent hover:border-yc-accent/40 transition-colors duration-200 ml-2"
                >
                  <ExternalLink className="w-3 h-3" strokeWidth={2.5} aria-hidden />
                  Open full size
                </a>
              </div>
            </div>

            {/* Live preview — embed the actual edge-rendered OG */}
            <div className="hud-frame bg-yc-surface border border-yc-border rounded-xl p-4 flex flex-col">
              <div className="font-mono text-[10px] text-yc-dim tracking-[2px] uppercase mb-3">
                Live preview · 1200 × 630
              </div>
              <div className="flex-1 flex items-center justify-center bg-yc-bg/60 border border-yc-border/60 rounded-md overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={ogUrl}
                  alt={`Verdict share card: grade ${vGrade}, ${vCompany}, score ${vScore}/100`}
                  className="w-full h-auto block"
                />
              </div>
              <div className="mt-3 font-mono text-[11px] text-yc-dim/85 tracking-[1px] break-all">
                {ogUrl}
              </div>
            </div>
          </div>
        </section>

        {/* =========================== POST-LAUNCH ============================ */}
        <section className="mb-16">
          <SectionHeader
            Icon={Rocket}
            eyebrow="First 60 minutes"
            title="The window where reach is decided"
            blurb="LinkedIn’s algorithm scores velocity in the first hour and locks in your reach ceiling. Run this checklist."
          />
          <ol className="space-y-3 text-[14px] text-yc-text/90 leading-[1.65]">
            {[
              "Drop your link in the FIRST COMMENT, not the post body — LinkedIn deprioritizes external-link posts.",
              "Don’t edit the post in the first hour. Edits reset velocity.",
              "Reply to every comment within 5 minutes. Early engagement weight is exponential.",
              "Have 3–5 friend accounts ready to drop substantive comments (real reactions / their own verdicts), not 'great post 🔥'.",
              "Run YCWorthy on 3 well-known startups (Stripe, Notion, Vercel) before posting — keep the screenshots ready as conversation seeds.",
              "48 hours later: repost on X with the dev-tools angle (Voice C). 1 week later: drop the contrarian angle (Voice B).",
            ].map((step, i) => (
              <li
                key={i}
                className="hud-frame bg-yc-surface border border-yc-border rounded-xl p-4 flex gap-3"
              >
                <span className="font-mono text-[11px] text-yc-accent tracking-[1.5px] tabular-nums shrink-0 mt-[2px]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* ============================== CTA ================================ */}
        <section className="mt-20 text-center">
          <Link
            href={shareLink}
            className="inline-flex items-center gap-2 bg-yc-accent text-yc-bg font-mono font-bold text-xs tracking-[1.5px] uppercase px-7 py-3 rounded-lg hover:bg-yc-accent-soft transition-colors duration-200"
          >
            <Rocket className="w-3.5 h-3.5" strokeWidth={3} aria-hidden />
            Open the live demo
          </Link>
          <p className="mt-3 font-mono text-[10px] text-yc-dim tracking-[2px] uppercase">
            Built by{" "}
            <a
              href="https://www.intelliforge.tech/company"
              target="_blank"
              rel="noopener noreferrer"
              className="text-yc-text hover:text-yc-accent transition-colors duration-200"
            >
              IntelliForge AI
            </a>
            {" · "}
            <a
              href="https://girishbhiremath.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-yc-text hover:text-yc-accent transition-colors duration-200"
            >
              Girish Bhiremath
            </a>
          </p>
        </section>
      </div>
    </main>
  );
}
