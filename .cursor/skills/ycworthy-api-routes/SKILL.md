---
name: ycworthy-api-routes
description: Guides creation of Next.js API routes following YCWorthy conventions. Use when adding new endpoints, creating API routes, modifying the OpenAPI spec, or asking about CORS, MCP-friendly responses, request IDs, or response patterns.
---

# YCWorthy API Routes

## Public surface (v1.0.0)

All API routes live under `src/app/api/` and are public, no-auth, CORS-enabled, with a standard `meta` envelope on every response.

```
src/app/api/
├── analyze/route.ts          # POST + GET + OPTIONS — main analysis pipeline
├── health/route.ts           # GET + OPTIONS — provider availability + status
└── openapi.json/route.ts     # GET + OPTIONS — OpenAPI 3.1 spec (machine-readable contract)
```

| Endpoint | Methods | Purpose |
|----------|---------|---------|
| `/api/analyze` | `POST`, `GET`, `OPTIONS` | Run a YC partner analysis on a URL |
| `/api/health` | `GET`, `OPTIONS` | Status + which providers are configured |
| `/api/openapi.json` | `GET`, `OPTIONS` | Live OpenAPI 3.1 spec |

## Standard response envelope

Every JSON response — success and error — must include a `meta` object built via `buildMeta(requestId, startMs)`:

```json
{
  "...payload...": "...",
  "meta": {
    "api_version": "1.0.0",
    "request_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "timestamp": "2026-04-23T02:21:48.840Z",
    "duration_ms": 4827
  }
}
```

Matching headers (set via `corsHeaders` + per-route extras): `X-Api-Version`, `X-Request-Id`, `X-Duration-Ms`, plus route-specific ones like `X-Provider`, `X-Provider-Fallback`.

## Shared helpers (`src/lib/http.ts`)

```typescript
import {
  corsHeaders,    // (extra?) → CORS header object
  preflight,      // 204 with CORS headers — return from OPTIONS handlers
  newRequestId,   // crypto.randomUUID() with fallback
  buildMeta,      // (requestId, startMs) → Meta object
  jsonResponse,   // (payload, { status?, headers?, meta? }) — standard JSON response
  errorResponse,  // (message, { status, code?, meta?, extra?, headers? }) — standard error
} from "@/lib/http";

import { API_VERSION } from "@/lib/version";  // single source of truth
```

## Route template (YCWorthy pattern)

```typescript
import { NextRequest } from "next/server";
import { z } from "zod";
import {
  buildMeta,
  errorResponse,
  jsonResponse,
  newRequestId,
  preflight,
} from "@/lib/http";

const RequestSchema = z.object({
  field1: z.string().min(1, "Required"),
  field2: z.enum(["a", "b"]).default("a"),
});

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

  // ... business logic ...
  const result = await doWork(parsed.data);
  const meta = buildMeta(requestId, start);

  return jsonResponse(
    { data: result, duration_ms: meta.duration_ms },
    {
      meta,
      headers: { "X-Request-Id": requestId, "Cache-Control": "no-store" },
    }
  );
}

// For AI-powered routes only:
export const maxDuration = 60;
```

## GET-friendly endpoints (curl / MCP / browser)

When an endpoint is called by automation (CLI, MCP, GitHub Actions), having a GET form is invaluable. Mirror the POST validation logic against `URL.searchParams` and reuse the same pipeline:

```typescript
export async function GET(req: NextRequest) {
  const start = Date.now();
  const requestId = req.headers.get("x-request-id") ?? newRequestId();
  const { searchParams } = new URL(req.url);

  const parsed = RequestSchema.safeParse({
    field1: searchParams.get("field1") ?? undefined,
    field2: searchParams.get("field2") ?? undefined,
  });
  if (!parsed.success) {
    return errorResponse(parsed.error.errors[0].message, {
      status: 422, code: "validation_failed",
      meta: buildMeta(requestId, start),
      headers: { "X-Request-Id": requestId },
    });
  }
  return runShared(parsed.data, requestId, start);
}
```

## Error code catalog

Every `errorResponse` should have a stable `error_code` so MCP servers, CI scripts, and clients can branch on machine-readable identifiers. Current codes:

| Code | Status | When |
|------|--------|------|
| `invalid_json` | 400 | Body wasn't valid JSON |
| `missing_url` | 422 | GET without required `url` query param |
| `validation_failed` | 422 | Zod parse failure |
| `no_provider_configured` | 500 | Server has no AI provider keys |
| `all_providers_failed` | 502 | Both Gemini and NVIDIA failed |

Add new codes here whenever you introduce one in code, and add the enum value to `ErrorResponse.properties.error_code` in `src/app/api/openapi.json/route.ts`.

## OpenAPI spec — keep it in sync

The spec at `src/app/api/openapi.json/route.ts` is **hand-maintained**. Whenever you:
- Add or remove an endpoint
- Add or change request/response fields
- Add a new `error_code`
- Bump behavior in a way clients should know about

…update the spec **in the same commit**, and bump `API_VERSION` in `src/lib/version.ts`:
- Patch — bug fixes, doc tweaks
- Minor — new optional fields, new endpoints (additive)
- Major — breaking changes (reserve `/api/v2/...` for these)

## Rate limiting (in-memory)

For added rate limiting on heavy routes:

```typescript
const hits = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, max: number, windowSeconds: number) {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { allowed: true, resetInSeconds: windowSeconds };
  }
  if (entry.count >= max) {
    return { allowed: false, resetInSeconds: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count++;
  return { allowed: true, resetInSeconds: Math.ceil((entry.resetAt - now) / 1000) };
}
```

Usage:

```typescript
const ip = req.headers.get("x-forwarded-for") ?? "unknown";
const rl = checkRateLimit(`analyze:${ip}`, 5, 3600);
if (!rl.allowed) {
  return errorResponse(`Rate limit exceeded. Try again in ${rl.resetInSeconds}s.`, {
    status: 429, code: "rate_limited",
    meta: buildMeta(requestId, start),
    headers: { "Retry-After": String(rl.resetInSeconds), "X-Request-Id": requestId },
  });
}
```

## Checklist for new public routes

1. Create directory: `src/app/api/your-route/route.ts`
2. Export `OPTIONS` returning `preflight()` (CORS support)
3. Generate `requestId` from `x-request-id` header or `newRequestId()` at the top of every handler
4. Define Zod schema for request body / query
5. Guard required environment variables — return `errorResponse(..., { code: "missing_config" })` not 500
6. Use `errorResponse()` for failures (always include `error_code`)
7. Use `jsonResponse(payload, { meta, headers })` for success
8. Add the new endpoint to `src/app/api/openapi.json/route.ts` (paths + schemas + error codes)
9. Bump `API_VERSION` if the change is observable to clients
10. Add `maxDuration = 60` if the operation may be slow
11. Log errors with `console.error("[route]", err)` (never expose raw errors to client)
12. Document the endpoint in `docs/API.md`

## Key rules

1. **CORS by default** — all public routes export `OPTIONS` and use `corsHeaders()`
2. **Always validate inputs** with Zod before processing
3. **Never expose raw API errors** — wrap in `errorResponse()` with stable `error_code`
4. **Never read env vars in client components** — only in API routes
5. **Add `X-Provider` header** when AI is used (and `X-Provider-Fallback`)
6. **Use `meta.duration_ms` from `buildMeta()`** for timing — don't roll your own
7. **`maxDuration = 60`** for AI-powered routes (requires Vercel Pro)
8. **Keep the OpenAPI spec in sync** — same commit as the route change
