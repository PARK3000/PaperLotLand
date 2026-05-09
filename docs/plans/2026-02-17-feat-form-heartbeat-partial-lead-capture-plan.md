---
title: "feat: Form Heartbeat — Partial Lead Capture"
type: feat
date: 2026-02-17
---

# Form Heartbeat — Partial Lead Capture

## Overview

Capture partial form data from lead forms when users interact with fields but don't submit. On field blur, the form sends current values to a heartbeat endpoint that upserts a partial lead record in Upstash Redis. Only fully submitted leads fire the CRM webhook. Partial leads are logged and stored for investigation and follow-up.

## Problem Statement

If a user types their address into a lead form but leaves without submitting, that data is lost. No follow-up, no visibility into abandonment, no ability to enrich partial data via skip-tracing.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Browser (LeadForm / InlineLeadForm)                    │
│                                                         │
│  1. Mount → generate sessionToken (useEffect, SSR-safe) │
│  2. Field blur → debounce 2s → POST /api/leads/heartbeat│
│  3. visibilitychange:hidden → sendBeacon (final flush)  │
│  4. Submit → abort + cancel → POST /api/leads           │
│     (includes sessionToken for CRM correlation)         │
└──────────────┬──────────────────────┬───────────────────┘
               │                      │
               ▼                      ▼
┌──────────────────────────┐  ┌─────────────────────────────┐
│ POST /api/leads/heartbeat│  │ POST /api/leads              │
│ (Edge Runtime + after()) │  │ (UNCHANGED — no Redis ops)   │
│                          │  │                              │
│ • Validate + sanitize    │  │ • Includes sessionToken in   │
│ • Upsert to Redis        │  │   webhook for CRM correlation│
│ • Structured logging     │  │                              │
│ • Returns 204            │  │                              │
└──────────┬───────────────┘  └─────────────────────────────┘
           ▼
┌──────────────────────────┐
│ Upstash Redis            │
│ Key: partial:{token}     │
│ TTL: 24 hours            │
└──────────────────────────┘
```

**Key design decisions:**
- **Redis is NOT on the submit path.** Submit latency stays unchanged. CRM correlates via sessionToken.
- **`after()` returns 204 immediately**, writes to Redis in background. User never waits.
- **`visibilitychange`** is the unload event (95.8% reliability), not `beforeunload` (unreliable on mobile).
- **One boolean ref (`doneRef`)** — not a state machine. The only question the hook asks is "have I submitted?"

## Implementation

### New Files

#### `src/lib/redis.ts`

```typescript
import { Redis } from "@upstash/redis"
export const redis = Redis.fromEnv()
```

#### `src/lib/leads/use-form-heartbeat.ts`

```typescript
'use client'

import { useRef, useCallback, useEffect } from 'react'

export function useFormHeartbeat(formId: string, formVariant: string) {
  const tokenRef = useRef('')
  const fieldsRef = useRef<Record<string, string>>({})
  const timerRef = useRef<ReturnType<typeof setTimeout>>()
  const abortRef = useRef<AbortController>()
  const doneRef = useRef(false)

  // SSR-safe lazy init of session token
  useEffect(() => {
    const key = `heartbeat:${formId}`
    const existing = sessionStorage.getItem(key)
    if (existing) {
      tokenRef.current = existing
    } else {
      const t = crypto.randomUUID()
      sessionStorage.setItem(key, t)
      tokenRef.current = t
    }
  }, [formId])

  const send = useCallback(() => {
    if (doneRef.current || !tokenRef.current || !Object.keys(fieldsRef.current).length) return
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    fetch('/api/leads/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        sessionToken: tokenRef.current,
        formId,
        formVariant,
        pageUrl: window.location.pathname,
        fields: fieldsRef.current,
      }),
    }).catch((err) => {
      if (err.name !== 'AbortError' && process.env.NODE_ENV === 'development') {
        console.warn('[heartbeat] failed:', err.message)
      }
    })
  }, [formId, formVariant])

  const onFieldBlur = useCallback((fieldName: string, value: string) => {
    if (doneRef.current || !tokenRef.current) return
    fieldsRef.current[fieldName] = value
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(send, 2000)
  }, [send])

  const cancel = useCallback(() => {
    doneRef.current = true
    clearTimeout(timerRef.current)
    abortRef.current?.abort()
  }, [])

  // visibilitychange → sendBeacon (final flush on tab close/navigate)
  useEffect(() => {
    const flush = () => {
      if (doneRef.current || !tokenRef.current || !Object.keys(fieldsRef.current).length) return
      clearTimeout(timerRef.current)
      abortRef.current?.abort()
      navigator.sendBeacon(
        '/api/leads/heartbeat',
        new Blob([JSON.stringify({
          sessionToken: tokenRef.current,
          formId,
          formVariant,
          pageUrl: window.location.pathname,
          fields: fieldsRef.current,
        })], { type: 'application/json' })
      )
    }
    const handler = () => { if (document.visibilityState === 'hidden') flush() }
    document.addEventListener('visibilitychange', handler)
    return () => {
      document.removeEventListener('visibilitychange', handler)
      clearTimeout(timerRef.current)
      abortRef.current?.abort()
    }
  }, [formId, formVariant])

  const getSessionToken = useCallback(() => tokenRef.current, [])

  return { onFieldBlur, cancel, getSessionToken }
}
```

#### `src/app/api/leads/heartbeat/route.ts`

```typescript
import { after } from "next/server"
import { redis } from "@/lib/redis"

export const runtime = "edge"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ALLOWED_FIELDS = ['address', 'phone', 'name', 'email'] as const
const FIELD_MAX_LEN: Record<string, number> = { address: 200, phone: 20, name: 100, email: 254 }

export async function POST(request: Request) {
  const text = await request.text()
  let data: Record<string, unknown>

  try {
    data = JSON.parse(text)
  } catch {
    return new Response(null, { status: 400 })
  }

  const sessionToken = data.sessionToken
  if (typeof sessionToken !== 'string' || !UUID_RE.test(sessionToken)) {
    return new Response(null, { status: 400 })
  }

  // Sanitize: only accept known fields, enforce length limits, strip HTML
  const rawFields = typeof data.fields === 'object' && data.fields ? data.fields as Record<string, unknown> : {}
  const fields: Record<string, string> = {}
  for (const name of ALLOWED_FIELDS) {
    const val = rawFields[name]
    if (typeof val === 'string' && val.trim().length > 0) {
      fields[name] = val.slice(0, FIELD_MAX_LEN[name] || 200).replace(/<[^>]*>/g, '').trim()
    }
  }

  if (Object.keys(fields).length === 0) {
    return new Response(null, { status: 400 })
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown"

  // Return 204 immediately, write to Redis in background
  after(async () => {
    try {
      const key = `partial:${sessionToken}`
      const existing = await redis.get<Record<string, unknown>>(key)

      const record = {
        sessionToken,
        formId: typeof data.formId === 'string' ? data.formId : 'unknown',
        formVariant: typeof data.formVariant === 'string' ? data.formVariant : 'unknown',
        pageUrl: typeof data.pageUrl === 'string' ? data.pageUrl : '',
        fields,
        fieldsFilled: Object.keys(fields),
        heartbeatCount: (typeof existing?.heartbeatCount === 'number' ? existing.heartbeatCount : 0) + 1,
        firstSeen: typeof existing?.firstSeen === 'string' ? existing.firstSeen : new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        ip,
        userAgent: request.headers.get('user-agent'),
      }

      await redis.set(key, record, { ex: 86400 }) // 24h TTL

      console.log('[Heartbeat]', {
        sessionToken: sessionToken.slice(0, 8) + '...',
        formId: record.formId,
        fieldsFilled: record.fieldsFilled,
        heartbeatCount: record.heartbeatCount,
        pageUrl: record.pageUrl,
      })
    } catch (err) {
      console.error('[Heartbeat] Redis write failed:', err)
    }
  })

  return new Response(null, { status: 204 })
}
```

### Modified Files

#### `src/components/sections/lead-form.tsx`

- Import `useFormHeartbeat` from `@/lib/leads/use-form-heartbeat`
- In both `LeadForm` and `InlineLeadForm`:
  - Call `useFormHeartbeat(analyticsFormId, variant)`
  - Wire `heartbeat.onFieldBlur(fieldName, value)` into existing blur handlers
  - Call `heartbeat.cancel()` at the start of `handleSubmit`
  - Add `sessionToken: heartbeat.getSessionToken()` to the submission body
- Update privacy text: "We save your progress as you type. By submitting, you agree to our Privacy Policy."

#### `src/app/api/leads/route.ts`

- Accept optional `sessionToken` in `LeadData` interface
- Include `sessionToken` in webhook payload for CRM correlation
- **No Redis operations** — submit path stays fast

### Environment Variables

```
UPSTASH_REDIS_REST_URL=    # Auto-set by Vercel Marketplace integration
UPSTASH_REDIS_REST_TOKEN=  # Auto-set by Vercel Marketplace integration
```

Scope to `production` environment only (not preview deployments).

### Dependencies

```
@upstash/redis    # HTTP-based Redis client, works on Edge
```

One dependency. Rate limiting deferred until abuse is observed.

## Acceptance Criteria

- [ ] Partial field data captured on blur and stored in Redis (upsert by session token)
- [ ] Session token persists across page navigations (sessionStorage, namespaced by formId)
- [ ] `visibilitychange:hidden` fires final beacon with current field state
- [ ] Submit cancels pending debounce and aborts in-flight heartbeat requests
- [ ] No heartbeats or beacons fire after form submission
- [ ] Partial leads auto-expire after 24 hours (Redis TTL)
- [ ] Structured logs for every heartbeat (truncated token, formId, fields filled)
- [ ] Submit path latency unchanged (no Redis on submit)
- [ ] Privacy disclosure visible above form fields
- [ ] Field values sanitized (length limits, HTML stripped, whitelist enforced)

## Future Considerations (Not In Scope)

- **Rate limiting**: Add `@upstash/ratelimit` if abuse is observed
- **Abandoned lead cron**: Vercel Cron to scan for unconverted partials and forward to webhook
- **Skip-trace enrichment**: BatchData API ($0.12/record) to enrich abandoned addresses
- **Contact-us form**: Different schema, add separately
- **Server-generated session tokens**: HttpOnly cookie via middleware for stronger CSRF protection
- **Pre-existing security fixes**: Email in dataLayer, Math.random() lead IDs, PII in sessionStorage — file as separate issue

## References

- [Upstash Redis docs](https://upstash.com/docs/redis/overall/getstarted)
- [Next.js after() API](https://nextjs.org/docs/app/api-reference/functions/after)
- [Beaconing in Practice (2024)](https://nicj.net/beaconing-in-practice-an-update-on-reliability-and-the-pending-beacon-api/)
- [navigator.sendBeacon MDN](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon)
