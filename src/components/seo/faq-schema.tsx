import type { FAQItem } from '@/lib/site-content'

interface FAQSchemaProps {
  faqs: FAQItem[]
}

/**
 * Picks the short, plain-text answer used in FAQPage JSON-LD.
 * Prefers `summary`; falls back to legacy `answer`.
 * Google prefers concise text in `acceptedAnswer.text`; rich body
 * (lists, tables, headings) belongs only in the visible UI.
 */
function schemaAnswerText(faq: FAQItem): string {
  const text = (faq.summary ?? faq.answer ?? '').trim()
  if (process.env.NODE_ENV !== 'production' && text.length > 300) {
    // eslint-disable-next-line no-console
    console.warn(
      `[FAQSchema] summary for "${faq.question}" is ${text.length} chars; recommend ≤ 250 for rich-result eligibility.`
    )
  }
  return text
}

export function FAQSchema({ faqs }: FAQSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: schemaAnswerText(faq),
      },
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
