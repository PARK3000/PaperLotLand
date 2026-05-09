'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { useTrackEvent } from '@/lib/analytics'
import { ANALYTICS_EVENTS } from '@/lib/analytics/events'

// ─── Configuration ───────────────────────────────────────────────

const TRIGGER_CONFIG = {
  /** Idle timeout before popup triggers (desktop) */
  idleDesktop: 10_000,
  /** Idle timeout before popup triggers (mobile) */
  idleMobile: 30_000,
  /** Scroll depth (0-1) at which a stall triggers popup */
  scrollStallDepth: 0.5,
  /** How long user must pause at stall depth before trigger (ms) */
  scrollStallPause: 4_000,
  /** Minimum time on page before exit intent can fire (ms) */
  exitIntentDelay: 3_000,
  /** Cooldown after page load / SPA navigation before any trigger (ms) */
  pageLoadCooldown: 3_000,
  /** Mouse distance from top of viewport to trigger exit intent (px) */
  exitIntentThreshold: 20,
  /** Throttle interval for scroll events (ms) */
  scrollThrottle: 200,
  /** Throttle interval for mousemove events (ms) */
  mousemoveThrottle: 500,
} as const

/** Pages where the popup should never appear */
const SUPPRESSED_PATHS = ['/thank-you', '/booking', '/get-your-cash-today', '/contact-us', '/careers']

/** Cookie/storage keys */
const COOKIE_POPUP_SHOWN = 'popup_shown'
const COOKIE_POPUP_CONVERTED = 'popup_converted'
const COOKIE_EXIT_INTENT_SHOWN = 'exit_intent_shown' // backward compat
const LS_POPUP_CONVERTED = 'popup_converted'

type TriggerType = 'exit_intent' | 'idle' | 'scroll_stall'

// ─── Cookie Helpers ──────────────────────────────────────────────

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null
  return null
}

function setCookie(name: string, value: string, days?: number): void {
  if (typeof document === 'undefined') return
  let cookie = `${name}=${value}; path=/; SameSite=Lax`
  if (days) {
    const expires = new Date()
    expires.setDate(expires.getDate() + days)
    cookie += `; expires=${expires.toUTCString()}`
  }
  document.cookie = cookie
}

function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false
  return window.innerWidth < 1024 || 'ontouchstart' in window
}

function getScrollDepth(): number {
  const scrollTop = window.scrollY || document.documentElement.scrollTop
  const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight
  if (docHeight <= 0) return 0
  return scrollTop / docHeight
}

function isFormFieldActive(): boolean {
  const el = document.activeElement
  if (!el) return false
  return el.matches('input, select, textarea') && !!el.closest('form')
}

// ─── Suppression Check ──────────────────────────────────────────

function canShowPopup(pathname: string, pageLoadTime: number): boolean {
  // 1. Page load cooldown
  if (Date.now() - pageLoadTime < TRIGGER_CONFIG.pageLoadCooldown) return false

  // 2. Already shown this session (new cookie or old cookie for backward compat)
  if (getCookie(COOKIE_POPUP_SHOWN) === '1') return false
  if (getCookie(COOKIE_EXIT_INTENT_SHOWN)) return false

  // 3. Returning converter
  if (getCookie(COOKIE_POPUP_CONVERTED) === '1') return false
  try {
    if (typeof localStorage !== 'undefined' && localStorage.getItem(LS_POPUP_CONVERTED)) return false
  } catch {
    // localStorage may be blocked
  }

  // 4. Suppressed page
  if (SUPPRESSED_PATHS.some((p) => pathname.startsWith(p))) return false

  // 5. Form field active
  if (isFormFieldActive()) return false

  return true
}

// ─── Hook ────────────────────────────────────────────────────────

interface UsePopupTriggersOptions {
  disabled?: boolean
}

export function usePopupTriggers({ disabled = false }: UsePopupTriggersOptions = {}) {
  const [isVisible, setIsVisible] = useState(false)
  const pathname = usePathname()
  const trackEvent = useTrackEvent()

  // Refs for mutable state that shouldn't trigger re-renders
  const hasTriggered = useRef(false)
  const pageLoadTime = useRef(Date.now())
  const lastActivityTime = useRef(Date.now())
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scrollStallTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastScrollThrottle = useRef(0)
  const lastMousemoveThrottle = useRef(0)
  const hasPassedScrollStallDepth = useRef(false)
  const isTabVisible = useRef(true)
  const triggerTypeRef = useRef<TriggerType | null>(null)

  // ─── Fire popup ──────────────────────────────────────

  const firePopup = useCallback(
    (trigger: TriggerType) => {
      if (hasTriggered.current) return
      if (!canShowPopup(pathname, pageLoadTime.current)) return

      hasTriggered.current = true
      triggerTypeRef.current = trigger
      setIsVisible(true)

      trackEvent(ANALYTICS_EVENTS.POPUP_VIEWED, {
        trigger_type: trigger,
        device_type: isMobileDevice() ? 'mobile' : 'desktop',
        time_on_page_ms: Date.now() - pageLoadTime.current,
        scroll_depth_percent: Math.round(getScrollDepth() * 100),
        pathname,
      })
    },
    [pathname, trackEvent]
  )

  // ─── Dismiss ─────────────────────────────────────────

  const dismiss = useCallback(() => {
    setIsVisible(false)
    setCookie(COOKIE_POPUP_SHOWN, '1') // session cookie (no expiry)

    trackEvent(ANALYTICS_EVENTS.POPUP_CLOSED, {
      trigger_type: triggerTypeRef.current,
      pathname,
    })
  }, [pathname, trackEvent])

  // ─── Track conversion ────────────────────────────────

  const trackConversion = useCallback(() => {
    setCookie(COOKIE_POPUP_CONVERTED, '1', 30)
    try {
      localStorage.setItem(LS_POPUP_CONVERTED, '1')
    } catch {
      // localStorage may be blocked
    }

    trackEvent(ANALYTICS_EVENTS.POPUP_CONVERTED, {
      trigger_type: triggerTypeRef.current,
      pathname,
    })
  }, [pathname, trackEvent])

  // ─── Reset on SPA navigation ─────────────────────────

  useEffect(() => {
    // Reset page-level state (but NOT session-level flags like hasTriggered)
    pageLoadTime.current = Date.now()
    lastActivityTime.current = Date.now()
    hasPassedScrollStallDepth.current = false

    if (idleTimer.current) clearTimeout(idleTimer.current)
    if (scrollStallTimer.current) clearTimeout(scrollStallTimer.current)
    idleTimer.current = null
    scrollStallTimer.current = null
  }, [pathname])

  // ─── Event listeners ─────────────────────────────────

  useEffect(() => {
    if (disabled || typeof window === 'undefined') return
    if (hasTriggered.current) return

    // Early exit if already suppressed for the session
    if (getCookie(COOKIE_POPUP_SHOWN) === '1' || getCookie(COOKIE_EXIT_INTENT_SHOWN)) return
    if (getCookie(COOKIE_POPUP_CONVERTED) === '1') return
    try {
      if (typeof localStorage !== 'undefined' && localStorage.getItem(LS_POPUP_CONVERTED)) return
    } catch {
      // localStorage may be blocked
    }

    const mobile = isMobileDevice()
    const idleTimeout = mobile ? TRIGGER_CONFIG.idleMobile : TRIGGER_CONFIG.idleDesktop

    // ─── Idle timer management ────────────────────

    const resetIdleTimer = () => {
      if (hasTriggered.current || !isTabVisible.current) return
      lastActivityTime.current = Date.now()

      if (idleTimer.current) clearTimeout(idleTimer.current)
      idleTimer.current = setTimeout(() => {
        if (!hasTriggered.current && isTabVisible.current) {
          firePopup('idle')
        }
      }, idleTimeout)
    }

    // Start the first idle timer
    resetIdleTimer()

    // ─── Activity listeners ───────────────────────

    const handleActivity = () => {
      resetIdleTimer()
    }

    const handleScroll = () => {
      // Throttle
      const now = Date.now()
      if (now - lastScrollThrottle.current < TRIGGER_CONFIG.scrollThrottle) return
      lastScrollThrottle.current = now

      // Reset idle on scroll
      resetIdleTimer()

      // Scroll stall detection
      if (hasTriggered.current) return
      const depth = getScrollDepth()

      if (depth >= TRIGGER_CONFIG.scrollStallDepth && !hasPassedScrollStallDepth.current) {
        hasPassedScrollStallDepth.current = true

        // Start stall timer — if user stops scrolling at this depth
        if (scrollStallTimer.current) clearTimeout(scrollStallTimer.current)
        scrollStallTimer.current = setTimeout(() => {
          if (!hasTriggered.current) {
            firePopup('scroll_stall')
          }
        }, TRIGGER_CONFIG.scrollStallPause)
      }

      // If user keeps scrolling past stall depth, restart the stall timer
      if (hasPassedScrollStallDepth.current) {
        if (scrollStallTimer.current) clearTimeout(scrollStallTimer.current)
        scrollStallTimer.current = setTimeout(() => {
          if (!hasTriggered.current) {
            firePopup('scroll_stall')
          }
        }, TRIGGER_CONFIG.scrollStallPause)
      }
    }

    const handleMousemove = () => {
      // Throttle
      const now = Date.now()
      if (now - lastMousemoveThrottle.current < TRIGGER_CONFIG.mousemoveThrottle) return
      lastMousemoveThrottle.current = now

      resetIdleTimer()
    }

    // ─── Exit intent (desktop only) ───────────────

    const handleMouseLeave = (e: MouseEvent) => {
      if (hasTriggered.current || mobile) return
      if (e.clientY <= TRIGGER_CONFIG.exitIntentThreshold) {
        if (Date.now() - pageLoadTime.current >= TRIGGER_CONFIG.exitIntentDelay) {
          firePopup('exit_intent')
        }
      }
    }

    // ─── Visibility change (pause idle on background) ─

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        isTabVisible.current = false
        // Pause idle timer when tab is hidden
        if (idleTimer.current) {
          clearTimeout(idleTimer.current)
          idleTimer.current = null
        }
      } else {
        isTabVisible.current = true
        // Resume idle timer when tab becomes visible
        resetIdleTimer()
      }
    }

    // ─── Register listeners ───────────────────────

    document.addEventListener('mouseleave', handleMouseLeave)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('mousemove', handleMousemove, { passive: true })
    window.addEventListener('click', handleActivity, { passive: true })
    window.addEventListener('touchstart', handleActivity, { passive: true })
    window.addEventListener('keydown', handleActivity, { passive: true })

    // ─── Cleanup ──────────────────────────────────

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('mousemove', handleMousemove)
      window.removeEventListener('click', handleActivity)
      window.removeEventListener('touchstart', handleActivity)
      window.removeEventListener('keydown', handleActivity)

      if (idleTimer.current) clearTimeout(idleTimer.current)
      if (scrollStallTimer.current) clearTimeout(scrollStallTimer.current)
    }
  }, [disabled, pathname, firePopup])

  return {
    isVisible,
    dismiss,
    trackConversion,
    triggerType: triggerTypeRef.current,
  }
}
