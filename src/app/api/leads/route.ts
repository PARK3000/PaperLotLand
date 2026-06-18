import { NextRequest, NextResponse } from 'next/server'
import { after } from 'next/server'
import { buildWebhookPayload } from '@/lib/leads/webhook-payload'
import { redis } from '@/lib/redis'
import { logLead, findDeliveredSubmit } from '@/lib/leads/db-logger'
import { PODIO_FALLBACK_URL, PODIO_FULL_SUBMIT_URL, WEBHOOK_TIMEOUT_MS } from '@/lib/leads/constants'
import { isRateLimited } from '@/lib/leads/rate-limit'
import type { LeadSubmission, TrackingParams } from '@/lib/leads/types'
import { captureServer } from '@/lib/analytics/server'
import { getPageType } from '@/lib/analytics/page-type'
import { SERVER_EVENTS } from '@/lib/analytics/events'
import { sendEmail } from '@/lib/funnel-report/send-email'

interface LeadResponse {
  success: boolean
  leadId?: string
  message?: string
  error?: string
}

// Default tracking params for backwards compatibility with old form payloads
function emptyTracking(): TrackingParams {
  return {
    utm_source: '', utm_medium: '', utm_term: '', utm_content: '',
    utm_campaign: '', utm_campaign_id: '',
    first_utm_source: '', first_utm_medium: '', first_utm_term: '',
    first_utm_content: '', first_utm_campaign: '',
    gclid: '', msclkid: '', fbclid: '', wbraid: '', gbraid: '',
    original_referrer: '', landing_page: '', referrer: '', form_url: '',
    gaclientid: '', organic_source: '', organic_source_str: '',
    traffic_source: 'Direct', first_traffic_source: 'Direct',
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<LeadResponse>> {
  try {
    // Rate limit by IP — 5 submissions per minute
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip') || ''
    if (await isRateLimited(ip)) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again in a minute.' },
        { status: 429 }
      )
    }

    const data = await request.json()

    // Honeypot check — bots fill hidden fields, real users don't
    if (data._hp) {
      console.log('Honeypot triggered:', { ip, formId: data.formId, pageUrl: data.pageUrl })
      return NextResponse.json({
        success: true,
        leadId: `hp_${Date.now()}`,
        message: 'Thank you! We will contact you within 24 hours.',
      })
    }

    const isLandForm = typeof data.formId === 'string' && data.formId.startsWith('land-')

    // Validate required fields
    if (isLandForm) {
      if (!data.email) {
        return NextResponse.json(
          { success: false, error: 'Email is required' },
          { status: 400 }
        )
      }
    } else {
      if (!data.address || !data.phone) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields: address and phone are required' },
          { status: 400 }
        )
      }
    }

    // Validate address (skip for land forms — address is synthetic)
    if (!isLandForm && data.address.trim().length < 5) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid address' },
        { status: 400 }
      )
    }

    // Validate phone
    const phoneRegex = /^\+?[0-9()\-.\s]{7,20}$/
    const cleanPhone = data.phone ? data.phone.replace(/\s/g, '') : ''
    if (cleanPhone && !phoneRegex.test(cleanPhone)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid phone number' },
        { status: 400 }
      )
    }

    // Validate email if provided
    if (data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(data.email)) {
        return NextResponse.json(
          { success: false, error: 'Please enter a valid email address' },
          { status: 400 }
        )
      }
    }

    // Idempotency: if this sessionToken already has a delivered form_submit, return success
    if (data.sessionToken) {
      const existingId = await findDeliveredSubmit(data.sessionToken)
      if (existingId) {
        console.log('[Leads] Duplicate submission detected, returning existing:', { sessionToken: data.sessionToken, existingId })
        return NextResponse.json({
          success: true,
          leadId: `existing_${existingId}`,
          message: 'Thank you! We will contact you within 24 hours.',
        })
      }
    }

    // Generate unique lead ID
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 11)
    const leadId = `lead_${timestamp}_${randomStr}`

    // Server-side context (ip already extracted above for rate limiting)
    const userAgent = request.headers.get('user-agent') || ''

    // Build the LeadSubmission — supports both old and new form payloads
    const submission: LeadSubmission = {
      name: data.name,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: cleanPhone,
      email: data.email?.trim() || undefined,
      address: (data.address || '').trim(),
      howDidYouHear: data.howDidYouHear || undefined,
      role: data.role || undefined,
      interest: data.interest || undefined,
      lotType: data.lotType || undefined,
      budget: data.budget || undefined,
      message: data.message || undefined,
      formId: data.formId || 'unknown',
      formVariant: data.formVariant || 'unknown',
      pageUrl: data.pageUrl || '',
      sessionToken: data.sessionToken,
      tracking: data.tracking || emptyTracking(),
    }

    // Merge any HandL cookie data sent from the client
    const handlData = data.handlCookies || {}

    // Build Gravity Forms-compatible webhook payload
    const webhookPayload = buildWebhookPayload(submission, { ip, userAgent })

    // Overlay HandL cookie values that can only come from the client
    if (handlData.handlID) webhookPayload['handlID (HandL)'] = handlData.handlID
    if (handlData._fbc) webhookPayload['_fbc (HandL)'] = handlData._fbc
    if (handlData._fbp) webhookPayload['_fbp (HandL)'] = handlData._fbp
    if (handlData.handl_landing_page_base) {
      webhookPayload['handl_landing_page_base (HandL)'] = handlData.handl_landing_page_base
    }
    if (handlData.handl_ref_domain) {
      webhookPayload['handl_ref_domain (HandL)'] = handlData.handl_ref_domain
    }
    if (handlData.handl_url_base) {
      webhookPayload['handl_url_base (HandL)'] = handlData.handl_url_base
    }

    // Log lead (partial phone for privacy)
    console.log('New lead received:', {
      leadId,
      address: submission.address,
      phone: '***-***-' + cleanPhone.slice(-4),
      source: submission.tracking.utm_source || 'direct',
      formId: submission.formId,
      pageUrl: submission.pageUrl,
    })

    // Send to n8n webhook + Podio full submission destination in parallel
    const webhookUrl = process.env.LEADS_WEBHOOK_URL
    let n8nDelivered = false
    let podioDelivered = false
    let webhookError: string | undefined
    const body = JSON.stringify(webhookPayload)

    // Always fire to Podio full submit (fire-and-forget, doesn't affect delivery status)
    fetch(PODIO_FULL_SUBMIT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    }).then(res => {
      if (!res.ok) console.error('[Leads] Podio full submit returned:', res.status)
      else console.log('[Leads] Sent to Podio full submit destination')
    }).catch(err => console.error('[Leads] Podio full submit failed:', err))

    if (webhookUrl) {
      try {
        const res = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
        })
        n8nDelivered = res.ok
        if (!res.ok) {
          webhookError = `Webhook returned ${res.status}`
          console.error('Webhook returned non-OK status:', res.status)
        }
      } catch (err) {
        webhookError = err instanceof Error ? err.message : 'Unknown error'
        console.error('Failed to send to webhook:', err)
      }
    }

    // If n8n failed, try Podio immediately as fallback for full submissions
    if (!n8nDelivered) {
      try {
        const podioRes = await fetch(PODIO_FALLBACK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookPayload),
          signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
        })
        podioDelivered = podioRes.ok
        if (podioRes.ok) {
          console.log('[Leads] Sent to Podio fallback successfully')
        } else {
          console.error('[Leads] Podio fallback returned:', podioRes.status)
        }
      } catch (podioErr) {
        console.error('[Leads] Podio fallback failed:', podioErr)
      }
    }

    // Determine overall delivery status
    const delivered = n8nDelivered || podioDelivered
    const status = n8nDelivered
      ? 'delivered' as const
      : podioDelivered
        ? 'fallback_delivered' as const
        : 'failed' as const

    // Log to Postgres synchronously so the idempotency check can find it.
    // logLead throws on form_submit failures — we catch here but log loudly
    // so it surfaces in Vercel function error logs. The lead was already
    // delivered to n8n/Podio, so the user response is unaffected.
    try {
      await logLead({
        sessionToken: submission.sessionToken || leadId,
        submissionType: 'form_submit',
        status,
        payload: webhookPayload as unknown as Record<string, unknown>,
        fields: {
          address: submission.address,
          phone: submission.phone,
          name: submission.name,
          firstName: submission.firstName,
          lastName: submission.lastName,
          email: submission.email,
        },
        formId: submission.formId,
        pageUrl: submission.pageUrl,
        ip,
        userAgent,
        errorMessage: webhookError,
        gaClientId: submission.tracking.gaclientid || undefined,
        handlId: handlData.handlID || undefined,
      })
    } catch (err) {
      // This is a CRITICAL ops error — the lead was delivered but the DB
      // audit trail is broken. Log with enough detail to diagnose.
      console.error('[Leads] CRITICAL: form_submit DB write failed.', {
        leadId,
        address: submission.address,
        sessionToken: submission.sessionToken,
        error: err instanceof Error ? err.message : String(err),
      })
    }

    // Clean up partial lead from Redis in background
    after(async () => {
      if (submission.sessionToken) {
        try { await redis.del(`partial:${submission.sessionToken}`) }
        catch (err) { console.error('[Leads] Failed to clean up partial:', err) }
      }
    })

    // Email notification — always fires regardless of n8n/Podio delivery
    // status, so a new lead is never missed even if those destinations fail.
    after(async () => {
      const toEmail = process.env.REPORT_RECIPIENT_EMAIL || 'parker@paperlotland.com'
      const fromEmail = process.env.REPORT_FROM_EMAIL || 'onboarding@resend.dev'
      try {
        await sendEmail({
          to: toEmail,
          from: fromEmail,
          subject: `New Lead: ${submission.firstName || submission.name || 'Unknown'} ${submission.lastName || ''}`.trim(),
          html: `
            <h2>New Lead Submission</h2>
            <p><strong>Name:</strong> ${submission.firstName || submission.name || ''} ${submission.lastName || ''}</p>
            <p><strong>Email:</strong> ${submission.email || 'Not provided'}</p>
            <p><strong>Phone:</strong> ${submission.phone || 'Not provided'}</p>
            <p><strong>Inquiry:</strong> ${submission.address || ''}</p>
            <p><strong>Role:</strong> ${submission.role || 'Not specified'}</p>
            <p><strong>Lot Type:</strong> ${submission.lotType || 'Not specified'}</p>
            <p><strong>Budget:</strong> ${submission.budget || 'Not specified'}</p>
            <p><strong>Message:</strong> ${submission.message || 'None'}</p>
            <p><strong>Form:</strong> ${submission.formId}</p>
            <p><strong>Page:</strong> ${submission.pageUrl}</p>
            <p><strong>Delivery status:</strong> ${status}</p>
          `,
        })
        console.log('[Leads] Notification email sent for', leadId)
      } catch (err) {
        console.error('[Leads] Failed to send notification email:', err)
      }
    })

    // Mirror to PostHog as a server-side conversion backstop. Uses lead_id
    // as $insert_id so it de-duplicates against the client `lead_submission`
    // event when the client successfully fires it.
    after(async () => {
      const pathname = (() => {
        try { return new URL(submission.pageUrl).pathname } catch { return submission.pageUrl || '/' }
      })()
      const source = n8nDelivered
        ? 'n8n'
        : podioDelivered
          ? 'podio_fallback'
          : 'n8n'
      await captureServer(
        leadId,
        SERVER_EVENTS.LEAD_SUBMISSION_SERVER,
        {
          source,
          status,
          attempts: 1,
          form_id: submission.formId,
          form_variant: submission.formVariant,
          page_type: getPageType(pathname),
          page_url: submission.pageUrl,
          utm_source: submission.tracking.utm_source || undefined,
          utm_medium: submission.tracking.utm_medium || undefined,
          utm_campaign: submission.tracking.utm_campaign || undefined,
        },
        { insertId: leadId }
      )
    })

    if (delivered) {
      return NextResponse.json({
        success: true,
        leadId,
        message: 'Thank you! We will contact you within 24 hours.',
      })
    }

    // Both n8n and Podio failed — tell the user to call directly
    return NextResponse.json({
      success: false,
      leadId,
      error: 'We had trouble processing your request. Please call us directly for immediate assistance.',
    }, { status: 503 })
  } catch (error) {
    console.error('Lead submission error:', error)

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request format' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'An error occurred. Please try again or call us directly.' },
      { status: 500 }
    )
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({ status: 'ok', endpoint: 'leads' })
}
