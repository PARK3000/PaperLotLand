import Image from 'next/image'
import Link from 'next/link'
import { BlogPostMeta, formatPostDate, getPostUrl } from '@/lib/blog'

interface BlogPostGridProps {
  posts: BlogPostMeta[]
}

export function BlogPostGrid({ posts }: BlogPostGridProps) {
  if (posts.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-[var(--color-border)] bg-white p-12 text-center">
        <svg
          className="mx-auto h-16 w-16 text-[var(--color-text-muted)]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
          />
        </svg>
        <h2 className="mt-4 text-xl font-semibold text-[var(--color-text)]">
          No Posts Found
        </h2>
        <p className="mt-2 text-[var(--color-text-muted)]">
          Check back soon for new content.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <article
          key={post.slug}
          className="group overflow-hidden rounded-xl border border-[var(--color-border)] bg-white transition-all hover:shadow-lg"
        >
          <div className="aspect-video bg-gradient-to-br from-[var(--color-primary-100)] to-[var(--color-primary-200)]">
            {post.image ? (
              <Image
                src={post.image}
                alt={post.imageAlt || post.title}
                width={640}
                height={360}
                className="h-full w-full object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <svg
                  className="h-16 w-16 text-[var(--color-primary-300)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                  />
                </svg>
              </div>
            )}
          </div>
          <div className="p-6">
            <div className="flex items-center gap-3 text-sm">
              <span className="rounded-full bg-[var(--color-primary-50)] px-3 py-1 text-[var(--color-primary)]">
                {post.category}
              </span>
              <span className="text-[var(--color-text-muted)]">{post.readTime}</span>
            </div>
            <h2 className="mt-4 text-xl font-semibold text-[var(--color-text)] group-hover:text-[var(--color-primary)]">
              <Link href={getPostUrl(post)} className="hover:underline">
                {post.title}
              </Link>
            </h2>
            <p className="mt-2 text-[var(--color-text-muted)]">{post.excerpt}</p>
            <div className="mt-4 flex items-center justify-between border-t border-[var(--color-border)] pt-4">
              <span className="text-sm text-[var(--color-text-muted)]">
                {formatPostDate(post.publishedAt)}
              </span>
              <Link
                href={getPostUrl(post)}
                className="text-sm font-medium text-[var(--color-primary)] hover:underline"
              >
                Read more &rarr;
              </Link>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}
