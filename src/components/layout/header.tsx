'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { PhoneLink } from '@/components/ui/phone-link'
import { BUSINESS, NAVIGATION } from '@/lib/constants'
import type { GeneralContent, NavigationContent } from '@/lib/site-content'

export function Header({
  businessData,
  navigation,
}: {
  businessData?: GeneralContent
  navigation?: NavigationContent
} = {}) {
  const phone = businessData?.phone ?? BUSINESS.phone
  const phoneDisplay = businessData?.phoneDisplay ?? BUSINESS.phoneDisplay
  const navItems = navigation?.mainNav ?? NAVIGATION
  const pathname = usePathname()
  const isLandingPage = pathname.startsWith('/lp/')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [mobileDropdowns, setMobileDropdowns] = useState<string[]>([])
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrolled(window.scrollY > 10)
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Check initial position (e.g. browser restored scroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleMouseEnter = (label: string) => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current)
      dropdownTimeoutRef.current = null
    }
    setOpenDropdown(label)
  }

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setOpenDropdown(null)
    }, 150)
  }

  const toggleMobileDropdown = (label: string) => {
    setMobileDropdowns((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    )
  }

  // Minimal header for landing pages: logo + CTA only
  if (isLandingPage) {
    return (
      <header className="sticky top-0 z-50 w-full bg-white shadow-sm">
        <div className="container-custom">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center">
              <Image
                src="/images/logo/logo.svg"
                alt="PaperLotLand"
                width={180}
                height={50}
                priority
                className="h-10 w-auto sm:h-12"
              />
            </Link>
            <PhoneLink
              location="header-desktop-cta"
              phone={phone}
              className="animate-bounce-x inline-flex items-center gap-2.5 rounded-lg bg-[#C97D2E] px-8 py-2.5 text-base font-bold text-white shadow-md transition-all hover:bg-[#b86d24] hover:shadow-lg sm:px-12"
            >
              <PhoneIcon className="h-4.5 w-4.5" />
              {phoneDisplay}
            </PhoneLink>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full transition-all duration-200',
        scrolled ? 'shadow-md' : ''
      )}
    >
      {/* Top bar */}
      <div className="hidden border-b border-gray-100 bg-white text-black md:block">
        <div className="container-custom flex items-center justify-center py-2">
          <p className="text-sm font-medium tracking-wide text-gray-600">
            Las Vegas Valley&apos;s Off-Market Land Network — Developers, Brokers & Investors
          </p>
        </div>
      </div>

      {/* Main navigation - white background */}
      <div className="bg-white shadow-sm">
        <div className="container-custom">
          <div
            className={cn(
              'flex items-center justify-between transition-all duration-200',
              scrolled ? 'h-16' : 'h-20'
            )}
          >
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <Image
                src="/images/logo/logo.svg"
                alt="PaperLotLand"
                width={180}
                height={50}
                priority
                className="h-10 w-auto sm:h-12"
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden items-center gap-0.5 lg:flex">
              {navItems.map((item) =>
                item.children ? (
                  <div
                    key={item.label}
                    className="relative"
                    onMouseEnter={() => handleMouseEnter(item.label)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-1 rounded-md px-3 py-2 text-[15px] font-semibold transition-colors',
                        openDropdown === item.label
                          ? 'text-accent'
                          : 'text-gray-800 hover:text-accent'
                      )}
                    >
                      {item.label}
                      <ChevronDownIcon
                        className={cn(
                          'h-3.5 w-3.5 transition-transform',
                          openDropdown === item.label && 'rotate-180'
                        )}
                      />
                    </Link>
                    {openDropdown === item.label && (
                      <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-lg border border-gray-100 bg-white py-1.5 shadow-lg">
                        {item.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className="block px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-accent"
                            onClick={() => setOpenDropdown(null)}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-md px-3 py-2 text-[15px] font-semibold text-gray-800 transition-colors hover:text-accent"
                  >
                    {item.label}
                  </Link>
                )
              )}
            </nav>

            {/* Desktop CTA - Phone Button */}
            <div className="hidden items-center lg:flex">
              <PhoneLink
                location="header-desktop-cta"
                phone={phone}
                className="animate-bounce-x inline-flex items-center gap-2.5 rounded-lg bg-[#C97D2E] px-12 py-3 text-[17px] font-bold text-white shadow-md transition-all hover:bg-[#b86d24] hover:shadow-lg"
              >
                <PhoneIcon className="h-4.5 w-4.5" />
                {phoneDisplay}
              </PhoneLink>
            </div>

            {/* Mobile: Phone + Menu */}
            <div className="flex items-center gap-2 lg:hidden">
              <PhoneLink
                location="header-mobile-button"
                phone={phone}
                className="animate-bounce-x inline-flex items-center gap-2 rounded-lg bg-[#C97D2E] px-4 py-3 text-[15px] font-bold text-white shadow-md transition-all hover:bg-[#b86d24] hover:shadow-lg"
                aria-label="Call us"
              >
                <PhoneIcon className="h-4.5 w-4.5 shrink-0" />
                {phoneDisplay}
              </PhoneLink>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-expanded={mobileMenuOpen}
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? (
                  <CloseIcon className="h-6 w-6" />
                ) : (
                  <MenuIcon className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          'overflow-hidden bg-white transition-all duration-200 lg:hidden',
          mobileMenuOpen ? 'max-h-[600px] border-t border-gray-200' : 'max-h-0'
        )}
      >
        <div className="container-custom pb-4 pt-2">
          <nav className="space-y-1">
            {navItems.map((item) =>
              item.children ? (
                <div key={item.label}>
                  <button
                    type="button"
                    onClick={() => toggleMobileDropdown(item.label)}
                    className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-100"
                  >
                    {item.label}
                    <ChevronDownIcon
                      className={cn(
                        'h-4 w-4 transition-transform',
                        mobileDropdowns.includes(item.label) && 'rotate-180'
                      )}
                    />
                  </button>
                  <div
                    className={cn(
                      'overflow-hidden transition-all duration-200',
                      mobileDropdowns.includes(item.label)
                        ? 'max-h-[400px]'
                        : 'max-h-0'
                    )}
                  >
                    <div className="ml-4 space-y-1 pb-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="block rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-accent"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-lg px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              )
            )}
          </nav>
          <div className="mt-4 space-y-3">
            <div className="text-center">
              <span className="mb-1 block text-xs font-medium text-gray-500">Call or Text</span>
              <PhoneLink
                location="header-mobile-menu"
                phone={phone}
                className="flex items-center justify-center gap-2 rounded-lg bg-accent py-3 text-base font-bold text-white"
              >
                <PhoneIcon className="h-5 w-5" />
                {phoneDisplay}
              </PhoneLink>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

function ChevronDownIcon({ className }: { className?: string }) {
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
        d="M19 9l-7 7-7-7"
      />
    </svg>
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

function MenuIcon({ className }: { className?: string }) {
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
        d="M4 6h16M4 12h16M4 18h16"
      />
    </svg>
  )
}

function CloseIcon({ className }: { className?: string }) {
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
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  )
}
