import { SITE, BUSINESS, SOCIAL, CITATIONS } from '@/lib/constants'
import { businessConfig } from '@/lib/config'

export function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE.url}/#organization`,
    name: SITE.name,
    url: SITE.url,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE.url}/images/logo/logo.svg`,
      width: 220,
      height: 48,
    },
    foundingDate: businessConfig.yearEstablished || '2020',
    image: `${SITE.url}/images/og-image.jpg`,
    description: SITE.description,
    telephone: `+1-${BUSINESS.phone}`,
    email: BUSINESS.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: `${businessConfig.address.street}${businessConfig.address.suite ? ' ' + businessConfig.address.suite : ''}`,
      addressLocality: businessConfig.address.city,
      addressRegion: businessConfig.address.state,
      postalCode: businessConfig.address.zip,
      addressCountry: 'US',
    },
    areaServed: [
      'Las Vegas', 'Henderson', 'North Las Vegas', 'Boulder City',
      'Clark County', 'Summerlin', 'Enterprise', 'Spring Valley',
    ].map((c) => ({ '@type': 'City', name: c })),
    knowsAbout: [
      'Off-Market Land Deals',
      'Land Development',
      'Commercial Real Estate',
      'Residential Land',
      'Industrial Land',
      'Clark County GIS',
      'Nevada Zoning',
    ],
    sameAs: [
      ...Object.values(SOCIAL).filter(Boolean),
      ...(CITATIONS ? Object.values(CITATIONS).filter(Boolean) : []),
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: `+1-${BUSINESS.phone}`,
      contactType: 'customer service',
      areaServed: 'US',
      availableLanguage: 'English',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
