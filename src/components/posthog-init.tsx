'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import posthog from 'posthog-js'

export function PostHogInit() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'
    if (!key) return

    // Read ph_did cookie set by middleware so client identity matches server
    // flag evaluation. Without this, a server-rendered variant could disagree
    // with the client's own evaluation on hydration.
    const phDid = (() => {
      if (typeof document === 'undefined') return undefined
      const m = document.cookie.match(/(?:^|;\s*)ph_did=([^;]+)/)
      return m ? decodeURIComponent(m[1]) : undefined
    })()

    const init = () => {
      if (posthog.__loaded) return
      posthog.init(key, {
        api_host: host,
        capture_pageview: false,
        capture_pageleave: true,
        person_profiles: 'identified_only',
        disable_surveys: true,
        defaults: '2025-05-24',
        ...(phDid ? { bootstrap: { distinctID: phDid } } : {}),
      })
    }

    if ('requestIdleCallback' in window) {
      requestIdleCallback(init)
    } else {
      setTimeout(init, 1)
    }
  }, [])

  useEffect(() => {
    if (!posthog.__loaded) return
    const query = searchParams?.toString()
    const url = query ? `${pathname}?${query}` : pathname
    posthog.capture('$pageview', { $current_url: window.location.origin + url })
  }, [pathname, searchParams])

  return null
}
