'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { BUSINESS, FOOTER_NAV, JURISDICTIONS } from '@/lib/constants'
import { PhoneLink } from '@/components/ui/phone-link'
import { siteConfig } from '@/lib/config'
import type { GeneralContent, NavigationContent } from '@/lib/site-content'

export function Footer({
  businessData,
  navigation,
}: {
  businessData?: GeneralContent
  navigation?: NavigationContent
} = {}) {
  const phone = businessData?.phone ?? BUSINESS.phone
  const license = businessData?.license ?? BUSINESS.license
  const footerMain = navigation?.footerNav.main ?? FOOTER_NAV.main
  const footerSecondary = navigation?.footerNav.secondary ?? FOOTER_NAV.secondary
  const pathname = usePathname()
  const isLandingPage = pathname.startsWith('/lp/')
  const currentYear = new Date().getFullYear()

  if (isLandingPage) return null

  return (
    <footer className="bg-[#1C3550] text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Top row: Logo + CTA */}
        <div className="flex flex-col items-center justify-between gap-6 border-b border-white/10 pb-8 md:flex-row">
          <Link href="/" className="flex items-center">
            <Image
              src="/images/logo/logo-light.svg"
              alt="PaperLotLand"
              width={180}
              height={50}
              className="h-10 w-auto sm:h-12"
            />
          </Link>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <PhoneLink
              location="footer"
              phone={phone}
              className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
            >
              <PhoneIcon className="h-4 w-4" />
              {BUSINESS.phoneDisplay}
            </PhoneLink>
            <Link
              href="/off-market-deals/"
              className="inline-flex items-center justify-center rounded-lg bg-[#C97D2E] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#b86d24] transition-colors"
            >
              Join the Network →
            </Link>
          </div>
        </div>

        {/* Middle: Links grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 border-b border-white/10 py-8">
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Deals</p>
            <ul className="space-y-2">
              <li><Link href="/available-lots/" className="text-sm text-gray-300 hover:text-white transition-colors">Available Lots</Link></li>
              <li><Link href="/closed-sales/" className="text-sm text-gray-300 hover:text-white transition-colors">Closed Sales</Link></li>
              <li><Link href="/off-market-deals/" className="text-sm text-gray-300 hover:text-white transition-colors">Off-Market Deal Alerts</Link></li>
            </ul>
          </div>
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">GIS Resources</p>
            <ul className="space-y-2">
              {JURISDICTIONS.map((j) => (
                <li key={j.slug}>
                  <Link href={`/resources/${j.slug}/`} className="text-sm text-gray-300 hover:text-white transition-colors">
                    {j.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Company</p>
            <ul className="space-y-2">
              {footerMain.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-gray-300 hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Office</p>
              <p className="text-sm text-gray-300">{BUSINESS.address}</p>
              <a href={`mailto:${BUSINESS.email}`} className="text-sm text-[#C97D2E] hover:underline mt-1 inline-block">
                {BUSINESS.email}
              </a>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="py-6 text-center">
          <p className="text-sm text-gray-400">
            <span className="font-semibold">*If your property is currently listed this is not intended as a solicitation*</span>
{' '}Owner is licensed Real Estate Agent in the State of Nevada License #S.181333 Parker Gibbons, Galindo Group Real Estate, Broker Joshua Galindo B.1001607.LLC 4160 S Durango #120 Las Vegas NV 89147
          </p>
        </div>

        {/* Bottom row */}
        <div className="flex flex-col items-center justify-between gap-4 pt-4 md:flex-row">
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-gray-400">
            {footerSecondary.map((item, index) => (
              <span key={item.href} className="flex items-center gap-2">
                <Link href={item.href} className="hover:text-white">
                  {item.label}
                </Link>
                {index < footerSecondary.length - 1 && <span>•</span>}
              </span>
            ))}
          </div>
          <p className="text-sm text-gray-400">
            © Copyright {currentYear} {siteConfig.siteName}
          </p>
        </div>
      </div>

      {/* Bottom padding for mobile CTA bar */}
      <div className="h-20 lg:hidden" />
    </footer>
  )
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
      />
    </svg>
  )
}
