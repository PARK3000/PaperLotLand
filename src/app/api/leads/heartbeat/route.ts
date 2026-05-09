import { after } from 'next/server'
import { redis } from '@/lib/redis'

export const runtime = 'edge'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const ALLOWED_FIELDS = ['address', 'phone', 'name', 'firstName', 'lastName', 'email'] as const
const FIELD_MAX_LEN: Record<string, number> = {
  address: 200,
  phone: 20,
  name: 100,
  firstName: 50,
  lastName: 50,
  email: 254,
}

function sanitizeFields(raw: Record<string, unknown>): Record<string, string> {
  const fields: Record<string, string> = {}
  for (const name of ALLOWED_FIELDS) {
    const val = raw[name]
    if (typeof val === 'string' && val.trim().length > 0) {
      fields[name] = val
        .slice(0, FIELD_MAX_LEN[name] || 200)
        .replace(/<[^>]*>/g, '')
        .trim()
    }
  }
  return fields
}

export async function POST(request: Request) {
  const text = await request.text()
  let data: Record<string, unknown>

  try {
    data = JSON.parse(text)
  } catch {
    return new Response(null, { status: 400 })
  }

  // Validate session token
  const sessionToken = data.sessionToken
  if (typeof sessionToken !== 'string' || !UUID_RE.test(sessionToken)) {
    return new Response(null, { status: 400 })
  }

  // Sanitize fields — only accept known field names with length limits
  const rawFields =
    typeof data.fields === 'object' && data.fields !== null
      ? (data.fields as Record<string, unknown>)
      : {}
  const fields = sanitizeFields(rawFields)

  if (Object.keys(fields).length === 0) {
    return new Response(null, { status: 400 })
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'

  // Return 204 immediately, write to Redis in background
  after(async () => {
    try {
      const key = `partial:${sessionToken}`
      const existing = await redis.get<Record<string, unknown>>(key)

      const record = {
        sessionToken,
        formId: typeof data.formId === 'string' ? data.formId : 'unknown',
        formVariant: typeof data.formVariant === 'string' ? data.formVariant : 'unknown',
        pageUrl: typeof data.pageUrl === 'string' ? data.pageUrl : '',
        fields,
        fieldsFilled: Object.keys(fields),
        heartbeatCount:
          (typeof existing?.heartbeatCount === 'number' ? existing.heartbeatCount : 0) + 1,
        firstSeen:
          typeof existing?.firstSeen === 'string'
            ? existing.firstSeen
            : new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        ip,
        userAgent: request.headers.get('user-agent'),
      }

      await redis.set(key, record, { ex: 86400 }) // 24h TTL

      console.log('[Heartbeat]', {
        sessionToken: sessionToken.slice(0, 8) + '...',
        formId: record.formId,
        fieldsFilled: record.fieldsFilled,
        heartbeatCount: record.heartbeatCount,
        pageUrl: record.pageUrl,
      })
    } catch (err) {
      console.error('[Heartbeat] Redis write failed:', err)
    }
  })

  return new Response(null, { status: 204 })
}
