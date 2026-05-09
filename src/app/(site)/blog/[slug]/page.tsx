import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CTASection } from '@/components/sections/cta-section'
import { ArticleSchema } from '@/components/seo/article-schema'
import { BreadcrumbSchema } from '@/components/seo/breadcrumb-schema'
import { FAQSchema } from '@/components/seo/faq-schema'
import { TableOfContents } from '@/components/ui/table-of-contents'
import { ArticleContent } from '@/components/ui/article-content'
import { extractTocItems } from '@/components/ui/article-content-utils'
import { BlogCardImage } from '@/components/ui/blog-card-image'
import { KeyTakeawaysBox } from '@/components/ui/key-takeaways-box'
import {
  getPostBySlug,
  getAllPostSlugs,
  getRelatedPosts,
  formatPostDate,
} from '@/lib/blog'
import { SITE, BUSINESS, FOUNDER } from '@/lib/constants'

const AUTHOR_PHOTOS: Record<string, string> = {
  'Casey Ryan': '/images/team/casey-ryan.jpg',
}

interface PageProps {
  params: Promise<{ slug: string }>
}

export const revalidate = 60
export const dynamicParams = true

export async function generateStaticParams() {
  const slugs = getAllPostSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  if (!post) {
    return { title: `Post Not Found | ${SITE.name}` }
  }

  return {
    title: post.seo?.title || post.title,
    description: post.seo?.description || post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [post.author],
      ...(post.image && {
        images: [{ url: `${SITE.url}${post.image}`, alt: post.imageAlt || post.title }],
      }),
    },
    alternates: {
      canonical: `${SITE.url}/blog/${slug}/`,
    },
  }
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  if (!post) {
    notFound()
  }

  const relatedPosts = getRelatedPosts(slug, 3)
  const tocItems = extractTocItems(post.content)

  return (
    <main>
      <ArticleSchema
        title={post.title}
        description={post.excerpt}
        author={post.author}
        publishedAt={post.publishedAt}
        updatedAt={post.updatedAt}
        image={post.image ? `${SITE.url}${post.image}` : undefined}
        url={`${SITE.url}/blog/${slug}/`}
        keywords={post.seo?.keywords}
        articleBody={post.content.replace(/<[^>]+>/g, '').slice(0, 500)}
      />
      {post.faqs && post.faqs.length > 0 && <FAQSchema faqs={post.faqs} />}
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: '/' },
          { name: 'Blog', url: '/blog/' },
          { name: post.title, url: `/blog/${slug}/` },
        ]}
      />

      {/* Breadcrumb */}
      <nav className="border-b border-[var(--color-border)] bg-[var(--color-background-alt)]">
        <div className="container-custom py-3">
          <ol className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <li><Link href="/" className="hover:text-[var(--color-primary)]">Home</Link></li>
            <li>/</li>
            <li><Link href="/blog/" className="hover:text-[var(--color-primary)]">Blog</Link></li>
            <li>/</li>
            <li className="text-[var(--color-text)]">{post.title}</li>
          </ol>
        </div>
      </nav>

      {/* Article Header */}
      <header className="border-b border-slate-200 bg-white py-6">
        <div className="container-custom">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-primary)]">
              <Link href="/blog/" className="hover:underline">Blog</Link>
              <span>›</span>
              <span>{post.category}</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold text-[#1a2e4a] md:text-3xl lg:text-[2rem] lg:leading-tight">{post.title}</h1>
            <p className="mt-2 text-base text-slate-500">{post.excerpt}</p>
            <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-4">
              <div className="relative h-11 w-11 overflow-hidden rounded-full bg-slate-200 ring-2 ring-slate-100">
                {AUTHOR_PHOTOS[post.author] ? (
                  <Image src={AUTHOR_PHOTOS[post.author]} alt={post.author} fill className="object-cover object-top" sizes="44px" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-base font-bold text-slate-500">{post.author.charAt(0)}</span>
                )}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold text-[#1a2e4a]">
                  <span>By {post.author}</span>
                  {post.editor && (
                    <>
                      <span className="text-slate-300">·</span>
                      <span className="font-normal text-slate-500">
                        Edited by <span className="font-semibold text-[#1a2e4a]">{post.editor}</span>
                      </span>
                    </>
                  )}
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
                  {post.updatedAt && post.updatedAt !== post.publishedAt ? (
                    <span>Updated {formatPostDate(post.updatedAt)}</span>
                  ) : (
                    <span>{formatPostDate(post.publishedAt)}</span>
                  )}
                  <span>·</span>
                  <span>{post.readTime}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Article Content with TOC Sidebar */}
      <article className="section-padding">
        <div className="container-custom">
          {/* Mobile TOC */}
          <div className="mx-auto mb-8 max-w-3xl lg:hidden">
            <TableOfContents items={tocItems} variant="mobile" />
          </div>

          <div className="mx-auto max-w-5xl lg:grid lg:grid-cols-[220px_1fr] lg:gap-10">
            {/* Desktop TOC Sidebar */}
            <aside className="relative hidden lg:block">
              <div className="sticky top-32">
                <p className="mb-4 text-sm font-bold text-[var(--color-primary)]">Table of Contents</p>
                <TableOfContents items={tocItems} />
              </div>
            </aside>

            {/* Main Content */}
            <div className="min-w-0 max-w-3xl">
              {post.keyTakeaways && post.keyTakeaways.length > 0 && (
                <KeyTakeawaysBox items={post.keyTakeaways} />
              )}
              <ArticleContent content={post.content} />

              {/* Author Box */}
              <div className="mt-12 rounded-xl border border-[var(--color-border)] bg-[var(--color-background-alt)] p-6">
                <div className="flex items-start gap-4">
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full bg-[var(--color-primary)]">
                    {AUTHOR_PHOTOS[post.author] ? (
                      <Image src={AUTHOR_PHOTOS[post.author]} alt={post.author} fill className="object-cover object-top" sizes="64px" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-white">{post.author.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[var(--color-text)]">About {post.author}</h3>
                    <p className="mt-2 text-[var(--color-text-muted)]">
                      {post.author} is part of the {BUSINESS.name} team.
                      {FOUNDER.bio && ` ${FOUNDER.bio}`}
                    </p>
                    <Link href="/team/" className="mt-3 inline-block text-sm font-medium text-[var(--color-primary)] hover:underline">
                      Learn more about our team &rarr;
                    </Link>
                  </div>
                </div>
              </div>

              {/* CTA Box */}
              <div className="mt-12 rounded-xl bg-[var(--color-primary)] p-8 text-center text-white">
                <h3 className="text-2xl font-bold">Ready to Access Off-Market Land Deals?</h3>
                <p className="mt-2 text-white/90">Join our private network of developers, brokers, and investors in the Las Vegas Valley.</p>
                <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <Link href="/off-market-deals/" className="rounded-lg bg-[var(--color-cta)] px-6 py-3 font-semibold text-white transition-colors hover:bg-[var(--color-cta-hover)]">
                    Join the Network
                  </Link>
                  <a href={`tel:${BUSINESS.phone}`} className="font-semibold text-white hover:underline">
                    Or call: {BUSINESS.phoneDisplay}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="section-padding bg-[var(--color-background-alt)]">
          <div className="container-custom">
            <h2 className="mb-8 text-2xl font-bold text-[var(--color-text)]">Related Articles</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {relatedPosts.map((relatedPost) => (
                <article
                  key={relatedPost.slug}
                  className="group overflow-hidden rounded-xl border border-[var(--color-border)] bg-white transition-all hover:shadow-lg"
                >
                  <div className="aspect-video bg-gradient-to-br from-[var(--color-primary-100)] to-[var(--color-primary-200)]">
                    {relatedPost.image ? (
                      <BlogCardImage src={relatedPost.image} alt={relatedPost.imageAlt || relatedPost.title} />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <svg className="h-12 w-12 text-[var(--color-primary-300)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-[var(--color-text)] group-hover:text-[var(--color-primary)]">
                      <Link href={`/blog/${relatedPost.slug}/`} className="hover:underline">{relatedPost.title}</Link>
                    </h3>
                    <p className="mt-2 text-sm text-[var(--color-text-muted)]">{relatedPost.readTime}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <CTASection title="Ready to Get Started?" subtitle="Contact us today to learn how we can help you." />
    </main>
  )
}
