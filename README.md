# YCWorthy — AI-Powered Startup Evaluator

> Drop any startup URL. Get a brutal, honest AI evaluation against Y Combinator's real funding criteria.
>
> **Stack:** Next.js 14 · TypeScript · Tailwind CSS · Gemini 2.5 Flash (default) · NVIDIA Nemotron Ultra 253B via OpenRouter (fallback) · Vercel

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
| `GEMINI_API_KEY` | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) — used for Gemini (primary / default). Legacy `GOOGLE_AI_API_KEY` still accepted as fallback. |
| `GEMINI_MODEL` | _(optional)_ override the Gemini model slug. Defaults to `gemini-2.5-flash` |
| `OPENROUTER_API_KEY` | [openrouter.ai/keys](https://openrouter.ai/keys) — used for NVIDIA Nemotron (automatic fallback) |
| `OPENROUTER_NVIDIA_MODEL` | _(optional)_ override the NVIDIA model slug. Defaults to `nvidia/llama-3.1-nemotron-ultra-253b-v1` |

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
GeminiProvider (gemini-2.5-flash, JSON mode)        ← primary / default
        │
        │  on failure (timeout, 5xx, parse error…)
        ↓
NvidiaProvider (OpenRouter → Nemotron Ultra 253B)   ← automatic fallback
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
    │   ├── ModelToggle.tsx      ← Gemini / NVIDIA switcher
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

- **Gemini-first, NVIDIA fallback** — Always tries Gemini 2.5 Flash first; if it errors, automatically retries on NVIDIA Nemotron Ultra 253B. Surfaces `fallback_used` in the response.
- **6 YC criteria** — Problem, Market, Solution, Traction, Founder-Market Fit, Timing
- **Animated grade rings** — Color-coded S through F grades with glow effects
- **Score bars** — Animated progress bars for each criterion
- **Recent analyses** — Last 8 analyses stored in localStorage
- **Share links** — Copy a permalink to share any analysis result
- **Auto-analyze from URL** — `/?url=example.com&provider=gemini` triggers analysis on load
- **Dark theme** — #080808 background with #FFE048 accent
- **Mobile-responsive** — Works on 375px+ screens

---

## AI Provider Comparison

| Feature | Gemini 2.5 Flash | NVIDIA Nemotron Ultra 253B (via OpenRouter) |
|---------|------------------|---------------------------------------------|
| Role | Primary / default | Automatic fallback |
| Reasoning | Fast, cost-efficient, strong JSON adherence | Top-tier 253B reasoning model |
| JSON mode | `responseMimeType: application/json` | `response_format: json_object` |
| Speed | ~3–6s | ~8–18s |
| API surface | `@google/generative-ai` SDK | OpenAI-compatible (native `fetch`) |
| Override | `GEMINI_MODEL` env var | `OPENROUTER_NVIDIA_MODEL` env var |

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
- `OPENROUTER_API_KEY` _(required — NVIDIA fallback)_
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
- **Google Generative AI** — Gemini 2.5 Flash with JSON mode as the primary / default provider
- **OpenRouter (native `fetch`)** — NVIDIA Nemotron Ultra 253B as the automatic fallback
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
