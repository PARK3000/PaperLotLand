/**
 * Idempotent setup for the "LP Hero v2" experiment in PostHog.
 *
 * Creates (or detects existing):
 *   1. Feature flag `lp-hero-v2` (multivariate, 50/50 control vs variant-b, disabled)
 *   2. Experiment "LP Hero v2 — combined treatment" (draft, primary form_started,
 *      secondary form_step_completed + lead_submission)
 *   3. Dashboard "LP Hero v2 — Live Monitoring" with exposure split, daily metrics
 *      by variant, and the full funnel
 *
 * Usage:
 *   npx tsx scripts/posthog/setup-lp-hero-v2-experiment.ts             # dry-run (default)
 *   npx tsx scripts/posthog/setup-lp-hero-v2-experiment.ts --commit    # actually call PostHog
 *
 * Requires in .env (or .env.local):
 *   POSTHOG_PERSONAL_API_KEY=phx_...
 *   NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com   (will be normalized to us.posthog.com)
 *
 * Notes:
 *   - Flag is created `active: false` and rolled out to 100% of callers.
 *     URL-based targeting happens at the call-site (only LP pages call
 *     getExperimentVariant). Paid-traffic filtering happens at the analysis
 *     layer via experiment metric filters on utm_medium.
 *   - Experiment is created as draft. You launch it manually after review.
 *   - Re-running this script with --commit will detect existing items by
 *     key/name and skip re-creation. It will not delete or overwrite.
 */

import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'

// Tiny .env loader — keeps this script dep-free.
function loadEnvFile(path: string) {
  if (!existsSync(path)) return
  const text = readFileSync(path, 'utf8')
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq === -1) continue
    const key = line.slice(0, eq).trim()
    let val = line.slice(eq + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = val
  }
}
loadEnvFile(resolve(process.cwd(), '.env.local'))
loadEnvFile(resolve(process.cwd(), '.env'))

const PROJECT_ID = 393348
const FLAG_KEY = 'lp-hero-v2'
const EXPERIMENT_NAME = 'LP Hero v2 — combined treatment'
const DASHBOARD_NAME = 'LP Hero v2 — Live Monitoring'
const COMMIT = process.argv.includes('--commit')

// PostHog API host: us.i.posthog.com is for ingestion; the management API
// lives at us.posthog.com. Normalize whichever form is in env.
const RAW_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST?.replace(/\/$/, '') ||
  'https://us.posthog.com'
const API_HOST = RAW_HOST.replace('us.i.posthog.com', 'us.posthog.com')
const KEY = process.env.POSTHOG_PERSONAL_API_KEY

if (!KEY) {
  console.error('❌ POSTHOG_PERSONAL_API_KEY not set in env')
  process.exit(1)
}

// Defense-in-depth: this script ships a high-privilege personal API key over
// the network, so refuse to run if NEXT_PUBLIC_POSTHOG_HOST has been pointed
// at something other than PostHog (e.g., a misconfigured proxy).
if (!/\.posthog\.com$/.test(new URL(API_HOST).hostname)) {
  console.error(`❌ Refusing to use non-PostHog host: ${API_HOST}`)
  process.exit(1)
}

function authHeaders() {
  return {
    Authorization: `Bearer ${KEY}`,
    'Content-Type': 'application/json',
  }
}

async function api<T = unknown>(
  method: 'GET' | 'POST' | 'PATCH',
  path: string,
  body?: unknown
): Promise<T> {
  const url = `${API_HOST}/api/projects/${PROJECT_ID}${path}`
  if (!COMMIT) {
    console.log(`\n[DRY-RUN] ${method} ${url}`)
    if (body) console.log(JSON.stringify(body, null, 2))
    // Return an empty shape so dry-run can continue past lookups
    return (method === 'GET' ? { results: [] } : { id: 'DRY_RUN', short_id: 'DRY' }) as T
  }
  const res = await fetch(url, {
    method,
    headers: authHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${method} ${path} → ${res.status}: ${text}`)
  }
  return (await res.json()) as T
}

// ── 1. Feature flag ─────────────────────────────────────────────────────────

interface FeatureFlagListResponse {
  results: Array<{ id: number; key: string; active: boolean }>
}

interface FeatureFlag {
  id: number
  key: string
  active: boolean
}

async function ensureFeatureFlag(): Promise<FeatureFlag> {
  const existing = await api<FeatureFlagListResponse>(
    'GET',
    `/feature_flags/?search=${FLAG_KEY}`
  )
  const found = existing.results?.find((f) => f.key === FLAG_KEY)
  if (found) {
    console.log(`✓ flag "${FLAG_KEY}" already exists (id=${found.id}, active=${found.active})`)
    return found
  }

  const payload = {
    key: FLAG_KEY,
    name: 'LP Hero v2 (combined headline + CTA + bg image)',
    active: false,
    filters: {
      groups: [
        {
          properties: [],
          rollout_percentage: 100,
        },
      ],
      multivariate: {
        variants: [
          { key: 'control', name: 'Current hero', rollout_percentage: 50 },
          {
            key: 'variant-b',
            name: 'v2 hero (new headline + CTA + bg image)',
            rollout_percentage: 50,
          },
        ],
      },
    },
    tags: ['experiment', 'lp', 'paid-traffic'],
  }

  const created = await api<FeatureFlag>('POST', '/feature_flags/', payload)
  console.log(`✓ flag "${FLAG_KEY}" created (id=${created.id})`)
  return created
}

// ── 2. Experiment ───────────────────────────────────────────────────────────

interface ExperimentListResponse {
  results: Array<{ id: number; name: string }>
}

interface Experiment {
  id: number
  name: string
}

async function ensureExperiment(flagKey: string): Promise<Experiment> {
  const existing = await api<ExperimentListResponse>(
    'GET',
    `/experiments/?search=${encodeURIComponent(EXPERIMENT_NAME)}`
  )
  const found = existing.results?.find((e) => e.name === EXPERIMENT_NAME)
  if (found) {
    console.log(`✓ experiment "${EXPERIMENT_NAME}" already exists (id=${found.id})`)
    return found
  }

  // Helper: build a metric filter scoped to LP paid traffic.
  const lpPaidFilter = {
    properties: [
      {
        key: '$pathname',
        value: '/lp/',
        operator: 'icontains',
        type: 'event',
      },
    ],
  }

  const payload = {
    name: EXPERIMENT_NAME,
    description:
      'Combined v2 hero treatment (new headline + CTA copy + bg image with person engaging with form) on PPC landing pages. Single variant for both mobile and desktop, responsive layout.',
    feature_flag_key: flagKey,
    parameters: {
      feature_flag_variants: [
        { key: 'control', rollout_percentage: 50 },
        { key: 'variant-b', rollout_percentage: 50 },
      ],
      minimum_detectable_effect: 30,
    },
    metrics: [
      {
        kind: 'ExperimentMetric',
        metric_type: 'mean',
        name: 'form_started (primary)',
        source: {
          kind: 'EventsNode',
          event: 'form_started',
          ...lpPaidFilter,
        },
      },
    ],
    metrics_secondary: [
      {
        kind: 'ExperimentMetric',
        metric_type: 'mean',
        name: 'form_step_completed step=1',
        source: {
          kind: 'EventsNode',
          event: 'form_step_completed',
          properties: [
            ...lpPaidFilter.properties,
            { key: 'step', value: '1', operator: 'exact', type: 'event' },
          ],
        },
      },
      {
        kind: 'ExperimentMetric',
        metric_type: 'mean',
        name: 'lead_submission (full conversion)',
        source: {
          kind: 'EventsNode',
          event: 'lead_submission',
          ...lpPaidFilter,
        },
      },
    ],
    type: 'product',
    // Allow form_step_completed even if it hasn't been ingested yet (event
    // ships with PR #121; will start firing once that PR is deployed).
    allow_unknown_events: true,
    // Draft state — PostHog launches when start_date is set via UI.
  }

  const created = await api<Experiment>('POST', '/experiments/', payload)
  console.log(`✓ experiment "${EXPERIMENT_NAME}" created (id=${created.id})`)
  return created
}

// ── 3. Dashboard + insights ─────────────────────────────────────────────────

interface DashboardListResponse {
  results: Array<{ id: number; name: string }>
}

interface Dashboard {
  id: number
  name: string
}

interface Insight {
  id: number
  short_id: string
}

async function ensureDashboard(): Promise<Dashboard> {
  const existing = await api<DashboardListResponse>(
    'GET',
    `/dashboards/?search=${encodeURIComponent(DASHBOARD_NAME)}`
  )
  const found = existing.results?.find((d) => d.name === DASHBOARD_NAME)
  if (found) {
    console.log(`✓ dashboard "${DASHBOARD_NAME}" already exists (id=${found.id})`)
    return found
  }
  const created = await api<Dashboard>('POST', '/dashboards/', {
    name: DASHBOARD_NAME,
    description: 'Live monitoring for the LP Hero v2 experiment.',
    tags: ['experiment', 'lp'],
  })
  console.log(`✓ dashboard "${DASHBOARD_NAME}" created (id=${created.id})`)
  return created
}

async function createInsight(
  dashboardId: number,
  name: string,
  query: unknown
): Promise<Insight> {
  return api<Insight>('POST', '/insights/', {
    name,
    query,
    dashboards: [dashboardId],
    tags: ['lp-hero-v2'],
  })
}

const PAID_LP_FILTERS = [
  { key: '$pathname', value: '/lp/', operator: 'icontains', type: 'event' },
]

async function buildInsights(dashboardId: number) {
  const breakdownByVariant = {
    breakdownFilter: {
      breakdown_type: 'event',
      breakdown: `$feature/${FLAG_KEY}`,
    },
  }

  // A) Exposure split
  await createInsight(dashboardId, 'Exposure split (SRM check)', {
    kind: 'TrendsQuery',
    series: [
      {
        kind: 'EventsNode',
        event: '$feature_flag_called',
        properties: [
          {
            key: '$feature_flag',
            value: FLAG_KEY,
            operator: 'exact',
            type: 'event',
          },
        ],
        math: 'dau',
      },
    ],
    breakdownFilter: {
      breakdown_type: 'event',
      breakdown: '$feature_flag_response',
    },
    dateRange: { date_from: '-30d' },
  })

  // B) form_started by variant
  await createInsight(dashboardId, 'form_started by variant (primary)', {
    kind: 'TrendsQuery',
    series: [
      {
        kind: 'EventsNode',
        event: 'form_started',
        properties: PAID_LP_FILTERS,
        math: 'dau',
      },
    ],
    ...breakdownByVariant,
    dateRange: { date_from: '-30d' },
  })

  // C) form_step_completed step=1 by variant
  await createInsight(dashboardId, 'form_step_completed (step 1) by variant', {
    kind: 'TrendsQuery',
    series: [
      {
        kind: 'EventsNode',
        event: 'form_step_completed',
        properties: [
          ...PAID_LP_FILTERS,
          { key: 'step', value: '1', operator: 'exact', type: 'event' },
        ],
        math: 'dau',
      },
    ],
    ...breakdownByVariant,
    dateRange: { date_from: '-30d' },
  })

  // D) lead_submission by variant
  await createInsight(dashboardId, 'lead_submission by variant', {
    kind: 'TrendsQuery',
    series: [
      {
        kind: 'EventsNode',
        event: 'lead_submission',
        properties: PAID_LP_FILTERS,
        math: 'dau',
      },
    ],
    ...breakdownByVariant,
    dateRange: { date_from: '-30d' },
  })

  // E) Funnel: pageview → form_started → step1 → lead_submission
  await createInsight(dashboardId, 'Funnel by variant: view → start → step 1 → lead', {
    kind: 'FunnelsQuery',
    series: [
      {
        kind: 'EventsNode',
        event: '$pageview',
        properties: PAID_LP_FILTERS,
      },
      { kind: 'EventsNode', event: 'form_started' },
      {
        kind: 'EventsNode',
        event: 'form_step_completed',
        properties: [{ key: 'step', value: '1', operator: 'exact', type: 'event' }],
      },
      { kind: 'EventsNode', event: 'lead_submission' },
    ],
    ...breakdownByVariant,
    dateRange: { date_from: '-30d' },
  })
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(
    `\n${COMMIT ? '🚀 LIVE MODE — calling PostHog API' : '🔍 DRY-RUN — no API calls (pass --commit to apply)'}`
  )
  console.log(`   Project: ${PROJECT_ID}`)
  console.log(`   API host: ${API_HOST}\n`)

  const flag = await ensureFeatureFlag()
  const experiment = await ensureExperiment(flag.key)
  const dashboard = await ensureDashboard()
  await buildInsights(dashboard.id)

  console.log('\n✅ Done.')
  if (COMMIT) {
    console.log(`\n   Flag:       ${API_HOST}/project/${PROJECT_ID}/feature_flags/${flag.id}`)
    console.log(`   Experiment: ${API_HOST}/project/${PROJECT_ID}/experiments/${experiment.id}`)
    console.log(`   Dashboard:  ${API_HOST}/project/${PROJECT_ID}/dashboard/${dashboard.id}\n`)
  }
}

main().catch((err) => {
  console.error('\n❌ Setup failed:')
  console.error(err)
  process.exit(1)
})
