import { Metadata } from 'next'
import { siteConfig } from '@/lib/config'
import { LandLeadForm } from '@/components/sections/land-lead-form'

export const metadata: Metadata = {
  title: 'Off-Market Land Deals Las Vegas | Join the Network | PaperLotLand',
  description:
    'Join the PaperLotLand off-market network to access land deals in the Las Vegas Valley before they hit the MLS. Developers, brokers, and investors welcome.',
  alternates: { canonical: siteConfig.siteUrl + '/off-market-deals/' },
}

export default function OffMarketDealsPage() {
  return (
    <>
      <section className="bg-[#1C3550] py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#C97D2E]/40 bg-[#C97D2E]/10 px-4 py-1.5 text-sm text-[#C97D2E] font-semibold mb-6">
            Private Network
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Access Off-Market Land Deals in the Las Vegas Valley
          </h1>
          <p className="text-xl text-slate-300">
            Submit your criteria below. When a parcel matches — size, type, jurisdiction, budget — we reach out directly, before anything goes to market.
          </p>
        </div>
      </section>

      <section className="py-20 bg-slate-50">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <LandLeadForm variant="full" heading="Join the Off-Market Network" />
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-[#1C3550] mb-8 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {[
              { n: '1', title: 'Submit Your Criteria', body: 'Tell us your role, what type of land you want, budget range, and location preference.' },
              { n: '2', title: 'We Match Deals', body: "When a parcel comes available that fits your criteria, we contact you before it goes anywhere else." },
              { n: '3', title: 'Underwrite & Close', body: 'Access GIS, zoning, and title resources. Move fast when the right deal comes up.' },
            ].map((step) => (
              <div key={step.n}>
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#C97D2E] text-xl font-bold text-white">
                  {step.n}
                </div>
                <h3 className="font-bold text-[#1C3550] mb-2">{step.title}</h3>
                <p className="text-sm text-slate-500">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-[#1C3550] mb-6">What We Work With</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {['Residential Lots', 'Townhome / Condo Pads', 'Multifamily Sites', 'Commercial / Retail', 'Industrial / Flex', 'Raw Acreage'].map((t) => (
              <div key={t} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3">
                <span className="text-[#C97D2E] font-bold">✓</span>
                <span className="text-sm text-slate-700">{t}</span>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-slate-500">
            We cover all five Clark County jurisdictions: Clark County (unincorporated), Henderson, North Las Vegas, Boulder City, and the City of Las Vegas.
          </p>
        </div>
      </section>
    </>
  )
}
