import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Sellers | Admin' }

export default function SellersPage() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Sellers</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage land seller leads and postcard mail campaigns via the PostcardMailer dashboard.
        </p>
      </div>

      <Link
        href="https://offers.paperlotland.com/dashboard"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2.5 px-5 py-3 bg-[#1C3550] text-white text-sm font-semibold rounded-lg hover:bg-[#152840] transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
        </svg>
        Open PostcardMailer Dashboard
      </Link>
    </div>
  )
}
