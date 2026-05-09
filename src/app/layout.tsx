import type { Metadata } from 'next'
import { Manrope } from 'next/font/google'
import '@/styles/globals.css'
import { OrganizationSchema } from '@/components/seo/organization-schema'
import { WebSiteSchema } from '@/components/seo/website-schema'
import { PostHogInit } from '@/components/posthog-init'
import { Suspense } from 'react'
import { DeferredGTM } from '@/components/deferred-gtm'
import { TrackingInit } from '@/lib/leads/tracking-init'
import { Analytics } from '@vercel/analytics/next'
import { siteConfig } from '@/lib/config'
import { ScrollReset } from '@/components/scroll-reset'

const manrope = Manrope({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-manrope',
  weight: ['400', '500', '600', '700'],
  adjustFontFallback: true,
})

export const metadata: Metadata = {
  title: {
    default: siteConfig.seo.defaultTitle,
    template: siteConfig.seo.titleTemplate,
  },
  description: siteConfig.seo.defaultDescription,
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  ),
  authors: [{ name: siteConfig.siteName }],
  creator: siteConfig.siteName,
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: siteConfig.siteName,
    title: siteConfig.seo.defaultTitle,
    description: siteConfig.seo.defaultDescription,
    images: [
      {
        url: siteConfig.seo.ogImage,
        width: 1200,
        height: 630,
        alt: siteConfig.siteName,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.seo.defaultTitle,
    description: siteConfig.seo.defaultDescription,
    images: [siteConfig.seo.ogImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: siteConfig.siteUrl,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={manrope.variable}>
      <head>
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://www.google-analytics.com" />
        <link
          rel="preload"
          as="image"
          href="/images/hero/hero-bg.jpg"
          fetchPriority="high"
        />
        <OrganizationSchema />
        <WebSiteSchema />
      </head>
      <body className="min-h-screen bg-white font-[family-name:var(--font-manrope)] antialiased">
        <Suspense fallback={null}>
          <PostHogInit />
        </Suspense>
        <ScrollReset />
        <DeferredGTM />
        <TrackingInit />
        {children}
        <Analytics />
      </body>
    </html>
  )
}
