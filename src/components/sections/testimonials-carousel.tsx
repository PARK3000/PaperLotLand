'use client'

import useEmblaCarousel from 'embla-carousel-react'
import { useCallback } from 'react'
import type { GoogleReview } from '@/lib/google-reviews'
import { GOOGLE_REVIEWS } from '@/lib/constants'

interface TestimonialsCarouselProps {
  reviews: GoogleReview[]
}

export function TestimonialsCarousel({ reviews }: TestimonialsCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' })

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  return (
    <div className="relative">
      {/* Prev arrow */}
      <button
        onClick={scrollPrev}
        aria-label="Previous review"
        tabIndex={-1}
        className="absolute -left-4 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-gray-200 transition hover:bg-gray-50 md:-left-5"
      >
        <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
      </button>

      {/* Viewport */}
      <div className="overflow-hidden px-1" ref={emblaRef}>
        <div className="flex gap-6">
          {reviews.map((review, index) => (
            <div
              key={index}
              className="flex-[0_0_90%] md:flex-[0_0_calc(50%-12px)] lg:flex-[0_0_calc(33.333%-16px)] flex flex-col rounded-xl bg-white p-6 shadow-lg ring-1 ring-gray-100"
            >
              {/* Stars + Google icon */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex">
                  {[...Array(review.rating)].map((_, i) => (
                    <StarIcon key={i} className="h-5 w-5 text-yellow-400" />
                  ))}
                </div>
                <GoogleIcon className="h-5 w-5" />
              </div>

              {/* Review text */}
              <p className="mb-4 flex-1 line-clamp-5 text-gray-600">{review.text}</p>

              {/* Reviewer */}
              <div className="flex items-center gap-3 border-t border-gray-100 pt-4">
                <a
                  href={GOOGLE_REVIEWS.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white"
                >
                  {review.name.charAt(0)}
                </a>
                <div>
                  <a
                    href={GOOGLE_REVIEWS.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-primary hover:text-accent"
                  >
                    {review.name}
                  </a>
                  <div className="text-sm text-gray-500">{review.date}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Next arrow */}
      <button
        onClick={scrollNext}
        aria-label="Next review"
        tabIndex={-1}
        className="absolute -right-4 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-gray-200 transition hover:bg-gray-50 md:-right-5"
      >
        <ChevronRightIcon className="h-5 w-5 text-gray-600" />
      </button>
    </div>
  )
}

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

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  )
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )
}
