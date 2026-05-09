import { Metadata } from 'next'
import Link from 'next/link'
import { JURISDICTIONS } from '@/lib/constants'
import { siteConfig } from '@/lib/config'

export const metadata: Metadata = {
  title: 'GIS & Zoning Resources | Clark County Las Vegas | PaperLotLand',
  description:
    'Official GIS portals, zoning codes, and development resources for every Clark County jurisdiction — Las Vegas, Henderson, North Las Vegas, Boulder City, and Clark County.',
  alternates: { canonical: siteConfig.siteUrl + '/resources/' },
}

const gismoHighlights = [
  { label: 'Parcel Search', desc: 'Look up any parcel by APN, address, or owner name.' },
  { label: 'Zoning Layer', desc: 'View current zoning for unincorporated Clark County.' },
  { label: 'Aerial Imagery', desc: 'Current and historical aerial photography.' },
  { label: 'Ownership Data', desc: 'Current owner, legal description, acreage.' },
]

export default function ResourcesPage() {
  return (
    <>
      <section className="bg-[#1C3550] py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">GIS & Zoning Resources</h1>
          <p className="text-xl text-slate-300">
            Official parcel data, GIS portals, and zoning codes for every Clark County jurisdiction — all in one place.
          </p>
        </div>
      </section>

      {/* Clark County GISMO Feature */}
      <section className="py-16 bg-white border-b border-slate-100">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-10 items-start">
            <div className="flex-1">
              <div className="inline-block rounded-lg bg-[#C97D2E]/10 px-3 py-1 text-xs font-semibold text-[#C97D2E] mb-3">
                Most-Used Resource
              </div>
              <h2 className="text-2xl font-bold text-[#1C3550] mb-3">Clark County GISMO</h2>
              <p className="text-slate-600 mb-5 leading-relaxed">
                Clark County&apos;s OpenWeb GIS portal (GISMO) is the primary parcel research tool for unincorporated Clark County — covering the Las Vegas Strip corridor, Enterprise, Spring Valley, and surrounding areas.
              </p>
              <a
                href="https://gis.clark.nv.gov/openweb/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-lg bg-[#1C3550] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#122336] transition-colors"
              >
                Open Clark County GISMO →
              </a>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-3">
              {gismoHighlights.map((h) => (
                <div key={h.label} className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                  <div className="font-semibold text-[#1C3550] text-sm mb-1">{h.label}</div>
                  <div className="text-xs text-slate-500">{h.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* All Jurisdictions */}
      <section className="py-20 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-[#1C3550] mb-8">All Jurisdictions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {JURISDICTIONS.map((j) => (
              <Link
                key={j.slug}
                href={`/resources/${j.slug}/`}
                className="group rounded-2xl border border-slate-200 bg-white p-7 hover:border-[#C97D2E] hover:shadow-lg transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-xl shrink-0">🗺️</div>
                  <h3 className="font-bold text-[#1C3550] text-lg">{j.name}</h3>
                </div>
                <p className="text-sm text-slate-500 mb-4 leading-relaxed">{j.description}</p>
                <ul className="space-y-1 mb-5">
                  {j.highlights.slice(0, 3).map((h) => (
                    <li key={h} className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="text-[#C97D2E] font-bold">✓</span> {h}
                    </li>
                  ))}
                </ul>
                <span className="text-sm font-semibold text-[#C97D2E] group-hover:underline">
                  View Resources →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
