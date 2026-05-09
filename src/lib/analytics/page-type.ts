// Page-type segmentation. Used to break down analytics events by section
// without per-URL filters in dashboards. Pure function — order-sensitive.
//
// See docs/POSTHOG-EVENTS.md for the canonical list and how to extend it.

import type { PageType } from './events'

const SITUATION_PATHS = new Set([
  '/need-to-downsize',
  '/facing-bankruptcy',
  '/stop-a-foreclosure',
  '/going-through-a-divorce',
  '/fire-damaged-home',
  '/code-violations',
  '/house-full-of-trash',
  '/house-that-needs-repairs',
  '/late-on-mortgage-payments',
  '/family-matters',
  '/need-to-sell-an-inherited-house',
  '/relocating',
  '/how-to-avoid-foreclosure-las-vegas',
])

const LOCATION_PATHS = new Set([
  '/henderson',
  '/we-buy-houses-summerlin',
  '/we-buy-houses-boulder-city',
  '/we-buy-houses-pahrump',
  '/we-buy-houses-whitney',
  '/sell-my-mobile-home-las-vegas',
  '/selling-my-house-in-las-vegas-for-cash',
])

const LANDING_PATHS = new Set([
  '/get-your-cash-today',
  '/sell-my-house-fast',
  '/buying-a-home',
  '/selling-a-home',
  '/sell-your-house',
  '/vs-realtor',
])

function normalize(pathname: string): string {
  if (!pathname) return '/'
  // Strip query string + trailing slash (except root)
  const path = pathname.split('?')[0].replace(/\/$/, '') || '/'
  return path
}

export function getPageType(pathname: string): PageType {
  const path = normalize(pathname)

  if (path === '/') return 'home'
  if (path.startsWith('/lp/') || path === '/lp') return 'lp'
  if (path.startsWith('/blog')) return 'blog'
  if (path.startsWith('/case-study-') || path.startsWith('/case-studies'))
    return 'case_study'
  if (SITUATION_PATHS.has(path)) return 'situation'
  if (LOCATION_PATHS.has(path) || path.startsWith('/locations'))
    return 'location'
  if (LANDING_PATHS.has(path)) return 'landing'
  return 'other'
}
