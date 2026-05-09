import { Metadata } from 'next'
import { CTASection } from '@/components/sections/cta-section'
import { BlogPostGrid } from '@/components/sections/blog-post-grid'
import { Pagination } from '@/components/ui/pagination'
import { getPaginatedPosts, getDbPostsMeta, POSTS_PER_PAGE, getAllPostsMeta } from '@/lib/blog'
import { SITE } from '@/lib/constants'
import { BreadcrumbSchema } from '@/components/seo/breadcrumb-schema'

export const metadata: Metadata = {
  title: 'Las Vegas Home Selling Tips & Market Insights | WBAVH Blog',
  description: 'Expert tips for selling your Las Vegas home — market trends, closing costs, tax advice, and neighborhood guides from local real estate investors since 2016.',
  openGraph: {
    title: 'Las Vegas Home Selling Tips & Market Insights | WBAVH Blog',
    description: 'Expert tips for selling your Las Vegas home — market trends, closing costs, and neighborhood guides.',
    images: [{ url: '/images/og-image.jpg', width: 1200, height: 630 }],
  },
  alternates: {
    canonical: `${SITE.url}/blog/`,
  },
}

export const revalidate = 60

export default async function BlogPage() {
  const dbPosts = await getDbPostsMeta()
  const repoPosts = getAllPostsMeta()
  // Merge: DB overrides repo for same slug, then paginate
  const slugMap = new Map(repoPosts.map((p) => [p.slug, p]))
  for (const p of dbPosts) slugMap.set(p.slug, p)
  const allPosts = Array.from(slugMap.values()).sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  )
  const totalPages = Math.ceil(allPosts.length / POSTS_PER_PAGE)
  const posts = allPosts.slice(0, POSTS_PER_PAGE)
  void getPaginatedPosts // keep import used

  return (
    <main>
      <BreadcrumbSchema items={[
        { name: 'Home', url: '/' },
        { name: 'Blog', url: '/blog/' },
      ]} />
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-700)] py-20 text-white">
        <div className="container-custom">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold md:text-5xl">Las Vegas Real Estate Insights & Cash-Sale Guides</h1>
            <p className="mt-6 text-xl text-white/90">
              Expert advice and insights to help you make informed decisions.
              Tips, guides, and resources from our team.
            </p>
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="section-padding">
        <div className="container-custom">
          <BlogPostGrid posts={posts} />
          <Pagination currentPage={1} totalPages={totalPages} basePath="/blog" />
        </div>
      </section>

      <CTASection
        title="Ready to Get Started?"
        subtitle="Contact us today to learn how we can help you."
      />
    </main>
  )
}
