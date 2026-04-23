#!/usr/bin/env node
// scripts/mcp-server.mjs
//
// YCWorthy MCP Server (stdio transport).
//
// Exposes one tool — `analyze_startup` — that lets any MCP-compatible client
// (Claude Desktop, Cursor, Codex, Continue, Cline, etc.) call the YCWorthy
// API and get back a structured Y Combinator partner verdict for any URL.
//
// USAGE
//
//   1. Build / publish nothing — this script is dependency-light and runs
//      directly via node:
//
//        node scripts/mcp-server.mjs
//
//   2. Or wire it into your MCP client config (see docs/MCP.md for snippets).
//
// CONFIG (env vars, all optional)
//
//   YCWORTHY_API_URL  Base URL of the YCWorthy API.
//                     Default: https://ycworthy.intelliforge.tech
//   YCWORTHY_PROVIDER Default AI provider when the caller doesn't specify.
//                     "gemini" (default) | "nvidia" | "grok"
//   YCWORTHY_TIMEOUT  Per-request timeout in milliseconds. Default: 90000.
//
// The server speaks MCP 2024-11-05 over stdio. Logs go to stderr so they
// never corrupt the JSON-RPC stream on stdout.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const DEFAULT_BASE_URL = "https://ycworthy.intelliforge.tech";
const DEFAULT_TIMEOUT_MS = 90_000;

const BASE_URL = (process.env.YCWORTHY_API_URL ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
const DEFAULT_PROVIDER =
  process.env.YCWORTHY_PROVIDER === "nvidia"
    ? "nvidia"
    : process.env.YCWORTHY_PROVIDER === "grok"
    ? "grok"
    : "gemini";
const TIMEOUT_MS = Number(process.env.YCWORTHY_TIMEOUT ?? DEFAULT_TIMEOUT_MS);

function log(...args) {
  // stderr — stdout is reserved for MCP JSON-RPC frames.
  console.error("[ycworthy-mcp]", ...args);
}

/**
 * Render an AnalysisResult as a compact, model-friendly Markdown report.
 * Keeps the structured payload available too (in `structuredContent`) so
 * tool callers can either eyeball the text or parse the JSON.
 */
function renderReport(result, meta) {
  const c = result.criteria;
  const row = (label, key) =>
    `| ${label.padEnd(20)} | ${c[key].grade}    | ${String(c[key].score).padStart(3)} | ${c[key].summary} |`;

  const lines = [
    `# ${result.company} — Grade ${result.overall_grade} (${result.overall_score}/100)`,
    ``,
    `**YC likelihood:** ${result.yc_likelihood}  `,
    `**Tagline:** ${result.tagline}`,
    ``,
    `## Partner verdict`,
    `> ${result.verdict}`,
    ``,
    `## Criteria scorecard`,
    ``,
    `| Criterion            | Grade | Score | Summary |`,
    `|----------------------|-------|------:|---------|`,
    row("Problem", "problem"),
    row("Market", "market"),
    row("Solution", "solution"),
    row("Traction", "traction"),
    row("Founder–Market Fit", "founder"),
    row("Timing", "timing"),
    ``,
    `## Green flags`,
    ...result.green_flags.map((f) => `- ✅ ${f}`),
    ``,
    `## Red flags`,
    ...result.red_flags.map((f) => `- ⚠️ ${f}`),
    ``,
    `## YC interview question`,
    `> "${result.yc_interview_question}"`,
    ``,
    `---`,
    `_Provider used: \`${meta.provider}\`${meta.fallback_used ? " (fallback)" : ""} · ${meta.duration_ms}ms · request ${meta.request_id}_`,
  ];
  return lines.join("\n");
}

/**
 * Call the YCWorthy POST /api/analyze endpoint.
 * Throws with a useful message on any failure.
 */
async function callAnalyze({ url, provider }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res;
  try {
    res = await fetch(`${BASE_URL}/api/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "ycworthy-mcp/1.0",
      },
      body: JSON.stringify({ url, provider }),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    if (err?.name === "AbortError") {
      throw new Error(`YCWorthy API timed out after ${TIMEOUT_MS}ms`);
    }
    throw new Error(
      `Network error contacting ${BASE_URL}/api/analyze: ${err?.message ?? err}`
    );
  }
  clearTimeout(timer);

  let json;
  try {
    json = await res.json();
  } catch {
    throw new Error(`YCWorthy API returned non-JSON (HTTP ${res.status})`);
  }

  if (!res.ok || json?.error) {
    const msg = json?.error ?? `HTTP ${res.status}`;
    const code = json?.error_code ? ` [${json.error_code}]` : "";
    throw new Error(`YCWorthy API error${code}: ${msg}`);
  }

  return {
    data: json.data,
    provider: json.provider,
    fallback_used: Boolean(json.fallback_used),
    duration_ms: json.duration_ms ?? json?.meta?.duration_ms ?? 0,
    request_id: json?.meta?.request_id ?? "n/a",
  };
}

async function main() {
  const server = new McpServer(
    {
      name: "ycworthy",
      version: "1.0.0",
      title: "YCWorthy — YC Startup Evaluator",
    },
    {
      capabilities: { tools: {} },
      instructions: `Use the \`analyze_startup\` tool to get an honest Y Combinator-style evaluation of any startup or product website. The tool returns a structured scorecard (overall grade S–F, YC likelihood, six criterion grades) plus a short partner verdict and the toughest interview question a YC partner would ask. API base: ${BASE_URL}. Default provider: ${DEFAULT_PROVIDER}.`,
    }
  );

  server.registerTool(
    "analyze_startup",
    {
      title: "Analyze startup URL",
      description:
        "Run YCWorthy's Y Combinator partner evaluation on any startup or product URL. Returns a six-criteria scorecard (Problem, Market, Solution, Traction, Founder–Market Fit, Timing) plus an overall S/A/B/C/D/F grade, YC funding likelihood, green/red flags, and the hardest YC interview question for the founder.",
      inputSchema: {
        url: z
          .string()
          .url()
          .describe(
            "The startup or product URL to evaluate. Must be a fully-qualified http(s) URL."
          ),
        provider: z
          .enum(["gemini", "nvidia", "grok"])
          .optional()
          .describe(
            "Optional AI provider override. Defaults to the server's configured default (currently '" +
              DEFAULT_PROVIDER +
              "'). The API automatically falls back to the other provider on failure."
          ),
      },
    },
    async ({ url, provider }) => {
      const chosenProvider = provider ?? DEFAULT_PROVIDER;
      log(`analyze_startup url=${url} provider=${chosenProvider}`);

      try {
        const result = await callAnalyze({ url, provider: chosenProvider });
        const report = renderReport(result.data, {
          provider: result.provider,
          fallback_used: result.fallback_used,
          duration_ms: result.duration_ms,
          request_id: result.request_id,
        });

        return {
          content: [{ type: "text", text: report }],
          structuredContent: {
            ...result.data,
            _meta: {
              provider_used: result.provider,
              fallback_used: result.fallback_used,
              duration_ms: result.duration_ms,
              request_id: result.request_id,
            },
          },
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log("tool error:", msg);
        return {
          isError: true,
          content: [{ type: "text", text: `❌ ${msg}` }],
        };
      }
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
  log(`ready · base=${BASE_URL} · default-provider=${DEFAULT_PROVIDER}`);
}

main().catch((err) => {
  log("fatal:", err?.stack ?? err);
  process.exit(1);
});
