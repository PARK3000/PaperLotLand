import { NextRequest, NextResponse } from 'next/server'
import { isApplicantRateLimited } from '@/lib/applicants/rate-limit'

/** Wrap private Vercel Blob URLs in our download proxy so the webhook URLs are directly accessible */
function toProxyUrl(blobUrl: string | undefined, requestUrl: string): string {
  if (!blobUrl) return ''
  if (!blobUrl.includes('.private.blob.vercel-storage.com')) return blobUrl
  const origin = new URL(requestUrl).origin
  return `${origin}/api/download/?url=${encodeURIComponent(blobUrl)}`
}
import { buildApplicantWebhookPayload } from '@/lib/applicants/webhook-payload'
import { logApplicant } from '@/lib/applicants/db-logger'
import { WEBHOOK_TIMEOUT_MS } from '@/lib/leads/constants'

const PHONE_REGEX = /^\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function randomStr(length = 8): string {
  return Math.random().toString(36).slice(2, 2 + length)
}

function isValidUrl(value: string): boolean {
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    ''

  if (await isApplicantRateLimited(ip)) {
    return NextResponse.json(
      { success: false, error: 'Too many submissions. Please try again later.' },
      { status: 429 }
    )
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request.' }, { status: 400 })
  }

  // Honeypot check — bots fill this, real users never see it
  if (body._hp) {
    return NextResponse.json({ success: true })
  }

  const {
    fullName, phone, email, position, introVideoUrl, resumeUrl, source, pageUrl,
    hasDriversLicense, healthBenefitsRequired, canWorkInOffice, hasRealEstateLicense,
    motivation, lookingFor, teamContribution,
    utm_source, utm_medium, utm_campaign, utm_term, utm_content,
  } = body as {
    fullName?: string
    phone?: string
    email?: string
    position?: string
    introVideoUrl?: string
    resumeUrl?: string
    source?: string
    pageUrl?: string
    hasDriversLicense?: string
    healthBenefitsRequired?: string
    canWorkInOffice?: string
    hasRealEstateLicense?: string
    motivation?: string
    lookingFor?: string
    teamContribution?: string
    utm_source?: string
    utm_medium?: string
    utm_campaign?: string
    utm_term?: string
    utm_content?: string
  }

  // Validate required fields
  const errors: Record<string, string> = {}
  if (!fullName || String(fullName).trim().length < 2) {
    errors.fullName = 'Please enter your full name.'
  }
  if (!phone || !PHONE_REGEX.test(String(phone).trim())) {
    errors.phone = 'Please enter a valid phone number.'
  }
  if (!email || !EMAIL_REGEX.test(String(email).trim())) {
    errors.email = 'Please enter a valid email address.'
  }
  if (!position || String(position).trim().length === 0) {
    errors.position = 'Please select a position.'
  }
  if (!source || String(source).trim().length === 0) {
    errors.source = 'Please select how you found us.'
  }

  // Validate optional URL fields
  if (introVideoUrl && String(introVideoUrl).trim() && !isValidUrl(String(introVideoUrl).trim())) {
    errors.introVideoUrl = 'Please enter a valid URL (include https://).'
  }
  if (resumeUrl && String(resumeUrl).trim() && !isValidUrl(String(resumeUrl).trim())) {
    errors.resumeUrl = 'Please enter a valid URL (include https://).'
  }

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ success: false, errors }, { status: 400 })
  }

  const applicationId = `app_${Date.now()}_${randomStr()}`
  const userAgent = req.headers.get('user-agent') || ''

  const payload = buildApplicantWebhookPayload(applicationId, {
    fullName: String(fullName).trim(),
    phone: String(phone).trim(),
    email: String(email).trim(),
    position: String(position).trim(),
    introVideoUrl: toProxyUrl(introVideoUrl ? String(introVideoUrl).trim() : undefined, req.url),
    resumeUrl: toProxyUrl(resumeUrl ? String(resumeUrl).trim() : undefined, req.url),
    source: String(source).trim(),
    pageUrl: pageUrl ? String(pageUrl).trim() : undefined,
    ip,
    userAgent,
    hasDriversLicense: hasDriversLicense ? String(hasDriversLicense).trim() : undefined,
    healthBenefitsRequired: healthBenefitsRequired ? String(healthBenefitsRequired).trim() : undefined,
    canWorkInOffice: canWorkInOffice ? String(canWorkInOffice).trim() : undefined,
    hasRealEstateLicense: hasRealEstateLicense ? String(hasRealEstateLicense).trim() : undefined,
    motivation: motivation ? String(motivation).trim() : undefined,
    lookingFor: lookingFor ? String(lookingFor).trim() : undefined,
    teamContribution: teamContribution ? String(teamContribution).trim() : undefined,
    utm_source: utm_source ? String(utm_source).trim() : undefined,
    utm_medium: utm_medium ? String(utm_medium).trim() : undefined,
    utm_campaign: utm_campaign ? String(utm_campaign).trim() : undefined,
    utm_term: utm_term ? String(utm_term).trim() : undefined,
    utm_content: utm_content ? String(utm_content).trim() : undefined,
  })

  const webhookUrl = process.env.APPLICANTS_WEBHOOK_URL
  if (!webhookUrl) {
    console.error('[api/applicants] APPLICANTS_WEBHOOK_URL is not set')
    return NextResponse.json(
      { success: false, error: 'Configuration error. Please contact us directly.' },
      { status: 503 }
    )
  }

  let webhookSuccess = false
  let webhookError: string | undefined

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
    })

    if (response.ok) {
      webhookSuccess = true
    } else {
      webhookError = `Webhook responded with ${response.status}`
      console.error('[api/applicants] Webhook error:', webhookError)
    }
  } catch (err) {
    webhookError = err instanceof Error ? err.message : 'Unknown error'
    console.error('[api/applicants] Webhook fetch failed:', webhookError)
  }

  // Log to DB regardless of webhook outcome
  try {
    await logApplicant({
      applicationId,
      status: webhookSuccess ? 'delivered' : 'failed',
      payload,
      errorMessage: webhookError,
    })
  } catch (dbErr) {
    console.error('[api/applicants] DB log failed:', dbErr)
  }

  if (!webhookSuccess) {
    return NextResponse.json(
      {
        success: false,
        error:
          'We received your application but had a technical issue. Please call us at (702) 213-9800 to confirm.',
      },
      { status: 503 }
    )
  }

  return NextResponse.json({ success: true, applicationId })
}
