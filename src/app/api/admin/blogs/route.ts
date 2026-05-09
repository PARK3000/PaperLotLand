import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { revalidatePath } from 'next/cache'

function getDb() {
  return neon(process.env.DATABASE_URL!)
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

// GET /api/admin/blogs — list all posts (repo handled by the page; this returns DB posts)
export async function GET() {
  try {
    const sql = getDb()
    const rows = await sql`
      SELECT slug, title, excerpt, category, author, published_at, updated_at,
             read_time, featured, image, image_alt, status
      FROM blog_posts ORDER BY published_at DESC
    `
    return NextResponse.json({ posts: rows })
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

// POST /api/admin/blogs — create new post in Postgres
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const slug: string = body.slug || slugify(body.title)
    if (!slug) return NextResponse.json({ error: 'Slug is required' }, { status: 400 })
    if (!body.title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    if (!body.content) return NextResponse.json({ error: 'Content is required' }, { status: 400 })

    const role = req.headers.get('x-admin-user-role')
    const authorName = req.headers.get('x-admin-user-name') || 'Admin'
    const status = role === 'super_admin' ? 'published' : 'pending'

    const now = new Date().toISOString()
    const seo = {
      title: body.seo?.title || body.title,
      description: body.seo?.description || body.excerpt || '',
      keywords: body.seo?.keywords || [],
    }

    const sql = getDb()
    await sql`
      INSERT INTO blog_posts
        (slug, title, excerpt, category, author, published_at, updated_at,
         read_time, featured, content, image, image_alt, status, seo)
      VALUES (
        ${slug},
        ${body.title},
        ${body.excerpt || ''},
        ${body.category || 'Uncategorized'},
        ${body.author || authorName},
        ${body.publishedAt || now},
        ${now},
        ${body.readTime || '5 min read'},
        ${Boolean(body.featured)},
        ${body.content},
        ${body.image || ''},
        ${body.imageAlt || body.title},
        ${status},
        ${JSON.stringify(seo)}
      )
    `

    revalidatePath('/blog')
    revalidatePath('/selling-a-home')
    revalidatePath('/sell-your-house')

    return NextResponse.json({ success: true, slug, status }, { status: 201 })
  } catch (e: unknown) {
    const msg = (e as Error).message
    const status = msg.includes('duplicate key') || msg.includes('unique') ? 409 : 500
    return NextResponse.json({ error: msg.includes('duplicate') ? `A post with that slug already exists` : msg }, { status })
  }
}
