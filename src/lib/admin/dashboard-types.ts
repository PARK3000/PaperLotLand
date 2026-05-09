import type { GA4TopLine } from '@/lib/funnel-report/ga4'

export interface InsightItem {
  label: string
  value: string
  detail: string
  color: string
  bg: string
  border: string
}

export interface RecentLead {
  date: string
  name: string
  source: string
  page: string
  form: string
}

export type PeriodKey = 'today' | 'this_week' | 'last_7' | 'this_month' | 'last_30'

export const PERIOD_LABELS: Record<PeriodKey, string> = {
  today: 'Today so far',
  this_week: 'This week so far',
  last_7: 'Last 7 days',
  this_month: 'This month so far',
  last_30: 'Last 30 days',
}

export interface DashboardData {
  totalLeads: number
  leadsBySource: { label: string; count: number }[]
  topConvertingPages: { page: string; count: number }[]
  recentLeads: RecentLead[]
  insights: InsightItem[]
  ga4: GA4TopLine | null
  periodStart: string
  periodEnd: string
  periodKey: PeriodKey
  periodDays: number
}

export const FORM_LABELS: Record<string, string> = {
  'lead-form-quick': 'Quick (Sticky)',
  'inline-lead-form': 'Inline',
  'hero-lead-form': 'Hero',
  'lp-lead-form': 'Landing Page',
  'lead-form-standard': 'Standard',
  'lead-form-full': 'Full',
  'contact-form': 'Contact',
  'location-lead-form': 'Location',
  'situation-lead-form': 'Situation',
  'case-study-lead-form': 'Case Study',
  'blog-lead-form': 'Blog',
  'pre-calendly-modal': 'Calendly Modal',
}
