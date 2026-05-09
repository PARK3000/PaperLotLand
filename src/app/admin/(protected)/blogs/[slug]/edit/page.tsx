import BlogEditor from '@/components/admin/blog-editor'
import { notFound } from 'next/navigation'
import { neon } from '@neondatabase/serverless'
import fs from 'fs'
import path from 'path'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function EditBlogPage({ params }: PageProps) {
  const { slug } = await params

  // Try DB first (admin-created or previously edited posts)
  if (process.env.DATABASE_URL) {
    try {
      const sql = neon(process.env.DATABASE_URL)
      const rows = await sql`SELECT * FROM blog_posts WHERE slug = ${slug} LIMIT 1`
      if (rows[0]) {
        const row = rows[0]
        return (
          <BlogEditor
            mode="edit"
            initialData={{
              slug: row.slug as string,
              title: row.title as string,
              excerpt: (row.excerpt as string) ?? '',
              category: row.category as string,
              author: row.author as string,
              publishedAt: row.published_at instanceof Date
                ? (row.published_at as Date).toISOString()
                : String(row.published_at),
              readTime: (row.read_time as string) ?? '5 min read',
              featured: Boolean(row.featured),
              content: (row.content as string) ?? '',
              image: (row.image as string) ?? '',
              imageAlt: (row.image_alt as string) ?? '',
              seo: { title: '', description: '', keywords: [], ...(row.seo as { title?: string; description?: string; keywords?: string[] } | null) },
            }}
          />
        )
      }
    } catch {
      // fall through to repo file
    }
  }

  // Fall back to repo file (static blog posts checked into git)
  const postFile = path.join(process.cwd(), 'content', 'blog', 'posts', `${slug}.json`)
  if (!fs.existsSync(postFile)) notFound()

  const post = JSON.parse(fs.readFileSync(postFile, 'utf-8'))
  return <BlogEditor mode="edit" initialData={post} />
}
