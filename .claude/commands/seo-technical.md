---
name: seo-technical
description: >
  Technical SEO audit across 9 categories: crawlability, indexability, security,
  URL structure, mobile, Core Web Vitals, structured data, JavaScript rendering,
  and IndexNow protocol. Use when user says "technical SEO", "crawl issues",
  "robots.txt", "Core Web Vitals", "site speed", or "security headers".
user-invokable: true
argument-hint: "[url]"
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
  - WebFetch
---

# Technical SEO Audit

## 9 Audit Categories

### 1. Crawlability
- robots.txt validity; XML sitemap referenced in robots.txt
- Noindex tags: intentional vs accidental
- Important pages within 3 clicks of homepage
- JS rendering check; crawl budget for sites >10k pages

**AI Crawler Management Table:**

| Crawler | Company | robots.txt token | Purpose |
|---------|---------|-----------------|---------|
| GPTBot | OpenAI | `GPTBot` | Model training |
| ChatGPT-User | OpenAI | `ChatGPT-User` | Real-time browsing |
| ClaudeBot | Anthropic | `ClaudeBot` | Model training |
| PerplexityBot | Perplexity | `PerplexityBot` | Search index + training |
| Bytespider | ByteDance | `Bytespider` | Model training |
| Google-Extended | Google | `Google-Extended` | Gemini training (NOT search) |
| CCBot | Common Crawl | `CCBot` | Open dataset |

Key distinctions:
- Blocking `Google-Extended` blocks Gemini training but does NOT affect Google Search or AI Overviews
- Blocking `GPTBot` blocks OpenAI training but does NOT prevent ChatGPT citations via `ChatGPT-User`

### 2. Indexability
- Canonical tags, duplicate content, thin content, pagination, hreflang, index bloat

### 3. Security
- HTTPS, SSL, mixed content; headers: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy

### 4. URL Structure
- Clean URLs, logical hierarchy, redirect chains (max 1 hop), URL length >100 chars flagged, trailing slash consistency

### 5. Mobile Optimization
- Responsive design; touch targets min 48x48px; font size min 16px; no horizontal scroll
- **Mobile-first indexing 100% complete as of July 5, 2024** — Google crawls ALL sites exclusively with mobile Googlebot

### 6. Core Web Vitals
- **LCP**: target <2.5s
- **INP**: target <200ms — INP replaced FID on March 12, 2024; FID fully removed from all Chrome tools September 9, 2024 — do NOT reference FID
- **CLS**: target <0.1
- Evaluated at 75th percentile of real user data

### 7. Structured Data
- JSON-LD preferred; validate against Google's supported types; see seo-schema skill

### 8. JavaScript Rendering
- CSR vs SSR detection; SPA framework flags (React, Vue, Angular)

**December 2025 Google JS SEO guidance:**
1. Canonical tag conflicts between raw HTML and JS-injected: Google may use either
2. `noindex` in raw HTML that JS removes: Google MAY still honor the raw HTML noindex
3. Non-200 status codes: Google does NOT render JS on non-200 pages
4. Structured data in JS may face delayed processing — serve in initial server-rendered HTML

### 9. IndexNow Protocol
- Check if site supports IndexNow for Bing, Yandex, Naver
- Recommend for faster indexing on non-Google engines

## Output Format

### Technical Score: XX/100

| Category | Status | Score |
|----------|--------|-------|
| Crawlability | pass/warn/fail | XX/100 |
| Indexability | pass/warn/fail | XX/100 |
| Security | pass/warn/fail | XX/100 |
| URL Structure | pass/warn/fail | XX/100 |
| Mobile | pass/warn/fail | XX/100 |
| Core Web Vitals | pass/warn/fail | XX/100 |
| Structured Data | pass/warn/fail | XX/100 |
| JS Rendering | pass/warn/fail | XX/100 |
| IndexNow | pass/warn/fail | XX/100 |

Priority buckets: Critical / High (1 week) / Medium (1 month) / Low (backlog)
