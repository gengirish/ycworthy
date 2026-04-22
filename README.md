# YCWorthy — AI-Powered Startup Evaluator

> Drop any startup URL. Get a brutal, honest AI evaluation against Y Combinator's real funding criteria.
>
> **Stack:** Next.js 14 · TypeScript · Tailwind CSS · NVIDIA Nemotron Ultra 253B (via OpenRouter) · Gemini 2.5 Flash (fallback) · Vercel

---

## What It Does

YCWorthy analyzes any startup website through the lens of a Y Combinator partner with 15 years of experience. It evaluates six core criteria and returns:

| Output | Description |
|--------|-------------|
| **Overall Grade** | S/A/B/C/D/F with 0–100 score |
| **YC Likelihood** | Unlikely / Possible / Probable / Strong |
| **6 Criteria Scores** | Problem, Market, Solution, Traction, Founder-Market Fit, Timing |
| **Red & Green Flags** | Specific strengths and weaknesses |
| **YC Interview Question** | The hardest question a YC partner would ask |
| **Partner Verdict** | 2–3 sentence honest funding opinion |

---

## Quick Start

### 1. Clone & install

```bash
git clone <repo-url> ycworthy
cd ycworthy
npm install
```

### 2. Set up environment

```bash
cp .env.local.example .env.local
```

Fill in your API keys in `.env.local`:

| Variable | Where to get it |
|----------|----------------|
| `OPENROUTER_API_KEY` | [openrouter.ai/keys](https://openrouter.ai/keys) — used for NVIDIA Nemotron (primary) |
| `OPENROUTER_NVIDIA_MODEL` | _(optional)_ override the NVIDIA model slug. Defaults to `nvidia/llama-3.1-nemotron-ultra-253b-v1` |
| `GOOGLE_AI_API_KEY` | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) — used for Gemini (fallback) |

### 3. Run dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Architecture

```
User inputs URL + picks provider
        ↓
/api/analyze (Next.js API Route, Zod-validated)
        ↓
NvidiaProvider (OpenRouter → Nemotron Ultra 253B)   ← primary
        │
        │  on failure (timeout, 5xx, parse error…)
        ↓
GeminiProvider (gemini-2.5-flash, JSON mode)        ← automatic fallback
        ↓
Shared JSON schema via prompts.ts
        ↓
AnalysisResult → ResultCard UI
                (response also carries `fallback_used` + `X-Provider-Fallback` header)
```

---

## File Structure

```
ycworthy/
├── .env.local.example          ← Copy → .env.local, fill keys
├── next.config.js
├── package.json
├── tailwind.config.ts          ← Tailwind with YC theme colors
├── postcss.config.js
├── tsconfig.json
│
└── src/
    ├── app/
    │   ├── globals.css         ← Tailwind directives + custom utilities
    │   ├── layout.tsx          ← Root layout + metadata
    │   ├── page.tsx            ← Main UI (URL input, history, results)
    │   └── api/
    │       └── analyze/
    │           └── route.ts    ← POST /api/analyze (Zod validated)
    │
    ├── components/
    │   ├── ModelToggle.tsx      ← NVIDIA / Gemini switcher
    │   ├── GradeRing.tsx        ← Animated grade circle (S/A/B/C/D/F)
    │   ├── CriteriaGrid.tsx     ← 6-criteria score cards with bars
    │   ├── ResultCard.tsx       ← Full results layout
    │   └── HistoryStrip.tsx     ← Recent analyses from localStorage
    │
    ├── hooks/
    │   └── useAnalyze.ts        ← Fetch logic + loading/error state
    │
    └── lib/
        ├── types.ts             ← Shared TypeScript types + constants
        ├── prompts.ts           ← System prompt (shared by both providers)
        ├── nvidia.ts            ← NvidiaProvider (OpenRouter → Nemotron Ultra 253B)
        ├── gemini.ts            ← GeminiProvider (gemini-2.5-flash, JSON mode)
        └── history.ts           ← localStorage history utilities
```

---

## Features

- **NVIDIA-first, Gemini fallback** — Always tries NVIDIA Nemotron Ultra 253B first; if it errors, automatically retries on Gemini 2.5 Flash. Surfaces `fallback_used` in the response.
- **6 YC criteria** — Problem, Market, Solution, Traction, Founder-Market Fit, Timing
- **Animated grade rings** — Color-coded S through F grades with glow effects
- **Score bars** — Animated progress bars for each criterion
- **Recent analyses** — Last 8 analyses stored in localStorage
- **Share links** — Copy a permalink to share any analysis result
- **Auto-analyze from URL** — `/?url=example.com&provider=nvidia` triggers analysis on load
- **Dark theme** — #080808 background with #FFE048 accent
- **Mobile-responsive** — Works on 375px+ screens

---

## AI Provider Comparison

| Feature | NVIDIA Nemotron Ultra 253B (via OpenRouter) | Gemini 2.5 Flash |
|---------|---------------------------------------------|------------------|
| Role | Primary | Automatic fallback |
| Reasoning | Top-tier 253B reasoning model | Fast, cost-efficient |
| JSON mode | `response_format: json_object` | `responseMimeType: application/json` |
| Speed | ~8–18s | ~3–6s |
| API surface | OpenAI-compatible (native `fetch`) | `@google/generative-ai` SDK |
| Override | `OPENROUTER_NVIDIA_MODEL` env var | _(none)_ |

---

## Deploy to Vercel

```bash
npm i -g vercel
vercel login
vercel
```

Add environment variables in Vercel Dashboard → Settings → Environment Variables:
- `OPENROUTER_API_KEY` _(required — NVIDIA primary)_
- `GOOGLE_AI_API_KEY` _(required — Gemini fallback)_
- `OPENROUTER_NVIDIA_MODEL` _(optional override)_

Then redeploy:

```bash
vercel --prod
```

**Settings:**
- Framework: Next.js (auto-detected)
- Node.js: 20.x
- Function Region: `sin1` or `bom1` for India latency

---

## Tech Stack

- **Next.js 14** App Router, TypeScript strict
- **Tailwind CSS** — Dark theme with custom YC palette
- **OpenRouter (native `fetch`)** — NVIDIA Nemotron Ultra 253B as the primary reasoning model
- **Google Generative AI** — Gemini 2.5 Flash with JSON mode (automatic fallback)
- **Zod** — API request validation
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

---

Built by [IntelliForge AI](https://www.intelliforge.tech/) · Crafted by [Girish Hiremath](https://girishbhiremath.vercel.app/)

> _Aligned with the Bharat AI Mission — democratizing AI for India._
