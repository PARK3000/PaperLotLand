import { SITE } from '@/lib/constants'
import { getGoogleReviews } from '@/lib/google-reviews'
import { siteConfig } from '@/lib/config'

interface ProductReviewSchemaProps {
  /** Canonical page URL path, e.g. "/happy-sellers/" */
  pageUrl: string
}

/**
 * Outputs a @type: Product JSON-LD block with AggregateRating.
 *
 * Google shows review-star rich results for Product entities but suppresses
 * them for LocalBusiness/RealEstateAgent self-served reviews. Adding this
 * alongside the existing LocalBusinessSchema gives the best chance of
 * triggering star snippets in SERPs.
 */
export async function ProductReviewSchema({ pageUrl }: ProductReviewSchemaProps) {
  const googleReviews = await getGoogleReviews()

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: siteConfig.siteName,
    image: `${SITE.url}/images/og-image.jpg`,
    description: siteConfig.siteDescription,
    brand: {
      '@type': 'Brand',
      name: siteConfig.siteName,
    },
    url: `${SITE.url}${pageUrl}`,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: googleReviews.rating,
      bestRating: '5',
      worstRating: '1',
      reviewCount: String(googleReviews.count),
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
