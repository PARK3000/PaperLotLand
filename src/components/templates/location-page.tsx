import { Metadata } from 'next'
import Link from 'next/link'
import { Button, buttonClassName } from '@/components/ui/button'
import { BUSINESS, GOOGLE_REVIEWS, BBB } from '@/lib/constants'
import { getGoogleReviews } from '@/lib/google-reviews'
import { LocalBusinessSchema } from '@/components/seo/local-business-schema'
import { BreadcrumbSchema } from '@/components/seo/breadcrumb-schema'
import { FAQSchema } from '@/components/seo/faq-schema'
import { AuthorCard, type AuthorCardProps } from '@/components/ui/author-card'

export interface LocationPageData {
  city: string
  state?: string
  slug: string
  heroTitle: string
  heroSubtitle: string
  metaTitle: string
  metaDescription: string
  localContent: {
    title: string
    paragraphs: string[]
  }
  testimonials?: {
    text: string
    name: string
  }[]
  faqs?: {
    question: string
    answer: string
  }[]
  geo?: { latitude: number; longitude: number }
  reviewedBy?: AuthorCardProps['reviewer']
  lastUpdated?: string
}

interface LocationPageTemplateProps {
  data: LocationPageData
}

const mediaLogos = ['HGTV', 'FOX', 'ABC', 'CBS', 'NBC']

const processSteps = [
  {
    number: 1,
    title: 'Read The "How It Works" Page',
    description:
      'We have four steps we take to provide a fair cash offer for your property. Understand our simplified process by reading about how we make it work.',
  },
  {
    number: 2,
    title: 'Browse The Reviews',
    description:
      'We understand the importance of trust when choosing a cash property buyer. Explore reviews from some of our satisfied clients and hear directly from those who have experienced our services firsthand.',
  },
  {
    number: 3,
    title: 'Request A Cash Offer',
    description:
      'Are you ready to take the next step? Fill out the necessary information, and we will contact you within 24 hours. There are no obligations or strings attached.',
  },
]

const benefits = [
  { title: 'Zero Hassle', icon: '✓' },
  { title: 'Zero Repairs', icon: '✓' },
  { title: 'Zero Realtors', icon: '✓' },
  { title: 'Zero Appraisals', icon: '✓' },
  { title: 'Zero Inspections', icon: '✓' },
  { title: 'Move when you want to', icon: '✓' },
]

const reasons = [
  'Inherited Property',
  'Job Relocation',
  'Upgrading',
  'Health Issues',
  'Downsize Your Home',
  'Stop Foreclosures',
  'Needs Repairs',
  'Divorce Issues',
  'Avoiding Bankruptcy',
]

const conditions = [
  'Outdated Old Homes',
  'New Homes',
  'Storm Damages',
  'Fire Damaged',
  'Termite Damaged',
  'Full of Trash and/or Stuff',
  'Bad Shape or Condition',
  'Problem Rental Tenants',
  'Unfinished New Builds',
]

const challenges = [
  'Financial hardship',
  'Title problems',
  'Violations of Code',
  'Hoarder Properties',
  'Low to No Equity',
  'Substantial Liens',
  'Out of State Homes',
  'Family Issues',
  'Delinquent Mortgage Payments',
]

const differentiators = [
  {
    title: 'All Cash Payment',
    description:
      'As cash buyers, we offer you the flexibility and convenience of closing the deal on your terms. With our ability to pay in cash, you can expect a smooth and efficient transaction.',
  },
  {
    title: 'Easy and Transparent Terms',
    description:
      'We believe in keeping things straightforward. Our process is designed to be easy to understand, ensuring a seamless experience for you throughout the entire selling journey.',
  },
  {
    title: 'Streamlined Paperwork Process',
    description:
      'Rest assured that the necessary paperwork will be handled carefully. We collaborate with licensed and insured title companies to ensure all the details are taken care of.',
  },
  {
    title: 'No Hidden Fees',
    description:
      'There are no surprise expenses or additional costs when you sell your house to us. We take care of all the title and closing fees, so you can confidently move forward.',
  },
  {
    title: 'Sell Homes As-Is',
    description:
      'Forget about the stress of repairs or cleaning. We buy properties in their current condition. You can sell your property to us exactly as it is without costly renovations.',
  },
  {
    title: 'Fast Closings',
    description:
      'Our streamlined process offers a quick closing timeline. We can finalize the sale in as little as three days or on a schedule that suits your needs.',
  },
]

export async function LocationPageTemplate({ data }: LocationPageTemplateProps) {
  const googleReviews = await getGoogleReviews()
  const defaultTestimonials = [
    {
      text: "They went above and beyond assisting me through this process. Helped me move my things and even let me leave what I wasn't taking with me. Thanks for all of the hard work.",
      name: 'Jesse P.',
    },
    {
      text: "The most professional and knowledgeable team out there! Every person there is extremely knowledgeable and they go out of their way to make sure everything is handled without any problems at all.",
      name: 'Amaan K.',
    },
    {
      text: "If you're looking for the best in the business in Las Vegas, you've found your winner.",
      name: 'Karl',
    },
  ]

  const testimonials = data.testimonials || defaultTestimonials

  return (
    <>
      <LocalBusinessSchema city={data.city} state={data.state || 'Nevada'} pageUrl={`/${data.slug}/`} includeReviews geo={data.geo} />
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: '/' },
          { name: 'Locations', url: '/locations/' },
          { name: data.city, url: `/${data.slug}/` },
        ]}
      />
      {data.faqs && data.faqs.length > 0 && <FAQSchema faqs={data.faqs} />}

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

            {/* Trust Line */}
            <p className="mt-6 text-lg font-medium text-white/90">
              {data.city}&apos;s Most Trusted Home Buyer since 2016
            </p>

            {/* Trust Badges */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
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

      {/* As Seen On */}
      <section className="border-b border-gray-200 bg-white py-6">
        <div className="container-custom">
          <div className="flex flex-wrap items-center justify-center gap-8">
            <span className="text-sm font-medium text-gray-500">As Seen On</span>
            {mediaLogos.map((logo) => (
              <span key={logo} className="text-xl font-bold text-gray-400">
                {logo}
              </span>
            ))}
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

      {/* Get Started - 3 Steps */}
      <section className="py-16 lg:py-20">
        <div className="container-custom">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-primary">Get Started</h2>
            <p className="mt-4 text-lg text-gray-600">
              Follow these simple steps and you&apos;ll be on your way to a trouble-free home sale.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {processSteps.map((step) => (
              <div key={step.number} className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-white">
                  {step.number}
                </div>
                <h3 className="mb-3 text-xl font-bold text-primary">Step {step.number}: {step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sell My House Fast Section */}
      <section className="bg-gray-50 py-16 lg:py-20">
        <div className="container-custom">
          <div className="grid gap-12 lg:grid-cols-2">
            {/* Image placeholder */}
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-primary/10">
              <div className="absolute inset-0 flex items-center justify-center">
                <HomeIcon className="h-24 w-24 text-primary/30" />
              </div>
              <Link
                href="/get-your-cash-today/"
                className={buttonClassName({
                  variant: 'accent',
                  size: 'lg',
                  fullWidth: true,
                  className: 'absolute bottom-4 left-4 right-4',
                })}
              >
                Get Your Cash Offer
              </Link>
            </div>

            {/* Content */}
            <div>
              <h2 className="text-2xl font-bold text-primary lg:text-3xl">
                SELL MY HOUSE FAST {data.city.toUpperCase()}
              </h2>
              <div className="mt-6 space-y-4 text-gray-600">
                <p>
                  Sell your house quickly and effortlessly with us because We buy houses {data.city}{' '}
                  {data.state || 'NV'}. As the leading buyer of properties in {data.city}, we
                  specialize in purchasing properties regardless of their condition, eliminating the
                  need for costly repairs or extensive cleaning.
                </p>
                <p>
                  With us, you won&apos;t encounter any hidden fees or surprise expenses along the
                  way, ensuring a transparent and fair transaction. Benefit from a streamlined
                  process that minimizes risks, reduces paperwork, and allows you to receive a
                  competitive cash offer within 24 hours.
                </p>
              </div>

              {/* Benefits Grid */}
              <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {benefits.map((benefit) => (
                  <div key={benefit.title} className="flex items-center gap-2">
                    <CheckIcon className="h-5 w-5 shrink-0 text-accent" />
                    <span className="text-sm font-medium text-gray-700">{benefit.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Quote 1 */}
      <section className="bg-primary py-12">
        <div className="container-custom">
          <blockquote className="mx-auto max-w-3xl text-center">
            <p className="text-lg italic text-white/90 lg:text-xl">
              &quot;{testimonials[0].text}&quot;
            </p>
            <footer className="mt-4 font-semibold text-white">
              {testimonials[0].name} – We Buy Any Vegas House Client
            </footer>
          </blockquote>
        </div>
      </section>

      {/* Any Reason, Condition, Challenge */}
      <section className="py-16 lg:py-20">
        <div className="container-custom">
          <h2 className="mb-12 text-center text-2xl font-bold text-primary lg:text-3xl">
            We Buy {data.city} Houses – Any Reason, Condition Or Challenge
          </h2>

          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <h3 className="mb-4 font-bold text-accent">Any Reason</h3>
              <ul className="space-y-2">
                {reasons.map((reason) => (
                  <li key={reason} className="text-gray-600">
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-4 font-bold text-accent">Any Condition</h3>
              <ul className="space-y-2">
                {conditions.map((condition) => (
                  <li key={condition} className="text-gray-600">
                    {condition}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-4 font-bold text-accent">Any Challenge</h3>
              <ul className="space-y-2">
                {challenges.map((challenge) => (
                  <li key={challenge} className="text-gray-600">
                    {challenge}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Quote 2 */}
      <section className="bg-gray-100 py-12">
        <div className="container-custom">
          <blockquote className="mx-auto max-w-3xl text-center">
            <p className="text-lg italic text-gray-700 lg:text-xl">
              &quot;{testimonials[1].text}&quot;
            </p>
            <footer className="mt-4 font-semibold text-primary">
              {testimonials[1].name}, We Buy Any Vegas House Client
            </footer>
          </blockquote>
        </div>
      </section>

      {/* Local Content */}
      <section className="py-16 lg:py-20">
        <div className="container-custom">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold text-primary lg:text-3xl">
                {data.localContent.title}
              </h2>
              <div className="mt-6 space-y-4 text-gray-600">
                {data.localContent.paragraphs.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
                <p className="text-gray-600">
                  As part of our Las Vegas valley coverage,{' '}
                  <Link href="/" className="font-semibold text-primary hover:underline">
                    we buy houses in Las Vegas
                  </Link>{' '}
                  and all surrounding communities for cash, no repairs, no fees, close on your timeline.
                  Need to{' '}
                  <Link href="/sell-my-house-fast/" className="font-semibold text-primary hover:underline">
                    sell your house fast
                  </Link>
                  ? Comparing selling options? Read our{' '}
                  <Link href="/selling-a-home/72-sold-reviews-las-vegas/" className="font-semibold text-primary hover:underline">
                    72 Sold review
                  </Link>{' '}
                  for a side-by-side breakdown.
                </p>
              </div>
            </div>

            {/* Image + CTA */}
            <div className="space-y-6">
              <div className="relative aspect-video overflow-hidden rounded-xl bg-primary/10">
                <div className="absolute inset-0 flex items-center justify-center">
                  <HomeIcon className="h-20 w-20 text-primary/30" />
                </div>
              </div>
              <Link
                href="/get-your-cash-today/"
                className={buttonClassName({
                  variant: 'accent',
                  size: 'lg',
                  fullWidth: true,
                })}
              >
                Get Your Cash Offer
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-accent py-8">
        <div className="container-custom text-center">
          <h3 className="text-xl font-bold text-white lg:text-2xl">
            Get Your No Obligation Offer in 24 Hours or Less!
          </h3>
          <p className="mt-2 text-white/90">
            Give us a call at{' '}
            <a href={`tel:${BUSINESS.phone}`} className="font-semibold hover:underline">
              {BUSINESS.phoneDisplay}
            </a>{' '}
            or fill out our form to get started.
          </p>
        </div>
      </section>

      {/* Testimonial Quote 3 */}
      <section className="bg-primary py-12">
        <div className="container-custom">
          <blockquote className="mx-auto max-w-3xl text-center">
            <p className="text-lg italic text-white/90 lg:text-xl">
              &quot;{testimonials[2].text}&quot;
            </p>
            <footer className="mt-4 font-semibold text-white">
              {testimonials[2].name}, We Buy Any Vegas House Client
            </footer>
          </blockquote>
        </div>
      </section>

      {/* What Makes Us Different */}
      <section className="py-16 lg:py-20">
        <div className="container-custom">
          <h2 className="mb-12 text-center text-2xl font-bold text-primary">
            What Makes Us Different
          </h2>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {differentiators.map((item) => (
              <div key={item.title} className="rounded-xl bg-white p-6 shadow-lg">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <CheckIcon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-primary">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section — visible Q&A, mirrors FAQPage schema for AI extraction */}
      {data.faqs && data.faqs.length > 0 && (
        <section className="bg-gray-50 py-16 lg:py-20">
          <div className="container-custom">
            <h2 className="mb-12 text-center text-2xl font-bold text-primary lg:text-3xl">
              {data.city} Cash Home Buyer FAQs
            </h2>
            <div className="mx-auto max-w-3xl space-y-6">
              {data.faqs.map((faq, index) => (
                <div key={index} className="rounded-xl bg-white p-6 shadow-sm">
                  <h3 className="mb-3 text-lg font-bold text-primary">{faq.question}</h3>
                  <p className="text-gray-700">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
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
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

function BBBBadge({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 80 40">
      <rect fill="#006CB7" width="80" height="40" rx="4" />
      <text x="40" y="18" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">BBB</text>
      <text x="40" y="32" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">A+</text>
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

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )
}
