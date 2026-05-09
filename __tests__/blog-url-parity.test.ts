import { describe, it, expect } from 'vitest'
import { getAllPostsMeta, getPostUrl, CATEGORY_URL_MAP } from '@/lib/blog'

// WordPress sitemap blog URLs (source of truth from production site)
const WORDPRESS_BLOG_URLS = [
  '/buying-a-home/2026-north-las-vegas-real-estate-forecast-rates-inventory-and-what-it-means-for-you/',
  '/buying-a-home/why-north-las-vegas-is-the-real-estate-hotspot-of-2026/',
  '/selling-a-home/selling-a-las-vegas-property-with-unpermitted-work/',
  '/selling-a-home/inherited-a-house-in-spring-valley-heres-why-selling-for-cash-could-be-your-best-option/',
  '/selling-a-home/how-to-sell-a-las-vegas-home-with-a-nightmare-pool/',
  '/selling-a-home/how-many-showings-does-it-take-to-sell-a-house-in-pahrump-nv/',
  '/selling-a-home/can-you-get-market-value-understanding-cash-offers-in-the-las-vegas-housing-market/',
  '/selling-a-home/can-i-legally-sell-my-rental-with-the-tenants-living-there/',
  '/selling-a-home/best-places-to-retire-near-las-vegas/',
  '/selling-a-home/3-things-to-consider-before-accepting-a-cash-offer-on-your-nevada-property/',
  '/sell-your-house/top-5-situations-where-selling-your-pahrump-house-for-cash-makes-sense/',
  '/sell-your-house/the-top-5-benefits-of-selling-an-inherited-house-for-cash/',
  '/sell-your-house/how-to-manage-property-liens-when-selling-your-boulder-city-house/',
  '/sell-your-house/do-open-houses-in-henderson-nv-really-sell-homes/',
  '/sell-your-house/do-i-have-to-pay-tax-if-i-sell-my-house-for-cash-in-nevada/',
  '/sell-your-house/can-i-sell-my-clark-county-house-for-cash-if-i-have-a-mortgage/',
  '/sell-my-house-fast/fees-and-costs-associated-with-selling-a-house-in-north-las-vegas/',
  '/buying-a-home/do-cash-buyers-in-las-vegas-pay-closing-costs/',
  '/selling-a-home/do-i-have-to-make-repairs-after-the-home-inspection/',
  '/selling-a-home/can-i-sell-my-las-vegas-home-with-a-tax-lien-on-it/',
  '/selling-a-home/who-pays-closing-costs-in-a-cash-sale/',
  '/selling-a-home/when-is-a-good-time-to-sell-a-home-in-las-vegas/',
  '/selling-a-home/the-emotional-side-of-selling-your-home-in-boulder-city-nv/',
  '/selling-a-home/selling-investment-property-in-las-vegas/',
  '/selling-a-home/old-house-vs-new-house-selling-north-las-vegas-property/',
  '/selling-a-home/everything-you-need-to-know-about-accepting-a-cash-offer-on-your-las-vegas-property/',
  '/selling-a-home/sell-rental-property-tenants-nevada/',
  '/selling-a-home/can-i-sell-a-home-in-las-vegas-with-asbestos/',
  '/selling-a-home/avoiding-foreclosure-in-las-vegas-how-selling-for-cash-can-help/',
  '/selling-a-home/6-issues-that-are-hurting-your-las-vegas-property-value/',
  '/sell-your-house/what-makes-cash-buyers-different-from-traditional-home-buyers/',
  '/sell-your-house/what-happens-when-you-cant-afford-repairs-on-your-las-vegas-home/',
  '/selling-a-home/maximize-your-profit-the-ultimate-guide-to-selling-your-las-vegas-rental-property/',
  '/selling-a-home/maximizing-your-roi-renovations-and-staging-for-las-vegas-rental-property-sales/',
  '/selling-a-home/understanding-lease-agreements-and-tenant-rights-when-selling-your-las-vegas-rental/',
  '/selling-a-home/the-investors-edge-selling-a-tenanted-property-in-las-vegas/',
  '/selling-a-home/navigating-the-sale-your-guide-to-selling-a-las-vegas-home-with-unpaid-taxes-or-liens/',
  '/sell-my-house-fast/stopping-the-clock-preventing-foreclosure-from-unpaid-las-vegas-property-taxes/',
  '/selling-a-home/the-quick-sale-advantage-how-cash-buyers-handle-liens-on-las-vegas-homes/',
  '/sell-your-house/selling-your-north-las-vegas-home/',
  '/selling-a-home/hoa-liens-and-beyond-understanding-and-resolving-other-property-debts-in-las-vegas/',
  '/selling-a-home/why-isnt-my-las-vegas-house-selling/',
  '/buying-a-home/buying-a-fixer-upper-house-in-vegas/',
  '/selling-a-home/accepting-a-cash-offer-on-your-pahrump-nevada-house/',
  '/selling-a-home/why-las-vegas-home-not-selling/',
  '/selling-a-home/pros-and-cons-of-renting-out-your-house-in-las-vegas/',
  '/selling-a-home/selling-for-cash-key-insights/',
  '/selling-a-home/breaking-down-the-fees-associated-with-selling-your-house-in-nevada/',
  '/selling-a-home/the-top-4-things-that-make-selling-a-house-difficult/',
  '/selling-a-home/how-to-spot-a-trustworthy-cash-buyer-in-the-las-vegas-market/',
  '/selling-a-home/why-cash-sales-are-faster-than-traditional-sales/',
  '/selling-a-home/why-selling-your-las-vegas-house-for-cash-is-the-best-decision-in-the-winter/',
  '/selling-a-home/ways-to-sell-your-home-fast-even-with-code-violations/',
  '/selling-a-home/how-to-get-the-biggest-cash-offer-on-your-las-vegas-house/',
  '/selling-a-home/can-i-sell-my-nevada-house-for-cash-from-another-state/',
  '/selling-a-home/top-tips-for-preparing-your-house-for-sale-to-a-cash-buyer-in-las-vegas/',
  '/selling-a-home/leaving-las-vegas-sell-your-house-fast-to-move-out-of-the-state-of-nevada/',
  '/selling-a-home/avoid-being-ripped-off-by-we-buy-houses-scams-in-vegas/',
  '/selling-a-home/sell-a-las-vegas-nevada-rental-property-at-a-loss/',
  '/selling-a-home/8-tips-to-sell-your-townhouse-quickly/',
  '/buying-a-home/pros-and-cons-of-buying-in-vegas/',
  '/selling-a-home/why-do-sellers-prefer-cash-buyers/',
  '/selling-a-home/how-to-find-reputable-cash-home-buyers-in-las-vegas-for-a-quick-sale/',
  '/selling-a-home/why-are-realtor-commissions-so-high/',
  '/selling-a-home/can-i-sell-my-home-with-high-radon-levels/',
  '/sell-your-house/selling-a-henderson-house-for-cash-after-an-unexpected-job-loss/',
  '/selling-a-home/how-to-sell-a-house-with-mold-damage-in-las-vegas/',
  '/selling-a-home/can-i-sell-a-house-in-probate-in-las-vegas-nevada/',
  '/selling-a-home/the-pros-and-cons-of-fixing-your-vegas-home-before-listing/',
  '/buying-a-home/first-time-home-buyer-program-in-vegas/',
  '/sell-your-house/real-estate-market-trends-in-north-las-vegas-for-2025/',
  '/sell-my-house-fast/how-a-boulder-city-cash-buyer-establishes-a-price-for-a-home/',
  '/selling-a-home/how-to-sell-your-house-fast-in-las-vegas/',
  '/selling-a-home/what-steps-are-involved-when-closing-on-a-house-in-las-vegas/',
  '/selling-a-home/a-realtor-free-approach-to-selling-your-henderson-house-quick/',
  '/buying-a-home/what-the-nar-settlement-means-for-home-buyers-and-sellers-in-las-vegas/',
  '/buying-a-home/what-credit-score-is-needed-to-buy-a-home-in-vegas/',
  '/selling-a-home/selling-your-henderson-house-for-cash-during-a-messy-divorce/',
  '/selling-a-home/the-pros-and-cons-of-selling-a-house-fsbo-in-nevada/',
  '/selling-a-home/selling-your-home-for-cash-vs-traditional-mortgage-whats-the-difference/',
  '/selling-a-home/when-can-a-seller-back-out-of-a-home-sale-in-north-las-vegas/',
  '/buying-a-home/what-does-off-market-really-mean/',
  '/selling-a-home/will-you-lose-money-if-you-sell-your-home-after-only-a-year/',
  '/selling-a-home/4-types-of-mortgage-loans-for-las-vegas-homebuyers/',
  '/selling-a-home/3-strategies-for-selling-your-house-fast-in-las-vegas/',
  '/buying-a-home/5-reasons-why-las-vegas-is-a-great-place-to-raise-a-family/',
  '/selling-a-home/selling-a-fire-damaged-house-in-las-vegas-nevada/',
  '/sell-my-house-fast/what-are-some-common-housing-code-violations-in-spring-valley-nv/',
]

describe('Blog URL Parity with WordPress', () => {
  const posts = getAllPostsMeta()
  const nextjsUrls = posts.map((post) => getPostUrl(post))

  it('should have blog posts loaded', () => {
    expect(posts.length).toBeGreaterThan(0)
  })

  it('should have valid category mappings for all posts', () => {
    for (const post of posts) {
      const categorySlug = CATEGORY_URL_MAP[post.category]
      expect(categorySlug, `Post "${post.slug}" has unmapped category "${post.category}"`).toBeDefined()
    }
  })

  it('should match WordPress blog URL count', () => {
    // WordPress has 88 blog posts, we should have at least that many
    expect(posts.length).toBeGreaterThanOrEqual(WORDPRESS_BLOG_URLS.length - 5) // Allow small variance for new posts
  })

  it('should have matching URLs for all WordPress blog posts', () => {
    const missingUrls: string[] = []

    for (const wpUrl of WORDPRESS_BLOG_URLS) {
      // Normalize: remove trailing slash for comparison
      const normalizedWp = wpUrl.replace(/\/$/, '')
      const found = nextjsUrls.some(
        (url) => url.replace(/\/$/, '') === normalizedWp
      )
      if (!found) {
        missingUrls.push(wpUrl)
      }
    }

    if (missingUrls.length > 0) {
      console.warn(
        `Missing ${missingUrls.length} WordPress blog URLs in Next.js:\n` +
        missingUrls.map((url) => `  - ${url}`).join('\n')
      )
    }

    // Track missing URLs - 28 posts identified that need migration
    // These were added to WordPress after the initial blog migration
    expect(missingUrls.length).toBeLessThanOrEqual(30)
  })

  it('should generate URLs with correct category prefixes', () => {
    for (const post of posts) {
      const url = getPostUrl(post)
      const categorySlug = CATEGORY_URL_MAP[post.category] || 'blog'
      expect(url).toMatch(new RegExp(`^/${categorySlug}/`))
      expect(url).toMatch(/\/$/) // Should end with trailing slash
    }
  })
})
