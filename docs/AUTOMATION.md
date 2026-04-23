# YCWorthy Automation Cookbook

YCWorthy is designed to be **boring to integrate** — one HTTP call, one stable JSON shape, no auth, full CORS, OpenAPI spec. Drop it into anything.

This doc is a copy/pasteable recipe collection. For full reference see [`docs/API.md`](./API.md).

---

## CLI (zero install)

```bash
# One-shot from anywhere
npx -y github:gengirish/ycworthy ycworthy stripe.com

# Pipe through jq for scripting
npx -y github:gengirish/ycworthy ycworthy linear.app --json | jq -r '.data.overall_grade'

# Via the local clone
git clone https://github.com/gengirish/ycworthy && cd ycworthy && npm install
node scripts/cli.mjs notion.so --provider nvidia
npm run analyze -- figma.com
```

Flags: `--provider gemini|nvidia` · `--json` · `--api <url>` · `--timeout <ms>`

---

## curl

```bash
# POST (recommended for production scripts)
curl -sS https://ycworthy.intelliforge.tech/api/analyze \
  -H "content-type: application/json" \
  -d '{"url":"https://stripe.com","provider":"gemini"}' | jq .

# GET (one-liner, browser-friendly)
curl -sS "https://ycworthy.intelliforge.tech/api/analyze?url=https://stripe.com" | jq '.data.overall_grade'

# Just check the headers (request ID, provider, fallback flag)
curl -sS -D - -o /dev/null \
  "https://ycworthy.intelliforge.tech/api/analyze?url=https://stripe.com" \
  | grep -i '^x-'

# Health check
curl -sS https://ycworthy.intelliforge.tech/api/health | jq .

# Grab the OpenAPI spec
curl -sS https://ycworthy.intelliforge.tech/api/openapi.json -o ycworthy.openapi.json
```

---

## Python

```python
import httpx

def analyze(url: str, provider: str = "gemini") -> dict:
    r = httpx.post(
        "https://ycworthy.intelliforge.tech/api/analyze",
        json={"url": url, "provider": provider},
        timeout=120.0,
    )
    r.raise_for_status()
    return r.json()

result = analyze("https://stripe.com")
print(f"{result['data']['company']}: grade {result['data']['overall_grade']}")
print(f"  YC likelihood: {result['data']['yc_likelihood']}")
print(f"  Provider used: {result['provider']} (req {result['meta']['request_id']})")
```

### Python — batch with concurrency

```python
import asyncio, httpx

URLS = ["stripe.com", "airbnb.com", "doordash.com", "instacart.com"]

async def analyze_one(client: httpx.AsyncClient, url: str):
    r = await client.post(
        "https://ycworthy.intelliforge.tech/api/analyze",
        json={"url": f"https://{url}"},
    )
    r.raise_for_status()
    return r.json()["data"]

async def main():
    async with httpx.AsyncClient(timeout=120.0) as client:
        # max 3 concurrent requests so we don't spam upstream rate limits
        sem = asyncio.Semaphore(3)
        async def gated(u):
            async with sem:
                return await analyze_one(client, u)
        results = await asyncio.gather(*(gated(u) for u in URLS))

    for r in sorted(results, key=lambda x: x["overall_score"], reverse=True):
        print(f"{r['overall_grade']}  {r['overall_score']:>3}  {r['company']}")

asyncio.run(main())
```

---

## Node / TypeScript

```ts
const r = await fetch("https://ycworthy.intelliforge.tech/api/analyze", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ url: "https://stripe.com", provider: "gemini" }),
});

if (!r.ok) {
  const err = await r.json().catch(() => ({}));
  throw new Error(err.error ?? `HTTP ${r.status}`);
}

const json = await r.json();
console.log(json.data.overall_grade, json.data.company);
```

### Generate a typed client from the OpenAPI spec

```bash
npm i -D openapi-typescript
npx openapi-typescript https://ycworthy.intelliforge.tech/api/openapi.json \
  -o src/types/ycworthy.ts
```

Then use it:

```ts
import type { paths } from "./types/ycworthy";
type AnalyzeOk = paths["/api/analyze"]["post"]["responses"]["200"]["content"]["application/json"];
```

---

## Browser (no library)

```html
<script type="module">
  const res = await fetch(
    "https://ycworthy.intelliforge.tech/api/analyze",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: "https://stripe.com" }),
    }
  );
  const { data, provider, meta } = await res.json();
  document.body.innerText = `${data.company}: ${data.overall_grade} (${provider}, req ${meta.request_id})`;
</script>
```

CORS is wide open (`*`) — runs from `localhost`, `file://`, any production domain.

---

## GitHub Action — score every PR's landing page

Create `.github/workflows/ycworthy.yml`:

```yaml
name: YCWorthy score check

on:
  pull_request:
    paths:
      - "marketing/**"

jobs:
  score:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run YCWorthy
        id: score
        run: |
          RESULT=$(curl -sS https://ycworthy.intelliforge.tech/api/analyze \
            -H "content-type: application/json" \
            -d '{"url":"https://staging.example.com"}')
          GRADE=$(echo "$RESULT" | jq -r '.data.overall_grade')
          SCORE=$(echo "$RESULT" | jq -r '.data.overall_score')
          VERDICT=$(echo "$RESULT" | jq -r '.data.verdict')
          {
            echo "grade=$GRADE"
            echo "score=$SCORE"
            echo "verdict<<EOF"
            echo "$VERDICT"
            echo "EOF"
          } >> "$GITHUB_OUTPUT"

      - name: Comment on PR
        uses: marocchino/sticky-pull-request-comment@v2
        with:
          message: |
            ## YCWorthy verdict: **${{ steps.score.outputs.grade }}** (${{ steps.score.outputs.score }}/100)

            > ${{ steps.score.outputs.verdict }}

      - name: Fail if grade < B
        run: |
          GRADE="${{ steps.score.outputs.grade }}"
          case "$GRADE" in
            S|A|B) echo "Grade $GRADE is acceptable" ;;
            *)     echo "::error::Grade $GRADE is below threshold (B)"; exit 1 ;;
          esac
```

---

## n8n / Make / Zapier

YCWorthy is a generic HTTP endpoint, so it slots into any low-code tool:

| Field | Value |
|-------|-------|
| Method | `POST` |
| URL | `https://ycworthy.intelliforge.tech/api/analyze` |
| Content-Type | `application/json` |
| Body | `{ "url": "{{ $json.startup_url }}", "provider": "gemini" }` |
| Output path | `data.overall_grade`, `data.overall_score`, `data.verdict`, etc. |

For Make / Zapier, "Custom Request" → POST → JSON body. No auth needed.

---

## Custom GPT (OpenAI Actions)

In the GPT builder → Actions → "Import from URL", paste:

```
https://ycworthy.intelliforge.tech/api/openapi.json
```

The action will auto-import `analyzeStartupPost` and `analyzeStartupGet`. No auth required. The GPT can now call YCWorthy directly when a user asks it to evaluate a startup.

---

## Slack bot (Bolt for JavaScript)

```ts
import { App } from "@slack/bolt";

const app = new App({ token: process.env.SLACK_BOT_TOKEN, signingSecret: process.env.SLACK_SIGNING_SECRET });

app.command("/ycworthy", async ({ command, ack, respond }) => {
  await ack();
  const url = command.text.trim();
  await respond({ text: `Analyzing ${url}...`, response_type: "ephemeral" });

  const r = await fetch("https://ycworthy.intelliforge.tech/api/analyze", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ url }),
  });
  const { data } = await r.json();

  await respond({
    response_type: "in_channel",
    blocks: [
      { type: "header", text: { type: "plain_text", text: `${data.company}: Grade ${data.overall_grade} (${data.overall_score}/100)` } },
      { type: "section", text: { type: "mrkdwn", text: `*Verdict:* ${data.verdict}` } },
      { type: "section", text: { type: "mrkdwn", text: `*YC partner would ask:* _"${data.yc_interview_question}"_` } },
    ],
  });
});

await app.start(3000);
```

---

## Observability tip — passing your own request ID

Send `X-Request-Id: <your-id>` and the API will echo it back in the response and log it. Useful for tying YCWorthy logs to your own trace IDs.

```bash
TRACE_ID=$(uuidgen)
curl -sS https://ycworthy.intelliforge.tech/api/analyze \
  -H "content-type: application/json" \
  -H "x-request-id: $TRACE_ID" \
  -d '{"url":"https://stripe.com"}' \
  | jq '.meta.request_id'   # → same TRACE_ID
```

---

## See also

- [`docs/API.md`](./API.md) — Full REST reference.
- [`docs/MCP.md`](./MCP.md) — Use as an MCP tool inside Claude / Cursor / Codex.
- [`README.md`](../README.md) — Project overview.
