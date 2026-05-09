/**
 * Cron job: Fallback recovery for failed lead submissions.
 *
 * Runs every minute. Two responsibilities:
 *
 * 1. PODIO FALLBACK: Finds leads in Postgres with status='failed' that are
 *    older than 5 minutes and sends the most complete version to Podio.
 *
 * 2. ABANDONED LEADS (legacy): Still scans Redis for partial leads that
 *    were never submitted (address only, no full form submit). Sends these
 *    to n8n after the threshold. This handles edge cases where the stream
 *    endpoint fails but Redis still has the data.
 */

import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { buildAbandonedWebhookPayload } from '@/lib/leads/webhook-payload'
import { getFailedLeadsForFallback, markFallbackSent } from '@/lib/leads/db-logger'
import { PODIO_FALLBACK_URL, WEBHOOK_TIMEOUT_MS } from '@/lib/leads/constants'
import type { PartialLeadRecord } from '@/lib/leads/types'
const FALLBACK_THRESHOLD_MINUTES = parseInt(process.env.FALLBACK_THRESHOLD_MINUTES || '5', 10)
const ABANDON_THRESHOLD_MINUTES = parseInt(process.env.ABANDON_THRESHOLD_MINUTES || '15', 10)

function classifyAbandon(record: PartialLeadRecord): string | null {
  if (!record.fields.address) return null
  const hasOtherFields = record.fields.phone || record.fields.name || record.fields.email
  return hasOtherFields ? 'Abandoned - Partial Form' : 'Abandoned - Address Only'
}

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (process.env.NODE_ENV === 'production') {
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const results = {
    podio_fallback: { sent: 0, failed: 0, skipped: 0 },
    abandoned_redis: { forwarded: 0, skipped: 0, errors: 0 },
  }

  // ── 1. Podio Fallback: Failed n8n sends → Podio ───────────────────────

  try {
    const failedLeads = await getFailedLeadsForFallback(FALLBACK_THRESHOLD_MINUTES)

    for (const lead of failedLeads) {
      // Only send full form_submit records to Podio (not partials)
      if (lead.submission_type !== 'form_submit') {
        results.podio_fallback.skipped++
        continue
      }

      try {
        const res = await fetch(PODIO_FALLBACK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(lead.payload),
          signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
        })

        if (res.ok) {
          await markFallbackSent(lead.session_token, 'fallback_delivered')
          results.podio_fallback.sent++
          console.log('[Cron:Fallback] Sent to Podio:', {
            sessionToken: lead.session_token.slice(0, 8) + '...',
            formId: lead.form_id,
          })
        } else {
          await markFallbackSent(lead.session_token, 'fallback_failed', `Podio returned ${res.status}`)
          results.podio_fallback.failed++
          console.error('[Cron:Fallback] Podio returned:', res.status)
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        await markFallbackSent(lead.session_token, 'fallback_failed', msg)
        results.podio_fallback.failed++
        console.error('[Cron:Fallback] Podio send failed:', msg)
      }
    }
  } catch (err) {
    console.error('[Cron:Fallback] Failed to query DB:', err)
  }

  // ── 2. Abandoned Redis Leads → n8n (legacy safety net) ────────────────

  const webhookUrl = process.env.LEADS_WEBHOOK_URL
  if (webhookUrl) {
    const cutoff = Date.now() - ABANDON_THRESHOLD_MINUTES * 60 * 1000
    let cursor: string | number = 0

    do {
      const result = await redis.scan(cursor, { match: 'partial:*', count: 50 })
      const [nextCursor, keys] = result as [string | number, string[]]
      cursor = nextCursor

      if (keys.length === 0) continue

      const records = await redis.mget<(PartialLeadRecord | null)[]>(...keys)

      for (let i = 0; i < keys.length; i++) {
        const record = records[i]
        if (!record) { results.abandoned_redis.skipped++; continue }

        const lastUpdated = new Date(record.lastUpdated).getTime()
        if (lastUpdated > cutoff) { results.abandoned_redis.skipped++; continue }

        const abandonType = classifyAbandon(record)
        if (!abandonType) { results.abandoned_redis.skipped++; continue }

        const payload = buildAbandonedWebhookPayload(record, abandonType)

        try {
          const res = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
          })

          if (res.ok) {
            await redis.del(keys[i])
            results.abandoned_redis.forwarded++
            console.log('[Cron:Abandoned] Forwarded:', {
              key: keys[i],
              type: abandonType,
            })
          } else {
            results.abandoned_redis.errors++
          }
        } catch {
          results.abandoned_redis.errors++
        }
      }
    } while (cursor !== 0 && cursor !== '0')
  }

  console.log('[Cron] Complete:', results)
  return NextResponse.json(results)
}
