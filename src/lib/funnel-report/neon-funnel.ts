/**
 * Neon Postgres funnel queries for the weekly report.
 * Queries the leads table for funnel-stage counts and daily trends.
 */

import { getDb } from '@/lib/db'

export interface FunnelStage {
  addressSelected: number
  addressSubmit: number
  formSubmit: number
  totalSessions: number
}

export interface DailySubmit {
  day: string
  submits: number
}

export async function fetchFunnelStages(
  start: string,
  end: string
): Promise<FunnelStage> {
  const sql = getDb()
  const rows = await sql`
    WITH session_stages AS (
      SELECT
        session_token,
        BOOL_OR(submission_type = 'address_selected') AS reached_address_selected,
        BOOL_OR(submission_type = 'address_submit') AS reached_address_submit,
        BOOL_OR(submission_type = 'form_submit' AND status IN ('delivered','fallback_delivered')) AS reached_form_submit
      FROM leads
      WHERE created_at >= ${start}::date AND created_at < (${end}::date + INTERVAL '1 day')
      GROUP BY session_token
    )
    SELECT
      COUNT(*) FILTER (WHERE reached_address_selected)::int AS address_selected,
      COUNT(*) FILTER (WHERE reached_address_submit)::int AS address_submit,
      COUNT(*) FILTER (WHERE reached_form_submit)::int AS form_submit,
      COUNT(*)::int AS total_sessions
    FROM session_stages
  `
  const r = rows[0] || {}
  return {
    addressSelected: r.address_selected || 0,
    addressSubmit: r.address_submit || 0,
    formSubmit: r.form_submit || 0,
    totalSessions: r.total_sessions || 0,
  }
}

export async function fetchDailySubmits(
  start: string,
  end: string
): Promise<DailySubmit[]> {
  const sql = getDb()
  const rows = await sql`
    SELECT
      DATE(created_at AT TIME ZONE 'America/Los_Angeles') AS day,
      COUNT(*)::int AS submits
    FROM leads
    WHERE created_at >= ${start}::date AND created_at < (${end}::date + INTERVAL '1 day')
      AND submission_type = 'form_submit'
      AND status IN ('delivered','fallback_delivered')
    GROUP BY 1
    ORDER BY 1
  `
  return rows.map((r) => ({
    day: (r.day as Date).toISOString().slice(0, 10),
    submits: (r.submits as number) || 0,
  }))
}

export async function fetchDeliveryStats(start: string, end: string) {
  const sql = getDb()
  const rows = await sql`
    SELECT status, COUNT(*)::int AS n
    FROM leads
    WHERE created_at >= ${start}::date AND created_at < (${end}::date + INTERVAL '1 day')
      AND submission_type = 'form_submit'
    GROUP BY 1
  `
  const stats: Record<string, number> = {}
  for (const r of rows) stats[r.status as string] = r.n as number
  return stats
}
