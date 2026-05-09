/**
 * Google Search Console API wrapper for the weekly funnel report.
 * GSC data has a 2-3 day lag, so date ranges should account for that.
 */

import { google } from 'googleapis'
import { getGoogleAuth } from './google-auth'

const SITE_URL = process.env.GSC_SITE_URL || 'sc-domain:webuyanyvegashouse.com'

export interface GSCRow {
  key: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export interface GSCSummary {
  totalClicks: number
  totalImpressions: number
  avgCtr: number
  avgPosition: number
  topQueries: GSCRow[]
  topPages: GSCRow[]
}

async function query(
  startDate: string,
  endDate: string,
  dimension: string,
  limit = 10
): Promise<GSCRow[]> {
  const auth = getGoogleAuth()
  const api = google.searchconsole({ version: 'v1', auth })
  const res = await api.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate,
      endDate,
      dimensions: [dimension],
      rowLimit: limit,
    },
  })

  return (res.data.rows || []).map((row) => ({
    key: row.keys?.[0] || '',
    clicks: row.clicks || 0,
    impressions: row.impressions || 0,
    ctr: row.ctr || 0,
    position: row.position || 0,
  }))
}

export async function fetchGSCSummary(start: string, end: string): Promise<GSCSummary> {
  const [queryRows, pageRows] = await Promise.all([
    query(start, end, 'query', 10),
    query(start, end, 'page', 10),
  ])

  const totalClicks = queryRows.reduce((s, r) => s + r.clicks, 0)
  const totalImpressions = queryRows.reduce((s, r) => s + r.impressions, 0)

  return {
    totalClicks,
    totalImpressions,
    avgCtr: totalImpressions > 0 ? totalClicks / totalImpressions : 0,
    avgPosition:
      queryRows.length > 0
        ? queryRows.reduce((s, r) => s + r.position, 0) / queryRows.length
        : 0,
    topQueries: queryRows,
    topPages: pageRows,
  }
}
