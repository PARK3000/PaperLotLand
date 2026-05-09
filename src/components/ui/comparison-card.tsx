'use client'

import Image from 'next/image'
import Link from 'next/link'

const TRADITIONAL_CONS = [
  'Hefty commissions (5–6%)',
  'Long closing timelines (60–90 days)',
  'Risk of deal falling through',
  'Repairs and staging required',
  'Multiple showings & open houses',
]

const WBAVH_PROS = [
  ['ZERO', 'fees or commissions'],
  ['CLOSE', 'in as few as 7 days'],
  ['NO REPAIRS', 'or cleaning needed'],
  ['GUARANTEED', 'cash offer'],
  ['YOUR TIMELINE,', 'you pick the date'],
]

const CASH_BUYER_CONS = [
  'Low-ball offers (60–70% of value)',
  'Inflexible closing dates',
  'Risk of scams & shady contracts',
  'No local accountability',
  'Single take-it-or-leave-it offer',
]

function MinusIcon() {
  return (
    <svg className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM6.75 9.25a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z" clipRule="evenodd" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
    </svg>
  )
}

export function ComparisonCard() {
  return (
    <div className="my-10 grid items-stretch gap-4 sm:grid-cols-3">
      {/* Traditional Agent — left */}
      <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-slate-100 px-6 py-5">
          <h3 className="text-center text-base font-bold text-slate-600">Traditional Agent</h3>
        </div>
        <ul className="flex-1 space-y-3.5 p-6">
          {TRADITIONAL_CONS.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-slate-500">
              <MinusIcon />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* We Buy Any Vegas House — center, featured */}
      <div className="flex flex-col overflow-hidden rounded-2xl shadow-xl ring-2 ring-[var(--color-primary)] sm:-my-4">
        <div className="flex items-center justify-center bg-[var(--color-primary)] px-6 py-5">
          <Image
            src="/images/logo/logo-light.svg"
            alt="We Buy Any Vegas House"
            width={180}
            height={50}
            className="h-10 w-auto object-contain"
          />
        </div>
        <div className="flex flex-1 flex-col bg-white p-6">
          <ul className="flex-1 space-y-3.5">
            {WBAVH_PROS.map(([bold, rest], i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm">
                <CheckIcon />
                <span className="text-slate-700">
                  <strong className="font-bold text-[var(--color-primary)]">{bold}</strong>{' '}
                  {rest}
                </span>
              </li>
            ))}
          </ul>
          <Link
            href="/get-your-cash-today/"
            className="mt-6 block rounded-xl bg-[var(--color-primary)] py-3 text-center text-sm font-bold text-white transition-colors hover:bg-[var(--color-primary-700)]"
          >
            Get My Free Cash Offer →
          </Link>
        </div>
      </div>

      {/* National Cash Buyers — right */}
      <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-slate-100 px-6 py-5">
          <h3 className="text-center text-base font-bold text-slate-600">National Cash Buyers</h3>
        </div>
        <ul className="flex-1 space-y-3.5 p-6">
          {CASH_BUYER_CONS.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-slate-500">
              <MinusIcon />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
