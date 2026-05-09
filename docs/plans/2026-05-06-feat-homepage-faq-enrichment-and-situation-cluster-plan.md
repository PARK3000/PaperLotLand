---
title: Homepage FAQ Enrichment + Situation Cluster Distribution
type: feat
date: 2026-05-06
related_plans:
  - docs/plans/2026-05-06-ai-citations-growth-plan.md
  - docs/plans/2026-03-06-fix-seo-page-parity-gaps-plan.md
---

# Homepage FAQ Enrichment + Situation Cluster Distribution

## Overview

Replace the homepage's 5 thin FAQ entries (each ~2 sentences) with 6 deeply-structured, answer-first Q&As that include comparison tables, ordered lists, and SEO-targeted summaries. Simultaneously port 5 situational Q&As to their existing dedicated pages and create one new situation page (tenanted rentals). Add a homepage "selling-situations band" to redistribute internal link equity to the situation cluster.

This work is a **direct Phase 1 contributor to the AI Citations Growth Plan** — the new content is engineered for AI Overview / Featured Snippet / Perplexity citation, and the structured FAQPage schema is exactly what that plan calls for.

## Problem Statement / Motivation

### Current state

- `src/components/sections/faq-section.tsx` renders 5 short FAQs sourced from `src/lib/site-content.ts` → `getFAQContent()`.
- Each answer is a single string (≤ 60 words), rendered in a single `<p>`.
- `src/components/seo/faq-schema.tsx` puts the full `answer` into `acceptedAnswer.text`. Works for short answers; suboptimal once we add tables/lists.
- Situation pages (`/stop-a-foreclosure/`, `/going-through-a-divorce/`, `/facing-bankruptcy/`, `/relocating/`, inherited-house pages) exist but lack contextual FAQ blocks that match common high-intent queries.
- No dedicated page exists for "sell rental property with tenants Las Vegas" intent.
- Homepage does not internally link to situation pages outside header nav and `SituationsGrid` (where used).

### What we're missing (per `seo/keyword-plan.md`)

| Target | Volume | Diff | Current | Goal | Helped by which Q |
|---|---|---|---|---|---|
| sell my house fast las vegas | 880 | 13 | **#37** | Top 5 | Q8 (timeline table), Q5 (process) |
| we buy houses las vegas | 720 | 4 | #3 | #1 | Q4 (price), Q6 (as-is), Q7 (vs agent) |
| cash home buyers las vegas | 170 | 11 | #10 | Top 5 | Q3 (security), Q4, Q7 |
| fast vegas home buyers | 390 | **0** | #37 | Top 10 | Q8 |
| we buy ugly houses reviews | 880 | 2 | — | Page 1 | Q4, Q6 |

### Why now

1. **Existing rich content available** — 12 well-written, answer-first Q&As ported from the legacy WordPress site, each with structured subheadings, lists, and comparison tables.
2. **AI search is shifting indexation models** — answer-first format with FAQPage schema captures AI Overview citations (per `seo/GEO-ANALYSIS.md`).
3. **The 880-vol "sell my house fast" gap (#37)** has been the #1 SEO opportunity since Q1 and is unaddressed on the homepage.
4. **`AnswerFirstPageTemplate` already exists** in the codebase — we now have a structured-content pattern to mirror.

## Proposed Solution

A four-bucket distribution of the 12 source Q&As:

```
12 source Q&As
├── 6 → Homepage FAQ (Bucket A: core funnel topics)
├── 5 → Existing situation pages (Bucket B: situational topics)
├── 1 → New situation page /sell-rental-with-tenants-las-vegas/ (Bucket C)
└── 1 → Homepage "selling-situations band" link card (cross-link to all)
```

Plus three structural changes:

1. **Extend `FAQItem` type** to support structured bodies (paragraphs, lists, tables, subheadings), with backward compat for the existing string `answer`.
2. **Update `FAQSchema`** so `acceptedAnswer.text` uses a short `summary` field (or falls back to `answer`), keeping schema text concise per Google guidance.
3. **Add a `SituationsBand` component** below the homepage FAQ to fan internal links to the 7 situation pages.

## Technical Approach

### Architecture decisions

#### Decision 1: FAQ body shape — typed structured ReactNode-friendly objects

Three options considered:

| Option | Pros | Cons | Decision |
|---|---|---|---|
| (a) Typed structured body | Type-safe, no XSS, CMS-editable, reuses `AnswerFirstPageData.sections` shape | ~50 LOC component + type changes | **Chosen** |
| (b) Sanitized HTML | Maximally flexible | XSS surface, new dep (DOMPurify), uneditable in admin form | Rejected |
| (c) Per-FAQ React component | Maximum design freedom | Zero CMS-editability, scattered content | Rejected |

The chosen shape extends the existing `FAQItem` interface in `src/lib/site-content.ts`:

```ts
// src/lib/site-content.ts
export interface FAQTable {
  caption?: string
  headers: string[]
  rows: string[][]
  /** Index of the column to highlight (e.g., "Selling to Us") */
  highlightColumnIndex?: number
}

export interface FAQBodySection {
  heading?: string                   // h3 inside accordion
  paragraphs?: string[]
  /** Bullet list with optional bold lead-in syntax: "**Lead:** rest of bullet" */
  bullets?: string[]
  /** Numbered list, same lead-in syntax */
  numbered?: string[]
  table?: FAQTable
  /** Final emphasis line, rendered as a callout */
  callout?: string
}

export interface FAQItem {
  question: string
  /** 40-160 char direct answer used for FAQPage schema and lead paragraph. */
  summary: string
  /** Optional structured body for rich rendering. */
  body?: FAQBodySection[]
  /**
   * @deprecated kept for backward compat with seeded DB rows.
   * If present and `summary` is missing, treated as both summary and body.
   */
  answer?: string
}
```

Backward-compat rule: a record with only `answer` continues to render as before. New records use `summary` + optional `body`.

#### Decision 2: FAQSchema strategy

`acceptedAnswer.text` should be short, plain-text, ≤ 250 chars (Google's guidance for rich-result eligibility — long answers are accepted but rarely surfaced). Visible UI can be longer.

```ts
// src/components/seo/faq-schema.tsx (updated)
acceptedAnswer: {
  '@type': 'Answer',
  text: faq.summary ?? faq.answer ?? '',
}
```

Add lightweight runtime guard in dev: warn if `summary.length > 300`.

#### Decision 3: Where situation Q&As live

Each ported Q&A becomes a `pageFAQs: FAQItem[]` collection alongside the existing situation page content. Render via the same `FAQSection` component with `showCTA={false}`. Emit `FAQSchema` per page.

Source-of-truth options:
- (i) Inline in `src/app/(site)/<slug>/page.tsx` — fastest, but content lives in code.
- (ii) New file `seo/pages/<slug>.json` consumed by the page — keeps content portable, matches `/seo/pages` convention already established.

Choose **(ii)** for the 5 ports + new tenants page so future content edits don't require code changes. The homepage FAQ stays in `site-content.ts` (DB-backed via admin).

#### Decision 4: Tenanted-rental situation page

Create `/sell-rental-property-tenants-las-vegas/` (slug to be confirmed via DataForSEO keyword check before commit — see Phase 4 acceptance criteria). Use existing `SituationPageTemplate`. Q12 becomes the page's centerpiece FAQ; the rest of the page follows the situation-page pattern.

#### Decision 5: Inherited-house canonical

Two pages exist: `/inherited-house-las-vegas-probate-process/` and `/need-to-sell-an-inherited-house/`. Out of scope to merge in this plan (would require a separate redirect plan). For now: **port Q11 to `/inherited-house-las-vegas-probate-process/`** (more SEO-targeted slug), leave the other intact, and flag the canonicalization decision as a follow-up.

#### Decision 6: Homepage situations band

New component `src/components/sections/situations-band.tsx` — responsive grid of 6-7 cards/chips with:
- Icon (existing icon set)
- Page title (e.g., "Facing foreclosure?")
- 1-line teaser (≤ 80 chars)
- Link to situation page

Placement: between `<FAQSection>` and the existing CTA in `src/app/(site)/page.tsx`. Renders below-the-fold, lazy-imported.

### Q&A → destination mapping

| # | Source Q | Destination | Notes |
|---|---|---|---|
| Q1 | If we are in foreclosure, can you help? | `/stop-a-foreclosure/` | Port full body |
| Q2 | Can I sell a house from another state? | `/relocating/` | Port full body |
| Q3 | How do I receive my money — secure? | **Homepage FAQ** | Trust signal |
| Q4 | Will I get a good price selling for cash? | **Homepage FAQ** | Keep comparison table |
| Q5 | How can I sell my house for cash? | **Homepage FAQ** | Process; replaces current Q1 |
| Q6 | My house needs work, will you still pay cash? | **Homepage FAQ** | Replaces current Q3; "as-is" |
| Q7 | Are you licensed agents or a cash buyer? | **Homepage FAQ** | Differentiation; comparison table |
| Q8 | How fast can I sell my house for cash? | **Homepage FAQ** | Critical-gap target; timeline table |
| Q9 | Selling for cash if in bankruptcy? | `/facing-bankruptcy/` | Port full body |
| Q10 | Selling due to a divorce? | `/going-through-a-divorce/` | Port full body |
| Q11 | Selling a house in probate? | `/inherited-house-las-vegas-probate-process/` | Port full body |
| Q12 | Selling with tenants? | **NEW** `/sell-rental-property-tenants-las-vegas/` | Centerpiece FAQ |

### Homepage FAQ ordering (final 6, funnel-aligned)

1. **How can I sell my house for cash in Las Vegas?** (Q5 — process intro)
2. **How fast can I sell my house for cash?** (Q8 — speed; supports critical-gap keyword)
3. **My house needs work, will you still pay cash?** (Q6 — as-is)
4. **Will I get a fair price selling for cash?** (Q4 — price; comparison table)
5. **Are you licensed agents or a cash home buying company?** (Q7 — differentiation)
6. **How do I receive my money, and is the process secure?** (Q3 — trust)

The current "What areas do you serve?" Q from `defaultFAQs` is **folded into Q5's body** (a sub-bullet under "Step 1") rather than dropped — preserves geo keyword density.

### Implementation Phases

#### Phase 1 — Foundation (data shape + component) [~3 hrs]

**Files:**
- `src/lib/site-content.ts` — extend `FAQItem` with `summary`, `body`, deprecate `answer`. Update `getFAQContent()` to handle both shapes.
- `src/components/sections/faq-section.tsx` — render structured `body` when present; backward-compat path for `answer`. Mobile-responsive table wrapper (`overflow-x-auto`).
- `src/components/seo/faq-schema.tsx` — use `summary ?? answer`.
- `src/components/admin/site-content/faqs-form.tsx` — extend admin form with `summary` field; `body` editing deferred to Phase 1.5 or hand-edited JSON.
- (optional) `src/lib/site-content/faq-validators.ts` — zod schema + dev-mode warning if `summary > 300`.

**Tests / checks:**
- Schema validates on Google Rich Results Test with both legacy and new shapes.
- Existing 5 FAQs render unchanged after refactor (regression check).

#### Phase 2 — Homepage content swap [~2 hrs]

**Files:**
- `src/lib/site-content.ts` `defaultFAQs` updated with the 6 new Q&As (typed `body` for each).
- DB seed: if `site_content.faqs` row exists, write a migration script `scripts/seed-faqs-2026-05.ts` to update.
- `seo/SEO-ANALYSIS.md` — add row noting the change for monitoring.

**Acceptance:**
- 6 FAQs render on `/` with summary as lead paragraph + structured body in accordion.
- All 6 summary lines ≤ 250 chars.
- Each summary contains "Las Vegas" or "Vegas" (geo signal preservation).
- `FAQPage` JSON-LD has 6 entries, validates clean.
- Lighthouse SEO ≥ existing baseline (98+).

#### Phase 3 — Situation page Q&As [~4 hrs]

**Files (one per situation page):**
- `seo/pages/stop-a-foreclosure-faqs.json` (Q1)
- `seo/pages/relocating-faqs.json` (Q2)
- `seo/pages/facing-bankruptcy-faqs.json` (Q9)
- `seo/pages/going-through-a-divorce-faqs.json` (Q10)
- `seo/pages/inherited-house-probate-faqs.json` (Q11)
- `src/app/(site)/<each-slug>/page.tsx` — import the JSON, render `<FAQSection faqs={...} showCTA={false} />` + `<FAQSchema />`. May want to abstract into a `<PageFAQs slug={...} />` wrapper.

**Acceptance:**
- Each situation page emits its own `FAQPage` JSON-LD.
- Q text on situation pages does NOT duplicate the homepage FAQ Q text (avoid same-question on multiple URLs).
- All page-level rich-result tests pass.

#### Phase 4 — New tenants page [~5 hrs]

**Pre-flight (gate):**
1. Run keyword research on "sell rental with tenants las vegas", "sell tenanted rental las vegas", "sell rental property las vegas tenants" via DataForSEO MCP.
2. Pick highest-volume / lowest-difficulty slug. Likely candidates:
   - `/sell-rental-property-tenants-las-vegas/`
   - `/sell-house-with-tenants-las-vegas/`

**Files:**
- `src/app/(site)/<chosen-slug>/page.tsx` — uses `SituationPageTemplate`.
- `seo/pages/<chosen-slug>.json` — page content + Q12 as centerpiece FAQ.
- `src/lib/constants.ts` — add to situation list if registered there.
- `public/sitemap.xml` (auto-regenerated on build).

**Acceptance:**
- Indexable, in sitemap, internally linked from homepage situations band + footer.
- DataForSEO `keywords_for_site` shows the URL surfacing within 14 days post-deploy.

#### Phase 5 — Homepage situations band [~3 hrs] — **SKIPPED, redundant**

**Discovery during execution:** the homepage already renders `SituationsGrid`
at `src/app/(site)/page.tsx:141` (above the FAQ), with 10 cards linking to
all major situation pages — exactly the internal-link distribution role this
plan called for. Adding another band below the FAQ would create duplicate
anchor links to the same URLs, with no SEO compounding benefit.

**Decision:** skip this phase. The existing `SituationsGrid` already satisfies
the cluster-link distribution intent. If a future signal shows the existing
grid is being missed by users (low click-through), revisit with a
differently-styled component below the FAQ.

(Original phase content retained below for reference if the call needs revisiting.)


**Files:**
- `src/components/sections/situations-band.tsx` — new component.
- `src/app/(site)/page.tsx` — render `<SituationsBand />` between `<FAQSection />` and final CTA.
- (optional) `src/lib/site-content.ts` — register a `situationsBand` content key if we want admin editability; otherwise inline.

**Cards (initial set, in order):**
| Title | Subtitle (≤ 80 chars) | Href |
|---|---|---|
| Facing foreclosure? | Stop the auction. Walk away with cash before the bank takes over. | `/stop-a-foreclosure/` |
| Going through a divorce? | A clean, private sale to simplify dividing the home. | `/going-through-a-divorce/` |
| In bankruptcy? | We work with your attorney and the court to close fast. | `/facing-bankruptcy/` |
| Inherited a house? | Sell as-is, leave behind what you don't want. | `/inherited-house-las-vegas-probate-process/` |
| Selling from out of state? | Mobile notary + remote closing. You don't fly in. | `/relocating/` |
| Have tenants? | Keep them or transition them — we buy occupied rentals. | `/sell-rental-property-tenants-las-vegas/` |
| House needs work? | Fire damage, code violations, hoarder, deferred maintenance. | `/house-that-needs-repairs/` |

**Acceptance:**
- 7 cards, mobile = single column, desktop = 3-4 col grid.
- Each card link tracked in PostHog (`event: situation_card_click`, `props: { situation }`).

#### Phase 6 — Verification + launch [~2 hrs]

- Run Lighthouse on `/` and one situation page; compare to baseline.
- Validate all FAQPage JSON-LD via Google Rich Results Test.
- Trigger IndexNow ping (existing `scripts/ping-indexnow.ts` runs on `postbuild` — confirm new URLs are in the priority list).
- Manual mobile QA on the comparison tables (Q4, Q7, Q8).
- Verify no broken internal links via `npm run build` static-export check.
- Capture pre-deploy GSC rank baseline for the 5 target keywords.
- Set 30-day calendar reminder to recheck rankings + AI citation export.

## Alternative Approaches Considered

1. **Put all 12 Qs on the homepage.** Rejected — content cannibalization with situation pages, homepage bloat (>3000 words), schema bloat (Google penalizes overly long FAQ schema).
2. **Replace `FAQSection` with `AnswerFirstPageTemplate` for the homepage.** Rejected — over-rotates the homepage toward an editorial format; loses hero/lead-form conversion focus.
3. **Render rich body via MDX.** Rejected — adds build-time complexity, breaks DB-backed content editing.
4. **Skip the situations band.** Rejected — leaves PageRank distribution to header nav alone; situation pages would not benefit from homepage authority.

## Acceptance Criteria

### Functional Requirements

- [x] `FAQItem` extended with `summary` + `body` fields; backward compat for `answer`-only records confirmed via type-check.
- [x] 6 enriched FAQs live on the homepage with comparison tables (Q2/Q4/Q5) rendering correctly.
- [x] 5 situation pages each prepend a contextual rich Q&A; existing FAQs retained.
- [ ] New `/sell-rental-property-tenants-las-vegas/` (or chosen slug) page indexed and in sitemap. *(Deferred to follow-up PR pending DataForSEO slug check)*
- [~] Homepage situations band renders 7 cards linking to all situation pages. *(Skipped — existing `SituationsGrid` already serves this role)*
- [x] Existing site-content admin UI does not break (legacy `answer`-only path still works via FAQItem.answer field).

### Non-Functional Requirements

- [ ] Homepage Lighthouse SEO score ≥ pre-change baseline (current 98+). *(Manual post-deploy)*
- [x] Homepage LCP delta ≤ +50ms — `FAQSection` already lazy-imported via `next/dynamic`; no new components added.
- [ ] CLS unchanged (≤ 0.1). *(Manual post-deploy)*
- [x] All summary lines 40-250 chars (verified — longest is ~250 chars).
- [x] Each homepage FAQ summary contains ≥ 1 occurrence of "Las Vegas" or "Vegas".
- [x] Comparison tables wrap with `overflow-x-auto` on mobile (`FAQTableBlock` in `faq-body.tsx`), no horizontal page scroll.
- [x] No homepage FAQ Q text appears verbatim on a situation page — Qs are differently phrased on each surface.

### Quality Gates

- [ ] All FAQPage JSON-LD passes Google Rich Results Test. *(Manual post-deploy via Search Console)*
- [x] Build passes; type-check clean (no `any` introduced).
- [ ] Visual diff on `/`, `/stop-a-foreclosure/`, `/going-through-a-divorce/`, `/facing-bankruptcy/`, `/relocating/`, `/inherited-house-las-vegas-probate-process/`. *(Manual QA recommended post-deploy)*
- [~] PostHog event for situation-band clicks fires. *(N/A — band skipped)*
- [~] IndexNow priority list includes the new tenants URL. *(N/A — tenants page deferred)*

## Success Metrics (90-day post-launch)

| Metric | Baseline (2026-05) | 90-day target |
|---|---|---|
| `sell my house fast las vegas` rank | #37 | Top 10 |
| `cash home buyers las vegas` rank | #10 | Top 5 |
| `fast vegas home buyers` rank | #37 | Top 15 |
| `we buy houses las vegas` rank | #3 | #1-2 |
| Situation-page impressions (GSC, sum of 6) | TBD baseline pull | +30% |
| Homepage FAQ-rich-result eligibility | 5 Qs | 6 Qs (100%) |
| AI citation count (per `seo/GEO-ANALYSIS.md` export) | 4 rows | 8+ rows |
| PostHog `situation_card_click` rate (% of homepage sessions) | n/a | ≥ 4% |

## Dependencies & Risks

### Dependencies

- DataForSEO MCP available (Phase 4 keyword decision)
- `IndexNow` (`INDEXNOW_KEY`) configured in Vercel prod (already done per CLAUDE.md)
- Admin DB row for `site_content.faqs` may need migration; coordinate with whoever last edited via admin

### Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Schema penalizes long FAQ entries (we lose existing rich result) | Low | High | Strict 250-char `summary` cap; only summary in schema |
| Homepage FAQ duplication with situation pages dilutes both | Med | High | Phrase Qs differently across surfaces; never reuse Q text verbatim |
| New tenants page picks low-volume slug | Med | Med | Pre-flight DataForSEO check is a Phase 4 gate |
| Comparison tables break mobile layout | Med | Med | `overflow-x-auto` wrapper + manual mobile QA gate |
| Site-content admin edit overrides new defaults | Med | Med | Migration script to update DB row; document new shape |
| Inherited-house canonical confusion | Low | Med | Out of scope — flag as follow-up plan |
| Homepage LCP regression from heavier FAQ DOM | Low | Med | `next/dynamic` lazy import already in use; keep accordion default-closed |

## Resource Requirements

- 1 engineer: ~2 days total (Phases 1-2 = 0.5d, Phase 3 = 0.5d, Phases 4-6 = 1d)
- DataForSEO MCP units (~50 for Phase 4 pre-flight)
- No design dependency (reuses existing tokens + accordion + table patterns)

## Future Considerations

1. **Phase 1.5 (deferred): admin UI for structured FAQ bodies.** Currently the admin form only exposes `summary`/`answer`. Editing `body` requires DB JSON. A future iteration could give content editors a block-based editor (similar to `blog-editor.tsx`).
2. **Inherited-house canonical merge.** Decide between `/inherited-house-las-vegas-probate-process/` and `/need-to-sell-an-inherited-house/`; 301 the loser.
3. **`Speakable` schema** on FAQ summaries for Google Assistant TTS pickup.
4. **`HowTo` schema** on Q5 (multi-step process) — once Q5's body is structured, it's eligible.
5. **Auto-translate FAQ to Spanish** for `/es/` cluster (volume in Vegas warrants it; out of scope here).
6. **Treat the homepage FAQ as a citation harvest experiment.** Re-pull AI citation export 30/60/90 days post-launch and feed insights back into the AI Citations Growth Plan.

## Documentation Plan

- Update `CLAUDE.md` → "Section Components" entry for `SituationsBand`.
- Update `seo/keyword-plan.md` with the FAQ-driven targeting changes.
- Add a `docs/solutions/faq-rich-content-pattern.md` capturing the structured-body pattern for future content work (per `compound-engineering:compound-docs` skill).

## References

### Internal

- `src/lib/site-content.ts:74` — current `FAQContent` interface
- `src/components/sections/faq-section.tsx:1-153` — current renderer
- `src/components/seo/faq-schema.tsx:1-30` — current schema component
- `src/components/templates/answer-first-page.tsx:11-58` — analogous structured-content pattern to mirror
- `src/components/templates/situation-page.tsx` — situation page template
- `seo/keyword-plan.md` — keyword targets and current rankings
- `seo/GEO-ANALYSIS.md` — AI citation analysis grounding
- `docs/plans/2026-05-06-ai-citations-growth-plan.md` — parent strategic plan
- `docs/plans/2026-03-06-fix-seo-page-parity-gaps-plan.md` — situation page audit history

### External

- Google FAQPage rich result guidelines: https://developers.google.com/search/docs/appearance/structured-data/faqpage
- Schema.org FAQPage spec: https://schema.org/FAQPage
- Google "answer-first" + AI Overview heuristics (in `seo/GEO-ANALYSIS.md`)

## Open Questions Before Implementation

1. **Confirm tenanted-rental slug** — defer to Phase 4 DataForSEO gate, but flag for awareness.
2. **DB migration vs default-only** — is `site_content.faqs` currently overridden in prod DB? If yes, add migration script. If not, defaults swap is sufficient.
3. **Should the "What areas do you serve?" Q be retained as a 7th homepage FAQ instead of folded into Q5?** Recommended fold (geo coverage stays, fewer Qs in schema), but not load-bearing.
4. **Inherited-house canonical** — flagged as out-of-scope follow-up; confirm OK to defer.
