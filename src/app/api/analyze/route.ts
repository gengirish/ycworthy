// src/app/api/analyze/route.ts
//
// Public API surface for analyzing a startup URL.
//
//   GET    /api/analyze?url=...&provider=gemini   ← simple curl/MCP/browser
//   POST   /api/analyze   { url, provider? }      ← classic JSON body
//   OPTIONS                                       ← CORS preflight
//
// Default provider: Gemini (gemini-2.5-flash). On Gemini failure we fall back
// automatically to NVIDIA Nemotron Ultra 253B (NIM preferred, OpenRouter
// fallback transport). Anthropic / Claude has been fully removed.
//
// Every response carries a `meta` envelope: { api_version, request_id,
// timestamp, duration_ms }. Headers also expose `X-Request-Id`, `X-Provider`,
// `X-Provider-Fallback`, `X-Duration-Ms`, `X-Api-Version` so non-JSON
// consumers (CI, shell scripts) can read the same info.

import { NextRequest } from "next/server";
import { z } from "zod";
import { NvidiaProvider, hasAnyNvidiaKey } from "@/lib/nvidia";
import { GeminiProvider } from "@/lib/gemini";
import { AIProvider, AnalysisProvider, AnalysisResult } from "@/lib/types";
import {
  buildMeta,
  errorResponse,
  jsonResponse,
  newRequestId,
  preflight,
} from "@/lib/http";

const ProviderSchema = z.enum(["nvidia", "gemini"]).default("gemini");

const RequestSchema = z.object({
  url: z.string().url("Invalid URL format"),
  provider: ProviderSchema,
});

function hasGeminiKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY ?? process.env.GOOGLE_AI_API_KEY);
}

function hasNvidiaKey(): boolean {
  // True when EITHER NVIDIA NIM (preferred) or OpenRouter is configured.
  return hasAnyNvidiaKey();
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

interface AnalyzeInput {
  url: string;
  provider: AIProvider;
}

/**
 * Core analyze pipeline. Shared between GET and POST.
 * Returns a fully-formed NextResponse so callers don't repeat envelope wiring.
 */
async function runAnalyze(
  input: AnalyzeInput,
  requestId: string,
  startMs: number
) {
  const { url, provider: requested } = input;

  // Hard guard: no provider configured at all.
  if (!hasGeminiKey() && !hasNvidiaKey()) {
    return errorResponse(
      "No AI provider configured. Set GEMINI_API_KEY (primary) and/or NVIDIA_NIM_API_KEY (preferred) or OPENROUTER_API_KEY (NVIDIA fallback transports).",
      {
        status: 500,
        code: "no_provider_configured",
        meta: buildMeta(requestId, startMs),
        headers: { "X-Request-Id": requestId },
      }
    );
  }

  // Build the call order: requested first, the other as fallback.
  const order: AIProvider[] =
    requested === "nvidia" ? ["nvidia", "gemini"] : ["gemini", "nvidia"];

  const errors: Partial<Record<AIProvider, string>> = {};
  let result: RunResult | null = null;

  for (let i = 0; i < order.length; i++) {
    const provider = order[i];
    if (provider === "nvidia" && !hasNvidiaKey()) continue;
    if (provider === "gemini" && !hasGeminiKey()) continue;

    try {
      const data = await tryRun(provider, url);
      result = {
        data,
        provider,
        fallback_used: i > 0,
        primary_error: errors[order[0]],
      };
      break;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors[provider] = msg;
      console.error(`[analyze] ${provider} failed (req=${requestId}):`, err);
    }
  }

  if (!result) {
    const detail = Object.entries(errors)
      .map(([p, m]) => `${p}: ${m}`)
      .join(" | ");
    return errorResponse(
      detail.length > 0
        ? `All AI providers failed. ${detail}`
        : "All AI providers failed.",
      {
        status: 502,
        code: "all_providers_failed",
        meta: buildMeta(requestId, startMs),
        extra: { provider_errors: errors },
        headers: { "X-Request-Id": requestId },
      }
    );
  }

  const meta = buildMeta(requestId, startMs);

  return jsonResponse(
    {
      data: result.data,
      provider: result.provider,
      // Backwards-compatible top-level duration alongside meta.duration_ms.
      duration_ms: meta.duration_ms,
      fallback_used: result.fallback_used,
      requested_provider: requested,
      ...(result.primary_error ? { primary_error: result.primary_error } : {}),
    },
    {
      meta,
      headers: {
        "X-Provider": result.provider,
        "X-Provider-Fallback": result.fallback_used ? "true" : "false",
        "X-Duration-Ms": String(meta.duration_ms),
        "X-Request-Id": requestId,
        "Cache-Control": "no-store",
      },
    }
  );
}

// ── Handlers ────────────────────────────────────────────────────────────────

export async function OPTIONS() {
  return preflight();
}

export async function POST(req: NextRequest) {
  const start = Date.now();
  const requestId = req.headers.get("x-request-id") ?? newRequestId();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON body", {
      status: 400,
      code: "invalid_json",
      meta: buildMeta(requestId, start),
      headers: { "X-Request-Id": requestId },
    });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(parsed.error.errors[0].message, {
      status: 422,
      code: "validation_failed",
      meta: buildMeta(requestId, start),
      extra: { issues: parsed.error.issues },
      headers: { "X-Request-Id": requestId },
    });
  }

  return runAnalyze(parsed.data, requestId, start);
}

export async function GET(req: NextRequest) {
  const start = Date.now();
  const requestId = req.headers.get("x-request-id") ?? newRequestId();

  const { searchParams } = new URL(req.url);
  const rawUrl = searchParams.get("url");
  const rawProvider = searchParams.get("provider") ?? undefined;

  if (!rawUrl) {
    return errorResponse(
      "Missing required query param: url. Try /api/analyze?url=https://example.com",
      {
        status: 422,
        code: "missing_url",
        meta: buildMeta(requestId, start),
        headers: { "X-Request-Id": requestId },
      }
    );
  }

  const parsed = RequestSchema.safeParse({ url: rawUrl, provider: rawProvider });
  if (!parsed.success) {
    return errorResponse(parsed.error.errors[0].message, {
      status: 422,
      code: "validation_failed",
      meta: buildMeta(requestId, start),
      extra: { issues: parsed.error.issues },
      headers: { "X-Request-Id": requestId },
    });
  }

  return runAnalyze(parsed.data, requestId, start);
}

// Vercel Pro: allow up to 60s for slow LLM responses.
export const maxDuration = 60;
