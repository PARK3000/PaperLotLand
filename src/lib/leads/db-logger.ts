/**
 * Database logging for all lead submissions.
 * Every send (partial, address_submit, form_submit) gets logged to Postgres.
 * Used for backup, querying, export, and fallback recovery.
 */

import { getDb } from '@/lib/db'

export type SubmissionType =
  | 'address_selected'
  | 'partial_update'
  | 'address_submit'
  | 'form_submit'
  | 'chat_transcript'

export type LeadStatus =
  | 'delivered'
  | 'failed'
  | 'fallback_delivered'
  | 'fallback_failed'

interface LogLeadParams {
  sessionToken: string
  submissionType: SubmissionType
  status: LeadStatus
  payload: Record<string, unknown>
  fields?: Record<string, unknown>
  formId?: string
  pageUrl?: string
  ip?: string
  userAgent?: string
  errorMessage?: string
  gaClientId?: string
  handlId?: string
}

/**
 * Check if a form_submit for this sessionToken has already been delivered.
 * Returns the existing lead ID if found, null otherwise.
 *
 * IMPORTANT: On DB error, returns -1 (not null) so callers can distinguish
 * "definitely no duplicate" (null) from "DB is down, assume duplicate to be safe" (-1).
 * This prevents duplicate leads being sent when the DB is unreachable.
 */
export async function findDeliveredSubmit(sessionToken: string): Promise<number | null> {
  try {
    const sql = getDb()
    const rows = await sql`
      SELECT id FROM leads
      WHERE session_token = ${sessionToken}
        AND submission_type = 'form_submit'
        AND status IN ('delivered', 'fallback_delivered')
      LIMIT 1
    `
    return rows[0]?.id ?? null
  } catch (err) {
    console.error('[db-logger] CRITICAL: idempotency check failed, assuming duplicate to prevent double-send:', err)
    return -1
  }
}

/**
 * Log a lead to Postgres.
 *
 * For form_submit: throws on failure so callers can log loudly / alert.
 * For streaming events (partials, address_selected): catches silently (best-effort).
 */
export async function logLead(params: LogLeadParams): Promise<number | null> {
  try {
    const sql = getDb()
    const n8nAttempts = params.status === 'delivered' ? 1 : 0
    const result = await sql`
      INSERT INTO leads (
        session_token, submission_type, status, payload, fields,
        form_id, page_url, n8n_attempts, ip, user_agent, error_message,
        ga_client_id, handl_id
      ) VALUES (
        ${params.sessionToken},
        ${params.submissionType},
        ${params.status},
        ${JSON.stringify(params.payload)},
        ${JSON.stringify(params.fields || {})},
        ${params.formId || null},
        ${params.pageUrl || null},
        ${n8nAttempts},
        ${params.ip || null},
        ${params.userAgent || null},
        ${params.errorMessage || null},
        ${params.gaClientId || null},
        ${params.handlId || null}
      )
      ON CONFLICT (session_token, submission_type) DO UPDATE SET
        status        = EXCLUDED.status,
        payload       = EXCLUDED.payload,
        fields        = EXCLUDED.fields,
        n8n_attempts  = leads.n8n_attempts + EXCLUDED.n8n_attempts,
        error_message = EXCLUDED.error_message,
        ga_client_id  = COALESCE(EXCLUDED.ga_client_id, leads.ga_client_id),
        handl_id      = COALESCE(EXCLUDED.handl_id, leads.handl_id),
        updated_at    = NOW()
      RETURNING id
    `
    return result[0]?.id ?? null
  } catch (err) {
    // form_submit is the critical audit trail — throw so callers can alert
    if (params.submissionType === 'form_submit') {
      console.error('[db-logger] CRITICAL: form_submit DB write failed:', err)
      throw err
    }
    // Streaming/partial events are best-effort — log and continue
    console.error('[db-logger] DB write failed (non-critical):', err)
    return null
  }
}

export async function updateLeadStatus(
  id: number,
  status: LeadStatus,
  errorMessage?: string
): Promise<void> {
  try {
    const sql = getDb()
    await sql`
      UPDATE leads
      SET status = ${status},
          error_message = ${errorMessage || null},
          updated_at = NOW()
      WHERE id = ${id}
    `
  } catch (err) {
    console.error('[db-logger] Failed to update lead status:', err)
  }
}

/**
 * Get failed leads older than the threshold for Podio fallback.
 */
export async function getFailedLeadsForFallback(thresholdMinutes: number) {
  try {
    const sql = getDb()
    const rows = await sql`
      SELECT DISTINCT ON (session_token) *
      FROM leads
      WHERE status = 'failed'
        AND created_at < NOW() - INTERVAL '1 minute' * ${thresholdMinutes}
        AND podio_attempts < 3
      ORDER BY session_token, created_at DESC
    `
    return rows
  } catch (err) {
    console.error('[db-logger] Failed to query failed leads:', err)
    return []
  }
}

/**
 * Mark a lead as sent to Podio fallback.
 */
export async function markFallbackSent(
  sessionToken: string,
  status: 'fallback_delivered' | 'fallback_failed',
  errorMessage?: string
): Promise<void> {
  try {
    const sql = getDb()
    await sql`
      UPDATE leads
      SET status = ${status},
          podio_attempts = podio_attempts + 1,
          error_message = ${errorMessage || null},
          updated_at = NOW()
      WHERE session_token = ${sessionToken}
        AND status = 'failed'
    `
  } catch (err) {
    console.error('[db-logger] Failed to mark fallback:', err)
  }
}
