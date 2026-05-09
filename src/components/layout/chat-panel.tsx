'use client'

/**
 * Sliding chat panel with 3 tabs: Chat | Book | Call.
 * Slides up from bottom on mobile, in from right on desktop.
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import Image from 'next/image'
import { ChatInterface } from './chat-interface'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { AddressAutocompleteInput } from '@/components/ui/address-autocomplete-input'
import {
  buildCalendlyUrl,
  EVENT_LABELS,
  type CalendlyEventType,
} from '@/lib/calendly/build-url'
import {
  getTrackingParams,
  getHandlCookieValues,
  getGAClientId,
  getHandlID,
} from '@/lib/leads/tracking-params'
import { useTrackEvent } from '@/lib/analytics'
import { ANALYTICS_EVENTS } from '@/lib/analytics/events'

export type PanelTab = 'chat' | 'book' | 'call'

interface ChatPanelProps {
  open: boolean
  initialTab?: PanelTab
  onClose: () => void
}

function generateSessionToken(): string {
  const ga = getGAClientId()
  if (ga) return `ga_${ga}`
  const handl = getHandlID()
  if (handl) return handl
  return crypto.randomUUID()
}

function splitName(full: string): { firstName: string; lastName: string } {
  const parts = full.trim().split(/\s+/)
  return { firstName: parts[0] ?? '', lastName: parts.slice(1).join(' ') }
}

function isValidPhone(p: string) {
  return p.replace(/\D/g, '').length >= 10
}

// ── Book tab (inline pre-calendly flow) ────────────────────────────────────

type BookStep = 'pick' | 'form'

function BookTab() {
  const [step, setStep] = useState<BookStep>('pick')
  const [eventType, setEventType] = useState<CalendlyEventType | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ name?: string; phone?: string; address?: string }>({})
  const trackEvent = useTrackEvent()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!eventType) return

    const nextErrors: typeof errors = {}
    if (!name.trim()) nextErrors.name = 'Required'
    if (!isValidPhone(phone)) nextErrors.phone = 'Enter a 10-digit phone'
    if (!address.trim()) nextErrors.address = 'Required'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    const { firstName, lastName } = splitName(name)
    const token = generateSessionToken()

    try {
      await fetch('/api/leads/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionToken: token,
          formId: 'chat-widget-book-tab',
          formVariant: eventType,
          pageUrl: window.location.pathname,
          trigger: 'address_submit',
          fields: { name: name.trim(), firstName, lastName, phone, address },
          tracking: getTrackingParams(),
          handlCookies: getHandlCookieValues(),
        }),
        keepalive: true,
      })
    } catch { /* fail silently */ }

    trackEvent(ANALYTICS_EVENTS.CTA_CLICKED, {
      cta_id: 'chat-widget-book-submit',
      cta_text: `Book tab continue — ${eventType}`,
      page_url: window.location.pathname,
    })

    const url = buildCalendlyUrl(eventType, { name: name.trim(), phone, address })
    window.open(url, '_blank', 'noopener,noreferrer')
    setSubmitting(false)
  }

  if (step === 'pick') {
    return (
      <div className="flex-1 overflow-y-auto p-5">
        <h3 className="text-base font-bold text-[var(--color-text)]">How would you like to meet?</h3>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">Pick an option and we&apos;ll get you on the calendar.</p>
        <div className="mt-4 flex flex-col gap-3">
          {(Object.keys(EVENT_LABELS) as CalendlyEventType[]).map((et) => (
            <button
              key={et}
              type="button"
              onClick={() => { setEventType(et); setStep('form') }}
              className="flex w-full items-center justify-between gap-4 rounded-xl border-2 border-[var(--color-border)] bg-white px-4 py-3.5 text-left transition hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-50)] focus:outline-none"
            >
              <div>
                <div className="font-semibold text-sm text-[var(--color-text)]">{EVENT_LABELS[et]}</div>
                <div className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                  {et === 'phone' ? 'A short call to discuss your land needs and network access.' : 'We meet in person to discuss your land deal at your convenience.'}
                </div>
              </div>
              <svg className="h-4 w-4 shrink-0 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-5">
      <button
        type="button"
        onClick={() => setStep('pick')}
        className="mb-3 inline-flex items-center gap-1 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>
      <h3 className="text-base font-bold text-[var(--color-text)]">Just a few quick details</h3>
      <p className="mt-1 text-sm text-[var(--color-text-muted)]">{eventType ? EVENT_LABELS[eventType] : ''}</p>
      <form onSubmit={handleSubmit} noValidate className="mt-4 flex flex-col gap-3.5">
        <Input label="Full name" name="name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} autoComplete="name" required />
        <Input label="Phone" name="phone" type="tel" inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value)} error={errors.phone} autoComplete="tel" placeholder="(702) 555-0123" required />
        <AddressAutocompleteInput
          label="Property address"
          name="address"
          defaultValue={address}
          externalValue={address}
          onPlaceSelected={(formatted) => setAddress(formatted)}
          onChange={(e) => setAddress((e.target as HTMLInputElement).value)}
          error={errors.address}
          placeholder="Start typing your address…"
          required
        />
        <Button type="submit" variant="accent" size="lg" fullWidth disabled={submitting} className="mt-1">
          {submitting ? 'Opening calendar…' : 'Continue to calendar'}
        </Button>
      </form>
    </div>
  )
}

// ── Call tab ────────────────────────────────────────────────────────────────

function CallTab() {
  const trackEvent = useTrackEvent()
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary-50)]">
        <svg className="h-8 w-8 text-[var(--color-primary)]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
        </svg>
      </div>
      <div>
        <p className="text-sm text-[var(--color-text-muted)]">Call us directly — we pick up fast.</p>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">Mon–Fri 8am–7pm · Sat 9am–5pm (PT)</p>
      </div>
      <a
        href="tel:+17022139800"
        onClick={() => trackEvent(ANALYTICS_EVENTS.CTA_CLICKED, { cta_id: 'chat-widget-call', cta_text: 'Call (702) 213-9800', page_url: window.location.pathname })}
        className="flex w-full max-w-xs items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] px-6 py-3.5 text-base font-bold text-white shadow-sm transition hover:bg-[var(--color-accent-dark)]"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
        </svg>
        (702) 213-9800
      </a>
    </div>
  )
}

// ── Main panel ──────────────────────────────────────────────────────────────

const TAB_CONFIG: { id: PanelTab; label: string; icon: React.ReactNode }[] = [
  {
    id: 'chat',
    label: 'Chat',
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    id: 'book',
    label: 'Schedule a Call',
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 'call',
    label: 'Call',
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
      </svg>
    ),
  },
]

export function ChatPanel({ open, initialTab = 'chat', onClose }: ChatPanelProps) {
  const [activeTab, setActiveTab] = useState<PanelTab>(initialTab)
  const [sessionToken] = useState(() => generateSessionToken())
  const panelRef = useRef<HTMLDivElement>(null)

  // Sync tab when opened with a specific tab
  useEffect(() => {
    if (open) setActiveTab(initialTab)
  }, [open, initialTab])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Scroll lock on mobile
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  const handleSchedule = useCallback(() => setActiveTab('book'), [])
  const handleCall = useCallback(() => setActiveTab('call'), [])

  return (
    <>
      {/* Backdrop (desktop only) */}
      {open && (
        <div
          className="fixed inset-0 z-40 hidden bg-black/20 lg:block"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Panel */}
      <div
        ref={panelRef}
        className={[
          'fixed z-50 flex flex-col bg-white shadow-2xl transition-transform duration-300 ease-out',
          // Mobile: slides up from bottom, full width, 72vh
          'bottom-0 left-0 right-0 h-[72vh] rounded-t-2xl',
          // Desktop: slides in from right, fixed width, sits above mobile CTA bar area
          'lg:bottom-[80px] lg:left-auto lg:right-4 lg:top-auto lg:h-[520px] lg:w-[360px] lg:rounded-2xl',
          open
            ? 'translate-y-0 lg:translate-y-0'
            : 'translate-y-full lg:translate-y-[120%]',
        ].join(' ')}
        role="dialog"
        aria-modal="true"
        aria-label="Chat with Casey"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center gap-3 rounded-t-2xl bg-[var(--color-primary)] px-4 py-3 lg:rounded-t-2xl">
          <Image
            src="/images/team/parker-gibbons.jpg"
            alt="Jamie Kirk"
            width={36}
            height={36}
            className="h-9 w-9 rounded-full object-cover ring-2 ring-white/40"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold leading-tight text-white">Parker Gibbons</p>
            <p className="truncate text-xs text-white/70">PaperLotLand</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close chat"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex shrink-0 border-b border-slate-200 bg-white">
          {TAB_CONFIG.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={[
                'flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition',
                activeTab === tab.id
                  ? 'border-b-2 border-[var(--color-primary)] text-[var(--color-primary)]'
                  : 'text-slate-500 hover:text-slate-700',
              ].join(' ')}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex min-h-0 flex-1 flex-col">
          {activeTab === 'chat' && (
            <ChatInterface
              sessionToken={sessionToken}
              panelOpen={open}
              onSchedule={handleSchedule}
              onCall={handleCall}
            />
          )}
          {activeTab === 'book' && <BookTab />}
          {activeTab === 'call' && <CallTab />}
        </div>
      </div>
    </>
  )
}
