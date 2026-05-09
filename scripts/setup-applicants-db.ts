/**
 * Creates the applicants table in Neon Postgres.
 * Run: npx tsx scripts/setup-applicants-db.ts
 */

import { getDb } from '../src/lib/db'

async function main() {
  const sql = getDb()

  console.log('Creating applicants table...')

  await sql`
    CREATE TABLE IF NOT EXISTS applicants (
      id              SERIAL PRIMARY KEY,
      application_id  TEXT NOT NULL UNIQUE,
      status          TEXT NOT NULL,
      full_name       TEXT,
      phone           TEXT,
      email           TEXT,
      position        TEXT,
      intro_video_url TEXT,
      resume_url      TEXT,
      source          TEXT,
      payload         JSONB,
      page_url        TEXT,
      ip              TEXT,
      user_agent      TEXT,
      error_message   TEXT,
      utm_source      TEXT,
      utm_medium      TEXT,
      utm_campaign    TEXT,
      utm_term        TEXT,
      utm_content     TEXT,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  // Idempotent additions for databases created before UTM columns existed
  await sql`ALTER TABLE applicants ADD COLUMN IF NOT EXISTS utm_source TEXT`
  await sql`ALTER TABLE applicants ADD COLUMN IF NOT EXISTS utm_medium TEXT`
  await sql`ALTER TABLE applicants ADD COLUMN IF NOT EXISTS utm_campaign TEXT`
  await sql`ALTER TABLE applicants ADD COLUMN IF NOT EXISTS utm_term TEXT`
  await sql`ALTER TABLE applicants ADD COLUMN IF NOT EXISTS utm_content TEXT`

  await sql`CREATE INDEX IF NOT EXISTS applicants_status_idx ON applicants (status)`
  await sql`CREATE INDEX IF NOT EXISTS applicants_created_at_idx ON applicants (created_at DESC)`
  await sql`CREATE INDEX IF NOT EXISTS applicants_email_idx ON applicants (email)`
  await sql`CREATE INDEX IF NOT EXISTS applicants_utm_source_idx ON applicants (utm_source)`

  console.log('Done. applicants table is ready.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
