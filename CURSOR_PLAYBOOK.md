# YCWorthy — Cursor Playbook

> AI-powered Y Combinator startup evaluator  
> Stack: Next.js 14 · TypeScript · Gemini 2.5 Flash (primary) · NVIDIA Nemotron Ultra 253B (fallback via NIM or OpenRouter) · Vercel

---

## Architecture at a Glance

```
User inputs URL + picks provider
        ↓
/api/analyze (Next.js API Route, Zod-validated)
        ↓
GeminiProvider (gemini-2.5-flash, JSON mode, thinkingBudget=0)   ← primary / default
        │
        │  on failure (429, 5xx, parse error…)
        ↓
NvidiaProvider → Nemotron Ultra 253B                              ← automatic fallback
   • prefers NIM transport       (NVIDIA_NIM_API_KEY)
   • falls back to OpenRouter    (OPENROUTER_API_KEY)
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
    │   ├── ModelToggle.tsx          ← Gemini / NVIDIA switcher
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
        ├── nvidia.ts                ← NvidiaProvider (NIM preferred, OpenRouter fallback → Nemotron Ultra 253B)
        └── gemini.ts                ← GeminiProvider (gemini-2.5-flash, native fetch, thinkingBudget=0)
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

### Google AI Studio (Gemini — primary / default)
1. Go to https://aistudio.google.com/apikey
2. Create a new API key
3. Paste into `.env.local` as `GEMINI_API_KEY=AIza...`
4. (Optional) Pin a model via `GEMINI_MODEL=gemini-2.5-flash`

> Default model: `gemini-2.5-flash`. Reliable JSON output via `responseMimeType: "application/json"`. Legacy `GOOGLE_AI_API_KEY` is still accepted for backward compat.

### NVIDIA Nemotron — automatic fallback (pick one transport)

The NVIDIA provider supports two OpenAI-compatible transports for the same
`nvidia/llama-3.1-nemotron-ultra-253b-v1` model. **NIM is preferred** because
it's a direct API with a generous free tier; OpenRouter is the secondary path.

#### Option A — NVIDIA NIM (preferred, ~1000 req/month free)
1. Go to https://build.nvidia.com/
2. Click any model → **Get API Key** → copy the `nvapi-...` token
3. Paste into `.env.local` as `NVIDIA_NIM_API_KEY=nvapi-...`
4. (Optional) Pin a model via `NVIDIA_NIM_MODEL=nvidia/llama-3.1-nemotron-ultra-253b-v1`

#### Option B — OpenRouter (secondary; used only if NIM key is absent)
1. Go to https://openrouter.ai/keys
2. Create a new API key (`sk-or-v1-...`)
3. Paste into `.env.local` as `OPENROUTER_API_KEY=sk-or-v1-...`
4. (Optional) Override via `OPENROUTER_NVIDIA_MODEL=...`

> The NVIDIA leg of the chain kicks in automatically if Gemini errors, 429s, or 503s.

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
#    GEMINI_API_KEY            = AIza...        (required, Gemini primary)
#    GEMINI_MODEL              = gemini-2.5-flash                              (optional override)
#    NVIDIA_NIM_API_KEY        = nvapi-...      (preferred NVIDIA fallback transport)
#    NVIDIA_NIM_MODEL          = nvidia/llama-3.1-nemotron-ultra-253b-v1     (optional override)
#    OPENROUTER_API_KEY        = sk-or-v1-...   (secondary NVIDIA fallback transport — used only if NIM absent)
#    OPENROUTER_NVIDIA_MODEL   = nvidia/llama-3.1-nemotron-ultra-253b-v1     (optional override)

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
/?url=https://example.com&provider=gemini
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
| Provider choice | Gemini only | Gemini + NVIDIA Nemotron |
| PDF export | ✗ | ✓ |
| Shareable permalink | ✓ | ✓ |
| Batch analysis (CSV) | ✗ | ✓ |
| History (saved) | ✗ | ✓ (50 saved) |

**Add auth:** Clerk (`npm install @clerk/nextjs`) — same setup as your other projects.

---

## How the Providers Differ

| Feature | Gemini 2.5 Flash (primary) | NVIDIA Nemotron Ultra 253B (fallback) |
|---------|----------------------------|----------------------------------------|
| Transport | Direct REST (`generateContent`) via native `fetch` | NIM (preferred) → OpenRouter (secondary), both OpenAI-compatible chat-completions via native `fetch` |
| JSON mode | `responseMimeType: application/json` + `thinkingBudget: 0` | `response_format: { type: "json_object" }` |
| Speed | ~3–6s | ~8–18s |
| Quality | Fast, strong instruction following | Top-tier 253B reasoning |
| Cost | Free tier 20 req/day on `2.5-flash`; otherwise ~$0.0005/analysis | NIM free tier ~1000 req/month; OpenRouter ~$0.003/analysis |

---

## Troubleshooting

### Gemini returns no text (finishReason MAX_TOKENS, no candidates)
2.5 Flash is a thinking model — without `thinkingConfig: { thinkingBudget: 0 }` it spends the entire output budget on internal reasoning. Already set in `src/lib/gemini.ts`; do not remove.

### Gemini 429 RESOURCE_EXHAUSTED
Free tier is 20 req/day for `gemini-2.5-flash`. Either upgrade billing at [aistudio.google.com](https://aistudio.google.com/apikey) or rely on the NVIDIA fallback.

### Gemini returns non-JSON
`responseMimeType: "application/json"` should enforce JSON. If it still fails, the `parseJSON()` fallback extracts the first `{...}` block.

### "No NVIDIA transport configured"
Set `NVIDIA_NIM_API_KEY` (preferred) or `OPENROUTER_API_KEY`. The provider auto-picks NIM when both are present.

### NIM 401 / OpenRouter 401
Rotate the corresponding key. If you remove the NIM key entirely the provider auto-falls-back to OpenRouter; the reverse also works.

### `maxDuration = 60` not working
Requires Vercel Pro/Enterprise. On Hobby, max is 10s — Nemotron 253B may timeout. Gemini default avoids this.

---

## Type Reference

```typescript
type Grade = "S" | "A" | "B" | "C" | "D" | "F";
type YCLikelihood = "Unlikely" | "Possible" | "Probable" | "Strong";
type AIProvider = "nvidia" | "gemini";

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
