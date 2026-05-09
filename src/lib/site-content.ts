/**
 * Site content loader — DB-first with fallback to hardcoded defaults.
 *
 * Each "section" is a key in the `site_content` table whose value is a JSONB
 * document.  When no DB row exists the loader returns the current hardcoded
 * values from constants.ts / config files so the site works identically until
 * an admin explicitly saves an override.
 */

import { cache } from 'react'
import { getDb } from '@/lib/db'
import { siteConfig, businessConfig } from '@/lib/config'
import {
  BUSINESS,
  KEY_FEATURES,
  PROCESS_STEPS,
  NAVIGATION,
  FOOTER_NAV,
  TRUST_STATS,
  VALUE_PROPS,
} from '@/lib/constants'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GeneralContent {
  businessName: string
  tagline: string
  phone: string
  phoneDisplay: string
  email: string
  address: {
    street: string
    city: string
    state: string
    zip: string
  }
  hours: string
  license: string
}

export interface HomepageContent {
  heroTitle: string
  heroSubtitle: string
  heroCtaText: string
  trustStats: { value: string; label: string; icon: string }[]
  valueProps: { title: string; description: string; icon: string }[]
  processSteps: { number: number; title: string; shortTitle: string; description: string }[]
  keyFeatures: { title: string; description: string; icon: string }[]
}

export interface NavItem {
  label: string
  href: string
  children?: { label: string; href: string }[]
}

export interface NavigationContent {
  mainNav: NavItem[]
  footerNav: {
    main: { label: string; href: string }[]
    secondary: { label: string; href: string }[]
  }
}

export interface SeoDefaultsContent {
  defaultTitle: string
  defaultDescription: string
  defaultKeywords: string[]
  ogImage: string
}

export interface FAQTable {
  caption?: string
  headers: string[]
  rows: string[][]
  /** Index of the column to highlight (e.g., "Selling to Us") */
  highlightColumnIndex?: number
}

export interface FAQBodySection {
  /** Optional H3 inside the accordion. */
  heading?: string
  paragraphs?: string[]
  /** Bullet list. Use "**Lead:** rest of bullet" syntax for bold lead-in. */
  bullets?: string[]
  /** Numbered list. Same lead-in syntax as bullets. */
  numbered?: string[]
  table?: FAQTable
  /** Final emphasis line, rendered as a callout. */
  callout?: string
}

export interface FAQItem {
  question: string
  /**
   * 40-250 char direct answer used for FAQPage schema and the lead paragraph
   * in the rendered body. Required for new entries; legacy entries can fall
   * back to `answer`.
   */
  summary?: string
  /** Optional structured body for rich rendering. */
  body?: FAQBodySection[]
  /**
   * @deprecated kept for backward compatibility with seeded DB rows that
   * predate the structured body shape. If present and `summary` is missing,
   * `answer` is treated as both summary and body.
   */
  answer?: string
}

export interface FAQContent {
  items: FAQItem[]
}

export interface TestimonialsContent {
  fallbackReviews: { name: string; date: string; text: string; rating: number }[]
}

export interface SiteContentRow {
  key: string
  value: Record<string, unknown>
  updated_by: string | null
  updated_at: string | null
}

// Allowed keys — used for validation in the API route
export const ALLOWED_KEYS = [
  'general',
  'homepage',
  'navigation',
  'seo_defaults',
  'faqs',
  'testimonials',
] as const

export type SiteContentKey = (typeof ALLOWED_KEYS)[number]

// ---------------------------------------------------------------------------
// Generic DB fetch
// ---------------------------------------------------------------------------

async function fetchFromDb<T>(key: string): Promise<T | null> {
  try {
    const sql = getDb()
    const rows = await sql`SELECT value FROM site_content WHERE key = ${key} LIMIT 1`
    if (rows.length === 0) return null
    return rows[0].value as T
  } catch {
    // DB unavailable — fall through to defaults
    return null
  }
}

// ---------------------------------------------------------------------------
// Default builders (from current constants/config)
// ---------------------------------------------------------------------------

function defaultGeneral(): GeneralContent {
  return {
    businessName: businessConfig.name,
    tagline: siteConfig.siteTagline,
    phone: BUSINESS.phone,
    phoneDisplay: BUSINESS.phoneDisplay,
    email: BUSINESS.email,
    address: {
      street: businessConfig.address.street,
      city: businessConfig.address.city,
      state: businessConfig.address.state,
      zip: businessConfig.address.zip,
    },
    hours: BUSINESS.hours,
    license: BUSINESS.license,
  }
}

function defaultHomepage(): HomepageContent {
  return {
    heroTitle: 'Access Off-Market Land Deals in Las Vegas',
    heroSubtitle: 'The Developer & Broker Network for',
    heroCtaText: 'Join the Network',
    trustStats: TRUST_STATS.map((s) => ({ ...s })),
    valueProps: VALUE_PROPS.map((v) => ({ ...v })),
    processSteps: PROCESS_STEPS.map((s) => ({ ...s })),
    keyFeatures: KEY_FEATURES.map((f) => ({ ...f })),
  }
}

function defaultNavigation(): NavigationContent {
  return {
    mainNav: NAVIGATION.map((n) => ({
      label: n.label,
      href: n.href,
      ...(n.children ? { children: n.children.map((c) => ({ ...c })) } : {}),
    })),
    footerNav: {
      main: FOOTER_NAV.main.map((l) => ({ ...l })),
      secondary: FOOTER_NAV.secondary.map((l) => ({ ...l })),
    },
  }
}

function defaultSeoDefaults(): SeoDefaultsContent {
  return {
    defaultTitle: siteConfig.seo.defaultTitle,
    defaultDescription: siteConfig.seo.defaultDescription,
    defaultKeywords: [...siteConfig.seo.defaultKeywords],
    ogImage: siteConfig.seo.ogImage,
  }
}

export function defaultFAQs(): FAQContent {
  return {
    items: [
      {
        question: 'What is PaperLotLand?',
        summary:
          'PaperLotLand is an off-market land network for the Las Vegas Valley. We connect developers, brokers, and investors with land deals that never hit the public market, and we host a resource library of GIS tools and zoning codes for every Clark County jurisdiction.',
        body: [
          {
            heading: 'A Private Network for Land Professionals',
            paragraphs: [
              'PaperLotLand was built by a Las Vegas land broker who was tired of watching great parcels get marketed publicly at inflated prices. The network exists to move land privately — buyers and sellers benefit from speed, confidentiality, and fair pricing without the MLS markup.',
            ],
          },
        ],
      },
      {
        question: 'How do I access off-market land deals?',
        summary:
          "Submit the join form with your name, email, phone, and what you're looking for. When a parcel matches your criteria, we reach out directly. All submissions are confidential.",
        body: [
          {
            paragraphs: [
              "Fill out the network signup form on this site. Let us know your role (developer, broker, investor, seller), what you're looking for, your general budget range, and your timeline. We match deals to your criteria and contact you before anything goes public.",
            ],
          },
        ],
      },
      {
        question: 'What types of land does PaperLotLand work with?',
        summary:
          'We work with all land types in Clark County: residential lots, multifamily sites, commercial pads, industrial land, mixed-use parcels, and raw acreage.',
        body: [
          {
            bullets: [
              '**Residential** — Single-family lots, townhome pads, condo pads',
              '**Multifamily** — Apartment and condo development sites, entitled and unentitled',
              '**Commercial / Retail** — Corner pads, strip-center outparcels, high-traffic corridors',
              '**Industrial / Flex** — Warehouse, distribution, and flex-industrial sites',
              '**Raw / Unentitled** — Larger acreage for future development',
            ],
          },
        ],
      },
      {
        question: 'Can I submit a land deal I want to sell?',
        summary:
          "Yes. If you own a parcel and want to explore an off-market sale — without listing it publicly — reach out via the contact form or call (702) 465-6111.",
        body: [
          {
            paragraphs: [
              "Sellers submit deals to us privately all the time. We run a quick underwriting check, match it to buyers in our network, and if there's a fit, we move fast. No public marketing, no sign on the lot, no MLS exposure until you decide you want it.",
            ],
          },
        ],
      },
      {
        question: 'What GIS resources are available on PaperLotLand?',
        summary:
          "We link directly to the official GIS portals for all five Clark County jurisdictions: Clark County GISMO, Henderson, North Las Vegas, Boulder City, and the City of Las Vegas, plus their zoning and development codes.",
        body: [
          {
            bullets: [
              '**Clark County GISMO** — Parcel search, ownership, zoning for unincorporated areas',
              '**Henderson** — GIS viewer, Development Code, master plan areas',
              '**North Las Vegas** — GIS viewer, Title 17 Zoning Regulations, Apex Industrial',
              '**Boulder City** — GIS portal, zoning ordinance, historic preservation overlay',
              '**City of Las Vegas** — GIS viewer, Unified Development Code, CityConnect permits',
            ],
          },
        ],
      },
      {
        question: 'What does land due diligence look like in Las Vegas?',
        summary:
          'At minimum: pull the parcel from the Clark County Assessor, confirm zoning and allowed uses, check for CCRs, review the preliminary title report, and verify utility availability. Raw land requires a Phase 1 environmental.',
        body: [
          {
            heading: 'Standard Due Diligence Checklist',
            numbered: [
              '**Parcel data** — Assessor parcel number, ownership, legal description from Clark County',
              '**Zoning confirmation** — Allowed uses, setbacks, FAR, height limits from the applicable jurisdiction',
              '**Title search** — Preliminary title report for liens, encumbrances, easements',
              '**CC&Rs / HOA** — Any deed restrictions that limit use or development',
              '**Utility verification** — Water, sewer, power, and gas availability and capacity',
              '**Phase 1 Environmental** — Required for raw or industrial land by most lenders',
            ],
            callout: 'We can connect you with local title companies, environmental firms, and entitlement attorneys.',
          },
        ],
      },
    ],
  }
}

function defaultTestimonials(): TestimonialsContent {
  return {
    fallbackReviews: [
      {
        name: 'Marcus D.',
        date: 'March 2026',
        text: 'Casey moved quickly on a parcel I had been sitting on for two years. Had a buyer in the network, closed in 21 days, and the transaction was completely off-market. Exactly what I needed.',
        rating: 5,
      },
      {
        name: 'Jennifer T.',
        date: 'January 2026',
        text: 'The GIS resource library alone is worth bookmarking. Having all five jurisdictions in one place saves me hours on every deal I underwrite in the valley.',
        rating: 5,
      },
      {
        name: 'Robert K.',
        date: 'November 2025',
        text: "Joined the network and received a call about an industrial site in NLV within two weeks. It was exactly what I was looking for. Closed 30 days later.",
        rating: 5,
      },
    ],
  }
}

// ---------------------------------------------------------------------------
// Public loaders — cached per request
// ---------------------------------------------------------------------------

export const getGeneralContent = cache(async (): Promise<GeneralContent> => {
  return (await fetchFromDb<GeneralContent>('general')) ?? defaultGeneral()
})

export const getHomepageContent = cache(async (): Promise<HomepageContent> => {
  return (await fetchFromDb<HomepageContent>('homepage')) ?? defaultHomepage()
})

export const getNavigationContent = cache(async (): Promise<NavigationContent> => {
  return (await fetchFromDb<NavigationContent>('navigation')) ?? defaultNavigation()
})

export const getSeoDefaults = cache(async (): Promise<SeoDefaultsContent> => {
  return (await fetchFromDb<SeoDefaultsContent>('seo_defaults')) ?? defaultSeoDefaults()
})

export const getFAQContent = cache(async (): Promise<FAQContent> => {
  return (await fetchFromDb<FAQContent>('faqs')) ?? defaultFAQs()
})

export const getTestimonialsFallback = cache(async (): Promise<TestimonialsContent> => {
  return (await fetchFromDb<TestimonialsContent>('testimonials')) ?? defaultTestimonials()
})

// ---------------------------------------------------------------------------
// Bulk fetch for admin page
// ---------------------------------------------------------------------------

export type AllSiteContent = {
  [K in SiteContentKey]: {
    value: Record<string, unknown>
    source: 'db' | 'defaults'
    updatedBy: string | null
    updatedAt: string | null
  }
}

function getDefault(key: SiteContentKey): Record<string, unknown> {
  switch (key) {
    case 'general': return defaultGeneral() as unknown as Record<string, unknown>
    case 'homepage': return defaultHomepage() as unknown as Record<string, unknown>
    case 'navigation': return defaultNavigation() as unknown as Record<string, unknown>
    case 'seo_defaults': return defaultSeoDefaults() as unknown as Record<string, unknown>
    case 'faqs': return defaultFAQs() as unknown as Record<string, unknown>
    case 'testimonials': return defaultTestimonials() as unknown as Record<string, unknown>
  }
}

export async function getAllSiteContent(): Promise<AllSiteContent> {
  const result = {} as AllSiteContent

  // Start with defaults for every key
  for (const key of ALLOWED_KEYS) {
    result[key] = {
      value: getDefault(key),
      source: 'defaults',
      updatedBy: null,
      updatedAt: null,
    }
  }

  // Override with DB values where they exist
  try {
    const sql = getDb()
    const rows = (await sql`SELECT key, value, updated_by, updated_at FROM site_content`) as SiteContentRow[]
    for (const row of rows) {
      if (row.key in result) {
        result[row.key as SiteContentKey] = {
          value: row.value,
          source: 'db',
          updatedBy: row.updated_by,
          updatedAt: row.updated_at,
        }
      }
    }
  } catch {
    // DB unavailable — all defaults, which is fine
  }

  return result
}
