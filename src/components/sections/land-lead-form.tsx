'use client'

import { useState } from 'react'
import { ROLES, INTEREST_OPTIONS, LOT_TYPES, BUDGET_RANGES } from '@/lib/constants'

interface Props {
  variant?: 'quick' | 'standard' | 'full'
  heading?: string
}

export function LandLeadForm({ variant = 'standard', heading }: Props) {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fields, setFields] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
    interest: '',
    lotType: '',
    budget: '',
    message: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const formId = variant === 'full' ? 'land-full' : variant === 'standard' ? 'land-standard' : 'land-quick'
      await fetch('/api/leads/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: fields.firstName,
          lastName: fields.lastName,
          email: fields.email,
          phone: fields.phone || '',
          address: `Land Inquiry — ${fields.lotType || 'Any'} | Budget: ${fields.budget || 'Not specified'}`,
          role: fields.role,
          interest: fields.interest,
          lotType: fields.lotType,
          budget: fields.budget,
          message: fields.message,
          formId,
          formVariant: variant,
          pageUrl: typeof window !== 'undefined' ? window.location.href : '',
        }),
      })
      setSubmitted(true)
    } catch {
      // Still show success to not block user
      setSubmitted(true)
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-lg">
        <div className="mb-4 text-4xl">✅</div>
        <h3 className="text-xl font-bold text-[#1C3550] mb-2">You&apos;re on the list.</h3>
        <p className="text-slate-600">
          We&apos;ll reach out when a parcel matches your criteria. If you have a deal to share, call us at{' '}
          <a href="tel:7024656111" className="text-[#C97D2E] font-semibold">(702) 465-6111</a>.
        </p>
      </div>
    )
  }

  const inputClass =
    'w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#C97D2E] focus:outline-none focus:ring-2 focus:ring-[#C97D2E]/20'
  const labelClass = 'block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1'

  return (
    <div className="rounded-2xl bg-white p-6 shadow-xl">
      {heading && <h3 className="text-xl font-bold text-[#1C3550] mb-5">{heading}</h3>}
      {variant === 'quick' && !heading && (
        <h3 className="text-lg font-bold text-[#1C3550] mb-4">Get Off-Market Alerts</h3>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name — always */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass} htmlFor="firstName">First Name</label>
            <input id="firstName" name="firstName" required className={inputClass} placeholder="First" value={fields.firstName} onChange={handleChange} />
          </div>
          <div>
            <label className={labelClass} htmlFor="lastName">Last Name</label>
            <input id="lastName" name="lastName" required className={inputClass} placeholder="Last" value={fields.lastName} onChange={handleChange} />
          </div>
        </div>

        {/* Email — always */}
        <div>
          <label className={labelClass} htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required className={inputClass} placeholder="you@company.com" value={fields.email} onChange={handleChange} />
        </div>

        {/* Phone — standard + full */}
        {(variant === 'standard' || variant === 'full') && (
          <div>
            <label className={labelClass} htmlFor="phone">Phone</label>
            <input id="phone" name="phone" type="tel" className={inputClass} placeholder="(702) 555-0000" value={fields.phone} onChange={handleChange} />
          </div>
        )}

        {/* Role — standard + full */}
        {(variant === 'standard' || variant === 'full') && (
          <div>
            <label className={labelClass} htmlFor="role">Your Role</label>
            <select id="role" name="role" className={inputClass} value={fields.role} onChange={handleChange}>
              <option value="">Select…</option>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* Interest + Lot Type — full only */}
        {variant === 'full' && (
          <>
            <div>
              <label className={labelClass} htmlFor="interest">Looking to…</label>
              <select id="interest" name="interest" className={inputClass} value={fields.interest} onChange={handleChange}>
                <option value="">Select…</option>
                {INTEREST_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="lotType">Property Type</label>
              <select id="lotType" name="lotType" className={inputClass} value={fields.lotType} onChange={handleChange}>
                <option value="">Select…</option>
                {LOT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="budget">Budget Range</label>
              <select id="budget" name="budget" className={inputClass} value={fields.budget} onChange={handleChange}>
                <option value="">Select…</option>
                {BUDGET_RANGES.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="message">Notes / Details <span className="font-normal normal-case">(optional)</span></label>
              <textarea id="message" name="message" rows={3} className={inputClass} placeholder="Location preference, timeline, specific criteria…" value={fields.message} onChange={handleChange} />
            </div>
          </>
        )}
        {/* submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[#C97D2E] py-3 text-sm font-bold text-white hover:bg-[#b86d24] transition-colors disabled:opacity-60"
        >
          {loading ? 'Submitting…' : variant === 'quick' ? 'Join the Network →' : 'Join the Network →'}
        </button>

        <p className="text-center text-[11px] text-slate-400">
          No spam. No MLS listings. Off-market deals only.
        </p>
      </form>
    </div>
  )
}
