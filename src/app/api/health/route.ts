// src/app/api/health/route.ts
//
// Public health/readiness check. Used by:
//   • External monitors (UptimeRobot, BetterStack, statuscake, etc.)
//   • The MCP server / CLI to verify which providers are available before a call
//   • CI smoke tests after deploy
//
// Response (200):
//   {
//     status: "ok" | "degraded",
//     providers: {
//       gemini:  { configured: boolean, model: string },
//       nvidia:  { configured: boolean, transport: "nim" | "openrouter" | null, model: string }
//     },
//     meta: { api_version, request_id, timestamp, duration_ms }
//   }
//
// `status` is "degraded" if zero providers are configured (the API will 500
// on /api/analyze in that state, so monitors should alert).

import { NextRequest } from "next/server";
import {
  buildMeta,
  jsonResponse,
  newRequestId,
  preflight,
} from "@/lib/http";
import { hasAnyNvidiaKey } from "@/lib/nvidia";

const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
const DEFAULT_NIM_MODEL = "nvidia/llama-3.1-nemotron-ultra-253b-v1";
const DEFAULT_OPENROUTER_MODEL = "nvidia/llama-3.1-nemotron-ultra-253b-v1";

export async function OPTIONS() {
  return preflight();
}

export async function GET(req: NextRequest) {
  const start = Date.now();
  const requestId = req.headers.get("x-request-id") ?? newRequestId();

  const geminiConfigured = Boolean(
    process.env.GEMINI_API_KEY ?? process.env.GOOGLE_AI_API_KEY
  );
  const nimConfigured = Boolean(process.env.NVIDIA_NIM_API_KEY);
  const openrouterConfigured = Boolean(process.env.OPENROUTER_API_KEY);
  const nvidiaConfigured = hasAnyNvidiaKey();

  // Match NvidiaProvider's preference order: NIM > OpenRouter.
  const nvidiaTransport: "nim" | "openrouter" | null = nimConfigured
    ? "nim"
    : openrouterConfigured
    ? "openrouter"
    : null;

  const status =
    geminiConfigured || nvidiaConfigured ? "ok" : "degraded";

  return jsonResponse(
    {
      status,
      providers: {
        gemini: {
          configured: geminiConfigured,
          model: process.env.GEMINI_MODEL ?? DEFAULT_GEMINI_MODEL,
        },
        nvidia: {
          configured: nvidiaConfigured,
          transport: nvidiaTransport,
          model:
            nvidiaTransport === "nim"
              ? process.env.NVIDIA_NIM_MODEL ?? DEFAULT_NIM_MODEL
              : process.env.OPENROUTER_NVIDIA_MODEL ?? DEFAULT_OPENROUTER_MODEL,
        },
      },
    },
    {
      status: status === "ok" ? 200 : 503,
      meta: buildMeta(requestId, start),
      headers: {
        "X-Request-Id": requestId,
        "Cache-Control": "no-store",
      },
    }
  );
}
