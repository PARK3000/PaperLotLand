import { getAllPostsMeta } from '@/lib/blog'
import { fetchDashboardData } from '@/lib/admin/dashboard-queries'
import { PERIOD_LABELS, type PeriodKey } from '@/lib/admin/dashboard-types'
import { StatCard } from '@/components/admin/stat-card'
import { LeadSourcesChart } from '@/components/admin/lead-sources-chart'
import { TopPagesChart } from '@/components/admin/top-pages-chart'
import { DashboardInsights } from '@/components/admin/dashboard-insights'
import { RecentLeadsTable } from '@/components/admin/recent-leads-table'
import { DashboardChat } from '@/components/admin/dashboard-chat'
import { PeriodSelector } from '@/components/admin/period-selector'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const VALID_PERIODS: PeriodKey[] = ['today', 'this_week', 'last_7', 'this_month', 'last_30']

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const rawPeriod = typeof params.period === 'string' ? params.period : 'last_30'
  const period: PeriodKey = VALID_PERIODS.includes(rawPeriod as PeriodKey) ? (rawPeriod as PeriodKey) : 'last_30'

  const [posts, data] = await Promise.all([
    Promise.resolve(getAllPostsMeta()),
    fetchDashboardData(period),
  ])

  if (!data) {
    return (
      <div className="p-6 lg:p-8">
        <DashboardHeader period={period} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <StatCard icon="👥" label="Total Leads" value="—" sub="Database unavailable" />
          <StatCard icon="📊" label="Sessions" value="—" sub="Database unavailable" />
          <StatCard icon="⏱" label="Avg. Session" value="—" sub="Database unavailable" />
          <Link href="/admin/blogs" className="block">
            <StatCard icon="📝" label="Blog Posts" value={String(posts.length)} sub="Published" cta />
          </Link>
        </div>
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-5 text-sm text-amber-800">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <span className="font-medium">Connection issue</span>
          </div>
          Unable to load dashboard data. Check that <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs font-mono">DATABASE_URL</code> is configured.
        </div>
      </div>
    )
  }

  const { totalLeads, leadsBySource, topConvertingPages, recentLeads, insights, ga4, periodStart, periodEnd } = data

  const fmtStart = new Date(periodStart + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const fmtEnd = new Date(periodEnd + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const periodLabel = `${fmtStart} – ${fmtEnd}`

  const sessionsValue = ga4 ? String(Math.round(ga4.sessions)) : '—'
  const sessionsSub = ga4 ? `${Math.round(ga4.engagementRate * 100)}% engagement rate` : 'GA4 unavailable'
  const avgSessionMin = ga4 ? (ga4.avgSessionDuration / 60).toFixed(1) : '—'
  const avgSessionSub = ga4 ? 'Avg. time on site' : 'GA4 unavailable'

  const chatContext = buildChatContext(data, posts.length)

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <DashboardHeader periodLabel={periodLabel} period={period} />

      {/* Stat cards — full width */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon="👥" label="Total Leads" value={String(totalLeads)} sub={PERIOD_LABELS[period]} help="Total form submissions successfully delivered to your CRM. Includes both primary and fallback deliveries. Source: Postgres" />
        <StatCard icon="📊" label="Sessions" value={sessionsValue} sub={sessionsSub} help="Total website sessions. A session starts when a user visits and ends after 30 min of inactivity. Source: Google Analytics (GA4)" />
        <StatCard icon="⏱" label="Avg. Session" value={avgSessionMin === '—' ? '—' : `${avgSessionMin} min`} sub={avgSessionSub} help="Average time users spend on the site per session. Longer sessions often indicate higher engagement and intent. Source: Google Analytics (GA4)" />
        <Link href="/admin/blogs" className="block">
          <StatCard icon="📝" label="Blog Posts" value={String(posts.length)} sub="Published" cta help="Total published blog posts. Content drives organic traffic and supports SEO rankings for target keywords. Source: Filesystem" />
        </Link>
      </div>

      {/* Key Insights — full width */}
      <DashboardInsights insights={insights} />

      {/* Charts + Recent Leads — 2-column layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Left column: Lead Sources + Top Pages donut stacked */}
        <div className="xl:col-span-1 flex flex-col gap-4">
          <LeadSourcesChart sources={leadsBySource} />
          <TopPagesChart pages={topConvertingPages} />
        </div>

        {/* Right column: Recent Leads spanning full height */}
        <div className="xl:col-span-2">
          <RecentLeadsTable leads={recentLeads} />
        </div>
      </div>

      {/* AI Chat panel */}
      <DashboardChat dashboardContext={chatContext} />
    </div>
  )
}

function DashboardHeader({ periodLabel, period }: { periodLabel?: string; period: PeriodKey }) {
  const now = new Date()
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening'
  const today = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="flex items-end justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{greeting}</h1>
        <p className="text-sm text-gray-400 mt-0.5">{today}{periodLabel ? ` · ${periodLabel}` : ''}</p>
      </div>
      <div className="flex items-center gap-3">
        <PeriodSelector current={period} />
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-gray-400 font-medium">Live</span>
        </div>
      </div>
    </div>
  )
}

function buildChatContext(
  data: NonNullable<Awaited<ReturnType<typeof fetchDashboardData>>>,
  blogCount: number
): string {
  const lines: string[] = [
    `Period: ${PERIOD_LABELS[data.periodKey]} (${data.periodStart} to ${data.periodEnd})`,
    `Total leads: ${data.totalLeads}`,
    `Blog posts published: ${blogCount}`,
    '',
    'Lead sources:',
    ...data.leadsBySource.map((s) => `  - ${s.label}: ${s.count}`),
    '',
    'Top converting pages:',
    ...data.topConvertingPages.map((p) => `  - ${p.page}: ${p.count} leads`),
    '',
    'Insights:',
    ...data.insights.map((i) => `  - ${i.label}: ${i.value} (${i.detail})`),
  ]

  if (data.ga4) {
    lines.push(
      '',
      'GA4 session data:',
      `  - Sessions: ${Math.round(data.ga4.sessions)}`,
      `  - Avg session duration: ${(data.ga4.avgSessionDuration / 60).toFixed(1)} min`,
      `  - Engagement rate: ${Math.round(data.ga4.engagementRate * 100)}%`,
      `  - Bounce rate: ${Math.round(data.ga4.bounceRate * 100)}%`,
      `  - Page views: ${Math.round(data.ga4.pageViews)}`,
    )
  }

  return lines.join('\n')
}
