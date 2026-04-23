# YCWorthy REST API

**Base URL (production):** `https://ycworthy.intelliforge.tech`
**API version:** `1.0.0` (semver — see [`src/lib/version.ts`](../src/lib/version.ts))
**Spec:** OpenAPI 3.1 — live at `GET /api/openapi.json`

The YCWorthy API is a public, no-auth, CORS-enabled REST endpoint that runs a Y Combinator partner-style evaluation on any URL. It's designed to be called from anywhere — browsers, scripts, CI, MCP servers, Custom GPTs, anything that speaks HTTP.

---

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/analyze` | Analyze a URL (JSON body — recommended for production) |
| `GET` | `/api/analyze?url=...` | Analyze a URL (query string — handy for curl, browsers, MCP) |
| `OPTIONS` | `/api/analyze` | CORS preflight |
| `GET` | `/api/health` | Status + provider availability |
| `GET` | `/api/openapi.json` | This API's OpenAPI 3.1 spec |

---

## Standard response envelope

Every JSON response includes a `meta` object so any caller can correlate logs, detect API drift, and time requests:

```json
{
  "...endpoint-specific fields...": "...",
  "meta": {
    "api_version": "1.0.0",
    "request_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "timestamp": "2026-04-23T02:21:48.840Z",
    "duration_ms": 4827
  }
}
```

The same correlation IDs are exposed as headers so non-JSON consumers (shell scripts, monitoring tools) can read them too:

| Header | Description |
|--------|-------------|
| `X-Api-Version` | Same as `meta.api_version` |
| `X-Request-Id` | Same as `meta.request_id`. Send your own to override. |
| `X-Duration-Ms` | Server-side wall-clock duration |
| `X-Provider` | `gemini`, `nvidia`, or `grok` (which provider produced the analysis) |
| `X-Provider-Fallback` | `true` if the requested provider failed and the fallback succeeded |

---

## `POST /api/analyze`

### Request

```http
POST /api/analyze HTTP/1.1
Content-Type: application/json
X-Request-Id: my-correlation-id   # optional

{
  "url": "https://stripe.com",
  "provider": "gemini"            // optional, "gemini" (default) | "nvidia" | "grok"
}
```

### Success (`200 OK`)

```json
{
  "data": {
    "company": "Stripe",
    "tagline": "Payments infrastructure for the internet",
    "overall_grade": "S",
    "overall_score": 98,
    "verdict": "...",
    "yc_likelihood": "Strong",
    "criteria": {
      "problem":  { "grade": "S", "score": 95, "summary": "..." },
      "market":   { "grade": "S", "score": 99, "summary": "..." },
      "solution": { "grade": "S", "score": 96, "summary": "..." },
      "traction": { "grade": "S", "score": 99, "summary": "..." },
      "founder":  { "grade": "A", "score": 90, "summary": "..." },
      "timing":   { "grade": "A", "score": 88, "summary": "..." }
    },
    "red_flags":  ["..."],
    "green_flags": ["..."],
    "yc_interview_question": "..."
  },
  "provider": "gemini",
  "requested_provider": "gemini",
  "duration_ms": 5608,
  "fallback_used": false,
  "meta": { "api_version": "1.0.0", "request_id": "...", "timestamp": "...", "duration_ms": 5608 }
}
```

### Failures

All errors share this shape:

```json
{
  "error": "human readable message",
  "error_code": "validation_failed",
  "meta": { ... }
}
```

| Status | `error_code` | Meaning |
|--------|--------------|---------|
| `400` | `invalid_json` | Body wasn't valid JSON |
| `422` | `missing_url` | GET without `url` query param |
| `422` | `validation_failed` | URL malformed or provider invalid (see `issues` for details) |
| `500` | `no_provider_configured` | Server has no AI keys configured |
| `502` | `all_providers_failed` | All configured providers failed (see `provider_errors` for per-provider detail) |

When `502` is returned, the response also includes `provider_errors`:

```json
{
  "error": "All AI providers failed. gemini: 429 quota exceeded | nvidia: ... | grok: ...",
  "error_code": "all_providers_failed",
  "provider_errors": {
    "gemini": "Gemini 429: ...",
    "nvidia": "NVIDIA NIM 503: ...",
    "grok": "Grok 429: ..."
  },
  "meta": { ... }
}
```

---

## `GET /api/analyze`

Same pipeline as POST, just URL-encoded — handy for curl, browsers, dashboards, MCP servers, and anywhere a one-liner is easier than building a JSON body.

```bash
curl -s "https://ycworthy.intelliforge.tech/api/analyze?url=https://stripe.com&provider=gemini" | jq .
```

Same response envelope as POST.

---

## `GET /api/health`

Health/readiness check. Returns `200 ok` when at least one provider is configured, `503 degraded` when none are.

```bash
$ curl -s https://ycworthy.intelliforge.tech/api/health | jq .
{
  "status": "ok",
  "providers": {
    "gemini": { "configured": true,  "model": "gemini-2.5-flash" },
    "nvidia": { "configured": true,  "transport": "nim", "model": "nvidia/llama-3.1-nemotron-ultra-253b-v1" },
    "grok": { "configured": false, "model": "grok-3-mini" }
  },
  "meta": { "api_version": "1.0.0", "request_id": "...", "timestamp": "...", "duration_ms": 4 }
}
```

---

## `GET /api/openapi.json`

Returns the full OpenAPI 3.1 spec. Use it to:
- Generate typed clients (`openapi-typescript-codegen`, `openapi-fetch`, `openapi-generator`)
- Import into Postman / Insomnia / Bruno / Hoppscotch
- Wire into Custom GPT Actions
- Power LSP completions in your IDE

```bash
curl -s https://ycworthy.intelliforge.tech/api/openapi.json -o ycworthy.openapi.json
npx openapi-typescript ycworthy.openapi.json -o src/types/ycworthy.ts
```

---

## CORS

The API responds with `Access-Control-Allow-Origin: *` and exposes the standard request headers so any frontend can call it directly:

```js
const res = await fetch("https://ycworthy.intelliforge.tech/api/analyze", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ url: "https://stripe.com" }),
});
const json = await res.json();
console.log(json.data.overall_grade);
```

Browsers will issue an `OPTIONS` preflight automatically — the API responds `204` with the appropriate `Access-Control-*` headers.

---

## Rate limits

The hosted API has soft rate limits (currently ~5 analyses/min/IP) tied to upstream provider quotas. If you're building automation that needs higher throughput, **self-host the project** — the codebase is open source and Vercel-deployable in two minutes (see [README → Deploy](../README.md#deploy-to-vercel)).

---

## Versioning

- The version string lives in `src/lib/version.ts` and is reported via `meta.api_version` and the `X-Api-Version` header.
- Backwards-compatible additions bump the **patch** version.
- New fields, new endpoints, new optional params bump the **minor** version.
- Breaking changes (rename / remove fields, change semantics) bump the **major** version and live on a new URL prefix (`/api/v2/analyze`) with the v1 path kept alive for at least 90 days.

---

## See also

- [`docs/MCP.md`](./MCP.md) — Use the API as an MCP tool in Claude / Cursor / Codex.
- [`docs/AUTOMATION.md`](./AUTOMATION.md) — Cookbook: curl, Python, Node, GitHub Actions, n8n.
- [`README.md`](../README.md) — Project overview and self-hosting.
