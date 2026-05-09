/**
 * Lead Stream API — receives partial lead data and immediately forwards to n8n.
 *
 * Triggers:
 *   - address_selected: User picked from Google Places autocomplete
 *   - partial_update: 10-second interval while user is on form
 *   - address_submit: User submitted step 1 (address)
 *
 * Each send is also logged to Postgres for backup/fallback.
 */

import { after } from 'next/server'
import { buildPartialWebhookPayload, type HandlCookieValues } from '@/lib/leads/webhook-payload'
import { logLead } from '@/lib/leads/db-logger'
import { redis } from '@/lib/redis'
import { WEBHOOK_TIMEOUT_MS } from '@/lib/leads/constants'
import { isStreamRateLimited } from '@/lib/leads/rate-limit'
import type { TrackingParams } from '@/lib/leads/types'
import { captureServer } from '@/lib/analytics/server'
import { getPageType } from '@/lib/analytics/page-type'
import { SERVER_EVENTS } from '@/lib/analytics/events'

export const runtime = 'edge'

// Session tokens can be: UUID, "ga_XXXXXXXXXX.XXXXXXXXXX", or a HandL timestamp+random string
const SESSION_TOKEN_RE = /^[a-zA-Z0-9_.\-]{6,120}$/

const ALLOWED_FIELDS = ['address', 'phone', 'name', 'firstName', 'lastName', 'email', 'timeline'] as const
const FIELD_MAX_LEN: Record<string, number> = {
  address: 200,
  phone: 20,
  name: 100,
  firstName: 50,
  lastName: 50,
  email: 254,
  timeline: 500,
}

const VALID_TRIGGERS = ['address_selected', 'partial_update', 'address_submit', 'chat_transcript'] as const
type StreamTrigger = (typeof VALID_TRIGGERS)[number]

function sanitizeFields(raw: Record<string, unknown>): Record<string, string> {
  const fields: Record<string, string> = {}
  for (const name of ALLOWED_FIELDS) {
    const val = raw[name]
    if (typeof val === 'string' && val.trim().length > 0) {
      let cleaned = val
        .replace(/[\x00-\x1f\x7f]/g, '') // strip control characters (newlines, tabs, etc.)
        .slice(0, FIELD_MAX_LEN[name] || 200)
        .replace(/<[^>]*>/g, '')
        .trim()
      fields[name] = cleaned
    }
  }
  return fields
}

export async function POST(request: Request) {
  // Rate limit by IP — 5 requests per minute (shared with /api/leads)
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip') || ''
  if (await isStreamRateLimited(clientIp)) {
    return new Response(null, { status: 429 })
  }

  const text = await request.text()
  let data: Record<string, unknown>

  try {
    data = JSON.parse(text)
  } catch {
    return new Response(null, { status: 400 })
  }

  // Validate session token (UUID, "ga_..." or HandL timestamp format)
  const sessionToken = data.sessionToken
  if (typeof sessionToken !== 'string' || !SESSION_TOKEN_RE.test(sessionToken)) {
    return new Response(null, { status: 400 })
  }

  // Validate trigger
  const trigger = data.trigger as StreamTrigger
  if (!VALID_TRIGGERS.includes(trigger)) {
    return new Response(null, { status: 400 })
  }

  // Sanitize fields
  const rawFields =
    typeof data.fields === 'object' && data.fields !== null
      ? (data.fields as Record<string, unknown>)
      : {}
  const fields = sanitizeFields(rawFields)

  // Chat transcripts are valid even with no extracted fields — the transcript is the value
  if (Object.keys(fields).length === 0 && trigger !== 'chat_transcript') {
    return new Response(null, { status: 400 })
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const userAgent = request.headers.get('user-agent') || ''
  const formId = typeof data.formId === 'string' ? data.formId : 'unknown'
  const formVariant = typeof data.formVariant === 'string' ? data.formVariant : 'unknown'
  const pageUrl = typeof data.pageUrl === 'string' ? data.pageUrl : ''
  const tracking = typeof data.tracking === 'object' && data.tracking !== null
    ? (data.tracking as TrackingParams)
    : undefined
  const handlCookies = typeof data.handlCookies === 'object' && data.handlCookies !== null
    ? (data.handlCookies as HandlCookieValues)
    : undefined

  // Chat-specific extras (only present on chat_transcript trigger)
  const transcript = Array.isArray(data.transcript) ? data.transcript : undefined
  const chatMeta = typeof data.chatMeta === 'object' && data.chatMeta !== null
    ? (data.chatMeta as Record<string, unknown>)
    : undefined

  // Return 204 immediately, process in background
  after(async () => {
    const webhookUrl = process.env.LEADS_WEBHOOK_URL
    if (!webhookUrl) {
      console.error('[Stream] LEADS_WEBHOOK_URL not configured')
      return
    }

    // Build partial webhook payload (same GF-compatible structure)
    const basePayload = buildPartialWebhookPayload({
      sessionToken,
      formId,
      formVariant,
      pageUrl,
      fields,
      trigger,
      ip,
      userAgent,
      tracking,
      handlCookies,
    })
    // Format transcript as a human-readable multi-line string for Podio "Message" field.
    // Each turn is "Jamie: ..." or "Visitor: ...", separated by blank lines.
    const formattedTranscript = transcript
      ? transcript
          .filter((m: Record<string, unknown>) => typeof m.content === 'string')
          .map((m: Record<string, unknown>) => {
            const speaker = m.role === 'assistant' ? 'Casey' : 'Visitor'
            return `${speaker}: ${String(m.content).trim()}`
          })
          .join('\n\n')
      : ''

    // Attach chat-specific fields so n8n receives full context
    const payload = {
      ...basePayload,
      ...(transcript ? { transcript } : {}),
      // Podio "Message" multi-line text field — full readable transcript
      ...(formattedTranscript ? { 'Message': formattedTranscript } : {}),
      ...(chatMeta ? {
        'Chat Duration': chatMeta.duration,
        'Chat Duration Seconds': chatMeta.durationSeconds,
        'Message Count': chatMeta.messageCount,
        'Device': chatMeta.device,
        'Agent': chatMeta.agent,
        'Chat Engagement Type': chatMeta.engagementType,
        'Chat Started On': chatMeta.chatStartedOn,
        'Referrer': chatMeta.referrer || basePayload['Referrer'],
      } : {}),
    }

    // Send to n8n
    let delivered = false
    let errorMessage: string | undefined

    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
      })
      delivered = res.ok
      if (!res.ok) {
        errorMessage = `Webhook returned ${res.status}`
        console.error('[Stream] Webhook error:', res.status)
      }
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.error('[Stream] Webhook failed:', errorMessage)
    }

    // Log to Postgres
    try {
      await logLead({
        sessionToken,
        submissionType: trigger,
        status: delivered ? 'delivered' : 'failed',
        payload: payload as unknown as Record<string, unknown>,
        fields: fields as Record<string, string>,
        formId,
        pageUrl,
        ip,
        userAgent,
        errorMessage,
        gaClientId: tracking?.gaclientid || undefined,
        handlId: handlCookies?.handlID || undefined,
      })
    } catch (err) {
      console.error('[Stream] DB log failed:', err)
    }

    // Also update Redis for session state tracking (lightweight, keeps existing cron compat)
    try {
      const key = `partial:${sessionToken}`
      const existing = await redis.get<Record<string, unknown>>(key)

      // Merge incoming fields with existing record so fields don't disappear
      // between heartbeats (e.g. address from send #1 preserved when send #2 only has phone)
      const mergedFields = {
        ...(typeof existing?.fields === 'object' ? existing.fields as Record<string, string> : {}),
        ...fields,
      }

      const record = {
        sessionToken,
        formId,
        formVariant,
        pageUrl,
        fields: mergedFields,
        fieldsFilled: Object.keys(mergedFields),
        heartbeatCount:
          (typeof existing?.heartbeatCount === 'number' ? existing.heartbeatCount : 0) + 1,
        firstSeen:
          typeof existing?.firstSeen === 'string'
            ? existing.firstSeen
            : new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        ip,
        userAgent,
      }

      await redis.set(key, record, { ex: 86400 })
    } catch (err) {
      console.error('[Stream] Redis write failed:', err)
    }

    console.log('[Stream]', {
      trigger,
      sessionToken: sessionToken.slice(0, 8) + '...',
      formId,
      fields: Object.keys(fields),
      delivered,
    })

    // Mirror to PostHog so the partial-funnel matches what hits Postgres.
    // PII (phone/name/email/address) is stripped by captureServer's allowlist.
    try {
      const pathname = (() => {
        try { return new URL(pageUrl).pathname } catch { return pageUrl || '/' }
      })()
      await captureServer(sessionToken, SERVER_EVENTS.PARTIAL_LEAD_STREAM, {
        submission_type: trigger,
        fields_filled: Object.keys(fields),
        form_id: formId,
        form_variant: formVariant,
        page_type: getPageType(pathname),
        page_url: pageUrl,
        utm_source: tracking?.utm_source || undefined,
        utm_medium: tracking?.utm_medium || undefined,
        utm_campaign: tracking?.utm_campaign || undefined,
        delivered,
      })
    } catch (err) {
      console.error('[Stream] PostHog capture failed:', err)
    }

    // Email alert for chat transcripts (mirrors the previous widget's notification)
    if (trigger === 'chat_transcript') {
      try {
        const resendKey = process.env.RESEND_API_KEY
        const toEmail = process.env.REPORT_RECIPIENT_EMAIL || 'parker@paperlotland.com'
        const fromEmail = process.env.REPORT_FROM_EMAIL || 'onboarding@resend.dev'
        if (resendKey) {
          const name = fields.name || `${fields.firstName || ''} ${fields.lastName || ''}`.trim() || 'Unknown'
          const phone = fields.phone || ''
          const address = fields.address || ''
          const email = fields.email || ''
          const timeline = fields.timeline || ''
          const duration = chatMeta?.duration || ''
          const device = chatMeta?.device || ''
          const startedOn = chatMeta?.chatStartedOn || pageUrl
          const referrer = chatMeta?.referrer || ''
          const msgCount = chatMeta?.messageCount ?? ''

          const transcriptHtml = formattedTranscript
            ? formattedTranscript
                .split('\n\n')
                .map((line: string) => {
                  const isCasey = line.startsWith('Casey:')
                  return `<div style="margin-bottom:10px;padding:10px 12px;border-radius:8px;background:${isCasey ? '#f0f4ff' : '#f9fafb'};border-left:3px solid ${isCasey ? '#1e3a5f' : '#c84848'}"><span style="font-weight:600;color:${isCasey ? '#1e3a5f' : '#c84848'}">${isCasey ? 'Casey' : 'Visitor'}</span><br><span style="color:#374151">${line.replace(/^(Casey|Visitor): /, '').replace(/\n/g, '<br>')}</span></div>`
                })
                .join('')
            : '<p style="color:#6b7280;font-style:italic">No transcript available.</p>'

          const html = `
<!DOCTYPE html><html><body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f3f4f6">
<div style="max-width:600px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.1)">
  <div style="background:#1e3a5f;padding:20px 24px">
    <h2 style="margin:0;color:#fff;font-size:18px">💬 New Chat Lead — Chat Widget</h2>
    <p style="margin:4px 0 0;color:#a8c4e0;font-size:13px">PaperLotLand</p>
  </div>
  <div style="padding:24px">
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px">
      <tr><td style="padding:7px 0;color:#6b7280;width:130px">Name</td><td style="padding:7px 0;font-weight:600;color:#111">${name || '—'}</td></tr>
      <tr><td style="padding:7px 0;color:#6b7280">Phone</td><td style="padding:7px 0;font-weight:600;color:#111">${phone || '—'}</td></tr>
      <tr><td style="padding:7px 0;color:#6b7280">Email</td><td style="padding:7px 0;color:#111">${email || '—'}</td></tr>
      <tr><td style="padding:7px 0;color:#6b7280">Address</td><td style="padding:7px 0;color:#111">${address || '—'}</td></tr>
      ${timeline ? `<tr><td style="padding:7px 0;color:#6b7280">In a perfect world</td><td style="padding:7px 0;color:#111">${timeline}</td></tr>` : ''}
      <tr><td style="padding:7px 0;color:#6b7280">Duration</td><td style="padding:7px 0;color:#111">${duration}${msgCount ? ` · ${msgCount} messages` : ''}</td></tr>
      <tr><td style="padding:7px 0;color:#6b7280">Device</td><td style="padding:7px 0;color:#111">${device || '—'}</td></tr>
      <tr><td style="padding:7px 0;color:#6b7280">Page</td><td style="padding:7px 0;color:#111">${startedOn || pageUrl || '—'}</td></tr>
      ${referrer ? `<tr><td style="padding:7px 0;color:#6b7280">Referrer</td><td style="padding:7px 0;color:#111">${referrer}</td></tr>` : ''}
    </table>
    <h3 style="margin:0 0 12px;font-size:14px;color:#374151;text-transform:uppercase;letter-spacing:.05em">Conversation</h3>
    ${transcriptHtml}
  </div>
  <div style="padding:12px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af">
    Sent by the Chat Widget · PaperLotLand
  </div>
</div>
</body></html>`

          const subjectName = name && name !== 'Unknown' ? name : (phone || 'New visitor')
          const subjectAddr = address ? ` — ${address}` : ''

          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${resendKey}` },
            body: JSON.stringify({ from: fromEmail, to: [toEmail], subject: `💬 Chat Lead: ${subjectName}${subjectAddr}`, html }),
          })
        }
      } catch (err) {
        console.error('[Stream] Chat alert email failed:', err)
      }
    }
  })

  return new Response(null, { status: 204 })
}
