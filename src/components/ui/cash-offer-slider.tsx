'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BUSINESS } from '@/lib/constants'

function formatCurrencyFull(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}

const MIN = 50000
const MAX = 2000000
const STEP = 5000

const CASH_BENEFITS = [
  'No agent commissions',
  'No repairs required',
  'Close in as little as 7 days',
  'No closing costs to you',
]

const MLS_NOTES = [
  'Flexible closing timeline',
  'Maximum market exposure',
]

export function CashOfferSlider() {
  const [value, setValue] = useState(400000)

  const pct = ((value - MIN) / (MAX - MIN)) * 100
  // Compensate for thumb width (20px) so bubble tracks thumb accurately
  const bubbleLeft = `calc(${pct}% + ${(0.5 - pct / 100) * 20}px)`

  const cashLow = Math.round(value * 0.75)
  const cashHigh = Math.round(value * 0.82)

  return (
    <div className="my-8 overflow-hidden rounded-2xl border border-slate-200 shadow-md">

      {/* ── Header ── */}
      <div className="bg-white px-6 pt-8 pb-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)]">
          {BUSINESS.name}
        </p>
        <h3 className="mt-1 text-2xl font-bold text-[#1a2e4a]">Estimate Your Cash Offer</h3>
        <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">
          See how a direct cash sale compares to listing on the MLS. Slide to your home&rsquo;s estimated value.
        </p>
      </div>

      {/* ── Slider ── */}
      <div className="bg-white px-8 pb-8 pt-6">
        <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
          <span>Select Your Home Value:</span>
        </div>

        {/* Track + bubble wrapper */}
        <div className="relative mt-8">
          {/* Floating bubble */}
          <div
            className="pointer-events-none absolute -top-9 -translate-x-1/2 rounded-lg border border-[var(--color-primary)] bg-white px-3 py-1.5 text-sm font-bold text-[#1a2e4a] shadow-sm"
            style={{ left: bubbleLeft }}
          >
            {formatCurrencyFull(value)}
            {/* Caret */}
            <span
              className="absolute left-1/2 top-full -translate-x-1/2 border-[5px] border-transparent border-t-[var(--color-primary)]"
              aria-hidden
            />
          </div>

          {/* Range input */}
          <input
            type="range"
            min={MIN}
            max={MAX}
            step={STEP}
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            aria-label="Home value"
            className="cash-slider w-full cursor-pointer appearance-none rounded-full"
            style={{
              height: '4px',
              background: `linear-gradient(90deg, var(--color-primary) ${pct}%, #e2e8f0 ${pct}%)`,
            }}
          />

          <div className="mt-2 flex justify-between text-xs text-slate-400">
            <span>$50K</span>
            <span>$2M</span>
          </div>
        </div>
      </div>

      {/* ── Comparison cards ── */}
      <div className="grid gap-4 px-6 pb-6 sm:grid-cols-2">

        {/* Left — cash offer */}
        <div className="overflow-hidden rounded-xl shadow-[0_2px_12px_rgba(11,90,165,0.2)]">
          <div className="bg-[var(--color-primary)] px-4 py-3 text-center">
            <p className="text-sm font-bold text-white">{BUSINESS.name}</p>
            <p className="mt-0.5 text-xs text-white/70">Your Offer Est.</p>
          </div>
          <div
            className="px-4 pb-6 pt-8 text-center"
            style={{ background: 'linear-gradient(183deg, #C6E2FB -43%, #FFFFFF 97%)' }}
          >
            <p className="text-2xl font-bold text-[#1a2e4a] md:text-3xl">
              {formatCurrencyFull(cashLow)}&nbsp;–&nbsp;{formatCurrencyFull(cashHigh)}
            </p>
            <p className="mt-1 text-sm text-slate-500">75%&ndash;82% of your home value</p>

            <ul className="mt-5 space-y-2">
              {CASH_BENEFITS.map((b) => (
                <li key={b} className="flex items-center justify-center gap-2 text-sm font-medium text-[var(--color-primary)]">
                  <svg className="h-4 w-4 shrink-0 text-emerald-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                  {b}
                </li>
              ))}
            </ul>

            <p className="mt-4 text-xs text-slate-400">No upfront fees</p>
          </div>
        </div>

        {/* Right — traditional MLS */}
        <div className="overflow-hidden rounded-xl shadow-[0_2px_12px_rgba(11,90,165,0.2)]">
          <div className="bg-[#3b5ea6] px-4 py-3 text-center">
            <p className="text-sm font-bold text-white">Traditional MLS Listing</p>
            <p className="mt-0.5 text-xs text-white/70">Your Offer Est.</p>
          </div>
          <div
            className="px-4 pb-6 pt-8 text-center"
            style={{ background: 'linear-gradient(183deg, #C6E2FB -43%, #FFFFFF 97%)' }}
          >
            <p className="text-2xl font-bold text-[#1a2e4a] md:text-3xl">
              {formatCurrencyFull(value)}
            </p>
            <p className="mt-1 text-sm text-slate-500">Up to 100% of your home value</p>

            <ul className="mt-5 space-y-2">
              {MLS_NOTES.map((n) => (
                <li key={n} className="flex items-center justify-center gap-2 text-sm font-medium text-[#3b5ea6]">
                  <svg className="h-4 w-4 shrink-0 text-emerald-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                  {n}
                </li>
              ))}
            </ul>

            <p className="mt-4 text-xs text-slate-400">
              After 6% agent commission + 2% closing costs + repairs
            </p>
          </div>
        </div>
      </div>

      {/* ── Bottom CTA ── */}
      <div className="border-t border-slate-100 bg-slate-50 px-6 py-4">
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <p className="text-sm font-semibold text-slate-700">Get Your Cash Offer</p>
          <Link
            href="/get-your-cash-today/"
            className="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:opacity-90 sm:ml-auto"
          >
            Get Cash Offer »
          </Link>
          <a
            href={`tel:${BUSINESS.phone}`}
            className="text-sm font-medium text-[var(--color-primary)] hover:underline"
          >
            or call {BUSINESS.phoneDisplay}
          </a>
        </div>
      </div>
    </div>
  )
}
