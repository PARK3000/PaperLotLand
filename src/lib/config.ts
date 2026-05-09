/**
 * Configuration loader for the template website builder
 *
 * Loads settings from config/*.json files and provides typed access
 * to site, business, and integration settings.
 */

import siteConfigData from '@/../config/site.config.json'
import businessConfigData from '@/../config/business.config.json'
import integrationsConfigData from '@/../config/integrations.config.json'

// Site configuration types
export interface SiteConfig {
  siteName: string
  siteTagline: string
  siteDescription: string
  siteUrl: string
  theme: {
    primaryColor: string
    secondaryColor: string
    accentColor: string
    backgroundColor: string
    textColor: string
  }
  fonts: {
    heading: string
    body: string
  }
  logo: {
    src: string
    alt: string
    width: number
    height: number
  }
  favicon: string
  seo: {
    defaultTitle: string
    titleTemplate: string
    defaultDescription: string
    defaultKeywords: string[]
    ogImage: string
    twitterHandle?: string
  }
  features: {
    blog: boolean
    contactForm: boolean
    newsletter: boolean
    testimonials: boolean
    faq: boolean
    chat: boolean
  }
}

// Business configuration types
export interface BusinessConfig {
  name: string
  legalName: string
  type: string
  contact: {
    phone: string
    phoneDisplay: string
    email: string
    supportEmail?: string
  }
  address: {
    street: string
    suite?: string
    city: string
    state: string
    zip: string
    country: string
  }
  hours: {
    monday: string
    tuesday: string
    wednesday: string
    thursday: string
    friday: string
    saturday: string
    sunday: string
  }
  // Optional display-friendly values
  hoursDisplay?: string
  serviceArea?: string
  yearEstablished?: string
  social: {
    facebook?: string
    instagram?: string
    twitter?: string
    linkedin?: string
    youtube?: string
    tiktok?: string
  }
  geo: {
    latitude: number
    longitude: number
    serviceArea: string[]
  }
  citations?: {
    googleKnowledgeGraph?: string
    googleBusinessProfile?: string
    bingPlaces?: string
    yelp?: string
    bbb?: string
    foursquare?: string
    vegasChamber?: string
    chamberOfCommerce?: string
    pinterest?: string
  }
  owner?: {
    name?: string
    social?: {
      facebook?: string
      instagram?: string
      linkedin?: string
    }
  }
}

// Integrations configuration types
export interface IntegrationsConfig {
  analytics: {
    googleTagManager: {
      enabled: boolean
      containerId: string
    }
    vercel: {
      enabled: boolean
    }
  }
  forms: {
    provider: string
    webhookEnabled: boolean
    emailNotifications: boolean
  }
  chat: {
    enabled: boolean
    provider: string
  }
  email: {
    provider: string
    fromName: string
    fromEmail: string
  }
  crm: {
    enabled: boolean
    provider: string
  }
  maps: {
    provider: string
    showOnContact: boolean
  }
}

// Export typed config objects
export const siteConfig = siteConfigData as SiteConfig
export const businessConfig = businessConfigData as BusinessConfig
export const integrationsConfig = integrationsConfigData as IntegrationsConfig

// siteUrl is used as a base URL that callers append "/path/" onto (sitemap,
// feed.xml, JSON-LD schemas, canonicals). A trailing slash here produces
// "domain.com//path/" everywhere — which cascades into Ahrefs "Double slash in
// URL", "3XX redirect in sitemap", and "Canonical points to redirect" findings
// and causes Google to treat canonicals as non-authoritative. Fail the build
// loudly if anyone reintroduces it.
if (siteConfig.siteUrl.endsWith('/')) {
  throw new Error(
    `config/site.config.json: siteUrl must NOT end with a trailing slash (got "${siteConfig.siteUrl}"). ` +
      `It is used as a base URL that callers append paths to; a trailing slash produces "//path/" in sitemaps, ` +
      `canonicals, and JSON-LD. The homepage canonical with its own trailing slash is set explicitly in src/app/page.tsx.`
  )
}

// Helper functions for common config access patterns
export function getSiteName(): string {
  return siteConfig.siteName
}

export function getSiteUrl(): string {
  return siteConfig.siteUrl
}

export function getPhoneNumber(): string {
  return businessConfig.contact.phone
}

export function getPhoneDisplay(): string {
  return businessConfig.contact.phoneDisplay
}

export function getEmail(): string {
  return businessConfig.contact.email
}

export function getFullAddress(): string {
  const { street, suite, city, state, zip } = businessConfig.address
  const parts = [street]
  if (suite) parts.push(suite)
  parts.push(`${city}, ${state} ${zip}`)
  return parts.join(', ')
}

export function getSocialLinks(): Record<string, string> {
  const links: Record<string, string> = {}
  Object.entries(businessConfig.social).forEach(([key, value]) => {
    if (value) links[key] = value
  })
  return links
}

export function isFeatureEnabled(feature: keyof SiteConfig['features']): boolean {
  return siteConfig.features[feature] ?? false
}
