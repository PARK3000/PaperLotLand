---
title: PostHog Dashboard Suite for Traffic, Funnel, Performance & CRO
type: feat
date: 2026-04-27
---

# PostHog Dashboard Suite for Traffic, Funnel, Performance & CRO

## Overview

Build a focused PostHog dashboard suite for We Buy Any Vegas House (project `393348`) that gives the team decision-useful insight into:

1. Traffic to the homepage and `/lp/*` PPC landing pages
2. Lead-capture funnel conversion (form + phone) for those pages
3. Uptime and front-end performance / page load speed
4. CRO opportunities — specifically surfacing where A/B tests will most likely move the conversion rate

The suite must be **opinionated and quiet**. Every tile must answer a recurring decision question; tiles that do not influence a decision get cut. The end-state is a five-dashboard set, a clean event taxonomy, and a prioritized A/B-test backlog grounded in the data the dashboards expose.

## Problem Statement / Motivation

PostHog is connected and capturing data, but the current state is incomplete and partly noisy:

- **Coverage gaps**: There is no dashboard for `/lp/*` landing pages (half the brief), no Web Vitals / page-performance dashboard, no uptime surface, and no experimentation surface. The lead-stream partial sends (`address_selected`, `partial_update`, `address_submit`) hit Postgres but never reach PostHog, so the partial-funnel — the most diagnostic part of CRO — is invisible.
- **Taxonomy drift**: `FORM_SUCCESS` is defined in `src/lib/analytics/events.ts` but never fired; success is implicitly modeled as `lead_submission`. The dashboards mix the two conventions, which makes funnels brittle.
- **Noise**: The auto-generated "My App Dashboard" (id `1499184`) is pinned but doesn't answer any business question, and several existing tiles overlap (e.g. multiple pageview totals).
- **No experimentation rails**: Zero feature flags exist, so even when CRO opportunities are obvious there is no path from "interesting drop-off" to "shipped A/B test".

The cost of leaving this is concrete: the team is spending PPC dollars into `/lp/*` pages without a per-page conversion view, can't tell whether a Lighthouse regression hurt conversions, and has no way to grade form variants (`quick`, `standard`, `full`, `multistep`) on a like-for-like basis.

## Proposed Solution

A five-dashboard suite, backed by a tightened event taxonomy and a small set of feature flags wired for experimentation. Each dashboard is scoped to a single recurring decision and capped at ~6–8 tiles.

| # | Dashboard | Decision it answers | Owner cadence |
|---|-----------|--------------------|---------------|
| 1 | **Executive Home** (replaces "My App Dashboard") | "Are leads up or down this week, and where is the change coming from?" | Daily glance |
| 2 | **Lead Funnel & CRO** (extends `Lead Capture Overview`) | "Where in the form is the biggest drop-off, and is it segment-specific?" | Weekly review |
| 3 | **Landing Pages — /lp** (new) | "Which PPC LP earns its spend, and which should be paused or rebuilt?" | Weekly with media buyer |
| 4 | **Performance & Web Vitals** (new) | "Is the site fast enough, and is performance hurting conversions?" | Weekly + on-incident |
| 5 | **Experimentation** (new) | "What is currently being tested, what won, what's queued next?" | Per-experiment |

Plus: a uniform event taxonomy fix, server-side capture of stream events, an A/B-test backlog seeded from current funnel evidence, and a small monitoring contract for uptime that explicitly delegates to Vercel + an external uptime probe (PostHog is not the right tool for true uptime).

## Technical Approach

### Architecture

```
                ┌──────────────────────────────┐
                │  Browser (PostHogInit)       │
                │  $pageview / $pageleave      │
                │  $web_vitals (auto)          │
                │  $rageclick (auto)           │
                │  form_*, popup_*, *_clicked  │
                │  lead_submission (success)   │
                │  partial_lead_stream (NEW)   │
                └──────────────┬───────────────┘
                               │
                               ▼
            ┌──────────────────────────────────────┐
            │  PostHog ingest (us.i.posthog.com)   │
            │  Project 393348                       │
            └──────────────┬───────────────────────┘
                           │
   ┌───────────────────────┼───────────────────────────────────┐
   ▼                       ▼                                   ▼
Dashboards              Feature Flags                     Session Recordings
(5)                     (experiments)                     (sampled)

Server-side (Vercel)
  └─ /api/leads/stream ──── posthog-node ──► partial_lead_stream
  └─ /api/leads        ──── posthog-node ──► lead_submission_server (idempotent backstop)

Uptime (out-of-band)
  └─ Vercel platform monitoring (deploy + function errors)
  └─ External probe (BetterStack / UptimeRobot) ──► annotation API ──► PostHog dashboards
```

Why this shape:

- **Browser is the source of truth for behavior**, but the form-stream events live server-side today. We mirror them to PostHog server-side so the partial funnel matches what hits Postgres. This avoids double-counting from a client mirror.
- **Uptime stays out-of-band**. PostHog "uptime" via pageview presence is a lagging proxy and easily lies during low-traffic hours. Vercel platform metrics + an external HTTP probe are the correct primary sources; we surface their state in PostHog only via annotations so the dashboards still tell a single story.
- **Experiments use PostHog feature flags**, evaluated client-side for hero-form variants and server-side for any pricing/copy logic that touches the API. AI Gateway / model routing is not in scope.

### Event Taxonomy (canonical)

The taxonomy is the contract every dashboard depends on. We finalize it before building tiles.

| Event | Where fired | Required props | Notes |
|-------|-------------|---------------|-------|
| `$pageview` | client (manual in `posthog-init.tsx:39`) | `$current_url`, `$pathname` | Already in place. Keep manual capture for SPA. |
| `$pageleave` | client (auto) | duration | Keep. Used for time-on-page. |
| `$web_vitals` | client (auto via `defaults: '2025-05-24'`) | `$web_vitals_LCP_value`, `_CLS_value`, `_INP_value`, `_FCP_value`, `_TTFB_value` | Already firing — use these. The custom `web_vital` constant in `events.ts` should be **removed** to avoid drift. |
| `$rageclick` | client (auto) | element, page | Already firing — surface as a noisy-UX signal. |
| `form_viewed` | client | `form_id`, `form_variant`, `page_type` (NEW), `page_url` | Add `page_type` ∈ {`home`, `lp`, `situation`, `location`, `landing`, `case_study`, `blog`, `other`} via small helper. Lets every funnel break down by page type without per-URL filtering. |
| `form_started` | client | `form_id`, `form_variant`, `first_field` | **Currently missing in flow** — defined in events.ts but not fired. Add to first-field-focus handler in `LeadForm`. |
| `form_field_completed` | client | `form_id`, `field_name`, `time_in_field_ms`, `step` (NEW for multistep) | Add `step` for multistep variant. |
| `form_validation_error` | client | `form_id`, `field_name`, `error_type` | Keep. |
| `form_submitted` | client | `form_id`, `form_variant`, `time_to_complete_ms`, `page_type` | Keep + `page_type`. |
| `lead_submission` | client (success) | `form_id`, `form_variant`, `lead_id`, `page_type`, `value_estimate?` | This is the **canonical conversion event**. All conversion-rate tiles use this. |
| `lead_submission_server` | server (`/api/leads`) | `lead_id`, `source` (n8n vs podio), `status` | Backstop in case client `lead_submission` is dropped (ad-blocker, mobile background). Use `lead_id` for de-duplication via `$insert_id`. |
| `partial_lead_stream` | server (`/api/leads/stream`) | `session_token`, `submission_type` ∈ {`address_selected`, `partial_update`, `address_submit`}, `fields_filled[]`, `page_type` | NEW. Lets the dashboards see partial form value without exposing PII (no name/phone/email in props). |
| `phone_clicked` | client | `phone_number`, `click_location`, `page_type`, `page_url` | Add `page_type`. |
| `sms_clicked` | client | identical shape to phone | Already fires. |
| `popup_viewed` / `popup_closed` / `popup_converted` | client | `trigger_type`, `page_type`, `time_on_page_ms` | Already firing. The deprecated `exit_intent_*` constants get deleted. |
| `cta_clicked` / `cta_viewed` | client | `cta_id`, `cta_text`, `page_type`, `page_url` | Defined but **not actually fired anywhere** (grep confirms). Either wire them (recommended for hero CTA, mobile CTA bar primary, situation-page CTA blocks) or delete from the constants file. Plan = wire on the four highest-visibility CTAs. |

**Identity model**: `person_profiles: 'identified_only'` is correct — keeps person count low. We identify on `lead_submission` using the `lead_id`. No change needed in `posthog-init.tsx`.

### Dashboard 1 — Executive Home

**Decision: "Are leads up or down this week, and where is the change coming from?"**

| Tile | Insight type | Notes |
|------|-------------|-------|
| Leads (7d, vs prior 7d) | BoldNumber trend with compareFilter | `lead_submission` count. Single number with delta. |
| Phone Clicks (7d, vs prior 7d) | BoldNumber | `phone_clicked` count. |
| Site-wide Conversion Rate (7d) | BoldNumber funnel | `$pageview` → `lead_submission` unique-user conversion. |
| Leads by Page Type (7d) | TRENDS bar | breakdown by `page_type`. |
| Leads by UTM Source (7d) | TRENDS bar | breakdown by `utm_source` (initial). |
| LCP p75 — Mobile Homepage (7d) | TRENDS line | `$web_vitals_LCP_value` p75, filtered to `device_type=Mobile` and homepage path. Single performance health number. |
| Anomaly annotations | Annotation strip | Deploys, downtime probes, Lighthouse regressions. |

Cap: 7 tiles. Anything else lives on a deeper dashboard.

### Dashboard 2 — Lead Funnel & CRO

**Decision: "Where is the biggest drop-off in the form, and is it segment-specific?"**

| Tile | Insight type | Notes |
|------|-------------|-------|
| Master funnel (30d) | FUNNELS | `$pageview` → `form_viewed` → `form_started` → `form_field_completed` (address) → `form_submitted` → `lead_submission`. Six steps. Show absolute + step conversion rate. |
| Funnel by `page_type` | FUNNELS breakdown | Same funnel, breakdown on `page_type`. Reveals where homepage vs `/lp` vs situation pages diverge. |
| Funnel by `form_variant` | FUNNELS breakdown | Quick / standard / full / multistep on a like-for-like basis. The tile that grades form variants. |
| Funnel by Device | FUNNELS breakdown | Mobile vs desktop. The mobile gap is usually the experiment goldmine. |
| Top validation errors (30d) | TRENDS table | `form_validation_error` by `field_name` + `error_type`. Identifies the specific fields people fail on. |
| Average time per field | TRENDS bar | `form_field_completed` p75 of `time_in_field_ms` by `field_name`. Long-tail fields are friction candidates. |
| Partial-form abandonment (30d) | FUNNELS | `partial_lead_stream:address_selected` → `lead_submission`. The "address-but-no-submit" cohort — your Podio fallback population. |
| Rage-click hot pages (30d) | TRENDS table | `$rageclick` by `$pathname`. Quick UX-pain finder. |

Cap: 8 tiles. Tiles 5–8 are the CRO accelerants — they exist specifically to feed the experimentation backlog.

### Dashboard 3 — Landing Pages (`/lp/*`)

**Decision: "Which PPC LP earns its spend, and which should be paused or rebuilt?"**

| Tile | Insight type | Notes |
|------|-------------|-------|
| LP Pageviews (30d) | TRENDS line, breakdown `$pathname` filtered to `^/lp/` | One line per LP. |
| LP Unique Visitors (30d) | TRENDS bar | DAU-style by LP path. |
| LP → Lead Conversion (30d) | FUNNELS breakdown by `$pathname` | Conversion rate per LP, side-by-side. The page that shouldn't exist becomes obvious. |
| LP CR by UTM Source × LP | TRENDS table | Two-dimensional: LP path × `utm_source`. Tells you when a *channel × LP* pair is the problem, not the LP itself. |
| LP CR by Device | FUNNELS breakdown | Per-LP mobile vs desktop CR. |
| Phone clicks per LP (30d) | TRENDS bar | `phone_clicked` filtered to LP paths. PPC LPs often convert by phone, not form. |
| LCP p75 per LP | TRENDS bar | `$web_vitals_LCP_value` p75 by `$pathname` (LP only). Pages that are slow + low CR are the highest-leverage rebuilds. |
| Time-to-first-form-interaction | TRENDS p75 | `form_started` event time minus `$pageview` time, scoped to LPs. Tells you if visitors are scrolling for the form. |

Cap: 8 tiles. All filters are templated on `$pathname matches "^/lp/"` so the dashboard is self-contained as new LPs get added.

### Dashboard 4 — Performance & Web Vitals

**Decision: "Is the site fast enough, and is performance hurting conversions?"**

| Tile | Insight type | Notes |
|------|-------------|-------|
| LCP p75 — Mobile vs Desktop (30d) | TRENDS line | Two series. Threshold annotation at 2500ms. |
| INP p75 — Mobile vs Desktop (30d) | TRENDS line | Threshold at 200ms. |
| CLS p75 — Mobile vs Desktop (30d) | TRENDS line | Threshold at 0.1. |
| TTFB p75 (30d) | TRENDS line | Server-side health proxy. |
| Worst pages by LCP p75 (30d) | TRENDS table | Filter `device_type=Mobile`, breakdown `$pathname`, top 10. |
| Web Vitals coverage | TRENDS bar | Count of `$web_vitals` events / count of `$pageview` events. Health check that vitals are still firing. |
| CR by LCP bucket (30d) | HogQL/TRENDS | Bucket users by their session's LCP (good / needs improvement / poor) and compare `lead_submission` rate. The single "does perf actually move conversions" tile. |
| Annotation strip | annotations | Deploys, Lighthouse plan completions, dependency upgrades. |

Cap: 8 tiles. All vitals tiles use the auto-captured `$web_vitals` event — no code changes required.

**Uptime is intentionally out of scope of this plan.** The team relies on Vercel platform monitoring (deploy health + function errors) for outages and on lead-rate anomalies in PostHog for "is the site working" signals. No external uptime probe is wired up — adding one would be operational burden without clear payoff at current traffic. Revisit if a real outage slips past Vercel monitoring.

### Dashboard 5 — Experimentation

**Decision: "What is currently being tested, what won, what's queued?"**

| Tile | Insight type | Notes |
|------|-------------|-------|
| Active experiments | static text tile | Names, hypotheses, primary metric, start date. Updated when a flag rolls. |
| Per-experiment CR (current rollouts) | FUNNELS breakdown by feature-flag value | One funnel per active flag. |
| Per-experiment confidence | PostHog Experiments view link | Stat-significance from PostHog's built-in tooling, embedded. |
| Backlog (text tile) | static text tile | Pulled from the A/B Test Backlog section of this plan; updated weekly. |

Cap: 4 tiles. This dashboard is intentionally thin — it's a status page, not analysis.

### A/B Test Backlog (seed list)

Pre-seeding the backlog so the suite ships with a clear "what to test next" answer. Each item is a hypothesis with a specific tile that triggers prioritization.

| # | Hypothesis | Triggering signal | Primary metric | Surface |
|---|-----------|-------------------|---------------|---------|
| 1 | Hero multistep form (current default) outperforms single-step on mobile but underperforms on desktop | Funnel-by-variant + funnel-by-device tiles | `lead_submission` rate, scoped to homepage | `flag: hero-form-variant` (multistep / single-step) |
| 2 | LP `/lp/we-buy-any-vegas-house` converts better with the testimonials block above the form on mobile | LP CR-by-device tile (mobile gap) + rage-click hot pages | `lead_submission` rate on that LP | `flag: lp-wbavh-layout` (form-first / proof-first) |
| 3 | Mobile CTA bar with prominent "Get Cash Offer" outperforms split call/text variant on `/lp/*` | Per-LP phone-click vs form-submission ratio | Combined conversions (phone + form) | `flag: mobile-cta-bar-variant` (commit `4239765` is the current variant) |
| 4 | Address-only quick form (step 1 only) for paid traffic outperforms multistep | Partial-form abandonment funnel: address-selected but no submit | `partial_lead_stream:address_submit` → `lead_submission` rate | `flag: lp-form-variant` |
| 5 | Replacing "Get Your Cash Offer" CTA copy with "See My Cash Offer" lifts CTR | `cta_clicked` rate by `cta_id` | `cta_clicked` → `form_started` | `flag: cta-copy-variant` |
| 6 | Reducing LCP on the homepage hero image from > 2500ms to < 2000ms lifts mobile CR by ≥ 5% | CR-by-LCP-bucket tile | `lead_submission` rate, mobile only | Not a flag — perf intervention; use annotation + before/after window |

The backlog is intentionally short and tied to specific tiles. Tests #1 and #4 are the highest-leverage starts because they touch the form (the largest drop-off in every site of this kind) and are cheap to set up.

### Implementation Phases

#### Phase 1 — Taxonomy fix + server capture (foundation)

Goal: every dashboard tile in later phases is built on canonical events with no drift.

- [x] Update `src/lib/analytics/events.ts`:
  - [x] Remove deprecated `EXIT_INTENT_*` constants (`events.ts:25-30`).
  - [x] Remove `WEB_VITAL` constant (rely on PostHog auto-`$web_vitals`).
  - [x] Remove `FORM_SUCCESS` constant (canonical = `lead_submission`).
  - [x] Add optional `page_type` to all relevant prop interfaces.
- [x] Add `getPageType(pathname: string): PageType` helper in `src/lib/analytics/page-type.ts` (new file). Pure function, table-driven from pathname patterns.
- [x] Inject `page_type` on every tracked event in `src/lib/analytics/form-analytics.ts`, `src/components/ui/phone-link.tsx:58`, `src/components/layout/mobile-cta-bar.tsx:21`, popup tracking.
- [x] Fire `form_started` on first-field-focus (now flows to PostHog via the gtag mirror).
- [x] Wire `cta_clicked` on the four highest-visibility CTAs (mobile CTA bar primary, CTA section, floating Calendly pill — hero CTA *is* the form, so form_viewed/form_started covers it).
- [x] Add `src/lib/analytics/server.ts` with a fetch-based `captureServer(distinctId, event, props)` helper (works on edge + node, no posthog-node dependency required).
- [x] In `src/app/api/leads/stream/route.ts`, after each Postgres write, call `captureServer(session_token, 'partial_lead_stream', { submission_type, fields_filled, page_type })`. PII rejected by allowlist.
- [x] In `src/app/api/leads/route.ts`, after the n8n/Podio write, call `captureServer(lead_id, 'lead_submission_server', { source, status })`. Uses `$insert_id = lead_id` so PostHog de-dupes against the client `lead_submission`.
- [ ] Verify in PostHog Live Events that all new events are landing with the right shape (post-deploy step).

Deliverable: a `docs/POSTHOG-EVENTS.md` reference doc that locks the taxonomy. ✅ Shipped.

Estimated effort: 1 focused day.

#### Phase 2 — Build dashboards 1–3 (traffic + funnel + LP)

- [x] Delete the auto-generated "My App Dashboard" (id `1499184`) — confirmed with user, deleted along with its 6 default insights.
- [x] Build **Executive Home** dashboard (id `1516532`) with 6 tiles: Leads (7d delta), Phone Clicks (7d delta), Site-wide CR, Leads by Page Type, Leads by UTM Source, LCP p75 Mobile Homepage. Annotation strip is automatic from project-level annotations.
- [x] Extend **Lead Funnel & CRO** dashboard (id `1500295`): added Top Validation Errors, Avg Time per Field, Partial-Form Abandonment Funnel, Rage-Click Hot Pages, Funnel by Form Variant, Funnel by Device. Pruned 6 redundant counter tiles. 7 tiles total (under cap of 8). Renamed to "Lead Funnel & CRO".
- [x] Build **Landing Pages — /lp** dashboard (id `1516558`) with 8 tiles: pageviews, unique visitors, LP→Lead conversion, CR by UTM, CR by device, phone clicks, LCP p75, form-engagement funnel.
- [x] Each dashboard's description starts with the "Decision it answers" sentence from this plan.
- [x] Pin Executive Home only; unpin Lead Capture Overview / Homepage Conversion / Traffic & Page Performance.
- [x] Fixed 5 existing insights that referenced the never-fired `form_success` event → `lead_submission` (canonical).

Estimated effort: half a day with MCP tooling.

#### Phase 3 — Performance dashboard

- [x] Build **Performance & Web Vitals** dashboard (id `1516592`) with 7 tiles: LCP/INP/CLS/TTFB p75 (mobile vs desktop), worst pages by mobile LCP, Web Vitals coverage health-check, and a HogQL "Conversion Rate by LCP Bucket" tile that buckets sessions Good / Needs improvement / Poor and shows lead conversion per bucket.
- [x] Uptime intentionally out of scope — Vercel platform monitoring is sufficient. No external probe, no annotation script.

Estimated effort: ~30 min via PostHog MCP.

#### Phase 4 — Experimentation surface

- [x] Build **Experimentation** dashboard (id `1516603`) with 2 tiles: `$feature_flag_called` exposure (by variant) and `lead_submission` count broken down by `$feature/hero-form-variant`. The A/B-test backlog from this plan stays in the dashboard description as a static reference.
- [ ] *(Deferred)* Create flags `hero-form-variant` and `lp-form-variant`, wire into `LeadForm`, run for 2 weeks. Punted because flag creation is a behavioral change that needs hypothesis sign-off — the dashboard is ready when you are.

Estimated effort to finish: 1 day setup + run window, when you're ready.

#### Phase 5 — Pruning + ownership

- [x] Pruned 6 redundant counter tiles + 6 default insights from "My App Dashboard" during Phase 2. Remaining saved insights are all attached to a current dashboard.
- [x] Tag taxonomy applied: `core`, `homepage`, `lp`, `funnel`, `cro`, `perf`, `web-vitals`, `experiment`, `lead-gen`, `ppc`.
- [x] Owner email (jason@whitespacesolutions.ai) is in each dashboard's description.
- [ ] Monthly review cadence — set a calendar invite manually; out of scope of this plan.

Estimated effort: complete.

## Alternative Approaches Considered

1. **One mega-dashboard.** Rejected — it's the noisy state we are explicitly avoiding. A single team member's "summary" is another's "I have to scroll past four tiles to find what I need."
2. **Push uptime into PostHog via pageview presence.** Rejected — pageview gaps are dominated by traffic shape, not site availability. A real probe is required; doing this poorly is worse than not doing it.
3. **Skip server-side capture for `partial_lead_stream`, mirror it client-side.** Rejected — would double-count whenever a client is online, and the partial-funnel value depends on matching what hits Postgres exactly.
4. **Use GA4 / Clarity for funnel and skip PostHog dashboards.** Rejected — GA4's free tier sampling is hostile to small-volume funnels at this site's scale, and Clarity is a session-replay tool, not an experiment platform. PostHog is the only place all three (events + funnels + experiments) live together.
5. **Buy a CRO product (VWO / Optimizely).** Rejected for now — overkill at current traffic. PostHog Experiments is sufficient for the first 6–12 months of testing.

## Acceptance Criteria

### Functional Requirements

- [ ] Five dashboards exist in PostHog project `393348` with the exact names: `Executive Home`, `Lead Funnel & CRO`, `Landing Pages — /lp`, `Performance & Web Vitals`, `Experimentation`.
- [ ] Each dashboard has a description starting with the "Decision it answers" sentence from this plan.
- [ ] Each dashboard contains tiles matching the tables in §Technical Approach (within ±1 tile per dashboard).
- [ ] Default "My App Dashboard" is deleted (or explicitly retained with user consent).
- [ ] `partial_lead_stream` and `lead_submission_server` events are firing from the API routes; verifiable in Live Events.
- [ ] `form_started` is firing on every form first-field focus.
- [ ] All in-flight tracked events carry a `page_type` property.
- [ ] Two feature flags (`hero-form-variant`, `lp-form-variant`) exist with experiments configured and traffic flowing.
- [ ] `docs/POSTHOG-EVENTS.md` is checked in and lists every event with its required props.
- [ ] `docs/MONITORING-PLAN.md` is updated with the uptime contract.

### Non-Functional Requirements

- [ ] No tile takes longer than 5 seconds to render at default 30-day window.
- [ ] No PII (`name`, `email`, `phone`, `address`) lands in any PostHog event payload — auditable via grep on server.ts and form-analytics.ts.
- [ ] Adding a new `/lp/*` page requires zero dashboard changes (filters are pattern-based).
- [ ] Each dashboard tile has a one-sentence description explaining what decision it informs.

### Quality Gates

- [ ] Spot-check: open each dashboard cold and verbalize the decision each tile drives. Any tile that fails this gets cut.
- [ ] PostHog query cost per dashboard refresh stays under reasonable limits (no full-table HogQL scans without date filters).
- [ ] At least one dry-run experiment (could be a no-op flag) confirms the experimentation pipeline works end-to-end before flag #1 ships.

## Success Metrics

- **Time-to-decision**: a media buyer asking "should we pause `/lp/X`?" reaches an answer in under 60 seconds without writing a query.
- **Experiment cadence**: at least one A/B test launched within 30 days of Phase 4, and a sustained cadence of one test per month thereafter.
- **Funnel lift**: site-wide `$pageview → lead_submission` conversion rate improves by ≥ 10% within 90 days of Phase 4 (cumulative across tests).
- **Dashboard usage**: Executive Home `last_viewed_at` updates at least 5 days/week (telemetry already in PostHog dashboard metadata).

## Dependencies & Prerequisites

- PostHog project `393348` (in place).
- PostHog MCP server (in place — used to provision dashboards).
- `NEXT_PUBLIC_POSTHOG_KEY` env var (already set; reused server-side by the fetch-based `captureServer` helper, no separate `posthog-node` install needed).

## Risk Analysis & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Server-side capture leaks PII | Low | High | Allowlist of permitted props in `captureServer`; lint rule rejecting `email/name/phone` keys. |
| Double-counted conversions (client + server) | Medium | Medium | Use `$insert_id = lead_id` for server event; explicit de-dup in funnel queries. |
| Experiments contaminated by short session windows | Medium | High | Stratify by device + traffic source; wait for ≥ 1000 conversions per arm before reading. Document MDE up front. |
| Dashboard sprawl returns | High over time | Medium | Phase 5 prune step + monthly audit; cap on "pinned" dashboards = 1. |
| PostHog ingest costs grow | Low at current volume | Low | `person_profiles: 'identified_only'` already in place; revisit if event volume crosses 1M/mo. |
| Low traffic on individual `/lp/*` pages → noisy CR | Medium | Medium | LP dashboard surfaces volume alongside CR; CR tiles default to 30d window; flag any LP with < 100 sessions/30d as "insufficient data" via tile description. |
| Vercel monitoring misses an outage | Low–Medium | High | Watch lead-rate anomaly on Executive Home; if missing leads for > 1 hour during business hours, manually verify the site. Revisit external probe if this happens. |

## Resource Requirements

- ~1 engineering day for phases 1–3 + the Experimentation dashboard (delivered).
- 1 day to wire flags + run experiments when ready (deferred).
- $0 incremental cost — PostHog seat already provisioned, no third-party services.

## Future Considerations

- Once experiments mature, graduate to PostHog **Experiments** (built-in stat-sig + stop-loss) rather than raw flag-funnels.
- Add **session-recording sampling** scoped to high-value cohorts (visitors who hit `form_validation_error` ≥ 2x in a session). Will require revisiting `disable_surveys: true` in `posthog-init.tsx` and budgeting for the storage.
- Add **Slack alert** on `lead_submission` rate dropping > 30% week-over-week (PostHog → Slack via Subscriptions). Out of scope of this plan.
- Add **GSC integration** dashboard once Google Search Console data starts feeding PostHog (PostHog has a beta integration as of 2025 — verify availability).
- AI-search visibility tracking (GEO / SGE citations) is out of scope here but a natural next dashboard once the SEO team starts producing AI-citation-tracked content.

## Documentation Plan

- `docs/POSTHOG-EVENTS.md` — canonical event taxonomy (NEW; shipped in Phase 1).
- `docs/EXPERIMENTS.md` — running list of experiment hypotheses, results, and learnings (create when first flag rolls).
- `CLAUDE.md` — short section pointing future contributors at `docs/POSTHOG-EVENTS.md` so new tracking doesn't drift.

## References & Research

### Internal References

- `src/components/posthog-init.tsx:18-25` — current PostHog client config (SPA pageview, `defaults: '2025-05-24'` already enables auto Web Vitals + heatmaps).
- `src/lib/analytics/events.ts` — event constants (taxonomy fixes target this file).
- `src/lib/analytics/form-analytics.ts:21-136` — current form-tracking call sites; canonical `lead_submission` is fired from `form-analytics.ts:123`.
- `src/components/ui/phone-link.tsx:58` — phone-click capture site (needs `page_type` prop).
- `src/components/layout/mobile-cta-bar.tsx:21` — SMS-click capture site.
- `src/app/api/leads/stream/route.ts` — partial-lead webhook target (server-side capture goes here).
- `src/app/api/leads/route.ts` — full-submission endpoint (server-side conversion backstop goes here).
- Existing PostHog dashboards already created: Lead Capture Overview (`1500295`), Homepage Conversion (`1500297`), Traffic & Page Performance (`1500298`).
- CLAUDE.md > "Lead Generation" section — describes the streaming + fallback architecture this plan instruments.
- `docs/MONITORING-PLAN.md` — already drafted (uncommitted in git status), extended in Phase 3.

### External References

- PostHog Web Vitals docs (auto-capture via `defaults: '2025-05-24'`): <https://posthog.com/docs/libraries/js#web-vitals-autocapture>
- PostHog Experiments: <https://posthog.com/docs/experiments/manual>
- PostHog Annotations API: <https://posthog.com/docs/api/annotations>
- Core Web Vitals thresholds (LCP 2500 / INP 200 / CLS 0.1): <https://web.dev/articles/vitals>

### Related Work

- Plan: `docs/plans/2026-04-11-fix-lighthouse-mobile-performance-plan.md` — Performance dashboard tiles consume the output of this plan.
- Plan: `docs/plans/2026-02-17-feat-form-heartbeat-partial-lead-capture-plan.md` — original spec for the streaming events that Phase 1 mirrors to PostHog.
- Plan: `docs/plans/2026-03-09-feat-behavioral-popup-form-triggers-plan.md` — popup events the dashboards already consume.
- Recent commits affecting CTA/form behavior on mobile: `4215d2f`, `4239765`, `c07d95a` — relevant when interpreting mobile-vs-desktop funnel splits.
