import { AnalysisProvider, AnalysisResult } from "./types";
import { SYSTEM_PROMPT, USER_PROMPT } from "./prompts";

const DEFAULT_XAI_MODEL = "grok-3-mini";
const DEFAULT_XAI_ENDPOINT = "https://api.x.ai/v1/chat/completions";
const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile";
const DEFAULT_GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

interface GrokChoice {
  message?: {
    content?: string | Array<{ type?: string; text?: string }>;
  };
}

interface GrokResponse {
  choices?: GrokChoice[];
  error?: { message?: string };
}

export function hasGrokKey(): boolean {
  return Boolean(
    readEnvTrimmed("XAI_API_KEY") ??
      readEnvTrimmed("GROK_API_KEY") ??
      readEnvTrimmed("GROQ_API_KEY")
  );
}

export class GrokProvider implements AnalysisProvider {
  private readonly label: string;
  private readonly apiKey: string;
  private readonly model: string;
  private readonly endpoint: string;

  constructor() {
    const xaiKey =
      readEnvTrimmed("XAI_API_KEY") ?? readEnvTrimmed("GROK_API_KEY");
    const groqKey = readEnvTrimmed("GROQ_API_KEY");

    if (xaiKey) {
      this.label = "xAI Grok";
      this.apiKey = xaiKey;
      this.model = readEnvTrimmed("GROK_MODEL") ?? DEFAULT_XAI_MODEL;
      this.endpoint = readEnvTrimmed("GROK_API_URL") ?? DEFAULT_XAI_ENDPOINT;
      return;
    }

    if (groqKey) {
      this.label = "Groq";
      this.apiKey = groqKey;
      this.model =
        readEnvTrimmed("GROQ_MODEL") ??
        readEnvTrimmed("GROK_MODEL") ??
        DEFAULT_GROQ_MODEL;
      this.endpoint = readEnvTrimmed("GROQ_API_URL") ?? DEFAULT_GROQ_ENDPOINT;
      return;
    }

    throw new Error(
      "No Grok-compatible key configured. Set XAI_API_KEY (or GROK_API_KEY) for xAI, or GROQ_API_KEY for Groq."
    );
  }

  async analyze(url: string): Promise<AnalysisResult> {
    const res = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: USER_PROMPT(url) },
        ],
        temperature: 0.4,
        max_tokens: 2048,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `${this.label} ${res.status}: ${text.slice(0, 300) || res.statusText}`
      );
    }

    const json = (await res.json()) as GrokResponse;
    if (json.error?.message) {
      throw new Error(`${this.label} error: ${json.error.message}`);
    }

    const raw = json.choices?.[0]?.message?.content;
    const content = normalizeContent(raw);
    if (!content) {
      throw new Error("Grok returned no content");
    }

    return parseJSON(content);
  }
}

function readEnvTrimmed(name: string): string | undefined {
  const value = process.env[name];
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeContent(
  content: string | Array<{ type?: string; text?: string }> | undefined
): string {
  if (typeof content === "string") {
    return content.trim();
  }
  if (!Array.isArray(content)) {
    return "";
  }
  return content
    .map((part) => part.text ?? "")
    .join("")
    .trim();
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
    throw new Error("Failed to parse Grok/Groq response as JSON");
  }
}
