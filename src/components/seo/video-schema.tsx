interface VideoSchemaProps {
  name: string
  description: string
  thumbnailUrl: string
  uploadDate: string
  duration: string // ISO 8601 format (e.g., "PT42M6S")
  embedUrl: string
  contentUrl?: string
}

export function VideoSchema({
  name,
  description,
  thumbnailUrl,
  uploadDate,
  duration,
  embedUrl,
  contentUrl,
}: VideoSchemaProps) {
  // Ensure uploadDate has timezone (ISO 8601 full datetime)
  const normalizedUploadDate = uploadDate.length === 10 ? `${uploadDate}T00:00:00Z` : uploadDate

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: name,
    description: description,
    thumbnailUrl: thumbnailUrl,
    uploadDate: normalizedUploadDate,
    duration: duration,
    embedUrl: embedUrl,
    contentUrl: contentUrl,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
