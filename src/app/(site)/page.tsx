import { Metadata } from 'next'
import { LocalBusinessSchema } from '@/components/seo/local-business-schema'
import { FAQSchema } from '@/components/seo/faq-schema'
import { getHomepageContent, getFAQContent } from '@/lib/site-content'
import { CLOSED_SALES, JURISDICTIONS, FAQ_ITEMS } from '@/lib/constants'
import { siteConfig } from '@/lib/config'
import Image from 'next/image'
import Link from 'next/link'
import { LandLeadForm } from '@/components/sections/land-lead-form'
import { FAQSection } from '@/components/sections/faq-section'

export const revalidate = 0

export const metadata: Metadata = {
  title: 'PaperLotLand | Off-Market Land Deals in Las Vegas',
  description:
    'Access off-market land deals in the Las Vegas Valley. Closed sales gallery, Clark County GIS, zoning resources, and the developer & broker network for Clark County land.',
  alternates: { canonical: siteConfig.siteUrl + '/' },
  openGraph: {
    title: 'PaperLotLand | Off-Market Land Deals in Las Vegas',
    description:
      'Off-market land deals in the Las Vegas Valley. GIS data, zoning resources, and a private developer & broker network for Clark County.',
    url: siteConfig.siteUrl + '/',
    type: 'website',
    images: [{ url: '/images/og-image.jpg', width: 1200, height: 630 }],
  },
}

export default async function HomePage() {
  const [homepage, faqContent] = await Promise.all([
    getHomepageContent(),
    getFAQContent(),
  ])

  return (
    <>
      <LocalBusinessSchema />
      <FAQSchema faqs={faqContent.items} />

      {/* ── Hero ── */}
      <section className="relative min-h-[580px] flex items-center overflow-hidden bg-[#1C3550]">
        <div className="absolute inset-0">
          <Image
            src="/images/hero/hero-bg.jpg"
            alt="Aerial view of Las Vegas Valley land parcels"
            fill
            className="object-cover opacity-20"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1C3550]/95 to-[#1C3550]/70" />
        </div>
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#C97D2E]/40 bg-[#C97D2E]/10 px-4 py-1.5 text-sm text-[#C97D2E] font-semibold mb-6">
                Private Off-Market Network
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-5xl font-bold text-white leading-tight mb-4">
                {homepage.heroSubtitle}{' '}
                <span className="text-[#C97D2E]">Clark County Land</span>
              </h1>
              <p className="text-xl text-slate-300 mb-8 max-w-xl">
                {homepage.heroTitle}. Join the private network of developers, brokers, and investors who move land in the Las Vegas Valley before it ever hits the MLS.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/off-market-deals/"
                  className="inline-flex items-center justify-center rounded-lg bg-[#C97D2E] px-6 py-3.5 text-base font-bold text-white shadow-lg hover:bg-[#b86d24] transition-colors"
                >
                  {homepage.heroCtaText}
                </Link>
                <Link
                  href="/resources/"
                  className="inline-flex items-center justify-center rounded-lg border border-white/30 bg-white/10 px-6 py-3.5 text-base font-semibold text-white hover:bg-white/20 transition-colors"
                >
                  GIS Resources →
                </Link>
              </div>
            </div>
            <div className="hidden lg:block">
              <LandLeadForm variant="quick" />
            </div>
          </div>
        </div>
      </section>

      {/* Mobile quick form */}
      <section className="bg-slate-50 px-4 py-10 lg:hidden">
        <div className="mx-auto max-w-lg">
          <LandLeadForm variant="quick" />
        </div>
      </section>

      {/* ── Trust Stats ── */}
      <section className="border-b border-slate-100 bg-white py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {homepage.trustStats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-[#1C3550]">{stat.value}</div>
                <div className="mt-1 text-sm text-slate-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Closed Sales Gallery ── */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1C3550] mb-3">Closed Sales</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              A sample of off-market land deals closed across the Las Vegas Valley. Click any parcel to view GIS data.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {CLOSED_SALES.map((lot) => (
              <a
                key={lot.id}
                href={lot.gisUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-lg transition-shadow"
              >
                <div className="relative h-52 bg-slate-100">
                  <Image
                    src={lot.imageSrc}
                    alt={lot.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1C3550]/70 to-transparent" />
                  <span className="absolute bottom-3 left-3 inline-block rounded-full bg-[#C97D2E] px-2.5 py-0.5 text-xs font-semibold text-white">
                    {lot.type}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-[#1C3550] text-sm leading-snug mb-1">{lot.title}</h3>
                  <p className="text-xs text-slate-500">{lot.location} · {lot.size}</p>
                  <p className="mt-2 text-xs text-[#C97D2E] font-medium">View on GIS →</p>
                </div>
              </a>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/closed-sales/"
              className="inline-flex items-center justify-center rounded-lg border border-[#1C3550] px-6 py-3 text-sm font-semibold text-[#1C3550] hover:bg-[#1C3550] hover:text-white transition-colors"
            >
              View All Closed Sales →
            </Link>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-20 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1C3550] mb-3">How the Network Works</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Three simple steps from signup to your first off-market deal alert.
            </p>
          </div>
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8">
            {homepage.processSteps.map((step, idx) => (
              <div key={step.number} className="relative text-center">
                {idx < homepage.processSteps.length - 1 && (
                  <div className="absolute top-8 left-[calc(50%+32px)] right-0 hidden h-px bg-[#C97D2E]/30 md:block" />
                )}
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#C97D2E] text-2xl font-bold text-white shadow-md">
                  {step.number}
                </div>
                <h3 className="text-lg font-bold text-[#1C3550] mb-2">{step.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Value Props ── */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1C3550] mb-3">Why PaperLotLand</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {homepage.valueProps.map((vp) => (
              <div
                key={vp.title}
                className="rounded-2xl border border-slate-100 bg-slate-50 p-8 hover:border-[#C97D2E]/30 hover:shadow-md transition-all"
              >
                <div className="mb-4 text-4xl">{vp.icon}</div>
                <h3 className="text-xl font-bold text-[#1C3550] mb-3">{vp.title}</h3>
                <p className="text-slate-500 leading-relaxed text-sm">{vp.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Off-Market CTA ── */}
      <section className="bg-[#1C3550] py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Join the Off-Market Network
          </h2>
          <p className="text-lg text-slate-300 mb-10">
            Tell us what you&apos;re looking for and we&apos;ll reach out when a matching parcel comes available — before anyone else sees it.
          </p>
          <LandLeadForm variant="standard" />
        </div>
      </section>

      {/* ── GIS / Resources ── */}
      <section className="py-20 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1C3550] mb-3">GIS & Zoning Resources</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Official portals for every Clark County jurisdiction — all in one place.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {JURISDICTIONS.map((j) => (
              <Link
                key={j.slug}
                href={`/resources/${j.slug}/`}
                className="group rounded-xl border border-slate-200 bg-white p-6 hover:border-[#C97D2E] hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-lg">
                    🗺️
                  </div>
                  <h3 className="font-bold text-[#1C3550]">{j.name}</h3>
                </div>
                <p className="text-sm text-slate-500 mb-3 line-clamp-2">{j.description}</p>
                <span className="text-sm font-semibold text-[#C97D2E] group-hover:underline">
                  View GIS & Zoning →
                </span>
              </Link>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/resources/"
              className="inline-flex items-center justify-center rounded-lg bg-[#C97D2E] px-6 py-3 text-sm font-bold text-white hover:bg-[#b86d24] transition-colors"
            >
              All GIS Resources
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <FAQSection faqs={faqContent.items.length > 0 ? faqContent.items : FAQ_ITEMS.map(i => ({ question: i.question, summary: i.answer }))} />
    </>
  )
}
