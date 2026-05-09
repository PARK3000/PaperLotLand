import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getDb } from '@/lib/db'
import {
  ALLOWED_KEYS,
  type SiteContentKey,
  getGeneralContent,
  getHomepageContent,
  getNavigationContent,
  getSeoDefaults,
  getFAQContent,
  getTestimonialsFallback,
} from '@/lib/site-content'

// Map each key to the loader that returns its current value (DB or defaults)
async function loadSection(key: SiteContentKey) {
  switch (key) {
    case 'general': return getGeneralContent()
    case 'homepage': return getHomepageContent()
    case 'navigation': return getNavigationContent()
    case 'seo_defaults': return getSeoDefaults()
    case 'faqs': return getFAQContent()
    case 'testimonials': return getTestimonialsFallback()
  }
}

// Revalidation paths per section
const REVALIDATE_MAP: Record<SiteContentKey, Array<{ path: string; type?: 'layout' | 'page' }>> = {
  general: [{ path: '/', type: 'layout' }],
  homepage: [{ path: '/' }],
  navigation: [{ path: '/', type: 'layout' }],
  seo_defaults: [{ path: '/' }],
  faqs: [{ path: '/' }, { path: '/frequently-asked-questions' }],
  testimonials: [{ path: '/' }, { path: '/happy-sellers' }],
}

function isAllowedKey(key: string): key is SiteContentKey {
  return (ALLOWED_KEYS as readonly string[]).includes(key)
}

// Required top-level fields per section — prevents malformed data from crashing the frontend
const REQUIRED_FIELDS: Record<SiteContentKey, string[]> = {
  general: ['businessName', 'phone'],
  homepage: ['heroTitle'],
  navigation: ['mainNav'],
  seo_defaults: ['defaultTitle'],
  faqs: ['items'],
  testimonials: ['fallbackReviews'],
}

// ---------------------------------------------------------------------------
// GET — return current value for a section (DB override or defaults)
// Pass ?default=true to skip DB and return hardcoded defaults
// ---------------------------------------------------------------------------

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key } = await params
  const forceDefault = req.nextUrl.searchParams.get('default') === 'true'

  if (!isAllowedKey(key)) {
    return NextResponse.json({ error: `Invalid key: ${key}` }, { status: 400 })
  }

  try {
    if (!forceDefault) {
      // Check DB first
      const sql = getDb()
      const rows = await sql`SELECT value, updated_by, updated_at FROM site_content WHERE key = ${key} LIMIT 1`

      if (rows.length > 0) {
        return NextResponse.json({
          success: true,
          key,
          value: rows[0].value,
          source: 'db',
          updatedBy: rows[0].updated_by,
          updatedAt: rows[0].updated_at,
        })
      }
    }

    // Fall back to defaults
    const value = await loadSection(key)
    return NextResponse.json({
      success: true,
      key,
      value,
      source: 'defaults',
      updatedBy: null,
      updatedAt: null,
    })
  } catch {
    // DB unavailable — return defaults
    try {
      const value = await loadSection(key)
      return NextResponse.json({
        success: true,
        key,
        value,
        source: 'defaults',
        updatedBy: null,
        updatedAt: null,
      })
    } catch (err) {
      return NextResponse.json(
        { error: 'Failed to load content', detail: err instanceof Error ? err.message : String(err) },
        { status: 500 },
      )
    }
  }
}

// ---------------------------------------------------------------------------
// PUT — upsert content for a section (super_admin only)
// ---------------------------------------------------------------------------

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key } = await params
  const role = req.headers.get('x-admin-user-role')
  const userId = req.headers.get('x-admin-user-id')

  if (role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!isAllowedKey(key)) {
    return NextResponse.json({ error: `Invalid key: ${key}` }, { status: 400 })
  }

  let body: { value: Record<string, unknown> }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.value || typeof body.value !== 'object') {
    return NextResponse.json({ error: 'Body must contain a "value" object' }, { status: 400 })
  }

  // Validate required fields to prevent malformed data from crashing the frontend
  const required = REQUIRED_FIELDS[key]
  const missing = required.filter((f) => !(f in body.value))
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Missing required fields for "${key}": ${missing.join(', ')}` },
      { status: 400 },
    )
  }

  try {
    const sql = getDb()
    const valueJson = JSON.stringify(body.value)

    // Verify userId exists in admin_users; use null if not (e.g. dev bypass)
    let safeUserId: string | null = null
    if (userId) {
      const userRows = await sql`SELECT id FROM admin_users WHERE id = ${userId} LIMIT 1`
      if (userRows.length > 0) safeUserId = userId
    }

    await sql`
      INSERT INTO site_content (key, value, updated_by, updated_at)
      VALUES (${key}, ${valueJson}::jsonb, ${safeUserId}, NOW())
      ON CONFLICT (key) DO UPDATE
        SET value = ${valueJson}::jsonb,
            updated_by = ${safeUserId},
            updated_at = NOW()
    `

    // Revalidate affected paths
    const paths = REVALIDATE_MAP[key] || []
    for (const { path, type } of paths) {
      revalidatePath(path, type)
    }

    return NextResponse.json({ success: true, key })
  } catch (err) {
    console.error(`[site-content] Failed to save key="${key}":`, err)
    return NextResponse.json(
      { error: 'Failed to save content', detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}

// ---------------------------------------------------------------------------
// DELETE — remove DB override, reverting to hardcoded defaults (super_admin only)
// ---------------------------------------------------------------------------

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key } = await params
  const role = req.headers.get('x-admin-user-role')

  if (role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!isAllowedKey(key)) {
    return NextResponse.json({ error: `Invalid key: ${key}` }, { status: 400 })
  }

  try {
    const sql = getDb()
    await sql`DELETE FROM site_content WHERE key = ${key}`

    const paths = REVALIDATE_MAP[key] || []
    for (const { path, type } of paths) {
      revalidatePath(path, type)
    }

    return NextResponse.json({ success: true, key })
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to reset content', detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}
