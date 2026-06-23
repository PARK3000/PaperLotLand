import { getDb } from '@/lib/db'

export type BuyerStatus = 'active' | 'cold' | 'closed'

export interface Buyer {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  role: string | null
  lotTypePreference: string | null
  budgetRange: string | null
  jurisdictionPreference: string | null
  status: BuyerStatus
  tags: string[]
  notes: string | null
  lastContactedAt: string | null
  leadDate: string | null
  leadSource: string | null
  createdAt: string
  updatedAt: string
}

interface DbBuyerRow {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  role: string | null
  lot_type_preference: string | null
  budget_range: string | null
  jurisdiction_preference: string | null
  status: string
  tags: string[] | null
  notes: string | null
  last_contacted_at: string | null
  lead_date: string | Date | null
  lead_source: string | null
  created_at: string | Date
  updated_at: string | Date
}

function rowToBuyer(row: DbBuyerRow): Buyer {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    company: row.company,
    role: row.role,
    lotTypePreference: row.lot_type_preference,
    budgetRange: row.budget_range,
    jurisdictionPreference: row.jurisdiction_preference,
    status: row.status as BuyerStatus,
    tags: row.tags ?? [],
    notes: row.notes,
    lastContactedAt: row.last_contacted_at ? String(row.last_contacted_at).slice(0, 10) : null,
    leadDate: row.lead_date instanceof Date ? row.lead_date.toISOString() : (row.lead_date ? String(row.lead_date) : null),
    leadSource: row.lead_source,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
  }
}

export interface BuyersFilter {
  status?: BuyerStatus | 'all'
  search?: string
}

export async function getBuyers(filters: BuyersFilter = {}): Promise<Buyer[]> {
  const sql = getDb()
  const hasStatus = filters.status && filters.status !== 'all'
  const hasSearch = !!filters.search?.trim()

  if (hasStatus && hasSearch) {
    const term = `%${filters.search}%`
    const rows = (await sql`
      SELECT * FROM buyers
      WHERE status = ${filters.status}
        AND (name ILIKE ${term} OR email ILIKE ${term} OR phone ILIKE ${term} OR company ILIKE ${term})
      ORDER BY created_at DESC
    `) as DbBuyerRow[]
    return rows.map(rowToBuyer)
  }

  if (hasStatus) {
    const rows = (await sql`
      SELECT * FROM buyers WHERE status = ${filters.status} ORDER BY created_at DESC
    `) as DbBuyerRow[]
    return rows.map(rowToBuyer)
  }

  if (hasSearch) {
    const term = `%${filters.search}%`
    const rows = (await sql`
      SELECT * FROM buyers
      WHERE name ILIKE ${term} OR email ILIKE ${term} OR phone ILIKE ${term} OR company ILIKE ${term}
      ORDER BY created_at DESC
    `) as DbBuyerRow[]
    return rows.map(rowToBuyer)
  }

  const rows = (await sql`SELECT * FROM buyers ORDER BY created_at DESC`) as DbBuyerRow[]
  return rows.map(rowToBuyer)
}

export async function getBuyerById(id: string): Promise<Buyer | undefined> {
  const sql = getDb()
  const rows = (await sql`SELECT * FROM buyers WHERE id = ${id}`) as DbBuyerRow[]
  return rows[0] ? rowToBuyer(rows[0]) : undefined
}

export interface BuyerInput {
  name: string
  email?: string | null
  phone?: string | null
  company?: string | null
  role?: string | null
  lotTypePreference?: string | null
  budgetRange?: string | null
  jurisdictionPreference?: string | null
  status?: BuyerStatus
  tags?: string[]
  notes?: string | null
  lastContactedAt?: string | null
  leadDate?: string | null
  leadSource?: string | null
}

export async function createBuyer(data: BuyerInput): Promise<Buyer> {
  if (!data.name?.trim()) throw new Error('Buyer name is required')

  const sql = getDb()
  const rows = (await sql`
    INSERT INTO buyers (
      name, email, phone, company, role, lot_type_preference, budget_range,
      jurisdiction_preference, status, tags, notes, last_contacted_at, lead_date, lead_source
    )
    VALUES (
      ${data.name}, ${data.email ?? null}, ${data.phone ?? null}, ${data.company ?? null}, ${data.role ?? null},
      ${data.lotTypePreference ?? null}, ${data.budgetRange ?? null}, ${data.jurisdictionPreference ?? null},
      ${data.status ?? 'active'}, ${data.tags ?? []}, ${data.notes ?? null}, ${data.lastContactedAt ?? null},
      ${data.leadDate ?? null}, ${data.leadSource ?? null}
    )
    RETURNING *
  `) as DbBuyerRow[]
  return rowToBuyer(rows[0])
}

export async function updateBuyer(id: string, updates: Partial<BuyerInput>): Promise<Buyer> {
  const existing = await getBuyerById(id)
  if (!existing) throw new Error('Buyer not found')

  const sql = getDb()
  const rows = (await sql`
    UPDATE buyers SET
      name = ${updates.name ?? existing.name},
      email = ${updates.email !== undefined ? updates.email : existing.email},
      phone = ${updates.phone !== undefined ? updates.phone : existing.phone},
      company = ${updates.company !== undefined ? updates.company : existing.company},
      role = ${updates.role !== undefined ? updates.role : existing.role},
      lot_type_preference = ${updates.lotTypePreference !== undefined ? updates.lotTypePreference : existing.lotTypePreference},
      budget_range = ${updates.budgetRange !== undefined ? updates.budgetRange : existing.budgetRange},
      jurisdiction_preference = ${updates.jurisdictionPreference !== undefined ? updates.jurisdictionPreference : existing.jurisdictionPreference},
      status = ${updates.status ?? existing.status},
      tags = ${updates.tags ?? existing.tags},
      notes = ${updates.notes !== undefined ? updates.notes : existing.notes},
      last_contacted_at = ${updates.lastContactedAt !== undefined ? updates.lastContactedAt : existing.lastContactedAt},
      lead_date = ${updates.leadDate !== undefined ? updates.leadDate : existing.leadDate},
      lead_source = ${updates.leadSource !== undefined ? updates.leadSource : existing.leadSource},
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `) as DbBuyerRow[]
  if (!rows[0]) throw new Error('Buyer not found')
  return rowToBuyer(rows[0])
}

export interface LeadForBuyer {
  name?: string | null
  email?: string | null
  phone?: string | null
  role?: string | null
  lotType?: string | null
  budget?: string | null
  message?: string | null
  leadDate: string
  formId?: string | null
}

/**
 * Upserts a buyer from a website lead submission, keyed by email.
 * New leads create a buyer; repeat leads (same email) update contact
 * details and bump lead_date without clobbering manually-edited fields
 * like status or tags.
 */
export async function upsertBuyerFromLead(lead: LeadForBuyer): Promise<Buyer | null> {
  const email = lead.email?.trim().toLowerCase()
  if (!email) return null

  const name = lead.name?.trim() || email
  const phone = lead.phone?.trim() || null
  const role = lead.role?.trim() || null
  const lotType = lead.lotType?.trim() || null
  const budget = lead.budget?.trim() || null
  const message = lead.message?.trim() || null
  const sql = getDb()

  const rows = (await sql`
    INSERT INTO buyers (name, email, phone, role, lot_type_preference, budget_range, status, notes, lead_date, lead_source)
    VALUES (
      ${name}, ${email}, ${phone}, ${role}, ${lotType}, ${budget},
      'active', ${message}, ${lead.leadDate}, ${lead.formId ?? 'website'}
    )
    ON CONFLICT (email) WHERE email IS NOT NULL DO UPDATE SET
      phone = COALESCE(buyers.phone, EXCLUDED.phone),
      role = COALESCE(EXCLUDED.role, buyers.role),
      lot_type_preference = COALESCE(EXCLUDED.lot_type_preference, buyers.lot_type_preference),
      budget_range = COALESCE(EXCLUDED.budget_range, buyers.budget_range),
      notes = CASE
        WHEN EXCLUDED.notes IS NOT NULL AND EXCLUDED.notes <> '' THEN
          COALESCE(buyers.notes || E'\n---\n', '') || EXCLUDED.notes
        ELSE buyers.notes
      END,
      lead_date = GREATEST(COALESCE(buyers.lead_date, EXCLUDED.lead_date), EXCLUDED.lead_date),
      lead_source = COALESCE(buyers.lead_source, EXCLUDED.lead_source),
      updated_at = NOW()
    RETURNING *
  `) as DbBuyerRow[]

  return rows[0] ? rowToBuyer(rows[0]) : null
}

export interface ImportBuyersResult {
  inserted: number
  skippedDuplicateInFile: number
  skippedExisting: number
  skippedInvalid: number
}

export async function importBuyersByEmail(emails: string[]): Promise<ImportBuyersResult> {
  const sql = getDb()

  const seen = new Set<string>()
  let skippedDuplicateInFile = 0
  let skippedInvalid = 0
  const normalized: string[] = []

  for (const raw of emails) {
    const email = raw?.trim().toLowerCase()
    if (!email || !email.includes('@')) {
      if (raw?.trim()) skippedInvalid++
      continue
    }
    if (seen.has(email)) {
      skippedDuplicateInFile++
      continue
    }
    seen.add(email)
    normalized.push(email)
  }

  if (normalized.length === 0) {
    return { inserted: 0, skippedDuplicateInFile, skippedExisting: 0, skippedInvalid }
  }

  const existingRows = (await sql`
    SELECT email FROM buyers WHERE email = ANY(${normalized})
  `) as { email: string }[]
  const existingEmails = new Set(existingRows.map((r) => r.email.toLowerCase()))

  const toInsert = normalized.filter((e) => !existingEmails.has(e))
  const skippedExisting = normalized.length - toInsert.length

  if (toInsert.length > 0) {
    await sql`
      INSERT INTO buyers (name, email, status)
      SELECT email, email, 'active' FROM UNNEST(${toInsert}::text[]) AS email
    `
  }

  return { inserted: toInsert.length, skippedDuplicateInFile, skippedExisting, skippedInvalid }
}

export async function deleteBuyer(id: string): Promise<void> {
  const sql = getDb()
  const result = (await sql`DELETE FROM buyers WHERE id = ${id} RETURNING id`) as { id: string }[]
  if (result.length === 0) throw new Error('Buyer not found')
}
