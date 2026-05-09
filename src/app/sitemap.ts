import { MetadataRoute } from 'next'
import { getAllPostsMeta, getPostUrl, POSTS_PER_PAGE } from '@/lib/blog'
import { siteConfig } from '@/lib/config'
import { JURISDICTIONS } from '@/lib/constants'

const BASE_URL = siteConfig.siteUrl

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/available-lots/`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/closed-sales/`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/off-market-deals/`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/resources/`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/about/`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/contact/`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/blog/`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/privacy-policy/`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]

  // Resource jurisdiction pages
  const resourcePages: MetadataRoute.Sitemap = JURISDICTIONS.map((j) => ({
    url: `${BASE_URL}/resources/${j.slug}/`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  // Blog posts
  const blogPosts = getAllPostsMeta()
  const blogPages: MetadataRoute.Sitemap =
    blogPosts.length > 0
      ? blogPosts.map((post) => ({
          url: `${BASE_URL}${getPostUrl(post)}`,
          lastModified: new Date(post.updatedAt || post.publishedAt),
          changeFrequency: 'monthly' as const,
          priority: 0.6,
        }))
      : []

  // Blog pagination pages (page 2+)
  const totalBlogPages = Math.ceil(blogPosts.length / POSTS_PER_PAGE)
  const blogPaginationPages: MetadataRoute.Sitemap = Array.from(
    { length: Math.max(0, totalBlogPages - 1) },
    (_, i) => ({
      url: `${BASE_URL}/blog/page/${i + 2}/`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    })
  )

  return [...staticPages, ...resourcePages, ...blogPages, ...blogPaginationPages]
}
