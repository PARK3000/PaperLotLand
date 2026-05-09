import { NextRequest, NextResponse } from 'next/server'
import { getUserByEmail, hashPassword } from '@/lib/admin/users'
import { encodeSession, SESSION_COOKIE, SESSION_TTL_MS } from '@/lib/admin/session'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const user = await getUserByEmail(email)
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const hash = hashPassword(password, user.id)
    if (hash !== user.passwordHash) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const token = await encodeSession({
      userId: user.id,
      name: user.name,
      role: user.role,
      exp: Date.now() + SESSION_TTL_MS,
    })

    const res = NextResponse.json({ success: true, name: user.name, role: user.role })
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_TTL_MS / 1000,
      path: '/',
    })
    return res
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
