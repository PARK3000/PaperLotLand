'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { AddressAutocompleteInput } from '@/components/ui/address-autocomplete-input'
import { useLeadStream } from '@/lib/leads/use-lead-stream'
import {
  useFormAnalytics,
  pushToDataLayer,
  emulateGravityFormStep,
  emulateGravityFormSubmit,
  emulateGravityFormConfirmation,
} from '@/lib/analytics'
import { useUrlPrefill } from '@/lib/hooks/use-url-prefill'
import { getTrackingParams, getHandlCookieValues } from '@/lib/leads/tracking-params'

const HOW_DID_YOU_HEAR_OPTIONS = [
  'Google Search',
  'Received A Letter',
  'Saw Us On TV',
  'Word Of Mouth',
  'Other',
] as const

interface HeroFormProps {
  variant: 'redirect' | 'inline-form'
}

export function HeroForm({ variant }: HeroFormProps) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)

  const [address, setAddress] = useState('')
  const [error, setError] = useState('')

  // Inline-form state (only used when variant="inline-form")
  const [step, setStep] = useState<1 | 2>(1)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [howDidYouHear, setHowDidYouHear] = useState('')

  const formId = variant === 'inline-form' ? 'hero-multistep' : 'hero-address'
  const formVariant = variant === 'inline-form' ? 'multistep' : 'hero'
  const leadStream = useLeadStream(formId, formVariant)
  const prefill = useUrlPrefill()

  const {
    trackFormView,
    trackFormStart,
    trackFieldComplete,
    trackValidationError,
    trackStepCompleted,
    trackSubmit,
    trackSuccess,
    trackError,
  } = useFormAnalytics(formId, formVariant)

  useEffect(() => {
    trackFormView()
  }, [trackFormView])

  // Populate form from URL params (email campaigns + direct mail QR codes)
  useEffect(() => {
    if (!prefill.ready) return
    if (prefill.address) {
      setAddress(prefill.address)
      // Use seedField so URL-prefilled address doesn't count as user input —
      // prevents an address-only partial from firing before phone/email is entered
      leadStream.seedField('address', prefill.address)
    }
    if (prefill.firstName || prefill.lastName) setName([prefill.firstName, prefill.lastName].filter(Boolean).join(' '))
    if (prefill.email) setEmail(prefill.email)
    if (prefill.phone) setPhone(prefill.phone)
    // Auto-advance to step 2 when we have contact info (email campaigns + direct mail)
    if (variant === 'inline-form' && prefill.address && (prefill.firstName || prefill.email || prefill.phone)) {
      setStep(2)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill.ready])

  // Handle browser back button: step 2 → step 1 instead of leaving page (inline-form only)
  useEffect(() => {
    if (variant !== 'inline-form') return
    const handlePopState = () => {
      if (step === 2 && !window.location.hash) {
        setStep(1)
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [step, variant])

  // Clean up hash on step 1 (inline-form only)
  useEffect(() => {
    if (variant !== 'inline-form') return
    if (window.location.hash === '#contact-info' && step === 1) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
    }
  }, [step, variant])

  // ── Redirect variant: address submit redirects to /get-your-cash-today/ ──
  const handleRedirectSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!address || address.trim().length < 5) {
      setError('Please enter a valid address')
      trackValidationError('address', 'too_short')
      return
    }

    leadStream.onAddressSubmit()

    pushToDataLayer({
      event: 'partial_lead',
      form_id: formId,
      form_step: 1,
      address: address,
    })
    emulateGravityFormStep(formId, 'address_submit')
    trackFieldComplete('address', true)
    trackStepCompleted(1, 2)

    const params = new URLSearchParams({ address })
    if (prefill.firstName) params.set('first_name', prefill.firstName)
    if (prefill.lastName) params.set('last_name', prefill.lastName)
    if (prefill.phone) params.set('phone', prefill.phone)
    if (prefill.email) params.set('email', prefill.email)

    leadStream.cancel()
    router.push(`/get-your-cash-today/?${params.toString()}`)
  }

  // ── Inline-form variant: step 1 → expand to step 2 on same page ──
  const handleInlineStep1 = (e: React.FormEvent) => {
    e.preventDefault()

    if (!address || address.trim().length < 5) {
      setErrors({ address: 'Please enter a valid address' })
      trackValidationError('address', 'too_short')
      return
    }

    leadStream.onAddressSubmit()

    pushToDataLayer({
      event: 'partial_lead',
      form_id: formId,
      form_step: 1,
      address: address,
    })
    emulateGravityFormStep(formId, 'address_submit')
    trackFieldComplete('address', true)
    trackStepCompleted(1, 2)

    // Virtual pageview for analytics
    window.history.pushState(null, '', '#contact-info')
    pushToDataLayer({
      event: 'page_view',
      page_location: window.location.href,
      page_title: document.title + ' — Contact Info',
      virtual_page: true,
      form_step: 2,
    })

    setErrors({})
    setStep(2)
  }

  // ── Inline-form variant: step 2 full form submit ──
  const handleInlineStep2 = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    leadStream.cancel()
    setSubmitError(null)
    const formData = new FormData(e.currentTarget)

    // name/phone/email come from controlled state
    const newErrors: Record<string, string> = {}

    if (!name || name.trim().length < 2) {
      newErrors.name = 'Please enter your name'
      trackValidationError('name', 'too_short')
    }
    if (!phone || !/^\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/.test(phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number'
      trackValidationError('phone', 'invalid_format')
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email'
      trackValidationError('email', 'invalid_format')
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)
    trackSubmit()

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          address,
          phone,
          email,
          howDidYouHear: howDidYouHear || undefined,
          sessionToken: leadStream.getSessionToken() || undefined,
          formId,
          formVariant: 'multistep',
          pageUrl: typeof window !== 'undefined' ? window.location.href : '',
          tracking: getTrackingParams(),
          handlCookies: getHandlCookieValues(),
          _hp: formData.get('website') || '',
        }),
      })

      const result = await response.json()

      if (result.success) {
        trackSuccess(result.leadId, { email, phone, name })

        emulateGravityFormSubmit(formId, formRef.current)
        emulateGravityFormStep(formId, 'full_submit')
        emulateGravityFormConfirmation(formId)

        const nameParts = name.trim().split(/\s+/)
        sessionStorage.setItem('leadData', JSON.stringify({
          formId,
          leadId: result.leadId,
          email: email || undefined,
          phone: phone || undefined,
          firstName: nameParts[0] || undefined,
          lastName: nameParts.slice(1).join(' ') || undefined,
          address: address || undefined,
        }))

        router.push('/thank-you/')
      } else {
        trackError('api_error', result.error)
        setSubmitError(result.error || 'An error occurred. Please try again.')
      }
    } catch (err) {
      trackError('network_error', err instanceof Error ? err.message : 'Unknown error')
      setSubmitError('Unable to submit. Please try again or call us directly.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Render: Address input (step 1, shared by both variants) ──
  const renderAddressForm = (onSubmit: (e: React.FormEvent) => void) => (
    <form onSubmit={onSubmit}>
      <div className="relative flex items-center overflow-visible rounded-xl bg-white p-1 shadow-lg">
        {/* Label wraps the input column (NOT the submit button) so clicks on the
            white pill chrome focus the input — eliminates the dead-click dead zone.
            Empty label has no text content; AddressAutocompleteInput owns its own labeling.
            self-stretch + flex items-center makes the label fill the pill's full height
            (input is shorter than the submit button) so the strips above/below the input
            also focus the input rather than dying on the outer pill div. */}
        <label
          htmlFor="hero-address"
          className="flex min-w-0 flex-1 cursor-text items-center self-stretch"
        >
          <AddressAutocompleteInput
            id="hero-address"
            name="address"
            placeholder="Enter Your Home Address"
            variant="bare"
            className="rounded-none"
            externalValue={prefill.address}
            onPlaceSelected={(addr) => {
              setAddress(addr)
              leadStream.onAddressSelected(addr)
            }}
            onBlur={(e) => {
              if (e.target.value) {
                setAddress(e.target.value)
                leadStream.updateField('address', e.target.value)
              }
            }}
            onChange={(e) => {
              setAddress(e.target.value)
            }}
            onFocus={() => trackFormStart('address')}
          />
        </label>
        <button
          type="submit"
          className="whitespace-nowrap rounded-lg bg-[var(--color-accent)] px-7 py-3.5 font-semibold text-white transition-all hover:bg-[var(--color-accent-dark)] shadow-[0_4px_24px_rgba(200,72,72,0.40),0_2px_8px_rgba(200,72,72,0.25)] hover:shadow-[0_6px_32px_rgba(200,72,72,0.55),0_3px_12px_rgba(200,72,72,0.35)]"
        >
          See what we&apos;d pay →
        </button>
      </div>
      {(error || errors.address) && (
        <p className="mt-2 text-sm text-red-300">{error || errors.address}</p>
      )}
    </form>
  )

  // ── Render: Full contact form (step 2, inline-form variant only) ──
  const renderStep2Form = () => (
    <form
      ref={formRef}
      onSubmit={handleInlineStep2}
      className="animate-fade-in"
    >
      {/* Honeypot */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', opacity: 0 }}>
        <label htmlFor="hero-website">Website</label>
        <input type="text" id="hero-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="space-y-3">
        {/* Name field */}
        <div>
          <input
            name="name"
            type="text"
            placeholder="Full Name *"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border-0 bg-white px-4 py-3.5 text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50"
            onFocus={() => trackFormStart('name')}
            onBlur={(e) => {
              trackFieldComplete('name', !!e.target.value)
              leadStream.updateField('name', e.target.value)
            }}
          />
          {errors.name && <p className="mt-1 text-left text-xs text-red-300">{errors.name}</p>}
        </div>

        {/* Phone + Email row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <input
              name="phone"
              type="tel"
              placeholder="Phone *"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border-0 bg-white px-4 py-3.5 text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50"
              onFocus={() => trackFormStart('phone')}
              onBlur={(e) => {
                trackFieldComplete('phone', !!e.target.value)
                leadStream.updateField('phone', e.target.value)
              }}
            />
            {errors.phone && (
              <p className="mt-1 text-left text-xs text-red-300">{errors.phone}</p>
            )}
          </div>
          <div>
            <input
              name="email"
              type="email"
              placeholder="Email *"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border-0 bg-white px-4 py-3.5 text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50"
              onFocus={() => trackFormStart('email')}
              onBlur={(e) => {
                trackFieldComplete('email', !!e.target.value)
                leadStream.updateField('email', e.target.value)
                if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.target.value)) {
                  pushToDataLayer({
                    event: 'email_capture',
                    email_address: e.target.value,
                    form_id: formId,
                  })
                }
              }}
            />
            {errors.email && (
              <p className="mt-1 text-left text-xs text-red-300">{errors.email}</p>
            )}
          </div>
        </div>

        {/* How did you hear about us */}
        <div className="text-left">
          <p className="mb-2 text-sm font-medium text-white">How did you hear about us?</p>
          <div className="flex flex-wrap gap-2">
            {HOW_DID_YOU_HEAR_OPTIONS.map((option) => (
              <label
                key={option}
                className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                  howDidYouHear === option
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                <input
                  type="radio"
                  name="howDidYouHear"
                  value={option}
                  checked={howDidYouHear === option}
                  onChange={() => setHowDidYouHear(option)}
                  className="sr-only"
                />
                {option}
              </label>
            ))}
          </div>
        </div>

        {/* Submit error */}
        {submitError && (
          <div className="rounded-md bg-red-500/20 p-3 text-sm text-white">
            {submitError}
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-[var(--color-accent)] py-4 text-lg font-bold text-white shadow-lg transition-colors hover:bg-[var(--color-accent-dark)] disabled:opacity-60"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Submitting...
            </span>
          ) : (
            'Get My Cash Offer'
          )}
        </button>
      </div>
    </form>
  )

  return (
    <div className="mx-auto mt-8 max-w-2xl overflow-visible">
      {variant === 'redirect' ? (
        renderAddressForm(handleRedirectSubmit)
      ) : step === 1 ? (
        renderAddressForm(handleInlineStep1)
      ) : (
        renderStep2Form()
      )}
    </div>
  )
}
