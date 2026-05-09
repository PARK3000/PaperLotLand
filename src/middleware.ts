import { NextRequest, NextResponse } from 'next/server'
import { decodeSession, SESSION_COOKIE } from '@/lib/admin/session'

const PH_DID_COOKIE = 'ph_did'
const PH_DID_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const path = pathname.endsWith('/') && pathname !== '/' ? pathname.slice(0, -1) : pathname

  // Stamp ph_did for LP pages so server-side PostHog flag eval and client-side
  // posthog-js share a distinct_id. cookies().set() is not allowed in Server
  // Components (Next.js 15), so this must live in middleware.
  if (path.startsWith('/lp')) {
    const existing = req.cookies.get(PH_DID_COOKIE)?.value
    if (existing) return NextResponse.next()

    const phDid = crypto.randomUUID()
    const requestHeaders = new Headers(req.headers)
    requestHeaders.set('x-ph-did', phDid)

    const response = NextResponse.next({ request: { headers: requestHeaders } })
    response.cookies.set(PH_DID_COOKIE, phDid, {
      maxAge: PH_DID_MAX_AGE,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: false,
    })
    return response
  }

  if (!path.startsWith('/admin') && !path.startsWith('/api/admin')) {
    return NextResponse.next()
  }

  // Always public
  if (path === '/admin/login' || path.startsWith('/api/admin/auth')) {
    return NextResponse.next()
  }

  // Skip auth in local development
  if (process.env.ADMIN_SKIP_AUTH === 'true') {
    const requestHeaders = new Headers(req.headers)
    requestHeaders.set('x-admin-user-id', 'dev-local')
    requestHeaders.set('x-admin-user-name', 'Developer')
    requestHeaders.set('x-admin-user-role', 'super_admin')
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  // Verify session
  const token = req.cookies.get(SESSION_COOKIE)?.value
  const session = token ? await decodeSession(token) : null

  const isApiRoute = path.startsWith('/api/admin')

  if (!session) {
    if (isApiRoute) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const loginUrl = new URL('/admin/login', req.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Authors cannot access user management or site content editing
  if (
    session.role === 'author' &&
    (path.startsWith('/admin/users') || path.startsWith('/api/admin/users') ||
     path.startsWith('/admin/site-content') || path.startsWith('/api/admin/site-content'))
  ) {
    if (isApiRoute) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.redirect(new URL('/admin', req.url))
  }

  // Inject session into request headers so server components and route handlers can read it
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-admin-user-id', session.userId)
  requestHeaders.set('x-admin-user-name', session.name)
  requestHeaders.set('x-admin-user-role', session.role)

  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/lp/:path*'],
}
