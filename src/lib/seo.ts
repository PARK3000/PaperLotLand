import { Metadata } from 'next'
import { getBaseUrl } from './utils'

interface SEOConfig {
  title: string
  description: string
  image?: string
  noIndex?: boolean
}

/**
 * Generate metadata for a page
 */
export function generateMetadata({
  title,
  description,
  image,
  noIndex = false,
}: SEOConfig): Metadata {
  const baseUrl = getBaseUrl()
  const ogImage = image || `${baseUrl}/og-image.jpg`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  }
}

/**
 * Generate JSON-LD structured data for a local business
 */
export function generateLocalBusinessSchema(business: {
  name: string
  description: string
  url: string
  phone?: string
  email?: string
  address?: {
    street: string
    city: string
    state: string
    zip: string
    country: string
  }
  image?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: business.name,
    description: business.description,
    url: business.url,
    telephone: business.phone,
    email: business.email,
    image: business.image,
    address: business.address
      ? {
          '@type': 'PostalAddress',
          streetAddress: business.address.street,
          addressLocality: business.address.city,
          addressRegion: business.address.state,
          postalCode: business.address.zip,
          addressCountry: business.address.country,
        }
      : undefined,
  }
}

/**
 * Generate JSON-LD structured data for a website
 */
export function generateWebsiteSchema(site: {
  name: string
  url: string
  description: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: site.name,
    url: site.url,
    description: site.description,
  }
}

/**
 * Generate JSON-LD structured data for breadcrumbs
 */
export function generateBreadcrumbSchema(
  items: { name: string; url: string }[]
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}
