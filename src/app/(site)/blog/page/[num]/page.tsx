import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { CTASection } from '@/components/sections/cta-section'
import { BlogPostGrid } from '@/components/sections/blog-post-grid'
import { Pagination } from '@/components/ui/pagination'
import { getAllPostsMeta, getDbPostsMeta, POSTS_PER_PAGE } from '@/lib/blog'
import { SITE } from '@/lib/constants'

interface Props {
  params: Promise<{ num: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { num } = await params
  const page = parseInt(num, 10)

  return {
    title: `Blog - Page ${page} | ${SITE.name}`,
    description: `Browse expert advice on selling your Las Vegas home fast for cash — tips on foreclosure, probate, repairs, and more from ${SITE.name}. Page ${page}.`,
    alternates: {
      canonical: `${SITE.url}/blog/page/${page}/`,
    },
    openGraph: {
      title: `Blog - Page ${page} | ${SITE.name}`,
      description: `Browse expert advice on selling your Las Vegas home fast for cash — tips on foreclosure, probate, repairs, and more from ${SITE.name}. Page ${page}.`,
      url: `${SITE.url}/blog/page/${page}/`,
      type: 'website',
      images: [{ url: '/images/og-image.jpg', width: 1200, height: 630 }],
    },
  }
}

export function generateStaticParams() {
  const totalPosts = getAllPostsMeta().length
  const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE)

  return Array.from({ length: totalPages }, (_, i) => ({
    num: String(i + 1),
  }))
}

export const revalidate = 60
export const dynamicParams = true

async function getMergedPosts() {
  const [dbPosts, repoPosts] = await Promise.all([getDbPostsMeta(), Promise.resolve(getAllPostsMeta())])
  const slugMap = new Map(repoPosts.map((p) => [p.slug, p]))
  for (const p of dbPosts) slugMap.set(p.slug, p)
  return Array.from(slugMap.values()).sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  )
}

export default async function BlogPaginatedPage({ params }: Props) {
  const { num } = await params
  const page = parseInt(num, 10)

  if (isNaN(page) || page < 1) {
    notFound()
  }

  if (page === 1) {
    redirect('/blog/')
  }

  const allPosts = await getMergedPosts()
  const totalPages = Math.ceil(allPosts.length / POSTS_PER_PAGE)
  const posts = allPosts.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE)

  if (page > totalPages) {
    notFound()
  }

  return (
    <main>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-700)] py-20 text-white">
        <div className="container-custom">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold md:text-5xl">Las Vegas Real Estate Insights & Cash-Sale Guides</h1>
            <p className="mt-6 text-xl text-white/90">
              Expert advice and insights to help you make informed decisions.
              Page {page} of {totalPages}.
            </p>
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="section-padding">
        <div className="container-custom">
          <BlogPostGrid posts={posts} />
          <Pagination currentPage={page} totalPages={totalPages} basePath="/blog" />
        </div>
      </section>

      <CTASection
        title="Ready to Get Started?"
        subtitle="Contact us today to learn how we can help you."
      />
    </main>
  )
}
