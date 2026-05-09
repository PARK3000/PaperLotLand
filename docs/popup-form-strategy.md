# Pop-Up Form Strategy: Data-Driven Rule Set

**Prepared for:** We Buy Any Vegas House
**Date:** March 9, 2026
**Data Source:** Microsoft Clarity (last 30 days: Feb 8 – Mar 9, 2026)

---

## Executive Summary

We analyzed 30 days of user behavior data from Microsoft Clarity to identify patterns that signal when a visitor is about to leave without converting. The data reveals that **95–100% of landing page visitors bounce**, most users are **idle for 60% of their session**, and **mobile converts at just 1.66%** compared to 4.5–5% on desktop. These patterns give us clear, data-backed triggers for when to show a popup form to recapture attention before a visitor is lost.

---

## User Behavior Data

### Session Duration by Device

| Device | Avg Session Duration |
|--------|---------------------|
| PC | 305s (~5 min) |
| Tablet | 117s (~2 min) |
| Mobile | 115s (~2 min) |

### Active vs. Inactive Time

| Metric | Value |
|--------|-------|
| Avg active time per session | **66 seconds** |
| Avg inactive time per session | **102 seconds** |
| Inactive % of session | **60%** |

Users spend the majority of their session doing nothing — not scrolling, not clicking, not moving their mouse. This is the single biggest opportunity for recapture.

### Session Duration Distribution (Under 2 Minutes)

| Duration Bucket | Sessions | Cumulative % |
|----------------|----------|-------------|
| 0–10 seconds | 716 | 33% |
| 10–20 seconds | 430 | 53% |
| 20–30 seconds | 256 | 65% |
| 30–40 seconds | 146 | 72% |
| 40–50 seconds | 120 | 77% |
| 50–60 seconds | 92 | 81% |

**Key takeaway:** 65% of sessions under 2 minutes end within 30 seconds. The 10–30 second window is the critical intervention point — these visitors showed some interest but didn't engage enough.

### Scroll Depth on Landing Pages

| Context | Avg Scroll Depth |
|---------|-----------------|
| Landing pages (all devices) | **28%** |
| Landing pages (PC) | 45% |
| Landing pages (Mobile) | **22%** |

Most visitors see only the top quarter of the page and leave.

---

## Conversion & Bounce Rate by Page

| Page | Bounce Rate | Form Submissions (30 days) |
|------|------------|---------------------------|
| `/lp/sell-my-house-fast/` | **96.7%** | 16 |
| `/lp/cash-offer-for-my-house/` | **97.6%** | 40 |
| `/lp/vegas-home-buyer/` | **94.9%** | 16 |
| `/lp/sell-my-house-for-cash-vegas/` | **100%** | 6 |
| Homepage `/` | 51.1% | 48 |
| `/get-your-cash-today/` | 48.2% | 12 |

### Conversion Rate by Device

| Device | Form Submission Rate |
|--------|---------------------|
| Tablet | 5.15% |
| PC | 4.54% |
| Mobile | **1.66%** |

Mobile converts at roughly one-third the rate of desktop. The popup strategy must account for this with mobile-specific timing.

---

## Frustration Signals

| Page | Dead Clicks | Rage Clicks |
|------|------------|-------------|
| `/lp/sell-my-house-fast/` | 314 | 22 |
| `/lp/cash-offer-for-my-house/` | 216 | **63** |
| Homepage `/` | 117 | 0 |
| `/lp/vegas-home-buyer/` | 77 | 5 |

**Dead clicks** = clicks on non-interactive elements (user expected something to happen).
**Rage clicks** = rapid repeated clicks out of frustration.

The 63 rage clicks on `/lp/cash-offer-for-my-house/` indicate users are actively trying to interact but can't figure out how. These users have high intent and need the form surfaced to them immediately.

---

## Recommended Popup Triggers

Based on the data above, we recommend five triggers ordered by priority. Only one popup should fire per session, using the highest-priority trigger that activates first.

### Priority 1: Rage/Dead Click Recovery

- **Rule:** 3+ dead clicks or 2+ rapid clicks within 2 seconds
- **Why:** Data shows massive dead click volumes (314 on one LP alone, 63 rage clicks on another). These users are actively *trying* to do something — they have intent but can't find the path. Surface the form immediately.

### Priority 2: Exit Intent (Desktop Only)

- **Rule:** Mouse cursor moves toward the top of the browser window (toward the address bar, tabs, or close button)
- **Why:** With 95%+ bounce rates on landing pages, even a 2–3% recapture rate on these sessions is significant
- **Mobile equivalent:** Use the browser's `visibilitychange` event to detect when a user switches tabs or moves to close the page

### Priority 3: Idle Recapture

- **Rule (Desktop):** No scroll, click, or mouse movement for **12 seconds**
- **Rule (Mobile):** No interaction for **8 seconds**
- **Why:** Average inactive time is 102 seconds per session. Intervening at 12 seconds catches them early in the idle window — past a casual reading pause but well before they've mentally checked out. Mobile gets a shorter fuse because sessions are half as long.

### Priority 4: Scroll Stall

- **Rule (Desktop):** User scrolls to **25–30% of page depth** and stops for **5 seconds**
- **Rule (Mobile):** User scrolls to **20% of page depth** and stops for **5 seconds**
- **Why:** Average landing page scroll depth is 28% (22% on mobile). This is the drop-off cliff — they've seen the pitch but aren't moving toward the form. Intervene right at the decision point.

### Priority 5: Bottom-of-Page Engagement

- **Rule:** User scrolls past **75% of page** without interacting with the form
- **Why:** 334 pageviews reached 100% scroll depth in the last 30 days. These users consumed all the content but didn't convert — they need a direct prompt, not more information.

---

## Timing Matrix

Different page types warrant different aggressiveness levels. Landing pages have 95%+ bounce rates — there's nothing to lose by being more assertive. Organic pages have lower bounce rates and more exploratory users.

| Trigger | `/lp/` Pages (Paid Traffic) | Organic Pages |
|---------|---------------------------|---------------|
| Idle timeout (Desktop) | 10 seconds | 15 seconds |
| Idle timeout (Mobile) | 6 seconds | 10 seconds |
| Scroll stall depth | 25% / 4s pause | 30% / 6s pause |
| Exit intent | Immediate | Immediate |
| Bottom-of-page threshold | 70% | 80% |

---

## Suppression Rules

To avoid annoying users or interfering with active engagement:

1. **One popup per session.** Once shown (whether submitted or dismissed), do not re-trigger.
2. **Suppress if form is in progress.** If the user has focused or typed in any form field, cancel all popup triggers.
3. **Suppress on thank-you pages.** Never show on `/thank-you/` or any post-conversion page.
4. **Suppress for returning converters.** If a cookie or local storage flag indicates a prior form submission, do not show the popup.
5. **Cooldown after page load.** No popup should fire within the first **3 seconds** of page load to avoid feeling spammy.

---

## Expected Impact

Based on industry benchmarks for exit-intent and behavioral popups in real estate lead generation:

| Scenario | Estimated Recapture Rate | Additional Leads/Month |
|----------|------------------------|----------------------|
| Conservative (2% of bounced sessions) | ~50 additional leads | Low effort, low risk |
| Moderate (4% of bounced sessions) | ~100 additional leads | Likely with good copy |
| Aggressive (6%+ of bounced sessions) | ~150+ additional leads | Requires strong offer |

Current form submissions total ~176/month across all pages. Even the conservative scenario represents a **28% increase** in lead volume.

---

## Next Steps

1. **Approve trigger rules and timing** — review the matrix above and adjust thresholds if needed
2. **Design the popup** — simple form (address + phone) with a compelling headline
3. **Implement and test** — build the component with the rule set, test across devices
4. **Monitor via Clarity** — track popup impressions, dismissals, and submissions as custom smart events
5. **Optimize** — adjust timing thresholds based on 2–4 weeks of popup performance data
