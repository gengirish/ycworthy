---
name: ycworthy-ai-providers
description: Orchestrate AI analysis with Claude and Gemini providers including prompt engineering, JSON parsing, provider abstraction, and fallback strategies. Use when working with AI integration, prompts, adding new providers, or debugging AI response parsing.
---

# YCWorthy AI Providers

## Architecture

Both providers implement the `AnalysisProvider` interface and share the same system prompt.

```
API Route → provider === "claude" ? ClaudeProvider : GeminiProvider
                    ↓                        ↓
           Anthropic SDK              Google Generative AI
           + web_search tool          + JSON response mode
                    ↓                        ↓
              Parse JSON text         Parse JSON directly
                    ↓                        ↓
              AnalysisResult (shared type)
```

## Provider Interface

```typescript
// src/lib/types.ts
export interface AnalysisProvider {
  analyze(url: string): Promise<AnalysisResult>;
}
```

## Claude Provider (`src/lib/claude.ts`)

- **Model**: `claude-sonnet-4-20250514`
- **Feature**: `web_search_20250305` tool for live data
- **Max tokens**: 2048
- **Speed**: ~12–20s (with search)
- **Cost**: ~$0.003/analysis

```typescript
const response = await this.client.messages.create({
  model: "claude-sonnet-4-20250514",
  max_tokens: 2048,
  system: SYSTEM_PROMPT,
  tools: [{ type: "web_search_20250305", name: "web_search" }],
  messages: [{ role: "user", content: USER_PROMPT(url) }],
});

// Extract final text block (after tool use blocks)
const textBlock = response.content.filter((b) => b.type === "text").pop();
```

## Gemini Provider (`src/lib/gemini.ts`)

- **Model**: `gemini-1.5-pro`
- **Feature**: `responseMimeType: "application/json"` for native JSON
- **Temperature**: 0.4
- **Max tokens**: 2048
- **Speed**: ~4–8s
- **Cost**: ~$0.001/analysis

```typescript
const model = this.genAI.getGenerativeModel({
  model: "gemini-1.5-pro",
  systemInstruction: SYSTEM_PROMPT,
  generationConfig: {
    maxOutputTokens: 2048,
    temperature: 0.4,
    responseMimeType: "application/json",
  },
});
```

## Shared System Prompt (`src/lib/prompts.ts`)

The prompt instructs the AI to respond as a YC General Partner and return a specific JSON structure:

```typescript
export const SYSTEM_PROMPT = `You are a Y Combinator General Partner...
Return ONLY the JSON object. Nothing else.`;

export const USER_PROMPT = (url: string) =>
  `Analyze this startup/business for YC worthiness...
URL: ${url}`;
```

## JSON Parsing (Both Providers)

Both providers use the same robust parsing strategy:

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
    // Fallback: extract first JSON object from surrounding text
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]) as AnalysisResult;
    throw new Error("Failed to parse AI response as JSON");
  }
}
```

## Adding a New Provider

1. Create `src/lib/newprovider.ts`
2. Implement `AnalysisProvider` interface
3. Use the shared `SYSTEM_PROMPT` and `USER_PROMPT` from `prompts.ts`
4. Add JSON parsing with markdown-fence stripping
5. Update `AIProvider` type in `types.ts`: `export type AIProvider = "claude" | "gemini" | "new";`
6. Update `ModelToggle.tsx` with new provider entry
7. Update `api/analyze/route.ts` to instantiate the new provider
8. Guard the new env var in the route

## Provider Comparison

| Feature | Claude Sonnet 4 | Gemini 1.5 Pro |
|---------|-----------------|----------------|
| Web search | Native tool | Knowledge only |
| JSON mode | Parse from text | `responseMimeType` |
| Speed | ~12–20s (with search) | ~4–8s |
| Quality | Higher (live data) | Good (training data) |
| Cost | ~$0.003/analysis | ~$0.001/analysis |

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "No text response from Claude" | Claude returned only tool_use blocks; ensure model finishes with text |
| Gemini returns non-JSON | `responseMimeType: "application/json"` should enforce; parseJSON fallback extracts `{...}` |
| Timeout on Vercel Hobby | Max 10s on Hobby tier — use Gemini (faster) or upgrade to Pro |
| CORS errors | API routes are server-side — no CORS needed; don't call AI APIs from client |

## Key Rules

1. **Always use the AnalysisProvider interface** — never call SDKs directly in routes
2. **System prompt lives in `prompts.ts`** — shared between all providers
3. **Strip markdown fences** before `JSON.parse()` — both providers may wrap output
4. **Max tokens: 2048** for all providers
5. **All JSON parsing must have fallback** — regex extraction as safety net
6. **Never expose API keys** — only server-side in API routes
7. **Log provider errors** with `console.error()` but return sanitized messages
