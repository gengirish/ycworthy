# YCWorthy — AI-Powered Startup Evaluator

> Drop any startup URL. Get a brutal, honest AI evaluation against Y Combinator's real funding criteria.
>
> **Stack:** Next.js 14 · TypeScript · Tailwind CSS · Claude Sonnet 4 · Gemini 1.5 Pro · Vercel

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
| `ANTHROPIC_API_KEY` | [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys) |
| `GOOGLE_AI_API_KEY` | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |

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
/api/analyze (Next.js API Route)
        ↓
ClaudeProvider  ──OR──  GeminiProvider
(web_search tool)       (JSON mode)
        ↓
Shared JSON schema via prompts.ts
        ↓
AnalysisResult type → ResultCard UI
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
    │   ├── ModelToggle.tsx      ← Claude / Gemini switcher
    │   ├── GradeRing.tsx       ← Animated grade circle (S/A/B/C/D/F)
    │   ├── CriteriaGrid.tsx    ← 6-criteria score cards with bars
    │   ├── ResultCard.tsx      ← Full results layout
    │   └── HistoryStrip.tsx    ← Recent analyses from localStorage
    │
    ├── hooks/
    │   └── useAnalyze.ts       ← Fetch logic + loading/error state
    │
    └── lib/
        ├── types.ts            ← Shared TypeScript types + constants
        ├── prompts.ts          ← System prompt (shared by both providers)
        ├── claude.ts           ← ClaudeProvider (Sonnet 4 + web_search)
        ├── gemini.ts           ← GeminiProvider (1.5 Pro + JSON mode)
        └── history.ts          ← localStorage history utilities
```

---

## Features

- **Dual AI providers** — Toggle between Claude (with web search) and Gemini (faster, JSON mode)
- **6 YC criteria** — Problem, Market, Solution, Traction, Founder-Market Fit, Timing
- **Animated grade rings** — Color-coded S through F grades with glow effects
- **Score bars** — Animated progress bars for each criterion
- **Recent analyses** — Last 8 analyses stored in localStorage
- **Share links** — Copy a permalink to share any analysis result
- **Auto-analyze from URL** — `/?url=example.com&provider=claude` triggers analysis on load
- **Dark theme** — #080808 background with #FFE048 accent
- **Mobile-responsive** — Works on 375px+ screens

---

## AI Provider Comparison

| Feature | Claude Sonnet 4 | Gemini 1.5 Pro |
|---------|-----------------|----------------|
| Web search | Native tool | Knowledge only |
| JSON mode | Parse from text | `responseMimeType` |
| Speed | ~12–20s (with search) | ~4–8s |
| Quality | Higher (live data) | Good (training data) |
| Cost | ~$0.003/analysis | ~$0.001/analysis |

---

## Deploy to Vercel

```bash
npm i -g vercel
vercel login
vercel
```

Add environment variables in Vercel Dashboard → Settings → Environment Variables:
- `ANTHROPIC_API_KEY`
- `GOOGLE_AI_API_KEY`

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
- **Anthropic SDK** — Claude Sonnet 4 with `web_search` tool
- **Google Generative AI** — Gemini 1.5 Pro with JSON mode
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

Built for IntelliForge AI · [intelliforge.tech](https://intelliforge.tech)
