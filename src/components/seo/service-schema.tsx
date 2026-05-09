import { SITE } from '@/lib/constants'

const DEFAULT_SERVICE_AREAS = [
  'Las Vegas', 'Henderson', 'Summerlin', 'North Las Vegas',
  'Enterprise', 'Paradise', 'Boulder City', 'Pahrump', 'Green Valley',
]

interface ServiceSchemaProps {
  name: string
  description: string
  url: string
  areaServed?: string[]
}

export function ServiceSchema({ name, description, url, areaServed }: ServiceSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    url: url.startsWith('http') ? url : `${SITE.url}${url}`,
    provider: {
      '@type': 'RealEstateAgent',
      '@id': `${SITE.url}/#business`,
    },
    serviceType: 'Cash Home Buying',
    areaServed: (areaServed ?? DEFAULT_SERVICE_AREAS).map((city) => ({
      '@type': 'City',
      name: city,
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
