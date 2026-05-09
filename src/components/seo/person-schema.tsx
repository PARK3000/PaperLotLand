import { SITE } from '@/lib/constants'

interface TeamMember {
  name: string
  role: string
  bio: string
  image?: string
  sameAs?: string[]
}

interface PersonSchemaProps {
  members: TeamMember[]
}

export function PersonSchema({ members }: PersonSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': members.map((member) => ({
      '@type': 'Person',
      name: member.name,
      jobTitle: member.role,
      description: member.bio,
      worksFor: {
        '@type': 'Organization',
        '@id': `${SITE.url}/#organization`,
      },
      ...(member.image && {
        image: member.image.startsWith('http') ? member.image : `${SITE.url}${member.image}`,
      }),
      url: `${SITE.url}/team/`,
      ...(member.sameAs && { sameAs: member.sameAs }),
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
