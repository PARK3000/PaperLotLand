import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { CATEGORY_URL_MAP } from '@/lib/blog'
import { JURISDICTIONS } from '@/lib/constants'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ROOT = process.cwd()
const APP_DIR = path.join(ROOT, 'src/app')

/** Recursively walk a directory and return all file paths matching a predicate. */
function walkDir(dir: string, predicate: (f: string) => boolean): string[] {
  const results: string[] = []
  if (!fs.existsSync(dir)) return results
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...walkDir(full, predicate))
    } else if (predicate(full)) {
      results.push(full)
    }
  }
  return results
}

/** Convert a page.tsx file path to its route (e.g. src/app/contact-us/page.tsx → /contact-us/). */
function pageFileToRoute(filePath: string): string | null {
  const rel = path.relative(APP_DIR, filePath).replace(/\\/g, '/')
  // Remove page.tsx suffix
  let dir = rel.replace(/\/page\.tsx$/, '').replace(/^page\.tsx$/, '')
  // Strip Next.js route groups (e.g. "(site)") — they don't appear in URLs
  dir = dir
    .split('/')
    .filter((seg) => !(seg.startsWith('(') && seg.endsWith(')')))
    .join('/')
  // Skip dynamic segments — they need runtime params
  if (dir.includes('[')) return null
  return dir === '' ? '/' : `/${dir}/`
}

// ---------------------------------------------------------------------------
// Build route registry
// ---------------------------------------------------------------------------

function buildRouteRegistry(): Set<string> {
  const routes = new Set<string>()

  // 1. Static routes from filesystem
  const pageFiles = walkDir(APP_DIR, (f) => f.endsWith('/page.tsx'))
  for (const pf of pageFiles) {
    const route = pageFileToRoute(pf)
    if (route) routes.add(route)
  }

  // 2. Blog post routes from index.json
  const blogIndexPath = path.join(ROOT, 'content/blog/index.json')
  if (fs.existsSync(blogIndexPath)) {
    const blogIndex = JSON.parse(fs.readFileSync(blogIndexPath, 'utf-8'))
    for (const post of blogIndex.posts) {
      const categorySlug = CATEGORY_URL_MAP[post.category] || 'blog'
      routes.add(`/${categorySlug}/${post.slug}/`)
    }
  }

  // 3. Known dynamic patterns (pagination, API, etc.)
  routes.add('/api/leads/')

  // 4. Jurisdiction resource pages — handled by /resources/[jurisdiction]/page.tsx
  for (const j of JURISDICTIONS) {
    routes.add(`/resources/${j.slug}/`)
  }

  return routes
}

/** Check whether an extracted href is a valid internal link that should be validated. */
function shouldValidate(href: string): boolean {
  // Skip external, protocol, anchor, and special links
  if (
    href.startsWith('http://') ||
    href.startsWith('https://') ||
    href.startsWith('tel:') ||
    href.startsWith('mailto:') ||
    href.startsWith('#') ||
    href === '/#'
  )
    return false

  // Skip Next.js dynamic interpolations that can't be statically resolved
  if (href.includes('${') || href.includes('{')) return false

  // Skip static asset paths (images, fonts, etc.) — these resolve to /public/, not a route
  if (/\.(jpe?g|png|gif|webp|svg|avif|ico|css|js|mjs|woff2?|ttf|eot|pdf|xml|txt|json)(\?|$)/i.test(href)) return false

  return href.startsWith('/')
}

/** Normalise a route so it always has a trailing slash (unless it's the root). */
function normalise(href: string): string {
  // Strip query string and hash
  const clean = href.split('?')[0].split('#')[0]
  if (clean === '/') return '/'
  return clean.endsWith('/') ? clean : `${clean}/`
}

// ---------------------------------------------------------------------------
// Extract hrefs from source files
// ---------------------------------------------------------------------------

interface ExtractedLink {
  file: string
  href: string
  line: number
}

function extractHrefsFromTsx(filePath: string): ExtractedLink[] {
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')
  const links: ExtractedLink[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Match href="/...", href='/...', href={"/..."}, href={'/...'}
    const patterns = [
      /href="(\/[^"]*?)"/g,
      /href='(\/[^']*?)'/g,
      /href=\{"(\/[^"]*?)"\}/g,
      /href=\{'(\/[^']*?)'\}/g,
    ]

    for (const pattern of patterns) {
      let match
      while ((match = pattern.exec(line)) !== null) {
        links.push({ file: filePath, href: match[1], line: i + 1 })
      }
    }
  }

  return links
}

function extractHrefsFromConstants(filePath: string): ExtractedLink[] {
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')
  const links: ExtractedLink[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Match href: "/..." or href: '/...' in object literals
    const patterns = [/href:\s*"(\/[^"]*?)"/g, /href:\s*'(\/[^']*?)'/g]

    for (const pattern of patterns) {
      let match
      while ((match = pattern.exec(line)) !== null) {
        links.push({ file: filePath, href: match[1], line: i + 1 })
      }
    }
  }

  return links
}

// ---------------------------------------------------------------------------
// Suite 1: Internal Link Validation
// ---------------------------------------------------------------------------

describe('Internal Link Validation', () => {
  const routes = buildRouteRegistry()

  // Collect all internal hrefs from source
  const tsxFiles = walkDir(path.join(ROOT, 'src'), (f) => f.endsWith('.tsx'))
  const constantsFile = path.join(ROOT, 'src/lib/constants.ts')

  const allLinks: ExtractedLink[] = []

  for (const file of tsxFiles) {
    allLinks.push(...extractHrefsFromTsx(file))
  }

  if (fs.existsSync(constantsFile)) {
    allLinks.push(...extractHrefsFromConstants(constantsFile))
  }

  // Filter to validatable internal links
  const internalLinks = allLinks.filter((l) => shouldValidate(l.href))

  it('should find some internal links to validate', () => {
    expect(internalLinks.length).toBeGreaterThan(0)
  })

  it('every internal href should resolve to a valid route', () => {
    const broken: string[] = []

    for (const link of internalLinks) {
      const normalised = normalise(link.href)

      // Direct match
      if (routes.has(normalised)) continue

      // Check dynamic blog/category routes — /blog/[slug]/, /selling-a-home/[slug]/, etc.
      const segments = normalised.split('/').filter(Boolean)
      if (segments.length === 2) {
        const prefix = segments[0]
        // Known dynamic category prefixes
        const dynamicPrefixes = [
          'blog',
          'selling-a-home',
          'sell-your-house',
          'sell-my-house-fast',
          'buying-a-home',
        ]
        if (dynamicPrefixes.includes(prefix)) {
          // Pagination routes like /blog/page/2/ are handled below
          continue
        }
      }

      // Pagination: /blog/page/N/, /selling-a-home/page/N/
      if (segments.length === 3 && segments[1] === 'page' && /^\d+$/.test(segments[2])) {
        continue
      }

      // Landing pages: /lp/*
      if (segments[0] === 'lp') continue

      const relFile = path.relative(ROOT, link.file)
      broken.push(`${relFile}:${link.line} → ${link.href}`)
    }

    if (broken.length > 0) {
      console.warn(
        `Broken internal links (${broken.length}):\n` +
          broken.map((b) => `  - ${b}`).join('\n')
      )
    }

    expect(broken).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Suite 2: Blog Content Placeholder Detection
// ---------------------------------------------------------------------------

describe('Blog Content Placeholder Detection', () => {
  const postsDir = path.join(ROOT, 'content/blog/posts')

  const PLACEHOLDER_PATTERNS = [
    /\blink to internal\b/i,
    /\(link to\b/i,
    /\*\*\(link\b/i,
    /\bTODO\b/,
    /\bFIXME\b/,
    /\bTBD\b/,
    /\bexample\.com\b/i,
  ]

  it('should have blog post files to validate', () => {
    const posts = walkDir(postsDir, (f) => f.endsWith('.json'))
    expect(posts.length).toBeGreaterThan(0)
  })

  it('no blog posts should contain placeholder text', () => {
    const posts = walkDir(postsDir, (f) => f.endsWith('.json'))
    const issues: string[] = []

    for (const postFile of posts) {
      const data = JSON.parse(fs.readFileSync(postFile, 'utf-8'))
      const content: string = data.content || ''
      const slug = path.basename(postFile, '.json')

      for (const pattern of PLACEHOLDER_PATTERNS) {
        const match = content.match(pattern)
        if (match) {
          issues.push(`${slug}: found "${match[0]}"`)
        }
      }
    }

    if (issues.length > 0) {
      console.warn(
        `Blog placeholder issues (${issues.length}):\n` +
          issues.map((i) => `  - ${i}`).join('\n')
      )
    }

    expect(issues).toEqual([])
  })
})
