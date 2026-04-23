#!/usr/bin/env node
// scripts/cli.mjs
//
// YCWorthy CLI — terminal-friendly wrapper around the public API.
//
// USAGE
//
//   node scripts/cli.mjs <url> [options]
//   npm run analyze -- <url> [options]
//
// OPTIONS
//
//   --provider <gemini|nvidia>   AI provider override (default: gemini)
//   --json                       Emit raw JSON (no pretty rendering)
//   --api <url>                  Override API base URL
//                                (default: https://ycworthy.intelliforge.tech)
//   --timeout <ms>               Per-request timeout (default: 90000)
//   --help, -h                   Show this help
//
// EXAMPLES
//
//   node scripts/cli.mjs stripe.com
//   node scripts/cli.mjs https://airbnb.com --provider nvidia
//   node scripts/cli.mjs https://example.com --json | jq .data.overall_grade
//
// EXIT CODES
//
//   0  success
//   1  network / API error
//   2  invalid arguments

const DEFAULT_BASE_URL = "https://ycworthy.intelliforge.tech";
const DEFAULT_TIMEOUT_MS = 90_000;

// ── ANSI helpers (only colorize when stdout is a TTY) ─────────────────────────
const isTTY = process.stdout.isTTY;
const c = (code, s) => (isTTY ? `\x1b[${code}m${s}\x1b[0m` : s);
const bold = (s) => c("1", s);
const dim = (s) => c("2", s);
const red = (s) => c("31", s);
const green = (s) => c("32", s);
const yellow = (s) => c("33", s);
const cyan = (s) => c("36", s);

const GRADE_TINT = {
  S: green,
  A: green,
  B: yellow,
  C: yellow,
  D: red,
  F: red,
};

function tintGrade(grade) {
  const fn = GRADE_TINT[grade] ?? ((s) => s);
  return bold(fn(grade));
}

function usage() {
  console.log(`YCWorthy CLI

Usage:
  node scripts/cli.mjs <url> [options]

Options:
  --provider <gemini|nvidia>   AI provider override (default: gemini)
  --json                       Emit raw JSON (no pretty rendering)
  --api <url>                  Override API base URL
  --timeout <ms>               Per-request timeout (default: ${DEFAULT_TIMEOUT_MS})
  -h, --help                   Show this help

Examples:
  node scripts/cli.mjs stripe.com
  node scripts/cli.mjs https://airbnb.com --provider nvidia
  node scripts/cli.mjs example.com --json | jq .data.overall_grade
`);
}

function parseArgs(argv) {
  const opts = {
    url: null,
    provider: undefined,
    json: false,
    api: process.env.YCWORTHY_API_URL ?? DEFAULT_BASE_URL,
    timeout: Number(process.env.YCWORTHY_TIMEOUT ?? DEFAULT_TIMEOUT_MS),
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "-h" || a === "--help") {
      usage();
      process.exit(0);
    } else if (a === "--json") {
      opts.json = true;
    } else if (a === "--provider") {
      opts.provider = argv[++i];
    } else if (a === "--api") {
      opts.api = argv[++i];
    } else if (a === "--timeout") {
      opts.timeout = Number(argv[++i]);
    } else if (!a.startsWith("--") && !opts.url) {
      opts.url = a;
    }
  }
  if (!opts.url) {
    console.error(red("error: missing <url> argument\n"));
    usage();
    process.exit(2);
  }
  if (opts.provider && !["gemini", "nvidia"].includes(opts.provider)) {
    console.error(red(`error: --provider must be "gemini" or "nvidia"\n`));
    process.exit(2);
  }
  if (!opts.url.startsWith("http")) opts.url = `https://${opts.url}`;
  return opts;
}

async function callAnalyze(opts) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeout);
  try {
    const res = await fetch(`${opts.api.replace(/\/+$/, "")}/api/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "ycworthy-cli/1.0",
      },
      body: JSON.stringify({
        url: opts.url,
        provider: opts.provider ?? "gemini",
      }),
      signal: controller.signal,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json?.error) {
      throw new Error(json?.error ?? `HTTP ${res.status}`);
    }
    return json;
  } finally {
    clearTimeout(timer);
  }
}

function pretty(json) {
  const r = json.data;
  const meta = json.meta ?? {};
  const lines = [];
  lines.push("");
  lines.push(
    `${tintGrade(r.overall_grade)}  ${bold(r.company)}  ${dim(`(${r.overall_score}/100 · ${r.yc_likelihood})`)}`
  );
  lines.push(dim(r.tagline));
  lines.push("");
  lines.push(bold("Verdict"));
  lines.push("  " + r.verdict);
  lines.push("");
  lines.push(bold("Criteria"));
  const labels = {
    problem: "Problem",
    market: "Market",
    solution: "Solution",
    traction: "Traction",
    founder: "Founder–Market Fit",
    timing: "Timing",
  };
  for (const [key, label] of Object.entries(labels)) {
    const cr = r.criteria[key];
    lines.push(
      `  ${tintGrade(cr.grade)} ${label.padEnd(20)} ${dim(`${cr.score}/100`)}  ${cr.summary}`
    );
  }
  lines.push("");
  lines.push(bold("Green flags"));
  r.green_flags.forEach((f) => lines.push("  " + green("✓") + " " + f));
  lines.push("");
  lines.push(bold("Red flags"));
  r.red_flags.forEach((f) => lines.push("  " + red("✗") + " " + f));
  lines.push("");
  lines.push(bold("YC interview question"));
  lines.push("  " + cyan(`"${r.yc_interview_question}"`));
  lines.push("");
  lines.push(
    dim(
      `Provider: ${json.provider}${json.fallback_used ? " (fallback)" : ""} · ${json.duration_ms}ms · req ${meta.request_id ?? "n/a"}`
    )
  );
  return lines.join("\n");
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (!opts.json) {
    console.error(dim(`→ Analyzing ${opts.url} via ${opts.provider ?? "gemini"}…`));
  }
  try {
    const json = await callAnalyze(opts);
    if (opts.json) {
      process.stdout.write(JSON.stringify(json, null, 2) + "\n");
    } else {
      console.log(pretty(json));
    }
  } catch (err) {
    const msg = err?.message ?? String(err);
    console.error(red(`✗ ${msg}`));
    process.exit(1);
  }
}

main();
