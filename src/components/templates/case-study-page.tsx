import Link from 'next/link'
import Image from 'next/image'
import Script from 'next/script'
import { buttonClassName } from '@/components/ui/button'
import { BreadcrumbSchema } from '@/components/seo/breadcrumb-schema'
import { BUSINESS, GOOGLE_REVIEWS, OFFICES } from '@/lib/constants'

export interface CaseStudyData {
  slug: string
  title: string
  metaTitle: string
  metaDescription: string
  situation: string
  location: string
  challenge: string
  solution: string
  result: {
    daysToClose: number
    condition: string
    outcome: string
  }
  quote?: {
    text: string
    name: string
    location: string
  }
  timeline: {
    step: string
    description: string
  }[]
  datePublished?: string
  image?: string
  images?: {
    src: string
    alt: string
  }[]
  relatedSituations?: {
    title: string
    href: string
  }[]
  relatedCaseStudies?: {
    title: string
    href: string
    daysToClose: number
    situation: string
  }[]
}

interface CaseStudyPageProps {
  data: CaseStudyData
}

function generateStructuredData(data: CaseStudyData) {
  const siteUrl = 'https://webuyanyvegashouse.com'
  const image = data.image ?? `${siteUrl}/images/og-image.jpg`
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: data.title,
    description: data.metaDescription,
    image: [image],
    author: {
      '@type': 'Organization',
      name: BUSINESS.name,
      url: siteUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: BUSINESS.name,
      url: siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/images/logo/logo-new.webp`,
      },
    },
    url: `${siteUrl}/${data.slug}/`,
    ...(data.datePublished && { datePublished: data.datePublished }),
    dateModified: data.datePublished ?? new Date().toISOString().slice(0, 10),
  }
}

export function CaseStudyPageTemplate({ data }: CaseStudyPageProps) {
  const structuredData = generateStructuredData(data)

  return (
    <main>
      <Script
        id="case-study-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: '/' },
          { name: 'Success Stories', url: '/happy-sellers/' },
          { name: data.title, url: `/${data.slug}/` },
        ]}
      />

      {/* Breadcrumb */}
      <nav className="border-b border-gray-200 bg-gray-50">
        <div className="container-custom py-3">
          <ol className="flex items-center gap-2 text-sm text-gray-500">
            <li>
              <Link href="/" className="hover:text-primary">Home</Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/happy-sellers/" className="hover:text-primary">Success Stories</Link>
            </li>
            <li>/</li>
            <li className="text-gray-900">Case Study</li>
          </ol>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-primary py-16 text-white">
        <div className="container-custom">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-block rounded-full bg-white/20 px-4 py-1 text-sm font-medium">
              Case Study: {data.location}
            </span>
            <h1 className="mt-4 text-3xl font-bold md:text-4xl lg:text-5xl">
              {data.title}
            </h1>
            <p className="mt-4 text-lg text-white/90">{data.situation}</p>
          </div>
        </div>
      </section>

      {/* Case Study Image(s) — first image shown here */}
      {(data.images?.[0] || data.image) && (
        <section className="border-b border-gray-200 bg-white py-8">
          <div className="container-custom">
            <div className="mx-auto max-w-3xl overflow-hidden rounded-xl">
              <Image
                src={data.images?.[0]?.src ?? data.image!}
                alt={data.images?.[0]?.alt ?? data.title}
                width={1024}
                height={768}
                className="h-auto w-full object-cover"
                priority
              />
            </div>
          </div>
        </section>
      )}

      {/* Results Highlight */}
      <section className="border-b border-gray-200 bg-white py-8">
        <div className="container-custom">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-primary">{data.result.daysToClose} Days</div>
              <div className="mt-1 text-sm text-gray-600">To Close</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">{data.result.condition}</div>
              <div className="mt-1 text-sm text-gray-600">Property Condition</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">{data.result.outcome}</div>
              <div className="mt-1 text-sm text-gray-600">Result</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 lg:py-16">
        <div className="container-custom">
          <div className="mx-auto max-w-3xl">
            {/* The Challenge */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900">The Challenge</h2>
              <p className="mt-4 text-gray-600">{data.challenge}</p>
            </div>

            {/* Second image between challenge and solution */}
            {data.images && data.images.length > 1 && (
              <div className="mb-12 overflow-hidden rounded-xl">
                <Image
                  src={data.images[1].src}
                  alt={data.images[1].alt}
                  width={1024}
                  height={768}
                  className="h-auto w-full object-cover"
                />
              </div>
            )}

            {/* The Solution */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900">How We Helped</h2>
              <p className="mt-4 text-gray-600">{data.solution}</p>
            </div>

            {/* Additional images (3rd, 4th, etc.) */}
            {data.images && data.images.length > 2 && (
              <div className="mb-12 grid gap-4 sm:grid-cols-2">
                {data.images.slice(2).map((img, i) => (
                  <div key={i} className="overflow-hidden rounded-xl">
                    <Image
                      src={img.src}
                      alt={img.alt}
                      width={512}
                      height={384}
                      className="h-auto w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Timeline */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900">The Timeline</h2>
              <div className="mt-6 space-y-6">
                {data.timeline.map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{item.step}</h3>
                      <p className="mt-1 text-gray-600">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quote */}
            {data.quote && (
              <div className="mb-12 rounded-xl bg-gray-50 p-8">
                <svg className="h-8 w-8 text-primary/30" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
                <blockquote className="mt-4 text-lg italic text-gray-700">
                  &ldquo;{data.quote.text}&rdquo;
                </blockquote>
                <footer className="mt-4 font-semibold text-gray-900">
                  — {data.quote.name}, {data.quote.location}
                </footer>
              </div>
            )}

            {/* CTA Box */}
            <div className="rounded-xl bg-primary p-8 text-center text-white">
              <h3 className="text-2xl font-bold">In a Similar Situation?</h3>
              <p className="mt-2 text-white/90">
                We&apos;ve helped hundreds of homeowners just like this. Get your cash offer today.
              </p>
              <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/get-your-cash-today/"
                  className={buttonClassName({ variant: 'accent', size: 'lg' })}
                >
                  Get Your Cash Offer
                </Link>
                <a
                  href={`tel:${BUSINESS.phone}`}
                  className="font-semibold text-white hover:underline"
                >
                  Or call: {BUSINESS.phoneDisplay}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Situations */}
      {data.relatedSituations && data.relatedSituations.length > 0 && (
        <section className="border-b border-gray-200 bg-white py-12">
          <div className="container-custom">
            <div className="mx-auto max-w-3xl">
              <h2 className="text-2xl font-bold text-gray-900">Are You in a Similar Situation?</h2>
              <p className="mt-2 text-gray-600">
                We help Las Vegas homeowners facing all kinds of challenges. Learn more about how we can help:
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {data.relatedSituations.map((situation) => (
                  <Link
                    key={situation.href}
                    href={situation.href}
                    className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:border-primary hover:bg-primary/5"
                  >
                    <svg className="h-5 w-5 shrink-0 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-sm font-medium text-gray-900">{situation.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Related Case Studies */}
      <section className="bg-gray-50 py-12 lg:py-16">
        <div className="container-custom">
          <h2 className="text-center text-2xl font-bold text-gray-900">More Success Stories</h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-gray-600">
            We&apos;ve helped hundreds of Las Vegas homeowners sell their houses fast for cash.
          </p>
          {data.relatedCaseStudies && data.relatedCaseStudies.length > 0 && (
            <div className="mx-auto mt-8 grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.relatedCaseStudies.map((cs) => (
                <Link
                  key={cs.href}
                  href={cs.href}
                  className="rounded-xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md"
                >
                  <div className="text-3xl font-bold text-primary">{cs.daysToClose} Days</div>
                  <div className="mt-1 text-sm text-gray-500">to close</div>
                  <p className="mt-3 text-sm font-medium text-gray-900">{cs.title}</p>
                  <p className="mt-1 text-xs text-gray-500">{cs.situation}</p>
                </Link>
              ))}
            </div>
          )}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/happy-sellers/"
              className={buttonClassName({ variant: 'primary' })}
            >
              View All Reviews
            </Link>
            <Link
              href="/case-studies/"
              className={buttonClassName({ variant: 'outline' })}
            >
              All Case Studies
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
