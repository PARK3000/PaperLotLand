'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BUSINESS } from '@/lib/constants'

const SLIDER_MIN = 50000
const SLIDER_MAX = 2000000
const SLIDER_STEP = 5000

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}

function formatNumber(n: number) {
  return new Intl.NumberFormat('en-US').format(n)
}

// Clark County, NV transfer tax: $2.55 per $500 of sale price
function calcTransferTax(price: number) {
  return Math.floor(price / 500) * 2.55
}

export function ClosingCostCalculator() {
  const [price, setPrice] = useState(300000)
  const [rawInput, setRawInput] = useState('300,000')
  const [commissionPct, setCommissionPct] = useState('6')
  const [closingCostsPct, setClosingCostsPct] = useState('2')

  const sliderPct = ((Math.min(Math.max(price, SLIDER_MIN), SLIDER_MAX) - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN)) * 100
  const bubbleLeft = `calc(${sliderPct}% + ${(0.5 - sliderPct / 100) * 20}px)`

  const commission = parseFloat(commissionPct) || 0
  const closingPct = parseFloat(closingCostsPct) || 0

  const agentCommission = price * (commission / 100)
  const transferTax = calcTransferTax(price)
  const titleEscrow = Math.max(0, price * (closingPct / 100) - transferTax)
  const totalCost = agentCommission + transferTax + titleEscrow
  const totalPct = price > 0 ? ((totalCost / price) * 100).toFixed(1) : '0.0'

  // Slider → update price + raw input
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value)
    setPrice(v)
    setRawInput(formatNumber(v))
  }

  // Text input → update price + keep slider in sync
  const handlePriceInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '')
    setRawInput(raw ? formatNumber(parseInt(raw)) : '')
    const parsed = parseInt(raw) || 0
    setPrice(parsed)
  }

  return (
    <div className="my-8 overflow-hidden rounded-xl border border-slate-200 shadow-sm">
      {/* Header */}
      <div className="bg-[var(--color-primary)] px-6 py-4">
        <h3 className="text-lg font-bold text-white">Home Sale Closing Cost Calculator</h3>
        <p className="mt-0.5 text-sm text-white/80">See what a traditional sale really costs you</p>
      </div>

      {/* Slider section */}
      <div className="border-b border-slate-100 bg-white px-6 pb-8 pt-6">
        <label className="block text-sm font-semibold text-slate-700">
          Select Your Home Sale Price:
        </label>
        <div className="relative mt-8">
          {/* Floating bubble */}
          <div
            className="pointer-events-none absolute -top-9 -translate-x-1/2 rounded-lg border border-[var(--color-primary)] bg-white px-3 py-1.5 text-sm font-bold text-[#1a2e4a] shadow-sm"
            style={{ left: bubbleLeft }}
          >
            {formatCurrency(price)}
            <span
              className="absolute left-1/2 top-full -translate-x-1/2 border-[5px] border-transparent border-t-[var(--color-primary)]"
              aria-hidden
            />
          </div>

          <input
            type="range"
            min={SLIDER_MIN}
            max={SLIDER_MAX}
            step={SLIDER_STEP}
            value={Math.min(Math.max(price, SLIDER_MIN), SLIDER_MAX)}
            onChange={handleSliderChange}
            aria-label="Home sale price"
            className="cash-slider w-full cursor-pointer appearance-none rounded-full"
            style={{
              height: '4px',
              background: `linear-gradient(90deg, var(--color-primary) ${sliderPct}%, #e2e8f0 ${sliderPct}%)`,
            }}
          />
          <div className="mt-2 flex justify-between text-xs text-slate-400">
            <span>$50K</span>
            <span>$2M</span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2">
        {/* Left: Inputs */}
        <div className="space-y-5 bg-white p-6">
          {/* Home Price text override */}
          <div>
            <label className="block text-sm font-semibold text-slate-700">Home Sale Price</label>
            <p className="mt-0.5 text-xs text-slate-400">Or type an exact amount</p>
            <div className="mt-1.5 flex items-center overflow-hidden rounded-lg border border-slate-300 focus-within:border-[var(--color-primary)] focus-within:ring-1 focus-within:ring-[var(--color-primary)]">
              <span className="border-r border-slate-300 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-500">$</span>
              <input
                type="text"
                inputMode="numeric"
                value={rawInput}
                onChange={handlePriceInput}
                className="flex-1 bg-transparent px-3 py-2.5 text-sm text-slate-800 outline-none"
                placeholder="300,000"
              />
            </div>
          </div>

          {/* Realtor Commission */}
          <div>
            <label className="block text-sm font-semibold text-slate-700">Realtor Commission</label>
            <p className="mt-0.5 text-xs text-slate-500">Standard in Las Vegas: 5–6%</p>
            <div className="mt-1.5 flex items-center overflow-hidden rounded-lg border border-slate-300 focus-within:border-[var(--color-primary)] focus-within:ring-1 focus-within:ring-[var(--color-primary)]">
              <input
                type="number"
                min="0"
                max="10"
                step="0.5"
                value={commissionPct}
                onChange={(e) => setCommissionPct(e.target.value)}
                className="flex-1 bg-transparent px-3 py-2.5 text-sm text-slate-800 outline-none"
              />
              <span className="border-l border-slate-300 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-500">%</span>
            </div>
          </div>

          {/* Closing Costs */}
          <div>
            <label className="block text-sm font-semibold text-slate-700">Seller Closing Costs</label>
            <p className="mt-0.5 text-xs text-slate-500">Includes transfer tax + title & escrow fees</p>
            <div className="mt-1.5 flex items-center overflow-hidden rounded-lg border border-slate-300 focus-within:border-[var(--color-primary)] focus-within:ring-1 focus-within:ring-[var(--color-primary)]">
              <input
                type="number"
                min="0"
                max="10"
                step="0.5"
                value={closingCostsPct}
                onChange={(e) => setClosingCostsPct(e.target.value)}
                className="flex-1 bg-transparent px-3 py-2.5 text-sm text-slate-800 outline-none"
              />
              <span className="border-l border-slate-300 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-500">%</span>
            </div>
          </div>
        </div>

        {/* Right: Results */}
        <div className="bg-slate-50 p-6">
          <p className="text-sm font-semibold text-slate-600">Your estimated closing cost is:</p>
          <p className="mt-1 text-4xl font-bold text-emerald-600">{formatCurrency(totalCost)}</p>
          <p className="mt-1 text-sm text-slate-500">
            Closing costs would be <strong>{totalPct}%</strong> of your sale price.
          </p>

          {/* Breakdown */}
          <div className="mt-4 space-y-2 rounded-lg border border-slate-200 bg-white p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Real Estate Agent Commissions:</span>
              <span className="font-bold text-slate-800">{formatCurrency(agentCommission)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Clark County Transfer Tax:</span>
              <span className="font-bold text-slate-800">{formatCurrency(transferTax)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-2">
              <span className="text-slate-600">Title &amp; Escrow Fees:</span>
              <span className="font-bold text-slate-800">{formatCurrency(titleEscrow)}</span>
            </div>
          </div>

          {/* Save callout */}
          <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4 text-center">
            <p className="text-base font-bold text-amber-700">
              Sell to us and save {formatCurrency(totalCost)} on closing costs!
            </p>
            <p className="mt-1 text-xs text-amber-600">
              Our cash offer covers all seller closing fees including agent commissions, transfer tax, and title &amp; escrow fees.
            </p>
            <Link
              href="/get-your-cash-today/"
              className="mt-3 inline-block rounded-lg bg-emerald-500 px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-emerald-600"
            >
              Get My Free Cash Offer
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
