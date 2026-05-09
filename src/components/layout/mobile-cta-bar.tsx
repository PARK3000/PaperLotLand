'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { BUSINESS } from '@/lib/constants'
import { PhoneLink } from '@/components/ui/phone-link'
import { useTrackEvent } from '@/lib/analytics'
import { ANALYTICS_EVENTS } from '@/lib/analytics/events'
import { getPageType } from '@/lib/analytics/page-type'

interface MobileCTABarProps {
  showAfterScroll?: number
}

export function MobileCTABar({ showAfterScroll = 500 }: MobileCTABarProps) {
  const [isVisible, setIsVisible] = useState(false)
  const trackEvent = useTrackEvent()
  const smsHref = `sms:${BUSINESS.phone.replace(/\D/g, '')}`

  const handleTextClick = () => {
    const pathname = typeof window !== 'undefined' ? window.location.pathname : ''
    trackEvent(ANALYTICS_EVENTS.SMS_CLICKED, {
      phone_number: BUSINESS.phone,
      click_location: 'mobile-cta-bar',
      page_type: getPageType(pathname),
      page_url: pathname,
    })
  }

  const handleGetOfferClick = () => {
    const pathname = typeof window !== 'undefined' ? window.location.pathname : ''
    trackEvent(ANALYTICS_EVENTS.CTA_CLICKED, {
      cta_id: 'mobile-cta-bar-join-network',
      cta_text: 'Join Network',
      page_type: getPageType(pathname),
      page_url: pathname,
    })
  }

  useEffect(() => {
    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setIsVisible(window.scrollY > showAfterScroll)
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Check initial position

    return () => window.removeEventListener('scroll', handleScroll)
  }, [showAfterScroll])

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 lg:hidden',
        'transform transition-transform duration-300',
        isVisible ? 'translate-y-0' : 'translate-y-full'
      )}
    >
      {/* Gradient fade at top */}
      <div className="h-4 bg-gradient-to-t from-white to-transparent" />

      {/* CTA Bar */}
      <div className="flex bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.15)]">
        {/* Call Button — 25% */}
        <PhoneLink
          location="mobile-cta-bar"
          className="flex flex-1 items-center justify-center gap-1.5 border-r border-gray-200 py-4 text-base font-semibold text-[var(--color-primary)] active:bg-gray-50"
        >
          <PhoneIcon className="h-5 w-5" />
          Call
        </PhoneLink>

        {/* Text Button — 25% */}
        <a
          href={smsHref}
          onClick={handleTextClick}
          className="flex flex-1 items-center justify-center gap-1.5 border-r border-gray-200 py-4 text-base font-semibold text-[var(--color-primary)] transition-colors active:bg-gray-50"
          aria-label="Text us"
        >
          <MessageIcon className="h-5 w-5" />
          Text
        </a>

        {/* Join Network Button — 50% */}
        <Link
          href="/off-market-deals/"
          onClick={handleGetOfferClick}
          className="flex flex-[2] items-center justify-center gap-2 bg-[#C97D2E] py-4 text-base font-semibold text-white transition-colors active:bg-[#b86d24]"
        >
          <FormIcon className="h-5 w-5" />
          Join Network
        </Link>
      </div>

      {/* Safe area padding for iOS */}
      <div className="h-[env(safe-area-inset-bottom)] bg-white" />
    </div>
  )
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
      />
    </svg>
  )
}

function MessageIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  )
}

function FormIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  )
}
