import type { InsightItem } from '@/lib/admin/dashboard-types'
import { HelpTooltip } from './stat-card'

const ICONS: Record<string, string> = {
  'Weekly trend': 'M2 12l3-3 4 4 5-6 4 4 4-5',
  'Lead velocity': 'M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z',
  'CVR': 'M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z',
  'Funnel drop-off': 'M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z',
  'Top form': 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  'Delivery rate': 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
}

const HELP_TEXT: Record<string, string> = {
  'Weekly trend': 'Leads this week vs last week. Helps spot momentum changes early. Source: Postgres (leads table)',
  'Lead velocity': 'Average leads/day over the selected period, plus today\'s count. Source: Postgres (leads table)',
  'CVR': 'Site-wide conversion rate: what % of all website sessions turned into leads. Source: Postgres (leads) + GA4 (sessions)',
  'Funnel drop-off': '% of sessions with any form activity that completed submission. Source: Postgres (leads table, session_token grouping)',
  'Top form': 'Form variant with most conversions in the selected period. Source: Postgres (leads table, form_id)',
  'Delivery rate': '% of leads successfully delivered to your CRM. Source: Postgres (leads table, status field)',
}

export function DashboardInsights({ insights }: { insights: InsightItem[] }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-900 mb-3">Key Insights</h2>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {insights.map((ins) => (
          <div
            key={ins.label}
            className="rounded-2xl border p-4 bg-slate-50 border-slate-200 transition-all hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-slate-500 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={ICONS[ins.label] || ICONS['Delivery rate']} />
                </svg>
                <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-widest">{ins.label}</p>
              </div>
              {HELP_TEXT[ins.label] && <HelpTooltip text={HELP_TEXT[ins.label]} />}
            </div>
            <p className="text-base font-bold text-slate-800 tracking-tight leading-tight">{ins.value}</p>
            <p className="text-[11px] text-gray-500 mt-1 leading-snug">{ins.detail}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
