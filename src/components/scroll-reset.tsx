'use client'

import { useEffect } from 'react'

/**
 * Disables browser scroll restoration and forces the page to the top on mount.
 * iOS Safari (bfcache) restores the previous scroll position when navigating
 * back to a page, which causes the page to appear mid-scroll on load.
 */
export function ScrollReset() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    window.history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
  }, [])

  return null
}
