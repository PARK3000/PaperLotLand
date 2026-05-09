import { SITE, BUSINESS } from '@/lib/constants'

interface ArticleSchemaProps {
  title: string
  description: string
  author: string
  publishedAt: string
  updatedAt?: string
  image?: string | string[]
  url: string
  keywords?: string[]
  articleBody?: string
}

export function ArticleSchema({
  title,
  description,
  author,
  publishedAt,
  updatedAt,
  image,
  url,
  keywords,
  articleBody,
}: ArticleSchemaProps) {
  const imageArray = image
    ? Array.isArray(image) ? image : [image]
    : [`${SITE.url}/images/og-image.jpg`]

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description: description,
    image: imageArray,
    author: {
      '@type': 'Person',
      name: author,
      url: `${SITE.url}/team/`,
      '@id': `${SITE.url}/team/#${author.toLowerCase().replace(/\s+/g, '-')}`,
    },
    publisher: {
      '@type': 'Organization',
      name: BUSINESS.name,
      url: SITE.url,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE.url}/images/logo/logo-new.webp`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    datePublished: publishedAt,
    dateModified: updatedAt || publishedAt,
    url: url,
    inLanguage: 'en-US',
  }

  if (keywords && keywords.length > 0) {
    schema.keywords = keywords.join(', ')
  }

  if (articleBody) {
    schema.articleBody = articleBody
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
