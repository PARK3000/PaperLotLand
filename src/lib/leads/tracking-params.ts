'use client'

/**
 * Client-side tracking parameter capture.
 * Replaces the HandL UTM Tracker WordPress plugin.
 *
 * On every page load:
 * 1. Reads UTM params + click IDs from the URL
 * 2. Stores "last touch" values in cookies (overwritten each visit with UTMs)
 * 3. Stores "first touch" values only once (never overwritten)
 * 4. Tracks original referrer and landing page
 *
 * On form submit, call `getTrackingParams()` to collect everything.
 */

import type { TrackingParams } from './types'

// Cookie names — match HandL plugin conventions where possible
const COOKIE_PREFIX = 'handl_'
const COOKIE_EXPIRY_DAYS = 90
const CLICK_ID_EXPIRY_DAYS = 30

// ---------------------------------------------------------------------------
// Cookie helpers
// ---------------------------------------------------------------------------

function setCookie(name: string, value: string, days: number) {
  if (typeof document === 'undefined' || !value) return
  const expires = new Date(Date.now() + days * 86400000).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/;SameSite=Lax`
}

function getCookie(name: string): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : ''
}

// ---------------------------------------------------------------------------
// URL param reader
// ---------------------------------------------------------------------------

function getUrlParam(name: string): string {
  if (typeof window === 'undefined') return ''
  const params = new URLSearchParams(window.location.search)
  return params.get(name) || ''
}

// ---------------------------------------------------------------------------
// Referrer / organic source detection
// ---------------------------------------------------------------------------

const SEARCH_ENGINES: Record<string, string> = {
  'google.com': 'Google',
  'google.co': 'Google',
  'bing.com': 'Bing',
  'yahoo.com': 'Yahoo',
  'duckduckgo.com': 'DuckDuckGo',
  'baidu.com': 'Baidu',
  'yandex.': 'Yandex',
}

function detectOrganicSource(referrer: string): { source: string; str: string } {
  if (!referrer) return { source: '', str: '' }
  try {
    const hostname = new URL(referrer).hostname.toLowerCase()
    for (const [domain, name] of Object.entries(SEARCH_ENGINES)) {
      if (hostname.includes(domain)) {
        return { source: name, str: hostname }
      }
    }
    return { source: '', str: hostname }
  } catch {
    return { source: '', str: '' }
  }
}

function getDomainFromUrl(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return ''
  }
}

function getBaseUrl(url: string): string {
  try {
    const u = new URL(url)
    return u.origin + u.pathname
  } catch {
    return url
  }
}

function deriveTrafficSource(utmMedium: string, utmSource: string, referrer: string): string {
  if (utmMedium === 'cpc' || utmMedium === 'ppc' || utmMedium === 'paid') return 'Paid'
  if (utmSource || utmMedium) {
    if (utmMedium === 'email') return 'Direct' // Email campaigns show as Direct
    return 'Paid'
  }
  if (!referrer) return 'Direct'
  const { source } = detectOrganicSource(referrer)
  if (source) return 'Organic' // Came from a search engine without UTMs
  return 'Direct'
}

// ---------------------------------------------------------------------------
// GA Client ID
// ---------------------------------------------------------------------------

export function getGAClientId(): string {
  // Try _ga cookie first (format: GA1.1.XXXXXXX.XXXXXXX)
  // The client ID is the last two dot-separated segments
  try {
    const match = document.cookie.match(/_ga=GA\d+\.\d+\.(\d+\.\d+)/)
    if (match) return match[1]
  } catch {
    // ignore
  }
  // Fallback: parse via getCookie helper
  const ga = getCookie('_ga')
  if (ga) {
    const parts = ga.split('.')
    if (parts.length >= 4) return parts.slice(2).join('.')
  }
  return ''
}

export function getHandlID(): string {
  try {
    // Try window object first (HandL script exposes this)
    if (typeof window !== 'undefined' && (window as unknown as Record<string, unknown>).handlID) {
      return String((window as unknown as Record<string, unknown>).handlID)
    }
    // Fall back to hidden input field if HandL populates form fields
    const el =
      document.querySelector<HTMLInputElement>('input[name="handlID (HandL)"]') ||
      document.querySelector<HTMLInputElement>('input[name="handlID_HandL"]')
    if (el?.value) return el.value
  } catch {
    // ignore
  }
  // Fall back to cookie (set by our own initTracking)
  return getCookie(`${COOKIE_PREFIX}ID`)
}

// Facebook cookies
function getFbc(): string {
  return getCookie('_fbc')
}

function getFbp(): string {
  return getCookie('_fbp')
}

// ---------------------------------------------------------------------------
// Initialization — call on every page load
// ---------------------------------------------------------------------------

let initialized = false

export function initTracking() {
  if (typeof window === 'undefined' || initialized) return
  initialized = true

  const referrer = document.referrer || ''
  const currentUrl = window.location.href

  // --- Original referrer (set once, never overwritten) ---
  if (!getCookie(`${COOKIE_PREFIX}original_ref`)) {
    setCookie(`${COOKIE_PREFIX}original_ref`, referrer || 'Direct', COOKIE_EXPIRY_DAYS)
  }

  // --- Landing page (set once, never overwritten) ---
  if (!getCookie(`${COOKIE_PREFIX}landing_page`)) {
    setCookie(`${COOKIE_PREFIX}landing_page`, currentUrl, COOKIE_EXPIRY_DAYS)
  }

  // --- Always update current URL and referrer ---
  setCookie(`${COOKIE_PREFIX}url`, currentUrl, COOKIE_EXPIRY_DAYS)
  setCookie(`${COOKIE_PREFIX}ref`, referrer, COOKIE_EXPIRY_DAYS)

  // --- IP is captured server-side, but store a handlID ---
  if (!getCookie(`${COOKIE_PREFIX}ID`)) {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 8)
    setCookie(`${COOKIE_PREFIX}ID`, id, COOKIE_EXPIRY_DAYS)
  }

  // --- UTM params ---
  // Try current URL first, then fall back to same-domain referrer.
  // This handles the case where the user lands on a page with UTMs,
  // navigates to another page (losing UTMs from the URL), and we
  // need to capture them from the referrer.
  let utmSource = getUrlParam('utm_source')
  let utmMedium = getUrlParam('utm_medium')
  let utmTerm = getUrlParam('utm_term')
  let utmContent = getUrlParam('utm_content')
  let utmCampaign = getUrlParam('utm_campaign')
  let utmCampaignId = getUrlParam('utm_campaign_id')

  if (!utmSource && !utmMedium && !utmCampaign && referrer) {
    try {
      const refUrl = new URL(referrer)
      if (refUrl.hostname === window.location.hostname) {
        utmSource = refUrl.searchParams.get('utm_source') || ''
        utmMedium = refUrl.searchParams.get('utm_medium') || ''
        utmTerm = refUrl.searchParams.get('utm_term') || ''
        utmContent = refUrl.searchParams.get('utm_content') || ''
        utmCampaign = refUrl.searchParams.get('utm_campaign') || ''
        utmCampaignId = refUrl.searchParams.get('utm_campaign_id') || ''
      }
    } catch {
      // Invalid referrer URL — ignore
    }
  }

  const hasUtms = utmSource || utmMedium || utmCampaign

  if (hasUtms) {
    // Last-touch UTMs — overwrite on each visit with UTMs
    setCookie('utm_source', utmSource, COOKIE_EXPIRY_DAYS)
    setCookie('utm_medium', utmMedium, COOKIE_EXPIRY_DAYS)
    setCookie('utm_term', utmTerm, COOKIE_EXPIRY_DAYS)
    setCookie('utm_content', utmContent, COOKIE_EXPIRY_DAYS)
    setCookie('utm_campaign', utmCampaign, COOKIE_EXPIRY_DAYS)
    setCookie('utm_campaign_id', utmCampaignId, COOKIE_EXPIRY_DAYS)
  }

  // First-touch UTMs — only set once
  if (!getCookie('first_utm_source') && hasUtms) {
    setCookie('first_utm_source', utmSource, COOKIE_EXPIRY_DAYS)
    setCookie('first_utm_medium', utmMedium, COOKIE_EXPIRY_DAYS)
    setCookie('first_utm_term', utmTerm, COOKIE_EXPIRY_DAYS)
    setCookie('first_utm_content', utmContent, COOKIE_EXPIRY_DAYS)
    setCookie('first_utm_campaign', utmCampaign, COOKIE_EXPIRY_DAYS)
  }

  // --- Click IDs ---
  const gclid = getUrlParam('gclid')
  const msclkid = getUrlParam('msclkid') || getUrlParam('msclid')
  const fbclid = getUrlParam('fbclid')
  const wbraid = getUrlParam('wbraid')
  const gbraid = getUrlParam('gbraid')

  if (gclid) setCookie('gclid', gclid, CLICK_ID_EXPIRY_DAYS)
  if (msclkid) setCookie('msclkid', msclkid, CLICK_ID_EXPIRY_DAYS)
  if (fbclid) setCookie('fbclid', fbclid, CLICK_ID_EXPIRY_DAYS)
  if (wbraid) setCookie('wbraid', wbraid, CLICK_ID_EXPIRY_DAYS)
  if (gbraid) setCookie('gbraid', gbraid, CLICK_ID_EXPIRY_DAYS)
}

// ---------------------------------------------------------------------------
// Collect all tracking params for form submission
// ---------------------------------------------------------------------------

export function getTrackingParams(): TrackingParams {
  if (typeof window === 'undefined') {
    return emptyTrackingParams()
  }

  // Fall back to URL params if cookies are empty — handles first-visit timing
  // gap where initTracking() hasn't run yet (e.g. direct mail QR code scan)
  const utmSource = getCookie('utm_source') || getUrlParam('utm_source')
  const utmMedium = getCookie('utm_medium') || getUrlParam('utm_medium')
  const referrer = getCookie(`${COOKIE_PREFIX}ref`) || document.referrer
  const originalReferrer = getCookie(`${COOKIE_PREFIX}original_ref`) || ''
  const landingPage = getCookie(`${COOKIE_PREFIX}landing_page`) || ''
  const currentUrl = window.location.href

  const { source: organicSource, str: organicStr } = detectOrganicSource(
    originalReferrer || referrer
  )

  const trafficSource = deriveTrafficSource(utmMedium, utmSource, originalReferrer || referrer)

  const firstUtmSource = getCookie('first_utm_source')
  const firstUtmMedium = getCookie('first_utm_medium')
  const firstTrafficSource = deriveTrafficSource(
    firstUtmMedium,
    firstUtmSource,
    originalReferrer
  )

  return {
    utm_source: utmSource,
    utm_medium: utmMedium,
    utm_term: getCookie('utm_term') || getUrlParam('utm_term'),
    utm_content: getCookie('utm_content') || getUrlParam('utm_content'),
    utm_campaign: getCookie('utm_campaign') || getUrlParam('utm_campaign'),
    utm_campaign_id: getCookie('utm_campaign_id') || getUrlParam('utm_campaign_id'),

    first_utm_source: firstUtmSource || getUrlParam('utm_source'),
    first_utm_medium: firstUtmMedium || getUrlParam('utm_medium'),
    first_utm_term: getCookie('first_utm_term') || getUrlParam('utm_term'),
    first_utm_content: getCookie('first_utm_content') || getUrlParam('utm_content'),
    first_utm_campaign: getCookie('first_utm_campaign') || getUrlParam('utm_campaign'),

    gclid: getCookie('gclid'),
    msclkid: getCookie('msclkid'),
    fbclid: getCookie('fbclid'),
    wbraid: getCookie('wbraid'),
    gbraid: getCookie('gbraid'),

    original_referrer: originalReferrer,
    landing_page: landingPage,
    referrer: referrer,
    form_url: currentUrl,

    gaclientid: getGAClientId(),
    organic_source: organicSource,
    organic_source_str: organicStr,
    traffic_source: trafficSource,
    first_traffic_source: firstTrafficSource,
  }
}

function emptyTrackingParams(): TrackingParams {
  return {
    utm_source: '', utm_medium: '', utm_term: '', utm_content: '',
    utm_campaign: '', utm_campaign_id: '',
    first_utm_source: '', first_utm_medium: '', first_utm_term: '',
    first_utm_content: '', first_utm_campaign: '',
    gclid: '', msclkid: '', fbclid: '', wbraid: '', gbraid: '',
    original_referrer: '', landing_page: '', referrer: '', form_url: '',
    gaclientid: '', organic_source: '', organic_source_str: '',
    traffic_source: 'Direct', first_traffic_source: 'Direct',
  }
}

// ---------------------------------------------------------------------------
// Helper to get HandL-specific cookie values for the webhook payload
// These are sent separately because the HandL fields reference cookie values
// that may differ from the derived/merged tracking params above.
// ---------------------------------------------------------------------------

export function getHandlCookieValues() {
  return {
    handlID: getCookie(`${COOKIE_PREFIX}ID`),
    handl_landing_page_base: getBaseUrl(getCookie(`${COOKIE_PREFIX}landing_page`)),
    handl_ref_domain: getDomainFromUrl(getCookie(`${COOKIE_PREFIX}ref`)),
    handl_url_base: getBaseUrl(getCookie(`${COOKIE_PREFIX}url`)),
    _fbc: getFbc(),
    _fbp: getFbp(),
  }
}
