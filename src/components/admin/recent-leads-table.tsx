import type { RecentLead } from '@/lib/admin/dashboard-types'
import { SourceBadge } from './source-badge'
import Link from 'next/link'

export function RecentLeadsTable({ leads }: { leads: RecentLead[] }) {
  return (
    <div className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden h-full flex flex-col">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Recent Leads</h2>
          <p className="text-xs text-gray-400 mt-0.5">Latest converting submissions</p>
        </div>
        <Link
          href="/admin/leads"
          className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
        >
          View all
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      </div>
      {leads.length === 0 ? (
        <div className="px-5 py-12 text-center flex-1 flex items-center justify-center">
          <div>
            <svg className="w-8 h-8 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            <p className="text-sm text-gray-400">No leads yet</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                <th className="text-left px-5 py-2.5">Date</th>
                <th className="text-left px-5 py-2.5">Name</th>
                <th className="text-left px-5 py-2.5">Source</th>
                <th className="text-left px-5 py-2.5">Form</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {leads.map((lead, i) => (
                <tr key={i} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-5 py-2.5 text-xs text-gray-400 font-medium whitespace-nowrap">{lead.date}</td>
                  <td className="px-5 py-2.5 font-medium text-gray-900 whitespace-nowrap">{lead.name}</td>
                  <td className="px-5 py-2.5"><SourceBadge source={lead.source} /></td>
                  <td className="px-5 py-2.5 text-gray-500 text-xs">{lead.form}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
