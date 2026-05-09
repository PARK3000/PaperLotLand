import { cn } from '@/lib/utils'
import { BUSINESS } from '@/lib/constants'
import { getGoogleReviews } from '@/lib/google-reviews'

interface TrustBarProps {
  variant?: 'default' | 'dark' | 'light'
  className?: string
}

export async function TrustBar({ variant = 'default', className }: TrustBarProps) {
  const googleReviews = await getGoogleReviews()
  const bgClass = {
    default: 'bg-[var(--color-primary-50)]',
    dark: 'bg-[var(--color-primary)]',
    light: 'bg-white',
  }[variant]

  const textClass = {
    default: 'text-[var(--color-primary)]',
    dark: 'text-white',
    light: 'text-[var(--color-text)]',
  }[variant]

  const mutedTextClass = {
    default: 'text-[var(--color-text-muted)]',
    dark: 'text-white/80',
    light: 'text-[var(--color-text-muted)]',
  }[variant]

  return (
    <section className={cn(bgClass, 'py-6', className)}>
      <div className="container-custom">
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 lg:gap-12">
          {/* Homes Purchased */}
          <div className="flex items-center gap-2">
            <HomeIcon className={cn('h-6 w-6', textClass)} />
            <div className="text-center">
              <p className={cn('text-lg font-bold leading-none', textClass)}>
                2,000+
              </p>
              <p className={cn('text-xs', mutedTextClass)}>Homes Purchased</p>
            </div>
          </div>

          {/* Divider - hidden on mobile */}
          <Divider className="hidden md:block" variant={variant} />

          {/* Years in Business */}
          <div className="flex items-center gap-2">
            <CalendarIcon className={cn('h-6 w-6', textClass)} />
            <div className="text-center">
              <p className={cn('text-lg font-bold leading-none', textClass)}>
                Since 2016
              </p>
              <p className={cn('text-xs', mutedTextClass)}>Serving Las Vegas</p>
            </div>
          </div>

          {/* Divider - hidden on mobile */}
          <Divider className="hidden md:block" variant={variant} />

          {/* Google Rating */}
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-label="Google" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <StarIcon
                  key={i}
                  className="h-4 w-4 text-yellow-400"
                  filled
                />
              ))}
            </div>
            <div className="text-center">
              <p className={cn('text-lg font-bold leading-none', textClass)}>
                {googleReviews.rating}
              </p>
              <p className={cn('text-xs', mutedTextClass)}>
                ({googleReviews.count}+ Reviews)
              </p>
            </div>
          </div>

          {/* Divider - hidden on mobile */}
          <Divider className="hidden lg:block" variant={variant} />

          {/* BBB Rating */}
          <div className="hidden items-center gap-2 lg:flex">
            <ShieldIcon className={cn('h-6 w-6', textClass)} />
            <div className="text-center">
              <p className={cn('text-lg font-bold leading-none', textClass)}>
                A+
              </p>
              <p className={cn('text-xs', mutedTextClass)}>BBB Rating</p>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

function Divider({
  className,
  variant,
}: {
  className?: string
  variant: 'default' | 'dark' | 'light'
}) {
  const borderClass = {
    default: 'border-[var(--color-primary-100)]',
    dark: 'border-white/20',
    light: 'border-gray-200',
  }[variant]

  return <div className={cn('h-10 border-l', borderClass, className)} />
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  )
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  )
}

function StarIcon({
  className,
  filled,
}: {
  className?: string
  filled?: boolean
}) {
  return (
    <svg
      className={className}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
      />
    </svg>
  )
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  )
}


