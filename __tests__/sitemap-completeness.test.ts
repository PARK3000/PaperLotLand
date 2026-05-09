import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

// All pages that MUST exist in the sitemap (from WordPress sitemap + new pages)
const REQUIRED_PAGES = [
  // Core pages
  '/',
  '/contact-us/',
  '/team/',
  '/happy-sellers/',
  '/frequently-asked-questions/',
  '/get-your-cash-today/',
  '/selling-my-house-in-las-vegas-for-cash/',
  '/blog/',

  // Location pages
  '/henderson/',
  '/we-buy-houses-summerlin/',
  '/we-buy-houses-pahrump/',
  '/we-buy-houses-boulder-city/',
  '/we-buy-houses-whitney/',
  '/locations/',

  // Situation pages
  '/relocating/',
  '/how-to-avoid-foreclosure-las-vegas/',
  '/need-to-sell-an-inherited-house/',
  '/stop-a-foreclosure/',
  '/fire-damaged-home/',
  '/code-violations/',
  '/house-that-needs-repairs/',
  '/late-on-mortgage-payments/',
  '/house-full-of-trash/',
  '/family-matters/',
  '/need-to-downsize/',
  '/going-through-a-divorce/',
  '/facing-bankruptcy/',
  '/vs-realtor/',

  // Case studies (all 10)
  '/case-study-selling-a-las-vegas-home-from-colorado-no-repairs-needed/',
  '/case-study-selling-from-900-miles-away-how-mark-sold-his-inherited-vegas-home-in-11-days/',
  '/case-study-from-foreclosure-notice-to-cash-in-hand-in-14-days/',
  '/case-study-selling-a-hoarder-house-in-henderson/',
  '/case-study-how-we-helped-a-las-vegas-homeowner-overcome-divorce-and-financial-hardship/',
  '/case-study-how-we-buy-any-vegas-house-solved-a-complex-rental-property-sale-in-just-14-days/',
  '/case-study-how-one-las-vegas-family-escaped-stress-sold-their-home-fast-without-repairs-or-drama/',
  '/case-study-helping-navigate-a-difficult-inheritance-in-las-vegas/',
  '/case-study-from-squatters-to-sold-how-we-helped-a-vegas-family-sell-grandmas-home-fast/',
  '/case-study-fast-as-is-cash-sale-saves-landlords-thousands-and-eliminates-stress/',

  // Legal/misc
  '/privacy-policy/',
  '/careers/',
]

describe('Sitemap Completeness', () => {
  it('should have a sitemap.ts file', () => {
    const sitemapPath = path.join(process.cwd(), 'src/app/sitemap.ts')
    expect(fs.existsSync(sitemapPath)).toBe(true)
  })

  it('should reference all required pages in sitemap source', () => {
    const sitemapSource = fs.readFileSync(
      path.join(process.cwd(), 'src/app/sitemap.ts'),
      'utf-8'
    )

    const missingPages: string[] = []
    for (const page of REQUIRED_PAGES) {
      // Check if the page URL appears in the sitemap source
      // Remove leading/trailing slashes for flexible matching
      const slug = page.replace(/^\/|\/$/g, '')
      if (slug && !sitemapSource.includes(slug)) {
        missingPages.push(page)
      }
    }

    if (missingPages.length > 0) {
      console.warn(
        `Missing pages from sitemap:\n` +
        missingPages.map((p) => `  - ${p}`).join('\n')
      )
    }

    expect(missingPages).toEqual([])
  })
})

describe('Page Files Exist', () => {
  const appDir = path.join(process.cwd(), 'src/app')

  // Static pages that should have their own directory with page.tsx
  const STATIC_PAGE_DIRS = [
    'contact-us',
    'team',
    'happy-sellers',
    'frequently-asked-questions',
    'get-your-cash-today',
    'how-it-works',
    'locations',
    'privacy-policy',
    'careers',
    'henderson',
    'we-buy-houses-summerlin',
    'we-buy-houses-pahrump',
    'we-buy-houses-boulder-city',
    'relocating',
    'how-to-avoid-foreclosure-las-vegas',
    'need-to-sell-an-inherited-house',
    'stop-a-foreclosure',
    'fire-damaged-home',
    'code-violations',
    'house-that-needs-repairs',
    'late-on-mortgage-payments',
    'house-full-of-trash',
    'family-matters',
    'need-to-downsize',
    'going-through-a-divorce',
    'facing-bankruptcy',
    'case-study-from-foreclosure-notice-to-cash-in-hand-in-14-days',
    'case-study-selling-a-hoarder-house-in-henderson',
    'case-study-selling-a-las-vegas-home-from-colorado-no-repairs-needed',
    'case-study-selling-from-900-miles-away-how-mark-sold-his-inherited-vegas-home-in-11-days',
    'case-study-how-we-helped-a-las-vegas-homeowner-overcome-divorce-and-financial-hardship',
    'case-study-how-we-buy-any-vegas-house-solved-a-complex-rental-property-sale-in-just-14-days',
    'case-study-how-one-las-vegas-family-escaped-stress-sold-their-home-fast-without-repairs-or-drama',
    'case-study-helping-navigate-a-difficult-inheritance-in-las-vegas',
    'case-study-from-squatters-to-sold-how-we-helped-a-vegas-family-sell-grandmas-home-fast',
    'case-study-fast-as-is-cash-sale-saves-landlords-thousands-and-eliminates-stress',
  ]

  // Pages may live directly under src/app/ or inside the (site) route group.
  const ROUTE_ROOTS = ['', '(site)']

  for (const dir of STATIC_PAGE_DIRS) {
    it(`should have page file for /${dir}/`, () => {
      const found = ROUTE_ROOTS.some((root) =>
        fs.existsSync(path.join(appDir, root, dir, 'page.tsx'))
      )
      expect(
        found,
        `Missing: src/app/${dir}/page.tsx or src/app/(site)/${dir}/page.tsx`
      ).toBe(true)
    })
  }
})
