// src/lib/gemini.ts
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import { AnalysisProvider, AnalysisResult } from "./types";
import { SYSTEM_PROMPT, USER_PROMPT } from "./prompts";

export class GeminiProvider implements AnalysisProvider {
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);
  }

  async analyze(url: string): Promise<AnalysisResult> {
    const model = this.genAI.getGenerativeModel({
      model: "gemini-1.5-pro",
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.4,
        responseMimeType: "application/json", // Gemini native JSON mode
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
      ],
    });

    // Gemini doesn't have native web search in the same way,
    // so we enrich the prompt with the URL and ask it to use its knowledge
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
