// Analytics event taxonomy.
// Adding an event here automatically forwards it to PostHog via gtag.ts's
// dataLayer mirror. Server-side events (partial_lead_stream,
// lead_submission_server) live in src/lib/analytics/server.ts and bypass
// this allowlist; their names are still listed below as a single source
// of truth.
// See docs/POSTHOG-EVENTS.md for the canonical reference.

export const ANALYTICS_EVENTS = {
  // Form Events (client)
  FORM_VIEWED: 'form_viewed',
  FORM_STARTED: 'form_started',
  FORM_FIELD_COMPLETED: 'form_field_completed',
  FORM_VALIDATION_ERROR: 'form_validation_error',
  FORM_STEP_COMPLETED: 'form_step_completed',
  FORM_SUBMITTED: 'form_submitted',
  FORM_ERROR: 'form_error',
  // Note: lead_submission (success) is fired explicitly via posthog.capture
  // in form-analytics.ts so the identify call can run alongside it. It is
  // intentionally not in this allowlist to avoid double-firing through GTM.

  // CTA Events
  CTA_CLICKED: 'cta_clicked',
  CTA_VIEWED: 'cta_viewed',

  // Phone / SMS
  PHONE_CLICKED: 'phone_clicked',
  SMS_CLICKED: 'sms_clicked',

  // Popup Events
  POPUP_VIEWED: 'popup_viewed',
  POPUP_CLOSED: 'popup_closed',
  POPUP_CONVERTED: 'popup_converted',

  // Page Events
  PAGE_VIEWED: '$pageview',
} as const

// Server-side events. Captured via posthog-node (src/lib/analytics/server.ts).
// Listed for documentation only — they are not pushed through the dataLayer.
export const SERVER_EVENTS = {
  PARTIAL_LEAD_STREAM: 'partial_lead_stream',
  LEAD_SUBMISSION_SERVER: 'lead_submission_server',
} as const

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS]

// Page-type segmentation. Every event payload includes this so dashboards
// filter by section without per-URL globs.
export type PageType =
  | 'home'
  | 'lp'
  | 'situation'
  | 'location'
  | 'landing'
  | 'case_study'
  | 'blog'
  | 'other'

// Event property types for type-safe tracking
export interface FormViewedProps {
  form_id: string
  form_variant: string
  page_type: PageType
  page_url: string
}

export interface FormStartedProps {
  form_id: string
  form_variant: string
  first_field: string
  page_type: PageType
}

export interface FormFieldCompletedProps {
  form_id: string
  field_name: string
  time_in_field_ms: number
  step?: number
}

export interface FormValidationErrorProps {
  form_id: string
  field_name: string
  error_type: string
}

export interface FormStepCompletedProps {
  form_id: string
  form_variant: string
  step: number
  total_steps: number
  time_on_step_ms: number
  page_type: PageType
}

export interface FormSubmittedProps {
  form_id: string
  form_variant: string
  time_to_complete_ms: number
  page_type: PageType
}

export interface FormErrorProps {
  form_id: string
  error_type: string
  error_message?: string
}

export interface CtaClickedProps {
  cta_id: string
  cta_text: string
  page_type: PageType
  page_url: string
}

export interface CtaViewedProps extends CtaClickedProps {}

export interface PhoneClickedProps {
  phone_number: string
  click_location: string
  page_type: PageType
  page_url: string
}

export interface SmsClickedProps extends PhoneClickedProps {}

export interface PopupEventProps {
  trigger_type: string
  page_type: PageType
  time_on_page_ms?: number
}

// Server-side payloads
export interface PartialLeadStreamProps {
  submission_type: 'address_selected' | 'partial_update' | 'address_submit'
  fields_filled: string[]
  page_type: PageType
  page_url?: string
}

export interface LeadSubmissionServerProps {
  source: 'n8n' | 'podio_fallback' | 'podio_direct'
  status: 'delivered' | 'failed' | 'fallback_delivered' | 'fallback_failed'
  attempts: number
}
