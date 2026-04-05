---
name: ycworthy-api-routes
description: Guides creation of Next.js API routes following YCWorthy conventions. Use when adding new endpoints, creating API routes, or asking about the API structure, validation, rate limiting, or response patterns.
---

# YCWorthy API Routes

## Route Structure

All API routes live under `src/app/api/`. Each route is a directory with a `route.ts` file.

```
src/app/api/
└── analyze/route.ts    # POST: analyze startup URL with AI provider
```

## Existing Route: `/api/analyze`

```typescript
// POST /api/analyze
// Body: { url: string, provider: "claude" | "gemini" }
// Response: { data: AnalysisResult, provider: AIProvider, duration_ms: number }
// Error: { error: string }
// Headers: X-Provider, X-Duration-Ms
// maxDuration: 60s (Vercel Pro/Enterprise)
```

## Route Template

### Public POST Route (YCWorthy Pattern)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const RequestSchema = z.object({
  field1: z.string().min(1, "Required"),
  field2: z.enum(["option1", "option2"]).default("option1"),
});

export async function POST(req: NextRequest) {
  const start = Date.now();

  // 1. Parse body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // 2. Validate with Zod
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 422 }
    );
  }

  // 3. Guard env vars
  if (!process.env.REQUIRED_KEY) {
    return NextResponse.json(
      { error: "REQUIRED_KEY is not configured" },
      { status: 500 }
    );
  }

  // 4. Business logic
  try {
    const result = await doWork(parsed.data);
    const duration_ms = Date.now() - start;

    return NextResponse.json(
      { data: result, duration_ms },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("[route] error:", err);
    const message = err instanceof Error ? err.message : "Failed unexpectedly";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

## Response Conventions

```typescript
// Error responses — always { error: string }
return NextResponse.json({ error: "Invalid URL format" }, { status: 422 });
return NextResponse.json({ error: "API key not configured" }, { status: 500 });
return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

// Success responses — { data, provider, duration_ms }
return NextResponse.json({ data: analysisResult, provider: "claude", duration_ms: 12340 });
```

## Rate Limiting (In-Memory)

For adding rate limiting to public endpoints:

```typescript
// src/lib/rate-limit.ts
const hits = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, max: number, windowSeconds: number) {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { allowed: true, resetInSeconds: windowSeconds };
  }

  if (entry.count >= max) {
    const resetInSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, resetInSeconds };
  }

  entry.count++;
  return { allowed: true, resetInSeconds: Math.ceil((entry.resetAt - now) / 1000) };
}
```

Usage in route:

```typescript
import { checkRateLimit } from "@/lib/rate-limit";

const ip = req.headers.get("x-forwarded-for") ?? "unknown";
const rl = checkRateLimit(`analyze:${ip}`, 5, 3600);
if (!rl.allowed) {
  return NextResponse.json(
    { error: `Rate limit exceeded. Try again in ${rl.resetInSeconds}s.` },
    { status: 429, headers: { "Retry-After": String(rl.resetInSeconds) } }
  );
}
```

## Checklist for New Routes

1. Create directory: `src/app/api/your-route/route.ts`
2. Define Zod schema for request body
3. Guard required environment variables
4. Add rate limiting for user-facing POST endpoints
5. Return `{ error: string }` on failure
6. Return `{ data, ...metadata }` on success
7. Add `maxDuration` if the operation may be slow
8. Log errors with `console.error()` (never expose raw errors to client)

## Key Rules

1. **Always validate inputs** with Zod before processing
2. **Never expose raw API errors** — sanitize error messages
3. **Never read env vars in client components** — only in API routes
4. **Add `X-Provider` header** when AI is used
5. **Use `Date.now()` timing** for `duration_ms` in responses
6. **`maxDuration = 60`** for AI-powered routes (requires Vercel Pro)
