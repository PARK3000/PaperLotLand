// Server-side PostHog capture.
//
// Uses PostHog's batch ingestion endpoint via fetch so it runs on both
// edge (e.g. /api/leads/stream) and node (/api/leads) runtimes without
// pulling in posthog-node.
//
// PII-safe by design: a strict allowlist rejects any property whose key
// looks like personal data (email, phone, name, address, etc.). Server
// events should describe *shape* (which fields were filled, what the
// outcome was), never *content*.
//
// See docs/POSTHOG-EVENTS.md for the canonical event reference.

const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY

const PII_KEY_PATTERN =
  /(email|phone|firstName|lastName|fullName|^name$|address|street|zip|postal|ssn|dob)/i

function stripPii<T extends Record<string, unknown>>(props: T): T {
  const clean = {} as Record<string, unknown>
  for (const [k, v] of Object.entries(props)) {
    if (PII_KEY_PATTERN.test(k)) continue
    clean[k] = v
  }
  return clean as T
}

interface CaptureServerOptions {
  /** Idempotency key. Pass a stable id (e.g. lead_id) to dedupe against the client event. */
  insertId?: string
  /** ISO timestamp; defaults to now. */
  timestamp?: string
}

/**
 * Capture an event server-side. No-op when NEXT_PUBLIC_POSTHOG_KEY isn't
 * set (e.g. local dev without a key). Failures are logged but never thrown
 * — analytics must never break a lead delivery path.
 */
export async function captureServer(
  distinctId: string,
  event: string,
  properties: Record<string, unknown> = {},
  options: CaptureServerOptions = {}
): Promise<void> {
  if (!POSTHOG_KEY) return
  if (!distinctId || !event) return

  const safeProps = stripPii(properties)

  const body = {
    api_key: POSTHOG_KEY,
    event,
    distinct_id: distinctId,
    properties: {
      ...safeProps,
      $lib: 'web-server',
      ...(options.insertId ? { $insert_id: options.insertId } : {}),
    },
    timestamp: options.timestamp || new Date().toISOString(),
  }

  try {
    const res = await fetch(`${POSTHOG_HOST}/i/v0/e/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      // Cap the request — analytics shouldn't slow down lead delivery.
      signal: AbortSignal.timeout(2000),
    })
    if (!res.ok) {
      console.warn('[posthog-server] capture returned', res.status, event)
    }
  } catch (err) {
    console.warn(
      '[posthog-server] capture failed:',
      err instanceof Error ? err.message : String(err),
      event
    )
  }
}
