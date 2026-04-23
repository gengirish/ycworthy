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
├── tailwind.config.ts       # Editorial AI theme (Fraunces + Geist + vermilion)
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

## Design System — Editorial AI theme

### Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `yc-bg` | #0A0A0B | Primary background (warm near-black, paper feel) |
| `yc-surface` | #111114 | Cards, inputs |
| `yc-surface-2` | #17171C | Elevated surfaces |
| `yc-border` | #23232B | Borders |
| `yc-border-light` | #33333D | Stronger borders |
| `yc-accent` | **#FF6A2A** | **Brand vermilion** — interactive UI chrome only (buttons, focus rings, links) |
| `yc-accent-soft` | #FF8A55 | Hover/lighter brand |
| `yc-accent-deep` | #D9521A | Pressed/darker brand |
| `yc-text` | #ECEAE3 | Body text (paper-warm off-white) |
| `yc-muted` | #5A5A60 | Disabled / placeholder |
| `yc-dim` | #8A8682 | Secondary text |
| `grade-s` | #00FFB2 | S grade (exceptional) |
| `grade-a` | #7CFF6B | A grade (strong) |
| `grade-b` | **#F4B942** | B grade (solid) — **editorial amber** (NOT the old #FFE048; that collided with the brand accent) |
| `grade-c` | #FF9F43 | C grade (mediocre) |
| `grade-d` | #FF6B6B | D grade (weak) |
| `grade-f` | #FF3860 | F grade (failing) |

**Critical separation:** the brand vermilion (`#FF6A2A`) is reserved for *interactive UI chrome*; the entire green/amber/orange/red spectrum is reserved for *data colors* (grades, likelihoods, flags). Never use `#FF6A2A` for data, never use grade colors for UI chrome.

### Typography

| Font | Tailwind class | Usage |
|------|---------------|-------|
| **Fraunces** (variable serif w/ optical sizing) | `font-display`, `font-serif` | YCWorthy wordmark, company H2, YC partner pull-quote |
| **Geist** (Vercel's neo-grotesque) | `font-sans` | Body, buttons, labels |
| **JetBrains Mono** | `font-mono` | Meta strips, micro-labels, score badges |

The `font-display-opt` utility sets `font-variation-settings: "opsz" 144` for the wordmark/heroes.

### Effects

- `bg-film-grain` — subtle SVG film-grain overlay (mix-blend-overlay, opacity 0.03)
- `bg-grid` — faint warm-white grid (very low opacity)
- `text-glow-accent` — vermilion text-shadow for the wordmark
- `grade-glow-{s,a,b,c,d,f}` — grade-tinted box-shadow rings

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
6. **Brand vermilion `#FF6A2A` from Tailwind tokens** — never hardcode it inline; never use it for data
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
