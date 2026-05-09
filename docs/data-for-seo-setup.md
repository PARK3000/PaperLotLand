# DataForSEO Setup Guide

Two ways to use DataForSEO from this project:
1. **MCP server** (preferred for interactive Claude work — keyword research tools etc.)
2. **REST API direct** (fallback for scripts / when MCP isn't loaded)

## TL;DR — credentials in this project

Credentials live in **`.env`** (NOT `.env.local`):

```bash
DATAFORSEO_LOGIN=jason@<redacted>
DATAFORSEO_PASSWORD=<redacted>
```

If you only check `.env.local`, you'll think we don't have credentials — we do. Always check both.

## TL;DR — quick REST API smoke test

```bash
# Strip BOTH whitespace AND surrounding double quotes — values in .env are quoted
DFS_LOGIN=$(grep '^DATAFORSEO_LOGIN=' .env | cut -d= -f2- | tr -d '"\r\n')
DFS_PASS=$(grep '^DATAFORSEO_PASSWORD=' .env | cut -d= -f2- | tr -d '"\r\n')
AUTH=$(printf "%s:%s" "$DFS_LOGIN" "$DFS_PASS" | base64)
curl -s -H "Authorization: Basic $AUTH" \
  "https://api.dataforseo.com/v3/appendix/user_data" | head -20
```

Expected: `"status_code": 20000`, `"status_message": "Ok."`

### Gotcha #1: `.env` values are wrapped in literal double quotes

Look at `.env` — credentials are stored as `DATAFORSEO_LOGIN="jason@..."` with surrounding quotes. A naïve `cut -d= -f2-` will leave those quotes in your variable. The first sign is `40100 Unauthorized`. Verify with `echo -n "$DFS_LOGIN" | xxd` — if you see `22` bytes (ASCII `"`) at the start and end, you forgot to strip them. Use `tr -d '"\r\n'`.

### Gotcha #2: `curl -u user:pass` can fail when the password contains shell-special characters

Using `curl -u "$LOGIN:$PASS"` will sometimes return `40100 Unauthorized` even when credentials are correct, because the shell mangles the colon-separated string. **Always base64-encode the credentials yourself** and pass them via `-H "Authorization: Basic $AUTH"` as shown above. This is the single most common cause of "DataForSEO is broken" in this project.

## Prerequisites

1. **DataForSEO Account**: Sign up at [https://dataforseo.com](https://dataforseo.com)
2. **API Credentials**: Get your login email and password from the DataForSEO dashboard
3. **Claude Code**: Installed and working

## Connection Test Results (Verified Working)

The following API calls were tested and confirmed working:

```json
// Bulk Keyword Difficulty - Status: 20000 (OK)
{
  "keywords": ["seo tools", "keyword research"],
  "results": [
    { "keyword": "keyword research", "keyword_difficulty": 84 },
    { "keyword": "seo tools", "keyword_difficulty": 68 }
  ]
}

// Keyword Suggestions - Status: 20000 (OK)
{
  "keyword": "website design",
  "results": [
    { "keyword": "website about design", "search_volume": 74000, "cpc": 32.25 }
  ]
}
```

---

## Setup Method 1: HTTP-Based MCP (Recommended)

This is the simplest and most reliable method. DataForSEO provides a hosted MCP server.

### Step 1: Generate Base64 Credentials

Your credentials need to be Base64 encoded in the format `login:password`:

```bash
# Replace with your actual credentials
echo -n "your-email@example.com:your-password" | base64
```

This outputs something like: `eW91ci1lbWFpbEBleGFtcGxlLmNvbTp5b3VyLXBhc3N3b3Jk`

### Step 2: Add to Claude Code Settings

There are two ways to configure the HTTP-based MCP server:

#### Option A: Via `claude mcp add` Command

```bash
# Navigate to your project directory first
cd /path/to/your/project

# Add the MCP server (project-specific)
claude mcp add dataforseo --transport http \
  --url "https://mcp.dataforseo.com/http" \
  --header "Authorization: Basic YOUR_BASE64_CREDENTIALS"
```

#### Option B: Direct JSON Configuration

Add to your `~/.claude.json` file under the project's `mcpServers` section:

```json
{
  "projects": {
    "/path/to/your/project": {
      "mcpServers": {
        "dataforseo": {
          "type": "http",
          "url": "https://mcp.dataforseo.com/http",
          "headers": {
            "Authorization": "Basic YOUR_BASE64_CREDENTIALS_HERE"
          }
        }
      }
    }
  }
}
```

### Step 3: Restart Claude Code

After adding the configuration, restart Claude Code for the changes to take effect:

```bash
# Exit and restart claude
exit
claude
```

---

## Setup Method 2: NPX-Based MCP (Alternative)

This method runs the MCP server locally via npx.

### Step 1: Set Environment Variables

Add to your `.env` or `.env.local` file:

```bash
DATAFORSEO_LOGIN="your-email@example.com"
DATAFORSEO_PASSWORD="your-password"
```

### Step 2: Add MCP Server

```bash
cd /path/to/your/project

claude mcp add dataforseo \
  -e DATAFORSEO_LOGIN=$DATAFORSEO_LOGIN \
  -e DATAFORSEO_PASSWORD=$DATAFORSEO_PASSWORD \
  -- npx -y dataforseo-mcp-server
```

### Step 3: Restart Claude Code

```bash
exit
claude
```

---

## Verifying the Setup

### Method 1: Check Available Tools

After restarting Claude Code, ask:

> "What DataForSEO tools are available?"

You should see tools like:
- `mcp__dataforseo__dataforseo_labs_bulk_keyword_difficulty`
- `mcp__dataforseo__dataforseo_labs_google_keyword_suggestions`
- `mcp__dataforseo__dataforseo_labs_google_ranked_keywords`
- `mcp__dataforseo__serp_organic_live_advanced`
- And many more...

### Method 2: Test API Call

Ask Claude to run a simple test:

> "Test the DataForSEO connection by getting keyword difficulty for 'seo tools'"

A successful response will show:
```json
{
  "status_code": 20000,
  "status_message": "Ok."
}
```

---

## Troubleshooting

### Issue: MCP tools not appearing

**Symptoms**: After adding the MCP server, DataForSEO tools are not available.

**Solutions**:
1. **Restart Claude Code** - Changes require a restart
2. **Check credentials** - Verify Base64 encoding is correct
3. **Verify project path** - Ensure you're in the correct project directory
4. **Check JSON syntax** - If editing manually, validate JSON format

### Issue: Authentication errors (status_code: 40101)

**Symptoms**: API calls return authentication errors.

**Solutions**:
1. Verify your DataForSEO credentials are correct
2. Regenerate Base64 credentials:
   ```bash
   echo -n "email:password" | base64
   ```
3. Ensure no extra whitespace in credentials

### Issue: NPX method not working

**Symptoms**: The `npx -y dataforseo-mcp-server` command fails.

**Solutions**:
1. **Use HTTP method instead** - More reliable, no local dependencies
2. Check Node.js is installed: `node --version`
3. Clear npm cache: `npm cache clean --force`

### Issue: Tools available but API calls fail

**Symptoms**: Tools show up but return errors when used.

**Solutions**:
1. Check DataForSEO account has API credits
2. Verify account is active at [https://app.dataforseo.com](https://app.dataforseo.com)
3. Check rate limits haven't been exceeded

---

## Configuration Reference

### Full `~/.claude.json` Example

```json
{
  "projects": {
    "/Users/yourname/your-project": {
      "allowedTools": [],
      "mcpContextUris": [],
      "mcpServers": {
        "dataforseo": {
          "type": "http",
          "url": "https://mcp.dataforseo.com/http",
          "headers": {
            "Authorization": "Basic BASE64_CREDENTIALS"
          }
        }
      },
      "enabledMcpjsonServers": [],
      "disabledMcpjsonServers": [],
      "hasTrustDialogAccepted": true
    }
  }
}
```

### Available DataForSEO MCP Tools

| Category | Tools |
|----------|-------|
| **Keyword Research** | `keyword_suggestions`, `related_keywords`, `keyword_ideas`, `bulk_keyword_difficulty`, `keyword_overview` |
| **Domain Analysis** | `ranked_keywords`, `domain_rank_overview`, `competitors_domain`, `keywords_for_site` |
| **SERP Analysis** | `serp_organic_live_advanced`, `serp_competitors`, `historical_serp` |
| **Backlinks** | `backlinks_summary`, `backlinks_backlinks`, `referring_domains`, `anchors` |
| **Content Analysis** | `content_analysis_search`, `content_analysis_summary` |
| **On-Page** | `on_page_content_parsing`, `on_page_lighthouse` |
| **Trends** | `kw_data_dfs_trends_explore`, `kw_data_dfs_trends_demography` |

---

## Quick Setup Checklist

- [ ] Create DataForSEO account at dataforseo.com
- [ ] Get login email and password
- [ ] Generate Base64 credentials: `echo -n "email:password" | base64`
- [ ] Navigate to project directory: `cd /path/to/project`
- [ ] Add MCP server (choose one method):
  - [ ] HTTP method: `claude mcp add dataforseo --transport http --url "https://mcp.dataforseo.com/http" --header "Authorization: Basic CREDENTIALS"`
  - [ ] NPX method: `claude mcp add dataforseo -e DATAFORSEO_LOGIN=email -e DATAFORSEO_PASSWORD=pass -- npx -y dataforseo-mcp-server`
- [ ] Restart Claude Code
- [ ] Verify tools are available
- [ ] Test with a simple API call

---

## Example: Working Configuration

This is the exact configuration used in this project (credentials redacted):

```json
{
  "dataforseo": {
    "type": "http",
    "url": "https://mcp.dataforseo.com/http",
    "headers": {
      "Authorization": "Basic [BASE64_ENCODED_CREDENTIALS]"
    }
  }
}
```

This HTTP-based configuration is confirmed working as of January 2026.

---

## Method 3: REST API direct (no MCP)

When the MCP server isn't loaded (e.g. during a one-off script run, or a fresh checkout where Claude hasn't restarted), call the REST API directly:

```bash
DFS_LOGIN=$(grep '^DATAFORSEO_LOGIN=' .env | cut -d= -f2- | tr -d '"\r\n')
DFS_PASS=$(grep '^DATAFORSEO_PASSWORD=' .env | cut -d= -f2- | tr -d '"\r\n')
AUTH=$(printf "%s:%s" "$DFS_LOGIN" "$DFS_PASS" | base64)

# Domain rank overview
curl -s -H "Authorization: Basic $AUTH" -H "Content-Type: application/json" \
  -X POST "https://api.dataforseo.com/v3/dataforseo_labs/google/domain_rank_overview/live" \
  -d '[{"target":"webuyanyvegashouse.com","location_code":2840,"language_code":"en"}]'

# Ranked keywords
curl -s -H "Authorization: Basic $AUTH" -H "Content-Type: application/json" \
  -X POST "https://api.dataforseo.com/v3/dataforseo_labs/google/ranked_keywords/live" \
  -d '[{"target":"webuyanyvegashouse.com","location_code":2840,"language_code":"en","limit":100}]'
```

Useful endpoints:
- `/v3/dataforseo_labs/google/domain_rank_overview/live` — DR, organic traffic, organic keywords
- `/v3/dataforseo_labs/google/ranked_keywords/live` — every keyword the domain ranks for
- `/v3/dataforseo_labs/google/competitors_domain/live` — top competing domains
- `/v3/dataforseo_labs/google/keyword_suggestions/live` — keyword expansion
- `/v3/serp/google/organic/live/advanced` — live SERP for a single keyword
- `/v3/on_page/lighthouse/live/json` — Lighthouse score for a single URL

Location code **2840** = United States. Language code **en** = English.

---

## Diagnosing a 40100 Unauthorized in 30 seconds

1. **Are the credentials in `.env`?** Run `grep -E '^DATAFORSEO_(LOGIN|PASSWORD)=' .env`. Both should print one line each. If they're in `.env.local` instead — works there too, but check both files.
2. **Did the password get truncated?** Run `awk -F= '/^DATAFORSEO_PASSWORD=/ {print "len:",length($0)-length($1)-1}' .env`. Compare to known-good length (currently 18).
3. **Are you using `curl -u`?** Switch to base64 + `Authorization: Basic` header (see TL;DR above). This is the #1 cause of false-positive auth failures.
4. **Is the account suspended / out of credits?** Hit `https://api.dataforseo.com/v3/appendix/user_data` — if money/limits look wrong, log into [app.dataforseo.com](https://app.dataforseo.com).
