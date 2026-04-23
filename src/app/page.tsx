"use client";
import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowLeft,
  Share2,
  Check,
  XCircle,
  Radar,
  ExternalLink,
} from "lucide-react";
import { AIProvider } from "@/lib/types";
import { addToHistory } from "@/lib/history";
import { useAnalyze } from "@/hooks/useAnalyze";
import { ModelToggle } from "@/components/ModelToggle";
import { ResultCard } from "@/components/ResultCard";
import { HistoryStrip } from "@/components/HistoryStrip";
import { PlatformSurfaces } from "@/components/PlatformSurfaces";

const LOADING_STEPS = [
  "Acquiring target signal...",
  "Indexing public surface...",
  "Sizing market envelope...",
  "Computing founder-market fit...",
  "Running six-axis YC matrix...",
  "Compiling partner verdict...",
];

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [url, setUrl] = useState("");
  const [provider, setProvider] = useState<AIProvider>("gemini");
  const [stepIndex, setStepIndex] = useState(0);
  const [historyKey, setHistoryKey] = useState(0);
  const [copied, setCopied] = useState(false);
  const stepTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const autoTriggered = useRef(false);

  const { result, loading, error, provider: usedProvider, durationMs, analyze, reset } =
    useAnalyze();

  const handleAnalyze = useCallback(
    async (targetUrl?: string, targetProvider?: AIProvider) => {
      const u = targetUrl ?? url;
      const p = targetProvider ?? provider;
      if (!u.trim() || loading) return;

      const fullUrl = u.startsWith("http") ? u : `https://${u}`;
      setStepIndex(0);
      stepTimer.current = setInterval(() => {
        setStepIndex((i) => (i + 1) % LOADING_STEPS.length);
      }, 2400);

      await analyze(fullUrl, p);

      if (stepTimer.current) clearInterval(stepTimer.current);
    },
    [url, provider, loading, analyze]
  );

  useEffect(() => {
    if (result && usedProvider) {
      addToHistory({
        url: url.startsWith("http") ? url : `https://${url}`,
        company: result.company,
        overall_grade: result.overall_grade,
        overall_score: result.overall_score,
        provider: usedProvider,
        timestamp: Date.now(),
      });
      setHistoryKey((k) => k + 1);
    }
  }, [result, usedProvider, url]);

  useEffect(() => {
    if (autoTriggered.current) return;
    const paramUrl = searchParams.get("url");
    const paramProvider = searchParams.get("provider") as AIProvider | null;
    if (paramUrl) {
      autoTriggered.current = true;
      setUrl(paramUrl);
      // Backward-compat: anything that isn't an explicit supported provider
      // falls through to "gemini" — the default.
      const normalized: AIProvider =
        paramProvider === "nvidia" || paramProvider === "grok"
          ? paramProvider
          : "gemini";
      setProvider(normalized);
      setTimeout(() => handleAnalyze(paramUrl, normalized), 100);
    }
  }, [searchParams, handleAnalyze]);

  const handleReset = () => {
    reset();
    setUrl("");
    setCopied(false);
    router.replace("/", { scroll: false });
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleShare = async () => {
    const fullUrl = url.startsWith("http") ? url : `https://${url}`;
    const shareUrl = `${window.location.origin}/?url=${encodeURIComponent(fullUrl)}&provider=${usedProvider ?? provider}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <main id="top" className="min-h-screen bg-yc-bg text-yc-text font-sans relative">
      {/* HUD grid — cool teal lattice replaces the old paper grid */}
      <div
        className="fixed inset-0 pointer-events-none bg-grid bg-[size:80px_80px] z-0"
        aria-hidden
      />
      {/* Faint scanlines — Mission Control texture (≈3% opacity) */}
      <div
        className="fixed inset-0 pointer-events-none bg-film-grain opacity-[0.04] mix-blend-overlay z-0"
        aria-hidden
      />
      {/* Soft teal vignette anchoring the upper third of the viewport */}
      <div
        className="fixed inset-x-0 top-0 h-[420px] pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 100% at 50% 0%, rgba(0,224,184,0.10), transparent 70%)",
        }}
        aria-hidden
      />

      <div className="relative z-[1] max-w-[860px] mx-auto px-5 pt-[60px] pb-[100px]">
        {/* Header */}
        {!result && (
          <header className="mb-[52px] animate-fade-up">
            <div className="inline-flex items-center gap-2 mb-[18px] font-mono text-[10px] text-yc-accent tracking-[4px] uppercase border border-yc-accent/25 px-3 py-1 rounded-full bg-yc-accent/[0.04]">
              <span className="relative inline-flex w-2 h-2" aria-hidden>
                <span className="absolute inset-0 rounded-full bg-yc-accent/60 animate-ping" />
                <span className="relative inline-flex w-2 h-2 rounded-full bg-yc-accent" />
              </span>
              YC Telemetry Engine · v3.0
            </div>

            <h1 className="m-0 font-display text-[clamp(56px,10vw,104px)] font-bold tracking-[-3.5px] leading-[0.92] text-yc-text">
              YCWorthy<span className="text-yc-accent">.</span>
            </h1>
            <p className="mt-5 font-sans text-yc-dim text-[18px] max-w-[580px] leading-[1.55]">
              Point it at any startup URL. Get a brutal, evidence-based partner
              verdict scored across the six axes Y Combinator actually funds on
              <span className="text-yc-text/80"> — in under a minute.</span>
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 font-mono text-[10px] text-yc-dim/70 tracking-[1.5px] uppercase">
              <span className="inline-flex items-center gap-1.5">
                <Radar className="w-3 h-3 text-yc-accent" strokeWidth={2.5} aria-hidden />
                Six-axis scoring · S → F
              </span>
              <span aria-hidden className="text-yc-border-light">·</span>
              <span>Multi-agent fallback</span>
              <span aria-hidden className="text-yc-border-light">·</span>
              <span>Web · API · MCP · CLI</span>
            </div>
          </header>
        )}

        {/* Input section */}
        {!result && (
          <section
            className="mb-12 animate-fade-up delay-100"
            aria-label="Analyze a startup URL"
          >
            <label htmlFor="startup-url" className="sr-only">
              Startup URL
            </label>
            <div className="hud-frame flex border border-yc-border rounded-xl overflow-hidden bg-yc-surface mb-4 transition-colors duration-200 focus-within:border-yc-accent/60">
              <div className="px-3.5 flex items-center text-yc-border-light font-mono text-[13px] shrink-0 select-none">
                https://
              </div>
              <input
                id="startup-url"
                ref={inputRef}
                value={url.replace(/^https?:\/\//, "")}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                placeholder="startup-url.com"
                autoFocus
                aria-label="Startup URL"
                inputMode="url"
                autoComplete="url"
                spellCheck={false}
                className="flex-1 bg-transparent border-none outline-none text-yc-text text-[15px] py-[18px] font-mono min-w-0"
              />
              <button
                onClick={() => handleAnalyze()}
                disabled={loading || !url.trim()}
                aria-label="Run YC analysis"
                className="inline-flex items-center gap-1.5 px-[22px] shrink-0 font-mono font-bold text-xs tracking-[1.5px] uppercase transition-colors duration-200 whitespace-nowrap disabled:bg-yc-surface-2 disabled:text-yc-border-light disabled:cursor-not-allowed bg-yc-accent text-yc-bg cursor-pointer hover:bg-yc-accent-soft"
              >
                {loading ? "Running..." : "Run Analysis"}
                {!loading && (
                  <ArrowRight className="w-3.5 h-3.5" strokeWidth={3} aria-hidden />
                )}
              </button>
            </div>

            <ModelToggle value={provider} onChange={setProvider} disabled={loading} />

            <HistoryStrip
              onSelect={(u) => {
                setUrl(u);
                setTimeout(() => handleAnalyze(u), 50);
              }}
              refreshKey={historyKey}
            />
          </section>
        )}

        {/* Built for humans, agents & pipelines — surfaces the REST/MCP/CLI
            entry points alongside the consumer UI. Hidden once a result is
            on screen so it never competes with the verdict. */}
        {!result && !loading && <PlatformSurfaces />}

        {/* Loading */}
        {loading && (
          <div
            className="text-center py-[72px] animate-fade-up"
            role="status"
            aria-live="polite"
            aria-busy="true"
          >
            <div className="mb-7" aria-hidden>
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="inline-block w-2 h-2 bg-yc-accent rounded-full mx-[5px] animate-bounce"
                  style={{ animationDelay: `${i * 0.18}s` }}
                />
              ))}
            </div>
            <p className="text-yc-dim font-mono text-xs tracking-[2px] uppercase">
              {LOADING_STEPS[stepIndex]}
            </p>
            <span className="sr-only">Analyzing startup, please wait.</span>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div
            role="alert"
            className="flex items-start gap-3 p-[18px_20px] bg-grade-d/[0.07] border border-grade-d/30 rounded-xl text-grade-d font-mono text-[13px] mb-6 animate-fade-up"
          >
            <XCircle className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={2.5} aria-hidden />
            <span className="flex-1">{error}</span>
            <button
              onClick={handleReset}
              className="bg-transparent border-none text-grade-d/70 cursor-pointer font-mono text-[11px] underline hover:text-grade-d transition-colors duration-200"
            >
              Try again
            </button>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <>
            {/* Share bar */}
            <div className="flex items-center justify-between mb-6 animate-fade-up">
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 font-mono text-[11px] text-yc-dim hover:text-yc-text bg-transparent border-none cursor-pointer transition-colors duration-200 uppercase tracking-[1px]"
              >
                <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.5} aria-hidden />
                Back
              </button>
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 font-mono text-[11px] px-3.5 py-2 rounded-lg bg-yc-surface border border-yc-border text-yc-dim hover:border-yc-accent/40 hover:text-yc-accent cursor-pointer transition-colors duration-200"
                aria-label="Copy a shareable link to this analysis"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" strokeWidth={3} aria-hidden />
                    Copied!
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5" strokeWidth={2.5} aria-hidden />
                    Share Link
                  </>
                )}
              </button>
            </div>

            <ResultCard
              result={result}
              provider={usedProvider}
              durationMs={durationMs}
              onReset={handleReset}
            />
          </>
        )}

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-yc-border/60 text-center">
          <p className="font-mono text-[10px] text-yc-dim tracking-[2px] uppercase inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            <span>Engineered by</span>
            <a
              href="https://www.intelliforge.tech/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-yc-text/80 hover:text-yc-accent transition-colors duration-200"
            >
              IntelliForge AI
              <ExternalLink className="w-3 h-3 opacity-70" strokeWidth={2.25} aria-hidden />
              <span className="sr-only">(opens in new tab)</span>
            </a>
            <span aria-hidden>·</span>
            <span className="text-yc-dim/80">Crafted by</span>
            <a
              href="https://girishbhiremath.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-yc-text/80 hover:text-yc-accent transition-colors duration-200"
            >
              Girish Hiremath
              <ExternalLink className="w-3 h-3 opacity-70" strokeWidth={2.25} aria-hidden />
              <span className="sr-only">(opens in new tab)</span>
            </a>
          </p>
          <p className="mt-3 font-mono text-[10px] text-yc-dim/50 tracking-[1px]">
            Aligned with the Bharat AI Mission · Hyderabad, India
          </p>
          <p className="mt-2 font-mono text-[10px] tracking-[2px] uppercase">
            <a
              href="/launch"
              className="text-yc-dim/70 hover:text-yc-accent transition-colors duration-200"
            >
              Launch hub →
            </a>
            <span aria-hidden className="mx-2 text-yc-border-light">·</span>
            <a
              href="/api/openapi.json"
              className="text-yc-dim/70 hover:text-yc-accent transition-colors duration-200"
            >
              OpenAPI spec
            </a>
            <span aria-hidden className="mx-2 text-yc-border-light">·</span>
            <a
              href="/api/health"
              className="text-yc-dim/70 hover:text-yc-accent transition-colors duration-200"
            >
              Health
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}
