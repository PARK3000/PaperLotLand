---
title: "Fix SEO & Page Parity Gaps Between Live Site and Vercel"
type: fix
date: 2026-03-06
---

# Fix SEO & Page Parity Gaps Between Live Site and Vercel

## Overview

A Screaming Frog crawl comparison reveals the Vercel site (99 discoverable pages) has significant gaps vs the live WordPress site (155 pages). **All pages exist in the codebase** — the issue is broken internal links and missing navigation paths that prevent crawlers and users from discovering them.

## Problem Statement

The homepage renders two grid components (`SituationsGrid` and `LocationsGrid`) that link to wrong or placeholder URLs, producing 404s. Case studies have zero inbound links from any page. Blog and category archives lack pagination. Three blog posts contain literal placeholder text instead of URLs. The `LocalBusinessSchema` component generates incorrect structured data URLs.

These issues mean:
- **10 situation pages** are unreachable from homepage navigation
- **4 location page links** on the homepage produce 404s
- **10 case study pages** are only discoverable via sitemap.xml
- **85+ blog posts** load on a single page with no pagination
- Search engines receive incorrect JSON-LD structured data for location pages

## Proposed Solution

Fix 8 discrete issues across 10 files. No new page creation needed — this is a linking, data, and pagination fix.

---

## Item 1: Fix SituationsGrid — Broken Links to Situation Pages

**Root Cause:** The `SituationsGrid` component has an inverted ternary on line 51 that always falls back to placeholder `defaultSituations` with `href="/services#situation-one"` URLs instead of using the `SITUATIONS` constant.

```tsx
// BUG: When SITUATIONS.length > 0 (always true), this evaluates to []
situations = SITUATIONS.length > 0 ? [] : defaultSituations,
```

Additionally, the `SITUATIONS` constant has slugs (`foreclosure`, `inherited`) that don't match actual route paths (`/stop-a-foreclosure/`, `/need-to-sell-an-inherited-house/`).

**Fix:**
1. Replace the `defaultSituations` array in `situations-grid.tsx` with 8 properly-linked situation cards
2. Each card needs: `title`, `description`, `icon` (React node), and correct `href`
3. Remove the broken ternary logic and unused `SITUATIONS` import

**Files:**
- `src/components/sections/situations-grid.tsx` — Replace hardcoded `defaultSituations` with real data

**Situation → URL Mapping (8 cards):**

| Situation | URL |
|-----------|-----|
| Facing Foreclosure | `/stop-a-foreclosure/` |
| Inherited Property | `/need-to-sell-an-inherited-house/` |
| Going Through Divorce | `/going-through-a-divorce/` |
| Relocating | `/relocating/` |
| House Needs Repairs | `/house-that-needs-repairs/` |
| Code Violations | `/code-violations/` |
| Fire Damaged Home | `/fire-damaged-home/` |
| Facing Bankruptcy | `/facing-bankruptcy/` |

**Acceptance Criteria:**
- [x] All 8 situation cards link to correct, live URLs
- [x] No 404s when clicking any situation card from homepage
- [x] Grid renders 2 rows of 4 on desktop, 2 columns on mobile

---

## Item 2: Fix LocationsGrid — Wrong URL Patterns

**Root Cause:** `locations-grid.tsx` has a hardcoded `locations` array using `/locations/henderson/`, `/locations/boulder-city/`, etc. These routes don't exist — actual routes are `/henderson/`, `/we-buy-houses-boulder-city/`, etc.

**Fix:** Update the hardcoded array to use correct URLs matching the routes in `src/app/`.

**Files:**
- `src/components/sections/locations-grid.tsx` — Fix the 4 href values

**Correct URL Mapping:**

| Location | Current (broken) | Correct |
|----------|-----------------|---------|
| Las Vegas | `/locations/las-vegas/` | `/` |
| Henderson | `/locations/henderson/` | `/henderson/` |
| Boulder City | `/locations/boulder-city/` | `/we-buy-houses-boulder-city/` |
| Pahrump | `/locations/pahrump/` | `/we-buy-houses-pahrump/` |

**Acceptance Criteria:**
- [x] All 4 location cards link to live pages (no 404s)
- [x] Las Vegas card links to homepage `/`

---

## Item 3: Fix SituationsGrid CTA Button — `/contact/` → `/contact-us/`

**Root Cause:** Line 95 of `situations-grid.tsx` has `href="/contact"` but the actual route is `/contact-us/`.

**Fix:** Change `href="/contact"` to `href="/contact-us/"`.

**Files:**
- `src/components/sections/situations-grid.tsx` — Line 95

**Acceptance Criteria:**
- [x] "Contact Us" button links to `/contact-us/` (not `/contact/`)
- [x] No 404 on click

---

## Item 4: Add Case Study Links to Happy Sellers Page

**Root Cause:** No page links to case study pages. They're only discoverable via `sitemap.xml`.

**Fix:** Add a "Success Stories" section to `/happy-sellers/page.tsx` showing 4 featured case study cards with title, location, key result, and a link to the full case study page.

**Files:**
- `src/app/happy-sellers/page.tsx` — Add case study cards section

**Featured Case Studies (4):**

| Case Study | Key Result |
|-----------|------------|
| Selling From 900 Miles Away | Closed in 11 days |
| From Foreclosure Notice to Cash | Closed in 14 days |
| Hoarder House in Henderson | Sold as-is |
| Divorce and Financial Hardship | Closed in 7 days |

**Acceptance Criteria:**
- [x] 4 case study cards visible on `/happy-sellers/` page
- [x] Each card links to the correct case study page
- [x] Cards show title, location badge, and key result stat
- [x] "View All Success Stories" link shown if more than 4 exist

---

## Item 5: Add Blog Pagination (`/blog/page/[num]/`)

**Root Cause:** Blog listing at `/blog/page.tsx` renders all 85+ posts on a single page. WordPress has `/blog/page/2/` through `/blog/page/9/`.

**Fix:** Create a dynamic route at `src/app/blog/page/[num]/page.tsx` with 12 posts per page. Add pagination controls to the blog listing.

**Files:**
- `src/app/blog/page/[num]/page.tsx` — New dynamic paginated route
- `src/app/blog/page.tsx` — Add pagination controls (show page 1 content here)
- `src/lib/blog.ts` — Add `getPaginatedPosts(page, perPage)` helper
- `src/app/sitemap.ts` — Add paginated blog URLs

**Implementation Details:**
- 12 posts per page (clean 3-column grid with 4 rows)
- `generateStaticParams()` to pre-render all pagination pages at build time
- Previous/Next links + page number buttons
- Page 1 canonical should be `/blog/` (not `/blog/page/1/`)
- Redirect `/blog/page/1/` → `/blog/` to avoid duplicate content

**Acceptance Criteria:**
- [x] `/blog/` shows first 12 posts with pagination controls
- [x] `/blog/page/2/` through `/blog/page/N/` work correctly
- [x] `/blog/page/1/` redirects to `/blog/`
- [x] Each page has proper `<title>` with page number (e.g., "Blog - Page 2")
- [x] Previous/Next and page number navigation works
- [x] All paginated pages appear in sitemap

---

## Item 6: Fix Blog Post Placeholder Links

**Root Cause:** 3 blog post JSON files contain literal placeholder text instead of real URLs.

**Files:**
- `content/blog/posts/do-cash-buyers-in-las-vegas-pay-closing-costs.json` — Replace `"link to internal page on how to sell fast"` → `/selling-my-house-in-las-vegas-for-cash/`
- `content/blog/posts/how-many-showings-does-it-take-to-sell-a-house-in-pahrump-nv.json` — Replace `"link to internal showing tips post"` → `/selling-a-home/top-tips-for-preparing-your-house-for-sale-to-a-cash-buyer-in-las-vegas/`
- `content/blog/posts/selling-a-las-vegas-property-with-unpermitted-work.json` — Replace parenthetical placeholder with a proper link to `/selling-a-home/selling-for-cash-key-insights/`

**Acceptance Criteria:**
- [x] No placeholder text in any blog post href attributes
- [x] All 3 internal links resolve to real pages (no 404s)

---

## Item 7: Add Category Archive Pagination

**Root Cause:** All 4 category archive pages render every matching post on one page. `/selling-a-home/` has 63 posts on a single page.

**Fix:** Add pagination to category archive pages using the same pattern as blog pagination.

**Files:**
- `src/app/selling-a-home/page.tsx` — Add pagination (12 posts/page)
- `src/app/sell-your-house/page.tsx` — Add pagination
- `src/app/sell-my-house-fast/page.tsx` — Add pagination (only 4 posts, may not need it)
- `src/app/buying-a-home/page.tsx` — Add pagination
- `src/lib/blog.ts` — Extend `getPaginatedPosts()` to accept category filter
- Create `src/app/selling-a-home/page/[num]/page.tsx` (and equivalents for other categories)
- `src/app/sitemap.ts` — Add paginated category URLs

**Implementation Details:**
- Same 12-per-page, path-based pagination as blog
- Only create pagination routes for categories with > 12 posts
- `/selling-a-home/page/1/` redirects to `/selling-a-home/`
- Share pagination UI component with blog pages

**Acceptance Criteria:**
- [x] `/selling-a-home/` shows first 12 posts with pagination
- [x] `/selling-a-home/page/2/` through `/selling-a-home/page/N/` work
- [x] Other categories use shared BlogPostGrid (all under 12 posts, no pagination needed)
- [x] Category-specific metadata on each paginated page

---

## Item 8: Fix LocalBusinessSchema URL Construction

**Root Cause:** `local-business-schema.tsx` line 20 constructs URLs as `/locations/${citySlug}` instead of using the actual page URLs.

**Fix:** Accept a `pageUrl` prop (or `slug` that matches the actual route) and use it directly instead of constructing a `/locations/` prefix URL.

**Files:**
- `src/components/seo/local-business-schema.tsx` — Accept `pageUrl` prop, use it for `@id` and `url`
- All call sites (location pages + homepage) — Pass the correct `pageUrl`

**Call Site Updates:**

| Page | Current | Correct `pageUrl` |
|------|---------|-------------------|
| Homepage | `<LocalBusinessSchema city="Las Vegas" />` | `pageUrl="/"` |
| Henderson | `<LocalBusinessSchema city="Henderson" />` | `pageUrl="/henderson/"` |
| Summerlin | `<LocalBusinessSchema city="Summerlin" />` | `pageUrl="/we-buy-houses-summerlin/"` |
| Enterprise | `<LocalBusinessSchema city="Enterprise" />` | `pageUrl="/we-buy-houses-enterprise/"` |
| Paradise | `<LocalBusinessSchema city="Paradise" />` | `pageUrl="/we-buy-houses-paradise/"` |
| Pahrump | `<LocalBusinessSchema city="Pahrump" />` | `pageUrl="/we-buy-houses-pahrump/"` |
| Boulder City | `<LocalBusinessSchema city="Boulder City" />` | `pageUrl="/we-buy-houses-boulder-city/"` |
| Green Valley | `<LocalBusinessSchema city="Green Valley" />` | `pageUrl="/sell-my-house-fast-green-valley-nv/"` |

**Acceptance Criteria:**
- [x] JSON-LD `@id` and `url` fields match the canonical URL of each page
- [x] No `/locations/` prefix in any schema output
- [x] Schema validates with Google's Rich Results Test

---

## Technical Considerations

### Shared Pagination Component
Items 5 and 7 should share a `<Pagination />` component to avoid duplication. Build it as part of Item 5, reuse in Item 7.

```
src/components/ui/pagination.tsx  (new)
```

### Build Impact
Adding pagination routes increases static page count. With 85 blog posts at 12/page = ~8 blog pages, plus ~6 category pages = ~14 new static routes. Minimal build time impact.

### No Redirects Needed
The broken URLs (`/locations/henderson/`, `/contact/`, `/services/`) are internal link targets, not externally indexed URLs. Fixing the source links is sufficient — no 301 redirects required for these paths.

### Rewrite Rule Cleanup
The rewrite in `next.config.ts` (`/sell-my-house-fast-:slug` → `/locations/:slug`) is vestigial and could cause issues. Consider removing it since the filesystem route at `/sell-my-house-fast-green-valley-nv/page.tsx` handles this directly.

---

## Dependencies & Risks

| Risk | Mitigation |
|------|-----------|
| Blog pagination changes blog URL structure | Page 1 stays at `/blog/`, only page 2+ get new URLs |
| Category pagination adds many new routes | Only paginate categories with >12 posts |
| LocalBusinessSchema changes affect structured data | Validate with Google Rich Results Test before deploy |
| Placeholder link targets may be wrong | Best-guess URLs chosen; verify content relevance |

## Success Metrics

- Screaming Frog crawl of Vercel site discovers 155+ pages (parity with live site)
- Zero 404s in internal link audit
- All JSON-LD schemas validate
- Blog pagination pages are crawlable and indexed

## References

- Live site crawl: `docs/seo/WBAVH Site Crawl 3_6_26 - 1 - Internal - All.csv`
- Vercel crawl: `docs/seo/WBAVH Vercel Site Crawl 3_6_26 - 1 - Internal - All.csv`
- Migration plan: `docs/MIGRATION-PLAN.md`
- SEO backlink plan: `docs/seo-backlink-action-plan.md`

### Key Files to Modify

| File | Items |
|------|-------|
| `src/components/sections/situations-grid.tsx` | 1, 3 |
| `src/components/sections/locations-grid.tsx` | 2 |
| `src/app/happy-sellers/page.tsx` | 4 |
| `src/app/blog/page.tsx` | 5 |
| `src/app/blog/page/[num]/page.tsx` | 5 (new) |
| `src/lib/blog.ts` | 5, 7 |
| `content/blog/posts/*.json` (3 files) | 6 |
| `src/app/selling-a-home/page.tsx` | 7 |
| `src/app/selling-a-home/page/[num]/page.tsx` | 7 (new) |
| `src/components/seo/local-business-schema.tsx` | 8 |
| `src/components/ui/pagination.tsx` | 5, 7 (new) |
| `src/app/sitemap.ts` | 5, 7 |
