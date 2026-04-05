---
name: ycworthy-deploy
description: Deploy YCWorthy to Vercel with environment variables, CI/CD, custom domains, and production configuration. Use when deploying, configuring environment variables, setting up CI/CD, or troubleshooting deployment issues.
---

# YCWorthy Deployment

## Architecture

```
┌──────────────────┐    API routes     ┌────────────────┐
│  Vercel (Next.js) │ ───────────────► │  Anthropic API  │
│  Frontend + API   │                  │  (Claude)       │
└──────────────────┘                  └────────────────┘
         │                              ┌────────────────┐
         └─────────────────────────────►│  Google AI API  │
                                       │  (Gemini)       │
                                       └────────────────┘
```

## Environment Variables

### Vercel Dashboard

| Variable | Value | Notes |
|----------|-------|-------|
| `ANTHROPIC_API_KEY` | `sk-ant-...` | Claude API — requires paid tier for web_search |
| `GOOGLE_AI_API_KEY` | `AIza...` | Gemini API |
| `NEXT_PUBLIC_APP_URL` | `https://your-domain.com` | Used for share links |

### Local Development

```bash
cp .env.local.example .env.local
# Fill in: ANTHROPIC_API_KEY, GOOGLE_AI_API_KEY, NEXT_PUBLIC_APP_URL
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
- **Max Duration**: 60s (requires Pro/Enterprise for Claude with web search)

### next.config.js

```javascript
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@anthropic-ai/sdk", "@google/generative-ai"],
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
| Claude timeout on Hobby | Vercel Hobby max is 10s; use Gemini or upgrade to Pro |
| API key errors | Verify env vars in Vercel Dashboard > Settings > Environment Variables |
| `maxDuration` ignored | Only works on Pro/Enterprise tier |
| CORS errors | API routes are server-side; ensure client calls `/api/analyze` not AI APIs directly |

## Key Rules

1. **Never commit `.env.local`** — secrets only in Vercel dashboard
2. **`NEXT_PUBLIC_` vars are build-time** — redeploy after changing
3. **Test builds locally** before pushing: `npm run build`
4. **Multi-stage Docker builds** for smaller images if self-hosting
5. **Pin Node 20** in CI and Docker
6. **Vercel auto-deploys** on push to `main` when connected
