import { getAllPostsMeta, getPostUrl } from '@/lib/blog'
import { SITE, BUSINESS } from '@/lib/constants'

export async function GET() {
  const posts = getAllPostsMeta()
  const siteUrl = SITE.url || 'https://paperlotland.com'

  const rssItems = posts.slice(0, 50).map((post) => {
    const postUrl = `${siteUrl}${getPostUrl(post)}`
    const pubDate = new Date(post.publishedAt).toUTCString()

    return `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <description><![CDATA[${post.excerpt}]]></description>
      <pubDate>${pubDate}</pubDate>
      <category>${post.category}</category>
      <author>${post.author}</author>
    </item>`
  }).join('')

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${SITE.name} Blog</title>
    <link>${siteUrl}/blog/</link>
    <description>Tips, guides, and insights for selling your Las Vegas house fast for cash. From ${BUSINESS.name}.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${siteUrl}/images/logo.png</url>
      <title>${SITE.name}</title>
      <link>${siteUrl}</link>
    </image>
    ${rssItems}
  </channel>
</rss>`

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
