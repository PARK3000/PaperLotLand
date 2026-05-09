import { Metadata } from 'next'
import Link from 'next/link'
import { siteConfig } from '@/lib/config'
import { BUSINESS } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'About PaperLotLand | Las Vegas Land Developer & Broker Network',
  description:
    'PaperLotLand was built by a Las Vegas land broker to give developers and investors direct access to off-market land deals in Clark County.',
  alternates: { canonical: siteConfig.siteUrl + '/about/' },
}

export default function AboutPage() {
  return (
    <article>
      {/* Header */}
      <section className="bg-[#1C3550] py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">About PaperLotLand</h1>
          <p className="text-xl text-slate-300">
            The private land network built for developers and brokers who move land in the Las Vegas Valley.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="prose prose-slate max-w-none">
            <h2 className="text-2xl font-bold text-[#1C3550] mb-4">Why PaperLotLand Exists</h2>
            <p className="text-slate-600 leading-relaxed mb-6">
              PaperLotLand was started by Parker Gibbons — a Las Vegas land broker who spent years watching great parcels get marketed publicly at inflated prices, only to sit on the market for months before trading hands at a discount anyway.
            </p>
            <p className="text-slate-600 leading-relaxed mb-6">
              The inefficiency was obvious: the best land deals happen off-market, between people who know what they&apos;re doing. The challenge was connecting the right buyers with the right sellers before anyone hit the MLS.
            </p>
            <p className="text-slate-600 leading-relaxed mb-6">
              PaperLotLand solves that. It&apos;s a private network — not a listing platform — that matches land buyers and sellers directly, with access to the GIS data, zoning codes, and market context needed to close quickly and confidently.
            </p>

            <h2 className="text-2xl font-bold text-[#1C3550] mb-4 mt-10">What We Do</h2>
            <ul className="space-y-3 text-slate-600">
              <li className="flex items-start gap-3">
                <span className="text-[#C97D2E] font-bold mt-0.5">→</span>
                <span><strong>Off-market matching</strong> — We connect buyers and sellers privately, before anything goes to the MLS.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#C97D2E] font-bold mt-0.5">→</span>
                <span><strong>GIS resource library</strong> — Every Clark County jurisdiction&apos;s parcel maps, zoning codes, and development portals in one place.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#C97D2E] font-bold mt-0.5">→</span>
                <span><strong>Deal sourcing</strong> — We actively source land across Clark County on behalf of network members with specific criteria.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#C97D2E] font-bold mt-0.5">→</span>
                <span><strong>Due diligence support</strong> — Access to the right title companies, environmental firms, and entitlement consultants.</span>
              </li>
            </ul>

            <h2 className="text-2xl font-bold text-[#1C3550] mb-4 mt-10">Who We Work With</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              The PaperLotLand network includes:
            </p>
            <ul className="space-y-2 text-slate-600">
              <li>· <strong>Developers</strong> — residential, multifamily, commercial, and industrial</li>
              <li>· <strong>Land brokers and agents</strong> — who need private inventory to show clients</li>
              <li>· <strong>Investors</strong> — opportunistic buyers looking for off-market value</li>
              <li>· <strong>Landowners</strong> — who want to sell without going to market publicly</li>
            </ul>
          </div>

          <div className="mt-12 flex flex-col sm:flex-row gap-4">
            <Link
              href="/off-market-deals/"
              className="inline-flex items-center justify-center rounded-lg bg-[#C97D2E] px-6 py-3.5 text-base font-bold text-white hover:bg-[#b86d24] transition-colors"
            >
              Join the Network
            </Link>
            <Link
              href="/contact/"
              className="inline-flex items-center justify-center rounded-lg border border-[#1C3550] px-6 py-3.5 text-base font-semibold text-[#1C3550] hover:bg-[#1C3550] hover:text-white transition-colors"
            >
              Get in Touch
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4 text-center">
            <div>
              <div className="text-3xl font-bold text-[#1C3550]">$200M+</div>
              <div className="mt-1 text-sm text-slate-500">in Clark County land transactions</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#1C3550]">200+</div>
              <div className="mt-1 text-sm text-slate-500">lots bought & sold</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#1C3550]">15+</div>
              <div className="mt-1 text-sm text-slate-500">years in the market</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#1C3550]">5</div>
              <div className="mt-1 text-sm text-slate-500">jurisdictions covered</div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-[#1C3550] mb-3">Have a deal? Have a question?</h2>
          <p className="text-slate-500 mb-6">
            Call <a href={`tel:${BUSINESS.phone}`} className="text-[#C97D2E] font-semibold">{BUSINESS.phoneDisplay}</a> or email{' '}
            <a href={`mailto:${BUSINESS.email}`} className="text-[#C97D2E] font-semibold">{BUSINESS.email}</a>.
          </p>
        </div>
      </section>
    </article>
  )
}
