import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { revalidatePath } from 'next/cache'

function getDb() {
  return neon(process.env.DATABASE_URL!)
}

interface RouteParams {
  params: Promise<{ slug: string }>
}

// PATCH /api/admin/blogs/[slug]/approve — approve or reject (super_admin only)
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const role = req.headers.get('x-admin-user-role')
    if (role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { slug } = await params
    const { action } = await req.json()
    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({ error: 'action must be "approve" or "reject"' }, { status: 400 })
    }

    const newStatus = action === 'approve' ? 'published' : 'rejected'
    const sql = getDb()
    const result = await sql`
      UPDATE blog_posts SET status = ${newStatus}, updated_at = NOW()
      WHERE slug = ${slug}
      RETURNING slug
    `
    if (result.length === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    revalidatePath(`/blog/${slug}`)
    revalidatePath('/blog')

    return NextResponse.json({ success: true, slug, status: newStatus })
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
