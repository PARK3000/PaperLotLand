// GTM dataLayer integration (also mirrors semantic events to PostHog)

import posthog from 'posthog-js'
import { ANALYTICS_EVENTS } from './events'

declare global {
  interface Window {
    dataLayer: unknown[]
  }
}

// Semantic events that should flow to PostHog. GTM-internal events
// (gtm.*, gform_*, form_step*, form_start, lead_submission) are GTM
// plumbing for Gravity Forms trigger compatibility and stay out.
const POSTHOG_EVENTS: ReadonlySet<string> = new Set(Object.values(ANALYTICS_EVENTS))

export function pushToDataLayer(data: Record<string, unknown>) {
  if (typeof window === 'undefined') return

  window.dataLayer = window.dataLayer || []
  window.dataLayer.push(data)

  const eventName = typeof data.event === 'string' ? data.event : undefined
  if (!eventName || eventName === ANALYTICS_EVENTS.PAGE_VIEWED) return
  if (!POSTHOG_EVENTS.has(eventName)) return
  if (!posthog.__loaded) return

  const { event: _event, ...properties } = data
  posthog.capture(eventName, properties)
}

export function isDataLayerAvailable(): boolean {
  return typeof window !== 'undefined' && Array.isArray(window.dataLayer)
}
