// src/app/api/analyze/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ClaudeProvider } from "@/lib/claude";
import { GeminiProvider } from "@/lib/gemini";
import { AIProvider } from "@/lib/types";

const RequestSchema = z.object({
  url: z.string().url("Invalid URL format"),
  provider: z.enum(["claude", "gemini"]).default("claude"),
});

export async function POST(req: NextRequest) {
  const start = Date.now();

  // Parse & validate body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 422 }
    );
  }

  const { url, provider } = parsed.data;

  // Guard: check env vars
  if (provider === "claude" && !process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured" },
      { status: 500 }
    );
  }
  if (provider === "gemini" && !process.env.GOOGLE_AI_API_KEY) {
    return NextResponse.json(
      { error: "GOOGLE_AI_API_KEY is not configured" },
      { status: 500 }
    );
  }

  try {
    const analyzer =
      provider === "claude" ? new ClaudeProvider() : new GeminiProvider();

    const data = await analyzer.analyze(url);
    const duration_ms = Date.now() - start;

    return NextResponse.json(
      { data, provider, duration_ms },
      {
        status: 200,
        headers: {
          "X-Provider": provider,
          "X-Duration-Ms": String(duration_ms),
        },
      }
    );
  } catch (err: unknown) {
    console.error(`[analyze] ${provider} error:`, err);
    const message =
      err instanceof Error ? err.message : "Analysis failed unexpectedly";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Disable body size limit for large pages (Vercel default is 4.5MB)
export const maxDuration = 60; // seconds — Vercel Pro/Enterprise
