'use client'

import { useRef, useCallback, useEffect } from 'react'

const DEBOUNCE_MS = 2000

export function useFormHeartbeat(formId: string, formVariant: string) {
  const tokenRef = useRef('')
  const fieldsRef = useRef<Record<string, string>>({})
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const abortRef = useRef<AbortController | undefined>(undefined)
  const doneRef = useRef(false)

  // SSR-safe lazy init of session token
  useEffect(() => {
    const key = `heartbeat:${formId}`
    const existing = sessionStorage.getItem(key)
    if (existing) {
      tokenRef.current = existing
    } else {
      const token = crypto.randomUUID()
      sessionStorage.setItem(key, token)
      tokenRef.current = token
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
    timerRef.current = setTimeout(send, DEBOUNCE_MS)
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

    const handler = () => {
      if (document.visibilityState === 'hidden') flush()
    }

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
