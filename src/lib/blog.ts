import blogIndexData from '@/../../content/blog/index.json'
import { neon } from '@neondatabase/serverless'

export type PostStatus = 'published' | 'pending' | 'rejected'

export interface BlogPostMeta {
  slug: string
  title: string
  excerpt: string
  category: string
  author: string
  publishedAt: string
  updatedAt: string
  readTime: string
  featured?: boolean
  image?: string
  imageAlt?: string
  status?: PostStatus // undefined = published (backward compat)
}

// Map category names to URL slugs (all PaperLotLand categories resolve to /blog/)
export const CATEGORY_URL_MAP: Record<string, string> = {
  'Land Development': 'blog',
  'Zoning Resources': 'blog',
  'Market Analysis': 'blog',
  'Uncategorized': 'blog',
}

/**
 * Get the URL path for a blog post based on its category
 */
export function getPostUrl(post: BlogPostMeta): string {
  const categorySlug = CATEGORY_URL_MAP[post.category] || 'blog'
  return `/${categorySlug}/${post.slug}/`
}

export interface BlogPost extends BlogPostMeta {
  content: string
  editor?: string
  keyTakeaways?: string[]
  seo: {
    title: string
    description: string
    keywords: string[]
  }
  faqs?: { question: string; answer: string }[]
}

interface BlogIndex {
  posts: BlogPostMeta[]
  categories: string[]
}

// Type the imported JSON properly
const blogIndex: BlogIndex = blogIndexData as BlogIndex

/** Only published posts (undefined status = published, for backward compat) */
function isPublished(post: BlogPostMeta): boolean {
  return !post.status || post.status === 'published'
}

/**
 * Get all blog post metadata (for listing pages) — published only
 */
export function getAllPostsMeta(): BlogPostMeta[] {
  return blogIndex.posts
    .filter(isPublished)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
}

/**
 * Get featured blog posts
 */
export function getFeaturedPosts(): BlogPostMeta[] {
  return blogIndex.posts
    .filter((post) => post.featured)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
}

/**
 * Get posts by category
 */
export function getPostsByCategory(category: string): BlogPostMeta[] {
  return blogIndex.posts
    .filter((post) => post.category.toLowerCase() === category.toLowerCase())
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
}

// ---------------------------------------------------------------------------
// Postgres helpers (admin-created posts)
// ---------------------------------------------------------------------------

interface DbPostRow {
  slug: string
  title: string
  excerpt: string | null
  category: string
  author: string
  published_at: Date | string
  updated_at: Date | string
  read_time: string
  featured: boolean | null
  image: string | null
  image_alt: string | null
  status: string | null
  content?: string | null
  seo?: { title?: string; description?: string; keywords?: string[] } | null
}

function getDb() {
  return neon(process.env.DATABASE_URL!)
}

function rowToMeta(row: DbPostRow): BlogPostMeta {
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt ?? '',
    category: row.category,
    author: row.author,
    publishedAt: row.published_at instanceof Date ? row.published_at.toISOString() : String(row.published_at),
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
    readTime: row.read_time,
    featured: row.featured ?? false,
    image: row.image ?? '',
    imageAlt: row.image_alt ?? '',
    status: row.status as PostStatus,
  }
}

function rowToPost(row: DbPostRow): BlogPost {
  return {
    ...rowToMeta(row),
    content: row.content ?? '',
    seo: { title: '', description: '', keywords: [], ...row.seo },
  }
}

/** Published admin posts from Postgres (for public listing) */
export async function getDbPostsMeta(): Promise<BlogPostMeta[]> {
  if (!process.env.DATABASE_URL) return []
  try {
    const sql = getDb()
    const rows = await sql`
      SELECT slug, title, excerpt, category, author, published_at, updated_at,
             read_time, featured, image, image_alt, status
      FROM blog_posts
      WHERE status = 'published'
      ORDER BY published_at DESC
    `
    return (rows as DbPostRow[]).map(rowToMeta)
  } catch {
    return []
  }
}

/** All admin posts from Postgres (for admin panel — all statuses) */
export async function getDbPostsMetaAdmin(): Promise<BlogPostMeta[]> {
  if (!process.env.DATABASE_URL) return []
  try {
    const sql = getDb()
    const rows = await sql`
      SELECT slug, title, excerpt, category, author, published_at, updated_at,
             read_time, featured, image, image_alt, status
      FROM blog_posts
      ORDER BY published_at DESC
    `
    return (rows as DbPostRow[]).map(rowToMeta)
  } catch {
    return []
  }
}

/** Fetch a single post by slug from Postgres */
export async function getDbPostBySlug(slug: string): Promise<BlogPost | null> {
  if (!process.env.DATABASE_URL) return null
  try {
    const sql = getDb()
    const rows = await sql`SELECT * FROM blog_posts WHERE slug = ${slug} LIMIT 1`
    return rows[0] ? rowToPost(rows[0] as DbPostRow) : null
  } catch {
    return null
  }
}

/**
 * Get a single blog post by slug (with full content).
 * Checks the repo JSON first (fast), then falls back to Postgres.
 */
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const postData = await import(`@/../../content/blog/posts/${slug}.json`)
    return postData.default as BlogPost
  } catch {
    // Not in repo — check Postgres
    return getDbPostBySlug(slug)
  }
}

/**
 * Get post metadata by slug
 */
export function getPostMetaBySlug(slug: string): BlogPostMeta | undefined {
  return blogIndex.posts.find((post) => post.slug === slug)
}

/**
 * Get all categories
 */
export function getAllCategories(): string[] {
  return blogIndex.categories
}

/**
 * Get all post slugs (for static generation) — published only
 */
export function getAllPostSlugs(): string[] {
  return blogIndex.posts.filter(isPublished).map((post) => post.slug)
}

/**
 * Get ALL post metadata for the admin panel — merges repo posts + all Postgres posts.
 * Postgres version takes precedence for the same slug (allows editing repo posts).
 */
export async function getAllPostsMetaAdmin(): Promise<BlogPostMeta[]> {
  const [dbPosts, repoPosts] = await Promise.all([
    getDbPostsMetaAdmin(),
    Promise.resolve(blogIndex.posts),
  ])
  const map = new Map<string, BlogPostMeta>()
  // Repo posts first (as base), then DB posts override (DB = source of truth for edits)
  for (const p of repoPosts) map.set(p.slug, p)
  for (const p of dbPosts) map.set(p.slug, p)
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  )
}

export const POSTS_PER_PAGE = 12

/**
 * Get paginated posts (for blog and category listing pages)
 */
export function getPaginatedPosts(
  page: number,
  perPage: number = POSTS_PER_PAGE,
  category?: string
): { posts: BlogPostMeta[]; totalPages: number; totalPosts: number } {
  const allPosts = category ? getPostsByCategory(category) : getAllPostsMeta()
  const totalPosts = allPosts.length
  const totalPages = Math.ceil(totalPosts / perPage)
  const start = (page - 1) * perPage
  const posts = allPosts.slice(start, start + perPage)
  return { posts, totalPages, totalPosts }
}

/**
 * Get related posts (same category, excluding current)
 */
export function getRelatedPosts(currentSlug: string, limit: number = 3): BlogPostMeta[] {
  const currentPost = getPostMetaBySlug(currentSlug)
  if (!currentPost) return []

  return blogIndex.posts
    .filter((post) => post.slug !== currentSlug && post.category === currentPost.category)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, limit)
}

/**
 * Format date for display
 */
export function formatPostDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
