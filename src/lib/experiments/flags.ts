import { cookies, headers } from 'next/headers'
import { PostHog } from 'posthog-node'

export const PH_DID_COOKIE = 'ph_did'

// Reuse a single client across requests in the same Lambda/Fluid instance.
let _client: PostHog | null = null

function getClient(): PostHog | null {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  if (!key) return null
  if (_client) return _client
  _client = new PostHog(key, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    flushAt: 1,
    flushInterval: 0,
  })
  return _client
}

export async function getDistinctId(): Promise<string | null> {
  const c = await cookies()
  const cookieValue = c.get(PH_DID_COOKIE)?.value
  if (cookieValue) return cookieValue

  // First visit: middleware sets ph_did on the response (browser) and
  // forwards the same value as x-ph-did so this request can use it too.
  const h = await headers()
  return h.get('x-ph-did') ?? null
}

export interface VariantContext {
  /** Override the distinct_id (defaults to ph_did cookie). */
  distinctId?: string
  /** Person properties for flag targeting (string values per PostHog API). */
  personProperties?: Record<string, string>
}

/**
 * Evaluate a multivariate feature flag server-side. Returns 'control' if
 * PostHog is unreachable, the flag doesn't exist, the key isn't configured,
 * or no distinct_id is available. The ph_did cookie must be stamped before
 * calling this (see src/app/(site)/lp/layout.tsx).
 */
export async function getExperimentVariant(
  flagKey: string,
  context: VariantContext = {}
): Promise<string> {
  const client = getClient()
  if (!client) return 'control'

  const distinctId = context.distinctId ?? (await getDistinctId())
  if (!distinctId) return 'control'

  try {
    const variant = await client.getFeatureFlag(flagKey, distinctId, {
      personProperties: context.personProperties,
    })
    return typeof variant === 'string' ? variant : 'control'
  } catch (err) {
    console.warn('[experiments] flag eval failed:', flagKey, err)
    return 'control'
  }
}
