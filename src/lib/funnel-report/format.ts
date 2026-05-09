/**
 * Renders a WeeklyReport as markdown (for CLI / file output)
 * and as HTML (for email delivery).
 */

import type { WeeklyReport } from './build'

function pct(v: number): string {
  return (v * 100).toFixed(1) + '%'
}

function delta(cur: number, prev: number | undefined): string {
  if (prev === undefined || prev === 0) return '—'
  const d = ((cur - prev) / prev) * 100
  return (d >= 0 ? '+' : '') + d.toFixed(1) + '%'
}

function dur(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function findEvent(events: Array<{ event: string; count: number }>, name: string): number {
  return events.find((e) => e.event === name)?.count || 0
}

export function formatMarkdown(report: WeeklyReport): string {
  const { topLine, priorTopLine, channels, events, topPages, funnel, priorFunnel, dailySubmits, deliveryStats, gsc, priorEvents } = report

  const formLeads = findEvent(events, 'form') || findEvent(events, 'full_lead')
  const phoneCalls = findEvent(events, 'phone_call')
  const totalLeads = formLeads + phoneCalls
  const cvr = topLine.sessions > 0 ? totalLeads / topLine.sessions : 0

  const priorFormLeads = priorEvents ? (findEvent(priorEvents, 'form') || findEvent(priorEvents, 'full_lead')) : 0
  const priorPhoneCalls = priorEvents ? findEvent(priorEvents, 'phone_call') : 0
  const priorTotalLeads = priorFormLeads + priorPhoneCalls
  const priorCvr = priorTopLine && priorTopLine.sessions > 0 ? priorTotalLeads / priorTopLine.sessions : 0

  const lines: string[] = []
  const w = (s: string) => lines.push(s)

  w(`# Weekly Funnel Report`)
  w(``)
  w(`**Period:** ${report.periodLabel}`)
  w(`**Generated:** ${new Date(report.generatedAt).toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })}`)
  w(``)
  w(`---`)
  w(``)

  // ── 1. Headline numbers ──
  w(`## 1. Headline numbers`)
  w(``)
  w(`| Metric | This week | Prior week | WoW Δ |`)
  w(`| --- | ---: | ---: | ---: |`)
  w(`| Sessions | ${topLine.sessions.toLocaleString()} | ${priorTopLine?.sessions.toLocaleString() ?? '—'} | ${delta(topLine.sessions, priorTopLine?.sessions)} |`)
  w(`| Users | ${topLine.totalUsers.toLocaleString()} | ${priorTopLine?.totalUsers.toLocaleString() ?? '—'} | ${delta(topLine.totalUsers, priorTopLine?.totalUsers)} |`)
  w(`| Engagement rate | ${pct(topLine.engagementRate)} | ${priorTopLine ? pct(priorTopLine.engagementRate) : '—'} | ${delta(topLine.engagementRate, priorTopLine?.engagementRate)} |`)
  w(`| Bounce rate | ${pct(topLine.bounceRate)} | ${priorTopLine ? pct(priorTopLine.bounceRate) : '—'} | ${delta(topLine.bounceRate, priorTopLine?.bounceRate)} |`)
  w(`| Avg session duration | ${dur(topLine.avgSessionDuration)} | ${priorTopLine ? dur(priorTopLine.avgSessionDuration) : '—'} | ${delta(topLine.avgSessionDuration, priorTopLine?.avgSessionDuration)} |`)
  w(`| Page views | ${topLine.pageViews.toLocaleString()} | ${priorTopLine?.pageViews.toLocaleString() ?? '—'} | ${delta(topLine.pageViews, priorTopLine?.pageViews)} |`)
  w(`| **Form leads** | **${formLeads}** | ${priorFormLeads || '—'} | ${delta(formLeads, priorFormLeads || undefined)} |`)
  w(`| **Phone calls** | **${phoneCalls}** | ${priorPhoneCalls || '—'} | ${delta(phoneCalls, priorPhoneCalls || undefined)} |`)
  w(`| **Total leads** | **${totalLeads}** | ${priorTotalLeads || '—'} | ${delta(totalLeads, priorTotalLeads || undefined)} |`)
  w(`| **Lead CVR** | **${pct(cvr)}** | ${priorCvr ? pct(priorCvr) : '—'} | ${delta(cvr, priorCvr || undefined)} |`)
  w(``)

  // ── 2. Funnel ──
  w(`## 2. Funnel (Neon DB)`)
  w(``)
  w(`| Stage | Sessions | % of starters | Prior week |`)
  w(`| --- | ---: | ---: | ---: |`)
  const funnelPct = (n: number) => funnel.totalSessions > 0 ? pct(n / funnel.totalSessions) : '—'
  w(`| Form sessions | ${funnel.totalSessions} | 100% | ${priorFunnel?.totalSessions ?? '—'} |`)
  w(`| Address selected | ${funnel.addressSelected} | ${funnelPct(funnel.addressSelected)} | ${priorFunnel?.addressSelected ?? '—'} |`)
  w(`| Step 1 submit | ${funnel.addressSubmit} | ${funnelPct(funnel.addressSubmit)} | ${priorFunnel?.addressSubmit ?? '—'} |`)
  w(`| **Full submit** | **${funnel.formSubmit}** | ${funnelPct(funnel.formSubmit)} | ${priorFunnel?.formSubmit ?? '—'} |`)
  w(``)

  // Delivery reliability
  const delivered = deliveryStats['delivered'] || 0
  const failed = deliveryStats['failed'] || 0
  const total = delivered + failed + (deliveryStats['fallback_delivered'] || 0) + (deliveryStats['fallback_failed'] || 0)
  w(`**Delivery:** ${delivered} delivered, ${failed} failed, ${total} total (${total > 0 ? pct(delivered / total) : '—'} success rate)`)
  w(``)

  // Daily trend
  if (dailySubmits.length > 0) {
    w(`**Daily submits:** ${dailySubmits.map((d) => `${d.day.slice(5)}: ${d.submits}`).join(' | ')}`)
    w(``)
  }

  // ── 3. Traffic sources ──
  w(`## 3. Traffic sources`)
  w(``)
  w(`| Channel | Sessions | Eng rate | Bounce |`)
  w(`| --- | ---: | ---: | ---: |`)
  for (const ch of channels) {
    w(`| ${ch.channel} | ${ch.sessions.toLocaleString()} | ${pct(ch.engagementRate)} | ${pct(ch.bounceRate)} |`)
  }
  w(``)

  // ── 4. Top pages ──
  w(`## 4. Top landing pages`)
  w(``)
  w(`| Page | Sessions | Bounce | Avg duration |`)
  w(`| --- | ---: | ---: | ---: |`)
  for (const p of topPages) {
    w(`| ${p.page} | ${p.sessions.toLocaleString()} | ${pct(p.bounceRate)} | ${dur(p.avgDuration)} |`)
  }
  w(``)

  // ── 5. Organic search ──
  if (gsc) {
    w(`## 5. Organic search (GSC, 3-day lag)`)
    w(``)
    w(`**Clicks:** ${gsc.totalClicks} | **Impressions:** ${gsc.totalImpressions.toLocaleString()} | **CTR:** ${pct(gsc.avgCtr)}`)
    w(``)
    if (gsc.topQueries.length > 0) {
      w(`**Top queries:**`)
      w(``)
      w(`| Query | Clicks | Impressions | Position |`)
      w(`| --- | ---: | ---: | ---: |`)
      for (const q of gsc.topQueries) {
        w(`| ${q.key} | ${q.clicks} | ${q.impressions.toLocaleString()} | ${q.position.toFixed(1)} |`)
      }
      w(``)
    }
  }

  // ── 6. Anomaly flags ──
  w(`## 6. Anomaly flags`)
  w(``)
  const anomalies: string[] = []
  if (priorTopLine) {
    if (topLine.sessions < priorTopLine.sessions * 0.7)
      anomalies.push(`Sessions down ${delta(topLine.sessions, priorTopLine.sessions)} WoW`)
    if (topLine.bounceRate > priorTopLine.bounceRate * 1.3)
      anomalies.push(`Bounce rate up ${delta(topLine.bounceRate, priorTopLine.bounceRate)} WoW`)
  }
  if (totalLeads < priorTotalLeads * 0.7 && priorTotalLeads > 0)
    anomalies.push(`Total leads down ${delta(totalLeads, priorTotalLeads)} WoW`)
  if (funnel.formSubmit === 0 && (priorFunnel?.formSubmit || 0) > 0)
    anomalies.push(`Zero form submits this week (was ${priorFunnel?.formSubmit} last week)`)
  if (failed > 0)
    anomalies.push(`${failed} failed lead deliveries this week`)

  if (anomalies.length === 0) {
    w(`No anomalies detected.`)
  } else {
    for (const a of anomalies) w(`- **${a}**`)
  }
  w(``)

  return lines.join('\n')
}

/**
 * Wraps markdown in a simple HTML template for email.
 */
export function formatHTML(markdown: string): string {
  // Simple markdown → HTML conversion for email (tables, headers, bold)
  let html = markdown
    // Headers
    .replace(/^## (\d+\. .+)$/gm, '<h2 style="color:#1a1a2e;border-bottom:1px solid #e0e0e0;padding-bottom:4px;">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="color:#1a1a2e;">$1</h1>')
    // Bold
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Tables
    .replace(/^\|(.+)\|$/gm, (match) => {
      const cells = match.split('|').filter(Boolean).map((c) => c.trim())
      return '<tr>' + cells.map((c) => `<td style="padding:4px 8px;border:1px solid #ddd;">${c}</td>`).join('') + '</tr>'
    })
    // Horizontal rules
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #e0e0e0;margin:16px 0;">')
    // List items
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    // Line breaks
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')

  // Wrap tables
  html = html.replace(
    /(<tr>[\s\S]*?<\/tr>(\s*<tr>[\s\S]*?<\/tr>)*)/g,
    '<table style="border-collapse:collapse;font-size:14px;margin:8px 0;">$1</table>'
  )

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;max-width:700px;margin:0 auto;padding:20px;color:#333;">
<p>${html}</p>
<hr style="border:none;border-top:1px solid #e0e0e0;margin:24px 0;">
<p style="font-size:12px;color:#888;">
This report was auto-generated by the WeeklyFunnelReport cron job.<br>
Data sources: GA4 (property 306814390), GSC (sc-domain:paperlotland.com), Neon Postgres (leads table).
</p>
</body>
</html>`
}
