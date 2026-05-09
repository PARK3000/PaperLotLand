# Ahrefs API Setup Guide

Two ways to use Ahrefs from this project:
1. **MCP server** (`@ahrefs/mcp`) — preferred for interactive Claude work; tools show up as `mcp__ahrefs__*`.
2. **REST API direct** (v3) — fallback for scripts.

Both use the **same API key**.

## TL;DR — current working credentials

The key lives in two places (must stay in sync):

| Location | Purpose |
|---|---|
| `.env.local` → `AHREFS_API_KEY=...` | Used by Node scripts and any future server code |
| `~/.claude.json` → `mcpServers.ahrefs.env.API_KEY` | Used by the `@ahrefs/mcp` Claude Code MCP |

Generate / regenerate at: https://app.ahrefs.com/api/access-tokens

## TL;DR — quick REST API smoke test

```bash
AHREFS_KEY=$(grep '^AHREFS_API_KEY=' .env.local | cut -d= -f2- | tr -d '\r\n')
curl -s -H "Authorization: Bearer $AHREFS_KEY" \
  "https://api.ahrefs.com/v3/site-explorer/domain-rating?target=webuyanyvegashouse.com&date=$(date -u +%Y-%m-%d)"
```

Expected output:
```json
{ "domain_rating": { "domain_rating": 18.0, "ahrefs_rank": 9127582 } }
```

### Gotcha: only Bearer auth works

You will see two patterns in older Ahrefs docs / scripts:

```bash
# ✅ Works on v3
curl -H "Authorization: Bearer $TOKEN" "https://api.ahrefs.com/v3/..."

# ❌ Returns 403 Forbidden on v3 (legacy v2-style auth)
curl "https://api.ahrefs.com/v3/...?token=$TOKEN"
```

If you get 403 on every endpoint with what you believe is a valid key, you're probably using `?token=` instead of the Bearer header. Switch and try again.

### Gotcha: 401 vs 403

| Code | Meaning | Fix |
|---|---|---|
| **401 Unauthorized** | Key is invalid / revoked / expired | Regenerate at [api/access-tokens](https://app.ahrefs.com/api/access-tokens) and update both `.env.local` AND `~/.claude.json` |
| **403 Forbidden** | Key is valid but auth shape is wrong, OR endpoint not on your plan | Check Bearer header (above). If it persists, your plan may not include this API surface. |

## Two known key formats

Ahrefs has issued two key shapes for this project. Both work against v3 REST when sent via the Bearer header:

| Length | Format | Notes |
|---|---|---|
| 197 chars, `<prefix>.<base64>.<suffix>` | Older v3 long-form | Older keys may have been rotated — if 401, regenerate. |
| 40 chars, alphanumeric | MCP-shaped key (also works on v3 REST) | Newer format, used by `@ahrefs/mcp`. |

If you see 401, the most likely cause is a rotated key. Regenerate at the link above and update `.env.local` and `~/.claude.json` together.

## Method 1: MCP server

Already configured in `~/.claude.json` under the project entry. To verify:

```bash
claude mcp list 2>&1 | grep -i ahrefs
```

If missing, add it:

```bash
claude mcp add ahrefs \
  -e API_KEY="$(grep '^AHREFS_API_KEY=' .env.local | cut -d= -f2-)" \
  -- npx -y @ahrefs/mcp
```

Then restart Claude Code.

## Method 2: REST API direct

```bash
AHREFS_KEY=$(grep '^AHREFS_API_KEY=' .env.local | cut -d= -f2- | tr -d '\r\n')

# Domain rating
curl -s -H "Authorization: Bearer $AHREFS_KEY" \
  "https://api.ahrefs.com/v3/site-explorer/domain-rating?target=webuyanyvegashouse.com&date=$(date -u +%Y-%m-%d)"

# Backlink summary
curl -s -H "Authorization: Bearer $AHREFS_KEY" \
  "https://api.ahrefs.com/v3/site-explorer/backlinks-stats?target=webuyanyvegashouse.com&mode=subdomains&date=$(date -u +%Y-%m-%d)"

# Top organic keywords
curl -s -H "Authorization: Bearer $AHREFS_KEY" \
  "https://api.ahrefs.com/v3/site-explorer/organic-keywords?target=webuyanyvegashouse.com&country=us&date=$(date -u +%Y-%m-%d)&limit=100&order_by=traffic:desc"

# Referring domains
curl -s -H "Authorization: Bearer $AHREFS_KEY" \
  "https://api.ahrefs.com/v3/site-explorer/refdomains?target=webuyanyvegashouse.com&mode=subdomains&date_from=$(date -u -v-90d +%Y-%m-%d)"
```

Useful endpoints:
- `site-explorer/domain-rating` — DR + Ahrefs rank
- `site-explorer/backlinks-stats` — total backlinks, refdomains, dofollow ratio
- `site-explorer/organic-keywords` — every keyword we rank for
- `site-explorer/refdomains` — referring-domain detail (for link decay analysis)
- `site-explorer/anchors` — anchor-text distribution
- `site-explorer/pages` — top pages by traffic
- `keywords-explorer/overview` — KD, SV, intent for a list of keywords
- `site-audit/issues` — health-check style issues (only available on plans with Site Audit)

## Diagnosing a 401 in 30 seconds

1. **Right key shape?** v3 accepts both the 40-char and 197-char formats. Verify by hitting the smoke test above.
2. **Right env file?** Key is canonical in `.env.local`. If a script reads from `.env`, you may need to copy it.
3. **Right header?** Use `Authorization: Bearer` (see Bearer-only gotcha above).
4. **Account / plan?** Check at https://app.ahrefs.com/account-settings/api — confirm the key is listed and the plan includes API access.
