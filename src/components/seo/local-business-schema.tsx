import { SITE, BUSINESS } from '@/lib/constants'
import { businessConfig } from '@/lib/config'

interface LocalBusinessSchemaProps {
  city?: string
  state?: string
  pageUrl?: string
  slug?: string
  includeReviews?: boolean
  geo?: { latitude: number; longitude: number }
}

export async function LocalBusinessSchema({
  city = 'Las Vegas',
  state = 'Nevada',
  pageUrl: pageUrlProp,
}: LocalBusinessSchemaProps) {
  const pageUrl = pageUrlProp ? `${SITE.url}${pageUrlProp}` : SITE.url

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    '@id': `${SITE.url}/#business`,
    name: BUSINESS.name,
    description: `PaperLotLand is the Las Vegas Valley's off-market land network — connecting developers, brokers, and investors with land deals that never hit the public market.`,
    url: pageUrl,
    telephone: `+1-${BUSINESS.phone}`,
    email: BUSINESS.email,
    image: `${SITE.url}/images/logo/logo.svg`,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE.url}/images/logo/logo.svg`,
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: `${businessConfig.address.street}${businessConfig.address.suite ? ' ' + businessConfig.address.suite : ''}`,
      addressLocality: businessConfig.address.city,
      addressRegion: businessConfig.address.state,
      postalCode: businessConfig.address.zip,
      addressCountry: 'US',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 36.1023,
      longitude: -115.2192,
    },
    areaServed: [
      'Las Vegas', 'Henderson', 'North Las Vegas', 'Boulder City',
      'Clark County', 'Summerlin', 'Enterprise', 'Spring Valley',
    ].map((c) => ({
      '@type': 'City',
      name: c,
      containedInPlace: { '@type': 'State', name: 'Nevada' },
    })),
    knowsAbout: [
      'off-market land deals Las Vegas',
      'land development Clark County Nevada',
      'commercial land for sale Las Vegas',
      'residential lots Las Vegas Valley',
      'multifamily land Nevada',
      'industrial land Las Vegas',
      'Clark County GIS zoning',
      'Las Vegas land investment',
      'Nevada land development',
      'off-market land network',
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Land Brokerage Services',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Off-Market Land Deal Access',
            serviceType: 'Off-market land acquisition network',
            provider: { '@id': `${SITE.url}/#business` },
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Private Land Sale (No Public Listing)',
            serviceType: 'Private land disposition',
            provider: { '@id': `${SITE.url}/#business` },
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'GIS & Zoning Research Resources',
            serviceType: 'Land due diligence resources',
            provider: { '@id': `${SITE.url}/#business` },
          },
        },
      ],
    },
    priceRange: '$$',
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
