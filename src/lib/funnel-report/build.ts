/**
 * Orchestrates all data sources and produces a structured report.
 * Handles both "this week" and "week-over-week comparison" modes.
 */

import {
  fetchGA4TopLine,
  fetchGA4Channels,
  fetchGA4Events,
  fetchGA4TopPages,
  type GA4TopLine,
  type GA4ChannelRow,
  type GA4EventRow,
  type GA4PageRow,
} from './ga4'
import { fetchGSCSummary, type GSCSummary } from './gsc'
import {
  fetchFunnelStages,
  fetchDailySubmits,
  fetchDeliveryStats,
  type FunnelStage,
  type DailySubmit,
} from './neon-funnel'

export interface WeeklyReport {
  periodLabel: string
  startDate: string
  endDate: string
  generatedAt: string

  // Current period
  topLine: GA4TopLine
  channels: GA4ChannelRow[]
  events: GA4EventRow[]
  topPages: GA4PageRow[]
  funnel: FunnelStage
  dailySubmits: DailySubmit[]
  deliveryStats: Record<string, number>
  gsc: GSCSummary | null

  // Prior period (for WoW comparison)
  priorTopLine: GA4TopLine | null
  priorFunnel: FunnelStage | null
  priorEvents: GA4EventRow[] | null
}

function dateStr(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/**
 * Build a weekly report for a given end date.
 * Defaults to yesterday as the end date (GA4 may not have today's data yet).
 */
export async function buildWeeklyReport(
  endDate?: Date,
  days = 7
): Promise<WeeklyReport> {
  const now = endDate || new Date()

  // Current period: [end - days + 1, end]
  const end = new Date(now)
  end.setDate(end.getDate() - 1) // yesterday
  const start = new Date(end)
  start.setDate(start.getDate() - days + 1)

  // Prior period: [start - days, start - 1]
  const priorEnd = new Date(start)
  priorEnd.setDate(priorEnd.getDate() - 1)
  const priorStart = new Date(priorEnd)
  priorStart.setDate(priorStart.getDate() - days + 1)

  // GSC uses a 3-day lag
  const gscEnd = new Date(now)
  gscEnd.setDate(gscEnd.getDate() - 3)
  const gscStart = new Date(gscEnd)
  gscStart.setDate(gscStart.getDate() - days + 1)

  const startStr = dateStr(start)
  const endStr = dateStr(end)
  const priorStartStr = dateStr(priorStart)
  const priorEndStr = dateStr(priorEnd)
  const gscStartStr = dateStr(gscStart)
  const gscEndStr = dateStr(gscEnd)

  // Fire all queries in parallel
  const [
    topLine,
    channels,
    events,
    topPages,
    funnel,
    dailySubmits,
    deliveryStats,
    gsc,
    priorTopLine,
    priorFunnel,
    priorEvents,
  ] = await Promise.all([
    fetchGA4TopLine(startStr, endStr),
    fetchGA4Channels(startStr, endStr),
    fetchGA4Events(startStr, endStr),
    fetchGA4TopPages(startStr, endStr),
    fetchFunnelStages(startStr, endStr),
    fetchDailySubmits(startStr, endStr),
    fetchDeliveryStats(startStr, endStr),
    fetchGSCSummary(gscStartStr, gscEndStr).catch(() => null),
    fetchGA4TopLine(priorStartStr, priorEndStr).catch(() => null),
    fetchFunnelStages(priorStartStr, priorEndStr).catch(() => null),
    fetchGA4Events(priorStartStr, priorEndStr).catch(() => null),
  ])

  return {
    periodLabel: `${startStr} to ${endStr}`,
    startDate: startStr,
    endDate: endStr,
    generatedAt: new Date().toISOString(),
    topLine,
    channels,
    events,
    topPages,
    funnel,
    dailySubmits,
    deliveryStats,
    gsc,
    priorTopLine,
    priorFunnel,
    priorEvents,
  }
}
