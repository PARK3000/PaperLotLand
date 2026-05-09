import Link from 'next/link'
import Image from 'next/image'
import { DEFAULT_REVIEWER, LAST_REVIEWED } from '@/lib/constants'

export interface AuthorCardProps {
  reviewer?: {
    name: string
    role: string
    license?: string
    image?: string
    url?: string
  }
  lastUpdated?: string
  className?: string
}

function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function AuthorCard({ reviewer, lastUpdated, className = '' }: AuthorCardProps) {
  const r = reviewer ?? DEFAULT_REVIEWER
  const updated = lastUpdated ?? LAST_REVIEWED

  return (
    <aside
      className={`flex flex-wrap items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5 ${className}`}
      aria-label="Editorial review"
    >
      {r.image && (
        <Image
          src={r.image}
          alt={r.name}
          width={56}
          height={56}
          className="h-14 w-14 flex-shrink-0 rounded-full object-cover"
        />
      )}
      <div className="min-w-0 flex-1 text-left">
        <p className="text-xs uppercase tracking-wider text-gray-500">Reviewed by</p>
        <p className="text-base font-semibold text-gray-900">
          {r.url ? (
            <Link href={r.url} className="hover:text-accent">
              {r.name}
            </Link>
          ) : (
            r.name
          )}
        </p>
        <p className="text-sm text-gray-600">
          {r.role}
          {r.license && (
            <>
              {' · '}
              <span className="text-gray-500">{r.license}</span>
            </>
          )}
        </p>
      </div>
      <div className="text-right text-sm">
        <p className="text-xs uppercase tracking-wider text-gray-500">Last updated</p>
        <time dateTime={updated} className="font-medium text-gray-900">
          {formatDate(updated)}
        </time>
      </div>
    </aside>
  )
}
