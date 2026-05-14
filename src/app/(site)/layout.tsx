import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { MobileCTABar } from '@/components/layout/mobile-cta-bar'
import { getGeneralContent, getNavigationContent } from '@/lib/site-content'
import type { ReactNode } from 'react'

export const revalidate = 0

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const [general, navigation] = await Promise.all([
    getGeneralContent(),
    getNavigationContent(),
  ])
  return (
    <>
      <Header businessData={general} navigation={navigation} />
      <main>{children}</main>
      <Footer businessData={general} navigation={navigation} />
      <MobileCTABar />
    </>
  )
}
