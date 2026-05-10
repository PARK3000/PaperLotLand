# CMS Integration: Payload CMS v3

## Context

The SEO company managing blog content needs a web-based admin UI — no Git access, no code. Currently all 94 blog posts live as JSON files in `content/blog/posts/`, loaded at build-time via `src/lib/blog.ts`. There's no upload mechanism for images (placed manually in `public/images/blog/`).

**Choice: Payload CMS v3** — runs inside the Next.js app at `/admin`, uses existing Neon Postgres DB, handles media uploads, TypeScript-native. No external service dependency. SEO company gets a WordPress-like dashboard to create/edit blog posts and upload images.

**Not chosen:** Sanity (external service, usage costs), Tina Cloud (Git-backed, poor for media uploads), Keystatic (requires Git access).

---

## What Gets Built

| Feature | How |
|---------|-----|
| Blog post editor | Payload `posts` collection with rich text |
| Image uploads | Payload `media` collection + Vercel Blob storage |
| Page copy editing | Payload Globals for hero/CTA copy (Phase 2) |
| Admin login | Payload `users` collection (email/password) |
| Admin URL | `/admin` (same Vercel deployment) |

---

## Critical Files

| File | Change |
|------|--------|
| `package.json` | Add Payload v3 deps |
| `next.config.ts` | Wrap with `withPayload()` |
| `payload.config.ts` | New — root-level Payload config |
| `src/collections/Posts.ts` | New — blog post collection schema |
| `src/collections/Media.ts` | New — media upload collection |
| `src/collections/Users.ts` | New — admin users |
| `src/app/(payload)/admin/[[...segments]]/page.tsx` | New — admin UI route |
| `src/app/(payload)/admin/[[...segments]]/not-found.tsx` | New — required |
| `src/app/(payload)/layout.tsx` | New — required |
| `src/app/(payload)/api/[...slug]/route.ts` | New — Payload REST API |
| `src/lib/blog.ts` | Update to query Payload DB instead of JSON |
| `scripts/migrate-blog-posts.ts` | New — one-time migration script |

---

## Implementation Steps

### 1. Install Dependencies
```bash
npm install payload @payloadcms/next @payloadcms/db-postgres @payloadcms/richtext-lexical @payloadcms/storage-vercel-blob
```

### 2. Configure payload.config.ts (root)
```typescript
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { Posts } from './src/collections/Posts'
import { Media } from './src/collections/Media'
import { Users } from './src/collections/Users'

export default buildConfig({
  admin: { user: Users.slug },
  collections: [Posts, Media, Users],
  editor: lexicalEditor({}),
  db: postgresAdapter({ pool: { connectionString: process.env.DATABASE_URL } }),
  plugins: [
    vercelBlobStorage({
      collections: { media: true },
      token: process.env.BLOB_READ_WRITE_TOKEN,
    }),
  ],
  secret: process.env.PAYLOAD_SECRET,
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
})
```

### 3. Posts Collection Schema (src/collections/Posts.ts)
Fields mirroring existing JSON schema:
- `title` (text, required)
- `slug` (text, unique, auto-generated from title)
- `excerpt` (textarea)
- `content` (textarea — keeps existing markdown renderer; upgrade to lexical in Phase 2)
- `category` (select: "Land Development" | "Zoning Resources" | "Market Analysis" | "Uncategorized")
- `author` (text, default "Parker Gibbons")
- `publishedAt` (date)
- `readTime` (text, e.g. "5 min read")
- `featured` (checkbox)
- `image` (upload, relationship to Media)
- `imageAlt` (text)
- `seo.title` (text)
- `seo.description` (textarea)
- `seo.keywords` (array of text)
- `status` (select: draft | published, default draft)

Access control: only authenticated users can create/update/delete; published posts are publicly readable.

### 4. Media Collection (src/collections/Media.ts)
Standard Payload media collection with Vercel Blob storage. SEO company uploads images here, then selects them when writing a post.

### 5. App Router Files
```
src/app/(payload)/
├── layout.tsx                          # import '@payloadcms/next/css'
├── admin/
│   └── [[...segments]]/
│       ├── page.tsx                    # RootPage from @payloadcms/next/views
│       └── not-found.tsx              # NotFoundPage from @payloadcms/next/views
└── api/
    └── [...slug]/
        └── route.ts                    # REST + GraphQL handler
```

### 6. Update next.config.ts
```typescript
import { withPayload } from '@payloadcms/next'
export default withPayload(nextConfig)
```

### 7. Environment Variables (add to .env.local + Vercel)
```
PAYLOAD_SECRET=<random 32+ char string>
BLOB_READ_WRITE_TOKEN=<from Vercel Blob dashboard under Storage → Blob>
```

### 8. Migration Script (scripts/migrate-blog-posts.ts)
One-time script:
- Reads all JSON files from `content/blog/posts/`
- Inserts each post via Payload local API
- Sets status to "published" for all migrated posts
- Reports success/failure count

Run after first deploy:
```bash
npx tsx scripts/migrate-blog-posts.ts
```

### 9. Update src/lib/blog.ts
Replace `import()` of JSON files with Payload local API calls:
```typescript
import { getPayload } from 'payload'
import config from '@payload-config'

export async function getAllPostsMeta() {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'posts',
    where: { status: { equals: 'published' } },
    sort: '-publishedAt',
  })
  return docs
}
```
All existing function signatures stay the same — only the data source changes.

### 10. Create First Admin User
After deploy, visit `/admin` to create the first admin user. Add SEO company with their own login credentials.

---

## Phased Rollout

| Phase | Scope |
|-------|-------|
| **Phase 1** (this plan) | Blog posts + media uploads |
| **Phase 2** (later) | Page copy via Payload Globals (hero text, CTAs) |

---

## Verification

1. `npm run dev` → visit `http://localhost:3000/admin` → admin UI loads
2. Create a test blog post in admin, set to published
3. Visit `/blog/[slug]` → post renders correctly
4. Upload an image via Media collection → image accessible via Vercel Blob URL
5. Run migration script → all 94 existing posts appear in admin
6. `npm run build` → static generation works with Payload as data source
7. Deploy to Vercel → `/admin` accessible, SEO company can log in

---

## Risks / Notes

- **Rich text migration**: Existing blog content is markdown. For Phase 1, keep `content` as a `textarea` and keep the existing `article-content.tsx` markdown renderer unchanged. Migrate to Payload's lexical rich text editor in Phase 2.
- **Build time**: Static generation will query the DB instead of reading files. Speed should be comparable.
- **Existing JSON files**: Keep `content/blog/posts/` as-is until migration is confirmed working, then archive.
- **BLOB_READ_WRITE_TOKEN**: Create in Vercel dashboard → Storage → Blob → Create Store.
- **No name collision**: Payload creates its own tables (`posts`, `media`, `users`, `payload_*`). Existing `leads` table is unaffected.
