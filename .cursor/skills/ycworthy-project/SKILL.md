---
name: ycworthy-project
description: Provides architecture knowledge for the YCWorthy startup evaluator. Use when exploring the codebase, adding features, debugging, or asking about project structure, tech stack, design system, or conventions.
---

# YCWorthy — Project Architecture

## Project Context

YCWorthy is an AI-powered Y Combinator startup evaluator. Users paste a startup URL, choose an AI provider (NVIDIA Nemotron or Gemini), and receive a detailed evaluation scored against YC's real funding criteria. Built by IntelliForge AI, crafted by Girish Hiremath.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 3.4 |
| Animation | Framer Motion 12, CSS keyframes |
| AI Providers | NVIDIA Nemotron Ultra 253B (via OpenRouter, primary) + Google Gemini 2.5 Flash (automatic fallback) |
| Validation | Zod |
| Class Utils | clsx |
| Deployment | Vercel |

## Project Structure

```
ycworthy/
├── .cursor/skills/          # Cursor agent skills (this file)
├── .cursorrules             # Cursor AI rules
├── .env.local.example       # Template for API keys
├── next.config.js           # External packages config
├── package.json             # Next.js 14 + AI SDKs + Zod
├── tailwind.config.ts       # YC theme colors + animations
├── postcss.config.js        # Tailwind + autoprefixer
├── tsconfig.json            # Strict TS, @/* path alias
│
└── src/
    ├── app/
    │   ├── globals.css          # Tailwind directives + grade glow utilities
    │   ├── layout.tsx           # Root layout + metadata
    │   ├── page.tsx             # Main UI (URL input, history, results, share)
    │   └── api/
    │       └── analyze/
    │           └── route.ts     # POST /api/analyze (Zod validated)
    │
    ├── components/
    │   ├── ModelToggle.tsx       # NVIDIA / Gemini switcher
    │   ├── GradeRing.tsx        # Animated grade circle (S/A/B/C/D/F)
    │   ├── CriteriaGrid.tsx     # 6-criteria score cards with animated bars
    │   ├── ResultCard.tsx       # Full results layout (verdict, flags, question)
    │   └── HistoryStrip.tsx     # Recent analyses from localStorage
    │
    ├── hooks/
    │   └── useAnalyze.ts        # Fetch logic + loading/error state
    │
    └── lib/
        ├── types.ts             # AnalysisResult, Grade, AIProvider, constants
        ├── criteria.tsx         # CRITERIA_META + Lucide icon components
        ├── prompts.ts           # System prompt shared by both AI providers
        ├── nvidia.ts            # NvidiaProvider (OpenRouter → Nemotron Ultra 253B)
        ├── gemini.ts            # GeminiProvider (gemini-2.5-flash, JSON mode)
        └── history.ts           # localStorage history utilities
```

## Design System

### Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `yc-bg` | #080808 | Primary background |
| `yc-surface` | #0d0d0d | Cards, inputs |
| `yc-border` | #1e1e1e | Borders |
| `yc-accent` | #FFE048 | Primary accent (gold) |
| `yc-text` | #e8e8e8 | Body text |
| `yc-muted` | #444444 | Secondary text |
| `grade-s` | #00FFB2 | S grade (exceptional) |
| `grade-a` | #7CFF6B | A grade (strong) |
| `grade-b` | #FFE048 | B grade (solid) |
| `grade-c` | #FF9F43 | C grade (mediocre) |
| `grade-d` | #FF6B6B | D grade (weak) |
| `grade-f` | #FF3860 | F grade (failing) |

### Typography

| Font | Usage |
|------|-------|
| Georgia, serif | Body text (font-sans in Tailwind) |
| Courier New, monospace | Labels, scores, buttons (font-mono) |

## Data Flow

```
User inputs URL + picks provider (page.tsx)
  → useAnalyze hook → POST /api/analyze
  → Zod validates { url, provider: "nvidia" | "gemini" }
  → tries NvidiaProvider first (or GeminiProvider if requested)
  → on failure → automatically falls back to the other provider
  → response carries { data, provider, fallback_used }
  → Shared SYSTEM_PROMPT from prompts.ts
  → JSON response parsed → AnalysisResult type
  → ResultCard renders grades, criteria, flags
  → addToHistory saves to localStorage
```

## Naming Conventions

| Used for | Style | Example |
|----------|-------|---------|
| Components | PascalCase | `GradeRing.tsx`, `ResultCard.tsx` |
| Hooks | camelCase with `use` | `useAnalyze.ts` |
| Lib files | camelCase | `nvidia.ts`, `history.ts` |
| Types | PascalCase | `AnalysisResult`, `AIProvider` |
| Constants | UPPER_SNAKE_CASE | `GRADE_COLOR`, `CRITERIA_META` |
| API routes | kebab-case dirs | `api/analyze/route.ts` |
| CSS/Tailwind | kebab-case | `yc-bg`, `grade-s` |

## Key Rules

1. **Named exports** for components; `default export` only for pages
2. **All AI calls through `src/lib/`** — never from components
3. **Zod validation** for all API input
4. **`{ data, error }` response shape** from API routes
5. **Grade colors from `types.ts`** — never hardcode hex values
6. **`"use client"` only where needed** — components with state/effects
7. **Mobile-first** — everything works on 375px width
8. **No `console.log`** in production — use error boundaries
9. **No `any`** — strict TypeScript everywhere
10. **API keys only in `.env.local`** — never in client code

## Environment Variables

| Variable | Scope | Purpose |
|----------|-------|---------|
| `OPENROUTER_API_KEY` | Server | NVIDIA Nemotron via OpenRouter (primary). Required. |
| `OPENROUTER_NVIDIA_MODEL` | Server | _Optional_ override for the NVIDIA model slug. |
| `GOOGLE_AI_API_KEY` | Server | Gemini API key (automatic fallback). Required. |
| `NEXT_PUBLIC_APP_URL` | Client | App URL for share links + OpenRouter `HTTP-Referer`. |
