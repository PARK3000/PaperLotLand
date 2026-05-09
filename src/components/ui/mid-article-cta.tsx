import Link from 'next/link'
import { BUSINESS } from '@/lib/constants'

export function MidArticleCta() {
  return (
    <div className="my-8 rounded-xl border border-slate-200 bg-slate-50 p-6">
      <p className="text-lg font-bold text-[var(--color-primary)]">
        Access off-market land deals in the Las Vegas Valley
      </p>
      <p className="mt-1 text-sm text-slate-600">
        Join our private network of developers, brokers, and investors for early access to off-market land opportunities.
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Link
          href="/off-market-deals/"
          className="inline-block rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-600"
        >
          Join the Network
        </Link>
        <a
          href={`tel:${BUSINESS.phone}`}
          className="text-sm font-semibold text-[var(--color-primary)] hover:underline"
        >
          Or call {BUSINESS.phoneDisplay}
        </a>
      </div>
    </div>
  )
}
