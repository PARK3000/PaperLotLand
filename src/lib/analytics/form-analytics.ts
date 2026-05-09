'use client'

import { useCallback, useRef } from 'react'
import { pushToDataLayer } from './gtag'
import { ANALYTICS_EVENTS } from './events'
import { getPageType } from './page-type'

function currentPath(): string {
  return typeof window !== 'undefined' ? window.location.pathname : ''
}

function currentPageType() {
  return getPageType(currentPath())
}

/**
 * Hook for tracking form interactions via GTM dataLayer
 */
export function useFormAnalytics(formId: string, variant: string = 'default') {
  const startTime = useRef<number | null>(null)
  const stepStartTime = useRef<number | null>(null)
  const fieldStartTimes = useRef<Record<string, number>>({})
  const hasStarted = useRef(false)
  const hasViewedRef = useRef(false)
  const completedSteps = useRef<Set<number>>(new Set())

  const trackFormView = useCallback(() => {
    if (hasViewedRef.current) return
    hasViewedRef.current = true

    pushToDataLayer({
      event: ANALYTICS_EVENTS.FORM_VIEWED,
      form_id: formId,
      form_variant: variant,
      page_type: currentPageType(),
      page_url: currentPath(),
    })
  }, [formId, variant])

  const trackFormStart = useCallback(
    (fieldName: string) => {
      if (!hasStarted.current) {
        hasStarted.current = true
        startTime.current = Date.now()
        stepStartTime.current = Date.now()

        // GTM keeps the legacy `form_start` name for Gravity Forms compat.
        pushToDataLayer({
          event: 'form_start',
          form_id: formId,
          form_variant: variant,
          first_field: fieldName,
        })

        // PostHog gets the canonical `form_started` event so funnels work.
        pushToDataLayer({
          event: ANALYTICS_EVENTS.FORM_STARTED,
          form_id: formId,
          form_variant: variant,
          first_field: fieldName,
          page_type: currentPageType(),
        })
      }
      fieldStartTimes.current[fieldName] = Date.now()
    },
    [formId, variant]
  )

  const trackFieldComplete = useCallback(
    (fieldName: string, hasValue: boolean) => {
      if (!hasValue) return

      const timeInField = fieldStartTimes.current[fieldName]
        ? Date.now() - fieldStartTimes.current[fieldName]
        : 0

      pushToDataLayer({
        event: ANALYTICS_EVENTS.FORM_FIELD_COMPLETED,
        form_id: formId,
        field_name: fieldName,
        time_in_field_ms: timeInField,
      })
    },
    [formId]
  )

  const trackValidationError = useCallback(
    (fieldName: string, errorType: string) => {
      pushToDataLayer({
        event: ANALYTICS_EVENTS.FORM_VALIDATION_ERROR,
        form_id: formId,
        field_name: fieldName,
        error_type: errorType,
      })
    },
    [formId]
  )

  const trackStepCompleted = useCallback(
    (step: number, totalSteps: number) => {
      if (completedSteps.current.has(step)) return
      completedSteps.current.add(step)

      const now = Date.now()
      const timeOnStep = stepStartTime.current ? now - stepStartTime.current : 0
      stepStartTime.current = now

      pushToDataLayer({
        event: ANALYTICS_EVENTS.FORM_STEP_COMPLETED,
        form_id: formId,
        form_variant: variant,
        step,
        total_steps: totalSteps,
        time_on_step_ms: timeOnStep,
        page_type: currentPageType(),
      })
    },
    [formId, variant]
  )

  const trackSubmit = useCallback(() => {
    const timeToComplete = startTime.current ? Date.now() - startTime.current : 0

    pushToDataLayer({
      event: ANALYTICS_EVENTS.FORM_SUBMITTED,
      form_id: formId,
      form_variant: variant,
      time_to_complete_ms: timeToComplete,
      page_type: currentPageType(),
    })
  }, [formId, variant])

  const trackSuccess = useCallback(
    (leadId?: string, formData?: { email?: string; phone?: string; name?: string }) => {
      const dataLayerEvent: Record<string, unknown> = {
        event: 'lead_submission',
        form_id: formId,
        lead_id: leadId,
      }

      if (formData) {
        if (formData.email) dataLayerEvent.email = formData.email
        if (formData.phone) dataLayerEvent.phone = formData.phone
        if (formData.name) {
          const nameParts = formData.name.split(' ')
          dataLayerEvent.firstName = nameParts[0]
          dataLayerEvent.lastName = nameParts.slice(1).join(' ')
        }
      }

      pushToDataLayer(dataLayerEvent)

      // PostHog: identify the lead and emit a semantic conversion event.
      // `lead_submission` is a GTM/GF event name so it's not in the POSTHOG_EVENTS
      // allowlist — surface it to PostHog explicitly here with a clean name.
      if (typeof window !== 'undefined') {
        import('posthog-js').then(({ default: posthog }) => {
          if (!posthog.__loaded) return
          if (leadId || formData?.email || formData?.phone) {
            const distinctId = leadId || formData?.email || formData?.phone
            if (distinctId) {
              posthog.identify(distinctId, {
                email: formData?.email,
                phone: formData?.phone,
                name: formData?.name,
              })
            }
          }
          posthog.capture('lead_submission', {
            form_id: formId,
            lead_id: leadId,
            page_type: currentPageType(),
          })
        })
      }
    },
    [formId]
  )

  const trackError = useCallback(
    (errorType: string, errorMessage?: string) => {
      pushToDataLayer({
        event: ANALYTICS_EVENTS.FORM_ERROR,
        form_id: formId,
        error_type: errorType,
        error_message: errorMessage,
      })
    },
    [formId]
  )

  const reset = useCallback(() => {
    hasStarted.current = false
    startTime.current = null
    stepStartTime.current = null
    fieldStartTimes.current = {}
    completedSteps.current.clear()
  }, [])

  return {
    trackFormView,
    trackFormStart,
    trackFieldComplete,
    trackValidationError,
    trackStepCompleted,
    trackSubmit,
    trackSuccess,
    trackError,
    reset,
  }
}
