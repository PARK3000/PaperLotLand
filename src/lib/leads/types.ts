/**
 * Lead submission types for the form → API → webhook pipeline.
 *
 * Client forms collect TrackingParams + form fields → send as LeadSubmission to API.
 * API enriches with server data (IP, UA) → builds WebhookPayload → POSTs to n8n.
 * WebhookPayload matches the exact Gravity Forms field structure the existing
 * n8n workflow expects, so no downstream changes are needed.
 */

// ---------------------------------------------------------------------------
// Client-side tracking (replaces HandL UTM Tracker WordPress plugin)
// ---------------------------------------------------------------------------

export interface TrackingParams {
  // Last-touch UTM params (from current session URL)
  utm_source: string
  utm_medium: string
  utm_term: string
  utm_content: string
  utm_campaign: string
  utm_campaign_id: string

  // First-touch UTM params (from initial visit, stored in cookie)
  first_utm_source: string
  first_utm_medium: string
  first_utm_term: string
  first_utm_content: string
  first_utm_campaign: string

  // Ad platform click IDs
  gclid: string
  msclkid: string
  fbclid: string
  wbraid: string
  gbraid: string

  // Navigation context
  original_referrer: string // Very first referrer that brought user to site
  landing_page: string // First page URL (with params)
  referrer: string // Current page referrer (document.referrer)
  form_url: string // URL of the page where the form was submitted

  // Google Analytics
  gaclientid: string

  // Derived fields
  organic_source: string // "Google", "Bing", "Direct", etc.
  organic_source_str: string // Full referrer domain string
  traffic_source: string // "Paid", "Direct", "Organic"
  first_traffic_source: string
}

// ---------------------------------------------------------------------------
// Form submission (client → API)
// ---------------------------------------------------------------------------

export interface LeadSubmission {
  // Contact info
  name?: string
  firstName?: string
  lastName?: string
  phone: string
  email?: string

  // Property / inquiry
  address: string // synthetic "Land Inquiry — …" string built from lot type + budget

  // How did you hear about us
  howDidYouHear?: string

  // Land-specific fields (PaperLotLand)
  role?: string      // developer, broker, investor, other
  interest?: string  // buy, sell, both
  lotType?: string   // residential lots, commercial, multifamily pad, industrial
  budget?: string    // $500K-$1M, $1M-$5M, $5M+, etc.
  message?: string   // free-form notes

  // Form metadata
  formId: string
  formVariant: string
  pageUrl: string
  sessionToken?: string

  // Client-side tracking
  tracking: TrackingParams
}

// ---------------------------------------------------------------------------
// Webhook payload (API → n8n) — matches Gravity Forms field structure exactly
// ---------------------------------------------------------------------------

export interface WebhookPayload {
  // Property address (parsed)
  'Property Address': string
  'Property (str)': string
  'Property (Unit)': string
  'Property (City)': string
  'Property (State)': string
  'Property (Zip / Postal)': string
  'Property (Country)': string

  // UTM params (last touch)
  'UTM Source': string
  'UTM Medium': string
  'UTM Term': string
  'UTM Content': string
  'UTM Campaign': string
  'UTM Campaign ID': string

  // Click IDs
  GCLID: string
  MSCLID: string
  fbclid: string
  wbraid: string
  gbraid: string

  // Contact
  'Name (First)': string
  'Name (Last)': string
  Phone: string
  Email: string
  'Hidden Phone': string

  // Navigation
  'Original Referrer': string
  'Landing Page': string
  Referrer: string
  'Form URL': string
  'Source Url': string

  // Analytics
  gaclientid: string
  'Organic Source': string
  'Organic Source String': string
  'User Agent': string
  'User IP': string

  // First-touch UTMs
  'UTM Source (First)': string
  'UTM Medium (First)': string
  'UTM Campaign (First)': string
  'UTM Term (First)': string
  'UTM Content (First)': string

  // Derived
  'traffic_source': string
  'first_traffic_source': string

  // HandL-compatible fields (downstream may reference either naming)
  'utm_source (HandL)': string
  'utm_medium (HandL)': string
  'utm_term (HandL)': string
  'utm_content (HandL)': string
  'utm_campaign (HandL)': string
  'gclid (HandL)': string
  'msclkid (HandL)': string
  'fbclid (HandL)': string
  'wbraid (HandL)': string
  'gbraid (HandL)': string
  'handl_original_ref (HandL)': string
  'handl_landing_page (HandL)': string
  'handl_landing_page_base (HandL)': string
  'handl_ip (HandL)': string
  'handl_ref (HandL)': string
  'handl_url (HandL)': string
  'handl_ref_domain (HandL)': string
  'handl_url_base (HandL)': string
  'gaclientid (HandL)': string
  'organic_source (HandL)': string
  'organic_source_str (HandL)': string
  'user_agent (HandL)': string
  'traffic_source (HandL)': string
  'first_traffic_source (HandL)': string
  'first_utm_source (HandL)': string
  'first_utm_medium (HandL)': string
  'first_utm_campaign (HandL)': string
  'first_utm_term (HandL)': string
  'first_utm_content (HandL)': string
  'handlID (HandL)': string
  '_fbc (HandL)': string
  '_fbp (HandL)': string

  // Form metadata
  'Unique ID': string
  'Partial Entry ID': string
  'Form Name': string
  'Entry Date': string

  // How did you hear about us
  'how_did_you_hear': string
  'heard_google': string
  'heard_direct_mail': string
  'heard_tv': string
  'heard_word_mouth': string
  'heard_other': string

  // Consent
  'SMS Consent': string

  // Submission status (Vercel forms)
  'Submission Type': string

  // Stable cross-fire dedup keys for n8n
  session_token: string

  // Land-specific fields (PaperLotLand)
  role: string
  interest: string
  lot_type: string
  budget: string
  message: string
}

// ---------------------------------------------------------------------------
// Partial lead record (heartbeat → Redis → cron)
// ---------------------------------------------------------------------------

export interface PartialLeadRecord {
  sessionToken: string
  formId: string
  formVariant: string
  pageUrl: string
  fields: { address?: string; phone?: string; name?: string; email?: string }
  fieldsFilled: string[]
  heartbeatCount: number
  firstSeen: string
  lastUpdated: string
  ip: string
  userAgent: string | null
}
