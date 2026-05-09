# AI Crawler Access + SSR Audit (2026-05-06)

Companion to `2026-05-06-ai-citations-growth-plan.md`. Captures the baseline before
the citation-growth content build.

## 1. robots.txt — UPDATED

`public/robots.txt` previously allowed: `GPTBot`, `ChatGPT-User`, `Claude-Web`, `Anthropic-AI`.

**Added explicit allows:**

| Crawler | Owner | Why it matters |
|---------|-------|----------------|
| `OAI-SearchBot` | OpenAI | Powers ChatGPT search citations (separate from GPTBot training crawler) |
| `ClaudeBot` | Anthropic | Current web crawler — `Claude-Web` is older |
| `anthropic-ai` | Anthropic | Training crawler, lowercase form |
| `PerplexityBot` | Perplexity | Required for Perplexity inclusion |
| `Perplexity-User` | Perplexity | On-demand fetch when a user cites |
| `Google-Extended` | Google | Controls Gemini / AI Overviews opt-in independently of Googlebot |
| `Applebot-Extended` | Apple | Apple Intelligence |
| `CCBot` | Common Crawl | Training data — feeds many models |
| `cohere-ai` | Cohere | Cohere model training |
| `Bytespider` | ByteDance | TikTok / Doubao AI |

Ships on next deploy.

## 2. SSR Verification — PASS

Tested page types with `GPTBot`, `ClaudeBot`, `PerplexityBot` user-agents on production.

| Page type | Sample URL | HTML bytes | H1 SSR | Schema types | Notes |
|-----------|-----------|------------|--------|--------------|-------|
| Homepage | `/` | 283 KB | ✓ | 20 incl. `RealEstateAgent`, `FAQPage`, `VideoObject`, `Review` | Fully cited-ready |
| Situation | `/stop-a-foreclosure/` | 121 KB | ✓ | 23 incl. `HowTo`, `FAQPage`, `Person`, `AggregateRating` | FAQ answers (200-300 chars) embedded in JSON-LD |
| Location | `/we-buy-houses-summerlin/` | 127 KB | ✓ | 21 incl. `RealEstateAgent`, `FAQPage`, `BreadcrumbList` | |
| Service hub | `/sell-my-house-fast/` | 99 KB | ✓ | 18 incl. `Service`, `FAQPage` | |
| FAQ | `/frequently-asked-questions/` | 115 KB | ✓ | `FAQPage` | |
| Process | `/how-it-works/` | 146 KB | ✓ | `HowTo`, `FAQPage` | |
| Blog post | `/blog/3-strategies-for-selling-your-house-fast-in-las-vegas/` | 95 KB | ✓ | `BlogPosting`, `BreadcrumbList`, `Person` | |
| Blog hub | `/blog/` | 122 KB | ✓ | 20 schema types | |

**Key observations:**
- All page types render H1, body content, FAQ Q&A, and schema in the initial HTML
  with no JavaScript execution required.
- We use `RealEstateAgent` (a `LocalBusiness` subtype) — correct and stronger than
  generic `LocalBusiness`.
- FAQ acceptedAnswers are 200-300 chars — within citable passage length (134-167
  word band).
- Org schema includes 12+ `sameAs` profiles (Google KG, BBB, Facebook, YouTube,
  Yelp, Pinterest, Chamber, etc.) — strong entity signal for ChatGPT/Perplexity.

## 3. Minor improvements identified (not blocking citations)

1. **FAQ semantic markup.** Questions appear in body text but not as `<h3>`. AI
   crawlers extract more reliably from heading-tagged questions. Convert FAQ
   item titles to `<h3>` (or `<h2>` inside FAQ section). Affects all pages with
   FAQ blocks.
2. **Article schema on situation pages.** Currently use `HowTo` (good) but
   adding `Article` with `author` + `datePublished` + `dateModified` strengthens
   E-E-A-T signal for Claude / AIO. Low effort.
3. **Visible "Last updated" dates.** Not rendered on situation/location pages.
   Required by Phase 1 of the growth plan.
4. **Author bylines.** `Person` schema is emitted but no visible author card on
   most money pages. Phase 1 deliverable.

## 4. Verdict

**No SSR or crawler-access work blocks the AI citations build.** The site is
already legible to GPTBot, ClaudeBot, PerplexityBot, and Google-Extended. The
remaining work is content + visible authority signals, per the growth plan.

Next: ship `AuthorCard` + `Last updated` blocks (Phase 1, item 2 of the plan).
