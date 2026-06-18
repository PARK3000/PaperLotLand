# PaperLotLand — Website Project

Las Vegas Valley off-market land network. Connects developers, brokers, and investors with land deals that never hit the public MLS. Also maintains a GIS/zoning resource library for all Clark County jurisdictions.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Content**: JSON for blog, config files for settings
- **Database**: Neon Postgres (via Vercel Storage)
- **Cache**: Upstash Redis (session state)
- **Analytics**: PostHog, GA4, Clarity (optional)
- **Deployment**: Vercel

## Project Structure

```
├── .claude/
│   ├── commands/         # Custom slash commands
│   └── settings.json     # Claude Code settings
├── config/
│   ├── site.config.json      # Branding, theme, SEO defaults
│   ├── business.config.json  # Contact, hours, service areas
│   └── integrations.config.json # Analytics, forms, maps
├── content/
│   └── blog/             # Blog post JSON files + index.json
├── public/
│   ├── images/           # Static images (logo, lots, blog, team)
│   ├── robots.txt        # Search engine directives
│   └── llms.txt          # LLM crawler directives
├── scripts/              # Build and utility scripts
└── src/
    ├── app/
    │   ├── (site)/       # Public-facing pages
    │   ├── admin/        # Admin panel
    │   └── api/          # API routes (leads, cron, admin, chat)
    ├── components/
    │   ├── layout/       # Header, Footer, MobileCTABar
    │   ├── sections/     # Page sections (LandLeadForm, etc.)
    │   ├── seo/          # Schema components
    │   ├── templates/    # Page templates
    │   └── ui/           # Reusable UI (Button, Input, Card)
    └── lib/
        ├── leads/        # Lead pipeline (types, webhook-payload, tracking)
        ├── config.ts     # Config loader
        ├── constants.ts  # Site constants
        └── blog.ts       # Blog utilities
```

## Key Config Files

| File | Purpose |
|------|---------|
| `config/site.config.json` | Site name, tagline, description, URL, theme colors, fonts |
| `config/business.config.json` | Phone `(702) 465-6111`, email `parker@paperlotland.com`, address, service area |
| `config/integrations.config.json` | Analytics IDs, feature flags |
| `src/lib/constants.ts` | Navigation, trust stats, value props, FAQ, team, jurisdictions, lot types, budget ranges |
| `src/lib/config.ts` | Centralized config loader — source of truth for all config values |

## Brand

- **Primary color**: `#1C3550` (navy)
- **Accent color**: `#C97D2E` (amber)
- **Fonts**: Manrope (heading + body)
- **Logo**: `/public/images/logo/logo.svg` (navy + amber), `/public/images/logo/logo-light.svg` (for dark BGs)

## Pages & Routes

### Core
- `/` — Homepage (hero, trust stats, closed sales gallery, how it works, value props, lead form, resources, FAQ)
- `/about/` — About Parker Gibbons & PaperLotLand
- `/available-lots/` — Current available parcels
- `/closed-sales/` — Past closed deals gallery
- `/off-market-deals/` — Lead capture — join the off-market network
- `/contact/` — Contact form
- `/thank-you/` — Post-submission confirmation
- `/privacy-policy/` — Legal

### GIS Resources
- `/resources/` — Hub page linking to all 5 jurisdictions
- `/resources/clark-county/` — Clark County GISMO + codes
- `/resources/henderson/` — Henderson GIS + codes
- `/resources/north-las-vegas/` — NLV GIS + codes
- `/resources/boulder-city/` — Boulder City codes
- `/resources/las-vegas/` — City of Las Vegas codes

Resources are auto-generated from the `JURISDICTIONS` array in `src/lib/constants.ts`.

### Blog
- `/blog/` — Blog listing
- `/blog/[slug]/` — Blog posts (loaded from `content/blog/posts/[slug].json`)
- `/blog/page/[num]/` — Pagination

### Admin
- `/admin/` — Admin panel (site content overrides, blog management, user management)

## Lead Generation

### Architecture
```
User fills form
    └─ Full submit → /api/leads/ → n8n webhook → Neon Postgres
                                                  └─ n8n failure → Podio fallback
                                 └─ Cron (1min) → failed form_submits > 5min → Podio
```

### Form Variants
Land-specific form at `src/components/sections/land-lead-form.tsx`:
- **quick** — Name + email only (`formId: 'land-quick'`)
- **standard** — Name + email + phone + role (`formId: 'land-standard'`)
- **full** — All fields: role, interest, lot type, budget, message (`formId: 'land-full'`)

Only email is required for land forms. The API builds a synthetic address string:
`Land Inquiry — {lotType} | Budget: {budget}`

The API detects land forms via `formId.startsWith('land-')` and skips address/phone validation.

### API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `POST /api/leads/` | Full form submission |
| `POST /api/leads/stream/` | Partial/streaming sends (edge runtime) |
| `GET /api/cron/abandoned-leads/` | Podio fallback recovery cron |

### Key Files

| File | Purpose |
|------|---------|
| `src/lib/leads/types.ts` | LeadSubmission, WebhookPayload, TrackingParams interfaces |
| `src/lib/leads/webhook-payload.ts` | Builds n8n/Gravity-Forms-compatible payloads |
| `src/lib/leads/tracking-params.ts` | Client-side UTM/click ID capture |
| `src/lib/leads/db-logger.ts` | Postgres logging + failed lead queries |
| `src/app/api/leads/route.ts` | Full submission handler |

### Land-Specific Webhook Fields
`WebhookPayload` includes: `role`, `interest`, `lot_type`, `budget`, `message`.
All three builder functions (`buildWebhookPayload`, `buildPartialWebhookPayload`, `buildAbandonedWebhookPayload`) include these fields (populated from submission or empty strings for partial/abandoned).

## Blog System

Blog posts live in `content/blog/posts/[slug].json`. The index is `content/blog/index.json`.

Categories: `Land Development`, `Zoning Resources`, `Market Analysis` — all map to the `/blog/` URL prefix (single blog route, no sub-category routes).

`CATEGORY_URL_MAP` in `src/lib/blog.ts` maps category names → URL prefixes.

## SEO Components

Located in `src/components/seo/`:
- `LocalBusinessSchema` — RealEstateAgent schema, uses `businessConfig.address` (structured object)
- `OrganizationSchema` — Organization schema
- `FAQSchema` — expects `faqs` prop (array of `{question, answer}`)
- `ArticleSchema` — for blog posts

**Important**: `BUSINESS.address` in constants is a flat string. For structured address fields (streetAddress, city, state, zip), always use `businessConfig.address` directly from `@/lib/config`.

## Constants (src/lib/constants.ts)

Key exports:
- `NAVIGATION` — Main nav with Resources dropdown
- `FOOTER_NAV` — Footer link groups
- `JURISDICTIONS` — Array of 5 Clark County jurisdictions (used for /resources/[jurisdiction]/ pages and footer links)
- `LOT_TYPES`, `BUDGET_RANGES`, `ROLES`, `INTEREST_OPTIONS` — Form select options
- `TRUST_STATS`, `VALUE_PROPS`, `PROCESS_STEPS` — Homepage section content
- `FAQ_ITEMS`, `CLOSED_SALES`, `TEAM`, `FOUNDER` — Content arrays
- `SOCIAL`, `CITATIONS`, `GOOGLE_REVIEWS`, `OFFICES`, `BBB` — Currently stubs (empty)
- `DEFAULT_REVIEWER`, `LAST_REVIEWED` — For review/schema components

## Environment Variables

Required in `.env.local`:
- `DATABASE_URL` — Neon Postgres connection string (pooled)
- `KV_REST_API_URL` — Upstash Redis URL
- `KV_REST_API_TOKEN` — Upstash Redis token
- `LEADS_WEBHOOK_URL` — n8n webhook for lead submissions
- `CRON_SECRET` — Vercel cron auth token
- `NEXT_PUBLIC_SITE_URL` — `https://paperlotland.com`

Optional:
- `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY` — Google Places autocomplete
- `INDEXNOW_KEY` — IndexNow API key (production only)
- `FALLBACK_THRESHOLD_MINUTES` — Minutes before Podio fallback (default: 5)
- `ABANDON_THRESHOLD_MINUTES` — Minutes before abandoned lead recovery (default: 15)

## Build & Deploy

```bash
# Development
npm run dev

# Build
npm run build

# Deploy (Vercel)
vercel
```

**Database setup** (first deploy only):
```bash
npx tsx scripts/setup-db.ts
```

## Code Style

- TypeScript everywhere
- Tailwind CSS (no CSS modules)
- Named exports over default exports
- `cn()` utility for conditional classes
- No comments unless the WHY is non-obvious
# Lead notifications enabled Thu Jun 18 18:12:37 UTC 2026
# Report recipient configured Thu Jun 18 18:47:24 UTC 2026
