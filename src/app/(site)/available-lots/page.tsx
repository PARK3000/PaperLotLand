import { Metadata } from 'next'
import Link from 'next/link'
import { siteConfig } from '@/lib/config'
import { BUSINESS } from '@/lib/constants'
import { LandLeadForm } from '@/components/sections/land-lead-form'

export const metadata: Metadata = {
  title: 'Available Lots | Las Vegas Land For Sale | PaperLotLand',
  description:
    'Current off-market land parcels available in the Las Vegas Valley. Residential, commercial, multifamily, and industrial sites in Clark County.',
  alternates: { canonical: siteConfig.siteUrl + '/available-lots/' },
}

export default function AvailableLotsPage() {
  return (
    <>
      <section className="bg-[#1C3550] py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Available Lots</h1>
          <p className="text-xl text-slate-300">
            Current off-market parcels available in the Las Vegas Valley. Our available inventory is shared privately with network members first.
          </p>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="rounded-2xl border-2 border-dashed border-[#C97D2E]/40 bg-[#C97D2E]/5 p-12">
            <div className="text-5xl mb-5">🔒</div>
            <h2 className="text-2xl font-bold text-[#1C3550] mb-3">Available Inventory is Private</h2>
            <p className="text-slate-600 mb-6 max-w-lg mx-auto">
              Current available parcels are shared directly with registered network members. We don&apos;t post listings publicly — that&apos;s the point.
            </p>
            <p className="text-slate-600 mb-8 max-w-lg mx-auto">
              Join the network to receive alerts when parcels matching your criteria become available. Or call us directly at{' '}
              <a href={`tel:${BUSINESS.phone}`} className="text-[#C97D2E] font-semibold">{BUSINESS.phoneDisplay}</a>.
            </p>
            <Link
              href="/off-market-deals/"
              className="inline-flex items-center justify-center rounded-lg bg-[#C97D2E] px-6 py-3.5 text-base font-bold text-white hover:bg-[#b86d24] transition-colors"
            >
              Join the Network to See Available Lots
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-[#1C3550] mb-6 text-center">Types We Source</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: '🏠', label: 'Residential', sub: 'SFR, townhome, condo pads' },
              { icon: '🏗️', label: 'Multifamily', sub: 'Apartment & condo sites' },
              { icon: '🏢', label: 'Commercial', sub: 'Retail, office, pads' },
              { icon: '🏭', label: 'Industrial', sub: 'Flex, warehouse, distribution' },
            ].map((t) => (
              <div key={t.label} className="rounded-xl border border-slate-200 bg-white p-5 text-center">
                <div className="text-3xl mb-2">{t.icon}</div>
                <div className="font-bold text-[#1C3550] text-sm">{t.label}</div>
                <div className="text-xs text-slate-500 mt-1">{t.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#1C3550] py-20">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-3">Get First Look at New Parcels</h2>
          <p className="text-lg text-slate-300 mb-10">Submit your criteria and we&apos;ll reach out when something matches.</p>
          <LandLeadForm variant="standard" />
        </div>
      </section>
    </>
  )
}
