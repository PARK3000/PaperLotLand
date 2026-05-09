'use client'

import { useEffect } from 'react'
import Clarity from '@microsoft/clarity'

const CLARITY_PROJECT_ID = 'rk2y22s3b5'

export function ClarityInit() {
  useEffect(() => {
    // Defer to idle so Clarity doesn't compete with React hydration.
    // Clarity needs the live DOM (no retroactive queue like GA4's dataLayer),
    // but waiting for idle is fine — it just misses a few hundred ms of DOM
    // mutations that happened during hydration, which Clarity doesn't need.
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => Clarity.init(CLARITY_PROJECT_ID))
    } else {
      setTimeout(() => Clarity.init(CLARITY_PROJECT_ID), 1)
    }
  }, [])

  return null
}
