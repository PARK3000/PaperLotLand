'use client'

import { useState, useCallback } from 'react'
import { Modal, ModalCloseButton } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { AddressAutocompleteInput } from '@/components/ui/address-autocomplete-input'
import { useTrackEvent } from '@/lib/analytics'
import { ANALYTICS_EVENTS } from '@/lib/analytics/events'
import { getPageType } from '@/lib/analytics/page-type'
import {
  buildCalendlyUrl,
  EVENT_LABELS,
  type CalendlyEventType,
} from '@/lib/calendly/build-url'
import {
  getGAClientId,
  getHandlID,
  getTrackingParams,
  getHandlCookieValues,
} from '@/lib/leads/tracking-params'

interface PreCalendlyModalProps {
  open: boolean
  onClose: () => void
}

type Step = 'pick' | 'form'

function splitName(full: string): { firstName: string; lastName: string } {
  const trimmed = full.trim()
  if (!trimmed) return { firstName: '', lastName: '' }
  const parts = trimmed.split(/\s+/)
  if (parts.length === 1) return { firstName: parts[0], lastName: '' }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
}

function generateSessionToken(): string {
  const ga = getGAClientId()
  if (ga) return `ga_${ga}`
  const handl = getHandlID()
  if (handl) return handl
  return crypto.randomUUID()
}

function isValidPhone(phone: string): boolean {
  return phone.replace(/\D/g, '').length >= 10
}

export function PreCalendlyModal({ open, onClose }: PreCalendlyModalProps) {
  const trackEvent = useTrackEvent()

  const [step, setStep] = useState<Step>('pick')
  const [eventType, setEventType] = useState<CalendlyEventType | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ name?: string; phone?: string; address?: string }>({})

  const reset = useCallback(() => {
    setStep('pick')
    setEventType(null)
    setName('')
    setPhone('')
    setAddress('')
    setErrors({})
    setSubmitting(false)
  }, [])

  const handleClose = useCallback(
    (reason: 'backdrop' | 'cancel' | 'submit') => {
      if (reason !== 'submit') {
        const pathname = typeof window !== 'undefined' ? window.location.pathname : ''
        trackEvent(ANALYTICS_EVENTS.CTA_CLICKED, {
          cta_id: 'pre-calendly-cancel',
          cta_text: `Pre-Calendly modal closed (${reason})`,
          page_type: getPageType(pathname),
          page_url: pathname,
        })
      }
      onClose()
      // Defer reset so close animation finishes
      setTimeout(reset, 250)
    },
    [trackEvent, onClose, reset],
  )

  const handlePickEvent = (et: CalendlyEventType) => {
    setEventType(et)
    setStep('form')
  }

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
    const pathname = window.location.pathname

    // Fire partial lead so n8n + Postgres get the contact even if user
    // abandons Calendly. Mirrors useLeadStream's address_submit payload.
    const payload = {
      sessionToken: generateSessionToken(),
      formId: 'pre-calendly-modal',
      formVariant: eventType,
      pageUrl: pathname,
      fields: {
        name: name.trim(),
        firstName,
        lastName,
        phone,
        address,
      },
      trigger: 'address_submit' as const,
      tracking: getTrackingParams(),
      handlCookies: getHandlCookieValues(),
    }

    try {
      // keepalive so the request survives the new-tab navigation
      await fetch('/api/leads/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      })
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[pre-calendly] partial lead send failed:', err)
      }
    }

    trackEvent(ANALYTICS_EVENTS.CTA_CLICKED, {
      cta_id: 'pre-calendly-submit',
      cta_text: `Continue to calendar — ${eventType}`,
      page_type: getPageType(pathname),
      page_url: pathname,
    })

    const url = buildCalendlyUrl(eventType, {
      name: name.trim(),
      phone,
      address,
    })
    window.open(url, '_blank', 'noopener,noreferrer')

    handleClose('submit')
  }

  return (
    <Modal
      isOpen={open}
      onClose={() => handleClose('backdrop')}
      maxWidth="md"
    >
      <div className="relative rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
        <ModalCloseButton onClick={() => handleClose('cancel')} />

        {step === 'pick' && (
          <div>
            <h2 className="text-2xl font-bold text-[var(--color-text)]">
              How would you like to meet?
            </h2>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              Pick an option — we&apos;ll grab a few quick details and skip you
              ahead to the calendar.
            </p>

            <div className="mt-6 flex flex-col gap-3">
              {(Object.keys(EVENT_LABELS) as CalendlyEventType[]).map((et) => (
                <button
                  key={et}
                  type="button"
                  onClick={() => handlePickEvent(et)}
                  className="flex w-full items-center justify-between gap-4 rounded-xl border-2 border-[var(--color-border)] bg-white px-5 py-4 text-left transition-all hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-50)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                >
                  <div>
                    <div className="font-semibold text-[var(--color-text)]">
                      {EVENT_LABELS[et]}
                    </div>
                    <div className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                      {et === 'phone'
                        ? 'A short call to discuss your property and offer.'
                        : 'We come see the property in person at a time that works for you.'}
                    </div>
                  </div>
                  <svg
                    className="h-5 w-5 shrink-0 text-[var(--color-primary)]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'form' && eventType && (
          <form onSubmit={handleSubmit} noValidate>
            <button
              type="button"
              onClick={() => setStep('pick')}
              className="mb-3 inline-flex items-center gap-1 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back
            </button>

            <h2 className="text-2xl font-bold text-[var(--color-text)]">
              Just a few quick details
            </h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              {EVENT_LABELS[eventType]}
            </p>

            <div className="mt-5 flex flex-col gap-4">
              <Input
                label="Full name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={errors.name}
                autoComplete="name"
                required
              />
              <Input
                label="Phone"
                name="phone"
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                error={errors.phone}
                autoComplete="tel"
                placeholder="(702) 555-0123"
                required
              />
              <AddressAutocompleteInput
                label="Property address"
                name="address"
                defaultValue={address}
                externalValue={address}
                onPlaceSelected={(formatted) => setAddress(formatted)}
                onChange={(e) => setAddress((e.target as HTMLInputElement).value)}
                error={errors.address}
                placeholder="Start typing your address..."
                required
              />
            </div>

            <Button
              type="submit"
              variant="accent"
              size="lg"
              fullWidth
              disabled={submitting}
              className="mt-6"
            >
              {submitting ? 'Opening calendar...' : 'Continue to calendar'}
            </Button>
          </form>
        )}
      </div>
    </Modal>
  )
}
