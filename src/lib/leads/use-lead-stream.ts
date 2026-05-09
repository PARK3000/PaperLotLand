'use client'

import { useRef, useCallback, useEffect } from 'react'
import { getTrackingParams, getHandlCookieValues, getGAClientId, getHandlID } from '@/lib/leads/tracking-params'

const INTERVAL_MS = 10_000 // Send every 10 seconds
const ADDRESS_SELECTED_DELAY_MS = 8000 // Debounce: cancelled if address_submit fires first

export type StreamTrigger =
  | 'address_selected'
  | 'partial_update'
  | 'address_submit'
  | 'form_submit'

interface StreamPayload {
  sessionToken: string
  formId: string
  formVariant: string
  pageUrl: string
  fields: Record<string, string>
  trigger: StreamTrigger
  tracking: ReturnType<typeof getTrackingParams>
  handlCookies: ReturnType<typeof getHandlCookieValues>
}

/**
 * Replaces useFormHeartbeat. Instead of saving to Redis on blur,
 * this streams lead data directly to the API (which forwards to n8n)
 * on specific triggers and on a 10-second interval.
 */
export function useLeadStream(formId: string, formVariant: string) {
  const tokenRef = useRef('')
  const fieldsRef = useRef<Record<string, string>>({})
  const lastSentRef = useRef<string>('') // JSON snapshot of last sent fields
  const seededFieldsRef = useRef<Set<string>>(new Set()) // Fields pre-populated via seedField
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const doneRef = useRef(false)
  const addressSelectedTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // SSR-safe lazy init of session token.
  // Resolution priority (most stable first):
  //   1. Existing value in sessionStorage (reuse within the same tab)
  //   2. GA client ID from the _ga cookie → prefix with "ga_" (browser-stable, 2yr)
  //   3. HandL ID (page-load stable)
  //   4. Fresh UUID fallback
  useEffect(() => {
    // If this session already completed a full submit, stop streaming immediately
    if (sessionStorage.getItem(`leadstream:${formId}:done`)) {
      doneRef.current = true
      return
    }
    const key = `leadstream:${formId}`
    const existing = sessionStorage.getItem(key)
    if (existing) {
      tokenRef.current = existing
      return
    }
    const gaId = getGAClientId()
    const handlId = getHandlID()
    const token = gaId
      ? `ga_${gaId}`
      : handlId
        ? handlId
        : crypto.randomUUID()
    sessionStorage.setItem(key, token)
    tokenRef.current = token
  }, [formId])

  const send = useCallback((trigger: StreamTrigger) => {
    if (doneRef.current || !tokenRef.current) return
    const fields = fieldsRef.current
    if (!Object.keys(fields).length) return

    // For interval sends, skip if nothing changed since last send
    if (trigger === 'partial_update') {
      // Don't send if every field was pre-seeded — no user input yet
      // (e.g. contact form arrives with address already seeded from URL param)
      const hasUserInput = Object.keys(fields).some(k => !seededFieldsRef.current.has(k))
      if (!hasUserInput) return
      // Don't send until there's at least an address or phone — name-only partials
      // are not actionable and just create noise in n8n
      const hasActionableData = !!(fields.address || fields.phone)
      if (!hasActionableData) return
      const snapshot = JSON.stringify(fields)
      if (snapshot === lastSentRef.current) return
      lastSentRef.current = snapshot
    } else {
      // For explicit triggers, always update the snapshot
      lastSentRef.current = JSON.stringify(fields)
    }

    const payload: StreamPayload = {
      sessionToken: tokenRef.current,
      formId,
      formVariant,
      pageUrl: window.location.pathname,
      fields: { ...fields },
      trigger,
      tracking: getTrackingParams(),
      handlCookies: getHandlCookieValues(),
    }

    // Use sendBeacon for fire-and-forget (doesn't block navigation)
    // Fall back to fetch for triggers that need reliability
    if (trigger === 'partial_update') {
      navigator.sendBeacon(
        '/api/leads/stream',
        new Blob([JSON.stringify(payload)], { type: 'application/json' })
      )
    } else {
      fetch('/api/leads/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch((err) => {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[lead-stream] send failed:', err.message)
        }
      })
    }
  }, [formId, formVariant])

  // Reset the interval timer — call after any explicit trigger to avoid
  // a partial_update racing with the trigger we just sent.
  const resetInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    if (!doneRef.current) {
      intervalRef.current = setInterval(() => {
        send('partial_update')
      }, INTERVAL_MS)
    }
  }, [send])

  // Start the 10-second interval when a field gets its first value
  const ensureInterval = useCallback(() => {
    if (intervalRef.current || doneRef.current) return
    intervalRef.current = setInterval(() => {
      send('partial_update')
    }, INTERVAL_MS)
  }, [send])

  // Pre-populate a field value without starting the interval timer.
  // Use for URL-param or server-prop defaults so that the first
  // partial_update already includes pre-filled data.
  const seedField = useCallback((fieldName: string, value: string) => {
    if (doneRef.current) return
    const cleaned = value.replace(/[\x00-\x1f\x7f]/g, '').trim()
    if (cleaned) {
      fieldsRef.current[fieldName] = cleaned
      seededFieldsRef.current.add(fieldName)
    }
  }, [])

  // Called when any field value changes (on blur or on change for address)
  const updateField = useCallback((fieldName: string, value: string) => {
    if (doneRef.current) return
    // Strip control characters (newlines, tabs, etc.) that mobile keyboards
    // or autofill can inject — see lead ID 188 / Sylvia Montes bug
    const cleaned = value.replace(/[\x00-\x1f\x7f]/g, '').trim()
    if (cleaned) {
      // Only capture phone/email when the value is complete — avoid sending
      // partial "702" or "john@" to n8n while the user is still typing
      if (fieldName === 'phone' && cleaned.replace(/\D/g, '').length < 10) return
      if (fieldName === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) return
      fieldsRef.current[fieldName] = cleaned
      ensureInterval()
    }
  }, [ensureInterval])

  // Trigger: Google Places address selection
  // Debounced: if address_submit fires within ADDRESS_SELECTED_DELAY_MS, this is cancelled.
  // Prevents race condition when user selects address and immediately clicks Next (~252ms gap).
  const onAddressSelected = useCallback((address: string) => {
    if (doneRef.current) return
    fieldsRef.current.address = address
    // Reset interval immediately so partial_update won't race with this trigger
    resetInterval()
    // Cancel any previously pending address_selected send (e.g. user re-selects address)
    if (addressSelectedTimerRef.current) {
      clearTimeout(addressSelectedTimerRef.current)
    }
    addressSelectedTimerRef.current = setTimeout(() => {
      addressSelectedTimerRef.current = undefined
      send('address_selected')
    }, ADDRESS_SELECTED_DELAY_MS)
  }, [send, resetInterval])

  // Trigger: Address step submit (step 1 of multi-step)
  const onAddressSubmit = useCallback(() => {
    // Cancel pending address_selected — address_submit supersedes it
    if (addressSelectedTimerRef.current) {
      clearTimeout(addressSelectedTimerRef.current)
      addressSelectedTimerRef.current = undefined
    }
    send('address_submit')
    // Reset interval so partial_update won't fire right after this trigger
    resetInterval()
  }, [send, resetInterval])

  // Cancel streaming (called right before full form submit)
  const cancel = useCallback(() => {
    doneRef.current = true
    // Persist across page reloads so returning to the form doesn't restart streaming
    try { sessionStorage.setItem(`leadstream:${formId}:done`, '1') } catch {}
    if (addressSelectedTimerRef.current) {
      clearTimeout(addressSelectedTimerRef.current)
      addressSelectedTimerRef.current = undefined
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = undefined
    }
  }, [])

  const getSessionToken = useCallback(() => tokenRef.current, [])

  // Flush on tab close / navigate away
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden' && !doneRef.current) {
        send('partial_update')
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [send])

  return {
    seedField,
    updateField,
    onAddressSelected,
    onAddressSubmit,
    cancel,
    getSessionToken,
  }
}
