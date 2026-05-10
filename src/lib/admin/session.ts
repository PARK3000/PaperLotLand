// Edge-runtime safe — uses only Web Crypto and Web APIs (no Node.js built-ins)

export type AdminRole = 'super_admin' | 'author'

export interface SessionPayload {
  userId: string
  name: string
  role: AdminRole
  exp: number // unix ms
}

async function sha256hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function toBase64url(str: string): string {
  const bytes = new TextEncoder().encode(str)
  let binary = ''
  bytes.forEach((b) => { binary += String.fromCharCode(b) })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function fromBase64url(b64url: string): string {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/')
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

function secret(): string {
  return process.env.ADMIN_SESSION_SECRET || 'change-me-set-ADMIN_SESSION_SECRET'
}

/** Create a signed session cookie value */
export async function encodeSession(payload: SessionPayload): Promise<string> {
  const b64 = toBase64url(JSON.stringify(payload))
  const sig = await sha256hex(`${b64}:${secret()}`)
  return `${b64}.${sig}`
}

/** Decode and verify a session cookie value. Returns null if invalid or expired. */
export async function decodeSession(token: string): Promise<SessionPayload | null> {
  try {
    const dot = token.lastIndexOf('.')
    if (dot === -1) return null
    const b64 = token.slice(0, dot)
    const sig = token.slice(dot + 1)
    const expected = await sha256hex(`${b64}:${secret()}`)
    // Constant-length comparison to reduce timing side-channels
    if (expected.length !== sig.length) return null
    let diff = 0
    for (let i = 0; i < expected.length; i++) {
      diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i)
    }
    if (diff !== 0) return null
    const payload = JSON.parse(fromBase64url(b64)) as SessionPayload
    if (payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

export const SESSION_COOKIE = 'admin_session'
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days
