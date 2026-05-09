---
name: seo-local
description: >
  Local SEO analysis covering Google Business Profile optimization, NAP
  consistency, citation health, review signals, local schema markup,
  location page quality, multi-location SEO, and industry-specific
  recommendations. Detects business type (brick-and-mortar, SAB, hybrid)
  and industry vertical (restaurant, healthcare, legal, home services,
  real estate, automotive). Use when user says "local SEO", "Google
  Business Profile", "GBP", "map pack", "local pack", "citations",
  "NAP consistency", "local rankings", "service area", "multi-location",
  or "local search".
user-invokable: true
argument-hint: "[url]"
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
  - WebFetch
  - Write
---

# Local SEO Analysis (March 2026)

## Key Statistics

| Metric | Value | Source |
|--------|-------|--------|
| GBP signals share of local pack weight | 32% | Whitespark 2026 |
| Proximity share of ranking variance | 55.2% | Search Atlas ML study |
| Review signals share (up from 16%) | ~20% | Whitespark 2026 |
| Google searches seeking local info | 46% | Industry data |
| Mobile "near me" searches leading to visit in 24h | 76% | Google confirmed |
| ChatGPT/AI usage for local recommendations | 45% (up from 6%) | BrightLocal LCRS 2026 |
| ChatGPT local conversion rate | 15.9% | Seer Interactive |
| Google organic local conversion rate | 1.76% | Seer Interactive |
| Local pack ads growth (Jan 2025 to Jan 2026) | 1% to 22% | Sterling Sky |

---

## Business Type Detection

Detect from page signals before analysis. This determines which checks apply.

### Brick-and-Mortar
- Physical street address visible in page content or footer
- Google Maps embed with pin/directions
- "Visit us at", "Located at", "Come see us"
- Structured address in LocalBusiness schema

### Service Area Business (SAB)
- No visible physical address
- Service area mentions: "serving [city/region]", "service area includes"
- "We come to you", "On-site service", "Mobile [service]"
- `areaServed` in schema without `address.streetAddress`

### Hybrid
- Both physical address AND service area language present
- "Visit our showroom" combined with "We also serve [areas]"

**Impact on checks**: SABs skip embedded map verification and physical address consistency. Brick-and-mortar gets full NAP + map checks.

---

## Industry Vertical Detection

Detect from page signals and GBP category patterns. Routes to industry-specific checks.

| Vertical | Detection Signals |
|----------|------------------|
| **Restaurant** | /menu, menu items, reservations, cuisine types, food ordering, "dine-in", "takeout" |
| **Healthcare** | insurance accepted, patients, appointments, NPI, medical terms, "Dr.", HIPAA notice |
| **Legal** | attorney, lawyer, practice areas, bar admission, case results, "free consultation" |
| **Home Services** | service area, emergency service, "free estimate", licensed/insured/bonded, "24/7" |
| **Real Estate** | listings, MLS, properties for sale/rent, agent bio, brokerage, "open house" |
| **Automotive** | inventory, VIN, test drive, dealership, service department, "new/used/certified" |

---

## Analysis Dimensions

### 1. GBP Signals (25%)
- Primary category is the **#1 local pack ranking factor** (Whitespark 2026, score: 193)
- Incorrect primary category is the **#1 negative factor** (score: 176)
- GBP Q&A deprecated Dec 2025 — replace with FAQ sections on website
- Google Verified badge replaced Guaranteed/Screened in Oct 2025
- GBP link URL strategy: do NOT link to strongest page (Sterling Sky Diversity Update)
- Businesses open at search time rank higher (factor #5)

### 2. Reviews & Reputation (20%)
- **18-day rule**: rankings cliff if no new reviews for 3 weeks (Sterling Sky)
- Magic threshold: 10 reviews (Sterling Sky)
- 31% of consumers only use 4.5+ stars; 68% only use 4+ stars (BrightLocal 2026)
- 74% only care about reviews in last 3 months
- Review gating prohibited by Google and FTC ($53,088/violation)
- 88% would use a business that responds to reviews (BrightLocal)

### 3. Local On-Page SEO (20%)
- Dedicated service pages = **#1 local organic factor AND #2 AI visibility factor** (Whitespark 2026)
- Location page doorway page test: "swap test" — if swapping city name makes content still generic, it's a doorway page
- HVAC company lost 80% rankings + 63% traffic after March 2024 Core Update for doorway patterns
- >60-70% unique content minimum per location page
- Embedded Google Map is geographic signal reinforcement (lazy-load to mitigate speed impact)
- Hub-and-spoke internal linking; every critical page within 3 clicks of homepage
- 2-5 contextual internal links per 1,000 words with descriptive anchor text

### 4. NAP Consistency & Citations (15%)
- Citations declining for traditional pack rankings but **3 of top 5 AI visibility factors are citation-related** (Whitespark 2026)
- Google's July 2025 documentation update removed "directories" from prominence definition
- Apple Business Connect usage doubled to 27% (BrightLocal 2026)
- Bing Places powers ChatGPT, Copilot, Alexa — critical for AI visibility
- Data aggregators: Data Axle, Foursquare, Neustar/TransUnion

### 5. Local Schema Markup (10%)
- Schema is NOT a direct ranking factor (John Mueller confirmed)
- Enables rich results (43% CTR increase, Webstix case study)
- `geo` coordinates: minimum 5 decimal places
- `priceRange`: <100 chars
- SAB-specific: use `areaServed` with named cities
- Multi-location: each location page has own `LocalBusiness` with unique `@id`, linked via `branchOf` to Organization

### 6. Local Link & Authority Signals (10%)
- Links = **~26% of local organic ranking** (Whitespark 2026, #2 factor group)
- "Best of" list placements = **#1 AI visibility citation factor**
- Brand mentions correlate **3x more strongly** with AI visibility than backlinks (Ahrefs: 0.664 vs 0.218)
- 66.2% of PR practitioners now track AI citations as KPI (BuzzStream 2026)
- Link velocity benchmark: 5-10 quality local links/month for small businesses

---

## AI Search Impact on Local

- AI Overviews appear on up to 68% of local searches (Whitespark Q2 2025)
- ChatGPT converts at 15.9% vs Google organic at 1.76% (Seer Interactive)
- ChatGPT does NOT access GBP directly — sources from Bing index, Yelp, TripAdvisor, BBB, Reddit
- AI-powered local packs (mobile US) show only 1-2 businesses, 32% fewer shown (Sterling Sky)
- Recommend running `/seo-geo <url>` for full AI search visibility analysis

---

## Output

Generate `LOCAL-SEO-ANALYSIS-{domain}.md` with:
1. Local SEO Score: XX/100 with dimension breakdown table
2. Business type: Brick-and-mortar / SAB / Hybrid
3. Industry vertical detected + industry-specific findings
4. GBP optimization checklist
5. Review health snapshot
6. NAP consistency audit
7. Citation presence check
8. Local schema status (present/missing/malformed + ready-to-use fix)
9. Location page quality
10. Top 10 prioritized actions (Critical > High > Medium > Low)
11. Limitations disclaimer
