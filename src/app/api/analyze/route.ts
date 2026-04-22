// src/app/api/analyze/route.ts
//
// POST /api/analyze
// Default provider: Gemini (gemini-2.5-flash).
// On Gemini failure (or when explicitly requested) we fall back to NVIDIA
// Nemotron Ultra 253B via OpenRouter.
// Anthropic / Claude has been fully removed.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { NvidiaProvider } from "@/lib/nvidia";
import { GeminiProvider } from "@/lib/gemini";
import { AIProvider, AnalysisProvider, AnalysisResult } from "@/lib/types";

const RequestSchema = z.object({
  url: z.string().url("Invalid URL format"),
  provider: z.enum(["nvidia", "gemini"]).default("gemini"),
});

function hasGeminiKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY ?? process.env.GOOGLE_AI_API_KEY);
}

function hasNvidiaKey(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY);
}

interface RunResult {
  data: AnalysisResult;
  provider: AIProvider;
  fallback_used: boolean;
  primary_error?: string;
}

async function tryRun(
  provider: AIProvider,
  url: string
): Promise<AnalysisResult> {
  const analyzer: AnalysisProvider =
    provider === "gemini" ? new GeminiProvider() : new NvidiaProvider();
  return analyzer.analyze(url);
}

export async function POST(req: NextRequest) {
  const start = Date.now();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 422 }
    );
  }

  const { url, provider: requested } = parsed.data;

  // Hard guard: if neither provider is configured, fail fast with a clear message.
  if (!hasGeminiKey() && !hasNvidiaKey()) {
    return NextResponse.json(
      {
        error:
          "No AI provider configured. Set GEMINI_API_KEY (primary) and/or OPENROUTER_API_KEY (NVIDIA fallback).",
      },
      { status: 500 }
    );
  }

  // Build the call order: requested first, the other as fallback.
  const order: AIProvider[] =
    requested === "nvidia" ? ["nvidia", "gemini"] : ["gemini", "nvidia"];

  let lastError: unknown = null;
  let result: RunResult | null = null;

  for (let i = 0; i < order.length; i++) {
    const provider = order[i];

    // Skip providers that aren't configured rather than 500ing.
    if (provider === "nvidia" && !hasNvidiaKey()) continue;
    if (provider === "gemini" && !hasGeminiKey()) continue;

    try {
      const data = await tryRun(provider, url);
      result = {
        data,
        provider,
        fallback_used: i > 0,
        primary_error:
          i > 0 && lastError instanceof Error ? lastError.message : undefined,
      };
      break;
    } catch (err) {
      lastError = err;
      console.error(`[analyze] ${provider} failed:`, err);
      // Continue to next provider in the order.
    }
  }

  if (!result) {
    const message =
      lastError instanceof Error
        ? lastError.message
        : "All AI providers failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const duration_ms = Date.now() - start;

  return NextResponse.json(
    {
      data: result.data,
      provider: result.provider,
      duration_ms,
      fallback_used: result.fallback_used,
      ...(result.primary_error ? { primary_error: result.primary_error } : {}),
    },
    {
      status: 200,
      headers: {
        "X-Provider": result.provider,
        "X-Provider-Fallback": result.fallback_used ? "true" : "false",
        "X-Duration-Ms": String(duration_ms),
      },
    }
  );
}

// Vercel Pro: allow up to 60s for slow LLM responses.
export const maxDuration = 60;
