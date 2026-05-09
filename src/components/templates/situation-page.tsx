import Link from 'next/link'
import { Button, buttonClassName } from '@/components/ui/button'
import { PhoneLink } from '@/components/ui/phone-link'
import { BUSINESS, GOOGLE_REVIEWS, BBB } from '@/lib/constants'
import { getGoogleReviews } from '@/lib/google-reviews'
import { LocalBusinessSchema } from '@/components/seo/local-business-schema'
import { FAQSchema } from '@/components/seo/faq-schema'
import { BreadcrumbSchema } from '@/components/seo/breadcrumb-schema'
import { HowToSchema } from '@/components/seo/howto-schema'
import { AuthorCard, type AuthorCardProps } from '@/components/ui/author-card'
import { FAQBody } from '@/components/sections/faq-body'
import type { FAQItem } from '@/lib/site-content'

export interface SituationPageData {
  situation: string
  slug: string
  heroTitle: string
  heroSubtitle: string
  metaTitle: string
  metaDescription: string
  mainContent: {
    title: string
    paragraphs: string[]
    sections?: { heading: string; paragraphs: string[] }[]
  }
  benefits?: string[]
  faqs?: FAQItem[]
  relatedSituations?: {
    title: string
    slug: string
    description: string
  }[]
  reviewedBy?: AuthorCardProps['reviewer']
  lastUpdated?: string
}

interface SituationPageTemplateProps {
  data: SituationPageData
}

const defaultBenefits = [
  'No repairs or cleaning needed',
  'Close in as little as 7 days',
  'No realtor commissions',
  'No hidden fees',
  'Cash offer within 24 hours',
  'You choose the closing date',
]

const processSteps = [
  {
    number: 1,
    title: 'Tell Us About Your Property',
    description:
      "Fill out our quick form or call us. Takes about 2 minutes. We'll ask about your property and situation—no judgment, just solutions.",
  },
  {
    number: 2,
    title: 'Get a Fair Cash Offer',
    description:
      "We'll evaluate your property and get you a no-obligation cash offer within 24 hours. No games, no lowballing.",
  },
  {
    number: 3,
    title: 'Close When You Want',
    description:
      "Accept the offer and pick your closing date—as fast as 7 days or whenever works for you. We handle everything.",
  },
]

export async function SituationPageTemplate({ data }: SituationPageTemplateProps) {
  const googleReviews = await getGoogleReviews()
  const benefits = data.benefits || defaultBenefits

  return (
    <>
      <LocalBusinessSchema city="Las Vegas" pageUrl={`/${data.slug}/`} includeReviews />
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: '/' },
          { name: 'Sell My House Fast', url: '/sell-my-house-fast/' },
          { name: data.situation, url: `/${data.slug}/` },
        ]}
      />
      {data.faqs && data.faqs.length > 0 && <FAQSchema faqs={data.faqs} />}
      <HowToSchema
        name={`How to Sell Your House Fast for Cash in Las Vegas — ${data.situation}`}
        description={`Our simple 3-step cash home buying process for Las Vegas homeowners dealing with ${data.situation.toLowerCase()}. No repairs, no fees, close in as little as 7 days.`}
        totalTime="P7D"
        steps={processSteps.map((s) => ({ name: s.title, text: s.description }))}
      />

      {/* Hero Section */}
      <section className="relative bg-primary py-16 lg:py-20">
        <div className="absolute inset-0 opacity-10">
          <div
            className="h-full w-full"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <div className="container-custom relative">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
              {data.heroTitle}
            </h1>
            <p className="mt-4 text-lg text-white/90 lg:text-xl">{data.heroSubtitle}</p>

            {/* Lead Form */}
            <div className="mx-auto mt-8 max-w-xl">
              <form
                className="flex flex-col gap-3 sm:flex-row"
                action="/get-your-cash-today/"
                method="get"
              >
                <input
                  type="text"
                  name="address"
                  placeholder="Enter Your Home Address"
                  className="flex-1 rounded-lg border-0 px-4 py-4 text-gray-900 shadow-lg placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-accent"
                  required
                />
                <Button
                  type="submit"
                  variant="accent"
                  size="lg"
                  className="whitespace-nowrap px-8 py-4"
                >
                  See what we&apos;d pay →
                </Button>
              </form>
            </div>

            {/* Trust Badges */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <a
                href={GOOGLE_REVIEWS.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg bg-white px-4 py-3 shadow-lg"
              >
                <GoogleIcon className="h-8 w-8" />
                <div className="text-left">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-primary">{googleReviews.rating}</span>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon key={i} className="h-4 w-4 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">{googleReviews.count} reviews</span>
                </div>
              </a>
              <a
                href={BBB.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg bg-white px-4 py-3 shadow-lg"
              >
                <BBBBadge className="h-10 w-16" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Editorial review byline — authority signal for AI citations */}
      <section className="border-b border-gray-100 bg-gray-50 py-6">
        <div className="container-custom">
          <div className="mx-auto max-w-3xl">
            <AuthorCard reviewer={data.reviewedBy} lastUpdated={data.lastUpdated} />
          </div>
        </div>
      </section>

      {/* Main Content Section */}
      <section className="py-16 lg:py-20">
        <div className="container-custom">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold text-primary lg:text-3xl">
                {data.mainContent.title}
              </h2>
              {data.mainContent.sections ? (
                <div className="mt-6 space-y-8 text-gray-600">
                  {data.mainContent.sections.map((section, idx) => (
                    <div key={idx}>
                      <h2 className="mb-3 text-xl font-semibold text-primary">
                        {section.heading}
                      </h2>
                      <div className="space-y-3">
                        {section.paragraphs.map((p, i) => (
                          <p key={i}>{p}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                  <p className="text-gray-600">
                    Learn more about how{' '}
                    <Link href="/" className="font-semibold text-primary hover:underline">
                      we buy houses in Las Vegas
                    </Link>{' '}
                    and the surrounding areas for cash, any condition, any situation. Curious how we compare to other selling options? Read our{' '}
                    <Link href="/selling-a-home/72-sold-reviews-las-vegas/" className="font-semibold text-primary hover:underline">
                      honest 72 Sold review
                    </Link>{' '}
                    for a side-by-side breakdown of fees, timelines, and real seller experiences.
                  </p>
                </div>
              ) : (
                <div className="mt-6 space-y-4 text-gray-600">
                  {data.mainContent.paragraphs.map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                  <p className="text-gray-600">
                    Learn more about how{' '}
                    <Link href="/" className="font-semibold text-primary hover:underline">
                      we buy houses in Las Vegas
                    </Link>{' '}
                    and the surrounding areas for cash, any condition, any situation. Curious how we compare to other selling options? Read our{' '}
                    <Link href="/selling-a-home/72-sold-reviews-las-vegas/" className="font-semibold text-primary hover:underline">
                      honest 72 Sold review
                    </Link>{' '}
                    for a side-by-side breakdown of fees, timelines, and real seller experiences.
                  </p>
                </div>
              )}
            </div>

            {/* Benefits */}
            <div className="rounded-xl bg-gray-50 p-8">
              <h3 className="mb-6 text-xl font-bold text-primary">Why Sell to Us?</h3>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                    <span className="text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Link
                  href="/get-your-cash-today/"
                  className={buttonClassName({
                    variant: 'accent',
                    size: 'lg',
                    fullWidth: true,
                  })}
                >
                  Get Your Cash Offer Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Process Steps */}
      <section className="bg-gray-50 py-16 lg:py-20">
        <div className="container-custom">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-bold text-primary lg:text-3xl">
              Our Simple 3-Step Process
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              We&apos;ve helped hundreds of homeowners in difficult situations. Here&apos;s how we
              can help you.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {processSteps.map((step) => (
              <div key={step.number} className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-white">
                  {step.number}
                </div>
                <h3 className="mb-3 text-xl font-bold text-primary">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="bg-primary py-12">
        <div className="container-custom">
          <blockquote className="mx-auto max-w-3xl text-center">
            <p className="text-lg italic text-white/90 lg:text-xl">
              &quot;They made a difficult situation so much easier. I was facing foreclosure and
              didn&apos;t know what to do. They gave me a fair offer, closed quickly, and treated me
              with respect throughout the entire process.&quot;
            </p>
            <footer className="mt-4 font-semibold text-white">
              — Satisfied Homeowner, Las Vegas
            </footer>
          </blockquote>
        </div>
      </section>

      {/* FAQ Section */}
      {data.faqs && data.faqs.length > 0 && (
        <section className="py-16 lg:py-20">
          <div className="container-custom">
            <h2 className="mb-12 text-center text-2xl font-bold text-primary lg:text-3xl">
              Frequently Asked Questions
            </h2>
            <div className="mx-auto max-w-3xl space-y-6">
              {data.faqs.map((faq, index) => (
                <div key={index} className="rounded-xl bg-white p-6 shadow-lg">
                  <h3 className="mb-3 font-bold text-primary">{faq.question}</h3>
                  <FAQBody faq={faq} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Related Situations */}
      {data.relatedSituations && data.relatedSituations.length > 0 && (
        <section className="bg-white py-16 lg:py-20">
          <div className="container-custom">
            <h2 className="mb-8 text-center text-2xl font-bold text-primary lg:text-3xl">
              Other Situations We Help With
            </h2>
            <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.relatedSituations.map((related) => (
                <Link
                  key={related.slug}
                  href={`/${related.slug}/`}
                  className="rounded-lg border border-gray-200 p-4 transition-colors hover:border-primary hover:bg-primary/5"
                >
                  <h3 className="font-bold text-primary">{related.title}</h3>
                  <p className="mt-1 text-sm text-gray-600">{related.description}</p>
                </Link>
              ))}
            </div>
            <p className="mt-8 text-center text-gray-600">
              <Link href="/sell-my-house-fast/" className="font-semibold text-primary hover:underline">
                See all situations we help with
              </Link>{' '}
              or{' '}
              <Link href="/selling-my-house-in-las-vegas-for-cash/" className="font-semibold text-primary hover:underline">
                learn how to sell your house fast in Las Vegas
              </Link>.
            </p>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="bg-accent py-12">
        <div className="container-custom text-center">
          <h2 className="text-2xl font-bold text-white lg:text-3xl">
            Ready to Solve Your Housing Situation?
          </h2>
          <p className="mt-4 text-lg text-white/90">
            Get a fair cash offer with no obligations. We&apos;re here to help.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/get-your-cash-today/"
              className={buttonClassName({
                variant: 'primary',
                size: 'lg',
                className: 'bg-white text-accent hover:bg-gray-100',
              })}
            >
              Get Your Cash Offer
            </Link>
            <PhoneLink
              location="cta-section"
              className={buttonClassName({
                variant: 'outline',
                size: 'lg',
                className: 'border-white text-white hover:bg-white hover:text-accent',
              })}
            >
              Call {BUSINESS.phoneDisplay}
            </PhoneLink>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 lg:py-20">
        <div className="container-custom">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-bold text-primary">
              Las Vegas&apos;s Most Trusted Home Buyer
            </h2>
            <p className="mt-4 text-gray-600">
              Since 2016, We Buy Any Vegas House has helped hundreds of homeowners sell their
              properties quickly and hassle-free. We&apos;re a local, family-owned business with a
              commitment to fair dealing and customer satisfaction.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">2,000+</div>
                <div className="text-sm text-gray-500">Homes Purchased</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">4.9</div>
                <div className="text-sm text-gray-500">Google Rating</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">A+</div>
                <div className="text-sm text-gray-500">BBB Rating</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">7</div>
                <div className="text-sm text-gray-500">Day Average Close</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

// Icons
function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  )
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

function BBBBadge({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 80 40">
      <rect fill="#006CB7" width="80" height="40" rx="4" />
      <text x="40" y="18" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
        BBB
      </text>
      <text x="40" y="32" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
        A+
      </text>
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}
