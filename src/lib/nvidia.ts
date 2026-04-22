// src/lib/nvidia.ts
//
// NVIDIA Nemotron (best-in-class open model) served via OpenRouter.
// OpenRouter exposes an OpenAI-compatible chat-completions endpoint, so we use
// native fetch (per .cursorrules — no axios).
//
// Default model: nvidia/llama-3.1-nemotron-ultra-253b-v1 — NVIDIA's largest /
// strongest reasoning model on OpenRouter as of 2026. Override via
// OPENROUTER_NVIDIA_MODEL.

import { AnalysisProvider, AnalysisResult } from "./types";
import { SYSTEM_PROMPT, USER_PROMPT } from "./prompts";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "nvidia/llama-3.1-nemotron-ultra-253b-v1";

interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenRouterChoice {
  index: number;
  message: { role: string; content: string };
  finish_reason: string;
}

interface OpenRouterResponse {
  id: string;
  model: string;
  choices: OpenRouterChoice[];
  error?: { message: string; code?: number };
}

export class NvidiaProvider implements AnalysisProvider {
  private readonly apiKey: string;
  private readonly model: string;

  constructor() {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY is not configured");
    }
    this.apiKey = apiKey;
    this.model = process.env.OPENROUTER_NVIDIA_MODEL ?? DEFAULT_MODEL;
  }

  async analyze(url: string): Promise<AnalysisResult> {
    const messages: OpenRouterMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: USER_PROMPT(url) },
    ];

    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        // OpenRouter ranking attribution (optional, but nice to set)
        "HTTP-Referer":
          process.env.NEXT_PUBLIC_APP_URL ?? "https://ycworthy.intelliforge.tech",
        "X-Title": "YCWorthy",
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.4,
        max_tokens: 2048,
        // Ask for strict JSON. Nemotron tends to honour this when paired with
        // the explicit JSON schema in SYSTEM_PROMPT.
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `NVIDIA (OpenRouter) ${res.status}: ${text.slice(0, 200) || res.statusText}`
      );
    }

    const json = (await res.json()) as OpenRouterResponse;

    if (json.error) {
      throw new Error(`NVIDIA (OpenRouter) error: ${json.error.message}`);
    }

    const content = json.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("NVIDIA (OpenRouter) returned no content");
    }

    return parseJSON(content);
  }
}

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
    throw new Error("Failed to parse NVIDIA response as JSON");
  }
}
