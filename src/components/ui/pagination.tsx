import Link from 'next/link'

interface PaginationProps {
  currentPage: number
  totalPages: number
  basePath: string // e.g., '/blog' or '/selling-a-home'
}

export function Pagination({ currentPage, totalPages, basePath }: PaginationProps) {
  if (totalPages <= 1) return null

  const getPageUrl = (page: number) => {
    if (page === 1) return `${basePath}/`
    return `${basePath}/page/${page}/`
  }

  // Build page numbers to display
  const pages: (number | 'ellipsis')[] = []
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== 'ellipsis') {
      pages.push('ellipsis')
    }
  }

  return (
    <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-2">
      {/* Previous */}
      {currentPage > 1 ? (
        <Link
          href={getPageUrl(currentPage - 1)}
          className="flex items-center gap-1 rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-primary-50)]"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Previous
        </Link>
      ) : (
        <span className="flex cursor-not-allowed items-center gap-1 rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-gray-300">
          <ChevronLeftIcon className="h-4 w-4" />
          Previous
        </span>
      )}

      {/* Page Numbers */}
      <div className="hidden items-center gap-1 sm:flex">
        {pages.map((page, index) =>
          page === 'ellipsis' ? (
            <span key={`ellipsis-${index}`} className="px-2 text-gray-400">
              ...
            </span>
          ) : (
            <Link
              key={page}
              href={getPageUrl(page)}
              className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                page === currentPage
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-primary-50)]'
              }`}
            >
              {page}
            </Link>
          )
        )}
      </div>

      {/* Mobile page indicator */}
      <span className="text-sm text-[var(--color-text-muted)] sm:hidden">
        Page {currentPage} of {totalPages}
      </span>

      {/* Next */}
      {currentPage < totalPages ? (
        <Link
          href={getPageUrl(currentPage + 1)}
          className="flex items-center gap-1 rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-primary-50)]"
        >
          Next
          <ChevronRightIcon className="h-4 w-4" />
        </Link>
      ) : (
        <span className="flex cursor-not-allowed items-center gap-1 rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-gray-300">
          Next
          <ChevronRightIcon className="h-4 w-4" />
        </span>
      )}
    </nav>
  )
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  )
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )
}
