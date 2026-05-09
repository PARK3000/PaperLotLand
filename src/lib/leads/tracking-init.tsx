'use client'

import { useEffect } from 'react'
import { initTracking } from './tracking-params'

/**
 * Invisible component that initializes UTM/click ID tracking on every page load.
 * Drop this into the root layout so tracking cookies are set before any form submit.
 */
export function TrackingInit() {
  useEffect(() => {
    initTracking()
  }, [])

  return null
}
