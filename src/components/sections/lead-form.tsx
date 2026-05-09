'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AddressAutocomplete } from '@/components/ui/address-autocomplete'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { GOOGLE_REVIEWS } from '@/lib/constants'
import {
  useFormAnalytics,
  pushToDataLayer,
  getGravityFormId,
  emulateGravityFormSubmit,
  emulateGravityFormConfirmation,
  emulateGravityFormStep,
} from '@/lib/analytics'
import { useLeadStream } from '@/lib/leads/use-lead-stream'
import { getTrackingParams, getHandlCookieValues } from '@/lib/leads/tracking-params'
import { useUrlPrefill } from '@/lib/hooks/use-url-prefill'

type FormVariant = 'quick' | 'standard' | 'full'

interface LeadFormProps {
  variant?: FormVariant
  title?: string
  subtitle?: string
  showSocialProof?: boolean
  className?: string
  formId?: string
  onSuccess?: (leadId?: string) => void
  googleRating?: string
  googleCount?: number
  defaultAddress?: string
  /** When true, skips the redirect to /thank-you/ after successful submission */
  skipRedirect?: boolean
  /** Pre-populated defaults (URL params take precedence when not explicitly set) */
  defaultFirstName?: string
  defaultLastName?: string
  defaultEmail?: string
  defaultPhone?: string
}

export function LeadForm({
  variant = 'quick',
  title,
  subtitle,
  showSocialProof = true,
  className,
  formId,
  onSuccess,
  googleRating,
  googleCount,
  defaultAddress,
  skipRedirect = false,
  defaultFirstName,
  defaultLastName,
  defaultEmail,
  defaultPhone,
}: LeadFormProps) {
  const prefill = useUrlPrefill()
  // URL params take precedence over explicitly passed defaults
  const fillAddress = prefill.address || defaultAddress || ''
  const fillFirstName = prefill.firstName || defaultFirstName || ''
  const fillLastName = prefill.lastName || defaultLastName || ''
  const fillEmail = prefill.email || defaultEmail || ''
  const fillPhone = prefill.phone || defaultPhone || ''
  const displayRating = googleRating || GOOGLE_REVIEWS.rating
  const displayCount = googleCount || GOOGLE_REVIEWS.count
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Generate form ID for analytics
  const analyticsFormId = formId || `lead-form-${variant}`
  const gformId = getGravityFormId(analyticsFormId)

  const {
    trackFormView,
    trackFormStart,
    trackFieldComplete,
    trackValidationError,
    trackSubmit,
    trackSuccess,
    trackError,
  } = useFormAnalytics(analyticsFormId, variant)

  const leadStream = useLeadStream(analyticsFormId, variant)

  // Track form view on mount
  useEffect(() => {
    trackFormView()
  }, [trackFormView])

  // Seed pre-filled values into the lead stream so partial_update
  // webhooks include them even before the user blurs those fields.
  useEffect(() => {
    if (fillAddress) leadStream.seedField('address', fillAddress)
    if (fillFirstName) leadStream.seedField('firstName', fillFirstName)
    if (fillLastName) leadStream.seedField('lastName', fillLastName)
    if (fillEmail) leadStream.seedField('email', fillEmail)
    if (fillPhone) leadStream.seedField('phone', fillPhone)
  }, [fillAddress, fillFirstName, fillLastName, fillEmail, fillPhone, leadStream])

  const defaultTitles: Record<FormVariant, string> = {
    quick: 'Get Your Free Cash Offer',
    standard: 'Get Your Free Cash Offer',
    full: 'Contact Us',
  }

  const defaultSubtitles: Record<FormVariant, string> = {
    quick: 'Enter your address and phone to get started',
    standard: "We'll contact you within 24 hours with a no-obligation offer",
    full: 'Fill out the form below and we will get back to you',
  }

  const displayTitle = title || defaultTitles[variant]
  const displaySubtitle = subtitle || defaultSubtitles[variant]

  const validateForm = (formData: FormData): boolean => {
    const newErrors: Record<string, string> = {}

    const address = formData.get('address') as string
    const phone = formData.get('phone') as string

    if (!address || address.trim().length < 5) {
      newErrors.address = 'Please enter a valid address'
      trackValidationError('address', 'too_short')
    }

    if (!phone || !/^\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/.test(phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number'
      trackValidationError('phone', 'invalid_format')
    }

    if (variant === 'standard' || variant === 'full') {
      const name = formData.get('name') as string
      if (!name || name.trim().length < 2) {
        newErrors.name = 'Please enter your name'
        trackValidationError('name', 'too_short')
      }
    }

    if (variant === 'full') {
      const email = formData.get('email') as string
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        newErrors.email = 'Please enter a valid email'
        trackValidationError('email', 'invalid_format')
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    leadStream.cancel()
    setSubmitError(null)
    const formData = new FormData(e.currentTarget)

    if (!validateForm(formData)) {
      return
    }

    setIsSubmitting(true)
    trackSubmit()

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.get('name') || undefined,
          address: formData.get('address'),
          phone: formData.get('phone'),
          email: formData.get('email') || undefined,
          howDidYouHear: formData.get('howDidYouHear') || undefined,
          sessionToken: leadStream.getSessionToken() || undefined,
          formId: analyticsFormId,
          formVariant: variant,
          pageUrl: typeof window !== 'undefined' ? window.location.href : '',
          tracking: getTrackingParams(),
          handlCookies: getHandlCookieValues(),
          _hp: formData.get('website') || '',
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Pass form data for enhanced conversions
        const phone = formData.get('phone') as string
        const email = formData.get('email') as string
        const name = formData.get('name') as string
        trackSuccess(result.leadId, { email, phone, name })

        // Emulate Gravity Forms dataLayer events for GTM backwards compatibility.
        // This fires the existing gform_X Form Submission triggers in GTM
        // without requiring any GTM workspace changes.
        emulateGravityFormSubmit(analyticsFormId, formRef.current)
        emulateGravityFormStep(analyticsFormId, 'address_submit')
        if (variant === 'full' || variant === 'standard') {
          emulateGravityFormStep(analyticsFormId, 'full_submit')
        }
        emulateGravityFormConfirmation(analyticsFormId)

        // Store lead data for the thank you page to push to dataLayer
        const nameParts = (name || '').trim().split(/\s+/)
        const address = formData.get('address') as string
        sessionStorage.setItem('leadData', JSON.stringify({
          formId: analyticsFormId,
          leadId: result.leadId,
          email: email || undefined,
          phone: phone || undefined,
          firstName: nameParts[0] || undefined,
          lastName: nameParts.slice(1).join(' ') || undefined,
          address: address || undefined,
        }))

        onSuccess?.(result.leadId)

        // Redirect to thank you page for conversion tracking (unless skipped)
        if (!skipRedirect) {
          router.push('/thank-you/')
        }
      } else {
        trackError('api_error', result.error)
        setSubmitError(result.error || 'An error occurred. Please try again.')
      }
    } catch (error) {
      trackError('network_error', error instanceof Error ? error.message : 'Unknown error')
      setSubmitError('Unable to submit. Please try again or call us directly.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle field focus for analytics
  const handleFieldFocus = (fieldName: string) => {
    // Push to GTM dataLayer for per-field tracking
    pushToDataLayer({
      event: 'form_field_focused',
      form_field_name: fieldName,
      form_id: analyticsFormId,
      form_variant: variant,
    })

    trackFormStart(fieldName)
  }

  // Handle field blur for analytics + heartbeat
  const handleFieldBlur = (fieldName: string, value: string) => {
    trackFieldComplete(fieldName, !!value)
    leadStream.updateField(fieldName, value)
  }

  // Handle email change for email capture tracking
  const handleEmailChange = (value: string) => {
    // Validate email format and push to dataLayer when valid
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      pushToDataLayer({
        event: 'email_capture',
        email_address: value,
        form_id: analyticsFormId,
        form_variant: variant,
      })
    }
  }

  return (
    <Card padding="lg" className={cn('shadow-xl', className)}>
      <div className="mb-5 text-center">
        <h2 className="text-xl font-bold text-[var(--color-text)] sm:text-2xl">
          {displayTitle}
        </h2>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          {displaySubtitle}
        </p>
      </div>

      <form ref={formRef} id={gformId} onSubmit={handleSubmit} className="space-y-4">
        {/* Honeypot field — hidden from real users, filled by bots */}
        <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', opacity: 0 }}>
          <label htmlFor={`${analyticsFormId}-website`}>Website</label>
          <input type="text" id={`${analyticsFormId}-website`} name="website" tabIndex={-1} autoComplete="off" />
        </div>

        {/* Name field - standard and full variants */}
        {(variant === 'standard' || variant === 'full') && (
          <Input
            label="Your Name"
            name="name"
            placeholder="John Smith"
            required
            defaultValue={[fillFirstName, fillLastName].filter(Boolean).join(' ')}
            error={errors.name}
            onFocus={() => handleFieldFocus('name')}
            onBlur={(e) => handleFieldBlur('name', e.target.value)}
          />
        )}

        {/* Address field - all variants */}
        <AddressAutocomplete
          label="Property Address"
          name="address"
          placeholder="123 Main St, Las Vegas, NV"
          required
          defaultValue={fillAddress}
          externalValue={fillAddress}
          error={errors.address}
          icon={<LocationIcon className="h-5 w-5 text-[var(--color-text-muted)]" />}
          onFocus={() => handleFieldFocus('address')}
          onBlur={(e) => handleFieldBlur('address', e.target.value)}
          onPlaceSelected={(address) => {
            trackFieldComplete('address', true)
            leadStream.onAddressSelected(address)
          }}
        />

        {/* Phone field - all variants */}
        <Input
          label="Phone Number"
          name="phone"
          type="tel"
          placeholder="(702) 555-1234"
          required
          defaultValue={fillPhone}
          error={errors.phone}
          icon={<PhoneIcon className="h-5 w-5 text-[var(--color-text-muted)]" />}
          onFocus={() => handleFieldFocus('phone')}
          onBlur={(e) => handleFieldBlur('phone', e.target.value)}
        />

        {/* Email field - full variant only */}
        {variant === 'full' && (
          <Input
            label="Email Address"
            name="email"
            type="email"
            placeholder="john@example.com"
            required
            defaultValue={fillEmail}
            error={errors.email}
            onFocus={() => handleFieldFocus('email')}
            onBlur={(e) => handleFieldBlur('email', e.target.value)}
            onChange={(e) => handleEmailChange(e.target.value)}
          />
        )}

        {/* How did you hear about us - full variant only */}
        {variant === 'full' && (
          <HowDidYouHearField
            error={errors.howDidYouHear}
            onFocus={() => handleFieldFocus('howDidYouHear')}
          />
        )}

        {/* Submit error message */}
        {submitError && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {submitError}
          </div>
        )}

        <Button
          type="submit"
          variant="accent"
          size="xl"
          fullWidth
          disabled={isSubmitting}
          className="mt-2"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <LoadingSpinner />
              Submitting...
            </span>
          ) : (
            'Get My Cash Offer'
          )}
        </Button>

        {/* Social proof badge */}
        {showSocialProof && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <StarIcon key={i} className="h-4 w-4 text-yellow-400" />
              ))}
            </div>
            <span className="text-sm text-[var(--color-text-muted)]">
              {displayRating} from {displayCount} reviews
            </span>
          </div>
        )}

        <p className="text-center text-xs text-[var(--color-text-muted)]">
          We save your progress as you type. By submitting, you agree to our{' '}
          <a
            href="/privacy-policy/"
            className="underline hover:text-[var(--color-primary)]"
          >
            Privacy Policy
          </a>
          . We&apos;ll never share your information.
        </p>
      </form>
    </Card>
  )
}

// Inline form variant for CTAs (no card wrapper)
interface InlineLeadFormProps {
  className?: string
  buttonText?: string
  formId?: string
  onSuccess?: (leadId?: string) => void
}

export function InlineLeadForm({
  className,
  buttonText = "See what we'd pay →",
  formId,
  onSuccess,
}: InlineLeadFormProps) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const analyticsFormId = formId || 'inline-lead-form'
  const gformId = getGravityFormId(analyticsFormId)

  const {
    trackFormView,
    trackFormStart,
    trackFieldComplete,
    trackSubmit,
    trackSuccess,
    trackError,
  } = useFormAnalytics(analyticsFormId, 'inline')

  const leadStream = useLeadStream(analyticsFormId, 'inline')

  // Track form view on mount
  useEffect(() => {
    trackFormView()
  }, [trackFormView])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    leadStream.cancel()
    setSubmitError(null)
    const formData = new FormData(e.currentTarget)

    setIsSubmitting(true)
    trackSubmit()

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: formData.get('address'),
          phone: formData.get('phone'),
          sessionToken: leadStream.getSessionToken() || undefined,
          formId: analyticsFormId,
          formVariant: 'inline',
          pageUrl: typeof window !== 'undefined' ? window.location.href : '',
          tracking: getTrackingParams(),
          handlCookies: getHandlCookieValues(),
          _hp: formData.get('website') || '',
        }),
      })

      const result = await response.json()

      if (result.success) {
        trackSuccess(result.leadId)

        // Emulate Gravity Forms dataLayer events for GTM backwards compatibility
        emulateGravityFormSubmit(analyticsFormId, formRef.current)
        emulateGravityFormStep(analyticsFormId, 'address_submit')
        emulateGravityFormConfirmation(analyticsFormId)

        // Store lead data for the thank you page to push to dataLayer
        sessionStorage.setItem('leadData', JSON.stringify({
          formId: analyticsFormId,
          leadId: result.leadId,
          phone: formData.get('phone') as string || undefined,
          address: formData.get('address') as string || undefined,
        }))

        onSuccess?.(result.leadId)

        // Redirect to thank you page for conversion tracking
        router.push('/thank-you/')
      } else {
        trackError('api_error', result.error)
        setSubmitError(result.error || 'Please try again.')
      }
    } catch (error) {
      trackError('network_error', error instanceof Error ? error.message : 'Unknown error')
      setSubmitError('Unable to submit. Please call us directly.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={className}>
      <form
        ref={formRef}
        id={gformId}
        onSubmit={handleSubmit}
        className="space-y-3"
      >
        {/* Honeypot field — hidden from real users, filled by bots */}
        <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', opacity: 0 }}>
          <label htmlFor={`${analyticsFormId}-website`}>Website</label>
          <input type="text" id={`${analyticsFormId}-website`} name="website" tabIndex={-1} autoComplete="off" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <AddressAutocomplete
            name="address"
            placeholder="Property Address"
            required
            icon={<LocationIcon className="h-5 w-5 text-[var(--color-text-muted)]" />}
            onFocus={() => trackFormStart('address')}
            onBlur={(e) => {
              trackFieldComplete('address', !!e.target.value)
              leadStream.updateField('address', e.target.value)
            }}
            onPlaceSelected={(address) => {
              trackFieldComplete('address', true)
              leadStream.onAddressSelected(address)
            }}
          />
          <Input
            name="phone"
            type="tel"
            placeholder="Phone Number"
            required
            icon={<PhoneIcon className="h-5 w-5 text-[var(--color-text-muted)]" />}
            onFocus={() => trackFormStart('phone')}
            onBlur={(e) => {
              trackFieldComplete('phone', !!e.target.value)
              leadStream.updateField('phone', e.target.value)
            }}
          />
        </div>
        <Button
          type="submit"
          variant="accent"
          size="lg"
          fullWidth
          disabled={isSubmitting}
        >
          {isSubmitting ? <LoadingSpinner /> : buttonText}
        </Button>
      </form>
      {submitError && (
        <p className="mt-2 text-sm text-red-600">{submitError}</p>
      )}
    </div>
  )
}

const HOW_DID_YOU_HEAR_OPTIONS = [
  'Google Search',
  'Received A Letter',
  'Saw Us On TV',
  'Word Of Mouth',
  'Other',
] as const

function HowDidYouHearField({
  error,
  onFocus,
}: {
  error?: string
  onFocus?: () => void
}) {
  const [selected, setSelected] = useState<string>('')

  return (
    <fieldset onFocus={onFocus}>
      <legend className="mb-2 text-sm font-medium text-[var(--color-text)]">
        How did you hear about us?
      </legend>
      <div className="flex flex-wrap gap-2">
        {HOW_DID_YOU_HEAR_OPTIONS.map((option) => (
          <label
            key={option}
            className={cn(
              'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
              selected === option
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)]'
                : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)]/50'
            )}
          >
            <input
              type="radio"
              name="howDidYouHear"
              value={option}
              checked={selected === option}
              onChange={() => setSelected(option)}
              className="sr-only"
            />
            <span
              className={cn(
                'flex h-4 w-4 items-center justify-center rounded border',
                selected === option
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)]'
                  : 'border-[var(--color-border)]'
              )}
            >
              {selected === option && (
                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </span>
            {option}
          </label>
        ))}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </fieldset>
  )
}

// Icons
function LocationIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  )
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  )
}

function LoadingSpinner() {
  return (
    <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  )
}
