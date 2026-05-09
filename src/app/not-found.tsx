import Link from 'next/link'
import { BUSINESS } from '@/lib/constants'

export default function NotFound() {
  return (
    <div className="bg-[var(--color-primary)]">
      <div className="container-custom flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
        <p className="text-lg font-semibold uppercase tracking-wider text-[var(--color-accent)]">
          404 Error
        </p>
        <h1 className="mt-4 text-4xl font-bold text-white md:text-5xl">
          Page Not Found
        </h1>
        <p className="mt-4 max-w-lg text-lg text-white/80">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. It may
          have been moved or no longer exists.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-[var(--color-accent)] px-8 py-3 font-semibold text-white transition-colors hover:bg-[var(--color-accent)]/90"
          >
            Go to Homepage
          </Link>
          <Link
            href="/contact-us/"
            className="inline-flex items-center justify-center rounded-lg border-2 border-white/30 px-8 py-3 font-semibold text-white transition-colors hover:border-white hover:bg-white/10"
          >
            Contact Us
          </Link>
        </div>

        <div className="mt-10 rounded-xl border border-white/10 bg-white/5 px-8 py-6">
          <p className="text-white/70">
            Need to sell your house fast? Call us now:
          </p>
          <a
            href={`tel:${BUSINESS.phone}`}
            className="mt-2 inline-block text-2xl font-bold text-white transition-colors hover:text-[var(--color-accent)]"
          >
            {BUSINESS.phoneDisplay}
          </a>
          <p className="mt-1 text-sm text-white/50">{BUSINESS.hours}</p>
        </div>
      </div>
    </div>
  )
}
