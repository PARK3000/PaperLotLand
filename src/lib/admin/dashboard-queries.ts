/**
 * Dashboard data queries for the admin panel.
 * Fetches real-time lead metrics from Postgres and session data from GA4.
 */

import { getDb } from '@/lib/db'
import { fetchGA4TopLine, type GA4TopLine } from '@/lib/funnel-report/ga4'
import { FORM_LABELS, type DashboardData, type PeriodKey } from './dashboard-types'

export type { DashboardData }

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'America/Los_Angeles',
  })
}

function stripDomain(url: string | null): string {
  if (!url) return '/'
  try {
    return new URL(url).pathname || '/'
  } catch {
    return url
  }
}

async function fetchGA4Safe(start: string, end: string): Promise<GA4TopLine | null> {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_B64) return null
  try {
    return await fetchGA4TopLine(start, end)
  } catch (err) {
    console.warn('[dashboard] GA4 fetch failed:', err instanceof Error ? err.message : err)
    return null
  }
}

/** Compute start/end dates (YYYY-MM-DD) and day count for a given period key */
function periodRange(key: PeriodKey): { start: string; end: string; days: number } {
  const now = new Date()
  const end = now.toISOString().slice(0, 10)

  switch (key) {
    case 'today': {
      return { start: end, end, days: 1 }
    }
    case 'this_week': {
      // Week starts Monday
      const dow = now.getDay()
      const diff = dow === 0 ? 6 : dow - 1 // days since Monday
      const monday = new Date(now)
      monday.setDate(now.getDate() - diff)
      return { start: monday.toISOString().slice(0, 10), end, days: diff + 1 }
    }
    case 'last_7': {
      const d = new Date(now)
      d.setDate(d.getDate() - 6)
      return { start: d.toISOString().slice(0, 10), end, days: 7 }
    }
    case 'this_month': {
      const first = new Date(now.getFullYear(), now.getMonth(), 1)
      const days = now.getDate()
      return { start: first.toISOString().slice(0, 10), end, days }
    }
    case 'last_30':
    default: {
      const d = new Date(now)
      d.setDate(d.getDate() - 29)
      return { start: d.toISOString().slice(0, 10), end, days: 30 }
    }
  }
}

// ---------------------------------------------------------------------------
// Main orchestrator
// ---------------------------------------------------------------------------

export async function fetchDashboardData(period: PeriodKey = 'last_30'): Promise<DashboardData | null> {
  if (!process.env.DATABASE_URL) return null

  const { start: periodStart, end: periodEnd, days: periodDays } = periodRange(period)

  try {
    const sql = getDb()

    const [
      totalResult,
      sourcesResult,
      pagesResult,
      recentResult,
      trendResult,
      deliveryResult,
      topFormResult,
      funnelResult,
      velocityResult,
      ga4,
    ] = await Promise.all([
      // 1. Total leads
      sql`
        SELECT COUNT(*)::int AS total
        FROM leads
        WHERE submission_type = 'form_submit'
          AND status IN ('delivered', 'fallback_delivered')
          AND created_at >= ${periodStart}::date
          AND created_at < (${periodEnd}::date + INTERVAL '1 day')
      `,
      // 2. Leads by traffic source
      sql`
        SELECT
          COALESCE(NULLIF(payload->>'traffic_source', ''), 'Direct') AS source,
          COUNT(*)::int AS count
        FROM leads
        WHERE submission_type = 'form_submit'
          AND status IN ('delivered', 'fallback_delivered')
          AND created_at >= ${periodStart}::date
          AND created_at < (${periodEnd}::date + INTERVAL '1 day')
        GROUP BY 1
        ORDER BY count DESC
        LIMIT 8
      `,
      // 3. Top converting pages (fetch more for donut grouping)
      sql`
        SELECT
          COALESCE(
            NULLIF(REGEXP_REPLACE(page_url, '^https?://[^/]+', ''), ''),
            '/'
          ) AS page,
          COUNT(*)::int AS count
        FROM leads
        WHERE submission_type = 'form_submit'
          AND status IN ('delivered', 'fallback_delivered')
          AND created_at >= ${periodStart}::date
          AND created_at < (${periodEnd}::date + INTERVAL '1 day')
        GROUP BY 1
        ORDER BY count DESC
        LIMIT 20
      `,
      // 4. Recent leads (always last 12 regardless of period)
      sql`
        SELECT
          created_at,
          payload->>'Name (First)' AS first_name,
          payload->>'Name (Last)' AS last_name,
          COALESCE(NULLIF(payload->>'traffic_source', ''), 'Direct') AS source,
          page_url,
          form_id
        FROM leads
        WHERE submission_type = 'form_submit'
          AND status IN ('delivered', 'fallback_delivered')
        ORDER BY created_at DESC
        LIMIT 12
      `,
      // 5. Weekly trend (always compares last 7 vs prior 7, regardless of period filter)
      sql`
        SELECT
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::int AS this_week,
          COUNT(*) FILTER (
            WHERE created_at >= NOW() - INTERVAL '14 days'
              AND created_at < NOW() - INTERVAL '7 days'
          )::int AS last_week
        FROM leads
        WHERE submission_type = 'form_submit'
          AND status IN ('delivered', 'fallback_delivered')
      `,
      // 6. Delivery rate
      sql`
        SELECT
          COUNT(*) FILTER (WHERE status IN ('delivered', 'fallback_delivered'))::int AS delivered,
          COUNT(*)::int AS total
        FROM leads
        WHERE submission_type = 'form_submit'
          AND created_at >= ${periodStart}::date
          AND created_at < (${periodEnd}::date + INTERVAL '1 day')
      `,
      // 7. Top form variant
      sql`
        SELECT form_id, COUNT(*)::int AS count
        FROM leads
        WHERE submission_type = 'form_submit'
          AND status IN ('delivered', 'fallback_delivered')
          AND created_at >= ${periodStart}::date
          AND created_at < (${periodEnd}::date + INTERVAL '1 day')
        GROUP BY 1
        ORDER BY count DESC
        LIMIT 1
      `,
      // 8. Funnel — form activity stages
      sql`
        WITH session_stages AS (
          SELECT
            session_token,
            BOOL_OR(submission_type IN ('address_selected', 'address_submit', 'partial_update', 'form_submit')) AS has_any_activity,
            BOOL_OR(submission_type = 'address_submit') AS has_step1,
            BOOL_OR(submission_type = 'form_submit' AND status IN ('delivered','fallback_delivered')) AS has_submit
          FROM leads
          WHERE created_at >= ${periodStart}::date
            AND created_at < (${periodEnd}::date + INTERVAL '1 day')
          GROUP BY session_token
        )
        SELECT
          COUNT(*) FILTER (WHERE has_any_activity)::int AS started,
          COUNT(*) FILTER (WHERE has_step1)::int AS step1_done,
          COUNT(*) FILTER (WHERE has_submit)::int AS converted
        FROM session_stages
      `,
      // 9. Lead velocity (today + period total)
      sql`
        SELECT
          COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)::int AS today,
          COUNT(*)::int AS period_total
        FROM leads
        WHERE submission_type = 'form_submit'
          AND status IN ('delivered', 'fallback_delivered')
          AND created_at >= ${periodStart}::date
          AND created_at < (${periodEnd}::date + INTERVAL '1 day')
      `,
      // 10. GA4 (optional)
      fetchGA4Safe(periodStart, periodEnd),
    ])

    // --- Transform ---

    const totalLeads = (totalResult[0]?.total as number) || 0

    const leadsBySource = (sourcesResult as { source: string; count: number }[]).map((r) => ({
      label: r.source,
      count: r.count,
    }))

    // Build top 4 + "Others" for donut chart
    const allPages = (pagesResult as { page: string; count: number }[]).map((r) => ({
      page: r.page || '/',
      count: r.count,
    }))
    const top4Pages = allPages.slice(0, 4)
    const othersCount = allPages.slice(4).reduce((sum, p) => sum + p.count, 0)
    const topConvertingPages = othersCount > 0
      ? [...top4Pages, { page: 'Others', count: othersCount }]
      : top4Pages

    const recentLeads = (
      recentResult as {
        created_at: string
        first_name: string | null
        last_name: string | null
        source: string
        page_url: string | null
        form_id: string | null
      }[]
    ).map((r) => ({
      date: formatDate(r.created_at),
      name: [r.first_name, r.last_name].filter(Boolean).join(' ') || 'Unknown',
      source: r.source,
      page: stripDomain(r.page_url),
      form: FORM_LABELS[r.form_id || ''] || r.form_id || 'Unknown',
    }))

    // --- Build insights ---

    const thisWeek = (trendResult[0]?.this_week as number) || 0
    const lastWeek = (trendResult[0]?.last_week as number) || 0
    const trendPct = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : 0
    const trendUp = thisWeek >= lastWeek

    const delivered = (deliveryResult[0]?.delivered as number) || 0
    const totalSubmits = (deliveryResult[0]?.total as number) || 0
    const deliveryRate = totalSubmits > 0 ? Math.round((delivered / totalSubmits) * 100) : 100

    const topFormId = (topFormResult[0]?.form_id as string) || ''
    const topFormCount = (topFormResult[0]?.count as number) || 0
    const topFormLabel = FORM_LABELS[topFormId] || topFormId || 'N/A'

    // Funnel — "started" = any session with form activity
    const funnelStarted = (funnelResult[0]?.started as number) || 0
    const funnelStep1 = (funnelResult[0]?.step1_done as number) || 0
    const funnelConverted = (funnelResult[0]?.converted as number) || 0
    const funnelRate = funnelStarted > 0 ? Math.round((funnelConverted / funnelStarted) * 100) : 0

    // CVR = leads / GA4 sessions (site-wide conversion rate)
    const ga4Sessions = ga4 ? Math.round(ga4.sessions) : 0
    const cvr = ga4Sessions > 0 ? Math.round((totalLeads / ga4Sessions) * 100 * 10) / 10 : 0
    const cvrAvailable = ga4Sessions > 0

    // Velocity
    const todayLeads = (velocityResult[0]?.today as number) || 0
    const periodTotal = (velocityResult[0]?.period_total as number) || 0
    const dailyAvg = periodDays > 0 ? (periodTotal / periodDays).toFixed(1) : '0'

    const insights = [
      {
        label: 'Weekly trend',
        value: `${thisWeek} leads`,
        detail: lastWeek > 0
          ? `${trendUp ? '+' : ''}${trendPct}% vs last week (${lastWeek})`
          : 'No data from prior week',
        color: trendUp ? 'text-green-700' : 'text-red-700',
        bg: trendUp ? 'bg-green-50' : 'bg-red-50',
        border: trendUp ? 'border-green-200' : 'border-red-200',
      },
      {
        label: 'Lead velocity',
        value: `${dailyAvg}/day`,
        detail: `${todayLeads} today · ${periodTotal} in period`,
        color: 'text-indigo-700',
        bg: 'bg-indigo-50',
        border: 'border-indigo-200',
      },
      {
        label: 'CVR',
        value: cvrAvailable ? `${cvr}%` : '—',
        detail: cvrAvailable
          ? `${totalLeads} leads from ${ga4Sessions} sessions`
          : 'GA4 unavailable',
        color: cvrAvailable
          ? (cvr >= 5 ? 'text-green-700' : cvr >= 2 ? 'text-yellow-700' : 'text-red-700')
          : 'text-gray-500',
        bg: cvrAvailable
          ? (cvr >= 5 ? 'bg-green-50' : cvr >= 2 ? 'bg-yellow-50' : 'bg-red-50')
          : 'bg-gray-50',
        border: cvrAvailable
          ? (cvr >= 5 ? 'border-green-200' : cvr >= 2 ? 'border-yellow-200' : 'border-red-200')
          : 'border-gray-200',
      },
      {
        label: 'Funnel drop-off',
        value: `${funnelRate}% convert`,
        detail: `${funnelStarted} started → ${funnelStep1} step 1 → ${funnelConverted} submitted`,
        color: funnelRate >= 30 ? 'text-green-700' : funnelRate >= 15 ? 'text-yellow-700' : 'text-red-700',
        bg: funnelRate >= 30 ? 'bg-green-50' : funnelRate >= 15 ? 'bg-yellow-50' : 'bg-red-50',
        border: funnelRate >= 30 ? 'border-green-200' : funnelRate >= 15 ? 'border-yellow-200' : 'border-red-200',
      },
      {
        label: 'Top form',
        value: topFormLabel,
        detail: `${topFormCount} conversions in period`,
        color: 'text-blue-700',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
      },
      {
        label: 'Delivery rate',
        value: `${deliveryRate}%`,
        detail: `${delivered} of ${totalSubmits} leads delivered successfully`,
        color: deliveryRate >= 95 ? 'text-green-700' : deliveryRate >= 80 ? 'text-yellow-700' : 'text-red-700',
        bg: deliveryRate >= 95 ? 'bg-green-50' : deliveryRate >= 80 ? 'bg-yellow-50' : 'bg-red-50',
        border: deliveryRate >= 95 ? 'border-green-200' : deliveryRate >= 80 ? 'border-yellow-200' : 'border-red-200',
      },
    ]

    return {
      totalLeads,
      leadsBySource,
      topConvertingPages,
      recentLeads,
      insights,
      ga4,
      periodStart,
      periodEnd,
      periodKey: period,
      periodDays,
    }
  } catch (err) {
    console.error('[dashboard] Failed to fetch data:', err)
    return null
  }
}
