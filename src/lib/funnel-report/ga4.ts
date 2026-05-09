/**
 * GA4 Data API wrapper for the weekly funnel report.
 * Uses googleapis (already installed) with service account auth.
 */

import { google } from 'googleapis'
import { getGoogleAuth } from './google-auth'

const PROPERTY_ID = process.env.GA4_PROPERTY_ID || '306814390'

interface GA4Row {
  dimensions: Record<string, string>
  metrics: Record<string, number>
}

function parseResponse(res: { data: { rows?: Array<{ dimensionValues?: Array<{ value?: string | null }>; metricValues?: Array<{ value?: string | null }> }>; dimensionHeaders?: Array<{ name?: string | null }>; metricHeaders?: Array<{ name?: string | null }> } }): GA4Row[] {
  const dimHeaders = res.data.dimensionHeaders?.map((h) => h.name || '') || []
  const metHeaders = res.data.metricHeaders?.map((h) => h.name || '') || []
  return (res.data.rows || []).map((row) => ({
    dimensions: Object.fromEntries(
      (row.dimensionValues || []).map((v, i) => [dimHeaders[i], v.value || ''])
    ),
    metrics: Object.fromEntries(
      (row.metricValues || []).map((v, i) => [metHeaders[i], parseFloat(v.value || '0')])
    ),
  }))
}

export interface GA4TopLine {
  sessions: number
  totalUsers: number
  engagedSessions: number
  engagementRate: number
  bounceRate: number
  avgSessionDuration: number
  pageViews: number
}

export interface GA4ChannelRow {
  channel: string
  sessions: number
  engagementRate: number
  bounceRate: number
}

export interface GA4EventRow {
  event: string
  count: number
}

export interface GA4PageRow {
  page: string
  sessions: number
  bounceRate: number
  avgDuration: number
}

export async function fetchGA4TopLine(start: string, end: string): Promise<GA4TopLine> {
  const auth = getGoogleAuth()
  const api = google.analyticsdata({ version: 'v1beta', auth })
  const res = await api.properties.runReport({
    property: `properties/${PROPERTY_ID}`,
    requestBody: {
      dateRanges: [{ startDate: start, endDate: end }],
      dimensions: [{ name: 'country' }],
      dimensionFilter: {
        filter: { fieldName: 'country', stringFilter: { value: 'United States' } },
      },
      metrics: [
        { name: 'sessions' },
        { name: 'totalUsers' },
        { name: 'engagedSessions' },
        { name: 'engagementRate' },
        { name: 'bounceRate' },
        { name: 'averageSessionDuration' },
        { name: 'screenPageViews' },
      ],
    },
  })
  const rows = parseResponse(res)
  const r = rows[0]?.metrics || {}
  return {
    sessions: r.sessions || 0,
    totalUsers: r.totalUsers || 0,
    engagedSessions: r.engagedSessions || 0,
    engagementRate: r.engagementRate || 0,
    bounceRate: r.bounceRate || 0,
    avgSessionDuration: r.averageSessionDuration || 0,
    pageViews: r.screenPageViews || 0,
  }
}

export async function fetchGA4Channels(start: string, end: string): Promise<GA4ChannelRow[]> {
  const auth = getGoogleAuth()
  const api = google.analyticsdata({ version: 'v1beta', auth })
  const res = await api.properties.runReport({
    property: `properties/${PROPERTY_ID}`,
    requestBody: {
      dateRanges: [{ startDate: start, endDate: end }],
      dimensions: [{ name: 'sessionDefaultChannelGroup' }],
      metrics: [
        { name: 'sessions' },
        { name: 'engagementRate' },
        { name: 'bounceRate' },
      ],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: '15',
    },
  })
  return parseResponse(res).map((r) => ({
    channel: r.dimensions.sessionDefaultChannelGroup,
    sessions: r.metrics.sessions,
    engagementRate: r.metrics.engagementRate,
    bounceRate: r.metrics.bounceRate,
  }))
}

export async function fetchGA4Events(start: string, end: string): Promise<GA4EventRow[]> {
  const auth = getGoogleAuth()
  const api = google.analyticsdata({ version: 'v1beta', auth })
  const res = await api.properties.runReport({
    property: `properties/${PROPERTY_ID}`,
    requestBody: {
      dateRanges: [{ startDate: start, endDate: end }],
      dimensions: [{ name: 'eventName' }],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          inListFilter: {
            values: [
              'form', 'full_lead', 'address_lead', 'phone_call',
              'first_time_phone_call', 'form_start', 'form_step2_submit',
            ],
          },
        },
      },
      metrics: [{ name: 'eventCount' }],
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
    },
  })
  return parseResponse(res).map((r) => ({
    event: r.dimensions.eventName,
    count: r.metrics.eventCount,
  }))
}

export async function fetchGA4TopPages(start: string, end: string): Promise<GA4PageRow[]> {
  const auth = getGoogleAuth()
  const api = google.analyticsdata({ version: 'v1beta', auth })
  const res = await api.properties.runReport({
    property: `properties/${PROPERTY_ID}`,
    requestBody: {
      dateRanges: [{ startDate: start, endDate: end }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [
        { name: 'sessions' },
        { name: 'bounceRate' },
        { name: 'averageSessionDuration' },
      ],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: '15',
    },
  })
  return parseResponse(res).map((r) => ({
    page: r.dimensions.pagePath,
    sessions: r.metrics.sessions,
    bounceRate: r.metrics.bounceRate,
    avgDuration: r.metrics.averageSessionDuration,
  }))
}
