/**
 * Database setup script for Vercel Postgres (Neon).
 *
 * Run once after creating the database in Vercel dashboard:
 *   npx tsx scripts/setup-db.ts
 *
 * Requires DATABASE_URL in .env.local
 */

import { neon } from '@neondatabase/serverless'
import { createHash, randomUUID } from 'crypto'
// Load .env.local manually — dotenv is not a project dependency
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Default admin credentials — change via the Users page after first login
const DEFAULT_ADMIN_EMAIL = 'admin@webuyanyvegashouse.com'
const DEFAULT_ADMIN_PASSWORD = 'Admin@Vegas2026'
const DEFAULT_ADMIN_NAME = 'Admin'

function hashPassword(password: string, userId: string): string {
  const secret = process.env.ADMIN_SESSION_SECRET || 'wbavh-admin-secret-change-me'
  return createHash('sha256').update(`${password}:${userId}:${secret}`).digest('hex')
}

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

  console.log('Creating leads table...')

  await sql`
    CREATE TABLE IF NOT EXISTS leads (
      id SERIAL PRIMARY KEY,
      session_token TEXT NOT NULL,
      submission_type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      payload JSONB NOT NULL DEFAULT '{}',
      fields JSONB DEFAULT '{}',
      form_id TEXT,
      page_url TEXT,
      n8n_attempts INT DEFAULT 0,
      podio_attempts INT DEFAULT 0,
      error_message TEXT,
      ip TEXT,
      user_agent TEXT,
      ga_client_id TEXT,
      handl_id TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT uq_leads_session_submission UNIQUE (session_token, submission_type)
    )
  `

  // Add dedup columns if this is run on an existing table
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS ga_client_id TEXT`
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS handl_id TEXT`

  await sql`CREATE INDEX IF NOT EXISTS idx_leads_session_token ON leads(session_token)`
  await sql`CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status)`
  await sql`CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at)`
  await sql`CREATE INDEX IF NOT EXISTS idx_leads_submission_type ON leads(submission_type)`
  await sql`CREATE INDEX IF NOT EXISTS idx_leads_session_token_form_submit ON leads(session_token) WHERE submission_type = 'form_submit' AND status IN ('delivered', 'fallback_delivered')`
  await sql`CREATE INDEX IF NOT EXISTS idx_leads_ga_client_id ON leads(ga_client_id) WHERE ga_client_id IS NOT NULL`

  // Unique constraint enables upsert — prevents duplicate rows for the same session+event type
  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'uq_leads_session_submission'
      ) THEN
        ALTER TABLE leads ADD CONSTRAINT uq_leads_session_submission
          UNIQUE (session_token, submission_type);
      END IF;
    END$$
  `

  console.log('Creating admin_users table...')

  await sql`
    CREATE TABLE IF NOT EXISTS admin_users (
      id          TEXT PRIMARY KEY,
      email       TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name        TEXT NOT NULL,
      role        TEXT NOT NULL CHECK (role IN ('super_admin', 'author')),
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email)`

  console.log('Creating blog_posts table...')

  await sql`
    CREATE TABLE IF NOT EXISTS blog_posts (
      slug        TEXT PRIMARY KEY,
      title       TEXT NOT NULL,
      excerpt     TEXT DEFAULT '',
      category    TEXT DEFAULT 'Uncategorized',
      author      TEXT DEFAULT 'Admin',
      published_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at  TIMESTAMPTZ DEFAULT NOW(),
      read_time   TEXT DEFAULT '5 min read',
      featured    BOOLEAN DEFAULT FALSE,
      content     TEXT DEFAULT '',
      image       TEXT DEFAULT '',
      image_alt   TEXT DEFAULT '',
      status      TEXT DEFAULT 'published' CHECK (status IN ('published', 'pending', 'rejected')),
      seo         JSONB DEFAULT '{}'
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status)`
  await sql`CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category)`
  await sql`CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC)`

  console.log('Creating site_content table...')

  await sql`
    CREATE TABLE IF NOT EXISTS site_content (
      key         TEXT PRIMARY KEY,
      value       JSONB NOT NULL DEFAULT '{}',
      updated_by  TEXT REFERENCES admin_users(id),
      updated_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS idx_site_content_updated_at ON site_content(updated_at DESC)`

  // Seed default super_admin if the table is empty
  const existing = await sql`SELECT id FROM admin_users LIMIT 1` as { id: string }[]
  if (existing.length === 0) {
    const id = randomUUID()
    const hash = hashPassword(DEFAULT_ADMIN_PASSWORD, id)
    await sql`
      INSERT INTO admin_users (id, email, password_hash, name, role)
      VALUES (${id}, ${DEFAULT_ADMIN_EMAIL}, ${hash}, ${DEFAULT_ADMIN_NAME}, 'super_admin')
    `
    console.log('─────────────────────────────────────────────')
    console.log('Default admin created:')
    console.log(`  Email:    ${DEFAULT_ADMIN_EMAIL}`)
    console.log(`  Password: ${DEFAULT_ADMIN_PASSWORD}`)
    console.log('  ⚠  Change this password after first login.')
    console.log('─────────────────────────────────────────────')
  } else {
    console.log('Admin users already exist — skipping default seed.')
  }

  console.log('Database setup complete.')
}

setup().catch((err) => {
  console.error('Setup failed:', err)
  process.exit(1)
})
