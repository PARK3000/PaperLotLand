import { cn } from '@/lib/utils'

interface CTAProps {
  headline: string
  subheadline?: string
  ctaText: string
  ctaHref?: string
  variant?: 'default' | 'accent' | 'dark'
  className?: string
}

export function CTA({
  headline,
  subheadline,
  ctaText,
  ctaHref = '#',
  variant = 'default',
  className,
}: CTAProps) {
  return (
    <section
      className={cn(
        'px-4 py-24 sm:px-6 lg:px-8',
        {
          'bg-surface': variant === 'default',
          'bg-primary text-white': variant === 'accent',
          'bg-gray-900 text-white': variant === 'dark',
        },
        className
      )}
    >
      <div className="mx-auto max-w-4xl text-center">
        <h2
          className={cn('text-3xl font-bold tracking-tight sm:text-4xl', {
            'text-text': variant === 'default',
            'text-white': variant === 'accent' || variant === 'dark',
          })}
        >
          {headline}
        </h2>

        {subheadline && (
          <p
            className={cn('mx-auto mt-4 max-w-2xl text-lg', {
              'text-text-muted': variant === 'default',
              'text-white': variant === 'accent' || variant === 'dark',
            })}
          >
            {subheadline}
          </p>
        )}

        <div className="mt-10">
          <a
            href={ctaHref}
            className={cn(
              'inline-flex h-12 items-center justify-center rounded-md px-6 text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
              {
                'bg-primary text-white hover:bg-primary-dark focus-visible:ring-primary':
                  variant === 'default',
                'border border-white text-white hover:bg-white hover:text-primary focus-visible:ring-white':
                  variant === 'accent',
                'border border-white text-white hover:bg-white hover:text-gray-900 focus-visible:ring-white':
                  variant === 'dark',
              }
            )}
          >
            {ctaText}
          </a>
        </div>
      </div>
    </section>
  )
}
