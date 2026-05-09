'use client'

import { getTrackingParams } from '@/lib/leads/tracking-params'

const CALENDLY_BASE = 'https://calendly.com/getyourcashoffer'

const EVENT_SLUGS = {
  phone: '10-minute-phone-call',
  inHome: '30min',
} as const

export type CalendlyEventType = keyof typeof EVENT_SLUGS

export const EVENT_LABELS: Record<CalendlyEventType, string> = {
  phone: 'Phone call (10 min)',
  inHome: 'In-home consultation (30 min)',
}

export interface CalendlyPrefill {
  name?: string
  email?: string
  phone?: string
  address?: string
}

export function buildCalendlyUrl(
  eventType: CalendlyEventType,
  prefill: CalendlyPrefill = {},
): string {
  const slug = EVENT_SLUGS[eventType]
  const params = new URLSearchParams()

  if (prefill.name) params.set('name', prefill.name)
  if (prefill.email) params.set('email', prefill.email)
  if (prefill.address) params.set('a1', prefill.address)
  // a2 mirrors the working production mapping on /booking/ and /thank-you/.
  // Calendly's positional prefill counter routes a2 → the phone Q3 because
  // the "Listed with agent" Y/N radio (Q2 in the editor) is currently skipped.
  // If Q2 is ever made active+required in Calendly, audit this — phone may
  // need to move to a3 and a Yes/No default would land in a2.
  if (prefill.phone) params.set('a2', prefill.phone.replace(/\D/g, ''))

  const t = getTrackingParams()
  for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const) {
    if (t[k]) params.set(k, t[k])
  }
  // Click IDs — Calendly doesn't natively store these but they pass through
  // in the booking record's URL, so a future webhook receiver can extract them.
  for (const k of ['gclid', 'msclkid', 'fbclid'] as const) {
    if (t[k]) params.set(k, t[k])
  }

  params.set('hide_gdpr_banner', '1')
  params.set('hide_landing_page_details', '1')

  return `${CALENDLY_BASE}/${slug}?${params.toString()}`
}
