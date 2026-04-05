"use client";
import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AIProvider } from "@/lib/types";
import { addToHistory } from "@/lib/history";
import { useAnalyze } from "@/hooks/useAnalyze";
import { ModelToggle } from "@/components/ModelToggle";
import { ResultCard } from "@/components/ResultCard";
import { HistoryStrip } from "@/components/HistoryStrip";

const LOADING_STEPS = [
  "Crawling website...",
  "Researching the company...",
  "Evaluating market size...",
  "Scoring founder-market fit...",
  "Running YC criteria matrix...",
  "Writing partner verdict...",
];

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [url, setUrl] = useState("");
  const [provider, setProvider] = useState<AIProvider>("claude");
  const [stepIndex, setStepIndex] = useState(0);
  const [historyKey, setHistoryKey] = useState(0);
  const [copied, setCopied] = useState(false);
  const stepTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const autoTriggered = useRef(false);

  const { result, loading, error, provider: usedProvider, durationMs, analyze, reset } =
    useAnalyze();

  const handleAnalyze = useCallback(async (targetUrl?: string, targetProvider?: AIProvider) => {
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
  }, [url, provider, loading, analyze]);

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
      if (paramProvider === "claude" || paramProvider === "gemini") {
        setProvider(paramProvider);
      }
      setTimeout(() => handleAnalyze(paramUrl, paramProvider ?? "claude"), 100);
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
    <main className="min-h-screen bg-yc-bg text-yc-text font-sans">
      {/* Grid background */}
      <div className="fixed inset-0 pointer-events-none bg-grid bg-[size:80px_80px] z-0" />

      <div className="relative z-[1] max-w-[800px] mx-auto px-5 pt-[60px] pb-[100px]">
        {/* Header */}
        {!result && (
          <div className="mb-[52px] animate-fade-up">
            <div className="inline-flex items-center gap-2 mb-[18px] font-mono text-[10px] text-yc-accent tracking-[4px] uppercase border border-yc-accent/25 px-3 py-1 rounded-[3px]">
              <span className="w-1.5 h-1.5 rounded-full bg-yc-accent animate-pulse inline-block" />
              YC Evaluation System · v2.1
            </div>

            <h1 className="m-0 text-[clamp(48px,9vw,82px)] font-black tracking-[-4px] leading-[0.92] bg-gradient-to-br from-white to-[#444] bg-clip-text text-transparent">
              YCWorthy
            </h1>
            <p className="mt-4 text-yc-muted text-[15px] italic max-w-[480px]">
              Drop any startup URL. Get a brutal, honest AI evaluation against
              Y Combinator&apos;s real funding criteria.
            </p>
          </div>
        )}

        {/* Input section */}
        {!result && (
          <div className="mb-12 animate-fade-up delay-100">
            <div className="flex border border-yc-border rounded-[10px] overflow-hidden bg-yc-surface mb-4">
              <div className="px-3.5 flex items-center text-yc-border-light font-mono text-[13px] shrink-0">
                https://
              </div>
              <input
                ref={inputRef}
                value={url.replace(/^https?:\/\//, "")}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                placeholder="startup-url.com"
                autoFocus
                className="flex-1 bg-transparent border-none outline-none text-yc-text text-[15px] py-[18px] font-mono min-w-0"
              />
              <button
                onClick={() => handleAnalyze()}
                disabled={loading || !url.trim()}
                className="px-[26px] shrink-0 font-mono font-black text-xs tracking-[1px] uppercase transition-all whitespace-nowrap disabled:bg-[#111] disabled:text-yc-border-light disabled:cursor-not-allowed bg-yc-accent text-black cursor-pointer hover:brightness-110"
              >
                {loading ? "Analyzing..." : "Rate It →"}
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
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-[72px] animate-fade-up">
            <div className="mb-7">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="inline-block w-2 h-2 bg-yc-accent rounded-full mx-[5px] animate-bounce"
                  style={{ animationDelay: `${i * 0.18}s` }}
                />
              ))}
            </div>
            <p className="text-yc-muted font-mono text-xs tracking-[2px] uppercase">
              {LOADING_STEPS[stepIndex]}
            </p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="p-[18px_20px] bg-grade-d/5 border border-grade-d/20 rounded-[10px] text-grade-d font-mono text-[13px] mb-6 animate-fade-up">
            ✗ {error}
            <button
              onClick={handleReset}
              className="ml-4 bg-transparent border-none text-grade-d/50 cursor-pointer font-mono text-[11px] underline hover:text-grade-d"
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
                className="font-mono text-[11px] text-yc-muted hover:text-yc-dim bg-transparent border-none cursor-pointer transition-colors uppercase tracking-[1px]"
              >
                ← Back
              </button>
              <button
                onClick={handleShare}
                className="font-mono text-[11px] px-4 py-2 rounded-lg bg-yc-surface border border-yc-border text-yc-dim hover:border-yc-accent/30 hover:text-yc-accent cursor-pointer transition-all"
              >
                {copied ? "Copied!" : "Share Link"}
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
        <div className="mt-16 text-center">
          <p className="font-mono text-[10px] text-yc-muted/40 tracking-[2px] uppercase">
            Built by IntelliForge AI
          </p>
        </div>
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
