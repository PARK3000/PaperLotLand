import { Metadata } from 'next'
import Link from 'next/link'
import { BUSINESS } from '@/lib/constants'

export const metadata: Metadata = {
  title: "You're on the List | PaperLotLand",
  description: "Thank you for joining the PaperLotLand off-market network. We'll reach out when a matching parcel comes available.",
  robots: { index: false, follow: false },
}

export default function ThankYouPage() {
  return (
    <section className="flex min-h-[70vh] items-center justify-center bg-slate-50 py-20">
      <div className="mx-auto max-w-lg px-4 text-center">
        <div className="mb-6 text-6xl">✅</div>
        <h1 className="text-3xl font-bold text-[#1C3550] mb-4">You&apos;re on the List.</h1>
        <p className="text-lg text-slate-600 mb-4">
          We&apos;ve received your submission and added you to the PaperLotLand off-market network.
        </p>
        <p className="text-slate-500 mb-8">
          When a parcel matches your criteria, we&apos;ll reach out directly — before it goes anywhere else. In the meantime, if you have a deal or a question, call us at{' '}
          <a href={`tel:${BUSINESS.phone}`} className="text-[#C97D2E] font-semibold hover:underline">{BUSINESS.phoneDisplay}</a>.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/resources/"
            className="inline-flex items-center justify-center rounded-lg bg-[#1C3550] px-6 py-3 text-sm font-bold text-white hover:bg-[#122336] transition-colors"
          >
            Browse GIS Resources
          </Link>
          <Link
            href="/closed-sales/"
            className="inline-flex items-center justify-center rounded-lg border border-[#1C3550] px-6 py-3 text-sm font-semibold text-[#1C3550] hover:bg-[#1C3550] hover:text-white transition-colors"
          >
            View Closed Sales
          </Link>
        </div>
      </div>
    </section>
  )
}
