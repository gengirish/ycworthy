// src/lib/http.ts
//
// Shared HTTP helpers for the public YCWorthy API:
//   • CORS for browser-based automation (cross-origin fetch from any frontend)
//   • Request IDs (correlation across logs / client retries)
//   • Standard `meta` envelope (api_version, request_id, timestamp, durations)
//
// Every public route should use `corsHeaders()` + `withMeta()` so MCP servers,
// CLIs, GitHub Actions, and browser apps all get identical, predictable shapes.

import { NextResponse } from "next/server";
import { API_VERSION } from "./version";

/**
 * Generate the CORS headers used by every public endpoint.
 *
 * We allow `*` because the API is read-only-ish (POST analyze creates no
 * server-side state) and is meant to be embeddable from any automation
 * surface. If you ever add auth, swap `*` for an allowlist.
 */
export function corsHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Request-Id",
    "Access-Control-Expose-Headers":
      "X-Provider, X-Provider-Fallback, X-Duration-Ms, X-Request-Id, X-Api-Version",
    "Access-Control-Max-Age": "86400",
    "X-Api-Version": API_VERSION,
    ...extra,
  };
}

/** Empty 204 response for CORS preflight. */
export function preflight(): NextResponse {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

/**
 * Generate a request ID. Uses Web Crypto when available (Edge / modern Node)
 * and falls back to a Math.random fingerprint that's still ID-shaped.
 */
export function newRequestId(): string {
  const g = globalThis as { crypto?: { randomUUID?: () => string } };
  if (g.crypto?.randomUUID) return g.crypto.randomUUID();
  // RFC4122-ish fallback (good enough for log correlation, not for security).
  const r = () => Math.random().toString(16).slice(2, 10);
  return `${r()}-${r().slice(0, 4)}-${r().slice(0, 4)}-${r().slice(0, 4)}-${r()}${r().slice(0, 4)}`;
}

/**
 * Wrap any JSON payload in the standard envelope:
 *
 *   {
 *     ...payload,
 *     meta: { api_version, request_id, timestamp, duration_ms }
 *   }
 *
 * Backwards-compatible — existing fields (`data`, `provider`, `duration_ms`,
 * `error`) stay at the top level so the existing useAnalyze() hook and any
 * v0 consumers keep working.
 */
export interface Meta {
  api_version: string;
  request_id: string;
  timestamp: string;
  duration_ms: number;
}

export function buildMeta(requestId: string, startMs: number): Meta {
  return {
    api_version: API_VERSION,
    request_id: requestId,
    timestamp: new Date().toISOString(),
    duration_ms: Date.now() - startMs,
  };
}

/**
 * Standard JSON response with CORS headers and meta envelope merged in.
 */
export function jsonResponse<T extends object>(
  payload: T,
  init: { status?: number; headers?: Record<string, string>; meta?: Meta } = {}
): NextResponse {
  const headers = corsHeaders(init.headers);
  const body = init.meta ? { ...payload, meta: init.meta } : payload;
  return NextResponse.json(body, { status: init.status ?? 200, headers });
}

/**
 * Standard error response — `{ error, error_code?, meta }`.
 *
 * Always includes the meta envelope so MCP servers / clients can correlate
 * even when something went wrong.
 */
export function errorResponse(
  message: string,
  init: {
    status: number;
    code?: string;
    meta?: Meta;
    extra?: Record<string, unknown>;
    headers?: Record<string, string>;
  }
): NextResponse {
  const body: Record<string, unknown> = { error: message };
  if (init.code) body.error_code = init.code;
  if (init.extra) Object.assign(body, init.extra);
  if (init.meta) body.meta = init.meta;
  return NextResponse.json(body, {
    status: init.status,
    headers: corsHeaders(init.headers),
  });
}
