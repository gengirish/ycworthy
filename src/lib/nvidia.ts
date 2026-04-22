// src/lib/nvidia.ts
//
// NVIDIA Nemotron — strongest reasoning model in our chain.
// We support two transports out of the box, both OpenAI-compatible chat-
// completions APIs (used via native fetch — per .cursorrules, no axios):
//
//   1. NVIDIA NIM (direct)            ── PREFERRED when available
//      - Endpoint: https://integrate.api.nvidia.com/v1/chat/completions
//      - Auth:     Authorization: Bearer ${NVIDIA_NIM_API_KEY}     (nvapi-...)
//      - Free:     ~1000 requests/month with a personal key from build.nvidia.com
//      - Faster + more reliable than the OpenRouter hop, and isolated from
//        OpenRouter outages / billing issues.
//
//   2. OpenRouter (fallback)          ── used when NIM key is absent
//      - Endpoint: https://openrouter.ai/api/v1/chat/completions
//      - Auth:     Authorization: Bearer ${OPENROUTER_API_KEY}     (sk-or-v1-...)
//
// Both serve `nvidia/llama-3.1-nemotron-ultra-253b-v1` under the same model
// slug. Override either transport's model with the matching env var below.

import { AnalysisProvider, AnalysisResult } from "./types";
import { SYSTEM_PROMPT, USER_PROMPT } from "./prompts";

const DEFAULT_MODEL = "nvidia/llama-3.1-nemotron-ultra-253b-v1";

const NIM_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

type Transport = "nim" | "openrouter";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatChoice {
  index: number;
  message: { role: string; content: string };
  finish_reason: string;
}

interface ChatResponse {
  id?: string;
  model?: string;
  choices?: ChatChoice[];
  error?: { message: string; code?: number };
}

export function hasAnyNvidiaKey(): boolean {
  return Boolean(process.env.NVIDIA_NIM_API_KEY ?? process.env.OPENROUTER_API_KEY);
}

export class NvidiaProvider implements AnalysisProvider {
  private readonly transport: Transport;
  private readonly endpoint: string;
  private readonly apiKey: string;
  private readonly model: string;
  private readonly extraHeaders: Record<string, string>;

  constructor() {
    const nimKey = process.env.NVIDIA_NIM_API_KEY;
    const orKey = process.env.OPENROUTER_API_KEY;

    if (nimKey) {
      this.transport = "nim";
      this.endpoint = NIM_URL;
      this.apiKey = nimKey;
      this.model = process.env.NVIDIA_NIM_MODEL ?? DEFAULT_MODEL;
      this.extraHeaders = {};
    } else if (orKey) {
      this.transport = "openrouter";
      this.endpoint = OPENROUTER_URL;
      this.apiKey = orKey;
      this.model = process.env.OPENROUTER_NVIDIA_MODEL ?? DEFAULT_MODEL;
      this.extraHeaders = {
        // OpenRouter ranking attribution (optional, but nice to set)
        "HTTP-Referer":
          process.env.NEXT_PUBLIC_APP_URL ?? "https://ycworthy.intelliforge.tech",
        "X-Title": "YCWorthy",
      };
    } else {
      throw new Error(
        "No NVIDIA transport configured. Set NVIDIA_NIM_API_KEY (preferred) or OPENROUTER_API_KEY."
      );
    }
  }

  /** Human-readable label for logs / error messages. */
  private get label(): string {
    return this.transport === "nim" ? "NVIDIA NIM" : "NVIDIA (OpenRouter)";
  }

  async analyze(url: string): Promise<AnalysisResult> {
    const messages: ChatMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: USER_PROMPT(url) },
    ];

    const res = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        ...this.extraHeaders,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.4,
        max_tokens: 2048,
        // Ask for strict JSON. Nemotron honours this when paired with the
        // explicit JSON schema in SYSTEM_PROMPT.
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `${this.label} ${res.status}: ${text.slice(0, 200) || res.statusText}`
      );
    }

    const json = (await res.json()) as ChatResponse;

    if (json.error) {
      throw new Error(`${this.label} error: ${json.error.message}`);
    }

    const content = json.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error(`${this.label} returned no content`);
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
