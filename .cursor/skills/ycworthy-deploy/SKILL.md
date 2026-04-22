---
name: ycworthy-deploy
description: Deploy YCWorthy to Vercel with environment variables, CI/CD, custom domains, and production configuration. Use when deploying, configuring environment variables, setting up CI/CD, or troubleshooting deployment issues.
---

# YCWorthy Deployment

## Architecture

```
┌──────────────────┐    API route       ┌────────────────────────┐
│  Vercel (Next.js) │ ──── primary ───► │  Google AI Studio       │
│  Frontend + API   │                   │  (Gemini 2.5 Flash)     │
└──────────────────┘                   └────────────────────────┘
         │                              ┌────────────────────────┐
         │                              │  NVIDIA NIM (preferred) │
         └────── fallback ─────────────►│  Nemotron Ultra 253B    │
                                  ┌────►└────────────────────────┘
                                  │     ┌────────────────────────┐
                                  └─────│  OpenRouter (used only  │
                                  if NIM key absent — Nemotron)   │
                                        └────────────────────────┘
```

> Anthropic / Claude was removed entirely. Do not add `ANTHROPIC_API_KEY` back.

## Environment Variables

### Vercel Dashboard

| Variable | Value | Notes |
|----------|-------|-------|
| `GEMINI_API_KEY` | `AIza...` | **Required.** Gemini 2.5 Flash (primary / default). Legacy `GOOGLE_AI_API_KEY` still accepted as fallback. |
| `GEMINI_MODEL` | `gemini-2.5-flash` | _Optional._ Override Gemini model slug. |
| `NVIDIA_NIM_API_KEY` | `nvapi-...` | **Preferred** NVIDIA fallback transport. Direct NVIDIA inference API; ~1000 req/month free. |
| `NVIDIA_NIM_MODEL` | `nvidia/llama-3.1-nemotron-ultra-253b-v1` | _Optional._ Override NIM model slug. |
| `OPENROUTER_API_KEY` | `sk-or-v1-...` | _Optional._ Secondary NVIDIA fallback transport — used only if `NVIDIA_NIM_API_KEY` is absent. At least one of NIM / OpenRouter must be set. |
| `OPENROUTER_NVIDIA_MODEL` | `nvidia/llama-3.1-nemotron-ultra-253b-v1` | _Optional._ Override OpenRouter model slug. |
| `NEXT_PUBLIC_APP_URL` | `https://ycworthy.intelliforge.tech` | Used for share links + OpenRouter `HTTP-Referer`. |

### Local Development

```bash
cp .env.local.example .env.local
# Fill in: GEMINI_API_KEY, GEMINI_MODEL, NVIDIA_NIM_API_KEY (or OPENROUTER_API_KEY), NEXT_PUBLIC_APP_URL
```

### Sync via Vercel CLI

```bash
# Add (or update) the keys for production
vercel env add GEMINI_API_KEY production --value "AIza..." --yes
vercel env add GEMINI_MODEL production --value "gemini-2.5-flash" --yes
vercel env add NVIDIA_NIM_API_KEY production --value "nvapi-..." --yes
# Optional secondary transport / overrides
vercel env add OPENROUTER_API_KEY production --value "sk-or-v1-..." --yes

# Remove the legacy keys if they're still configured
vercel env rm ANTHROPIC_API_KEY production --yes
vercel env rm GOOGLE_AI_API_KEY production --yes
```

## Vercel Setup

### First-Time Deploy

```bash
npm i -g vercel
vercel login
vercel          # follow prompts
vercel --prod   # production deploy
```

Or connect GitHub repo for auto-deploys on push to `main`.

### Vercel Project Settings

- **Framework**: Next.js (auto-detected)
- **Node.js**: 20.x
- **Function Region**: `sin1` (Singapore) or `bom1` (Mumbai) for India latency
- **Max Duration**: 60s (requires Pro/Enterprise — NVIDIA Nemotron 253B inference can take 8–18s)

### next.config.js

```javascript
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@google/generative-ai"],
  },
};
```

## GitHub Actions CI

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run build
```

## Docker (Self-Hosted)

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --prefer-offline

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

Requires `output: "standalone"` in `next.config.js`.

## Custom Domain

1. Add domain in Vercel Dashboard > Settings > Domains
2. CNAME `www` → `cname.vercel-dns.com`
3. A record for apex → Vercel IP
4. SSL is automatic via Let's Encrypt

## Performance Checklist

- [ ] Build completes without TypeScript errors: `npm run build`
- [ ] ESLint passes: `npm run lint`
- [ ] Type check passes: `npm run type-check`
- [ ] Environment variables set in Vercel dashboard
- [ ] Function region set for target audience latency
- [ ] `maxDuration = 60` in analyze route (requires Pro tier)

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Build fails | Run `npm run build` locally first; check TypeScript errors |
| Gemini 429 / 503 | Free tier is 20 req/day for `gemini-2.5-flash`. Either upgrade billing at [aistudio.google.com](https://aistudio.google.com/apikey) or rely on NVIDIA fallback. |
| Gemini 401 / 403 | Rotate at [aistudio.google.com/apikey](https://aistudio.google.com/apikey); fallback to NVIDIA fires automatically |
| NVIDIA timeout on Hobby | Vercel Hobby max is 10s; Nemotron 253B routinely exceeds — upgrade to Pro (Gemini default avoids this) |
| NIM 401 | Rotate at [build.nvidia.com](https://build.nvidia.com/) → Get API Key. The provider auto-falls-back to OpenRouter if the NIM key is removed. |
| OpenRouter 401 / 402 | Key invalid or out of credits — rotate at [openrouter.ai/keys](https://openrouter.ai/keys); NIM transport (if configured) takes over. |
| API key errors | Verify env vars in Vercel Dashboard > Settings > Environment Variables |
| `maxDuration` ignored | Only works on Pro/Enterprise tier |
| CORS errors | API routes are server-side; ensure client calls `/api/analyze` not AI APIs directly |
| Stale `ANTHROPIC_API_KEY` in Vercel | Remove with `vercel env rm ANTHROPIC_API_KEY production` — Anthropic was retired |

## Key Rules

1. **Never commit `.env.local`** — secrets only in Vercel dashboard
2. **`NEXT_PUBLIC_` vars are build-time** — redeploy after changing
3. **Test builds locally** before pushing: `npm run build`
4. **Multi-stage Docker builds** for smaller images if self-hosting
5. **Pin Node 20** in CI and Docker
6. **Vercel auto-deploys** on push to `main` when connected
