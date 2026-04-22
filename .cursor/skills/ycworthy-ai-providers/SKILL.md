---
name: ycworthy-ai-providers
description: Orchestrate AI analysis with Google Gemini (primary / default) and NVIDIA Nemotron via OpenRouter (automatic fallback). Covers prompt engineering, JSON parsing, the AnalysisProvider abstraction, and the route-level fallback chain. Use when working with AI integration, prompts, adding new providers, or debugging AI response parsing.
---

# YCWorthy AI Providers

> **Anthropic / Claude has been fully removed.** The `@anthropic-ai/sdk` package is no longer a dependency. Do not reintroduce it.

## Architecture

Both providers implement the `AnalysisProvider` interface and share the same system prompt. The API route always tries the requested provider first and automatically falls back to the other on failure. **Gemini is the default** — `provider` field defaults to `"gemini"` in the Zod schema.

```
POST /api/analyze   (provider defaults to "gemini")
        ↓
order = requested === "nvidia" ? ["nvidia", "gemini"] : ["gemini", "nvidia"]
        ↓
for provider of order:
    try analyzer.analyze(url) → return { data, provider, fallback_used }
    catch → log + try next provider
        ↓
GeminiProvider                            NvidiaProvider
(@google/generative-ai SDK,               (OpenRouter, native fetch,
 gemini-2.5-flash, JSON mode)              nvidia/llama-3.1-nemotron-ultra-253b-v1)
        ↓                                       ↓
              Parse JSON (shared parseJSON helper)
                              ↓
                      AnalysisResult (shared type)
```

## Provider Interface

```typescript
// src/lib/types.ts
export type AIProvider = "nvidia" | "gemini";

export interface AnalysisProvider {
  analyze(url: string): Promise<AnalysisResult>;
}
```

## Gemini Provider (`src/lib/gemini.ts`) — primary / default

- **API**: `@google/generative-ai` SDK
- **API key**: reads `GEMINI_API_KEY` first, falls back to legacy `GOOGLE_AI_API_KEY`
- **Model**: `gemini-2.5-flash` (override via `GEMINI_MODEL`)
- **Feature**: `responseMimeType: "application/json"` for native JSON mode
- **Temperature**: 0.4
- **Max tokens**: 4096

```typescript
const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_AI_API_KEY;
const model = this.genAI.getGenerativeModel({
  model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
  systemInstruction: SYSTEM_PROMPT,
  generationConfig: {
    maxOutputTokens: 4096,
    temperature: 0.4,
    responseMimeType: "application/json",
  },
});
```

## NVIDIA Provider (`src/lib/nvidia.ts`) — automatic fallback

The provider supports **two OpenAI-compatible transports** for the same
`nvidia/llama-3.1-nemotron-ultra-253b-v1` model. It picks one at construction
time based on which env vars are present, in this preference order:

1. **NVIDIA NIM (preferred)** — direct NVIDIA inference API
   - Endpoint: `https://integrate.api.nvidia.com/v1/chat/completions`
   - Auth: `Authorization: Bearer ${NVIDIA_NIM_API_KEY}` (`nvapi-...`)
   - Free tier: ~1000 req/month with a personal key from [build.nvidia.com](https://build.nvidia.com/)
   - Model override: `NVIDIA_NIM_MODEL`

2. **OpenRouter (used only if NIM key absent)**
   - Endpoint: `https://openrouter.ai/api/v1/chat/completions`
   - Auth: `Authorization: Bearer ${OPENROUTER_API_KEY}` (`sk-or-v1-...`)
   - Recommended headers: `HTTP-Referer` + `X-Title` for ranking attribution
   - Model override: `OPENROUTER_NVIDIA_MODEL`

Shared knobs across both transports:
- **Max tokens**: 2048
- **Temperature**: 0.4
- **JSON enforcement**: `response_format: { type: "json_object" }`

```typescript
// Constructor selects transport at instantiation time.
const nimKey = process.env.NVIDIA_NIM_API_KEY;
const orKey  = process.env.OPENROUTER_API_KEY;

if (nimKey) {
  endpoint = "https://integrate.api.nvidia.com/v1/chat/completions";
  apiKey   = nimKey;
  model    = process.env.NVIDIA_NIM_MODEL ?? DEFAULT_MODEL;
} else if (orKey) {
  endpoint = "https://openrouter.ai/api/v1/chat/completions";
  apiKey   = orKey;
  model    = process.env.OPENROUTER_NVIDIA_MODEL ?? DEFAULT_MODEL;
  extraHeaders = {
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "https://ycworthy.intelliforge.tech",
    "X-Title": "YCWorthy",
  };
}
```

The route uses the helper `hasAnyNvidiaKey()` (exported from `nvidia.ts`) when
deciding whether the NVIDIA leg of the chain is reachable.

## Route-Level Fallback (`src/app/api/analyze/route.ts`)

```typescript
const order: AIProvider[] =
  requested === "nvidia" ? ["nvidia", "gemini"] : ["gemini", "nvidia"];

for (let i = 0; i < order.length; i++) {
  const provider = order[i];
  // skip if env var missing
  if (provider === "nvidia" && !hasNvidiaKey()) continue;
  if (provider === "gemini" && !hasGeminiKey()) continue;
  try {
    const data = await tryRun(provider, url);
    return { data, provider, fallback_used: i > 0 };
  } catch (err) { lastError = err; }
}

function hasGeminiKey() {
  return Boolean(process.env.GEMINI_API_KEY ?? process.env.GOOGLE_AI_API_KEY);
}
function hasNvidiaKey() {
  return Boolean(process.env.OPENROUTER_API_KEY);
}
```

Response includes:
- `data`, `provider`, `duration_ms`
- `fallback_used: true | false`
- Header `X-Provider` and `X-Provider-Fallback`
- Optional `primary_error` (the first provider's error message) when fallback fired

## Shared System Prompt (`src/lib/prompts.ts`)

```typescript
export const SYSTEM_PROMPT = `You are a Y Combinator General Partner...
Return ONLY the JSON object. Nothing else.`;

export const USER_PROMPT = (url: string) =>
  `Analyze this startup/business for YC worthiness...
URL: ${url}`;
```

## JSON Parsing (Both Providers)

```typescript
function parseJSON(raw: string): AnalysisResult {
  const clean = raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(clean) as AnalysisResult;
  } catch {
    // Some Nemotron variants emit chain-of-thought before the JSON; salvage
    // the first {...} object.
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]) as AnalysisResult;
    throw new Error("Failed to parse AI response as JSON");
  }
}
```

## Adding a New Provider

1. Create `src/lib/newprovider.ts` implementing `AnalysisProvider`
2. Use the shared `SYSTEM_PROMPT` and `USER_PROMPT` from `prompts.ts`
3. Use the same `parseJSON` strategy (markdown-fence stripping + regex fallback)
4. Update `AIProvider` type in `types.ts`: `export type AIProvider = "nvidia" | "gemini" | "new";`
5. Update `ModelToggle.tsx` with the new provider entry
6. Update `api/analyze/route.ts` `tryRun` and the `order` array so it participates in the fallback chain
7. Add the new env var to `.env.local.example` and the deploy skill

## Provider Comparison

| Feature | Gemini 2.5 Flash | NVIDIA Nemotron Ultra 253B |
|---------|------------------|----------------------------|
| Role | Primary / default | Automatic fallback |
| API | `@google/generative-ai` SDK | OpenRouter (native fetch) |
| JSON mode | `responseMimeType: "application/json"` | `response_format: json_object` |
| Speed | ~3–6s | ~8–18s |
| Reasoning quality | Fast, cost-efficient | Top-tier (253B params) |
| Override | `GEMINI_MODEL` | `OPENROUTER_NVIDIA_MODEL` |

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "GEMINI_API_KEY (or legacy GOOGLE_AI_API_KEY) is not configured" | Add the key to `.env.local` and to Vercel env vars |
| Gemini 401 / 403 | Key invalid or revoked — rotate at [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| Gemini 429 RESOURCE_EXHAUSTED | Free tier is 20 req/day for `gemini-2.5-flash` — upgrade billing or wait for reset; NVIDIA fallback kicks in either way |
| Gemini 503 "high demand" | Transient — fallback to NVIDIA fires automatically |
| Gemini returns no text (finishReason MAX_TOKENS, no candidates) | `thinkingBudget: 0` is required for 2.5 Flash — already set in `gemini.ts` |
| Gemini returns non-JSON | `responseMimeType` should enforce it; `parseJSON` regex fallback applies |
| "No NVIDIA transport configured" | Set `NVIDIA_NIM_API_KEY` (preferred) or `OPENROUTER_API_KEY` |
| NIM 401 | Rotate at [build.nvidia.com](https://build.nvidia.com/) → Get API Key. If you remove the NIM key the provider auto-uses OpenRouter. |
| OpenRouter 401 | Key invalid or revoked — rotate at [openrouter.ai/keys](https://openrouter.ai/keys); NIM transport (if configured) takes over |
| OpenRouter 402 | Out of credits — top up at [openrouter.ai/credits](https://openrouter.ai/credits) |
| OpenRouter 429 | Rate-limited — primary (Gemini) handles the load anyway |
| Nemotron returns non-JSON | `parseJSON` regex fallback salvages the first `{…}` block |
| All providers fail | Route returns `502` with `error` (joined messages) + `provider_errors` map for diagnostics |
| Timeout on Vercel Hobby | Max 10s on Hobby — use Vercel Pro (route already declares `maxDuration = 60`) |

## Key Rules

1. **Always use the AnalysisProvider interface** — never call SDKs/fetch directly in routes
2. **System prompt lives in `prompts.ts`** — shared between all providers
3. **Strip markdown fences** before `JSON.parse()` — both providers may wrap output
4. **Max tokens: 2048** for NVIDIA, 4096 for Gemini
5. **All JSON parsing must have fallback** — regex extraction as safety net
6. **Never expose API keys** — only server-side in API routes
7. **Log provider errors** with `console.error()` but return sanitized messages
8. **Do NOT reintroduce Anthropic / Claude** — the user explicitly removed it
9. **Use native `fetch` for OpenRouter** — per `.cursorrules` (no axios)
