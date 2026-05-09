import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { buttonClassName } from '@/components/ui/button'

interface ValueProp {
  icon: React.ReactNode
  title: string
  description: string
  highlight?: string
}

const defaultValueProps: ValueProp[] = [
  {
    icon: <DollarIcon className="h-8 w-8" />,
    title: 'Zero Fees to Sell',
    description:
      'We cover all closing costs. No agent commissions, no hidden fees. The offer we make is the amount you receive.',
    highlight: 'No commissions',
  },
  {
    icon: <HomeIcon className="h-8 w-8" />,
    title: 'Sell As-Is',
    description:
      'No repairs, no cleaning, no staging needed. We buy houses in any condition—inherited, damaged, or outdated.',
    highlight: 'No repairs needed',
  },
  {
    icon: <ClockIcon className="h-8 w-8" />,
    title: 'Close in 7 Days',
    description:
      'Skip months of waiting. We can close on your timeline, whether you need to sell fast or take your time.',
    highlight: 'Fast closing',
  },
  {
    icon: <TrendingIcon className="h-8 w-8" />,
    title: 'Highest Cash Offers',
    description:
      'We provide competitive cash offers based on current market values. Get a fair price without the hassle of listing.',
    highlight: 'Fair market value',
  },
]

interface ValuePropsProps {
  title?: string
  subtitle?: string
  valueProps?: ValueProp[]
  showCTA?: boolean
}

export function ValueProps({
  title = 'Why Choose We Buy Any Vegas House?',
  subtitle = "We've helped over 2,000 Las Vegas homeowners sell their houses fast for cash. Here's why they chose us.",
  valueProps = defaultValueProps,
  showCTA = true,
}: ValuePropsProps) {
  return (
    <section className="section-padding">
      <div className="container-custom">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-[var(--color-text)] md:text-4xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-4 text-lg text-[var(--color-text-muted)]">
              {subtitle}
            </p>
          )}
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {valueProps.map((prop, index) => (
            <Card key={index} hover padding="lg" className="relative text-center">
              {/* Highlight badge */}
              {prop.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-[var(--color-accent)] px-3 py-1 text-xs font-semibold text-white">
                    {prop.highlight}
                  </span>
                </div>
              )}

              <div className="mx-auto mb-4 mt-2 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary-50)] text-[var(--color-primary)]">
                {prop.icon}
              </div>
              <h3 className="text-xl font-bold text-[var(--color-text)]">
                {prop.title}
              </h3>
              <p className="mt-3 text-[var(--color-text-muted)]">
                {prop.description}
              </p>
            </Card>
          ))}
        </div>

        {showCTA && (
          <div className="mt-12 text-center">
            <Link
              href="/get-your-cash-today/"
              className={buttonClassName({ variant: 'accent', size: 'xl' })}
            >
              Get My Free Cash Offer
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}

function DollarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  )
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  )
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  )
}

function TrendingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
      />
    </svg>
  )
}
