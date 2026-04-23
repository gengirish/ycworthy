# YCWorthy as an MCP Tool

YCWorthy ships a [Model Context Protocol](https://modelcontextprotocol.io) server that exposes the analysis pipeline as a tool any MCP-compatible client can call.

That means inside **Claude Desktop, Cursor, Codex, Continue, Cline, Windsurf, Zed**, or any other MCP host you can simply say:

> Run YCWorthy on stripe.com

…and the model will call the `analyze_startup` tool and get back a structured Y Combinator scorecard.

---

## What you get

One tool: **`analyze_startup`**

| Field | Description |
|-------|-------------|
| **Input** | `url` (required, http/https), `provider` (optional: `gemini` \| `nvidia` \| `grok`) |
| **Output (text)** | A Markdown report — partner verdict, criteria scorecard, green/red flags, YC interview question |
| **Output (structured)** | The full `AnalysisResult` JSON, with a `_meta` block containing `provider_used`, `fallback_used`, `duration_ms`, `request_id` |

The model sees both — so it can either quote the rendered Markdown verbatim or reach into the structured JSON to pull a specific score.

---

## Quick install

The MCP server is a single Node script (`scripts/mcp-server.mjs`). It hits the public YCWorthy API by default — **you don't need to clone the project or run a server locally** unless you want to.

### Cursor

Edit `~/.cursor/mcp.json` (create it if it doesn't exist):

```json
{
  "mcpServers": {
    "ycworthy": {
      "command": "npx",
      "args": ["-y", "github:gengirish/ycworthy", "ycworthy-mcp"]
    }
  }
}
```

Restart Cursor. The `analyze_startup` tool will appear in the MCP tools list.

### Claude Desktop (macOS)

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ycworthy": {
      "command": "npx",
      "args": ["-y", "github:gengirish/ycworthy", "ycworthy-mcp"]
    }
  }
}
```

### Claude Desktop (Windows)

Edit `%APPDATA%\Claude\claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ycworthy": {
      "command": "npx",
      "args": ["-y", "github:gengirish/ycworthy", "ycworthy-mcp"]
    }
  }
}
```

### Codex / Continue / Cline / Zed / Windsurf

Same shape — every MCP host accepts a `command + args` stdio launcher. Use the snippet above; consult your client's docs for the exact config file location.

---

## Local install (clone + run)

If you want to point the MCP server at your own self-hosted YCWorthy deployment, or you want to hack on the tool itself:

```bash
git clone https://github.com/gengirish/ycworthy.git
cd ycworthy
npm install

# Smoke test the MCP server (it will print "ready" to stderr)
node scripts/mcp-server.mjs
```

Then in your MCP config, use the absolute path:

```json
{
  "mcpServers": {
    "ycworthy": {
      "command": "node",
      "args": ["/absolute/path/to/ycworthy/scripts/mcp-server.mjs"],
      "env": {
        "YCWORTHY_API_URL": "https://your-self-hosted-instance.vercel.app"
      }
    }
  }
}
```

---

## Configuration

All configuration is via environment variables — no flags, no config file. Every variable is optional.

| Variable | Default | Description |
|----------|---------|-------------|
| `YCWORTHY_API_URL` | `https://ycworthy.intelliforge.tech` | Base URL of the YCWorthy API. Override to hit a self-hosted instance. |
| `YCWORTHY_PROVIDER` | `gemini` | Default AI provider when the LLM caller doesn't specify (`gemini`, `nvidia`, or `grok`). |
| `YCWORTHY_TIMEOUT` | `90000` | Per-request timeout in milliseconds. |

Pass them via the MCP host config:

```json
{
  "mcpServers": {
    "ycworthy": {
      "command": "node",
      "args": ["/path/to/scripts/mcp-server.mjs"],
      "env": {
        "YCWORTHY_PROVIDER": "nvidia",
        "YCWORTHY_TIMEOUT": "120000"
      }
    }
  }
}
```

---

## Example prompts

Once installed, try any of these in your MCP client:

- *"Use YCWorthy to evaluate stripe.com."*
- *"Run an honest YC partner analysis on linear.app and tell me the toughest interview question."*
- *"Score these three URLs against YC criteria: notion.so, figma.com, vercel.com — make me a comparison table."*
- *"What grade would YCWorthy give my landing page at https://example.com? Use the NVIDIA provider."*

The MCP host's model will call `analyze_startup` once per URL and present results inline.

---

## Protocol details

- **Transport:** stdio (JSON-RPC over stdin/stdout)
- **Protocol version:** `2024-11-05`
- **Server name:** `ycworthy`
- **Server version:** `1.0.0`
- **Capabilities:** `tools` (one tool, listChanged supported)
- **Logging:** All server logs go to **stderr** so they never corrupt the JSON-RPC stream on stdout. Tail with `2>&1 | grep '\[ycworthy-mcp\]'` if you need to debug.

---

## Troubleshooting

**"Tool failed: YCWorthy API timed out after 90000ms"**
The upstream LLM (Gemini or NVIDIA) is slow. Bump `YCWORTHY_TIMEOUT`.

**"Tool failed: YCWorthy API error [all_providers_failed]: ..."**
All configured providers failed (Gemini, NVIDIA, and/or Grok). Most often: Gemini quota exhausted + NVIDIA rate limit + no Grok key configured. The `provider_errors` map in the upstream response tells you which provider hit which limit.

**"Tool failed: Network error contacting ..."**
The MCP server can't reach the YCWorthy API. Check `YCWORTHY_API_URL` and your network. The default URL (`https://ycworthy.intelliforge.tech`) is the public production deployment.

**MCP host doesn't show the tool**
1. Confirm the server actually starts: `node scripts/mcp-server.mjs` should print `[ycworthy-mcp] ready ...` on stderr.
2. Check your config JSON is valid (commas matter).
3. Restart the MCP host fully — most hosts only re-read config on startup.

---

## See also

- [`docs/API.md`](./API.md) — REST API reference (the MCP server wraps this).
- [`docs/AUTOMATION.md`](./AUTOMATION.md) — Other ways to automate YCWorthy (curl, Python, GitHub Actions).
- [Model Context Protocol spec](https://modelcontextprotocol.io)
