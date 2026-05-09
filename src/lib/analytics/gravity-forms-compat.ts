/**
 * Gravity Forms DataLayer Emulation
 *
 * Emulates the dataLayer events that WordPress Gravity Forms pushed,
 * so all existing GTM triggers (gform_7, gform_8, gform_10, gform_18, etc.)
 * continue to fire without any GTM workspace changes.
 *
 * GTM Form Submission triggers listen for `gtm.formSubmit` auto-events
 * and match against Form ID. By pushing these same events with the correct
 * form element IDs, the existing triggers fire naturally.
 *
 * Mapping from WordPress Gravity Forms → Next.js forms:
 *   gform_5  → Contact page full form (/contact/)
 *   gform_7  → Quick lead forms on most site pages (resources, blog)
 *   gform_8  → Standard lead form on /off-market-deals/
 *   gform_10 → Standard lead form (sample/test pages)
 *   gform_18 → Quick lead forms on homepage and landing pages
 */

// Maps Next.js analytics form IDs to the original Gravity Forms IDs.
// These must match the GTM Form Submission trigger filters exactly.
const GFORM_ID_MAP: Record<string, string> = {
  // Homepage & landing page forms (gform_18 in WordPress)
  'lead-form-quick': 'gform_18',
  'inline-lead-form': 'gform_18',
  'hero-lead-form': 'gform_18',
  'lp-lead-form': 'gform_18',

  // Off-Market Deals page form (gform_8 in WordPress)
  'lead-form-standard': 'gform_8',

  // Full lead forms (gform_18 for leads, gform_5 for contact)
  'lead-form-full': 'gform_18',
  'contact-form': 'gform_8',

  // Location & situation page forms (gform_7 in WordPress)
  'location-lead-form': 'gform_7',
  'situation-lead-form': 'gform_7',
  'case-study-lead-form': 'gform_7',
  'blog-lead-form': 'gform_7',
}

// Default gform ID when no mapping is found
const DEFAULT_GFORM_ID = 'gform_18'

/**
 * Returns the Gravity Forms ID for a given Next.js form ID.
 * Used to set the HTML form element's `id` attribute so GTM's
 * Form Submission auto-event triggers match.
 */
export function getGravityFormId(nextJsFormId: string): string {
  return GFORM_ID_MAP[nextJsFormId] || DEFAULT_GFORM_ID
}

/**
 * Pushes a `gtm.formSubmit` event to the dataLayer, emulating what GTM's
 * auto-event listener would push when a Gravity Form submits.
 *
 * This ensures Form Submission triggers in GTM fire correctly even though
 * the actual HTML form uses React's `onSubmit` with `preventDefault()`.
 *
 * @param formId - The Next.js analytics form ID (e.g., 'lead-form-quick')
 * @param formElement - Optional reference to the actual form DOM element
 */
export function emulateGravityFormSubmit(
  formId: string,
  formElement?: HTMLFormElement | null
) {
  if (typeof window === 'undefined') return

  const gformId = getGravityFormId(formId)

  window.dataLayer = window.dataLayer || []

  // Push the gtm.formSubmit event that GTM's Form Submission triggers listen for.
  // The trigger filter "Form ID equals gform_X" checks gtm.elementId.
  window.dataLayer.push({
    event: 'gtm.formSubmit',
    'gtm.element': formElement || null,
    'gtm.elementClasses': formElement?.className || '',
    'gtm.elementId': gformId,
    'gtm.elementTarget': '',
    'gtm.elementUrl': formElement?.action || window.location.href,
  })
}

/**
 * Pushes Gravity Forms-style confirmation event.
 * In WordPress, GF pushes this after the form submission is confirmed/processed.
 * Some GTM tags may listen for this event.
 */
export function emulateGravityFormConfirmation(formId: string) {
  if (typeof window === 'undefined') return

  const gformId = getGravityFormId(formId)
  const numericId = gformId.replace('gform_', '')

  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({
    event: 'gform_confirmation_loaded',
    formId: parseInt(numericId, 10),
  })
}

/**
 * Emulates Gravity Forms multi-step form events for the Step triggers in GTM.
 *
 * GTM has triggers like:
 *   - "Step 1 - Submit Address Form 10" (Click ID: gform_submit_button_10)
 *   - "Step 1 - Submit Address Form 18" (Click ID: gform_next_button_18_78)
 *   - "Step 2 - Full Contact Submit Form 18" (Click ID: gform_submit_button_18)
 *   - "Step 2 - Full Contact Submit Form 8"  (Click ID: gform_submit_button_8)
 *
 * These are Custom Event triggers that filter on Click ID and Form ID variables.
 */
export function emulateGravityFormStep(
  formId: string,
  step: 'address_submit' | 'full_submit'
) {
  if (typeof window === 'undefined') return

  const gformId = getGravityFormId(formId)
  const numericId = gformId.replace('gform_', '')

  window.dataLayer = window.dataLayer || []

  if (step === 'address_submit') {
    // Step 1 — address/partial submission
    // Pushes a dedicated event that GTM custom event triggers can match directly.
    // GTM triggers should listen for event "form_step1_address" (no variable filters needed).
    window.dataLayer.push({
      event: 'form_step1_address',
      gform_id: gformId,
      gform_numeric_id: numericId,
    })
  } else {
    // Step 2 — full contact submission
    // GTM triggers should listen for event "form_step2_contact".
    window.dataLayer.push({
      event: 'form_step2_contact',
      gform_id: gformId,
      gform_numeric_id: numericId,
    })
  }
}
