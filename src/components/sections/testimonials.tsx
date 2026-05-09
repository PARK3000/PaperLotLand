import Link from 'next/link'
import { GOOGLE_REVIEWS } from '@/lib/constants'
import type { GoogleReview } from '@/lib/google-reviews'
import { TestimonialsCarousel } from './testimonials-carousel'

interface TestimonialsProps {
  title?: string
  subtitle?: string
  /** Live rating from Google Places API (falls back to constant) */
  rating?: string
  /** Live review count from Google Places API (falls back to constant) */
  count?: number
  /** Live reviews from Google Places API (falls back to hardcoded reviews) */
  reviews?: GoogleReview[]
}

export function Testimonials({
  title = 'Happy Sellers',
  subtitle = 'See What Real Homeowners Say About Our Fast and Easy Selling Process',
  rating,
  count,
  reviews,
}: TestimonialsProps) {
  const displayRating = rating || GOOGLE_REVIEWS.rating
  const displayCount = count || GOOGLE_REVIEWS.count
  const displayReviews = reviews && reviews.length > 0 ? reviews : fallbackReviews

  return (
    <section className="bg-white py-16 lg:py-20">
      <div className="container-custom">
        {/* Header */}
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold italic text-[var(--color-accent)] md:text-4xl">{title}</h2>
          <p className="mt-4 text-lg text-gray-600">{subtitle}</p>
        </div>

        {/* Rating Summary */}
        <div className="mb-12">
          <a
            href={GOOGLE_REVIEWS.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mx-auto flex max-w-2xl items-center gap-4 rounded-lg border border-gray-200 bg-gray-50 px-6 py-4 transition-shadow hover:shadow-md"
          >
            <GoogleTextLogo className="h-7 w-auto" />
            <span className="text-sm text-gray-600">Overall Rating</span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-gray-900">{displayRating}</span>
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <StarIcon key={i} className="h-5 w-5 text-yellow-400" />
                ))}
              </div>
            </div>
            <span className="text-sm text-gray-600">Based on <strong>{displayCount}</strong> Reviews</span>
          </a>
        </div>

        {/* Reviews Carousel */}
        <div className="px-6">
          <TestimonialsCarousel reviews={displayReviews} />
        </div>

        {/* View All Link */}
        <div className="mt-12 text-center">
          <Link
            href="/happy-sellers/"
            className="inline-flex items-center gap-2 font-semibold text-primary hover:text-accent"
          >
            View All Reviews
            <ArrowIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}

const fallbackReviews: GoogleReview[] = [
  {
    name: 'Brad Chandler',
    date: 'January 25, 2026',
    text: "I've known the owner of We Buy Any Vegas House and his company for years, and I can confidently say they operate with integrity, professionalism, and genuine care for people. He's built a solid reputation in the Las Vegas market by doing things the right way and treating everyone with honesty and respect.",
    rating: 5,
  },
  {
    name: 'Lila Handous',
    date: 'January 22, 2026',
    text: "Casey was incredibly professional and pleasant to deal with. He was full of information and made the experience pleasant. Can't wait to work with him!",
    rating: 5,
  },
  {
    name: 'Christian Hernandez',
    date: 'December 28, 2025',
    text: 'Casey was very helpful in the process of buying our house. Very knowledgeable and answered all my questions I had. No stress whatsoever I was made felt comfortable with my decision to sell my house.',
    rating: 5,
  },
  {
    name: 'Alyssa Hernandez',
    date: 'December 28, 2025',
    text: "Casey with We Buy Any House is absolutely phenomenal!! He's very respectful, honest, straightforward, and most of all helpful! His knowledge is highly impressive and he's a very personable guy.",
    rating: 5,
  },
  {
    name: 'Sheli Long Elswick',
    date: 'September 26, 2025',
    text: 'Unbelievably easy! We agreed on a date for closing and they signed escrow the day before and I received my proceeds on the closing date. As a local Realtor for many years this was one of the easiest closings I have ever participated in.',
    rating: 5,
  },
  {
    name: 'Melisha Scholle',
    date: 'September 3, 2025',
    text: "Selling my house felt soooo stressful. I wasn't sure where to start and the thought of repairs stressed me out. Their team walked me through every step and made the process seem way easier than trying to sell with an agent.",
    rating: 5,
  },
]

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  )
}


function GoogleTextLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 272 92" xmlns="http://www.w3.org/2000/svg">
      <path fill="#4285F4" d="M115.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18C71.25 34.32 81.24 25 93.5 25s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44S80.99 39.2 80.99 47.18c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z"/>
      <path fill="#EA4335" d="M163.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18c0-12.85 9.99-22.18 22.25-22.18s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44s-12.51 5.46-12.51 13.44c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z"/>
      <path fill="#FBBC05" d="M209.75 26.34v39.82c0 16.38-9.66 23.07-21.08 23.07-10.75 0-17.22-7.19-19.66-13.07l8.48-3.53c1.51 3.61 5.21 7.87 11.17 7.87 7.31 0 11.84-4.51 11.84-13v-3.19h-.34c-2.18 2.69-6.38 5.04-11.68 5.04-11.09 0-21.25-9.66-21.25-22.09 0-12.52 10.16-22.26 21.25-22.26 5.29 0 9.49 2.35 11.68 4.96h.34v-3.61h9.25zm-8.56 20.92c0-7.81-5.21-13.52-11.84-13.52-6.72 0-12.35 5.71-12.35 13.52 0 7.73 5.63 13.36 12.35 13.36 6.63 0 11.84-5.63 11.84-13.36z"/>
      <path fill="#4285F4" d="M225 3v65h-9.5V3h9.5z"/>
      <path fill="#34A853" d="M262.02 54.48l7.56 5.04c-2.44 3.61-8.32 9.83-18.48 9.83-12.6 0-22.01-9.74-22.01-22.18 0-13.19 9.49-22.18 20.92-22.18 11.51 0 17.14 9.16 18.98 14.11l1.01 2.52-29.65 12.28c2.27 4.45 5.8 6.72 10.75 6.72 4.96 0 8.4-2.44 10.92-6.14zm-23.27-7.98l19.82-8.23c-1.09-2.77-4.37-4.7-8.23-4.7-4.95 0-11.84 4.37-11.59 12.93z"/>
      <path fill="#EA4335" d="M35.29 41.41V32H67c.31 1.64.47 3.58.47 5.68 0 7.06-1.93 15.79-8.15 22.01-6.05 6.3-13.78 9.66-24.02 9.66C16.32 69.35.36 53.89.36 34.91.36 15.93 16.32.47 35.3.47c10.5 0 17.98 4.12 23.6 9.49l-6.64 6.64c-4.03-3.78-9.49-6.72-16.97-6.72-13.86 0-24.7 11.17-24.7 25.03 0 13.86 10.84 25.03 24.7 25.03 8.99 0 14.11-3.61 17.39-6.89 2.66-2.66 4.41-6.46 5.1-11.65l-22.49.01z"/>
    </svg>
  )
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )
}
