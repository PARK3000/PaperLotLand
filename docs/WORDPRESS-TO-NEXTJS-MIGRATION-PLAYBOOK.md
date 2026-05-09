# WordPress → Next.js Site Migration: Step-by-Step Playbook

A field guide based on a real production migration of a real estate lead-gen site (~60 pages, 89 blog posts, active SEO rankings, live lead pipeline). 136 commits, ~7 weeks of iterative development.

---

## Phase 0: Audit & Pre-Work

### 0.1 Scrape the Live Site

Before writing a single line of code, capture everything from the existing WordPress site.

**Use FireCrawl MCP:**
```
/scrape-site https://yourdomain.com
```

Extract:
- Every page URL and its content (markdown)
- Navigation structure (header nav, footer links, dropdowns)
- All meta titles and descriptions
- Images and their alt text
- Phone numbers, addresses, business hours
- All form IDs and field structures (critical for CRM compatibility)

**What to capture in notes:**
- Gravity Forms form IDs (you'll need these for webhook parity)
- WordPress URL patterns (e.g. `/category/slug/` vs `/slug/`)
- Any shortcodes that appear in blog content (Fusion Builder, caption tags, etc. — these will poison your migrated content)

### 0.2 Extract the Design System

```
/extract-design https://yourdomain.com
```

Document:
- Exact hex codes for primary/secondary/accent colors
- Font families and weights (inspect Google Fonts embed in WP head)
- Spacing rhythm (padding/margin patterns)
- Button styles, card styles, border-radius values
- Hero section layout, gradient values

**Gotcha:** WP theme CSS is often messy. The "real" brand colors are in the actual rendered elements, not the theme settings. Use browser devtools on the live site to confirm computed values.

### 0.3 SEO Audit (Do This Before Any Code)

**Use DataForSEO MCP — never web search:**
```
/analyze-seo yourdomain.com
```

Capture:
- Every keyword currently ranking (position, search volume, URL)
- Competitor domains and their top keywords
- Which pages are driving the most traffic
- Any pages with featured snippets or local pack appearances

Save raw API responses to `seo/keyword-research.json`. You'll need this to:
- Prioritize which pages to build first
- Know which URLs **cannot change** (they have backlinks/rankings)
- Identify content gaps to fill on the new site

### 0.4 Create the Migration Plan

Before starting, write `docs/MIGRATION-PLAN.md` with:
- Every URL that must be preserved (table format)
- Which pages map to which templates
- Blog category structure
- Redirect map (WP URLs that will change → new URLs)
- Success metrics (Lighthouse targets, traffic baseline)

---

## Phase 1: Project Bootstrap

### 1.1 Initialize Next.js 15

```bash
npx create-next-app@latest --typescript --tailwind --app --src-dir
```

Key `next.config.ts` settings to configure immediately:
```typescript
// next.config.ts
const config: NextConfig = {
  // Preserve ALL WordPress URLs exactly
  redirects: async () => [
    // Add every WP URL that changed here
    { source: '/old-path', destination: '/new-path', permanent: true },
    // Catch-all for WordPress media uploads (critical!)
    { source: '/wp-content/:path*', destination: '/not-found', permanent: false },
    { source: '/wp-admin/:path*', destination: '/not-found', permanent: false },
  ],
  images: {
    remotePatterns: [/* your image domains */],
  },
};
```

**What we had to iterate on:** The catch-all redirect for `/wp-content/uploads/` wasn't added until week 3. Bots and backlinks pointing to old WordPress media were hitting 404s. Add this on day 1.

### 1.2 Config File Structure

Create `config/` with three JSON files (not `.env` — this is public-safe business data):

```
config/
├── site.config.json       # Brand colors, fonts, SEO defaults, logo path
├── business.config.json   # Phone, address, hours, service areas, team
└── integrations.config.json # GTM ID, GA4 ID, analytics keys
```

These become the single source of truth. Changes propagate everywhere automatically via a typed loader:

```typescript
// src/lib/config.ts
import siteConfig from '../../config/site.config.json';
import businessConfig from '../../config/business.config.json';
import integrationsConfig from '../../config/integrations.config.json';

export const config = { site: siteConfig, business: businessConfig, integrations: integrationsConfig };
```

**Why this matters:** You'll change phone numbers, add service areas, and tweak SEO defaults dozens of times. Having it in one place means you never hunt through 60 page files.

### 1.3 Constants File

Create `src/lib/constants.ts` for all site content that isn't business data:
- Testimonials array (name, quote, stars, location)
- FAQ items (question, answer)
- Team members (name, title, bio, photo)
- How-it-works steps
- Situation page content
- Navigation structure

This file will grow large (ours hit 12K+ lines). That's fine. It's queryable, typesafe, and means no CMS dependency.

---

## Phase 2: Layout & Design System

### 2.1 Tailwind CSS v4 Setup

With Tailwind v4, you define your design tokens in `globals.css` using CSS variables:

```css
/* src/app/globals.css */
@import "tailwindcss";

:root {
  --color-primary: #06263A;   /* Navy */
  --color-accent: #CD2C2C;    /* Red */
  --color-brand-blue: #3698D5;
}
```

**Gotcha we hit:** Tailwind v4 uses CSS cascade layers. Third-party components (Google Places autocomplete dropdown) rendered inside a layer-scoped component would have their styles overridden by Tailwind reset styles. The fix was understanding layer ordering — documented in `docs/solutions/ui-bugs/focus-outline-css-cascade-layers-Hero-20260303.md`.

### 2.2 Header Component

Build `src/components/layout/header.tsx` first — it blocks everything else.

Key implementation decisions:
- Mobile hamburger menu with `useState` for open/close
- Dropdown menus on desktop with hover state
- Sticky header with `position: sticky; top: 0; z-index: 50`
- CTA button always visible (phone number on mobile, "Get Cash Offer" button)

**What we iterated on:** The header nav dropdown timing. Initial implementation used CSS `:hover` but this broke on touch devices. Switched to `onMouseEnter`/`onMouseLeave` with a small delay ref to prevent flicker when moving between trigger and dropdown.

### 2.3 Footer Component

Include in footer:
- Two-column layout: nav links + contact info
- Phone number as `<a href="tel:...">` (tracked by GTM)
- Both office addresses if applicable
- Trust signals (BBB badge, Google rating)
- Copyright with current year (`new Date().getFullYear()`)

### 2.4 Mobile CTA Bar

For lead-gen sites, add a fixed bottom bar on mobile:

```typescript
// src/components/layout/mobile-cta-bar.tsx
// Renders: [Call Now] [Get Cash Offer]
// Fixed bottom-0, z-50, hidden on desktop (lg:hidden)
```

This was one of the highest-converting elements — don't skip it.

---

## Phase 3: Component Architecture

### 3.1 The Three-Tier Component Hierarchy

Organize components into three tiers:

**Tier 1 — UI Primitives** (`src/components/ui/`)
Atomic, stateless, fully reusable:
- `Button` — variants: primary, secondary, outline, ghost; sizes: sm, md, lg
- `Input` — with label, error state, ref forwarding
- `Card` — with optional header/footer slots
- `Badge` — for labels/tags
- `PhoneLink` — renders `<a href="tel:...">` with click tracking

**Tier 2 — Section Components** (`src/components/sections/`)
Self-contained page sections, accept props for customization:
- `Hero` — headline, subheadline, background, CTA, form variant
- `LeadForm` — variant: quick/standard/full/multistep
- `Testimonials` — array of testimonials, carousel or grid
- `HowItWorks` — steps array, layout: horizontal/vertical
- `FAQSection` — accordion with JSON-LD schema option
- `CTASection` — headline, subheadline, CTA button

**Tier 3 — Page Templates** (`src/components/templates/`)
Compose sections into full page layouts:
- `LandingPageTemplate` — Hero + LeadForm + TrustBar + Testimonials + FAQ + CTA
- `LocationPageTemplate` — Hero + LocalInfo + HowItWorks + Testimonials + CTA
- `SituationPageTemplate` — Hero + ProblemSection + Solution + Testimonials + CTA
- `CaseStudyTemplate` — Header + Story + Results + Testimonials + CTA

**Why this matters:** Once you have ~5 templates, building 50 pages is just data, not code. A new landing page is 30 lines of page-specific copy passed to `LandingPageTemplate`.

### 3.2 The `cn()` Utility

Always use this for conditional Tailwind classes:

```typescript
// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

```typescript
// Usage
<button className={cn(
  "px-4 py-2 rounded font-semibold",
  variant === 'primary' && "bg-primary text-white",
  variant === 'secondary' && "bg-white border border-primary text-primary",
  disabled && "opacity-50 cursor-not-allowed"
)}>
```

---

## Phase 4: Content Migration

### 4.1 Blog Posts as JSON

Store each blog post as a JSON file:

```json
// content/blog/posts/your-post-slug.json
{
  "title": "Post Title",
  "slug": "your-post-slug",
  "category": "selling-a-home",
  "publishedAt": "2024-03-15",
  "author": "Casey Ryan",
  "excerpt": "Short description for meta and listing",
  "content": "# Markdown content here\n\nParagraph text...",
  "featuredImage": "/images/blog/post-image.jpg",
  "metaDescription": "SEO meta description"
}
```

**The blog utility** (`src/lib/blog.ts`) handles:
- Loading all posts from the directory
- Filtering by category
- Sorting by date
- Generating pagination
- Finding related posts

```typescript
// src/lib/blog.ts
export async function getAllPosts(): Promise<BlogPost[]>
export async function getPostBySlug(slug: string): Promise<BlogPost | null>
export async function getPostsByCategory(category: string): Promise<BlogPost[]>
export async function getPaginatedPosts(page: number, perPage: number)
```

**What we had to iterate on:** Blog posts exported from WordPress had shortcodes embedded in the content:
- `[caption id="..." align="..." width="..."]...[/caption]` — WP image captions
- `[fusion_builder_...]` — Fusion Builder page builder tags
- `[ai_playlist]` — Third-party plugin tags
- HTML entities encoded as `&amp;`, `&lt;`, etc.

We ran a cleanup script (`scripts/clean-fusion-shortcodes.ts`) that stripped all of these. Run this before importing. Also strip WordPress `<!-- wp:paragraph -->` block comments.

### 4.2 Rendering Blog Post Content

Use `react-markdown` with `remark-gfm`:

```typescript
// src/components/ui/article-content.tsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function ArticleContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h2: ({ children }) => <h2 className="text-2xl font-bold mt-8 mb-4">{children}</h2>,
        a: ({ href, children }) => <a href={href} className="text-primary underline">{children}</a>,
        img: ({ src, alt }) => <Image src={src} alt={alt} width={800} height={400} />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
```

**What we had to iterate on:** Heading hierarchy from WP exports is inconsistent. Some posts start at `h1`, some at `h2`, some mix them randomly. Write a preprocessor that normalizes heading levels before rendering.

---

## Phase 5: SEO Infrastructure

### 5.1 Metadata on Every Page

Every `page.tsx` exports a `generateMetadata` function:

```typescript
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Page Title | Brand Name',
    description: 'Meta description 150-160 chars.',
    openGraph: {
      title: 'Page Title',
      description: 'OG description',
      url: 'https://yourdomain.com/page-slug/',
      images: [{ url: '/images/og-default.jpg', width: 1200, height: 630 }],
    },
    alternates: {
      canonical: 'https://yourdomain.com/page-slug/',
    },
  };
}
```

**Gotcha:** Always include a trailing slash on canonical URLs if that's your URL convention. Inconsistency creates duplicate content issues.

### 5.2 Structured Data (JSON-LD)

Build schema components that render inline `<script type="application/ld+json">`:

```typescript
// src/components/seo/local-business-schema.tsx
export function LocalBusinessSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "name": config.business.name,
    "telephone": config.business.phone,
    "address": { "@type": "PostalAddress", /* ... */ },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "127"
    }
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}
```

**What we had to iterate on:** The WordPress site had a specific review snippet schema that Google was already indexing. Our initial schema format differed slightly, causing the review stars to disappear from SERPs. We did a schema parity audit by comparing the WP site's JSON-LD to ours field by field.

**Schemas to include by page type:**
- Homepage: `LocalBusiness` + `Organization` + `FAQPage`
- Location pages: `LocalBusiness` (with location-specific address)
- Blog posts: `Article` (with `datePublished`, `author`, `image`)
- FAQ page: `FAQPage`
- All pages: `BreadcrumbList`

### 5.3 Breadcrumb Schema

Add `BreadcrumbList` to every non-homepage page. We added it to 40+ pages in one pass after noticing it was present on the WP site but missing from the Next.js version.

```typescript
// src/components/seo/breadcrumb-schema.tsx
export function BreadcrumbSchema({ items }: { items: { name: string; url: string }[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": item.name,
      "item": item.url,
    }))
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}
```

### 5.4 Sitemap & robots.txt

Use Next.js's built-in sitemap generation:

```typescript
// src/app/sitemap.ts
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPosts();
  const blogUrls = posts.map(post => ({
    url: `${SITE_URL}/${post.category}/${post.slug}/`,
    lastModified: new Date(post.publishedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  const staticPages = [
    { url: `${SITE_URL}/`, priority: 1.0 },
    { url: `${SITE_URL}/how-it-works/`, priority: 0.9 },
    // ... all static pages
  ];

  return [...staticPages, ...blogUrls];
}
```

**Gotcha:** WordPress sitemaps often include pages the Next.js site doesn't have yet. Do a diff between the WP sitemap and yours before cutover. We discovered 11 pages missing from our sitemap the week before DNS cutover.

---

## Phase 6: Lead Generation Pipeline

### 6.1 The Architecture Decision: Real-Time Streaming

The key insight for lead-gen sites: **the phone call is worth more if it happens while the lead is still on the site.** Standard "submit and notify" loses warm leads. We built streaming.

```
User fills form
  ├─ Address autocomplete selection → immediate webhook ("address_selected")
  ├─ Every 10 seconds (if data changed) → webhook ("partial_update")
  ├─ Form submit → webhook ("form_submit") → CRM
  └─ ALL sends → logged to Postgres
```

**What we iterated on extensively:**

**Iteration 1:** Initial approach used Redis heartbeat on field blur. Users who abandoned got recovered by a cron job.

**Iteration 2:** Replaced heartbeat with active streaming — send partial data every 10 seconds + on address selection. This is the pivot that made the pipeline genuinely real-time.

**Iteration 3:** The 10-second interval and the address-selection trigger could both fire at the same millisecond. Added deduplication using `session_token + submission_type` as a composite unique key in Postgres.

**Iteration 4:** When users navigated between pages (hero form → `/thank-you/`), UTM params and address data were lost from the webhook payload. Fixed by persisting tracking params in `sessionStorage`.

**Iteration 5:** The API endpoint had no rate limiting. Added Redis-based rate limiting: 5 requests/minute per IP. Critical for production.

### 6.2 Form Variants

```typescript
// src/components/sections/lead-form.tsx
type FormVariant = 'quick' | 'standard' | 'full' | 'multistep';

// quick:     address + phone
// standard:  name + address + phone
// full:      name + email + address + phone + "how did you hear"
// multistep: step 1 (address) → step 2 (name + phone + email)
```

**What we iterated on — multistep form:**

The hero form went through many iterations:
1. Simple address input → redirect to full form on `/get-your-cash-today/`
2. Inline multi-step: address (step 1) → contact info (step 2) — no redirect
3. Prefill problem: URL params for name/email/phone weren't being applied from the redirect
4. Separate journey problem: Homepage inline form and LP inline form had different submit behaviors
5. Name field consolidation: Started with first/last name (two fields) → changed to full name (one field) based on form performance data

### 6.3 Google Places Address Autocomplete

This was the most-iterated single component in the project. Iterations included:

1. Initial implementation using the classic Places Autocomplete widget
2. Google deprecated the old widget — migrated to the new element-based API
3. Web component approach had styling issues — switched to the data-only `AutocompleteSuggestion` API for full control
4. Dropdown z-index fighting with hero overlay
5. Places dropdown briefly showing dark background on render — inject shadow styles at creation time
6. Multiple attempts to override browser/Tailwind focus ring on the input — ultimately required `[box-shadow:none]` arbitrary value
7. Autocomplete wasn't pre-populating when navigating back with URL params

**Lesson:** The Google Places API has a lot of edge cases. Budget significant time for this component. Use the data-only `AutocompleteSuggestion` API (not the web component) for maximum style control.

### 6.4 Webhook Payload Structure (Gravity Forms Compatibility)

If your CRM (n8n, Podio, etc.) is already receiving data from Gravity Forms on the WP site, your payload format must match exactly. Build a payload builder that mimics GF's format:

```typescript
// src/lib/leads/webhook-payload.ts
export function buildWebhookPayload(fields: FormFields, meta: SubmissionMeta) {
  return {
    form_id: meta.formId,           // Match GF form ID
    entry_id: meta.sessionToken,     // Correlation ID
    '1': fields.fullName,           // GF field IDs as strings
    '2': fields.email,
    '3': fields.phone,
    '4': fields.address,
    'field_utm_source': meta.utmSource,
    'field_utm_medium': meta.utmMedium,
    // etc.
  };
}
```

**Gotcha:** GF sends field names as numeric IDs (e.g. `'1'`, `'2.3'` for sub-fields). Your n8n workflows are parsing these exact strings. Map every field carefully before migrating.

### 6.5 Postgres Schema for Lead Logging

```sql
CREATE TABLE leads (
  id SERIAL PRIMARY KEY,
  session_token TEXT NOT NULL,
  submission_type TEXT NOT NULL,  -- address_selected, partial_update, address_submit, form_submit
  status TEXT DEFAULT 'pending',  -- delivered, failed, fallback_delivered, fallback_failed
  payload JSONB,
  fields JSONB,
  form_id TEXT,
  page_url TEXT,
  n8n_attempts INT DEFAULT 0,
  podio_attempts INT DEFAULT 0,
  error_message TEXT,
  ip TEXT,
  user_agent TEXT,
  ga_client_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_token, submission_type)  -- Prevent duplicates
);

-- Critical indexes
CREATE INDEX idx_leads_session_token ON leads(session_token);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_at ON leads(created_at);
```

The `UNIQUE(session_token, submission_type)` constraint is the key deduplication mechanism.

### 6.6 Fallback Chain

Never rely on a single delivery path for leads:

```
1. Primary:   n8n webhook (LEADS_WEBHOOK_URL)
2. Immediate: If n8n fails on form_submit → Podio immediately (3 retries)
3. Cron:      Failed form_submit records > 5 min old → Podio (max 3 attempts)
4. Recovery:  Redis abandoned lead detection (15 min timeout → Podio)
```

The Vercel cron job runs every 1 minute and handles both fallback recovery and abandoned lead cleanup.

---

## Phase 7: Analytics & GTM

### 7.1 GTM-First Strategy

Do not hardcode analytics tags into the codebase. Use GTM for everything:
- GA4 base tag
- GA4 custom events
- Google Ads conversion tags
- Microsoft UET / Bing
- Clarity, Lucky Orange, any heatmap tools
- Any other tracking pixels

Your codebase only loads GTM once, and all tag management happens in GTM UI.

```typescript
// src/app/layout.tsx
import Script from 'next/script';

<Script
  id="gtm"
  strategy="afterInteractive"  // Don't block render
  dangerouslySetInnerHTML={{
    __html: `(function(w,d,s,l,i){...})(window,document,'script','dataLayer','${GTM_ID}');`
  }}
/>
```

**What we iterated on:** Initially GTM was loaded with `strategy="beforeInteractive"`, which blocked LCP. Moving to `afterInteractive` was one of the key mobile performance wins (Lighthouse 39 → 75+).

### 7.2 DataLayer Events

Push events from your form components:

```typescript
// src/lib/analytics/gtag.ts
export function pushEvent(event: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...params });
}

// Usage in form component
pushEvent('address_selected', {
  form_id: formId,
  page_url: window.location.href
});
```

### 7.3 GTM Script API

For programmatic tag management, use the GTM API via a service account:

```bash
node scripts/gtm-api.js list-tags
node scripts/gtm-api.js list-triggers
node scripts/gtm-api.js publish --note "Add conversion tag"
```

**Gotcha:** The GTM API's publish endpoint returns 404 on some account configurations. You can create versions programmatically but may need to publish manually in the GTM UI.

---

## Phase 8: Performance Optimization

This was one of the most significant iteration cycles. We went from Lighthouse mobile 39 → 75+.

### 8.1 Script Loading Strategy

Order of impact, highest to lowest:

**1. Defer GTM (biggest win)**
```typescript
strategy="afterInteractive"  // not "beforeInteractive"
```

**2. YouTube Facade Pattern**
Never load YouTube embeds eagerly. Use a click-to-play facade:

```typescript
// src/components/sections/video-section.tsx
// Shows thumbnail + play button image
// Only loads actual YouTube iframe on user click
// Saved 722 KiB of JavaScript on initial load
```

**3. Defer Live Chat**
```typescript
strategy="lazyOnload"  // Loads after everything else
```

**4. Inline Critical CSS**
For above-the-fold styles (hero section), inline them directly in the component to eliminate render-blocking:

```typescript
// Instead of a CSS class that requires stylesheet parse
<section style={{ background: 'linear-gradient(135deg, #06263A 0%, #0d3a57 100%)' }}>
```

### 8.2 Next.js Image Component

Every image must use `next/image`:

```typescript
import Image from 'next/image';

<Image
  src="/images/hero-bg.jpg"
  alt="Las Vegas homes"
  width={1200}
  height={800}
  priority  // Add for LCP images (hero section only)
  placeholder="blur"
  blurDataURL="data:image/..."
/>
```

**What we iterated on:**
- The `priority` prop was missing on hero images for weeks. Adding it was a significant LCP improvement.
- Images without explicit `width`/`height` or `fill` with a sized container cause CLS (Cumulative Layout Shift).

### 8.3 Reducing Hydration Cost

For sections with no interactivity (static testimonials, trust bars, how-it-works), avoid making them Client Components:

```typescript
// BAD — forces client-side hydration for no reason
'use client';
export function Testimonials() { ... }

// GOOD — static HTML, no hydration cost
// No 'use client' directive
export function Testimonials() { ... }
```

Move `'use client'` as deep as possible — only the interactive leaf nodes (forms, accordions, carousels) need it.

### 8.4 Results

| Metric | Before | After |
|--------|--------|-------|
| Mobile Lighthouse | 39 | 75+ |
| Desktop Lighthouse | ~70 | 90+ |
| LCP | 14.4s | 3.2s |
| TBT | 760ms | 40ms |
| FCP | 7.4s | 3.4s |
| CLS | 0.05 | 0.003 |

---

## Phase 9: Security Hardening

### 9.1 Rate Limiting on Lead API

```typescript
// src/lib/leads/rate-limit.ts
import { Redis } from '@upstash/redis';

export async function checkRateLimit(ip: string): Promise<boolean> {
  const key = `rate:lead:${ip}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 60); // 1 minute window
  return count <= 5; // 5 requests per minute
}
```

**Gotcha we shipped without initially:** The lead submission API had no rate limiting. Always add rate limiting to any public API endpoint on day one.

### 9.2 Honeypot Fields

Add a hidden field to all forms to catch bots:

```typescript
// In every lead form
<input
  type="text"
  name="website"         // Honeypots have normal-looking names
  className="sr-only"    // Hidden from real users
  tabIndex={-1}
  autoComplete="off"
  aria-hidden="true"
/>
```

In the API handler, reject any submission where this field is filled.

### 9.3 Environment Variables

Never commit secrets. Use `.env.local` for development and Vercel environment variables for production:

```bash
DATABASE_URL=               # Neon Postgres connection string (pooled)
KV_REST_API_URL=            # Upstash Redis URL
KV_REST_API_TOKEN=          # Upstash Redis token
LEADS_WEBHOOK_URL=          # n8n webhook
PODIO_FALLBACK_URL=         # CRM fallback
CRON_SECRET=                # Vercel cron auth
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=  # Public — safe to expose
NEXT_PUBLIC_GTM_ID=         # Public — safe to expose
NEXT_PUBLIC_SITE_URL=       # Production URL
```

**Gotcha we hit:** An early commit accidentally included API credentials in a config file. Always run `git diff --cached` before committing and add all secret files to `.gitignore` immediately.

---

## Phase 10: QA & Pre-Launch Checklist

### 10.1 Page Status Verification

Verify all pages return 200:

```bash
for url in $(cat urls.txt); do
  status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
  echo "$status $url"
done
```

Check for:
- All static pages: 200
- All blog posts: 200
- Custom 404 page: loads for unknown routes
- Sitemap: 200 with valid XML
- RSS feed: 200 with valid XML

### 10.2 Redirect Verification

Test every redirect in `next.config.ts`:

```bash
curl -I https://yoursite.vercel.app/old-wp-path
# Should return: HTTP/2 301 + Location: /new-path
```

We found 11 WordPress URL patterns that were missing from our redirect config and added them before cutover.

### 10.3 SEO Parity Check

Before cutover, compare your new site to the live WordPress site:

| Check | Tool |
|-------|------|
| Schema markup present on all pages | Google Rich Results Test |
| All GF form IDs sending correct payloads | n8n webhook logs |
| Phone click tracking fires | GTM Preview mode |
| GA4 receiving pageviews | GA4 Realtime |
| Sitemap matches WP sitemap URLs | Diff the two sitemaps |
| No broken internal links | Screaming Frog or Ahrefs |

### 10.4 Accessibility

Run Lighthouse accessibility audit on every page type:
- Form inputs need `<label>` elements (even if visually hidden with `sr-only`)
- Color contrast: text on colored backgrounds must meet WCAG AA (4.5:1 ratio)
- Images need descriptive `alt` text
- Buttons need accessible labels when they're icon-only

**What we had to fix post-audit:**
- `text-white/90` → `text-white` across CTA sections (opacity reduces contrast ratio)
- Muted text color `#6b7280` → `#555d68` (failed contrast on white backgrounds)
- Added `aria-label` to BBB badge links
- Added `sr-only` labels to landing page form inputs

---

## Phase 11: DNS Cutover

### 11.1 Pre-Cutover (1 Week Before)

1. **Lower DNS TTL** to 300 seconds on the current A record
2. **Set up legacy subdomain** `legacy.yourdomain.com` pointing to the WordPress host
3. **Verify Vercel domain** is configured and SSL is active
4. **Full WordPress backup** (files + database export)
5. **Test all forms on Vercel preview URL** — confirm leads reach CRM
6. **Verify all analytics tags fire** on Vercel preview URL via GTM Preview

### 11.2 Cutover Day

1. Update A record to Vercel's IP addresses
2. Verify DNS propagation: `dig yourdomain.com`
3. Test critical paths immediately:
   - Homepage loads
   - Hero form submits → confirm lead in CRM
   - Blog loads
   - Landing pages work
   - Phone click tracking fires
4. Submit updated sitemap to Google Search Console

### 11.3 Post-Cutover Monitoring (First 48 Hours)

- **GA4 Real-time** — confirm traffic is flowing normally
- **Vercel logs** — watch for 404 errors (missing redirects)
- **Search Console** — watch for crawl errors
- **CRM/n8n** — confirm leads are arriving
- **Form submission test** — submit a real test lead and confirm full pipeline

### 11.4 Post-Cutover (Week 2-4)

- Restore DNS TTL to 3600
- Monitor GSC for new 404s (add redirects for any that appear)
- Monitor keyword rankings (expect 1-2 week fluctuation during index update)
- After 4+ weeks with no issues: decommission WordPress host

---

## Key Lessons & Gotchas Summary

| Problem | When It Bit Us | Prevention |
|---------|---------------|------------|
| WordPress shortcodes in blog content | Week 2 — broken blog posts | Run cleanup script before migrating content |
| Missing `/wp-content/` catch-all redirect | Week 3 — 404s from backlinks | Add to `next.config.ts` on day 1 |
| GTM blocking LCP | Week 4 — mobile Lighthouse 39 | Always load GTM with `afterInteractive` |
| YouTube eager loading | Week 4 — 722 KiB JS on mobile | Use facade pattern from the start |
| Places API deprecation mid-project | Week 2 — dropdown styling broke | Use data-only `AutocompleteSuggestion` API |
| Duplicate webhooks from race condition | Week 5 — duplicate CRM entries | Use `UNIQUE(session_token, submission_type)` in DB |
| UTM params lost on navigation | Week 6 — incomplete webhook data | Persist tracking params to `sessionStorage` on mount |
| No rate limiting on lead API | Pre-launch — security review | Add rate limiting to all public API endpoints on day 1 |
| Schema parity differences | Week 5 — review stars disappeared | Field-by-field comparison of WP and Next.js JSON-LD |
| Sitemap URL gaps | Pre-launch — 11 missing pages | Diff your sitemap against the WP sitemap before cutover |
| Color contrast failures | Week 4 — Lighthouse accessibility < 100 | Run contrast checker during design, not post-QA |
| Exposed credentials in commit | Week 1 | Comprehensive `.gitignore` before first commit |
| Heading hierarchy inconsistency in WP content | Week 2 | Preprocess and normalize before rendering |
| Chat widget overlay blocking form inputs | Week 3 — users couldn't type | Set `pointer-events: none` on chat widget transparent overlay |
| Hydration mismatch on session token generation | Week 2 — console errors | Generate session token in `useEffect`, never during SSR |

---

## Tools Used

| Tool | Purpose |
|------|---------|
| FireCrawl MCP | Scrape WP site content, images, navigation |
| DataForSEO MCP | Keyword research, competitor analysis, ranking data |
| Ahrefs | Ongoing SEO monitoring, broken link detection |
| Google Search Console | Index coverage, performance, crawl errors |
| Microsoft Clarity | Session recordings, heatmaps, UX analysis |
| PostHog | Event analytics, funnel analysis |
| Vercel | Hosting, deployment, edge functions, cron |
| Neon Postgres | Lead logging, fallback recovery |
| Upstash Redis | Session state, rate limiting |
| n8n | Webhook automation, CRM routing |
| GTM | All analytics tag management |

---

## Timeline Reference

Based on this project (~7 weeks, 136 commits):

| Week | Focus |
|------|-------|
| 1 | Bootstrap, design system, layout components |
| 2 | Core pages, blog migration, Google Places (first iteration) |
| 3 | Location/situation/landing pages, forms, initial lead pipeline |
| 4 | Case studies, performance optimization, accessibility fixes |
| 5 | Lead pipeline hardening (streaming, deduplication, fallbacks) |
| 6 | SEO parity, schema audit, breadcrumbs, broken link fixes |
| 7 | Security hardening, QA, pre-launch checklist, DNS cutover prep |

The biggest meta-lesson: **the lead pipeline takes 3x longer than you expect**, the **address autocomplete component takes 2x longer**, and **performance optimization is a separate phase**, not something you sprinkle in during development.
