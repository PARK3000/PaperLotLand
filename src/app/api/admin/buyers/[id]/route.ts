import { NextRequest, NextResponse } from 'next/server'
import { updateBuyer, deleteBuyer } from '@/lib/admin/buyers'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const updates = await req.json()
    const buyer = await updateBuyer(id, updates)
    return NextResponse.json({ success: true, buyer })
  } catch (e: unknown) {
    const msg = (e as Error).message
    const status = msg === 'Buyer not found' ? 404 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    await deleteBuyer(id)
    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    const msg = (e as Error).message
    const status = msg === 'Buyer not found' ? 404 : 400
    return NextResponse.json({ error: msg }, { status })
  }
}
