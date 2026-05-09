import Link from 'next/link'
import { BUSINESS } from '@/lib/constants'

export function MidArticleCta() {
  return (
    <div className="my-8 rounded-xl border border-slate-200 bg-slate-50 p-6">
      <p className="text-lg font-bold text-[var(--color-primary)]">
        💰 Sell your Las Vegas home for cash — fast and hassle-free
      </p>
      <p className="mt-1 text-sm text-slate-600">
        No repairs. No agent fees. Close in as little as 7 days on your schedule.
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Link
          href="/get-your-cash-today/"
          className="inline-block rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-600"
        >
          Get Your Cash Offer
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
