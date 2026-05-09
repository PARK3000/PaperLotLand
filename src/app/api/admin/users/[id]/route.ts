import { NextRequest, NextResponse } from 'next/server'
import { updateUser, deleteUser } from '@/lib/admin/users'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const updates = await req.json()
    const { passwordHash: _ph, ...user } = await updateUser(id, updates)
    return NextResponse.json({ success: true, user })
  } catch (e: unknown) {
    const msg = (e as Error).message
    const status = msg === 'User not found' ? 404 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    await deleteUser(id)
    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    const msg = (e as Error).message
    const status = msg === 'User not found' ? 404 : 400
    return NextResponse.json({ error: msg }, { status })
  }
}
