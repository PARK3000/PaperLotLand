import { fetchLeads, fetchLeadFilterOptions, FORM_LABELS } from '@/lib/admin/leads-queries'
import type { LeadRow } from '@/lib/admin/leads-queries'
import { SourceBadge } from '@/components/admin/source-badge'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{
    page?: string
    source?: string
    form?: string
    search?: string
  }>
}

export default async function LeadsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const currentPage = Math.max(1, parseInt(params.page || '1', 10) || 1)

  const [result, filterOptions] = await Promise.all([
    fetchLeads({
      page: currentPage,
      source: params.source,
      form: params.form,
      search: params.search,
    }),
    fetchLeadFilterOptions(),
  ])

  if (!result) {
    return (
      <div className="p-6 lg:p-8">
        <PageHeader />
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-5 text-sm text-amber-800">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <span className="font-medium">Connection issue</span>
          </div>
          Unable to load leads. Check that <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs font-mono">DATABASE_URL</code> is configured.
        </div>
      </div>
    )
  }

  const { leads, total, page, totalPages } = result
  const sources = filterOptions?.sources || []
  const forms = filterOptions?.forms || []

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <PageHeader total={total} />

      {/* Filter row — matches blogs page pattern */}
      <form method="GET" className="flex items-center gap-2 mb-4">
        <input
          type="text"
          name="search"
          defaultValue={params.search || ''}
          placeholder="Search by name, email, phone, address..."
          className="flex-1 min-w-0 border border-[#c3c4c7] rounded px-3 py-1.5 text-sm text-[#1d2327] placeholder-[#646970] focus:outline-none focus:ring-2 focus:ring-[#2271b1] focus:border-transparent"
        />
        <select
          name="source"
          defaultValue={params.source || 'all'}
          className="border border-[#c3c4c7] rounded px-3 py-1.5 text-sm text-[#1d2327] focus:outline-none focus:ring-2 focus:ring-[#2271b1] focus:border-transparent"
        >
          <option value="all">All Sources</option>
          {sources.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          name="form"
          defaultValue={params.form || 'all'}
          className="border border-[#c3c4c7] rounded px-3 py-1.5 text-sm text-[#1d2327] focus:outline-none focus:ring-2 focus:ring-[#2271b1] focus:border-transparent"
        >
          <option value="all">All Forms</option>
          {forms.map((f) => (
            <option key={f} value={f}>{FORM_LABELS[f] || f}</option>
          ))}
        </select>
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2271b1] hover:bg-[#135e96] text-white text-sm font-medium rounded transition-colors"
        >
          Filter
        </button>
        {(params.search || (params.source && params.source !== 'all') || (params.form && params.form !== 'all')) && (
          <Link
            href="/admin/leads"
            className="px-2 py-1.5 text-xs text-[#646970] hover:text-[#1d2327] border border-[#c3c4c7] rounded transition-colors"
          >
            Clear
          </Link>
        )}
        <span className="text-xs text-[#646970] ml-1 shrink-0">
          {leads.length} of {total}
        </span>
      </form>

      {/* Table */}
      <div className="bg-white border border-[#c3c4c7] rounded shadow-sm overflow-hidden">
        {leads.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-[#646970]">
            No leads found. Try adjusting your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#c3c4c7] text-[#1d2327] bg-[#f6f7f7]">
                  <th className="text-left px-4 py-2.5 font-semibold w-36">Date</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Name</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Email</th>
                  <th className="text-left px-4 py-2.5 font-semibold w-28">Phone</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Address</th>
                  <th className="text-left px-4 py-2.5 font-semibold w-24">Source</th>
                  <th className="text-left px-4 py-2.5 font-semibold w-24">Form</th>
                  <th className="text-left px-4 py-2.5 font-semibold w-24">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0f1]">
                {leads.map((lead: LeadRow, i: number) => (
                  <tr key={lead.id} className={`hover:bg-[#f6f7f7] transition-colors ${i % 2 === 0 ? '' : 'bg-[#f9f9f9]'}`}>
                    <td className="px-4 py-2.5 text-[#646970] text-xs tabular-nums whitespace-nowrap">{lead.date}</td>
                    <td className="px-4 py-2.5 font-medium text-[#1d2327] whitespace-nowrap">{lead.name}</td>
                    <td className="px-4 py-2.5 text-[#646970] text-xs">{lead.email || '—'}</td>
                    <td className="px-4 py-2.5 text-[#646970] text-xs whitespace-nowrap">{lead.phone || '—'}</td>
                    <td className="px-4 py-2.5 text-[#646970] text-xs max-w-[200px] truncate" title={lead.address}>{lead.address || '—'}</td>
                    <td className="px-4 py-2.5"><SourceBadge source={lead.source} /></td>
                    <td className="px-4 py-2.5 text-[#646970] text-xs">{lead.form}</td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={lead.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-2.5 border-t border-[#c3c4c7] flex items-center justify-between bg-[#f6f7f7]">
            <p className="text-xs text-[#646970]">
              Page {page} of {totalPages} ({total} total)
            </p>
            <div className="flex items-center gap-1">
              {page > 1 && (
                <PaginationLink
                  params={params}
                  page={page - 1}
                  label="Previous"
                />
              )}

              {getPageNumbers(page, totalPages).map((p, i) =>
                p === '...' ? (
                  <span key={`dots-${i}`} className="px-2 text-xs text-gray-300">...</span>
                ) : (
                  <PaginationLink
                    key={p}
                    params={params}
                    page={p as number}
                    label={String(p)}
                    active={p === page}
                  />
                )
              )}

              {page < totalPages && (
                <PaginationLink
                  params={params}
                  page={page + 1}
                  label="Next"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function PageHeader({ total }: { total?: number }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div>
        <h1 className="text-[23px] font-normal text-[#1d2327] leading-tight">Leads</h1>
        <div className="flex items-center gap-3 mt-1 text-sm text-[#646970]">
          <Link
            href="/admin"
            className="hover:text-[#2271b1] transition-colors"
          >
            &larr; Dashboard
          </Link>
          {total !== undefined && (
            <>
              <span className="text-[#c3c4c7]">|</span>
              <span>{total} delivered</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles = status === 'Delivered'
    ? 'bg-green-50 text-green-700 border-green-200'
    : status === 'Fallback'
      ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
      : 'bg-gray-50 text-gray-600 border-gray-200'

  return (
    <span className={`inline-block px-2 py-0.5 rounded border text-xs font-medium ${styles}`}>
      {status}
    </span>
  )
}

function PaginationLink({
  params,
  page,
  label,
  active,
}: {
  params: Record<string, string | undefined>
  page: number
  label: string
  active?: boolean
}) {
  const query = new URLSearchParams()
  if (params.source && params.source !== 'all') query.set('source', params.source)
  if (params.form && params.form !== 'all') query.set('form', params.form)
  if (params.search) query.set('search', params.search)
  if (page > 1) query.set('page', String(page))
  const href = `/admin/leads${query.toString() ? `?${query}` : ''}`

  return (
    <Link
      href={href}
      className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
        active
          ? 'bg-[#2271b1] text-white'
          : 'text-[#646970] hover:text-[#1d2327] border border-[#c3c4c7] hover:border-[#8c8f94]'
      }`}
    >
      {label}
    </Link>
  )
}

function getPageNumbers(current: number, total: number): (number | string)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: (number | string)[] = [1]

  if (current > 3) pages.push('...')

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i++) pages.push(i)

  if (current < total - 2) pages.push('...')

  pages.push(total)
  return pages
}
