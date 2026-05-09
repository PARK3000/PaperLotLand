---
title: "feat: Behavioral Popup Form with Data-Driven Triggers"
type: feat
date: 2026-03-09
---

# Behavioral Popup Form with Data-Driven Triggers

## Overview

Replace the existing single-trigger `ExitIntentPopup` with a multi-trigger behavioral popup system that uses 5 data-driven triggers to recapture visitors before they bounce. Trigger thresholds are derived from 30 days of Microsoft Clarity behavioral data (documented in `docs/popup-form-strategy.md`).

Current state: ~176 form submissions/month, 95-100% bounce on `/lp/` pages, mobile converts at 1.66% vs desktop 4.54%. Conservative estimate: +50 leads/month (28% increase).

## Problem Statement / Motivation

The existing `ExitIntentPopup` (`src/components/popups/exit-intent.tsx`) only handles one trigger: desktop mouse-leave at the top of the viewport. It skips mobile entirely. Clarity data shows the biggest opportunities are idle recapture (users idle 60% of session time), scroll stall detection (avg LP scroll depth is only 28%), and rage/dead click recovery (314 dead clicks on one LP alone). These signals are being ignored.

## Proposed Solution

**Replace** the existing `ExitIntentPopup` and `useExitIntent` hook with a new unified system:

1. A single `PopupForm` component mounted in the root layout (replacing `ExitIntentPopup`)
2. A single `usePopupTriggers` hook that manages all 5 triggers with a "first to fire wins" arbitration model
3. Configurable thresholds per page type (`/lp/` vs organic) and device (desktop vs mobile)
4. Shared suppression logic (one popup per session, form-in-progress detection, page suppression)

### Architecture

```
src/
├── components/popups/
│   └── popup-form.tsx              # New: replaces exit-intent.tsx
├── lib/hooks/
│   └── use-popup-triggers.ts       # New: replaces use-exit-intent.ts
└── lib/analytics/
    └── events.ts                   # Update: add trigger_type to popup events
```

### Files to Create

| File | Purpose |
|------|---------|
| `src/lib/hooks/use-popup-triggers.ts` | Unified hook managing all 5 behavioral triggers |
| `src/components/popups/popup-form.tsx` | Popup component composing Modal + InlineLeadForm |

### Files to Modify

| File | Change |
|------|--------|
| `src/app/layout.tsx` (~line 201) | Replace `<ExitIntentPopup />` with `<PopupForm />` |
| `src/lib/analytics/events.ts` | Add `POPUP_TRIGGERED` event, deprecate `EXIT_INTENT_*` events |

### Files to Delete

| File | Reason |
|------|--------|
| `src/components/popups/exit-intent.tsx` | Replaced by `popup-form.tsx` |
| `src/lib/hooks/use-exit-intent.ts` | Replaced by `use-popup-triggers.ts` |

## Technical Approach

### Trigger System Design

All 5 triggers run concurrently. The **first trigger to reach its threshold fires the popup** and all others immediately deactivate. Priority order is only a tiebreaker if two triggers fire in the same animation frame.

#### Trigger 1: Rage/Dead Click Recovery (Priority 1)

```typescript
// Dead click = click where target is not an interactive element
const isDeadClick = !event.target.closest(
  'a, button, input, select, textarea, [role="button"], [tabindex], video, audio'
)

// Rage click = 2+ clicks within 2 seconds on same ~50px area
// Dead click = 3+ dead clicks anywhere on page (cumulative)
```

- Reset click counters on SPA navigation
- Exclude clicks on the modal overlay itself

#### Trigger 2: Exit Intent

- **Desktop:** `mouseleave` event on `document` when `clientY <= 20` (existing pattern)
- **Mobile:** `visibilitychange` → queue popup, show when user returns IF:
  - Away for at least 2 seconds (filter accidental swipes)
  - Away for no more than 10 minutes (avoid stale prompts)
  - All other suppression rules still pass on return

#### Trigger 3: Idle Recapture

- Track `scroll`, `click`, `mousemove`, `touchstart`, `keydown` events
- All listeners use `{ passive: true }` where applicable
- **Throttle:** mousemove at 500ms, scroll at 200ms (timestamp check, no RAF needed)
- **Pause idle timer** when `document.visibilityState === 'hidden'` (background tabs don't count as idle)
- Reset idle timer on any user interaction

#### Trigger 4: Scroll Stall

- Track `scroll` events (already throttled at 200ms for idle detection)
- When scroll depth crosses threshold AND user stops scrolling for pause duration → trigger
- Only fires once per page (don't re-trigger if user scrolls past threshold, comes back, crosses again)

#### Trigger 5: Bottom-of-Page

- When scroll depth exceeds threshold AND no form field has been focused during this page view
- Simple scroll position check on each throttled scroll event

### Timing Configuration

```typescript
type PageType = 'lp' | 'organic'

const TRIGGER_CONFIG: Record<PageType, TriggerThresholds> = {
  lp: {
    idleDesktop: 10_000,      // 10s
    idleMobile: 6_000,        // 6s
    scrollStallDepth: 0.25,   // 25%
    scrollStallPause: 4_000,  // 4s
    bottomOfPage: 0.70,       // 70%
    exitIntentDelay: 3_000,   // 3s minimum time on page
  },
  organic: {
    idleDesktop: 15_000,      // 15s
    idleMobile: 10_000,       // 10s
    scrollStallDepth: 0.30,   // 30%
    scrollStallPause: 6_000,  // 6s
    bottomOfPage: 0.80,       // 80%
    exitIntentDelay: 5_000,   // 5s minimum time on page
  },
}
```

Page type detection: `pathname.startsWith('/lp/') ? 'lp' : 'organic'`

### Suppression Logic

All checks evaluated before any trigger fires:

```typescript
// 1. Page load cooldown (3 seconds)
if (Date.now() - pageLoadTime < 3000) return false

// 2. Already shown this session (cookie, shared across tabs)
if (getCookie('popup_shown') === '1') return false

// 3. Returning converter (cookie + localStorage, 30-day expiry)
if (getCookie('popup_converted') === '1' || localStorage.getItem('popup_converted')) return false

// 4. Suppressed page
const SUPPRESSED_PATHS = ['/thank-you', '/booking', '/get-your-cash-today', '/contact-us']
if (SUPPRESSED_PATHS.some(p => pathname.startsWith(p))) return false

// 5. Form in progress (any form field on the page has focus)
if (document.activeElement?.closest('form')?.querySelector('input, select, textarea') === document.activeElement) return false

// 6. LiveChat widget is expanded
if (document.querySelector('[data-chat-widget-expanded="true"]') ||
    document.querySelector('.chat-widget--expanded')) return false
```

### SPA Navigation Handling

On `pathname` change (detected via `usePathname()` in a `useEffect`):

1. Clear all timers (idle, scroll stall pause)
2. Reset click counters and scroll depth tracking
3. Re-evaluate page type (lp vs organic) and apply new thresholds
4. Re-apply 3-second cooldown from navigation timestamp
5. **Do NOT reset** session-level flags (popup already shown, converter status)

### Mobile Back Button

Push a history state when the popup opens. Intercept `popstate` to dismiss the popup instead of navigating away:

```typescript
// On popup open
window.history.pushState({ popup: true }, '')

// Listen for back
window.addEventListener('popstate', (e) => {
  if (isVisible) {
    dismiss()
    // Don't navigate — popup is dismissed
  }
})
```

### Event Listener Cleanup

All listeners are registered in a single `useEffect` and cleaned up in the return function. After the popup fires (or the component determines it should never fire for this session), **remove all listeners immediately** to free resources.

### Analytics

Use a single `POPUP_TRIGGERED` event with properties:

```typescript
trackEvent('popup_triggered', {
  trigger_type: 'rage_click' | 'exit_intent' | 'idle' | 'scroll_stall' | 'bottom_of_page',
  page_type: 'lp' | 'organic',
  device_type: 'desktop' | 'mobile',
  time_on_page_ms: number,
  scroll_depth_percent: number,
  pathname: string,
})
```

Keep existing `POPUP_VIEWED`, `POPUP_CLOSED`, `POPUP_CONVERTED` events. Deprecate `EXIT_INTENT_TRIGGERED/DISMISSED/CONVERTED`.

### Cookie Strategy

| Cookie/Storage | Scope | Expiry | Purpose |
|---------------|-------|--------|---------|
| `popup_shown` | Cookie (cross-tab) | Session | One popup per session |
| `popup_converted` | Cookie + localStorage | 30 days | Suppress for converters |
| `popup_dismissed_at` | Cookie | 7 days | Optional: vary behavior for recently-dismissed users |

## Acceptance Criteria

### Functional Requirements (v1 — simplified per reviewer feedback)

- ~Deferred to v2~ Popup fires on rage/dead click detection (3+ dead clicks or 2+ rapid clicks in 2s)
- [x] Popup fires on desktop exit intent (mouse leaves top of viewport)
- ~Deferred to v2~ Popup fires on mobile via visibilitychange (with 2s min / 10min max away time)
- [x] Popup fires on idle timeout (desktop 10s / mobile 6s)
- [x] Popup fires on scroll stall at configured depth/pause thresholds (25% / 4s)
- ~Deferred to v2~ Popup fires on bottom-of-page scroll without prior form interaction
- [x] Only one trigger fires per session (first to threshold wins)
- ~Deferred to v2~ Thresholds differ between `/lp/` pages and organic pages per timing matrix
- [x] All timers and counters reset on SPA navigation
- ~Simplified~ Single config used for all page types (v1)

### Suppression

- [x] No popup within 3 seconds of page load or SPA navigation
- [x] No popup if one already shown this session (cross-tab cookie)
- [x] No popup for returning converters (30-day cookie + localStorage)
- [x] No popup on suppressed pages (`/thank-you/`, `/booking/`, `/get-your-cash-today/`, `/contact-us/`)
- [x] No popup while a form field has focus anywhere on the page
- ~Deferred to v2~ No popup while LiveChat widget is expanded

### Form & Conversion

- [x] Popup uses `InlineLeadForm` with `formId="popup-form"` for distinct tracking
- [x] Form submission follows existing pipeline (POST `/api/leads/`, redirect to `/thank-you/`)
- [x] Heartbeat fires for partial lead capture on popup form fields (via InlineLeadForm)
- [x] Success sets `popup_converted` cookie + localStorage flag
- [x] Dismissal sets `popup_shown` session cookie

### UX

- ~Deferred to v2~ Mobile back button dismisses popup (via history.pushState)
- [x] Modal overlays MobileCTABar (z-50 over z-40)
- [x] Idle timer pauses when tab is in background
- [x] All event listeners use `{ passive: true }` where possible
- [x] Listeners removed after popup fires or session is flagged as suppressed
- [x] Scroll/mousemove listeners throttled (200ms / 500ms)

### Analytics

- [x] `popup_viewed` event fires with `trigger_type`, `device_type`, `time_on_page_ms`, `scroll_depth_percent`
- [x] `popup_viewed`, `popup_closed`, `popup_converted` events fire at appropriate lifecycle points
- [x] Existing `EXIT_INTENT_*` events marked as `@deprecated` (kept for backward compat)

### Migration

- [x] `src/components/popups/exit-intent.tsx` deleted
- [x] `src/lib/hooks/use-exit-intent.ts` deleted
- [x] `src/app/layout.tsx` updated to render `<LeadCapturePopup />` instead of `<ExitIntentPopup />`
- [x] Backward-compatible with existing `exit_intent_shown` cookie (read old cookie to avoid re-showing to recently-suppressed users)

## Dependencies & Risks

| Risk | Mitigation |
|------|-----------|
| False positive dead click detection | Use conservative interactive element selector; test against common page layouts |
| Performance on mobile (many event listeners) | Throttle aggressively; remove all listeners after popup fires |
| LiveChat widget detection breaks on widget updates | Use multiple selector fallbacks; degrade gracefully (show popup if detection fails) |
| SPA navigation edge cases | Write explicit tests for pathname change scenarios |
| Conflict with existing `exit_intent_shown` cookie | Read old cookie during transition period; use new cookie name (`popup_shown`) going forward |

## Success Metrics

- **Primary:** Form submissions per month (baseline: ~176, target: +28% conservative)
- **Secondary:** Popup conversion rate by trigger type (target: 2-4%)
- **Tertiary:** Popup dismissal rate (monitor for annoyance; if >90% after 2 weeks, loosen timing)
- **Guard rail:** Session duration should not decrease (popup shouldn't drive people away faster)

## References & Research

### Internal

- Strategy document: `docs/popup-form-strategy.md` (Clarity data and timing rationale)
- Existing exit-intent popup: `src/components/popups/exit-intent.tsx`
- Existing hook: `src/lib/hooks/use-exit-intent.ts`
- Modal component: `src/components/ui/modal.tsx`
- InlineLeadForm: `src/components/sections/lead-form.tsx`
- Analytics events: `src/lib/analytics/events.ts`
- Root layout mount point: `src/app/layout.tsx:201`
- Form heartbeat plan: `docs/plans/2026-02-17-feat-form-heartbeat-partial-lead-capture-plan.md`
- CSS layer gotcha: `docs/solutions/ui-bugs/focus-outline-css-cascade-layers-Hero-20260303.md`

### Data

- Clarity behavioral data: 30 days (Feb 8 – Mar 9, 2026)
- Key finding: 60% of session time is idle, avg LP scroll depth 28%, mobile converts at 1.66%
