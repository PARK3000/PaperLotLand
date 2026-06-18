import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { CLOSED_SALES } from '@/lib/constants'
import { siteConfig } from '@/lib/config'

export const metadata: Metadata = {
  title: 'Closed Sales | Off-Market Land Deals | PaperLotLand',
  description:
    'A portfolio of off-market land transactions closed across the Las Vegas Valley — industrial, multifamily, commercial, and residential lots in Clark County.',
  alternates: { canonical: siteConfig.siteUrl + '/closed-sales/' },
}

export default function ClosedSalesPage() {
  return (
    <>
      <section className="bg-[#1C3550] py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Closed Sales</h1>
          <p className="text-xl text-slate-300">
            A sample of off-market land deals we&apos;ve closed across the Las Vegas Valley. Each parcel links directly to Clark County GIS data.
          </p>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {CLOSED_SALES.map((lot) => (
              <a
                key={lot.id}
                href={lot.gisUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-lg transition-shadow"
              >
                <div className="relative h-56 bg-slate-100">
                  <Image src={lot.imageSrc} alt={lot.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1C3550]/70 to-transparent" />
                  <span className="absolute top-3 right-3 inline-block rounded-full bg-emerald-500 px-2.5 py-0.5 text-xs font-semibold text-white">
                    Closed
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-[#1C3550] mb-1">{lot.title}</h3>
                  <p className="text-sm text-slate-500">{lot.location} · {lot.size}</p>
                  <p className="mt-3 text-xs text-[#C97D2E] font-semibold">View GIS Data →</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#1C3550] py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Have Land to Sell?</h2>
          <p className="text-slate-300 mb-8">Submit your parcel privately and we&apos;ll match it to buyers in our network — no public listing required.</p>
          <Link
            href="/off-market-deals/"
            className="inline-flex items-center justify-center rounded-lg bg-[#C97D2E] px-6 py-3.5 text-base font-bold text-white hover:bg-[#b86d24] transition-colors"
          >
            Join the Network
          </Link>
        </div>
      </section>
    </>
  )
}
