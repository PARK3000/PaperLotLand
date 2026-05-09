import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { buttonClassName } from '@/components/ui/button'

interface Situation {
  title: string
  description: string
  icon: React.ReactNode
  href: string
}

const situations: Situation[] = [
  {
    title: 'Facing Foreclosure',
    description: 'Stop foreclosure and sell your home fast before the bank takes it.',
    icon: <AlertIcon className="h-8 w-8" />,
    href: '/stop-a-foreclosure/',
  },
  {
    title: 'Inherited Property',
    description: 'Sell an inherited house quickly without the hassle of repairs or probate delays.',
    icon: <GiftIcon className="h-8 w-8" />,
    href: '/need-to-sell-an-inherited-house/',
  },
  {
    title: 'Going Through Divorce',
    description: 'Sell your house fast during a divorce and split the proceeds fairly.',
    icon: <UsersIcon className="h-8 w-8" />,
    href: '/going-through-a-divorce/',
  },
  {
    title: 'Relocating',
    description: 'Moving out of state? Sell your Las Vegas home quickly for cash.',
    icon: <PlaneIcon className="h-8 w-8" />,
    href: '/relocating/',
  },
  {
    title: 'House Needs Repairs',
    description: "Sell your house as-is. No repairs needed — we buy homes in any condition.",
    icon: <ToolIcon className="h-8 w-8" />,
    href: '/house-that-needs-repairs/',
  },
  {
    title: 'Code Violations',
    description: 'Have code violations? We buy homes with open violations and handle them.',
    icon: <ClipboardIcon className="h-8 w-8" />,
    href: '/code-violations/',
  },
  {
    title: 'Fire Damaged Home',
    description: 'Sell a fire-damaged house fast without expensive repairs or insurance delays.',
    icon: <FireIcon className="h-8 w-8" />,
    href: '/fire-damaged-home/',
  },
  {
    title: 'Facing Bankruptcy',
    description: 'Sell your house before bankruptcy and protect your financial future.',
    icon: <ShieldIcon className="h-8 w-8" />,
    href: '/facing-bankruptcy/',
  },
  {
    title: 'Hoarder House',
    description: 'Sell a house full of trash or junk without the expensive cleanup.',
    icon: <TrashIcon className="h-8 w-8" />,
    href: '/house-full-of-trash/',
  },
  {
    title: 'Behind on Payments',
    description: 'Late on mortgage payments? Sell your house fast before it gets worse.',
    icon: <DollarIcon className="h-8 w-8" />,
    href: '/late-on-mortgage-payments/',
  },
]

interface SituationsGridProps {
  title?: string
  subtitle?: string
  showCTA?: boolean
}

export function SituationsGrid({
  title = 'How We Can Help',
  subtitle = 'No matter your situation, we have solutions to meet your needs.',
  showCTA = true,
}: SituationsGridProps) {
  return (
    <section className="section-padding">
      <div className="container-custom">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-[var(--color-text)] md:text-4xl">
            {title}
          </h2>
          <p className="mt-4 text-lg text-[var(--color-text-muted)]">
            {subtitle}
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {situations.map((situation) => (
            <Link key={situation.href} href={situation.href}>
              <Card hover padding="md" className="h-full">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--color-primary-50)] text-[var(--color-primary)]">
                  {situation.icon}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-[var(--color-text)]">
                  {situation.title}
                </h3>
                <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                  {situation.description}
                </p>
                <span className="mt-3 inline-flex items-center text-sm font-medium text-[var(--color-primary)]">
                  Learn more
                  <ArrowIcon className="ml-1 h-4 w-4" />
                </span>
              </Card>
            </Link>
          ))}
        </div>

        {showCTA && (
          <div className="mt-12 text-center">
            <p className="mb-4 text-[var(--color-text-muted)]">
              Don&apos;t see your situation? Contact us to learn how we can help.
            </p>
            <Link
              href="/contact-us/"
              className={buttonClassName({ variant: 'primary', size: 'xl' })}
            >
              Contact Us
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}

// Icons
function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  )
}

function GiftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
    </svg>
  )
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}

function PlaneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  )
}

function ToolIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function ClipboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  )
}

function FireIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
    </svg>
  )
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  )
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  )
}

function DollarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
