// src/lib/gemini.ts
//
// Google Gemini provider — currently the **default** for /api/analyze.
// NVIDIA Nemotron (via OpenRouter) is the automatic fallback.
//
// Implementation notes:
// • We call the Generative Language REST API directly (no SDK) so we can
//   pin the model + opt out of "thinking" tokens. The 2.5 Flash model is a
//   reasoning/thinking model — without `thinkingConfig.thinkingBudget = 0`
//   the budget can be eaten entirely by internal thoughts and the response
//   comes back empty (finishReason: MAX_TOKENS, no content).
// • This mirrors the native-fetch pattern used in src/lib/nvidia.ts.
//
// Env vars (in priority order):
//   GEMINI_API_KEY  (preferred)  — falls back to GOOGLE_AI_API_KEY
//   GEMINI_MODEL    (preferred)  — defaults to "gemini-2.5-flash"
import { AnalysisProvider, AnalysisResult } from "./types";
import { SYSTEM_PROMPT, USER_PROMPT } from "./prompts";

const DEFAULT_MODEL = "gemini-2.5-flash";
const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

interface GeminiPart {
  text?: string;
}

interface GeminiCandidate {
  content?: { parts?: GeminiPart[]; role?: string };
  finishReason?: string;
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
  promptFeedback?: { blockReason?: string };
}

export class GeminiProvider implements AnalysisProvider {
  private readonly apiKey: string;
  private readonly modelName: string;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY (or legacy GOOGLE_AI_API_KEY) is not configured"
      );
    }
    this.apiKey = apiKey;
    this.modelName = process.env.GEMINI_MODEL ?? DEFAULT_MODEL;
  }

  async analyze(url: string): Promise<AnalysisResult> {
    const enrichedPrompt = `${USER_PROMPT(url)}

Note: Use your knowledge about this company/domain to provide the most accurate evaluation possible. 
If you don't have specific knowledge about this exact company, analyze based on the URL structure, 
domain name, and any patterns you can infer about the business model.`;

    const body = {
      systemInstruction: {
        role: "system",
        parts: [{ text: SYSTEM_PROMPT }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: enrichedPrompt }],
        },
      ],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 4096,
        responseMimeType: "application/json",
        // Disable internal "thinking" tokens — Gemini 2.5 Flash will otherwise
        // burn the entire output budget on hidden reasoning and return nothing.
        thinkingConfig: {
          thinkingBudget: 0,
        },
      },
    };

    const url_ = `${ENDPOINT}/${this.modelName}:generateContent?key=${this.apiKey}`;

    const res = await fetch(url_, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      throw new Error(`Gemini ${res.status}: ${errBody.slice(0, 500)}`);
    }

    const json = (await res.json()) as GeminiResponse;

    if (json.promptFeedback?.blockReason) {
      throw new Error(
        `Gemini blocked the prompt: ${json.promptFeedback.blockReason}`
      );
    }

    const candidate = json.candidates?.[0];
    const text = candidate?.content?.parts
      ?.map((p) => p.text ?? "")
      .join("")
      .trim();

    if (!text) {
      throw new Error(
        `Gemini returned no text (finishReason: ${
          candidate?.finishReason ?? "unknown"
        })`
      );
    }

    return parseJSON(text);
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
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]) as AnalysisResult;
    throw new Error("Failed to parse Gemini response as JSON");
  }
}
