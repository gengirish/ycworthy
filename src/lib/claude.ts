// src/lib/claude.ts
import Anthropic from "@anthropic-ai/sdk";
import { AnalysisProvider, AnalysisResult } from "./types";
import { SYSTEM_PROMPT, USER_PROMPT } from "./prompts";

export class ClaudeProvider implements AnalysisProvider {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });
  }

  async analyze(url: string): Promise<AnalysisResult> {
    const response = await this.client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      tools: [
        {
          type: "web_search_20250305",
          name: "web_search",
        } as unknown as Anthropic.Tool,
      ],
      messages: [
        {
          role: "user",
          content: USER_PROMPT(url),
        },
      ],
    });

    // Extract final text block (after any tool use)
    const textBlock = response.content
      .filter((b) => b.type === "text")
      .pop();

    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from Claude");
    }

    return parseJSON(textBlock.text);
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
    // Try to extract JSON object from surrounding text
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]) as AnalysisResult;
    throw new Error("Failed to parse AI response as JSON");
  }
}
