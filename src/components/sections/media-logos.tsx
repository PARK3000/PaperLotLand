import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface MediaLogosProps {
  className?: string
}

export function MediaLogos({ className }: MediaLogosProps) {
  return (
    <section className={cn('bg-[var(--color-primary)] py-8', className)}>
      <div className="container-custom">
        {/* HGTV Featured Callout */}
        <div className="mb-6 flex justify-center">
          <Link
            href="https://www.hgtv.com/shows/bet-the-house"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-4 rounded-xl border border-white/20 bg-white/10 px-6 py-4 transition-colors hover:bg-white/20"
          >
            <Image
              src="/images/media-logos/hgtv.webp"
              alt="HGTV"
              width={80}
              height={40}
              className="h-10 w-auto brightness-0 invert"
            />
            <div className="text-white">
              <p className="text-xs font-medium uppercase tracking-widest text-white/70">Featured On</p>
              <p className="text-base font-bold leading-tight">HGTV&apos;s <em>Bet the House</em></p>
              <p className="text-xs text-white/70">As seen on national television</p>
            </div>
            <svg className="ml-2 h-4 w-4 text-white/50 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 lg:gap-20">
          <span className="text-sm font-medium text-white/80">
            As Seen On
          </span>
          {/* HGTV */}
          <Link
            href="https://www.hgtv.com/shows/bet-the-house"
            target="_blank"
            rel="noopener noreferrer"
            className="opacity-80 transition-opacity hover:opacity-100"
          >
            <Image
              src="/images/media-logos/hgtv.webp"
              alt="HGTV - Bet the House"
              width={80}
              height={40}
              loading="lazy"
              className="h-8 w-auto brightness-0 invert"
            />
          </Link>
          {/* FOX */}
          <Image
            src="/images/media-logos/fox.webp"
            alt="FOX"
            width={80}
            height={40}
            loading="lazy"
            className="h-8 w-auto brightness-0 invert"
          />
          {/* ABC */}
          <Image
            src="/images/media-logos/abc.webp"
            alt="ABC"
            width={80}
            height={40}
            loading="lazy"
            className="h-8 w-auto brightness-0 invert"
          />
          {/* CBS */}
          <Image
            src="/images/media-logos/cbs.webp"
            alt="CBS"
            width={80}
            height={40}
            loading="lazy"
            className="h-8 w-auto brightness-0 invert"
          />
          {/* NBC */}
          <Image
            src="/images/media-logos/nbc.webp"
            alt="NBC"
            width={80}
            height={40}
            loading="lazy"
            className="h-8 w-auto brightness-0 invert"
          />
        </div>
      </div>
    </section>
  )
}
