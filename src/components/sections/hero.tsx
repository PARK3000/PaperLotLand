import Image from 'next/image'
import { GOOGLE_REVIEWS, BBB } from '@/lib/constants'
import { HeroForm } from '@/components/sections/hero-form'

interface HeroProps {
  title?: string
  subtitle?: string
  location?: string
  googleRating?: string
  googleCount?: number
  /** 'redirect' sends user to /get-your-cash-today/; 'inline-form' expands to full form on same page */
  variant?: 'redirect' | 'inline-form'
}

export function Hero({
  title = 'We Buy Houses Las Vegas',
  subtitle = 'The Simple Way To',
  location,
  googleRating,
  googleCount,
  variant = 'redirect',
}: HeroProps) {
  const displayRating = googleRating || GOOGLE_REVIEWS.rating
  const displayCount = googleCount || GOOGLE_REVIEWS.count
  const displayTitle = location ? `We Buy Houses ${location}` : title

  return (
    <section className="relative min-h-[600px] lg:min-h-[650px]">
      {/* Background Image — LCP element, renders in server HTML before JS hydration */}
      <div className="absolute inset-0">
        <Image
          src="/images/hero/hero-bg.jpg"
          alt="We buy houses Las Vegas for cash"
          fill
          priority
          fetchPriority="high"
          className="object-cover object-center"
          sizes="(max-width: 640px) 640px, (max-width: 1024px) 1024px, 1920px"
          quality={60}
        />
      </div>

      {/* Content */}
      <div className="container-custom relative z-10 flex min-h-[600px] items-center justify-center py-12 lg:min-h-[650px] lg:py-16">
        {/* Blue Card Overlay */}
        <div className="mx-auto w-full max-w-4xl rounded-2xl border-4 border-white/30 bg-[linear-gradient(180deg,rgba(29,134,198,0.82)_0%,rgba(6,38,58,0.64)_71%)] saturate-[1.1] brightness-105 px-6 py-10 text-center shadow-2xl sm:px-10 lg:px-12 lg:py-12 min-h-[380px] sm:min-h-[400px] lg:min-h-[420px]">
          {/* Main headline */}
          <h1 className="text-3xl font-bold italic text-white sm:text-4xl lg:text-5xl">
            {displayTitle}
          </h1>

          {/* Subheadline */}
          <h2 className="mt-3 text-lg font-medium italic text-white sm:text-xl lg:text-2xl">
            {subtitle} <span className="font-bold">Sell Your Las Vegas Home</span>
          </h2>

          {/* Form Area — client island, hydrates independently */}
          <HeroForm variant={variant} />

          {/* Trust Line */}
          <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-white">
            Vegas&apos; Most Trusted Home Buyer since 2016
          </p>

          {/* Trust Badges */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <a
              href={GOOGLE_REVIEWS.url}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-transform hover:scale-105"
            >
              <Image
                src="/images/hero/cash-home-buyers-reviews-4_8.png"
                alt={`Google Reviews - ${displayRating} stars from ${displayCount} reviews`}
                width={180}
                height={60}
                className="h-auto w-[160px] sm:w-[180px]"
              />
            </a>
            <a
              href={BBB.url}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-transform hover:scale-105"
            >
              <Image
                src="/images/badges/bbb-badge.webp"
                alt="BBB A+ Accredited Business"
                width={180}
                height={60}
                className="h-auto w-[160px] sm:w-[180px]"
              />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
