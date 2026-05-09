/**
 * Weekly Funnel Report — Vercel Cron Job
 *
 * Schedule: Monday 8am PT (0 16 * * 1 UTC)
 * Auth: Bearer CRON_SECRET header (same pattern as abandoned-leads)
 *
 * Usage:
 *   Production: Vercel cron fires automatically.
 *   Manual test: curl -H "Authorization: Bearer $CRON_SECRET" \
 *     https://webuyanyvegashouse.com/api/cron/funnel-report
 *   Dry run (returns report without sending email):
 *     ?dry_run=1
 */

import { NextRequest, NextResponse } from 'next/server'
import { buildWeeklyReport } from '@/lib/funnel-report/build'
import { formatMarkdown, formatHTML } from '@/lib/funnel-report/format'
import { sendEmail } from '@/lib/funnel-report/send-email'

export const maxDuration = 60

export async function GET(request: NextRequest) {
  // ── Auth ──
  const authHeader = request.headers.get('authorization')
  if (process.env.NODE_ENV === 'production') {
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const isDryRun = request.nextUrl.searchParams.get('dry_run') === '1'

  try {
    console.log('[Cron:FunnelReport] Building weekly report...')
    const report = await buildWeeklyReport()

    const markdown = formatMarkdown(report)
    const html = formatHTML(markdown)

    if (isDryRun) {
      console.log('[Cron:FunnelReport] Dry run — returning report without email')
      return new NextResponse(markdown, {
        headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
      })
    }

    // Send email
    const to = process.env.REPORT_RECIPIENT_EMAIL
    const from = process.env.REPORT_FROM_EMAIL || 'onboarding@resend.dev'
    if (!to) {
      console.error('[Cron:FunnelReport] REPORT_RECIPIENT_EMAIL not set')
      return NextResponse.json({ error: 'REPORT_RECIPIENT_EMAIL not set' }, { status: 500 })
    }

    const weekLabel = report.periodLabel
    const subject = `Weekly Funnel Report — ${weekLabel}`

    const emailResult = await sendEmail({ to, from, subject, html })
    console.log('[Cron:FunnelReport] Email sent:', emailResult.id)

    return NextResponse.json({
      status: 'sent',
      emailId: emailResult.id,
      period: report.periodLabel,
      leads: {
        formSubmits: report.funnel.formSubmit,
        sessions: report.topLine.sessions,
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[Cron:FunnelReport] Failed:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
