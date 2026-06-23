/**
 * Buyers (disposition list) table setup for Vercel Postgres (Neon).
 *
 * Run once:
 *   npx tsx scripts/setup-buyers-db.ts
 *
 * Requires DATABASE_URL in .env.local
 */

import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'
import { resolve } from 'path'

try {
  const envFile = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8')
  for (const line of envFile.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx)
    const val = trimmed.slice(eqIdx + 1).replace(/^["']|["']$/g, '')
    if (!process.env[key]) process.env[key] = val
  }
} catch {
  // .env.local not found — rely on env vars being set already
}

async function setup() {
  if (!process.env.DATABASE_URL) {
    console.log('DATABASE_URL not set — skipping DB setup (already configured in production).')
    process.exit(0)
  }

  const sql = neon(process.env.DATABASE_URL)

  console.log('Creating buyers table...')

  await sql`
    CREATE TABLE IF NOT EXISTS buyers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      company TEXT,
      role TEXT,
      lot_type_preference TEXT,
      budget_range TEXT,
      jurisdiction_preference TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      tags TEXT[] DEFAULT '{}',
      notes TEXT,
      last_contacted_at DATE,
      lead_date TIMESTAMPTZ,
      lead_source TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT chk_buyers_status CHECK (status IN ('active', 'cold', 'closed'))
    )
  `

  // Add columns if this is run on an existing table
  await sql`ALTER TABLE buyers ADD COLUMN IF NOT EXISTS role TEXT`
  await sql`ALTER TABLE buyers ADD COLUMN IF NOT EXISTS lead_date TIMESTAMPTZ`
  await sql`ALTER TABLE buyers ADD COLUMN IF NOT EXISTS lead_source TEXT`

  await sql`CREATE INDEX IF NOT EXISTS idx_buyers_status ON buyers(status)`
  await sql`CREATE INDEX IF NOT EXISTS idx_buyers_created_at ON buyers(created_at DESC)`
  await sql`CREATE INDEX IF NOT EXISTS idx_buyers_lead_date ON buyers(lead_date DESC)`
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS uq_buyers_email ON buyers(email) WHERE email IS NOT NULL`

  console.log('Buyers table ready.')
}

setup().catch((err) => {
  console.error('Setup failed:', err)
  process.exit(1)
})
