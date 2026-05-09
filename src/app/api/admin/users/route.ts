import { NextRequest, NextResponse } from 'next/server'
import { getUsers, createUser } from '@/lib/admin/users'

export async function GET() {
  try {
    const users = (await getUsers()).map(({ passwordHash: _ph, ...u }) => u)
    return NextResponse.json({ users })
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, role } = await req.json()
    if (!email || !password || !name || !role) {
      return NextResponse.json({ error: 'email, password, name, and role are required' }, { status: 400 })
    }
    if (role !== 'super_admin' && role !== 'author') {
      return NextResponse.json({ error: 'role must be "super_admin" or "author"' }, { status: 400 })
    }
    const { passwordHash: _ph, ...user } = await createUser({ email, password, name, role })
    return NextResponse.json({ success: true, user }, { status: 201 })
  } catch (e: unknown) {
    const msg = (e as Error).message
    const status = msg.includes('already exists') ? 409 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
