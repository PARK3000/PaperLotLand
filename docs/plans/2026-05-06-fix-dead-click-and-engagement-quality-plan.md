---
title: Dead-Click & Engagement Quality Remediation
type: fix
date: 2026-05-06
related_solutions:
  - docs/solutions/ui-bugs/focus-outline-css-cascade-layers-Hero-20260303.md
---

# Dead-Click & Engagement Quality Remediation

## Overview

Microsoft Clarity's Data Export API (project `rk2y22s3b5`) reveals three pages with dead-click rates of **42%–100%** and one site-wide hero pattern that drives ~22% dead clicks across all 12 LPs. The Cloudbot weekly digest the team has been operating on materially mis-reported these numbers — flagging healthy pages and missing broken ones. This plan ships the fixes and verifies impact; the digest-replacement question is deferred to a follow-up plan only if needed.

Two phases:

1. **Phase 1 — Hero pill click target.** Wrap the hero address input column in `<label htmlFor>`. One diff, propagates to homepage + 12 LPs.
2. **Phase 2 — Investigate and fix three confirmed-broken pages.** `/careers/apply/`, `/careers/closing-coordinator/`, `/contact-us/` — make icon circles, CTA cards, and form labels actually clickable.

7-day post-deploy verification via Clarity dashboard. PostHog `$dead_click` autocapture is held in reserve as a contingency only if Phase 1 doesn't move the LP numbers.

## Problem Statement / Motivation

### Current state (Clarity, last 3 days, by base URL)

| URL | Sessions | Dead Clicks | DC% | Rage | Avg Scroll |
|---|---:|---:|---:|---:|---:|
| `/careers/apply/` | 6 | 6 | **100.0%** | 0 | 53 |
| `/careers/closing-coordinator/` | 19 | 16 | **84.2%** | 1 | 47 |
| `/contact-us/` | 7 | 3 | **42.9%** | 0 | 46 |
| `/lp/companies-that-buy-houses-for-cash/` | 37 | 13 | 35.1% | 0 | 29 |
| `/lp/sell-my-house-fast/` | 299 | 67 | **22.4%** | 0 | 32 |
| `/lp/sell-my-house-for-cash-vegas/` | 105 | 19 | 18.1% | 0 | 49 |
| `/` (homepage) | 99 | 10 | 10.1% | 0 | 15 |
| `/lp/cash-offer-for-my-house/` | 50 | 0 | 0.0% | 0 | 32 |

### Cloudbot vs. reality

| URL | Cloudbot | Actual | Error |
|---|---:|---:|---|
| `/lp/sell-my-house-fast/` | 13.9% | 22.4% | Understated |
| `/lp/cash-offer-for-my-house/` | 8.8% / 17.5% (contradicts itself) | 0.0% | Both wrong |
| `/lp/companies-that-buy-houses-for-cash/` | 3.4% | 35.1% | Understated 10× |
| `/contact-us/` | "best on site ✅" | 42.9% | Inverted |
| `/careers/apply/` | not flagged | 100% | Missed |
| `/careers/closing-coordinator/` | not flagged | 84% | Missed |

### Why now

- `/careers/apply/` is 100% broken. Job applicants can't apply. Unknown duration.
- LP dead clicks waste paid ad spend (`/lp/sell-my-house-fast/` alone ≈ 36k sessions/yr).
- Clarity API access is now wired (May 2026); validation is fast.

## Proposed Solution

### Phase 1 — Hero pill click target

**File**: `src/components/sections/hero-form.tsx:256-292`. Also touches `src/components/ui/address-autocomplete-input.tsx` (verify `id` prop honored).

```tsx
// Current
<div className="relative flex items-center overflow-visible rounded-xl bg-white p-1 shadow-lg">
  <div className="min-w-0 flex-1">
    <AddressAutocompleteInput name="address" variant="bare" ... />
  </div>
  <button type="submit">Get My Offer</button>
</div>

// Proposed
<div className="relative flex items-center overflow-visible rounded-xl bg-white p-1 shadow-lg">
  <label htmlFor="hero-address" className="min-w-0 flex-1 cursor-text">
    <AddressAutocompleteInput
      id="hero-address"            // explicit; auto-derived id is undefined
      name="address"
      variant="bare"
      ...
    />
  </label>
  <button type="submit">Get My Offer</button>
</div>
```

**Constraints**:

1. `<label>` wraps the input column only — not the submit button (nested interactive elements double-fire and are invalid HTML).
2. Pass explicit `id="hero-address"`. Auto-derived `inputId` in `address-autocomplete-input.tsx:72` is `undefined` when no `label` prop is passed.
3. `AddressAutocompleteInput` is currently the only labeling source for the input. The `<label>` should have **no text content** (it's a hit-target wrapper, not an accessible name source). Don't add `aria-hidden` to the `<label>` — that breaks accessible-name resolution if the input later relies on `htmlFor`.
4. Suggestion dropdown uses `onMouseDown` + `preventDefault` (`address-autocomplete-input.tsx:369-372`); label-wrap doesn't break it.

#### Alternative considered: input-fills-pill via `absolute inset-0`

Rather than introduce a `<label>`-as-layout pattern, render the `<input>` as `absolute inset-0` over a pseudo-element rendering the visible chrome. Sidesteps the autocomplete-sibling concern entirely.

**Rejected** because: the autocomplete dropdown is positioned relative to `wrapperRef` inside `AddressAutocompleteInput`. Stretching the input absolute would require restructuring the autocomplete component itself and its dropdown positioning — much larger blast radius. The `<label>` approach changes one file and uses a primitive HTML feature.

### Phase 2 — Critical bug fixes

Investigation-first. Don't fix selectors blind.

#### 2a. Investigate (1.5 hrs)

For each of `/careers/apply/`, `/careers/closing-coordinator/`, `/contact-us/`:

1. Open Clarity dashboard → Insights → Dead Clicks → filter to URL → last 7 days.
2. Watch 2–3 dead-click recordings; identify top inert selector(s).
3. Cross-reference with code. Suspect targets per repo research:
   - `/careers/closing-coordinator/` (`src/app/(site)/careers/[slug]/page.tsx`): amber Apply CTA card border (line 178 only inner `<a>` is clickable), decorative SVGs, `<dt>/<dd>` Job Details rows.
   - `/contact-us/` (`src/app/(site)/contact-us/contact-page-client.tsx:173-295`): phone/email/service-area icon circles look clickable but only inner `<a href="tel:">`/`<a href="mailto:">` is.
   - `/careers/apply/` (`src/components/sections/applicant-form.tsx`): suspect `<label>` elements without `htmlFor`, file upload drop zone hit area.

**Two-of-three evidence rule before fixing each selector**:
- (a) Clarity recording shows the dead click, AND
- (b) code review confirms element is non-interactive, AND/OR
- (c) rage/quick-back click co-occurs nearby.

Avoids chasing n=1 ghosts on small-sample pages.

#### 2b. Fix (4–6 hrs total)

| Page | Likely fix |
|---|---|
| `/careers/apply/` | Audit every `<label>` in `applicant-form.tsx` for `htmlFor` matching input `id`. Ensure file upload drop zone is wrapped by `<label>` (not just sibling). |
| `/careers/closing-coordinator/` | Make entire amber Apply CTA card clickable via `before:absolute before:inset-0` pattern with single inner `<Link>`. Add `pointer-events: none` to decorative SVGs. |
| `/contact-us/` | Wrap each contact method (phone/email/service area) — icon circle + heading + body — in a single `<a href>`, not just the inner text. |

### Verification (Phase 1 + 2)

1. **Pre-deploy baseline**: snapshot current Clarity digest to `seo/clarity/baseline-2026-05-06.json` before merging Phase 1 or 2.
2. Wait 7 days post-deploy.
3. Pull Clarity API for last 3 days, compare against baseline.
4. **Decision**: if `/lp/sell-my-house-fast/` DC% drops to <12%, hypothesis confirmed and we're done. If unchanged, enable PostHog `$dead_click` autocapture (contingency, scope expansion approved separately).

## Acceptance Criteria

### Phase 1

- [ ] `<label htmlFor="hero-address">` wraps only the input column. Submit button remains outside.
- [ ] `AddressAutocompleteInput` receives explicit `id="hero-address"` prop.
- [ ] Playwright test: click each of the four corners of the white pill bounding box (excluding the submit button rect); assert `document.activeElement` is `input#hero-address`.
- [ ] Autocomplete dropdown still appears on typing; suggestions clickable.
- [ ] Visual regression: screenshot homepage and one LP at 320/768/1280px before/after; no diffs outside the pill area.
- [ ] `axe-core` clean on homepage and one LP (no new violations).

### Phase 2

- [ ] Each of the three URLs has its top dead-click selector(s) identified via Clarity recordings (documented in PR description).
- [ ] `/careers/apply/`: at least one successful end-to-end submission post-fix lands in Postgres `applicants` table. Honeypot still rejects automated bot submissions (regression check).
- [ ] `/careers/closing-coordinator/`: clicking anywhere on the amber Apply CTA card navigates to `/careers/apply/?position=closing-coordinator`.
- [ ] `/contact-us/`: clicking any icon circle (phone, email, service area) opens dialer/mail/maps.

### Verification

- [ ] Pre-deploy baseline JSON committed to `seo/clarity/`.
- [ ] 7-day post-deploy delta written to `seo/clarity/2026-MM-DD-impact.md`.
- [ ] Specific selectors named in PR description no longer appear in post-deploy Clarity dead-click recordings.

## Success Metrics

For careers pages with n<30/week, **don't gate on percentage**. Gate on (a) specific selectors disappearing from dead-click recordings, and (b) at least one successful end-to-end submission in Postgres post-deploy.

For higher-volume pages (n≥99/week), gate on percentage:

| URL | Pre-deploy DC% | Target DC% (7-day) |
|---|---:|---:|
| `/lp/sell-my-house-fast/` | 22.4% | <12% |
| `/lp/sell-my-house-for-cash-vegas/` | 18.1% | <12% |
| `/` (homepage) | 10.1% | <7% |

Site-wide DC% drops from 6.4% → <4%.

## Rollback Plan

Phase 1 ships as a single commit. Revert path: `git revert <sha>` — affects only `hero-form.tsx`. Phase 2 ships as one commit per page (`fix(careers): hit area on apply CTA`, etc.) so each page can be reverted independently. No feature flag needed; the changes are pure HTML/CSS structure.

## Risk Analysis

| Risk | Mitigation |
|---|---|
| `<label>`-wrap breaks autocomplete dropdown | Manual + Playwright test of suggestions before merge |
| Tailwind v4 cascade-layer regression on hero focus outline | Visual regression check; reference `docs/solutions/ui-bugs/focus-outline-css-cascade-layers-Hero-20260303.md` |
| Sample-size noise on careers pages (n=6) | Two-of-three evidence rule before fixing each selector; metrics gated on selector disappearance + successful submission, not percentage |
| Phase 1 hypothesis wrong (LP DC% unchanged) | Fix is correct UX regardless. Contingency: enable PostHog `$dead_click` autocapture; scope expansion separately |

## Resource Requirements

| Phase | Time |
|---|---|
| Phase 1 (hero pill) | 1.5 hrs |
| Phase 2a (investigation) | 1.5 hrs |
| Phase 2b (three page fixes) | 4–6 hrs |
| Verification (after 7 days) | 30 min |
| **Total** | **7.5–9.5 hrs**, calendar time ~2 weeks (waiting on measurement window) |

## Documentation Plan

Single solutions doc after both phases ship:

- `docs/solutions/ui-bugs/2026-MM-DD-click-target-hit-area-patterns.md` — covers (1) `<label>`-wrap-input-only for styled pills, with "when NOT to use" (don't wrap buttons or other interactive elements), and (2) `before:absolute before:inset-0` for full-card-as-link.

## References

### Internal

- `src/components/sections/hero-form.tsx:256-292` — pill wrapper to fix
- `src/components/ui/address-autocomplete-input.tsx:72` (auto-derived id), `:354` (dropdown), `:369-372` (mousedown handler)
- `src/components/sections/hero.tsx:58` — `<HeroForm>` mount
- `src/components/templates/landing-page.tsx:74` — LP `<Hero variant="inline-form">`
- `src/app/(site)/page.tsx:71` — homepage `<Hero>`
- `src/components/sections/applicant-form.tsx` — careers/apply form
- `src/app/(site)/careers/[slug]/page.tsx:178` — Apply CTA card
- `src/app/(site)/contact-us/contact-page-client.tsx:173-295` — icon circles
- `docs/solutions/ui-bugs/focus-outline-css-cascade-layers-Hero-20260303.md` — Tailwind v4 cascade gotcha

### External

- Clarity dashboard: https://clarity.microsoft.com/projects/view/rk2y22s3b5/dashboard
- Clarity Data Export API: https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-data-export-api
- HTML `<label>` semantics: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/label

## Follow-up (not in scope)

If, after 7-day verification, the team wants:
- An automated weekly Clarity digest replacing Cloudbot, OR
- Selector-level dead-click data via PostHog `$dead_click` autocapture,

file a separate plan justified by what the verification window actually showed.
