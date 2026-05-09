'use client'

import Link from 'next/link'
import { BUSINESS } from '@/lib/constants'
import { useTrackEvent } from '@/lib/analytics'
import { ANALYTICS_EVENTS } from '@/lib/analytics/events'
import { getPageType } from '@/lib/analytics/page-type'

interface CTASectionProps {
  title?: string
  subtitle?: string
  variant?: 'primary' | 'accent' | 'blue'
  showPhone?: boolean
}

export function CTASection({
  title = 'Ready to Access Off-Market Land Deals?',
  subtitle = 'Get early access to off-market land deals in the Las Vegas Valley. Join our private network of developers, brokers, and investors.',
  variant = 'primary',
  showPhone = true,
}: CTASectionProps) {
  const trackEvent = useTrackEvent()
  const handleCtaClick = () => {
    const pathname = typeof window !== 'undefined' ? window.location.pathname : ''
    trackEvent(ANALYTICS_EVENTS.CTA_CLICKED, {
      cta_id: 'cta-section-join-network',
      cta_text: 'Join the Network',
      page_type: getPageType(pathname),
      page_url: pathname,
    })
  }

  const bgClass =
    variant === 'primary'
      ? 'bg-[var(--color-primary)]'
      : variant === 'blue'
      ? 'bg-[#0e7490]'
      : 'bg-[var(--color-accent)]'

  return (
    <section className={`${bgClass} py-16 md:py-20`}>
      <div className="container-custom">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-white md:text-4xl">{title}</h2>
          <p className="mt-4 text-lg text-white">{subtitle}</p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/off-market-deals/"
              onClick={handleCtaClick}
              className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-3 font-semibold text-[var(--color-primary)] transition-colors hover:bg-gray-100"
            >
              Join the Network
            </Link>
            {showPhone && (
              <a
                href={`tel:${BUSINESS.phone}`}
                className="inline-flex items-center gap-2 rounded-lg border-2 border-white px-8 py-3 font-semibold text-white transition-colors hover:bg-white/10"
              >
                <PhoneIcon className="h-5 w-5" />
                {BUSINESS.phoneDisplay}
              </a>
            )}
          </div>

          {/* Trust indicators */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <span className="flex items-center gap-2 text-sm text-white">
              <CheckIcon className="h-4 w-4 text-white" />
              Off-Market Access
            </span>
            <span className="flex items-center gap-2 text-sm text-white">
              <CheckIcon className="h-4 w-4 text-white" />
              No Obligation
            </span>
            <span className="flex items-center gap-2 text-sm text-white">
              <CheckIcon className="h-4 w-4 text-white" />
              Las Vegas Valley Network
            </span>
          </div>
        </div>
      </div>
    </section>
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

function CheckIcon({ className }: { className?: string }) {
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
        d="M5 13l4 4L19 7"
      />
    </svg>
  )
}
