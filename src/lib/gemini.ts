// src/lib/gemini.ts
//
// Google Gemini provider — currently the **default** for /api/analyze.
// NVIDIA Nemotron (via OpenRouter) is the automatic fallback.
//
// Env vars (in priority order):
//   GEMINI_API_KEY  (preferred)  — falls back to GOOGLE_AI_API_KEY
//   GEMINI_MODEL    (preferred)  — defaults to "gemini-2.5-flash"
import { GoogleGenerativeAI } from "@google/generative-ai";
import { AnalysisProvider, AnalysisResult } from "./types";
import { SYSTEM_PROMPT, USER_PROMPT } from "./prompts";

const DEFAULT_MODEL = "gemini-2.5-flash";

export class GeminiProvider implements AnalysisProvider {
  private readonly genAI: GoogleGenerativeAI;
  private readonly modelName: string;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY (or legacy GOOGLE_AI_API_KEY) is not configured"
      );
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.modelName = process.env.GEMINI_MODEL ?? DEFAULT_MODEL;
  }

  async analyze(url: string): Promise<AnalysisResult> {
    const model = this.genAI.getGenerativeModel({
      model: this.modelName,
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: {
        maxOutputTokens: 4096,
        temperature: 0.4,
        responseMimeType: "application/json",
      },
    });

    const enrichedPrompt = `${USER_PROMPT(url)}

Note: Use your knowledge about this company/domain to provide the most accurate evaluation possible. 
If you don't have specific knowledge about this exact company, analyze based on the URL structure, 
domain name, and any patterns you can infer about the business model.`;

    const result = await model.generateContent(enrichedPrompt);
    const response = result.response;
    const text = response.text();

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
