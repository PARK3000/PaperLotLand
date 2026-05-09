'use client'

/**
 * Unified Chat + Schedule + Call floating widget.
 *
 * Replaces:
 *   - src/components/layout/floating-cta-widget.tsx (calendar pill)
 *   - theglobalcdn.com / "designstudio" third-party chat subscription
 *
 * The button shows Jamie's avatar with:
 *   - Red "1" notification badge (until first open)
 *   - Mini calendar+phone badge (signals scheduling capability)
 *   - Welcome tooltip 4 s after page load (once per session)
 */

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { ChatPanel, type PanelTab } from './chat-panel'

const TOOLTIP_KEY = 'chat_widget_tooltip_shown'

export function ChatWidget() {
  const pathname = usePathname()
  const [panelOpen, setPanelOpen] = useState(false)
  const [initialTab, setInitialTab] = useState<PanelTab>('chat')
  const [badgeDismissed, setBadgeDismissed] = useState(false)
  const [tooltipVisible, setTooltipVisible] = useState(false)
  const tooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Hide on admin pages
  if (pathname?.startsWith('/admin')) return null

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    // Show welcome tooltip once per session after 4 s
    try {
      if (!sessionStorage.getItem(TOOLTIP_KEY)) {
        tooltipTimerRef.current = setTimeout(() => {
          setTooltipVisible(true)
          // Auto-dismiss after 5 s
          dismissTimerRef.current = setTimeout(() => {
            setTooltipVisible(false)
            try { sessionStorage.setItem(TOOLTIP_KEY, '1') } catch { /* ignore */ }
          }, 5000)
        }, 4000)
      }
    } catch { /* sessionStorage blocked */ }

    return () => {
      if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current)
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current)
    }
  }, [])

  const openPanel = (tab: PanelTab = 'chat') => {
    setInitialTab(tab)
    setPanelOpen(true)
    setBadgeDismissed(true)
    setTooltipVisible(false)
    try { sessionStorage.setItem(TOOLTIP_KEY, '1') } catch { /* ignore */ }
  }

  const handleButtonClick = () => openPanel('chat')

  return (
    <>
      {/* Floating button */}
      <div
        className={[
          'fixed right-4 z-50 transition-all duration-300',
          // Above MobileCTABar on mobile, above fixed bottom on desktop
          'bottom-[calc(88px+env(safe-area-inset-bottom)+12px)] lg:bottom-6',
        ].join(' ')}
      >
        {/* Welcome tooltip */}
        {tooltipVisible && (
          <div
            className="absolute bottom-[calc(100%+10px)] right-0 w-52 animate-fade-in rounded-xl bg-white px-3.5 py-2.5 shadow-lg ring-1 ring-slate-200"
            role="status"
          >
            <p className="text-sm font-medium leading-snug text-[var(--color-text)]">
              Hi! I&apos;m Jamie — tap to get your offer 👋
            </p>
            {/* Tail */}
            <span className="absolute -bottom-2 right-5 h-3 w-3 rotate-45 bg-white shadow-sm ring-1 ring-slate-200" aria-hidden="true" />
          </div>
        )}

        <button
          type="button"
          onClick={handleButtonClick}
          aria-label="Chat with Jamie"
          className="relative flex h-[58px] w-[58px] items-center justify-center rounded-full bg-white shadow-lg ring-2 ring-[var(--color-primary)] transition-transform hover:scale-105 active:scale-95 lg:h-[70px] lg:w-[70px]"
        >
          {/* Jamie avatar */}
          <Image
            src="/images/team/parker-gibbons.jpg"
            alt="Jamie Kirk"
            fill
            sizes="(min-width: 1024px) 70px, 58px"
            className="rounded-full object-cover"
            priority
          />

          {/* Red notification badge */}
          {!badgeDismissed && (
            <span
              className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-accent)] text-[10px] font-bold text-white ring-2 ring-white lg:h-6 lg:w-6 lg:text-xs"
              aria-label="1 new message"
            >
              1
            </span>
          )}

          {/* Calendar mini-badge (bottom-right) */}
          <span
            className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-primary)] ring-2 ring-white lg:h-6 lg:w-6"
            aria-hidden="true"
          >
            <svg className="h-2.5 w-2.5 text-white lg:h-3 lg:w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M8 7V3m8 4V3M5 11h14M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </span>
        </button>
      </div>

      <ChatPanel
        open={panelOpen}
        initialTab={initialTab}
        onClose={() => setPanelOpen(false)}
      />
    </>
  )
}
