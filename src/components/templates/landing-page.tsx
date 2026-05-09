import Link from 'next/link'
import { LocalBusinessSchema } from '@/components/seo/local-business-schema'
import { BreadcrumbSchema } from '@/components/seo/breadcrumb-schema'
import { Hero } from '@/components/sections/hero'
import { AccreditationBadges } from '@/components/sections/accreditation-badges'
import { MediaLogos } from '@/components/sections/media-logos'
import { HowItWorks } from '@/components/sections/how-it-works'
import { ComparisonTable } from '@/components/sections/comparison-table'
import { CTASection } from '@/components/sections/cta-section'
import { getGoogleReviews } from '@/lib/google-reviews'
import { GOOGLE_REVIEWS } from '@/lib/constants'
import type { GoogleReview } from '@/lib/google-reviews'

export interface LandingPageData {
  slug: string
  headline: string
  subheadline: string
  metaTitle: string
  metaDescription: string
  primaryKeyword: string
  bullets?: string[]
  testimonial?: {
    text: string
    name: string
  }
}

const comparisonData = [
  {
    feature: 'Timeline',
    traditional: '60–90 days on market',
    ourWay: 'Close in 7 days',
  },
  {
    feature: 'Repairs',
    traditional: 'You pay for repairs & staging',
    ourWay: 'Sell as-is, any condition',
  },
  {
    feature: 'Fees',
    traditional: '6–8% in commissions & costs',
    ourWay: 'Zero fees or commissions',
  },
  {
    feature: 'Showings',
    traditional: 'Open houses & strangers',
    ourWay: 'No showings needed',
  },
  {
    feature: 'Certainty',
    traditional: 'Deals fall through often',
    ourWay: 'Guaranteed cash close',
  },
]

interface LandingPageTemplateProps {
  data: LandingPageData
}

export async function LandingPageTemplate({ data }: LandingPageTemplateProps) {
  const googleReviews = await getGoogleReviews()

  return (
    <main>
      <LocalBusinessSchema city="Las Vegas" pageUrl={`/lp/${data.slug}/`} />
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: '/' },
          { name: data.primaryKeyword, url: `/lp/${data.slug}/` },
        ]}
      />

      {/* Hero Section with Lead Form */}
      <Hero variant="inline-form" googleRating={googleReviews.rating} googleCount={googleReviews.count} />

      {/* Accreditation Badges Marquee */}
      <AccreditationBadges googleRating={googleReviews.rating} googleCount={googleReviews.count} />

      {/* As Seen On - immediate credibility */}
      <MediaLogos />

      {/* Compact Testimonials - 3 short quotes */}
      <CompactTestimonials
        reviews={googleReviews.reviews}
        rating={googleReviews.rating}
        count={googleReviews.count}
      />

      {/* How It Works - 3 Step Process */}
      <HowItWorks />

      {/* Comparison Table - Us vs Traditional */}
      <ComparisonTable
        title="Selling to Us vs. Listing with a Realtor"
        subtitle="See why Las Vegas homeowners choose us over the traditional route."
        data={comparisonData}
        traditionalLabel="Realtor"
        ourLabel="We Buy Any Vegas House"
      />

      {/* Final CTA */}
      <CTASection />

      {/* Minimal LP Footer */}
      <footer className="border-t border-gray-200 bg-white py-6">
        <div className="container-custom text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} We Buy Any Vegas House. All rights reserved.</p>
          <p className="mt-2">
            <Link href="/privacy-policy/" className="hover:text-primary">
              Privacy Policy
            </Link>
          </p>
        </div>
      </footer>
    </main>
  )
}

/* ── Compact Testimonials (LP-only) ─────────────────────────── */

const fallbackReviews: GoogleReview[] = [
  {
    name: 'Melisha Scholle',
    date: '6 months ago',
    text: "Their team walked me through every step and made the process way easier than trying to sell with an agent. I couldn't have asked for a better experience.",
    rating: 5,
  },
  {
    name: 'Cori Brisk',
    date: '6 months ago',
    text: 'They were upfront, honest, and made the entire process simple for me. This company is not shady at all.',
    rating: 5,
  },
  {
    name: 'Vince Colonna',
    date: 'a month ago',
    text: 'David understood my needs and addressed my concerns completely. The ultimate professional in his field.',
    rating: 5,
  },
]

function CompactTestimonials({
  reviews,
  rating,
  count,
}: {
  reviews?: GoogleReview[]
  rating?: string
  count?: number
}) {
  const displayRating = rating || GOOGLE_REVIEWS.rating
  const displayCount = count || GOOGLE_REVIEWS.count
  // Take first 3 reviews, trim text to keep compact
  const displayReviews = (reviews && reviews.length >= 3 ? reviews.slice(0, 3) : fallbackReviews).map(
    (r) => ({
      ...r,
      text: r.text.length > 160 ? r.text.substring(0, 157) + '...' : r.text,
    })
  )

  return (
    <section className="bg-white py-10 lg:py-12">
      <div className="container-custom">
        {/* Google rating bar */}
        <div className="mb-8 flex items-center justify-center gap-3">
          <a
            href={GOOGLE_REVIEWS.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3"
          >
            <GoogleIcon className="h-6 w-6" />
            <span className="text-lg font-bold text-gray-900">{displayRating}</span>
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <StarIcon key={i} className="h-5 w-5 text-yellow-400" />
              ))}
            </div>
            <span className="text-sm text-gray-600">from {displayCount}+ reviews</span>
          </a>
        </div>

        {/* 3 compact review cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {displayReviews.map((review, i) => (
            <div key={i} className="rounded-lg bg-gray-50 p-5">
              <div className="mb-2 flex">
                {[...Array(review.rating)].map((_, j) => (
                  <StarIcon key={j} className="h-4 w-4 text-yellow-400" />
                ))}
              </div>
              <p className="text-sm text-gray-700">&ldquo;{review.text}&rdquo;</p>
              <p className="mt-3 text-sm font-semibold text-gray-900">— {review.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Inline icons ────────────────────────────────────────────── */

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
