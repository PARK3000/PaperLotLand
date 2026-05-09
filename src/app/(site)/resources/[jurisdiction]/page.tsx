import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { JURISDICTIONS } from '@/lib/constants'
import { siteConfig } from '@/lib/config'

interface Props {
  params: Promise<{ jurisdiction: string }>
}

export async function generateStaticParams() {
  return JURISDICTIONS.map((j) => ({ jurisdiction: j.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { jurisdiction } = await params
  const j = JURISDICTIONS.find((x) => x.slug === jurisdiction)
  if (!j) return {}
  return {
    title: `${j.name} GIS & Zoning Resources | PaperLotLand`,
    description: `Official GIS portal, zoning code, and development resources for ${j.name}. ${j.description}`,
    alternates: { canonical: `${siteConfig.siteUrl}/resources/${j.slug}/` },
  }
}

export default async function JurisdictionPage({ params }: Props) {
  const { jurisdiction } = await params
  const j = JURISDICTIONS.find((x) => x.slug === jurisdiction)
  if (!j) notFound()

  return (
    <>
      <section className="bg-[#1C3550] py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <nav className="text-sm text-slate-400 mb-4">
            <Link href="/resources/" className="hover:text-white">Resources</Link>
            {' / '}
            <span className="text-white">{j.name}</span>
          </nav>
          <h1 className="text-4xl font-bold text-white mb-4">{j.name} GIS & Zoning Resources</h1>
          <p className="text-xl text-slate-300">{j.description}</p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
            <a
              href={j.gisUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-slate-200 bg-slate-50 p-6 hover:border-[#C97D2E] hover:shadow-md transition-all group"
            >
              <div className="text-2xl mb-3">🗺️</div>
              <div className="font-bold text-[#1C3550] mb-1">GIS Parcel Map</div>
              <div className="text-sm text-slate-500 mb-3">Look up parcels by APN, address, or owner.</div>
              <span className="text-xs font-semibold text-[#C97D2E] group-hover:underline">Open Portal →</span>
            </a>
            <a
              href={j.zoningUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-slate-200 bg-slate-50 p-6 hover:border-[#C97D2E] hover:shadow-md transition-all group"
            >
              <div className="text-2xl mb-3">📋</div>
              <div className="font-bold text-[#1C3550] mb-1">Zoning Information</div>
              <div className="text-sm text-slate-500 mb-3">Allowed uses, zoning districts, and maps.</div>
              <span className="text-xs font-semibold text-[#C97D2E] group-hover:underline">View Zoning →</span>
            </a>
            <a
              href={j.codeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-slate-200 bg-slate-50 p-6 hover:border-[#C97D2E] hover:shadow-md transition-all group"
            >
              <div className="text-2xl mb-3">📖</div>
              <div className="font-bold text-[#1C3550] mb-1">Development Code</div>
              <div className="text-sm text-slate-500 mb-3">Setbacks, FAR, height limits, permitted uses.</div>
              <span className="text-xs font-semibold text-[#C97D2E] group-hover:underline">Read Code →</span>
            </a>
          </div>

          <h2 className="text-xl font-bold text-[#1C3550] mb-4">What&apos;s Available</h2>
          <ul className="space-y-3 mb-10">
            {j.highlights.map((h) => (
              <li key={h} className="flex items-start gap-3">
                <span className="mt-0.5 text-[#C97D2E] font-bold">✓</span>
                <span className="text-slate-600">{h}</span>
              </li>
            ))}
          </ul>

          <div className="rounded-xl border border-[#C97D2E]/20 bg-[#C97D2E]/5 p-6">
            <h3 className="font-bold text-[#1C3550] mb-2">Looking for land in {j.name}?</h3>
            <p className="text-sm text-slate-600 mb-4">
              Join the PaperLotLand network to receive off-market deal alerts for {j.name} and across the valley.
            </p>
            <Link
              href="/off-market-deals/"
              className="inline-flex items-center justify-center rounded-lg bg-[#C97D2E] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#b86d24] transition-colors"
            >
              Join the Network →
            </Link>
          </div>
        </div>
      </section>

      <section className="py-10 bg-slate-50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h3 className="text-sm font-semibold text-slate-500 mb-4">Other Jurisdictions</h3>
          <div className="flex flex-wrap gap-3">
            {JURISDICTIONS.filter((x) => x.slug !== j.slug).map((other) => (
              <Link
                key={other.slug}
                href={`/resources/${other.slug}/`}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-[#1C3550] hover:border-[#C97D2E] transition-colors"
              >
                {other.name}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
