/**
 * Leads listing queries for the admin leads page.
 * Supports pagination, filtering by source/form, and search.
 */

import { getDb } from '@/lib/db'
import { FORM_LABELS } from './dashboard-types'

export { FORM_LABELS }

export interface LeadRow {
  id: number
  date: string
  name: string
  email: string
  phone: string
  address: string
  source: string
  page: string
  form: string
  status: string
}

export interface LeadsResult {
  leads: LeadRow[]
  total: number
  page: number
  perPage: number
  totalPages: number
}

export interface LeadsFilter {
  source?: string
  form?: string
  search?: string
  page?: number
  perPage?: number
}

function formatDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
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

type RawLeadRow = {
  id: number
  created_at: string
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  address: string | null
  source: string
  page_url: string | null
  form_id: string | null
  status: string
}

function transformRow(r: RawLeadRow): LeadRow {
  return {
    id: r.id,
    date: formatDate(r.created_at),
    name: [r.first_name, r.last_name].filter(Boolean).join(' ') || 'Unknown',
    email: r.email || '',
    phone: r.phone || '',
    address: r.address || '',
    source: r.source,
    page: stripDomain(r.page_url),
    form: FORM_LABELS[r.form_id || ''] || r.form_id || 'Unknown',
    status: r.status === 'delivered' ? 'Delivered' : r.status === 'fallback_delivered' ? 'Fallback' : r.status,
  }
}

export async function fetchLeads(filters: LeadsFilter = {}): Promise<LeadsResult | null> {
  if (!process.env.DATABASE_URL) return null

  const page = Math.max(1, filters.page || 1)
  const perPage = Math.min(100, Math.max(10, filters.perPage || 25))
  const offset = (page - 1) * perPage

  try {
    const sql = getDb()

    const hasSource = filters.source && filters.source !== 'all'
    const hasForm = filters.form && filters.form !== 'all'
    const hasSearch = !!filters.search?.trim()

    // Use conditional branches to keep queries parameterized
    // This avoids SQL injection while supporting dynamic filters
    if (hasSource && hasForm && hasSearch) {
      const term = `%${filters.search}%`
      const [countRes, rows] = await Promise.all([
        sql`SELECT COUNT(*)::int AS total FROM leads
            WHERE submission_type = 'form_submit' AND status IN ('delivered','fallback_delivered')
              AND COALESCE(NULLIF(payload->>'traffic_source',''),'Direct') = ${filters.source}
              AND form_id = ${filters.form}
              AND (payload->>'Name (First)' ILIKE ${term} OR payload->>'Name (Last)' ILIKE ${term} OR payload->>'Property Address' ILIKE ${term} OR payload->>'Email' ILIKE ${term} OR payload->>'Phone' ILIKE ${term})`,
        sql`SELECT id, created_at, payload->>'Name (First)' AS first_name, payload->>'Name (Last)' AS last_name, payload->>'Email' AS email, payload->>'Phone' AS phone, payload->>'Property Address' AS address, COALESCE(NULLIF(payload->>'traffic_source',''),'Direct') AS source, page_url, form_id, status
            FROM leads
            WHERE submission_type = 'form_submit' AND status IN ('delivered','fallback_delivered')
              AND COALESCE(NULLIF(payload->>'traffic_source',''),'Direct') = ${filters.source}
              AND form_id = ${filters.form}
              AND (payload->>'Name (First)' ILIKE ${term} OR payload->>'Name (Last)' ILIKE ${term} OR payload->>'Property Address' ILIKE ${term} OR payload->>'Email' ILIKE ${term} OR payload->>'Phone' ILIKE ${term})
            ORDER BY created_at DESC LIMIT ${perPage} OFFSET ${offset}`,
      ])
      return buildResult(countRes, rows as RawLeadRow[], page, perPage)
    }

    if (hasSource && hasForm) {
      const [countRes, rows] = await Promise.all([
        sql`SELECT COUNT(*)::int AS total FROM leads
            WHERE submission_type = 'form_submit' AND status IN ('delivered','fallback_delivered')
              AND COALESCE(NULLIF(payload->>'traffic_source',''),'Direct') = ${filters.source}
              AND form_id = ${filters.form}`,
        sql`SELECT id, created_at, payload->>'Name (First)' AS first_name, payload->>'Name (Last)' AS last_name, payload->>'Email' AS email, payload->>'Phone' AS phone, payload->>'Property Address' AS address, COALESCE(NULLIF(payload->>'traffic_source',''),'Direct') AS source, page_url, form_id, status
            FROM leads
            WHERE submission_type = 'form_submit' AND status IN ('delivered','fallback_delivered')
              AND COALESCE(NULLIF(payload->>'traffic_source',''),'Direct') = ${filters.source}
              AND form_id = ${filters.form}
            ORDER BY created_at DESC LIMIT ${perPage} OFFSET ${offset}`,
      ])
      return buildResult(countRes, rows as RawLeadRow[], page, perPage)
    }

    if (hasSource && hasSearch) {
      const term = `%${filters.search}%`
      const [countRes, rows] = await Promise.all([
        sql`SELECT COUNT(*)::int AS total FROM leads
            WHERE submission_type = 'form_submit' AND status IN ('delivered','fallback_delivered')
              AND COALESCE(NULLIF(payload->>'traffic_source',''),'Direct') = ${filters.source}
              AND (payload->>'Name (First)' ILIKE ${term} OR payload->>'Name (Last)' ILIKE ${term} OR payload->>'Property Address' ILIKE ${term} OR payload->>'Email' ILIKE ${term} OR payload->>'Phone' ILIKE ${term})`,
        sql`SELECT id, created_at, payload->>'Name (First)' AS first_name, payload->>'Name (Last)' AS last_name, payload->>'Email' AS email, payload->>'Phone' AS phone, payload->>'Property Address' AS address, COALESCE(NULLIF(payload->>'traffic_source',''),'Direct') AS source, page_url, form_id, status
            FROM leads
            WHERE submission_type = 'form_submit' AND status IN ('delivered','fallback_delivered')
              AND COALESCE(NULLIF(payload->>'traffic_source',''),'Direct') = ${filters.source}
              AND (payload->>'Name (First)' ILIKE ${term} OR payload->>'Name (Last)' ILIKE ${term} OR payload->>'Property Address' ILIKE ${term} OR payload->>'Email' ILIKE ${term} OR payload->>'Phone' ILIKE ${term})
            ORDER BY created_at DESC LIMIT ${perPage} OFFSET ${offset}`,
      ])
      return buildResult(countRes, rows as RawLeadRow[], page, perPage)
    }

    if (hasForm && hasSearch) {
      const term = `%${filters.search}%`
      const [countRes, rows] = await Promise.all([
        sql`SELECT COUNT(*)::int AS total FROM leads
            WHERE submission_type = 'form_submit' AND status IN ('delivered','fallback_delivered')
              AND form_id = ${filters.form}
              AND (payload->>'Name (First)' ILIKE ${term} OR payload->>'Name (Last)' ILIKE ${term} OR payload->>'Property Address' ILIKE ${term} OR payload->>'Email' ILIKE ${term} OR payload->>'Phone' ILIKE ${term})`,
        sql`SELECT id, created_at, payload->>'Name (First)' AS first_name, payload->>'Name (Last)' AS last_name, payload->>'Email' AS email, payload->>'Phone' AS phone, payload->>'Property Address' AS address, COALESCE(NULLIF(payload->>'traffic_source',''),'Direct') AS source, page_url, form_id, status
            FROM leads
            WHERE submission_type = 'form_submit' AND status IN ('delivered','fallback_delivered')
              AND form_id = ${filters.form}
              AND (payload->>'Name (First)' ILIKE ${term} OR payload->>'Name (Last)' ILIKE ${term} OR payload->>'Property Address' ILIKE ${term} OR payload->>'Email' ILIKE ${term} OR payload->>'Phone' ILIKE ${term})
            ORDER BY created_at DESC LIMIT ${perPage} OFFSET ${offset}`,
      ])
      return buildResult(countRes, rows as RawLeadRow[], page, perPage)
    }

    if (hasSource) {
      const [countRes, rows] = await Promise.all([
        sql`SELECT COUNT(*)::int AS total FROM leads
            WHERE submission_type = 'form_submit' AND status IN ('delivered','fallback_delivered')
              AND COALESCE(NULLIF(payload->>'traffic_source',''),'Direct') = ${filters.source}`,
        sql`SELECT id, created_at, payload->>'Name (First)' AS first_name, payload->>'Name (Last)' AS last_name, payload->>'Email' AS email, payload->>'Phone' AS phone, payload->>'Property Address' AS address, COALESCE(NULLIF(payload->>'traffic_source',''),'Direct') AS source, page_url, form_id, status
            FROM leads
            WHERE submission_type = 'form_submit' AND status IN ('delivered','fallback_delivered')
              AND COALESCE(NULLIF(payload->>'traffic_source',''),'Direct') = ${filters.source}
            ORDER BY created_at DESC LIMIT ${perPage} OFFSET ${offset}`,
      ])
      return buildResult(countRes, rows as RawLeadRow[], page, perPage)
    }

    if (hasForm) {
      const [countRes, rows] = await Promise.all([
        sql`SELECT COUNT(*)::int AS total FROM leads
            WHERE submission_type = 'form_submit' AND status IN ('delivered','fallback_delivered')
              AND form_id = ${filters.form}`,
        sql`SELECT id, created_at, payload->>'Name (First)' AS first_name, payload->>'Name (Last)' AS last_name, payload->>'Email' AS email, payload->>'Phone' AS phone, payload->>'Property Address' AS address, COALESCE(NULLIF(payload->>'traffic_source',''),'Direct') AS source, page_url, form_id, status
            FROM leads
            WHERE submission_type = 'form_submit' AND status IN ('delivered','fallback_delivered')
              AND form_id = ${filters.form}
            ORDER BY created_at DESC LIMIT ${perPage} OFFSET ${offset}`,
      ])
      return buildResult(countRes, rows as RawLeadRow[], page, perPage)
    }

    if (hasSearch) {
      const term = `%${filters.search}%`
      const [countRes, rows] = await Promise.all([
        sql`SELECT COUNT(*)::int AS total FROM leads
            WHERE submission_type = 'form_submit' AND status IN ('delivered','fallback_delivered')
              AND (payload->>'Name (First)' ILIKE ${term} OR payload->>'Name (Last)' ILIKE ${term} OR payload->>'Property Address' ILIKE ${term} OR payload->>'Email' ILIKE ${term} OR payload->>'Phone' ILIKE ${term})`,
        sql`SELECT id, created_at, payload->>'Name (First)' AS first_name, payload->>'Name (Last)' AS last_name, payload->>'Email' AS email, payload->>'Phone' AS phone, payload->>'Property Address' AS address, COALESCE(NULLIF(payload->>'traffic_source',''),'Direct') AS source, page_url, form_id, status
            FROM leads
            WHERE submission_type = 'form_submit' AND status IN ('delivered','fallback_delivered')
              AND (payload->>'Name (First)' ILIKE ${term} OR payload->>'Name (Last)' ILIKE ${term} OR payload->>'Property Address' ILIKE ${term} OR payload->>'Email' ILIKE ${term} OR payload->>'Phone' ILIKE ${term})
            ORDER BY created_at DESC LIMIT ${perPage} OFFSET ${offset}`,
      ])
      return buildResult(countRes, rows as RawLeadRow[], page, perPage)
    }

    // No filters
    const [countRes, rows] = await Promise.all([
      sql`SELECT COUNT(*)::int AS total FROM leads
          WHERE submission_type = 'form_submit' AND status IN ('delivered','fallback_delivered')`,
      sql`SELECT id, created_at, payload->>'Name (First)' AS first_name, payload->>'Name (Last)' AS last_name, payload->>'Email' AS email, payload->>'Phone' AS phone, payload->>'Property Address' AS address, COALESCE(NULLIF(payload->>'traffic_source',''),'Direct') AS source, page_url, form_id, status
          FROM leads
          WHERE submission_type = 'form_submit' AND status IN ('delivered','fallback_delivered')
          ORDER BY created_at DESC LIMIT ${perPage} OFFSET ${offset}`,
    ])
    return buildResult(countRes, rows as RawLeadRow[], page, perPage)
  } catch (err) {
    console.error('[leads] Failed to fetch:', err)
    return null
  }
}

function buildResult(
  countRes: Record<string, unknown>[],
  rows: RawLeadRow[],
  page: number,
  perPage: number
): LeadsResult {
  const total = (countRes[0]?.total as number) || 0
  return {
    leads: rows.map(transformRow),
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  }
}

export async function fetchLeadFilterOptions(): Promise<{
  sources: string[]
  forms: string[]
} | null> {
  if (!process.env.DATABASE_URL) return null

  try {
    const sql = getDb()
    const [sourcesResult, formsResult] = await Promise.all([
      sql`
        SELECT DISTINCT COALESCE(NULLIF(payload->>'traffic_source', ''), 'Direct') AS source
        FROM leads
        WHERE submission_type = 'form_submit'
          AND status IN ('delivered', 'fallback_delivered')
        ORDER BY source
      `,
      sql`
        SELECT DISTINCT form_id
        FROM leads
        WHERE submission_type = 'form_submit'
          AND status IN ('delivered', 'fallback_delivered')
          AND form_id IS NOT NULL
        ORDER BY form_id
      `,
    ])

    return {
      sources: (sourcesResult as { source: string }[]).map((r) => r.source),
      forms: (formsResult as { form_id: string }[]).map((r) => r.form_id),
    }
  } catch (err) {
    console.error('[leads] Failed to fetch filters:', err)
    return null
  }
}
