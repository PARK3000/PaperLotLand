import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { revalidatePath } from 'next/cache'

function getDb() {
  return neon(process.env.DATABASE_URL!)
}

interface RouteParams {
  params: Promise<{ slug: string }>
}

// GET /api/admin/blogs/[slug] — read post (DB first, then repo file)
export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { slug } = await params
  const sql = getDb()
  const rows = await sql`SELECT * FROM blog_posts WHERE slug = ${slug} LIMIT 1`
  if (rows[0]) {
    const row = rows[0]
    return NextResponse.json({
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt,
      category: row.category,
      author: row.author,
      publishedAt: row.published_at,
      updatedAt: row.updated_at,
      readTime: row.read_time,
      featured: row.featured,
      content: row.content,
      image: row.image,
      imageAlt: row.image_alt,
      status: row.status,
      seo: row.seo ?? {},
    })
  }

  // Fall back to repo file
  const path = require('path') as typeof import('path')
  const fs = require('fs') as typeof import('fs')
  const postFile = path.join(process.cwd(), 'content', 'blog', 'posts', `${slug}.json`)
  if (!fs.existsSync(postFile)) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }
  return NextResponse.json(JSON.parse(fs.readFileSync(postFile, 'utf-8')))
}

// PUT /api/admin/blogs/[slug] — upsert post in Postgres
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params
    const body = await req.json()
    const sql = getDb()

    const role = req.headers.get('x-admin-user-role')

    // Check if post exists in DB already
    const existing = await sql`SELECT status FROM blog_posts WHERE slug = ${slug} LIMIT 1`
    const resolvedStatus =
      role === 'super_admin' && body.status ? body.status : (existing[0]?.status ?? 'published')

    const now = new Date().toISOString()
    const seo = body.seo ? JSON.stringify(body.seo) : '{}'

    if (existing.length > 0) {
      await sql`
        UPDATE blog_posts SET
          title      = ${body.title},
          excerpt    = ${body.excerpt ?? ''},
          category   = ${body.category ?? 'Uncategorized'},
          author     = ${body.author ?? 'Admin'},
          published_at = ${body.publishedAt ?? now},
          updated_at = ${now},
          read_time  = ${body.readTime ?? '5 min read'},
          featured   = ${Boolean(body.featured)},
          content    = ${body.content ?? ''},
          image      = ${body.image ?? ''},
          image_alt  = ${body.imageAlt ?? ''},
          status     = ${resolvedStatus},
          seo        = ${seo}
        WHERE slug = ${slug}
      `
    } else {
      // New DB entry (editing a repo post for the first time)
      await sql`
        INSERT INTO blog_posts
          (slug, title, excerpt, category, author, published_at, updated_at,
           read_time, featured, content, image, image_alt, status, seo)
        VALUES (
          ${slug}, ${body.title}, ${body.excerpt ?? ''},
          ${body.category ?? 'Uncategorized'}, ${body.author ?? 'Admin'},
          ${body.publishedAt ?? now}, ${now},
          ${body.readTime ?? '5 min read'}, ${Boolean(body.featured)},
          ${body.content ?? ''}, ${body.image ?? ''}, ${body.imageAlt ?? ''},
          ${resolvedStatus}, ${seo}
        )
      `
    }

    revalidatePath(`/blog/${slug}`)
    revalidatePath('/blog')

    return NextResponse.json({ success: true, slug })
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

// DELETE /api/admin/blogs/[slug] — delete from Postgres only
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params
    const sql = getDb()
    const result = await sql`DELETE FROM blog_posts WHERE slug = ${slug} RETURNING slug`
    if (result.length === 0) {
      return NextResponse.json({ error: 'Post not found in database (repo posts cannot be deleted from here)' }, { status: 404 })
    }

    revalidatePath(`/blog/${slug}`)
    revalidatePath('/blog')

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
