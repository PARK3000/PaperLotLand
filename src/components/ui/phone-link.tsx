'use client'

import { useTrackEvent } from '@/lib/analytics'
import { ANALYTICS_EVENTS } from '@/lib/analytics/events'
import { getPageType } from '@/lib/analytics/page-type'
import { BUSINESS } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface PhoneLinkProps {
  /**
   * Where in the UI this phone link appears
   * Used for analytics segmentation
   */
  location:
    | 'header'
    | 'header-top-bar'
    | 'header-desktop-cta'
    | 'header-mobile-button'
    | 'header-mobile-menu'
    | 'footer'
    | 'mobile-cta-bar'
    | 'hero'
    | 'cta-section'
    | 'contact'
    | 'popup'
  /**
   * Optional custom phone number (defaults to BUSINESS.phone)
   */
  phone?: string
  /**
   * Optional custom display text (defaults to BUSINESS.phoneDisplay)
   */
  display?: string
  /**
   * Additional CSS classes
   */
  className?: string
  /**
   * Children to render instead of display text
   */
  children?: React.ReactNode
  /**
   * Accessible label for screen readers
   */
  'aria-label'?: string
}

export function PhoneLink({
  location,
  phone = BUSINESS.phone,
  display = BUSINESS.phoneDisplay,
  className,
  children,
  'aria-label': ariaLabel,
}: PhoneLinkProps) {
  const trackEvent = useTrackEvent()

  const handleClick = () => {
    const pathname = typeof window !== 'undefined' ? window.location.pathname : ''
    trackEvent(ANALYTICS_EVENTS.PHONE_CLICKED, {
      phone_number: phone,
      click_location: location,
      page_type: getPageType(pathname),
      page_url: pathname,
    })
  }

  // Format phone for tel: link (remove non-numeric characters)
  const telHref = `tel:${phone.replace(/\D/g, '')}`

  return (
    <a
      href={telHref}
      onClick={handleClick}
      className={cn('transition-colors', className)}
      aria-label={ariaLabel}
    >
      {children || display}
    </a>
  )
}
