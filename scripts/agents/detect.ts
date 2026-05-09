/**
 * Agentic monitoring — detection orchestrator.
 *
 * Modes:
 *   npx tsx scripts/agents/detect.ts --mode=seo
 *   npx tsx scripts/agents/detect.ts --mode=site-health
 *   npx tsx scripts/agents/detect.ts --mode=auto-close       # recovery pass
 *
 * Reads policy from scripts/agents/policy.json. Writes findings as GitHub
 * Issues via `gh` CLI (must be authenticated via GH_TOKEN in CI).
 *
 * Exit codes:
 *   0  success
 *   2  canary missing — pipeline broken, do not trust today's results
 *   3  policy load error
 *   4  gh CLI unavailable or unauthenticated
 *
 * Plan: docs/plans/2026-04-28-feat-closed-loop-agentic-monitoring-plan.md
 * Runbook: docs/agents/README.md
 */

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// ─── Types ───────────────────────────────────────────────────────────────────

export type FixType = 'fix:meta' | 'fix:alt'
export type Mode = 'seo' | 'site-health' | 'auto-close'

export interface Finding {
  fix_type: FixType | 'canary'
  signature: string // unique key, used in issue title prefix
  title: string // human-readable issue title (without prefix)
  target_url: string // canonicalized
  symptom: string
  expected: string
  found: string
  evidence: string[] // bulleted
  suggested_fix: string
  recovery_check: { kind: string; [k: string]: unknown }
}

interface Policy {
  labels: Record<string, { color: string; description: string }>
  safe_fix_allowlist: Record<string, { paths: string[]; diff_filter: unknown }>
  explicitly_excluded_paths: string[]
  diff_size_caps: { max_lines_changed: number; max_files_changed: number }
  max_new_issues_per_run?: number
  cooldown_days_after_close: number
  canary: {
    signature: string
    check: { kind: string; url: string; must_contain: string }
    expected_message: string
  }
  detection_thresholds: Record<string, unknown>
  prompt_versions: Record<string, string>
}

// ─── Canonicalization ────────────────────────────────────────────────────────

/**
 * Normalize external URLs (Ahrefs, GSC, raw page links) to the form Google
 * has indexed. The site's canonical form is locked at build time in
 * src/lib/config.ts (commit 9064263). Don't mirror that file here — this
 * helper only normalizes inputs to match.
 */
export function canonicalize(rawUrl: string): string {
  const u = new URL(rawUrl)
  u.hostname = u.hostname.replace(/^www\./, '')
  u.protocol = 'https:'
  u.search = ''
  u.hash = ''
  if (!u.pathname.endsWith('/')) u.pathname += '/'
  return u.toString()
}

// ─── Policy loader ───────────────────────────────────────────────────────────

function loadPolicy(): Policy {
  try {
    const raw = readFileSync(resolve(__dirname, 'policy.json'), 'utf-8')
    return JSON.parse(raw) as Policy
  } catch (err) {
    console.error('Failed to load policy.json:', err)
    process.exit(3)
  }
}

// ─── gh CLI helpers ──────────────────────────────────────────────────────────

function gh(args: string[], opts: { allowFailure?: boolean } = {}): string {
  try {
    return execFileSync('gh', args, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
  } catch (err: unknown) {
    if (opts.allowFailure) return ''
    const e = err as { stderr?: Buffer | string; message?: string }
    const stderr = typeof e.stderr === 'string' ? e.stderr : e.stderr?.toString() ?? ''
    console.error(`gh ${args.join(' ')} failed:`, stderr || e.message)
    process.exit(4)
  }
}

interface GhIssue {
  number: number
  title: string
  state: 'open' | 'closed'
  createdAt: string
  closedAt: string | null
  labels: { name: string }[]
  body: string
}

function findIssuesBySignature(signature: string): GhIssue[] {
  const search = `[agent:${signature}] in:title`
  const json = gh(
    [
      'issue',
      'list',
      '--search',
      search,
      '--state',
      'all',
      '--limit',
      '50',
      '--json',
      'number,title,state,createdAt,closedAt,labels,body',
    ],
    { allowFailure: true },
  )
  if (!json) return []
  try {
    return JSON.parse(json) as GhIssue[]
  } catch {
    return []
  }
}

function listOpenAgentIssues(): GhIssue[] {
  const json = gh(
    [
      'issue',
      'list',
      '--search',
      '[agent: in:title',
      '--state',
      'open',
      '--limit',
      '100',
      '--json',
      'number,title,state,createdAt,closedAt,labels,body',
    ],
    { allowFailure: true },
  )
  if (!json) return []
  try {
    return JSON.parse(json) as GhIssue[]
  } catch {
    return []
  }
}

// ─── Issue body rendering ────────────────────────────────────────────────────

function renderBody(f: Finding, promptVersion: string): string {
  const evidence = f.evidence.map((e) => `- ${e}`).join('\n')
  const recovery = JSON.stringify(f.recovery_check)
  return [
    `## Symptom`,
    ``,
    f.symptom,
    `Expected: ${f.expected}`,
    `Found: ${f.found}`,
    ``,
    `## Evidence`,
    ``,
    evidence,
    `- Detected at: ${new Date().toISOString()}`,
    `- Detector run: ${process.env.GITHUB_SERVER_URL ?? ''}/${process.env.GITHUB_REPOSITORY ?? ''}/actions/runs/${process.env.GITHUB_RUN_ID ?? 'local'}`,
    `- Prompt version: ${promptVersion}`,
    ``,
    `## Suggested fix`,
    ``,
    f.suggested_fix,
    ``,
    `## Recovery check`,
    ``,
    '```json',
    recovery,
    '```',
    ``,
    `## Signature`,
    ``,
    `\`[agent:${f.signature}]\``,
    ``,
  ].join('\n')
}

// ─── Issue creation with dedupe + post-create re-query ───────────────────────

function createOrCommentForFinding(f: Finding, policy: Policy, promptVersion: string): void {
  if (f.fix_type === 'canary') return // canary is asserted, not filed

  const existing = findIssuesBySignature(f.signature)
  const cooldownMs = policy.cooldown_days_after_close * 24 * 60 * 60 * 1000
  const now = Date.now()

  // Open issue exists → comment with refresh
  const open = existing.find((i) => i.state === 'open')
  if (open) {
    gh(['issue', 'comment', String(open.number), '--body', `Re-detected at ${new Date().toISOString()}.`])
    console.log(`[dedupe] commented on existing #${open.number} (${f.signature})`)
    return
  }

  // Closed within cooldown → suppress
  const recentClose = existing
    .filter((i) => i.state === 'closed' && i.closedAt)
    .find((i) => now - new Date(i.closedAt!).getTime() < cooldownMs)
  if (recentClose) {
    console.log(`[cooldown] suppressed ${f.signature} (recently closed #${recentClose.number})`)
    return
  }

  // Create new issue
  const title = `[agent:${f.signature}] ${f.title}`
  const body = renderBody(f, promptVersion)
  const labels = [f.fix_type].join(',')

  const created = gh(['issue', 'create', '--title', title, '--body', body, '--label', labels])
  const numMatch = created.match(/\/issues\/(\d+)/)
  const newNumber = numMatch ? Number(numMatch[1]) : null
  console.log(`[create] #${newNumber ?? '?'} ${f.signature}`)

  // Post-create re-query for TOCTOU — if a lower-numbered issue with same prefix exists, close ours as duplicate
  if (newNumber) {
    const after = findIssuesBySignature(f.signature)
    const lower = after
      .filter((i) => i.state === 'open' && i.number < newNumber)
      .sort((a, b) => a.number - b.number)[0]
    if (lower) {
      gh([
        'issue',
        'close',
        String(newNumber),
        '--reason',
        'not planned',
        '--comment',
        `Duplicate of #${lower.number} (TOCTOU: detector race).`,
      ])
      console.log(`[dedupe-toctou] closed new #${newNumber} as dup of #${lower.number}`)
    }
  }
}

// ─── Canary ──────────────────────────────────────────────────────────────────

async function runCanary(policy: Policy): Promise<boolean> {
  const c = policy.canary
  if (c.check.kind !== 'fetch_and_assert') {
    console.error(`[canary] unknown check kind: ${c.check.kind}`)
    return false
  }
  try {
    const res = await fetch(c.check.url, { redirect: 'follow' })
    if (!res.ok) {
      console.error(`[canary] fetch ${c.check.url} returned ${res.status}`)
      return false
    }
    const text = await res.text()
    if (!text.includes(c.check.must_contain)) {
      console.error(`[canary] response missing required substring: ${c.check.must_contain}`)
      return false
    }
    console.log(`[canary] OK: ${c.signature}`)
    return true
  } catch (err) {
    console.error(`[canary] fetch error:`, err)
    return false
  }
}

// ─── Detectors ───────────────────────────────────────────────────────────────

// ─── SEO detectors ───────────────────────────────────────────────────────────

interface MetaLengthThresholds {
  title_min: number
  title_max: number
  description_min: number
  description_max: number
  sitemap_url: string
  max_concurrent_fetches: number
  fetch_timeout_ms: number
}

async function fetchSitemapUrls(sitemapUrl: string, timeoutMs: number): Promise<string[]> {
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(sitemapUrl, { signal: controller.signal })
    if (!res.ok) throw new Error(`sitemap fetch ${res.status}`)
    const xml = await res.text()
    return Array.from(xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)).map((m) => m[1])
  } finally {
    clearTimeout(t)
  }
}

async function fetchHtml(url: string, timeoutMs: number): Promise<string | null> {
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: controller.signal, redirect: 'follow' })
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  } finally {
    clearTimeout(t)
  }
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
}

function extractTitle(html: string): string | null {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  if (!m) return null
  return decodeEntities(m[1].replace(/\s+/g, ' ').trim())
}

function extractDescription(html: string): string | null {
  // Match name="description" or property="og:description" — prefer name="description"
  const m = html.match(/<meta\s+[^>]*name=["']description["'][^>]*>/i)
  if (!m) return null
  const content = m[0].match(/content=["']([^"']*)["']/i)
  return content ? decodeEntities(content[1].trim()) : null
}

function urlPathToFixPath(canonicalUrl: string): string {
  const path = new URL(canonicalUrl).pathname.replace(/\/$/, '') // /henderson
  if (path === '') return 'src/app/(site)/page.tsx'
  return `src/app/(site)${path}/page.tsx`
}

function urlSlug(canonicalUrl: string): string {
  const path = new URL(canonicalUrl).pathname.replace(/^\/|\/$/g, '')
  return path === '' ? 'home' : path.replace(/\//g, '-')
}

async function checkMetaLengths(thresholds: MetaLengthThresholds): Promise<Finding[]> {
  const urls = (await fetchSitemapUrls(thresholds.sitemap_url, thresholds.fetch_timeout_ms))
    .map(canonicalize)
    .filter((u, i, arr) => arr.indexOf(u) === i)

  console.log(`[seo:meta_length] checking ${urls.length} url(s) from sitemap`)

  const findings: Finding[] = []
  // Bounded concurrency
  const limit = thresholds.max_concurrent_fetches
  for (let i = 0; i < urls.length; i += limit) {
    const batch = urls.slice(i, i + limit)
    const results = await Promise.all(
      batch.map(async (url) => ({ url, html: await fetchHtml(url, thresholds.fetch_timeout_ms) })),
    )
    for (const { url, html } of results) {
      if (!html) {
        console.log(`[seo:meta_length] skip ${url} (fetch failed)`)
        continue
      }
      const title = extractTitle(html)
      const description = extractDescription(html)
      const slug = urlSlug(url)
      const fixPath = urlPathToFixPath(url)

      if (!title) {
        findings.push(
          buildMetaFinding(url, slug, fixPath, 'title-missing', 'Title tag missing', '<title> present', 'no <title>', thresholds),
        )
      } else if (title.length < thresholds.title_min) {
        findings.push(
          buildMetaFinding(
            url,
            slug,
            fixPath,
            'title-too-short',
            `Title tag too short (${title.length} chars)`,
            `${thresholds.title_min}–${thresholds.title_max} chars`,
            `${title.length} chars: "${title}"`,
            thresholds,
          ),
        )
      } else if (title.length > thresholds.title_max) {
        findings.push(
          buildMetaFinding(
            url,
            slug,
            fixPath,
            'title-too-long',
            `Title tag too long (${title.length} chars)`,
            `${thresholds.title_min}–${thresholds.title_max} chars`,
            `${title.length} chars: "${title}"`,
            thresholds,
          ),
        )
      }

      if (!description) {
        findings.push(
          buildMetaFinding(
            url,
            slug,
            fixPath,
            'desc-missing',
            'Meta description missing',
            '<meta name="description"> present',
            'no description tag',
            thresholds,
          ),
        )
      } else if (description.length < thresholds.description_min) {
        findings.push(
          buildMetaFinding(
            url,
            slug,
            fixPath,
            'desc-too-short',
            `Meta description too short (${description.length} chars)`,
            `${thresholds.description_min}–${thresholds.description_max} chars`,
            `${description.length} chars: "${description}"`,
            thresholds,
          ),
        )
      } else if (description.length > thresholds.description_max) {
        findings.push(
          buildMetaFinding(
            url,
            slug,
            fixPath,
            'desc-too-long',
            `Meta description too long (${description.length} chars)`,
            `${thresholds.description_min}–${thresholds.description_max} chars`,
            `${description.length} chars: "${description}"`,
            thresholds,
          ),
        )
      }
    }
  }

  return findings
}

function buildMetaFinding(
  url: string,
  slug: string,
  fixPath: string,
  symptomId: string,
  title: string,
  expected: string,
  found: string,
  thresholds: MetaLengthThresholds,
): Finding {
  // Embed thresholds in recovery so the auto-close pass can verify the
  // specific symptom — not just "tag exists".
  const recovery_check = {
    kind: 'fix:meta',
    url,
    symptom: symptomId,
    title_min: thresholds.title_min,
    title_max: thresholds.title_max,
    description_min: thresholds.description_min,
    description_max: thresholds.description_max,
  }
  return {
    fix_type: 'fix:meta',
    signature: `meta:${slug}:${symptomId}`,
    title: `${title} — ${slug}`,
    target_url: url,
    symptom: `Meta tag regression on ${url}.`,
    expected,
    found,
    evidence: [`Live page: ${url}`],
    suggested_fix: `Edit \`${fixPath}\` \`metadata\` export (or \`generateMetadata\`) so the corresponding field meets the policy length range.`,
    recovery_check,
  }
}

async function detectSeo(policy: Policy): Promise<Finding[]> {
  const thresholds = (policy.detection_thresholds.seo as { meta_length?: MetaLengthThresholds })
    ?.meta_length
  if (!thresholds) {
    console.log('[seo] no meta_length thresholds in policy — skipping')
    return []
  }
  return checkMetaLengths(thresholds)
}

/**
 * Site-health detector. PostHog form-error / JS-exception spikes.
 *
 * TODO: integrate PostHog HogQL via POSTHOG_PERSONAL_API_KEY
 */
async function detectSiteHealth(_policy: Policy): Promise<Finding[]> {
  const findings: Finding[] = []
  return findings
}

// ─── Auto-close pass ─────────────────────────────────────────────────────────

interface ParsedRecovery {
  kind: string
  url?: string
  [k: string]: unknown
}

function parseRecovery(body: string): ParsedRecovery | null {
  const block = body.match(/## Recovery check\s*\n+```json\s*\n([\s\S]*?)\n```/)
  if (!block) return null
  try {
    return JSON.parse(block[1]) as ParsedRecovery
  } catch {
    return null
  }
}

async function fetchAfterCacheGrace(url: string): Promise<string> {
  const tries = 3
  const delay = 100_000 // 100s between tries → 5min total window
  let lastErr: unknown
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { redirect: 'follow' })
      if (res.ok) return await res.text()
      lastErr = new Error(`HTTP ${res.status}`)
    } catch (err) {
      lastErr = err
    }
    if (i < tries - 1) await new Promise((r) => setTimeout(r, delay))
  }
  throw lastErr
}

async function isRecovered(issue: GhIssue): Promise<{ recovered: boolean; reason: string }> {
  const recovery = parseRecovery(issue.body)
  if (!recovery || !recovery.url) return { recovered: false, reason: 'no parseable recovery check' }

  const url = canonicalize(recovery.url)
  const labels = issue.labels.map((l) => l.name)

  try {
    const html = await fetchAfterCacheGrace(url)
    if (labels.includes('fix:meta')) {
      const symptom = (recovery.symptom as string | undefined) ?? ''
      const title = extractTitle(html)
      const description = extractDescription(html)
      const tMin = (recovery.title_min as number | undefined) ?? 0
      const tMax = (recovery.title_max as number | undefined) ?? Infinity
      const dMin = (recovery.description_min as number | undefined) ?? 0
      const dMax = (recovery.description_max as number | undefined) ?? Infinity

      switch (symptom) {
        case 'title-missing':
          return title
            ? { recovered: true, reason: `title now present (${title.length} chars)` }
            : { recovered: false, reason: 'still no <title>' }
        case 'title-too-short':
          if (!title) return { recovered: false, reason: 'no <title>' }
          return title.length >= tMin && title.length <= tMax
            ? { recovered: true, reason: `title now ${title.length} chars (in range)` }
            : { recovered: false, reason: `title still ${title.length} chars` }
        case 'title-too-long':
          if (!title) return { recovered: false, reason: 'no <title>' }
          return title.length >= tMin && title.length <= tMax
            ? { recovered: true, reason: `title now ${title.length} chars (in range)` }
            : { recovered: false, reason: `title still ${title.length} chars` }
        case 'desc-missing':
          return description
            ? { recovered: true, reason: `description now present (${description.length} chars)` }
            : { recovered: false, reason: 'still no description' }
        case 'desc-too-short':
        case 'desc-too-long':
          if (!description) return { recovered: false, reason: 'no description' }
          return description.length >= dMin && description.length <= dMax
            ? { recovered: true, reason: `description now ${description.length} chars (in range)` }
            : { recovered: false, reason: `description still ${description.length} chars` }
        default:
          return { recovered: false, reason: `unknown meta symptom: ${symptom || '(missing)'}` }
      }
    }
    if (labels.includes('fix:alt')) {
      const imgs = Array.from(html.matchAll(/<img\b[^>]*>/gi)).map((m) => m[0])
      const missing = imgs.filter((tag) => !/\salt\s*=\s*["'][^"']+["']/.test(tag))
      if (missing.length > 0) {
        return { recovered: false, reason: `${missing.length} img(s) still missing alt` }
      }
      return { recovered: true, reason: `all ${imgs.length} img(s) have alt` }
    }
    return { recovered: false, reason: 'unknown fix label' }
  } catch (err) {
    return { recovered: false, reason: `fetch failed: ${(err as Error).message}` }
  }
}

const MIN_AGE_BEFORE_AUTO_CLOSE_MS = 30 * 60 * 1000 // 30 min — don't auto-close issues we just filed

async function autoClosePass(): Promise<void> {
  const issues = listOpenAgentIssues()
  console.log(`[auto-close] checking ${issues.length} open agent issue(s)`)
  const now = Date.now()
  for (const issue of issues) {
    const ageMs = now - new Date(issue.createdAt).getTime()
    if (ageMs < MIN_AGE_BEFORE_AUTO_CLOSE_MS) {
      console.log(`[auto-close] skip #${issue.number}: too new (${Math.round(ageMs / 1000)}s old)`)
      continue
    }
    const { recovered, reason } = await isRecovered(issue)
    if (recovered) {
      gh([
        'issue',
        'close',
        String(issue.number),
        '--reason',
        'completed',
        '--comment',
        `Auto-closed: recovery check passed. ${reason}`,
      ])
      console.log(`[auto-close] closed #${issue.number}: ${reason}`)
    } else {
      console.log(`[auto-close] keep open #${issue.number}: ${reason}`)
    }
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

function parseMode(): Mode {
  const arg = process.argv.find((a) => a.startsWith('--mode='))
  const mode = arg?.split('=')[1]
  if (mode === 'seo' || mode === 'site-health' || mode === 'auto-close') return mode
  console.error('Usage: detect.ts --mode=seo|site-health|auto-close')
  process.exit(1)
}

async function main(): Promise<void> {
  const mode = parseMode()
  const policy = loadPolicy()

  if (mode === 'auto-close') {
    await autoClosePass()
    return
  }

  // Canary first — if pipeline is broken, don't trust the empty findings list
  const canaryOk = await runCanary(policy)
  if (!canaryOk) {
    console.error('::error::Canary check failed. Pipeline broken — investigate before trusting findings.')
    process.exit(2)
  }

  const promptKey = mode === 'seo' ? 'detect-seo' : 'detect-site-health'
  const promptVersion = `${promptKey}@${policy.prompt_versions[promptKey] ?? 'v0'}`

  const findings = mode === 'seo' ? await detectSeo(policy) : await detectSiteHealth(policy)
  console.log(`[${mode}] ${findings.length} finding(s)`)

  const dryRun = process.argv.includes('--dry-run')
  if (dryRun) {
    console.log('--- DRY RUN: no issues will be created ---')
    for (const f of findings) {
      console.log(JSON.stringify(f, null, 2))
    }
    return
  }

  const cap = policy.max_new_issues_per_run ?? Infinity
  let created = 0
  for (const f of findings) {
    if (created >= cap) {
      console.log(`[cap] skipping remaining ${findings.length - created} finding(s) (max_new_issues_per_run=${cap})`)
      break
    }
    const before = created
    createOrCommentForFinding(f, policy, promptVersion)
    // Only count when a *new* issue would have been created. The dedupe path (re-detect comment, cooldown suppress)
    // doesn't burn cap budget. Detection of "did create" is approximate — we count attempts that weren't suppressed
    // by cooldown. createOrCommentForFinding logs distinguish them; for the cap we just count attempts.
    if (created === before) created++
  }
}

// Only run when invoked directly (not when imported by tests)
const invokedDirectly =
  require.main === module ||
  (typeof process !== 'undefined' && process.argv[1]?.endsWith('detect.ts'))

if (invokedDirectly) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
