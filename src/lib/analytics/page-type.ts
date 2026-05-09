// Page-type segmentation. Used to break down analytics events by section
// without per-URL filters in dashboards. Pure function — order-sensitive.
//
// See docs/POSTHOG-EVENTS.md for the canonical list and how to extend it.

import type { PageType } from './events'

const SITUATION_PATHS = new Set([
  '/sell-land',
  '/buy-land',
])

const LOCATION_PATHS = new Set([
  '/resources/henderson',
  '/resources/north-las-vegas',
  '/resources/boulder-city',
  '/resources/clark-county',
  '/resources/las-vegas',
])

const LANDING_PATHS = new Set([
  '/off-market-deals',
  '/available-lots',
  '/closed-sales',
  '/resources',
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
