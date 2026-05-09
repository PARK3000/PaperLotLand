/**
 * Pings the IndexNow API to notify Bing, Yandex, and other participating
 * search engines that our citation-priority pages have been updated.
 *
 * IndexNow is one shared endpoint — submitting once notifies all participants.
 * Google does NOT participate (they use sitemaps + Google-Extended); coverage
 * here mainly accelerates Bing Copilot, ChatGPT search (Bing-backed), and Yandex.
 *
 * Runs as a `postbuild` step so it fires on every successful Vercel deploy.
 * Skips silently in non-production environments and when INDEXNOW_KEY is unset.
 */

const HOST = 'webuyanyvegashouse.com'
const SITE_URL = `https://${HOST}`

// Submit only the citation-priority pages + homepage. The rest of the site is
// already well-indexed; targeted pings keep our signal-to-noise high.
const PRIORITY_URLS = [
  '/',
  '/sell-my-house-fast-las-vegas-options-2026/',
  '/best-cash-home-buyers-las-vegas/',
  '/las-vegas-home-sale-timeline-and-cost-calculator/',
  '/nevada-foreclosure-timeline/',
  '/inherited-house-las-vegas-probate-process/',
  '/divorce-home-sale-nevada-process/',
  '/house-needs-repairs-las-vegas-options/',
  '/cash-offer-vs-realtor-net-proceeds-las-vegas/',
]

async function main() {
  const key = process.env.INDEXNOW_KEY
  const env = process.env.VERCEL_ENV || process.env.NODE_ENV

  if (!key) {
    console.log('[indexnow] INDEXNOW_KEY not set — skipping ping')
    return
  }

  // Only ping on production deploys. Skip preview/development to avoid noisy submissions.
  if (env !== 'production') {
    console.log(`[indexnow] env=${env || 'unknown'} — skipping ping (production only)`)
    return
  }

  const body = {
    host: HOST,
    key,
    keyLocation: `${SITE_URL}/${key}.txt`,
    urlList: PRIORITY_URLS.map((u) => `${SITE_URL}${u}`),
  }

  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      console.log(
        `[indexnow] OK (${res.status}) — submitted ${body.urlList.length} URLs`,
      )
    } else {
      const text = await res.text().catch(() => '')
      console.warn(
        `[indexnow] non-OK response: ${res.status} ${res.statusText} ${text}`,
      )
    }
  } catch (err) {
    // Never fail the build on a ping error — IndexNow is best-effort.
    console.warn('[indexnow] ping failed:', err instanceof Error ? err.message : err)
  }
}

main()
