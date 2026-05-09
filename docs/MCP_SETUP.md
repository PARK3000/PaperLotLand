# MCP Server Setup Guide

This guide walks through setting up the required MCP servers for the website cloning workflow.

## Prerequisites

- Node.js 18+ installed
- Claude Code CLI installed
- API keys ready (see below)

## Required API Keys

### 1. FireCrawl API Key
- Sign up at: https://www.firecrawl.dev
- Navigate to: https://www.firecrawl.dev/app/api-keys
- Create a new API key
- Free tier includes 500 credits/month

### 2. DataForSEO Credentials
- Sign up at: https://dataforseo.com
- Get login and password from dashboard
- Free trial available with $1 credit

## Installation

### Step 1: Add FireCrawl MCP Server

```bash
claude mcp add firecrawl -e FIRECRAWL_API_KEY=your-api-key-here -- npx -y firecrawl-mcp
```

### Step 2: Add DataForSEO MCP Server

```bash
claude mcp add dataforseo \
  -e DATAFORSEO_LOGIN=your-login \
  -e DATAFORSEO_PASSWORD=your-password \
  -- npx -y dataforseo-mcp-server
```

### Step 3: Verify Installation

```bash
claude mcp list
```

You should see both `firecrawl` and `dataforseo` listed.

## Alternative: Using .env File

Instead of passing credentials in the command, you can:

1. Copy `.env.example` to `.env.local`
2. Fill in your credentials
3. Run the MCP add commands with env vars:

```bash
source .env.local

claude mcp add firecrawl \
  -e FIRECRAWL_API_KEY=$FIRECRAWL_API_KEY \
  -- npx -y firecrawl-mcp

claude mcp add dataforseo \
  -e DATAFORSEO_LOGIN=$DATAFORSEO_LOGIN \
  -e DATAFORSEO_PASSWORD=$DATAFORSEO_PASSWORD \
  -- npx -y dataforseo-mcp-server
```

## Available Tools After Setup

### FireCrawl Tools
- `firecrawl_scrape` - Scrape a single URL
- `firecrawl_crawl` - Crawl entire website
- `firecrawl_map` - Get sitemap of URLs
- `firecrawl_extract` - Extract structured data

### DataForSEO Tools
- Keyword research (volume, difficulty, CPC)
- SERP analysis
- Competitor keyword analysis
- Backlink data
- Domain analytics

## Testing the Setup

Once configured, test by asking Claude:

```
Scrape the homepage of https://example.com using FireCrawl
```

or

```
Get keyword suggestions for "web design services" using DataForSEO
```

## Troubleshooting

### MCP server not responding
- Check API key is correct
- Ensure npx can access the package
- Try reinstalling: `claude mcp remove [name]` then add again

### Rate limits
- FireCrawl: 500 credits/month on free tier
- DataForSEO: Check your plan limits in dashboard

### Connection issues
- Verify internet connection
- Check if API service is operational
