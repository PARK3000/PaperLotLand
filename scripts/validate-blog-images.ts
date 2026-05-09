#!/usr/bin/env npx tsx
/**
 * Validates that every blog post in index.json has:
 * 1. An `image` field pointing to a file that exists in public/
 * 2. A non-empty `imageAlt` field
 *
 * Run: npx tsx scripts/validate-blog-images.ts
 * Runs automatically as part of `npm run build` via prebuild hook.
 */

import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const indexPath = join(ROOT, 'content/blog/index.json')

interface BlogMeta {
  slug: string
  title: string
  image?: string
  imageAlt?: string
}

const { posts }: { posts: BlogMeta[] } = JSON.parse(
  readFileSync(indexPath, 'utf-8')
)

let errors = 0

for (const post of posts) {
  const label = `[${post.slug}]`

  if (!post.image) {
    console.error(`❌ ${label} Missing "image" field`)
    errors++
  } else {
    const imgPath = join(ROOT, 'public', post.image)
    if (!existsSync(imgPath)) {
      console.error(`❌ ${label} Image file not found: ${post.image}`)
      errors++
    }
  }

  if (!post.imageAlt) {
    console.error(`❌ ${label} Missing "imageAlt" field`)
    errors++
  }
}

if (errors > 0) {
  console.error(`\n🚫 ${errors} blog image issue(s) found. Fix before deploying.`)
  process.exit(1)
} else {
  console.log(`✅ All ${posts.length} blog posts have valid images and alt text.`)
}
