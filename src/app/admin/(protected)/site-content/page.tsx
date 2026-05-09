import { getAllSiteContent } from '@/lib/site-content'
import { SiteContentManager } from '@/components/admin/site-content-manager'

export const dynamic = 'force-dynamic'

export default async function SiteContentPage() {
  const content = await getAllSiteContent()

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-5">
        <h1 className="text-[23px] font-normal text-[#1d2327] leading-tight">Site Content</h1>
        <p className="mt-1 text-sm text-[#646970]">
          Edit business info, homepage copy, navigation, SEO defaults, FAQs, and testimonials.
        </p>
      </div>
      <SiteContentManager initialContent={content} />
    </div>
  )
}
