---
name: ycworthy-project
description: Provides architecture knowledge for the YCWorthy startup evaluator. Use when exploring the codebase, adding features, debugging, or asking about project structure, tech stack, design system, public API, MCP server, CLI, or conventions.
---

# YCWorthy — Project Architecture

## Project Context

YCWorthy is an AI-powered Y Combinator startup evaluator. Users (or any HTTP client / MCP host / CLI) submit a startup URL, optionally pick an AI provider (Gemini by default, NVIDIA Nemotron Ultra 253B as auto fallback), and receive a structured scorecard against YC's real funding criteria. Built by IntelliForge AI, crafted by Girish Hiremath.

It exposes the same pipeline through **four surfaces**:

1. **Web UI** — Next.js page at `/`
2. **Public REST API** — `/api/analyze` (POST + GET), `/api/health`, `/api/openapi.json` — public, no-auth, CORS open, OpenAPI 3.1 spec served live
3. **MCP server** — `scripts/mcp-server.mjs`, exposes the `analyze_startup` tool over stdio for Claude / Cursor / Codex / Continue / Cline
4. **CLI** — `scripts/cli.mjs` (also installable as `npx ycworthy <url>` via the `bin` entry in `package.json`)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 3.4 |
| Animation | Framer Motion 12, CSS keyframes |
| AI Providers | Google Gemini 2.5 Flash (primary / default) + NVIDIA Nemotron Ultra 253B (automatic fallback — NIM preferred, OpenRouter secondary) |
| Validation | Zod |
| MCP | `@modelcontextprotocol/sdk` (stdio transport, JSON-RPC `2024-11-05`) |
| Class Utils | clsx |
| Deployment | Vercel |

## Project Structure

```
ycworthy/
├── .cursor/skills/          # Cursor agent skills (this file + others)
├── .cursorrules             # Cursor AI rules
├── .env.local.example       # Template for API keys
├── docs/
│   ├── API.md               # REST API reference (public)
│   ├── MCP.md               # MCP setup guide for Claude / Cursor / Codex
│   └── AUTOMATION.md        # curl, Python, Node, GitHub Actions, n8n recipes
├── scripts/
│   ├── cli.mjs              # `node scripts/cli.mjs <url>` — terminal CLI
│   └── mcp-server.mjs       # MCP stdio server (analyze_startup tool)
├── next.config.js
├── package.json             # bin: { ycworthy, ycworthy-mcp } + scripts: { analyze, mcp }
├── tailwind.config.ts       # Mission Control theme (Space Grotesk + Inter + HUD teal)
├── postcss.config.js
├── tsconfig.json            # Strict TS, @/* path alias
│
└── src/
    ├── app/
    │   ├── globals.css                     # Fonts, base colors, focus rings, film-grain
    │   ├── layout.tsx                      # Root layout + metadata
    │   ├── page.tsx                        # Main UI (URL input, history, results, share)
    │   └── api/
    │       ├── analyze/route.ts            # POST + GET + OPTIONS — core pipeline
    │       ├── health/route.ts             # GET + OPTIONS — provider status
    │       └── openapi.json/route.ts       # GET + OPTIONS — OpenAPI 3.1 spec
    │
    ├── components/
    │   ├── ModelToggle.tsx                 # Gemini / NVIDIA switcher
    │   ├── GradeRing.tsx                   # Animated grade circle (S/A/B/C/D/F)
    │   ├── CriteriaGrid.tsx                # 6-criteria bento scorecard
    │   ├── ResultCard.tsx                  # Full results layout (verdict, flags, question)
    │   └── HistoryStrip.tsx                # Recent analyses from localStorage
    │
    ├── hooks/
    │   └── useAnalyze.ts                   # Fetch logic + loading/error state
    │
    └── lib/
        ├── version.ts                      # API_VERSION — single source of truth
        ├── http.ts                         # CORS + request_id + meta envelope helpers
        ├── types.ts                        # AnalysisResult, Grade, AIProvider, GRADE_COLOR
        ├── criteria.tsx                    # CRITERIA_META + Lucide icon components
        ├── prompts.ts                      # System prompt shared by both AI providers
        ├── nvidia.ts                       # NIM (preferred) → OpenRouter (fallback) → Nemotron Ultra
        ├── gemini.ts                       # gemini-2.5-flash, native fetch, thinkingBudget=0
        └── history.ts                      # localStorage history utilities
```

## Design System — "Mission Control" theme

> HUD/Sci-Fi FUI × AI-Native UI × Bento Box Grid. Generated via the [`ui-ux-pro-max`](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) reasoning engine for the "AI startup evaluator / scoring engine + multi-agent fallback" product profile. The brand reads as analytical instrumentation rather than a magazine.

### Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `yc-bg` | `#060A12` | Primary background — deep-space navy (never pure black) |
| `yc-surface` | `#0C1320` | Cards, inputs |
| `yc-surface-2` | `#131D30` | Elevated surfaces |
| `yc-border` | `#1F2A40` | Borders |
| `yc-border-light` | `#2C3A56` | Stronger borders |
| `yc-accent` | **`#00E0B8`** | **Brand HUD teal** — interactive UI chrome only (buttons, focus rings, wordmark dot, links) |
| `yc-accent-soft` | `#5CFFE0` | Hover/lighter brand |
| `yc-accent-deep` | `#00B294` | Pressed/darker brand |
| `yc-accent-2` | **`#7C5CFF`** | **AI-agent violet** — reserved for AI/automation chrome (active provider chip, MCP/agent badges) |
| `yc-accent-2-soft` | `#A993FF` | AI accent hover |
| `yc-text` | `#E6F1FF` | Body text (cool paper-white) |
| `yc-muted` | `#5C6B85` | Disabled / placeholder |
| `yc-dim` | `#8FA0BD` | Secondary text |
| `grade-s` | `#00FFC2` | S grade (exceptional) |
| `grade-a` | `#69E68A` | A grade (strong) |
| `grade-b` | `#FFD24A` | B grade (solid) |
| `grade-c` | `#FFA040` | C grade (mediocre) |
| `grade-d` | `#FF6A6A` | D grade (weak) |
| `grade-f` | `#FF3A6A` | F grade (failing) |
| `provider-gemini` | `#4A9EFF` | Gemini chip (canonical brand hue) |
| `provider-nvidia` | `#76B900` | NVIDIA chip (canonical brand hue) |

**Critical separations** — the brand uses a single piercing **HUD teal** for *interactive UI chrome*, an **AI-violet** for *agent/automation indicators*, and reserves the entire green-amber-orange-red spectrum for *data colors* (grades, likelihoods, flags). Never use `#00E0B8` for data, never use grade colors for UI chrome, never use violet for non-AI elements.

### Typography

| Font | Tailwind class | Usage |
|------|---------------|-------|
| **Space Grotesk** 600/700 (geometric futurist) | `font-display` | YCWorthy wordmark, company H2, headlines, grade letters, partner pull-quote |
| **Inter** 400/500/600 (workhorse sans) | `font-sans` | Body, buttons, descriptions, sub-labels |
| **JetBrains Mono** 400/500/600 | `font-mono` | Telemetry readouts, eyebrows, micro-labels, code, terminal CTAs |

The `font-display-opt` utility is preserved for backward compatibility but is now a no-op (Space Grotesk doesn't expose an `opsz` axis).

### Effects

- `.bg-film-grain` — horizontal scanlines (≈3.5% opacity, mix-blend-overlay) — Mission Control signature texture (class name kept for back-compat with the previous "film grain" Editorial theme)
- `.bg-grid` — cool teal HUD lattice (`80px` grid, ≈4.5% opacity)
- `.hud-frame` — corner-tick brackets on top-left + bottom-right of any card; intensifies on hover
- `.text-glow-accent` — HUD-teal text-shadow
- `.grade-glow-{s,a,b,c,d,f}` — grade-tinted box-shadow rings (retuned for Mission Control palette)
- `glow-pulse` keyframe — heartbeat for active instruments (teal)
- `agent-sweep` keyframe — slow rotating sweep around active AI chip

## Data Flow

```
                ┌────────── User surfaces ──────────┐
                │                                    │
   Web UI    REST API    MCP server      CLI       (Custom GPT, n8n,
 (page.tsx) (curl/fetch) (Claude/Cursor) (npx)       Slack, GitHub Action)
      │         │            │             │
      └─────────┴──┬─────────┴─────────────┘
                   ▼
       POST/GET /api/analyze
       (Zod-validated, CORS, request_id, meta envelope)
                   │
                   ▼
       Try requested provider (default: Gemini)
                   │ (on error)
                   ▼
       Auto-fallback to other provider
       Response: { data, provider, fallback_used, requested_provider, primary_error?, meta }
       Headers: X-Provider, X-Provider-Fallback, X-Duration-Ms, X-Request-Id, X-Api-Version
                   │
                   ▼
       Web UI: ResultCard renders → HistoryStrip → localStorage
       API/MCP/CLI clients: parse JSON / structured content
```

## Naming Conventions

| Used for | Style | Example |
|----------|-------|---------|
| Components | PascalCase | `GradeRing.tsx`, `ResultCard.tsx` |
| Hooks | camelCase with `use` | `useAnalyze.ts` |
| Lib files | camelCase | `nvidia.ts`, `history.ts`, `http.ts` |
| Types | PascalCase | `AnalysisResult`, `AIProvider` |
| Constants | UPPER_SNAKE_CASE | `GRADE_COLOR`, `CRITERIA_META`, `API_VERSION` |
| API routes | kebab-case dirs | `api/analyze/route.ts`, `api/openapi.json/route.ts` |
| Scripts | kebab-case `.mjs` | `scripts/cli.mjs`, `scripts/mcp-server.mjs` |
| CSS/Tailwind | kebab-case | `yc-bg`, `grade-s`, `font-display-opt` |
| Error codes | snake_case | `validation_failed`, `all_providers_failed` |

## Key Rules

1. **Named exports** for components; `default export` only for pages
2. **All AI calls through `src/lib/`** — never from components
3. **Zod validation** for all API input
4. **`{ data, error, meta }` response shape** from API routes — use `jsonResponse()` / `errorResponse()` helpers from `src/lib/http.ts`
5. **Grade colors from `types.ts`** — never hardcode hex values for data
6. **Brand colors via Tailwind tokens (`yc-accent` teal, `yc-accent-2` violet)** — never hardcode hex; never use HUD teal for data; never use violet outside AI/automation chrome
7. **Every public route exports `OPTIONS`** returning `preflight()` (CORS support)
8. **Update `src/app/api/openapi.json/route.ts`** in the same commit as any route change; bump `API_VERSION`
9. **`"use client"` only where needed** — components with state/effects
10. **Mobile-first** — everything works on 375px width
11. **No `console.log`** in production — use error boundaries (server-side `console.error` is fine for logs)
12. **No `any`** — strict TypeScript everywhere
13. **API keys only in `.env.local`** / Vercel env — never in client code or committed files
14. **MCP/CLI scripts use the public API** (default base `https://ycworthy.intelliforge.tech`) — they don't import from `src/lib/` so they can run standalone via `npx`

## Environment Variables

### Server (API routes)

| Variable | Scope | Purpose |
|----------|-------|---------|
| `GEMINI_API_KEY` | Server | Gemini API key (primary / default). Required. Legacy `GOOGLE_AI_API_KEY` still accepted as fallback. |
| `GEMINI_MODEL` | Server | _Optional_ override for the Gemini model slug. Defaults to `gemini-2.5-flash`. |
| `NVIDIA_NIM_API_KEY` | Server | **Preferred** NVIDIA fallback transport — direct NVIDIA inference API (`nvapi-...`). |
| `NVIDIA_NIM_MODEL` | Server | _Optional_ override for the NIM model slug. |
| `OPENROUTER_API_KEY` | Server | Secondary NVIDIA fallback transport — used only if `NVIDIA_NIM_API_KEY` is absent. At least one of NIM / OpenRouter must be set. |
| `OPENROUTER_NVIDIA_MODEL` | Server | _Optional_ override for the OpenRouter model slug. |
| `NEXT_PUBLIC_APP_URL` | Client | App URL for share links + OpenRouter `HTTP-Referer`. |

### MCP server / CLI (`scripts/*.mjs`)

| Variable | Default | Purpose |
|----------|---------|---------|
| `YCWORTHY_API_URL` | `https://ycworthy.intelliforge.tech` | Base URL of the YCWorthy API to call |
| `YCWORTHY_PROVIDER` | `gemini` | Default AI provider when caller doesn't specify |
| `YCWORTHY_TIMEOUT` | `90000` | Per-request timeout in milliseconds |

## Public API contract

See `docs/API.md` for the full reference. At a glance:

- `POST /api/analyze` — `{ url, provider? }` → `{ data, provider, requested_provider, duration_ms, fallback_used, primary_error?, meta }`
- `GET /api/analyze?url=...&provider=...` — same response
- `GET /api/health` — `{ status: "ok"|"degraded", providers: {gemini, nvidia}, meta }`
- `GET /api/openapi.json` — OpenAPI 3.1 spec (kept in sync with `src/app/api/openapi.json/route.ts`)
- `OPTIONS *` — CORS preflight (204)

Standard error codes: `invalid_json`, `missing_url`, `validation_failed`, `no_provider_configured`, `all_providers_failed`. Add new ones in both the route and the OpenAPI spec.
