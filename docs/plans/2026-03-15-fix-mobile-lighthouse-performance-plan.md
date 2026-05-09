---
title: "fix: Mobile Lighthouse Performance (Score 39 → 75+)"
type: fix
date: 2026-03-15
---

# fix: Mobile Lighthouse Performance (Score 39 → 75+)

## Overview

The homepage scores **39 on mobile Lighthouse** with catastrophic Core Web Vitals: FCP 7.4s, LCP 14.4s, TBT 760ms, Speed Index 8.6s. CrUX data shows real users experiencing LCP 3.6s (orange) and FCP 3.4s (red).

The JS treemap reveals the root cause distribution clearly:

| Source | Size | % of 1.6 MiB Total |
|--------|------|---------------------|
| YouTube embed (player + embed JS) | 722.9 KiB | **44%** |
| GTM cascade (GA4 + Google Ads + LiveChat + GTM core) | 578 KiB | **35%** |
| Next.js app code | ~107 KiB | **7%** |
| Other 3rd party (ClickCease, Clarity, Bing, CallRail) | ~100 KiB | **6%** |

**Key insight**: 86% of JavaScript is third-party scripts. The app code itself is only 107 KiB. Optimizations must focus on script loading strategy and reducing hydration cost, not app code size.

## Problem Statement

Three independent bottlenecks create the score of 39:

1. **LCP 14.4s** — The hero background image is the LCP element, but it's trapped inside a 538-line `'use client'` component (`hero.tsx`). The image can't paint until the client JS bundle downloads, parses, and hydrates. Even though Next.js SSRs the HTML, the browser delays image rendering until hydration completes for client components.

2. **TBT 760ms** — YouTube iframe loads 722 KiB of JS that competes with page hydration. GTM cascades into 5 additional scripts (578 KiB). The MobileCTABar scroll handler fires on every scroll event without throttling. Combined, these block the main thread for nearly a second.

3. **FCP 7.4s** — Font loading with `display: 'optional'` causes invisible text on slow 3G (font fails to load within 100ms window). GTM + analytics scripts loaded with `afterInteractive` block rendering. Seven preconnect hints create unnecessary DNS/TLS overhead.

## Proposed Solution

A phased approach targeting each bottleneck with the highest-impact fixes first.

---

## Technical Approach

### Phase 1: Critical Path Fixes (Estimated impact: Score 39 → 60+)

These changes directly address the three bottleneck categories and require minimal refactoring risk.

#### 1.1 YouTube Facade Pattern ✅ ALREADY IMPLEMENTED

**File**: `src/components/sections/video-section.tsx`
**Impact**: Eliminates 722.9 KiB (44%) of JS from initial load.

Replaced eager YouTube iframe with click-to-play thumbnail. Uses `hqdefault.jpg` from `i.ytimg.com` with a play button overlay. Iframe only loads when user clicks.

#### 1.2 Third-Party Script Deferral ⚠️ NEEDS CORRECTION

**File**: `src/app/layout.tsx`
**Impact**: Defers 578+ KiB of GTM cascade JS from blocking initial render.

**Current state (already changed)**: ALL scripts set to `lazyOnload`.

**CORRECTION NEEDED**: GTM must use `afterInteractive`, not `lazyOnload`. Research confirmed that:
- `lazyOnload` uses `requestIdleCallback`, which on slow mobile can delay GTM by 5-10+ seconds
- The Gravity Forms compatibility layer pushes `gtm.formSubmit` auto-events to `dataLayer` — these may NOT be retroactively processed by GTM if it hasn't initialized its auto-event listeners yet
- GA4 pageview tags fire from GTM — `lazyOnload` will under-count pageviews on fast sessions
- Google Ads conversion tags fire from GTM — missed conversions directly impact ROAS measurement

**Correct strategy**:

| Script | Current | Correct Strategy | Reason |
|--------|---------|-----------------|--------|
| GTM | `lazyOnload` | `afterInteractive` | Conversion tracking accuracy, auto-event replay |
| Ahrefs (x2) | `lazyOnload` | `lazyOnload` ✅ | Low-priority analytics |
| LiveChat | `lazyOnload` | `lazyOnload` ✅ | Already has `requestIdleCallback` wrapper |
| CallRail | `lazyOnload` | `afterInteractive` | Phone call attribution for PPC ROAS |
| ClickCease (x2) | `lazyOnload` | `lazyOnload` ✅ | Click fraud detection, not time-sensitive |

**Why CallRail needs `afterInteractive`**: CallRail's `swap.js` replaces static phone numbers with tracked dynamic numbers. With `lazyOnload`, users see the static number for 5-10+ seconds on slow mobile. If they call during this window, the call is unattributed — directly impacting PPC ROAS calculations. Phone numbers appear in 5+ locations (Header, MobileCTABar, Footer x2, CTASection).

**Preconnect cleanup** ✅ ALREADY IMPLEMENTED:
- Removed preconnects to `cdn.callrail.com` and `www.googletagmanager.com` (unnecessary overhead when scripts are deferred)
- Kept preconnect to `fonts.gstatic.com` (needed for font loading)

#### 1.3 Font Loading Fix ✅ ALREADY IMPLEMENTED

**File**: `src/app/layout.tsx`
**Impact**: Eliminates invisible text on slow connections.

Changed Manrope font from `display: 'optional'` to `display: 'swap'`. Next.js `adjustFontFallback: true` generates `size-adjust` CSS to minimize CLS during the swap.

#### 1.4 Header Scroll Throttling ✅ ALREADY IMPLEMENTED

**File**: `src/components/layout/header.tsx`
**Impact**: Reduces TBT by ~50-100ms.

Added `requestAnimationFrame` throttling + `{ passive: true }` listener options.

#### 1.5 MobileCTABar Scroll Throttling — NOT YET DONE

**File**: `src/components/layout/mobile-cta-bar.tsx` (line 17)
**Impact**: Reduces TBT by ~50ms on mobile specifically.

The spec-flow analysis caught this: the MobileCTABar has the **same unthrottled scroll handler problem** as the Header, but it was missed in the initial fix. This component is mobile-only (`lg:hidden`), so it directly affects the mobile Lighthouse score.

**Fix**: Apply identical `requestAnimationFrame` throttling + `{ passive: true }` pattern.

#### 1.6 Dynamic Imports for Below-Fold Sections ✅ ALREADY IMPLEMENTED

**File**: `src/app/page.tsx`
**Impact**: Code-splits JS into separate chunks (~30-50ms TBT reduction).

11 below-fold sections now use `next/dynamic` with `ssr: true` (default). HTML is still server-rendered for SEO, but JS is split into separate chunks that load in parallel.

**Limitation noted by research**: With `ssr: true`, the JS chunks are still downloaded during hydration (not scroll-deferred). The benefit is parallel loading of smaller chunks rather than one monolithic bundle. True scroll-deferral would require an Intersection Observer wrapper — but the ROI is minimal given app code is only 7% of total JS.

#### 1.7 LeadCapturePopup Lazy Load ✅ ALREADY IMPLEMENTED

**File**: `src/app/layout.tsx`
**Impact**: Removes 708-line InlineLeadForm from initial bundle.

Dynamic import of the popup component. Since the popup only shows on exit intent/idle/scroll-stall, its JS is not needed during initial load.

---

### Phase 2: Component Architecture Fixes (Estimated impact: Score 60 → 70+)

These changes require moderate refactoring but address structural issues that limit how much Phase 1 can improve LCP.

#### 2.1 Hero Component Split — Server Shell + Client Island

**Files**: `src/components/sections/hero.tsx` → split into `hero.tsx` (server) + `hero-form.tsx` (client)
**Impact**: LCP improvement — hero image renders in server HTML before JS hydration.

**The core problem**: The entire Hero is `'use client'` (538 lines). The LCP image (`hero-bg.jpg`) is rendered inside this client component. Even though Next.js SSRs the HTML, the browser delays committing the image to the screen until the client component hydrates. On slow mobile (simulated 4G in Lighthouse), this means the image waits for the full 107 KiB app bundle to download and parse.

**Split boundary**:

Server Component (`hero.tsx`) — NO `'use client'`:
- Background `<Image>` with `priority` (LCP element)
- `<h1>` headline + `<h2>` subtitle
- Trust line text ("Vegas' Most Trusted Home Buyer since 2016")
- Trust badges (Google Reviews image, BBB badge image)
- Renders `<HeroForm>` as a child (client island)

Client Component (`hero-form.tsx`) — `'use client'`:
- `useLeadStream` hook
- `useFormAnalytics` hook
- `useUrlPrefill` hook
- `useRouter` (for redirect variant)
- `AddressAutocompleteInput` component
- All form state (`address`, `error`, `step`, `isSubmitting`, etc.)
- Step 1 address form + Step 2 contact form (inline-form variant)

**Hydration gap behavior**: The address input will be visible in the server HTML but not interactive until `hero-form.tsx` hydrates. This is acceptable because:
- The input renders with a placeholder ("Enter Your Home Address")
- Users on slow connections will see the input but it won't respond to keystrokes for 1-2 seconds
- This is better than the current state where the ENTIRE hero (including the LCP image) waits for hydration
- No skeleton/loading state needed — the form looks identical before and after hydration

**Props to pass through**: The server Hero passes `variant`, `googleRating`, `googleCount`, and `location` as props. The client HeroForm receives `variant` (to determine redirect vs inline behavior).

**Risk: `leadStream.cancel()` missing in redirect variant**: The spec-flow analysis found that `handleRedirectSubmit` (line 118) calls `leadStream.onAddressSubmit()` but never calls `leadStream.cancel()` before `router.push()`. The 10-second streaming interval continues during navigation, potentially causing orphaned requests. **Fix**: Add `leadStream.cancel()` before the router push.

#### 2.2 Remove Unnecessary `'use client'` Directives

**Impact**: Removes ~374 lines of JS from client bundle.

| Component | Lines | Safe? | Notes |
|-----------|-------|-------|-------|
| `about-section.tsx` | 91 | ✅ Yes | Zero hooks, pure render with Image + Link |
| `media-logos.tsx` | 101 | ✅ Yes | Zero hooks, pure render with Image |
| `cta-section.tsx` | 110 | ✅ Yes | Zero hooks, uses Link + `<a href="tel:">` (no onClick) |
| `location-map.tsx` | 72 | ✅ Yes | Zero hooks, just iframe + static content |
| `footer.tsx` | 199 | ❌ No | Uses `usePathname()` for landing page detection |

**Footer fix**: Cannot remove `'use client'` because of `usePathname()`. Two options:
1. Pass `isLandingPage` as a prop from `layout.tsx` (requires layout to know the route — not straightforward in App Router)
2. Extract the `usePathname()` check into a tiny client wrapper component that conditionally renders the Footer content

**Recommended**: Option 2 — create a `FooterWrapper` client component (~10 lines) that handles the conditional, while the Footer content itself becomes a server component.

#### 2.3 Google Maps Iframe Facade

**File**: `src/components/sections/location-map.tsx`
**Impact**: Eliminates Google Maps iframe JS from initial load.

**Current state**: The iframe has `loading="lazy"` but:
- Safari on iOS < 16.4 does not support `loading="lazy"` on iframes
- The component is `'use client'` unnecessarily (Phase 2.2 fixes this)

**Facade design**: Match the YouTube facade pattern:
- Show a static screenshot of the Google Maps embed (saved as WebP in `/public/images/`)
- Overlay a "View Interactive Map" button
- On click/hover, replace with the real iframe
- Since `location-map.tsx` is being converted to a server component (Phase 2.2), the facade click handler needs a small client wrapper

---

### Phase 3: Polish & Optimization (Estimated impact: Score 70 → 75+)

Lower-impact optimizations that collectively add 5-10 points.

#### 3.1 Cache Headers for Static Assets

**File**: `next.config.ts` — add `headers()` function
**Impact**: Faster repeat visits, reduced server load.

```typescript
async headers() {
  return [
    {
      source: '/images/:path*',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
      ],
    },
  ]
}
```

Note: `/_next/static/` assets are already cached with `immutable, max-age=31536000` by Next.js/Vercel. This only affects `/public/images/` files.

#### 3.2 Remove Redundant `fetchPriority="high"` from Hero Image

**File**: `src/components/sections/hero.tsx` (line 466)
**Impact**: Cleanup only — `priority` already sets `fetchPriority="high"` internally.

#### 3.3 Image Optimization Config ✅ ALREADY IMPLEMENTED

**File**: `next.config.ts`
**Impact**: Better mobile image serving.

Added explicit `deviceSizes` and `imageSizes` for mobile-optimized image generation.

#### 3.4 Popup Trigger System Optimization

**File**: `src/lib/hooks/use-popup-triggers.ts`
**Impact**: Minor TBT reduction on mobile.

The popup registers 7 event listeners on mount (scroll, mousemove, click, touchstart, keydown, mouseleave, visibilitychange). On mobile, the `mouseleave` exit-intent listener is unnecessary (no mouse cursor on touch devices). Consider skipping it based on `window.matchMedia('(pointer: coarse)')`.

---

## Corrections to Initial Implementation

The following changes from the first pass need to be reverted or adjusted:

| Change | Initial Approach | Correct Approach | Why |
|--------|-----------------|-------------------|-----|
| GTM strategy | `lazyOnload` | `afterInteractive` | Analytics data loss, missed conversions |
| CallRail strategy | `lazyOnload` | `afterInteractive` | Phone call attribution for PPC ROAS |
| Preconnects removed | Removed callrail + GTM | Restore GTM preconnect | GTM is back to `afterInteractive`, preconnect helps |

---

## Acceptance Criteria

### Functional Requirements

- [ ] Lighthouse mobile score >= 70 (target 75+)
- [ ] LCP < 4.0s (currently 14.4s)
- [ ] FCP < 2.5s (currently 7.4s)
- [ ] TBT < 300ms (currently 760ms)
- [ ] Speed Index < 4.0s (currently 8.6s)
- [ ] CLS < 0.1 (currently 0.004 — maintain)
- [ ] All lead forms still submit correctly (redirect + inline variants)
- [ ] Lead streaming (useLeadStream) works after Hero split
- [ ] GTM conversion tracking fires correctly
- [ ] CallRail phone number swap works
- [ ] YouTube video plays when thumbnail clicked
- [ ] Google Maps loads when facade clicked
- [ ] Exit-intent popup still triggers and submits

### Non-Functional Requirements

- [ ] No regressions on desktop Lighthouse (currently 90+)
- [ ] No regressions on SEO score (currently 100)
- [ ] No regressions on Accessibility score (currently 96)
- [ ] Build succeeds with zero errors
- [ ] No hydration mismatch warnings in console

### Quality Gates

- [ ] Test on real mobile device (not just Lighthouse simulation)
- [ ] Verify GTM fires pageview event within 3 seconds of load
- [ ] Verify CallRail number swap completes within 3 seconds
- [ ] Test lead form submission end-to-end (verify n8n webhook receives data)
- [ ] Test YouTube facade on iOS Safari and Chrome Android

---

## Success Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Mobile Lighthouse Performance | 39 | 75+ | PageSpeed Insights |
| FCP | 7.4s | < 2.5s | PageSpeed Insights |
| LCP | 14.4s | < 4.0s | PageSpeed Insights |
| TBT | 760ms | < 300ms | PageSpeed Insights |
| Speed Index | 8.6s | < 4.0s | PageSpeed Insights |
| CrUX LCP (28-day) | 3.6s | < 2.5s | Chrome UX Report |
| CrUX FCP (28-day) | 3.4s | < 1.8s | Chrome UX Report |
| Total JS payload | 1.6 MiB | < 400 KiB | Lighthouse treemap |

---

## Dependencies & Prerequisites

- YouTube facade: ✅ No dependencies
- GTM/CallRail strategy: Requires testing in staging to verify conversion tracking accuracy
- Hero split: Requires careful refactoring — form analytics must continue working
- `'use client'` removal: Low-risk, but verify build passes after each change
- Maps facade: Requires a static screenshot of the Google Maps embed saved to `/public/images/`
- Cache headers: No dependencies

---

## Risk Analysis & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| GTM conversion tracking breaks | Medium | **Critical** | Test in staging with real GTM container before deploying. Verify `gtm.formSubmit` events replay correctly. |
| Hero split breaks lead streaming | Low | High | The `useLeadStream` hook moves entirely to `hero-form.tsx`. No logic changes needed — just file reorganization. |
| CallRail number swap visible flash | Certain | Low | Acceptable tradeoff. Numbers swap within 1-2 seconds on normal connections. Alternative: CSS fade-in on phone number elements. |
| CLS regression from font swap | Low | Medium | `adjustFontFallback: true` generates size-adjust CSS. Monitor CLS in CrUX after deploy. |
| Footer refactor breaks landing pages | Low | Medium | Test all `/lp/*` routes after FooterWrapper extraction. |

---

## Implementation Order

Recommended sequence to minimize risk and maximize incremental improvement:

1. **Fix GTM + CallRail strategies** (revert `lazyOnload` → `afterInteractive`) — 5 min
2. **Restore GTM preconnect** — 1 min
3. **Throttle MobileCTABar scroll handler** — 5 min
4. **Remove `'use client'` from 4 components** (about, media-logos, cta, location-map) — 10 min
5. **Add `leadStream.cancel()` to redirect submit** — 2 min
6. **Deploy Phase 1 + partial Phase 2, measure** — verify score improvement
7. **Hero component split** (server shell + client form island) — 30-45 min
8. **Google Maps facade** — 15 min
9. **Footer wrapper extraction** — 10 min
10. **Cache headers + cleanup** — 5 min
11. **Deploy Phase 2 + 3, measure** — verify target score reached

---

## References & Research

### Internal References
- Hero component: `src/components/sections/hero.tsx` (538 lines, `'use client'`)
- Layout scripts: `src/app/layout.tsx` (lines 95-182)
- Homepage sections: `src/app/page.tsx` (17 sections)
- MobileCTABar: `src/components/layout/mobile-cta-bar.tsx` (unthrottled scroll)
- Popup triggers: `src/lib/hooks/use-popup-triggers.ts` (7 event listeners)
- Gravity Forms compat: `src/lib/analytics/gravity-forms-compat.ts` (GTM auto-events)

### External References
- Next.js Script strategies: https://nextjs.org/docs/app/api-reference/components/script
- Next.js Image priority: https://nextjs.org/docs/app/api-reference/components/image
- Next.js Lazy Loading: https://nextjs.org/docs/app/guides/lazy-loading
- Next.js Server/Client Components: https://nextjs.org/docs/app/getting-started/server-and-client-components
- web.dev embed best practices: https://web.dev/articles/embed-best-practices

### Key Research Findings
- `next/dynamic` with `ssr: true` code-splits JS but does NOT defer download — chunks load during hydration
- `priority` on `next/image` auto-generates `<link rel="preload">` — no manual preload needed
- `display: 'swap'` + `adjustFontFallback: true` produces near-zero CLS font swaps
- GTM `lazyOnload` causes analytics data loss for fast sessions and may not replay `gtm.formSubmit` auto-events
- 5 section components have unnecessary `'use client'` directives (zero hooks, pure render)
- MobileCTABar scroll handler was missed in initial throttling fix
