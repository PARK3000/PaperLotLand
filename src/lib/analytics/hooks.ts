'use client'

import { useCallback } from 'react'
import { pushToDataLayer } from './gtag'

/**
 * Hook to track custom events via GTM dataLayer
 */
export function useTrackEvent() {
  return useCallback((eventName: string, properties?: Record<string, unknown>) => {
    pushToDataLayer({
      event: eventName,
      ...properties,
    })
  }, [])
}
