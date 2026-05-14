import type { NextConfig } from 'next'
import withBundleAnalyzer from '@next/bundle-analyzer'

const withAnalyze = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig: NextConfig = {
  trailingSlash: true,
  experimental: {},
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'paperlotland.com' },
      { protocol: 'https', hostname: '*.googleusercontent.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'maps.googleapis.com' },
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
    ],
  },
  async redirects() {
    return []
  },
  async headers() {
    const PAGE_CACHE = 'public, s-maxage=0, must-revalidate'
    const STATIC_CACHE = 'public, max-age=2592000, stale-while-revalidate=604800'
    return [
      { source: '/', headers: [{ key: 'Cache-Control', value: PAGE_CACHE }] },
      { source: '/about/', headers: [{ key: 'Cache-Control', value: PAGE_CACHE }] },
      { source: '/available-lots/', headers: [{ key: 'Cache-Control', value: PAGE_CACHE }] },
      { source: '/closed-sales/', headers: [{ key: 'Cache-Control', value: PAGE_CACHE }] },
      { source: '/off-market-deals/', headers: [{ key: 'Cache-Control', value: PAGE_CACHE }] },
      { source: '/resources/:path(.*)', headers: [{ key: 'Cache-Control', value: PAGE_CACHE }] },
      { source: '/blog/:path(.*)', headers: [{ key: 'Cache-Control', value: PAGE_CACHE }] },
      { source: '/images/:path(.*)', headers: [{ key: 'Cache-Control', value: STATIC_CACHE }] },
    ]
  },
}

export default withAnalyze(nextConfig)
