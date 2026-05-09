# PostHog Event Taxonomy

Canonical reference for every event the website fires. Keep this file in
sync with `src/lib/analytics/events.ts` — the constants there are the
single source of truth, this doc is the human-readable form.

PostHog project: **393348** (We Buy Any Vegas House).

## Pipeline at a glance

```
Browser → window.dataLayer → gtag.ts → posthog-js (auto-mirrored)
                                    ↘ GTM tags (Gravity Forms, Google Ads)

Server  → src/lib/analytics/server.ts → fetch → PostHog ingestion API
```

- Anything in `ANALYTICS_EVENTS` (in `events.ts`) is auto-forwarded from
  the dataLayer to PostHog. Add a new client event by adding a constant
  there — no extra wiring needed.
- `lead_submission` is intentionally outside the allowlist; it is fired
  directly via `posthog.capture()` from `form-analytics.ts` so the
  `posthog.identify()` call can run alongside it.
- Server events use `captureServer()` and never touch the dataLayer. They
  strip PII via key-pattern allowlist before sending.

## Page-type segmentation

Every event payload includes a `page_type` property derived from the
current pathname via `getPageType()` in `src/lib/analytics/page-type.ts`.
Allowed values:

| Value | Pathname pattern |
|-------|-----------------|
| `home` | `/` |
| `lp` | `/lp/*` |
| `situation` | `/need-to-downsize`, `/facing-bankruptcy`, etc. |
| `location` | `/henderson`, `/we-buy-houses-summerlin`, `/locations/*`, etc. |
| `landing` | `/get-your-cash-today`, `/sell-my-house-fast`, etc. |
| `case_study` | `/case-study-*`, `/case-studies/*` |
| `blog` | `/blog/*` |
| `other` | everything else |

Add new pathnames in `page-type.ts`, not in dashboard filters. Dashboards
should only ever filter on `page_type`, never on raw URLs.

## Client events

| Event | Required props | Fired from |
|-------|---------------|-----------|
| `$pageview` | `$current_url`, `$pathname` | `posthog-init.tsx` (manual SPA) |
| `$pageleave` | (auto) | PostHog defaults |
| `$web_vitals` | `$web_vitals_LCP_value`, `_INP_value`, `_CLS_value`, `_FCP_value`, `_TTFB_value` | PostHog defaults `'2025-05-24'` |
| `$rageclick` | element, page | PostHog auto-capture |
| `form_viewed` | `form_id`, `form_variant`, `page_type`, `page_url` | `useFormAnalytics.trackFormView` |
| `form_started` | `form_id`, `form_variant`, `first_field`, `page_type` | `useFormAnalytics.trackFormStart` |
| `form_field_completed` | `form_id`, `field_name`, `time_in_field_ms`, `step?` | `useFormAnalytics.trackFieldComplete` |
| `form_validation_error` | `form_id`, `field_name`, `error_type` | `useFormAnalytics.trackValidationError` |
| `form_submitted` | `form_id`, `form_variant`, `time_to_complete_ms`, `page_type` | `useFormAnalytics.trackSubmit` |
| `form_error` | `form_id`, `error_type`, `error_message?` | `useFormAnalytics.trackError` |
| `lead_submission` ★ | `form_id`, `lead_id`, `page_type` | `form-analytics.ts` (manual + identify) |
| `cta_clicked` | `cta_id`, `cta_text`, `page_type`, `page_url` | mobile CTA bar, CTA section, floating pill |
| `cta_viewed` | identical to `cta_clicked` | (reserved — wire when adding viewport-impression tracking) |
| `phone_clicked` | `phone_number`, `click_location`, `page_type`, `page_url` | `<PhoneLink>` |
| `sms_clicked` | identical to `phone_clicked` | mobile CTA bar |
| `popup_viewed` | `trigger_type`, `page_type`, `time_on_page_ms?` | popup hooks |
| `popup_closed` | identical to `popup_viewed` | popup hooks |
| `popup_converted` | identical to `popup_viewed` | popup hooks |

★ `lead_submission` is the **canonical conversion event**. All conversion
funnels and CR tiles must use this event, not `form_submitted`.

## Server events

These are fired from API routes via `captureServer()` and never include
PII in their payload.

| Event | distinct_id | Required props | Fired from |
|-------|-------------|---------------|-----------|
| `partial_lead_stream` | `session_token` | `submission_type` ∈ `address_selected` / `partial_update` / `address_submit`, `fields_filled[]`, `form_id`, `form_variant`, `page_type`, `delivered`, `utm_*?` | `/api/leads/stream` |
| `lead_submission_server` | `lead_id` | `source` ∈ `n8n` / `podio_fallback`, `status`, `attempts`, `form_id`, `form_variant`, `page_type`, `utm_*?`. `$insert_id = lead_id` for client-event de-dup. | `/api/leads` |

## PII rules

`captureServer()` rejects any property whose key matches:

```
/(email|phone|firstName|lastName|fullName|^name$|address|street|zip|postal|ssn|dob)/i
```

Audit by greping `captureServer(` call sites for those substrings — they
should never appear in a property key. Names containing PII fragments
(`address_selected` is fine — it's `address` followed by an underscore in
a *value*, not a key, and `submission_type` is a categorical) are
allowed.

## Identification

`person_profiles: 'identified_only'` is set in `posthog-init.tsx`. The
identify call happens once per session in `form-analytics.ts:trackSuccess`
using `lead_id` (or email/phone fallback) as the distinct id. This keeps
the PostHog person count low and avoids creating profiles for visitors
who never converted.

## Adding a new event

1. Add the constant to `ANALYTICS_EVENTS` in `events.ts`.
2. Add the props interface in the same file.
3. Fire it via `pushToDataLayer({ event, ...props })` (or
   `captureServer()` if it's server-side).
4. Update this doc.
5. Reference it from at least one dashboard tile, or delete it. Events
   that don't drive a dashboard or experiment are noise.

## Decommissioned

These constants existed previously and are intentionally **not in the
taxonomy** anymore:

- `EXIT_INTENT_TRIGGERED` / `_DISMISSED` / `_CONVERTED` — superseded by
  `popup_*`.
- `WEB_VITAL` — superseded by PostHog auto-captured `$web_vitals` event
  (enabled via `defaults: '2025-05-24'`).
- `FORM_SUCCESS` — never fired in practice; canonical is
  `lead_submission`.
