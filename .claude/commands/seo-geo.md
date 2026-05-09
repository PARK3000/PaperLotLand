---
name: seo-geo
description: >
  Optimize content for AI Overviews (formerly SGE), ChatGPT web search,
  Perplexity, and other AI-powered search experiences. Generative Engine
  Optimization (GEO) analysis including brand mention signals, AI crawler
  accessibility, llms.txt compliance, passage-level citability scoring, and
  platform-specific optimization. Use when user says "AI Overviews", "SGE",
  "GEO", "AI search", "LLM optimization", "Perplexity", "AI citations",
  "ChatGPT search", or "AI visibility".
user-invokable: true
argument-hint: "[url]"
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
  - WebFetch
---

# AI Search / GEO Optimization (February 2026)

## Key Statistics

| Metric | Value | Source |
|--------|-------|--------|
| AI Overviews reach | 1.5 billion users/month across 200+ countries | Google |
| AI Overviews query coverage | 50%+ of all queries | Industry data |
| AI-referred sessions growth | 527% (Jan-May 2025) | SparkToro |
| ChatGPT weekly active users | 900 million | OpenAI |
| Perplexity monthly queries | 500+ million | Perplexity |

## Critical Insight: Brand Mentions > Backlinks

| Signal | Correlation with AI Citations |
|--------|------------------------------|
| YouTube mentions | ~0.737 (strongest) |
| Reddit mentions | High |
| Wikipedia presence | High |
| LinkedIn presence | Moderate |
| Domain Rating (backlinks) | ~0.266 (weak) |

"Only 11% of domains are cited by both ChatGPT and Google AI Overviews for the same query."

## GEO Analysis Criteria

### 1. Citability Score (25%)
- Optimal passage length: 134-167 words
- Direct answer in first 40-60 words of section
- "X is..." / "X refers to..." definition patterns
- Self-contained answer blocks
- Unique data points not found elsewhere

### 2. Structural Readability (20%)
- 92% of AI Overview citations come from top-10 ranking pages
- 47% originate from positions below five
- Question-based headings; short paragraphs (2-4 sentences); FAQ sections

### 3. Multi-Modal Content (15%)
- Content with multi-modal elements sees 156% higher selection rates

### 4. Authority & Brand Signals (20%)
- Author byline with credentials, publication/update dates
- Entity presence in Wikipedia, Wikidata
- Mentions on Reddit, YouTube, LinkedIn

### 5. Technical Accessibility (20%)
- AI crawlers do NOT execute JavaScript — SSR is critical
- robots.txt AI crawler allowlist
- llms.txt file presence

## AI Crawler Detection

| Crawler | Owner | Purpose |
|---------|-------|---------|
| GPTBot | OpenAI | ChatGPT web search |
| OAI-SearchBot | OpenAI | OpenAI search features |
| ChatGPT-User | OpenAI | ChatGPT browsing |
| ClaudeBot | Anthropic | Claude web features |
| PerplexityBot | Perplexity | Perplexity AI search |
| CCBot | Common Crawl | Training data (often blocked) |
| anthropic-ai | Anthropic | Claude training |
| Bytespider | ByteDance | TikTok/Douyin AI |
| cohere-ai | Cohere | Cohere models |

## llms.txt Standard

```
# Title of site
> Brief description

## Main sections
- [Page title](url): Description
- [Another page](url): Description

## Optional: Key facts
- Fact 1
- Fact 2
```

## Platform-Specific Optimization

| Platform | Key Citation Sources | Optimization Focus |
|----------|---------------------|-------------------|
| Google AI Overviews | Top-10 ranking pages (92%) | Traditional SEO + passage optimization |
| ChatGPT | Wikipedia (47.9%), Reddit (11.3%) | Entity presence, authoritative sources |
| Perplexity | Reddit (46.7%), Wikipedia | Community validation, discussions |
| Bing Copilot | Bing index, authoritative sites | Bing SEO, IndexNow |

## Output

Generate `GEO-ANALYSIS.md` with:
1. GEO Readiness Score: XX/100
2. Platform breakdown (Google AIO, ChatGPT, Perplexity scores)
3. AI Crawler Access Status
4. llms.txt Status
5. Brand Mention Analysis
6. Passage-Level Citability
7. Server-Side Rendering Check
8. Top 5 Highest-Impact Changes
9. Schema Recommendations
10. Content Reformatting Suggestions
