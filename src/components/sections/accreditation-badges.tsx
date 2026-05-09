import { cn } from '@/lib/utils'

interface AccreditationBadgesProps {
  className?: string
  googleRating?: string | number
  googleCount?: string | number
}

export function AccreditationBadges({ className, googleRating, googleCount }: AccreditationBadgesProps) {
  return (
    <section className={cn('bg-[var(--color-primary)] py-4 overflow-hidden', className)}>
      {/* Infinite scrolling marquee */}
      <div className="relative">
        <div className="flex animate-marquee items-center gap-16 whitespace-nowrap">
          {/* First set */}
          <MarqueeContent googleRating={googleRating} googleCount={googleCount} />
          {/* Duplicate for seamless loop */}
          <MarqueeContent googleRating={googleRating} googleCount={googleCount} />
        </div>
      </div>
    </section>
  )
}

function MarqueeContent({ googleRating, googleCount }: { googleRating?: string | number; googleCount?: string | number }) {
  return (
    <>
      {/* Google Reviews */}
      <div className="flex items-center gap-2">
        <div className="flex">
          {[...Array(5)].map((_, i) => (
            <svg
              key={i}
              className="h-5 w-5 text-yellow-400"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          ))}
        </div>
        <span className="text-lg font-bold text-white">{googleRating ?? 4.8}</span>
        <span className="text-sm text-white/80">Google Rating{googleCount ? ` (${googleCount}+)` : ''}</span>
      </div>

      <Divider />

      {/* 2,000+ Homes Purchased */}
      <div className="flex items-center gap-2">
        <HomeIcon className="h-5 w-5 text-white/80" />
        <span className="text-lg font-bold text-white">2,000+</span>
        <span className="text-sm text-white/80">Homes Purchased</span>
      </div>

      <Divider />

      {/* Since 2016 */}
      <div className="flex items-center gap-2">
        <CalendarIcon className="h-5 w-5 text-white/80" />
        <span className="text-lg font-bold text-white">Since 2016</span>
        <span className="text-sm text-white/80">Serving Las Vegas</span>
      </div>

      <Divider />

      {/* 7 Day Close */}
      <div className="flex items-center gap-2">
        <ClockIcon className="h-5 w-5 text-white/80" />
        <span className="text-lg font-bold text-white">7 Days</span>
        <span className="text-sm text-white/80">Guaranteed Close</span>
      </div>

      <Divider />

      {/* A+ BBB Rating */}
      <div className="flex items-center gap-2">
        <ShieldIcon className="h-5 w-5 text-white/80" />
        <span className="text-lg font-bold text-white">A+</span>
        <span className="text-sm text-white/80">BBB Rating</span>
      </div>

      <Divider />
    </>
  )
}

function Divider() {
  return <span className="mx-6 h-6 w-px bg-white/20" />
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  )
}
