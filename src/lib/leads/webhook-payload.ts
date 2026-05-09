/**
 * Builds the Gravity Forms-compatible webhook payload from form + tracking data.
 *
 * The output structure matches exactly what the existing n8n workflow
 * at LEADS_WEBHOOK_URL expects, including all HandL-prefixed fields.
 */

import type { LeadSubmission, WebhookPayload, PartialLeadRecord, TrackingParams } from './types'
import { parseAddress } from './address-parser'

// Form name mapping (for the Form Name field in the webhook)
const FORM_NAME_MAP: Record<string, string> = {
  'land-quick': 'PaperLotLand — Quick Sign-up',
  'land-standard': 'PaperLotLand — Standard Sign-up',
  'land-full': 'PaperLotLand — Full Lead Form',
  'contact-form': 'PaperLotLand — Contact Form',
  'blog-lead-form': 'PaperLotLand — Blog Form',
}

function getBaseUrl(url: string): string {
  try {
    const u = new URL(url)
    return u.origin + u.pathname
  } catch {
    return url
  }
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return ''
  }
}

interface ServerContext {
  ip: string
  userAgent: string
}

export function buildWebhookPayload(
  submission: LeadSubmission,
  server: ServerContext
): WebhookPayload {
  const t = submission.tracking
  const parsed = parseAddress(submission.address)

  // Determine name parts
  let firstName = submission.firstName || ''
  let lastName = submission.lastName || ''
  if (!firstName && !lastName && submission.name) {
    const parts = submission.name.trim().split(/\s+/)
    firstName = parts[0] || ''
    lastName = parts.slice(1).join(' ') || ''
  }

  // Build "how did you hear" fields
  const heardValue = submission.howDidYouHear || ''
  const heardGoogle = heardValue === 'Google Search' ? 'Google Search' : ''
  const heardDirectMail = heardValue === 'Received A Letter' ? 'Received A Letter' : ''
  const heardTv = heardValue === 'Saw Us On TV' ? 'Saw Us On TV' : ''
  const heardWordMouth = heardValue === 'Word Of Mouth' ? 'Word Of Mouth' : ''
  const heardOther = heardValue === 'Other' ? 'Other' : ''

  // Generate Unique ID in the same format as Gravity Forms: "UID" + 8 hex chars
  const uniqueId = 'UID' + Array.from(crypto.getRandomValues(new Uint8Array(4)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  const formName = FORM_NAME_MAP[submission.formId] || submission.formId
  const entryDate = new Date().toISOString().replace('T', ' ').substring(0, 19)

  return {
    // Property address (parsed)
    'Property Address': submission.address,
    'Property (str)': parsed.street,
    'Property (Unit)': parsed.unit,
    'Property (City)': parsed.city,
    'Property (State)': parsed.state,
    'Property (Zip / Postal)': parsed.zip,
    'Property (Country)': parsed.country,

    // UTM params (last touch)
    'UTM Source': t.utm_source,
    'UTM Medium': t.utm_medium,
    'UTM Term': t.utm_term,
    'UTM Content': t.utm_content,
    'UTM Campaign': t.utm_campaign,
    'UTM Campaign ID': t.utm_campaign_id,

    // Click IDs
    GCLID: t.gclid,
    MSCLID: t.msclkid,
    fbclid: t.fbclid,
    wbraid: t.wbraid,
    gbraid: t.gbraid,

    // Contact
    'Name (First)': firstName,
    'Name (Last)': lastName,
    Phone: submission.phone,
    Email: submission.email || '',
    'Hidden Phone': submission.phone, // Mirrors Phone per requirements

    // Navigation
    'Original Referrer': t.original_referrer,
    'Landing Page': t.landing_page,
    Referrer: t.referrer,
    'Form URL': t.form_url,
    'Source Url': t.form_url,

    // Analytics
    gaclientid: t.gaclientid,
    'Organic Source': t.organic_source,
    'Organic Source String': t.organic_source_str,
    'User Agent': server.userAgent,
    'User IP': server.ip,

    // First-touch UTMs
    'UTM Source (First)': t.first_utm_source,
    'UTM Medium (First)': t.first_utm_medium,
    'UTM Campaign (First)': t.first_utm_campaign,
    'UTM Term (First)': t.first_utm_term,
    'UTM Content (First)': t.first_utm_content,

    // Derived
    traffic_source: t.traffic_source,
    first_traffic_source: t.first_traffic_source,

    // HandL-compatible fields (mirrors the primary fields for downstream compat)
    'utm_source (HandL)': t.utm_source,
    'utm_medium (HandL)': t.utm_medium,
    'utm_term (HandL)': t.utm_term,
    'utm_content (HandL)': t.utm_content,
    'utm_campaign (HandL)': t.utm_campaign,
    'gclid (HandL)': t.gclid,
    'msclkid (HandL)': t.msclkid,
    'fbclid (HandL)': t.fbclid,
    'wbraid (HandL)': t.wbraid,
    'gbraid (HandL)': t.gbraid,
    'handl_original_ref (HandL)': t.original_referrer,
    'handl_landing_page (HandL)': t.landing_page,
    'handl_landing_page_base (HandL)': getBaseUrl(t.landing_page),
    'handl_ip (HandL)': server.ip,
    'handl_ref (HandL)': t.referrer,
    'handl_url (HandL)': t.form_url,
    'handl_ref_domain (HandL)': getDomain(t.referrer),
    'handl_url_base (HandL)': getBaseUrl(t.form_url),
    'gaclientid (HandL)': t.gaclientid,
    'organic_source (HandL)': t.organic_source,
    'organic_source_str (HandL)': t.organic_source_str,
    'user_agent (HandL)': server.userAgent,
    'traffic_source (HandL)': t.traffic_source,
    'first_traffic_source (HandL)': t.first_traffic_source,
    'first_utm_source (HandL)': t.first_utm_source,
    'first_utm_medium (HandL)': t.first_utm_medium,
    'first_utm_campaign (HandL)': t.first_utm_campaign,
    'first_utm_term (HandL)': t.first_utm_term,
    'first_utm_content (HandL)': t.first_utm_content,
    'handlID (HandL)': '', // Will be set from client-side handl cookie data
    '_fbc (HandL)': '',
    '_fbp (HandL)': '',

    // Form metadata
    'Unique ID': uniqueId,
    'Partial Entry ID': submission.sessionToken || '',
    'Form Name': formName,
    'Entry Date': entryDate,

    // How did you hear about us
    how_did_you_hear: heardValue,
    heard_google: heardGoogle,
    heard_direct_mail: heardDirectMail,
    heard_tv: heardTv,
    heard_word_mouth: heardWordMouth,
    heard_other: heardOther,

    // Land-specific fields (PaperLotLand)
    role: submission.role || '',
    interest: submission.interest || '',
    lot_type: submission.lotType || '',
    budget: submission.budget || '',
    message: submission.message || '',

    // SMS consent (default empty — can be added to forms later)
    'SMS Consent': '',
    'Submission Type': 'Full Form Submitted',

    // Stable cross-fire dedup keys (used by n8n to deduplicate across partial/full events)
    session_token: submission.sessionToken || '',
  }
}

/**
 * Build a webhook payload from a streaming partial lead.
 *
 * Sent to n8n in near-real-time as the user fills the form.
 * Uses whatever fields are available so far.
 */
export interface HandlCookieValues {
  handlID: string
  handl_landing_page_base: string
  handl_ref_domain: string
  handl_url_base: string
  _fbc: string
  _fbp: string
}

interface PartialStreamInput {
  sessionToken: string
  formId: string
  formVariant: string
  pageUrl: string
  fields: Record<string, string>
  trigger: string
  ip: string
  userAgent: string
  tracking?: TrackingParams
  handlCookies?: HandlCookieValues
}

export function buildPartialWebhookPayload(input: PartialStreamInput): WebhookPayload {
  const address = input.fields.address || ''
  const parsed = parseAddress(address)
  const phone = input.fields.phone || ''

  let firstName = ''
  let lastName = ''
  if (input.fields.firstName) firstName = input.fields.firstName
  if (input.fields.lastName) lastName = input.fields.lastName
  if (!firstName && !lastName && input.fields.name) {
    const parts = input.fields.name.trim().split(/\s+/)
    firstName = parts[0] || ''
    lastName = parts.slice(1).join(' ') || ''
  }

  const uniqueId = 'UID' + Array.from(crypto.getRandomValues(new Uint8Array(4)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  const TRIGGER_LABELS: Record<string, string> = {
    'address_selected': 'Partial Entry — Address Captured',
    'partial_update':   'Partial Entry — In Progress',
    'address_submit':   'Step 1 Submitted — Address Only',
    'chat_transcript':  'Jamie AI Chat — Transcript',
  }
  const SUBMISSION_TYPES: Record<string, string> = {
    'address_selected': 'Partial Entry',
    'partial_update':   'Partial Entry',
    'address_submit':   'Address Step Submitted',
    'chat_transcript':  'Chat Transcript',
  }

  const formName = FORM_NAME_MAP[input.formId] || input.formId
  const triggerLabel = `${formName} (${TRIGGER_LABELS[input.trigger] || input.trigger})`
  const submissionType = SUBMISSION_TYPES[input.trigger] || input.trigger
  const entryDate = new Date().toISOString().replace('T', ' ').substring(0, 19)
  const empty = ''
  const t = input.tracking
  const h = input.handlCookies

  return {
    'Property Address': address,
    'Property (str)': parsed.street,
    'Property (Unit)': parsed.unit,
    'Property (City)': parsed.city,
    'Property (State)': parsed.state,
    'Property (Zip / Postal)': parsed.zip,
    'Property (Country)': parsed.country,

    'UTM Source': t?.utm_source || empty,
    'UTM Medium': t?.utm_medium || empty,
    'UTM Term': t?.utm_term || empty,
    'UTM Content': t?.utm_content || empty,
    'UTM Campaign': t?.utm_campaign || empty,
    'UTM Campaign ID': t?.utm_campaign_id || empty,

    GCLID: t?.gclid || empty,
    MSCLID: t?.msclkid || empty,
    fbclid: t?.fbclid || empty,
    wbraid: t?.wbraid || empty,
    gbraid: t?.gbraid || empty,

    'Name (First)': firstName,
    'Name (Last)': lastName,
    Phone: phone,
    Email: input.fields.email || '',
    'Hidden Phone': phone,

    'Original Referrer': t?.original_referrer || empty,
    'Landing Page': t?.landing_page || empty,
    Referrer: t?.referrer || empty,
    'Form URL': t?.form_url || input.pageUrl,
    'Source Url': t?.form_url || input.pageUrl,

    gaclientid: t?.gaclientid || empty,
    'Organic Source': t?.organic_source || empty,
    'Organic Source String': t?.organic_source_str || empty,
    'User Agent': input.userAgent,
    'User IP': input.ip,

    'UTM Source (First)': t?.first_utm_source || empty,
    'UTM Medium (First)': t?.first_utm_medium || empty,
    'UTM Campaign (First)': t?.first_utm_campaign || empty,
    'UTM Term (First)': t?.first_utm_term || empty,
    'UTM Content (First)': t?.first_utm_content || empty,

    traffic_source: t?.traffic_source || 'Direct',
    first_traffic_source: t?.first_traffic_source || 'Direct',

    'utm_source (HandL)': t?.utm_source || empty,
    'utm_medium (HandL)': t?.utm_medium || empty,
    'utm_term (HandL)': t?.utm_term || empty,
    'utm_content (HandL)': t?.utm_content || empty,
    'utm_campaign (HandL)': t?.utm_campaign || empty,
    'gclid (HandL)': t?.gclid || empty,
    'msclkid (HandL)': t?.msclkid || empty,
    'fbclid (HandL)': t?.fbclid || empty,
    'wbraid (HandL)': t?.wbraid || empty,
    'gbraid (HandL)': t?.gbraid || empty,
    'handl_original_ref (HandL)': t?.original_referrer || empty,
    'handl_landing_page (HandL)': t?.landing_page || empty,
    'handl_landing_page_base (HandL)': h?.handl_landing_page_base || empty,
    'handl_ip (HandL)': input.ip,
    'handl_ref (HandL)': t?.referrer || empty,
    'handl_url (HandL)': t?.form_url || input.pageUrl,
    'handl_ref_domain (HandL)': h?.handl_ref_domain || empty,
    'handl_url_base (HandL)': h?.handl_url_base || input.pageUrl,
    'gaclientid (HandL)': t?.gaclientid || empty,
    'organic_source (HandL)': t?.organic_source || empty,
    'organic_source_str (HandL)': t?.organic_source_str || empty,
    'user_agent (HandL)': input.userAgent,
    'traffic_source (HandL)': t?.traffic_source || 'Direct',
    'first_traffic_source (HandL)': t?.first_traffic_source || 'Direct',
    'first_utm_source (HandL)': t?.first_utm_source || empty,
    'first_utm_medium (HandL)': t?.first_utm_medium || empty,
    'first_utm_campaign (HandL)': t?.first_utm_campaign || empty,
    'first_utm_term (HandL)': t?.first_utm_term || empty,
    'first_utm_content (HandL)': t?.first_utm_content || empty,
    'handlID (HandL)': h?.handlID || empty,
    '_fbc (HandL)': h?._fbc || empty,
    '_fbp (HandL)': h?._fbp || empty,

    'Unique ID': uniqueId,
    'Partial Entry ID': input.sessionToken,
    'Form Name': triggerLabel,
    'Entry Date': entryDate,

    how_did_you_hear: '',
    heard_google: '',
    heard_direct_mail: '',
    heard_tv: '',
    heard_word_mouth: '',
    heard_other: '',

    'SMS Consent': '',
    'Submission Type': submissionType,

    // Stable cross-fire dedup keys (used by n8n to deduplicate across partial/full events)
    session_token: input.sessionToken,

    // Land-specific fields (empty for partial payloads)
    role: '',
    interest: '',
    lot_type: '',
    budget: '',
    message: '',
  }
}

/**
 * Build a webhook payload from an abandoned partial lead record.
 *
 * Uses whatever fields the user filled before abandoning. All tracking/HandL
 * fields are empty since they aren't captured in heartbeats.
 */
export function buildAbandonedWebhookPayload(
  record: PartialLeadRecord,
  abandonType: string
): WebhookPayload {
  const address = record.fields.address || ''
  const parsed = parseAddress(address)
  const phone = record.fields.phone || ''

  // Split name if provided
  let firstName = ''
  let lastName = ''
  if (record.fields.name) {
    const parts = record.fields.name.trim().split(/\s+/)
    firstName = parts[0] || ''
    lastName = parts.slice(1).join(' ') || ''
  }

  const uniqueId = 'UID' + Array.from(crypto.getRandomValues(new Uint8Array(4)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  const entryDate = new Date().toISOString().replace('T', ' ').substring(0, 19)
  const empty = ''

  return {
    'Property Address': address,
    'Property (str)': parsed.street,
    'Property (Unit)': parsed.unit,
    'Property (City)': parsed.city,
    'Property (State)': parsed.state,
    'Property (Zip / Postal)': parsed.zip,
    'Property (Country)': parsed.country,

    'UTM Source': empty, 'UTM Medium': empty, 'UTM Term': empty,
    'UTM Content': empty, 'UTM Campaign': empty, 'UTM Campaign ID': empty,

    GCLID: empty, MSCLID: empty, fbclid: empty, wbraid: empty, gbraid: empty,

    'Name (First)': firstName,
    'Name (Last)': lastName,
    Phone: phone,
    Email: record.fields.email || '',
    'Hidden Phone': phone,

    'Original Referrer': empty, 'Landing Page': empty,
    Referrer: empty, 'Form URL': record.pageUrl, 'Source Url': record.pageUrl,

    gaclientid: empty,
    'Organic Source': empty, 'Organic Source String': empty,
    'User Agent': record.userAgent || '',
    'User IP': record.ip,

    'UTM Source (First)': empty, 'UTM Medium (First)': empty,
    'UTM Campaign (First)': empty, 'UTM Term (First)': empty,
    'UTM Content (First)': empty,

    traffic_source: 'Direct', first_traffic_source: 'Direct',

    'utm_source (HandL)': empty, 'utm_medium (HandL)': empty,
    'utm_term (HandL)': empty, 'utm_content (HandL)': empty,
    'utm_campaign (HandL)': empty, 'gclid (HandL)': empty,
    'msclkid (HandL)': empty, 'fbclid (HandL)': empty,
    'wbraid (HandL)': empty, 'gbraid (HandL)': empty,
    'handl_original_ref (HandL)': empty, 'handl_landing_page (HandL)': empty,
    'handl_landing_page_base (HandL)': empty, 'handl_ip (HandL)': record.ip,
    'handl_ref (HandL)': empty, 'handl_url (HandL)': record.pageUrl,
    'handl_ref_domain (HandL)': empty, 'handl_url_base (HandL)': record.pageUrl,
    'gaclientid (HandL)': empty, 'organic_source (HandL)': empty,
    'organic_source_str (HandL)': empty,
    'user_agent (HandL)': record.userAgent || '',
    'traffic_source (HandL)': 'Direct', 'first_traffic_source (HandL)': 'Direct',
    'first_utm_source (HandL)': empty, 'first_utm_medium (HandL)': empty,
    'first_utm_campaign (HandL)': empty, 'first_utm_term (HandL)': empty,
    'first_utm_content (HandL)': empty,
    'handlID (HandL)': empty, '_fbc (HandL)': empty, '_fbp (HandL)': empty,

    'Unique ID': uniqueId,
    'Partial Entry ID': record.sessionToken,
    'Form Name': abandonType,
    'Entry Date': entryDate,

    how_did_you_hear: '',
    heard_google: '',
    heard_direct_mail: '',
    heard_tv: '',
    heard_word_mouth: '',
    heard_other: '',

    'SMS Consent': '',
    'Submission Type': 'Abandoned',

    // Stable cross-fire dedup keys
    session_token: record.sessionToken,

    role: '',
    interest: '',
    lot_type: '',
    budget: '',
    message: '',
  }
}
