import Link from 'next/link'
import { Button, buttonClassName } from '@/components/ui/button'
import { PhoneLink } from '@/components/ui/phone-link'
import { BUSINESS } from '@/lib/constants'
import { LocalBusinessSchema } from '@/components/seo/local-business-schema'
import { FAQSchema } from '@/components/seo/faq-schema'
import { BreadcrumbSchema } from '@/components/seo/breadcrumb-schema'
import { ArticleSchema } from '@/components/seo/article-schema'
import { AuthorCard, type AuthorCardProps } from '@/components/ui/author-card'
import { FAQBody } from '@/components/sections/faq-body'
import type { FAQItem } from '@/lib/site-content'

export interface ComparisonRow {
  label: string
  values: string[]
}

export interface ComparisonTable {
  caption?: string
  columns: string[]
  rows: ComparisonRow[]
  highlightColumnIndex?: number
}

export interface ScenarioItem {
  if: string
  then: string
}

export interface SourceItem {
  label: string
  url?: string
}

export interface AnswerFirstPageData {
  slug: string
  metaTitle: string
  metaDescription: string
  h1: string
  /** 40-80 word direct answer block — placed prominently for AI citation extraction */
  directAnswer: string
  publishedDate: string
  /** Optional override; falls back to LAST_REVIEWED constant */
  lastUpdated?: string
  reviewedBy?: AuthorCardProps['reviewer']
  intro?: string
  comparisonTable?: ComparisonTable
  scenarios?: {
    title?: string
    items: ScenarioItem[]
  }
  sections?: {
    heading: string
    paragraphs: string[]
    bullets?: string[]
  }[]
  faqs: FAQItem[]
  sources?: SourceItem[]
  relatedLinks?: { title: string; href: string; description?: string }[]
}

interface Props {
  data: AnswerFirstPageData
}

export function AnswerFirstPageTemplate({ data }: Props) {
  const pageUrl = `https://webuyanyvegashouse.com/${data.slug}/`

  return (
    <>
      <LocalBusinessSchema city="Las Vegas" pageUrl={`/${data.slug}/`} includeReviews />
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: '/' },
          { name: data.h1, url: `/${data.slug}/` },
        ]}
      />
      <ArticleSchema
        title={data.h1}
        description={data.metaDescription}
        publishedAt={data.publishedDate}
        updatedAt={data.lastUpdated || data.publishedDate}
        url={pageUrl}
        author={data.reviewedBy?.name || 'Parker Gibbons'}
      />
      {data.faqs.length > 0 && <FAQSchema faqs={data.faqs} />}

      {/* Hero with H1 + direct-answer block */}
      <section className="bg-primary py-12 lg:py-16">
        <div className="container-custom">
          <div className="mx-auto max-w-4xl">
            <h1 className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
              {data.h1}
            </h1>
            <div
              data-direct-answer
              className="mt-6 rounded-xl bg-white p-6 shadow-lg ring-1 ring-black/5 sm:p-8"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                Quick answer
              </p>
              <p className="mt-2 text-lg leading-relaxed text-gray-900 sm:text-xl">
                {data.directAnswer}
              </p>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/get-your-cash-today/"
                className={buttonClassName({ variant: 'accent', size: 'lg' })}
              >
                Get a Cash Offer
              </Link>
              <PhoneLink location="hero" className="text-white" />
            </div>
          </div>
        </div>
      </section>

      {/* Editorial review byline */}
      <section className="border-b border-gray-100 bg-gray-50 py-6">
        <div className="container-custom">
          <div className="mx-auto max-w-4xl">
            <AuthorCard reviewer={data.reviewedBy} lastUpdated={data.lastUpdated} />
          </div>
        </div>
      </section>

      {/* Optional intro paragraph */}
      {data.intro && (
        <section className="py-10 lg:py-12">
          <div className="container-custom">
            <div className="mx-auto max-w-3xl">
              <p className="text-lg leading-relaxed text-gray-700">{data.intro}</p>
            </div>
          </div>
        </section>
      )}

      {/* Comparison table */}
      {data.comparisonTable && (
        <section className="bg-gray-50 py-12 lg:py-16">
          <div className="container-custom">
            <div className="mx-auto max-w-5xl">
              {data.comparisonTable.caption && (
                <h2 className="mb-6 text-2xl font-bold text-primary lg:text-3xl">
                  {data.comparisonTable.caption}
                </h2>
              )}
              <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
                <table className="w-full text-left text-sm sm:text-base">
                  <thead className="bg-primary text-white">
                    <tr>
                      {data.comparisonTable.columns.map((col, i) => (
                        <th
                          key={i}
                          className={`px-4 py-3 font-semibold ${
                            i === data.comparisonTable!.highlightColumnIndex
                              ? 'bg-accent'
                              : ''
                          }`}
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.comparisonTable.rows.map((row, ri) => (
                      <tr key={ri} className="border-t border-gray-100">
                        <th
                          scope="row"
                          className="bg-gray-50 px-4 py-3 text-left font-semibold text-gray-700"
                        >
                          {row.label}
                        </th>
                        {row.values.map((v, vi) => (
                          <td
                            key={vi}
                            className={`px-4 py-3 text-gray-700 ${
                              vi + 1 === data.comparisonTable!.highlightColumnIndex
                                ? 'bg-accent/5 font-medium'
                                : ''
                            }`}
                          >
                            {v}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Scenario bullets */}
      {data.scenarios && data.scenarios.items.length > 0 && (
        <section className="py-12 lg:py-16">
          <div className="container-custom">
            <div className="mx-auto max-w-3xl">
              <h2 className="mb-6 text-2xl font-bold text-primary lg:text-3xl">
                {data.scenarios.title || 'Which option fits your situation?'}
              </h2>
              <ul className="space-y-4">
                {data.scenarios.items.map((s, i) => (
                  <li
                    key={i}
                    className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
                  >
                    <p className="text-gray-900">
                      <span className="font-semibold">If {s.if},</span>{' '}
                      <span>{s.then}</span>
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* Free-form sections */}
      {data.sections?.map((s, i) => (
        <section
          key={i}
          className={i % 2 === 0 ? 'py-12 lg:py-16' : 'bg-gray-50 py-12 lg:py-16'}
        >
          <div className="container-custom">
            <div className="mx-auto max-w-3xl">
              <h2 className="mb-4 text-2xl font-bold text-primary lg:text-3xl">
                {s.heading}
              </h2>
              {s.paragraphs.map((p, pi) => (
                <p key={pi} className="mt-4 leading-relaxed text-gray-700">
                  {p}
                </p>
              ))}
              {s.bullets && (
                <ul className="mt-6 space-y-2">
                  {s.bullets.map((b, bi) => (
                    <li key={bi} className="flex gap-3 text-gray-700">
                      <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      ))}

      {/* FAQ */}
      {data.faqs.length > 0 && (
        <section className="bg-gray-50 py-12 lg:py-16">
          <div className="container-custom">
            <div className="mx-auto max-w-3xl">
              <h2 className="mb-8 text-center text-2xl font-bold text-primary lg:text-3xl">
                Frequently Asked Questions
              </h2>
              <div className="space-y-5">
                {data.faqs.map((faq, i) => (
                  <div key={i} className="rounded-xl bg-white p-6 shadow-sm">
                    <h3 className="mb-3 text-lg font-bold text-primary">
                      {faq.question}
                    </h3>
                    <FAQBody faq={faq} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Sources / methodology */}
      {data.sources && data.sources.length > 0 && (
        <section className="py-10">
          <div className="container-custom">
            <div className="mx-auto max-w-3xl rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="text-base font-semibold text-gray-900">
                Sources & methodology
              </h2>
              <ul className="mt-3 space-y-1 text-sm text-gray-600">
                {data.sources.map((s, i) => (
                  <li key={i}>
                    {s.url ? (
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline hover:text-accent"
                      >
                        {s.label}
                      </a>
                    ) : (
                      s.label
                    )}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-gray-500">
                Cash offers reflect current Las Vegas market conditions and recent
                comparable sales. Numbers cited are typical ranges, not guarantees
                for any specific property.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Related links */}
      {data.relatedLinks && data.relatedLinks.length > 0 && (
        <section className="bg-gray-50 py-12">
          <div className="container-custom">
            <div className="mx-auto max-w-4xl">
              <h2 className="mb-6 text-xl font-bold text-primary">
                Related guides
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {data.relatedLinks.map((l, i) => (
                  <Link
                    key={i}
                    href={l.href}
                    className="rounded-lg border border-gray-200 bg-white p-5 transition-colors hover:border-accent"
                  >
                    <p className="font-semibold text-primary">{l.title}</p>
                    {l.description && (
                      <p className="mt-1 text-sm text-gray-600">{l.description}</p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Closing CTA */}
      <section className="bg-primary py-12">
        <div className="container-custom text-center">
          <h2 className="text-2xl font-bold text-white lg:text-3xl">
            Ready for a no-obligation cash offer?
          </h2>
          <p className="mt-3 text-white/80">
            Get an offer in 24 hours. Close in as little as 7 days.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/get-your-cash-today/"
              className={buttonClassName({ variant: 'accent', size: 'lg' })}
            >
              Get My Cash Offer
            </Link>
            <PhoneLink location="cta-section" className="text-white" />
          </div>
        </div>
      </section>
    </>
  )
}
