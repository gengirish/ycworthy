# YCWorthy — AI-Powered Startup Evaluator

> Drop any startup URL. Get a brutal, honest AI evaluation against Y Combinator's real funding criteria.
>
> **Stack:** Next.js 14 · TypeScript · Tailwind CSS · Gemini 2.5 Flash (default) · NVIDIA Nemotron Ultra 253B (auto fallback) · Vercel

**Try it:** [ycworthy.intelliforge.tech](https://ycworthy.intelliforge.tech)
**Public API:** `https://ycworthy.intelliforge.tech/api/analyze` · [docs](./docs/API.md) · [OpenAPI spec](https://ycworthy.intelliforge.tech/api/openapi.json)
**MCP server:** [docs/MCP.md](./docs/MCP.md) — drop-in tool for Claude Desktop, Cursor, Codex, Continue, Cline

---

## What it does

YCWorthy analyzes any startup website through the lens of a Y Combinator partner with 15 years of experience. It evaluates six core criteria and returns:

| Output | Description |
|--------|-------------|
| **Overall Grade** | S/A/B/C/D/F with 0–100 score |
| **YC Likelihood** | Unlikely / Possible / Probable / Strong |
| **6 Criteria Scores** | Problem, Market, Solution, Traction, Founder–Market Fit, Timing |
| **Red & Green Flags** | Specific strengths and weaknesses |
| **YC Interview Question** | The hardest question a YC partner would ask |
| **Partner Verdict** | 2–3 sentence honest funding opinion |

---

## Use it from anywhere

YCWorthy ships **four** ways to call it. Pick whichever fits your workflow:

| Surface | Best for | Quick start |
|---------|----------|-------------|
| **Web UI** | Humans | [ycworthy.intelliforge.tech](https://ycworthy.intelliforge.tech) |
| **REST API** | Apps, scripts, CI, low-code | `curl -d '{"url":"https://stripe.com"}' https://ycworthy.intelliforge.tech/api/analyze` |
| **MCP server** | Claude / Cursor / Codex / Continue | One JSON snippet — see [docs/MCP.md](./docs/MCP.md) |
| **CLI** | Terminal users, shell scripts | `npx -y github:gengirish/ycworthy ycworthy stripe.com` |

Full automation cookbook (Python, Node, GitHub Actions, n8n, Slack, Custom GPT): **[docs/AUTOMATION.md](./docs/AUTOMATION.md)**

---

## Quick start (local development)

```bash
git clone https://github.com/gengirish/ycworthy.git
cd ycworthy
npm install
cp .env.local.example .env.local   # add your AI keys
npm run dev                        # → http://localhost:3000
```

### Environment variables

| Variable | Where to get it |
|----------|----------------|
| `GEMINI_API_KEY` | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) — primary / default. Legacy `GOOGLE_AI_API_KEY` still accepted as fallback. |
| `GEMINI_MODEL` | _(optional)_ override the Gemini model slug. Defaults to `gemini-2.5-flash`. |
| `NVIDIA_NIM_API_KEY` | [build.nvidia.com](https://build.nvidia.com/) → "Get API Key" — **preferred** transport for NVIDIA Nemotron (free ~1000 req/month, direct API). Format `nvapi-...`. |
| `NVIDIA_NIM_MODEL` | _(optional)_ override the NIM model slug. Defaults to `nvidia/llama-3.1-nemotron-ultra-253b-v1`. |
| `OPENROUTER_API_KEY` | [openrouter.ai/keys](https://openrouter.ai/keys) — secondary NVIDIA transport (used only if NIM key absent). |
| `OPENROUTER_NVIDIA_MODEL` | _(optional)_ override the OpenRouter model slug. |

At least one of `GEMINI_API_KEY`, `NVIDIA_NIM_API_KEY`, or `OPENROUTER_API_KEY` must be set.

---

## Public API

Three endpoints, no auth, full CORS, OpenAPI 3.1 spec:

| Endpoint | Purpose |
|----------|---------|
| `POST /api/analyze` · `GET /api/analyze?url=...` | Run an analysis |
| `GET /api/health` | Status + which providers are configured |
| `GET /api/openapi.json` | Machine-readable spec — import into Postman / generate clients / wire into Custom GPTs |

Every response carries a standard `meta` envelope (`api_version`, `request_id`, `timestamp`, `duration_ms`) and matching `X-*` headers. Full reference: **[docs/API.md](./docs/API.md)**.

```bash
# One-liner
curl "https://ycworthy.intelliforge.tech/api/analyze?url=https://stripe.com" | jq '.data.overall_grade'

# Health check
curl https://ycworthy.intelliforge.tech/api/health | jq '.providers'
```

---

## MCP integration (Claude Desktop / Cursor / Codex / Continue)

YCWorthy ships an MCP server that exposes the analysis pipeline as the **`analyze_startup`** tool.

### Cursor / Claude Desktop config

```json
{
  "mcpServers": {
    "ycworthy": {
      "command": "npx",
      "args": ["-y", "github:gengirish/ycworthy", "ycworthy-mcp"]
    }
  }
}
```

Restart your MCP client. Now you can say:

> *"Run YCWorthy on stripe.com"*
> *"Score these three URLs against YC criteria: notion.so, figma.com, vercel.com — make me a comparison table."*

Full setup (env vars, troubleshooting, all hosts): **[docs/MCP.md](./docs/MCP.md)**

---

## Architecture

```
                   ┌────────────── User surfaces ──────────────┐
                   │                                            │
       Web UI    REST API     MCP server      CLI       (Custom GPT, n8n,
   (Next.js)  (/api/analyze)  (stdio tool)  (npx)         GitHub Actions, …)
        │           │              │           │
        └───────────┴──────┬───────┴───────────┘
                           ▼
              POST/GET /api/analyze (Zod-validated, CORS, request_id, meta envelope)
                           │
                           ▼
              GeminiProvider (gemini-2.5-flash, JSON mode)         ← primary / default
                           │
                           │  on failure (429, 5xx, parse error…)
                           ▼
              NvidiaProvider → Nemotron Ultra 253B                  ← automatic fallback
                 • prefers NIM transport      (NVIDIA_NIM_API_KEY)
                 • falls back to OpenRouter   (OPENROUTER_API_KEY)
                           │
                           ▼
                    Shared JSON schema (src/lib/prompts.ts)
                           │
                           ▼
                    AnalysisResult → response envelope
                    + headers: X-Provider, X-Provider-Fallback, X-Request-Id, X-Api-Version
```

---

## File structure

```
ycworthy/
├── docs/
│   ├── API.md                  ← Full REST reference
│   ├── MCP.md                  ← MCP setup for Claude / Cursor / Codex
│   └── AUTOMATION.md           ← curl, Python, Node, GitHub Actions, n8n recipes
│
├── scripts/
│   ├── cli.mjs                 ← `node scripts/cli.mjs <url>` — terminal CLI
│   └── mcp-server.mjs          ← MCP stdio server (analyze_startup tool)
│
├── .env.local.example          ← Copy → .env.local, fill keys
├── tailwind.config.ts          ← Mission Control theme — HUD teal accent, Space Grotesk display
├── package.json                ← `bin: { ycworthy, ycworthy-mcp }`
│
└── src/
    ├── app/
    │   ├── globals.css         ← Space Grotesk + Inter + JetBrains Mono, scanline + HUD-frame utilities
    │   ├── layout.tsx
    │   ├── page.tsx            ← Main UI (URL input, history, results)
    │   └── api/
    │       ├── analyze/route.ts        ← POST + GET + OPTIONS
    │       ├── health/route.ts         ← Status + provider availability
    │       └── openapi.json/route.ts   ← OpenAPI 3.1 spec
    │
    ├── components/             ← ModelToggle, GradeRing, CriteriaGrid, ResultCard, HistoryStrip
    ├── hooks/                  ← useAnalyze
    └── lib/
        ├── types.ts            ← Shared types + grade colors (S=#00FFC2 … F=#FF3A6A)
        ├── version.ts          ← API_VERSION single source of truth
        ├── http.ts             ← CORS + request_id + meta envelope helpers
        ├── prompts.ts          ← Shared system prompt
        ├── nvidia.ts           ← NIM (preferred) → OpenRouter (fallback) → Nemotron Ultra
        ├── gemini.ts           ← gemini-2.5-flash, native fetch, thinkingBudget=0
        └── history.ts          ← localStorage history utilities
```

---

## Design — the "Mission Control" theme

YCWorthy uses a custom HUD/Sci-Fi × AI-Native palette generated via the [`ui-ux-pro-max`](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) design-system reasoning engine, tuned for an "AI startup evaluator / scoring engine" product profile. The brand reads as a piece of analytical instrumentation rather than a magazine — deep-space navy ground, HUD-teal primary, AI-violet secondary, and a high-vibrancy grade ramp engineered to read as telemetry (not chart-junk).

| Token | Value |
|-------|-------|
| Background | `#060A12` deep-space navy (never pure black, so the teal can glow) |
| Surfaces | `#0C1320` / `#131D30` |
| Body text | `#E6F1FF` cool paper-white |
| **Brand accent** | `#00E0B8` HUD teal *(single instrument color — never used for grade data)* |
| **AI-agent secondary** | `#7C5CFF` violet *(reserved for AI/automation chrome — active provider chip, MCP/agent badges)* |
| Display font | **Space Grotesk** 600/700 — geometric futurist for wordmark + headlines |
| Body / UI font | **Inter** 400/500/600 — workhorse for HUD readouts and dense UI |
| Mono | **JetBrains Mono** — telemetry, code, eyebrows, micro-labels |
| Grades | S=`#00FFC2` · A=`#69E68A` · B=`#FFD24A` · C=`#FFA040` · D=`#FF6A6A` · F=`#FF3A6A` |
| Provider chips | gemini=`#4A9EFF` · nvidia=`#76B900` |
| Chrome | HUD frame corner-ticks (`.hud-frame`) + horizontal scanline overlay (≈3.5% opacity) |

The brand uses a single piercing **HUD teal** accent for *interactive UI chrome*, an **AI-violet** secondary for *agent/automation indicators*, and reserves the entire green-amber-orange-red spectrum for *data colors* (grades, likelihoods, flags) — so the eye can instantly separate "buttons & focus rings" from "this is the AI" from "this is the score."

Token names (`yc-bg`, `yc-accent`, `grade-s`, …) are intentionally stable across themes — only their values change. So a future rebrand stays a one-file edit to `tailwind.config.ts`.

---

## Features

- **Gemini-first, NVIDIA fallback** — Always tries Gemini 2.5 Flash first; if it errors, automatically retries on NVIDIA Nemotron Ultra 253B. Surfaces `fallback_used` in the response.
- **Public REST API** — POST, GET, OPTIONS, CORS-enabled, OpenAPI 3.1 spec at `/api/openapi.json`.
- **MCP server** — `analyze_startup` tool exposed over stdio; one JSON snippet to install in Claude Desktop / Cursor / Codex.
- **CLI** — `npx -y github:gengirish/ycworthy ycworthy <url>` from any terminal, with TTY colors and `--json` mode for piping.
- **Health endpoint** — `/api/health` for monitors and pre-flight provider checks.
- **6 YC criteria** — Problem, Market, Solution, Traction, Founder–Market Fit, Timing.
- **Animated grade rings** — Color-coded S through F grades with grade-tinted glow.
- **Bento-grid scorecard** — Hero criterion (Problem) gets a wide cell; remaining five fill in around it.
- **Recent analyses** — Last 8 analyses stored in localStorage.
- **Share links** — `/?url=example.com&provider=gemini` triggers analysis on load.
- **Mission Control theme** — HUD-teal-on-navy with Space Grotesk + Inter + JetBrains Mono, scanline overlay, HUD corner-tick frames (see above).
- **Mobile-responsive** — Works on 375px+ screens.
- **Accessible** — `:focus-visible` rings, `prefers-reduced-motion` respected, semantic landmarks, ARIA on all interactive elements.

---

## AI provider comparison

| Feature | Gemini 2.5 Flash | NVIDIA Nemotron Ultra 253B |
|---------|------------------|----------------------------|
| Role | Primary / default | Automatic fallback |
| Reasoning | Fast, cost-efficient, strong JSON adherence | Top-tier 253B reasoning model |
| JSON mode | `responseMimeType: application/json` + `thinkingBudget: 0` | `response_format: json_object` (reads `reasoning_content` for NIM) |
| Speed | ~3–6s | ~8–18s |
| Transport | Direct REST API (native `fetch`) | NIM (preferred) → OpenRouter (fallback), both OpenAI-compatible (native `fetch`) |
| API key | `GEMINI_API_KEY` | `NVIDIA_NIM_API_KEY` (preferred) or `OPENROUTER_API_KEY` |
| Model override | `GEMINI_MODEL` | `NVIDIA_NIM_MODEL` / `OPENROUTER_NVIDIA_MODEL` |

---

## Deploy to Vercel

```bash
npm i -g vercel
vercel login
vercel
```

Add environment variables in Vercel Dashboard → Settings → Environment Variables:
- `GEMINI_API_KEY` _(required — Gemini primary)_
- `GEMINI_MODEL` _(optional override, defaults to `gemini-2.5-flash`)_
- `NVIDIA_NIM_API_KEY` _(preferred NVIDIA fallback transport)_ **or** `OPENROUTER_API_KEY` _(secondary NVIDIA fallback transport)_ — at least one is required
- `NVIDIA_NIM_MODEL` / `OPENROUTER_NVIDIA_MODEL` _(optional model overrides)_

Then redeploy:

```bash
vercel --prod
```

**Settings:**
- Framework: Next.js (auto-detected)
- Node.js: 20.x
- Function Region: `sin1` or `bom1` for India latency

---

## Tech stack

- **Next.js 14** App Router, TypeScript strict
- **Tailwind CSS** — Mission Control theme (Space Grotesk + Inter + HUD-teal accent)
- **Google Gemini 2.5 Flash** — primary / default, called via the Generative Language REST API with `thinkingBudget: 0`
- **NVIDIA Nemotron Ultra 253B** — automatic fallback, served via NVIDIA NIM (preferred) or OpenRouter (secondary), both via native `fetch`
- **Zod** — API request validation
- **`@modelcontextprotocol/sdk`** — MCP server (`scripts/mcp-server.mjs`)
- **Framer Motion** — Animation library
- **clsx** — Conditional class names

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run type-check` | TypeScript type checking |
| `npm run analyze -- <url>` | Run the CLI against the public API |
| `npm run mcp` | Run the MCP stdio server (for testing) |

---

Built by [IntelliForge AI](https://www.intelliforge.tech/) · Crafted by [Girish Hiremath](https://girishbhiremath.vercel.app/)

> _Aligned with the Bharat AI Mission — democratizing AI for India._
