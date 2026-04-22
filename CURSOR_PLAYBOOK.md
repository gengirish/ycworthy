# YCWorthy — Cursor Playbook

> AI-powered Y Combinator startup evaluator  
> Stack: Next.js 14 · TypeScript · Claude Sonnet 4 · Gemini 1.5 Pro · Vercel

---

## Architecture at a Glance

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
├── .cursorrules                     ← AI coding instructions for Cursor
├── CURSOR_PLAYBOOK.md               ← This file
├── .env.local.example               ← Copy → .env.local, fill keys
├── .gitignore
├── next.config.js
├── package.json
├── tsconfig.json
│
└── src/
    ├── app/
    │   ├── globals.css
    │   ├── layout.tsx
    │   ├── page.tsx                 ← Main UI (client component)
    │   └── api/
    │       └── analyze/
    │           └── route.ts         ← POST /api/analyze
    │
    ├── components/
    │   ├── ModelToggle.tsx          ← Claude / Gemini switcher
    │   ├── GradeRing.tsx            ← Animated grade circle (S/A/B/C/D/F)
    │   ├── CriteriaGrid.tsx         ← 6-criteria score cards
    │   └── ResultCard.tsx           ← Full results layout
    │
    ├── hooks/
    │   └── useAnalyze.ts            ← Fetch logic + state
    │
    └── lib/
        ├── types.ts                 ← All shared TypeScript types + constants
        ├── prompts.ts               ← Shared system prompt (both providers)
        ├── claude.ts                ← ClaudeProvider (Sonnet 4 + web_search)
        └── gemini.ts                ← GeminiProvider (1.5 Pro + JSON mode)
```

---

## Phase 1 — Local Setup (do this first)

```bash
# 1. Create project folder and enter it
mkdir ycworthy && cd ycworthy

# 2. Copy all scaffold files from this package into the folder

# 3. Install dependencies
npm install

# 4. Set up environment
cp .env.local.example .env.local
# → Open .env.local and paste your keys (see Phase 2)

# 5. Start dev server
npm run dev
# → Open http://localhost:3000
```

---

## Phase 2 — API Keys

> Anthropic / Claude has been removed from this project. Do not add `ANTHROPIC_API_KEY` back.

### OpenRouter (NVIDIA Nemotron — primary)
1. Go to https://openrouter.ai/keys
2. Create a new API key (`sk-or-v1-...`)
3. Paste into `.env.local` as `OPENROUTER_API_KEY=sk-or-v1-...`

> Default model: `nvidia/llama-3.1-nemotron-ultra-253b-v1` (NVIDIA's largest reasoning model).
> Override with `OPENROUTER_NVIDIA_MODEL=...` if you want a smaller / cheaper Nemotron variant.

### Google AI Studio (Gemini — automatic fallback)
1. Go to https://aistudio.google.com/apikey
2. Create a new API key
3. Paste into `.env.local` as `GOOGLE_AI_API_KEY=AIza...`

> Gemini 2.5 Flash with `responseMimeType: "application/json"` gives reliable structured output and kicks in automatically if NVIDIA fails.

---

## Phase 3 — Vercel Deployment

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy (first time — follow the prompts)
vercel

# 4. Add env vars in Vercel dashboard
#    → Settings → Environment Variables
#    OPENROUTER_API_KEY        = sk-or-v1-...   (required, NVIDIA primary)
#    GOOGLE_AI_API_KEY         = AIza...        (required, Gemini fallback)
#    OPENROUTER_NVIDIA_MODEL   = nvidia/llama-3.1-nemotron-ultra-253b-v1   (optional override)

# 5. Redeploy to apply env vars
vercel --prod
```

**Vercel project settings to check:**
- Framework Preset: Next.js (auto-detected)
- Node.js Version: 20.x
- Function Region: `sin1` (Singapore) or `bom1` (Mumbai) for India latency

---

## Phase 4 — Cursor Prompts (copy-paste ready)

Use these prompts directly in Cursor chat after opening the project.

### Add history / recent analyses
```
Add a "Recent Analyses" section below the input. 
Store the last 5 results in localStorage with key "ycworthy_history".
Each item: { url, company, overall_grade, overall_score, timestamp }.
Show them as clickable chips that pre-fill the URL input.
Follow the dark theme from page.tsx.
```

### Add share / permalink
```
After analysis, add a "Share" button that copies a URL like:
/?url=https://example.com&provider=claude
On page load, if ?url param exists, auto-trigger analysis.
Use Next.js useSearchParams and useRouter from next/navigation.
```

### Add rate limiting (Upstash Redis)
```
Add rate limiting to /api/analyze using Upstash Redis + @upstash/ratelimit.
Limit: 5 requests per IP per hour.
Install: npm install @upstash/ratelimit @upstash/redis
Add env vars: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.
Return 429 with { error: "Rate limit exceeded. Try again in X minutes." }
```

### Add Supabase analytics
```
After each successful analysis, store it in Supabase.
Table: analyses (id, url, company, overall_grade, overall_score, provider, created_at)
Install: npm install @supabase/supabase-js
Add env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
Create a /api/analyses/stats route that returns { total_count, top_grades, avg_score }.
Show a small stats strip in the header: "X startups analyzed · avg score Y"
```

### Add PDF export
```
Add a "Download Report" button to ResultCard that generates a PDF.
Install: npm install jspdf html2canvas
The PDF should include: company name, overall grade, verdict, criteria table, flags, interview question.
Dark theme with #080808 background, #FFE048 accent.
Filename: ycworthy-[company-slug]-[date].pdf
```

---

## Phase 5 — Monetization Ideas (for IntelliForge AI)

| Feature | Free | Pro ($9/mo) |
|---------|------|-------------|
| Analyses per day | 3 | Unlimited |
| Provider choice | Claude only | Claude + Gemini |
| PDF export | ✗ | ✓ |
| Shareable permalink | ✓ | ✓ |
| Batch analysis (CSV) | ✗ | ✓ |
| History (saved) | ✗ | ✓ (50 saved) |

**Add auth:** Clerk (`npm install @clerk/nextjs`) — same setup as your other projects.

---

## How the Providers Differ

| Feature | Claude Sonnet 4 | Gemini 1.5 Pro |
|---------|-----------------|----------------|
| Web search | ✓ Native tool | ✗ (knowledge only) |
| JSON mode | Parse text | `responseMimeType` |
| Speed | ~12–20s (with search) | ~4–8s |
| Quality | Higher (live data) | Good (training data) |
| Cost | ~$0.003/analysis | ~$0.001/analysis |

---

## Troubleshooting

### "No text response from Claude"
Claude returned only tool_use blocks. The `textBlock` filter in `claude.ts` gets the last text block — ensure the model finishes with text. If it doesn't, add `tool_choice: { type: "auto" }` to force it.

### Gemini returns non-JSON
`responseMimeType: "application/json"` should enforce JSON. If it still fails, the `parseJSON()` fallback extracts the first `{...}` block. Check Gemini model availability for your region.

### `maxDuration = 60` not working
This requires Vercel Pro/Enterprise. On Hobby, max is 10s — Claude with web search may timeout. Switch to Gemini for Hobby-tier Vercel, or set `maxDuration = 10` in the route.

### CORS errors in local dev
API routes are server-side — no CORS needed. If you see CORS errors, you're calling the Anthropic API directly from the client. Move all API calls to `/api/analyze`.

---

## Type Reference

```typescript
type Grade = "S" | "A" | "B" | "C" | "D" | "F";
type YCLikelihood = "Unlikely" | "Possible" | "Probable" | "Strong";
type AIProvider = "claude" | "gemini";

interface AnalysisResult {
  company: string;
  tagline: string;
  overall_grade: Grade;
  overall_score: number;        // 0–100
  verdict: string;
  yc_likelihood: YCLikelihood;
  criteria: Record<CriterionKey, CriterionResult>;
  red_flags: string[];
  green_flags: string[];
  yc_interview_question: string;
}
```

---

Built for IntelliForge AI · intelliforge.tech  
Cursor-optimized scaffold — paste & ship 🚀
