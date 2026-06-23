import { NextRequest, NextResponse } from 'next/server'
import { getBuyers, createBuyer } from '@/lib/admin/buyers'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') as 'active' | 'cold' | 'closed' | 'all' | null
    const search = searchParams.get('search') || undefined
    const buyers = await getBuyers({ status: status ?? undefined, search })
    return NextResponse.json({ buyers })
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }
    const buyer = await createBuyer(body)
    return NextResponse.json({ success: true, buyer }, { status: 201 })
  } catch (e: unknown) {
    const msg = (e as Error).message
    const status = msg.includes('required') ? 400 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
