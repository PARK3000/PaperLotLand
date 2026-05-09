import { Metadata } from 'next'
import { siteConfig } from '@/lib/config'
import { BUSINESS } from '@/lib/constants'
import { LocalBusinessSchema } from '@/components/seo/local-business-schema'
import { LandLeadForm } from '@/components/sections/land-lead-form'

export const metadata: Metadata = {
  title: `Contact PaperLotLand | ${BUSINESS.phoneDisplay}`,
  description:
    'Contact PaperLotLand — the Las Vegas off-market land network. Call, email, or fill out the form to connect about land deals, GIS resources, or the developer network.',
  alternates: { canonical: siteConfig.siteUrl + '/contact/' },
  openGraph: {
    title: `Contact PaperLotLand | ${BUSINESS.phoneDisplay}`,
    description: 'Connect with PaperLotLand — the private land developer & broker network for the Las Vegas Valley.',
    url: siteConfig.siteUrl + '/contact/',
    type: 'website',
    images: [{ url: '/images/og-image.jpg', width: 1200, height: 630 }],
  },
}

export default function ContactPage() {
  return (
    <>
      <LocalBusinessSchema />

      <section className="bg-[#1C3550] py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Contact PaperLotLand</h1>
          <p className="text-xl text-slate-300">
            Have a deal? Looking for land? Just want to connect? Reach out below.
          </p>
        </div>
      </section>

      <section className="py-20 bg-slate-50">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

            {/* Contact Info */}
            <div>
              <h2 className="text-2xl font-bold text-[#1C3550] mb-6">Get in Touch</h2>
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="mt-0.5 h-10 w-10 rounded-full bg-[#C97D2E]/10 flex items-center justify-center text-[#C97D2E] text-lg shrink-0">📞</div>
                  <div>
                    <div className="font-semibold text-[#1C3550]">Phone</div>
                    <a href={`tel:${BUSINESS.phone}`} className="text-[#C97D2E] hover:underline">{BUSINESS.phoneDisplay}</a>
                    <div className="text-xs text-slate-400 mt-0.5">{BUSINESS.hours}</div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="mt-0.5 h-10 w-10 rounded-full bg-[#C97D2E]/10 flex items-center justify-center text-[#C97D2E] text-lg shrink-0">✉️</div>
                  <div>
                    <div className="font-semibold text-[#1C3550]">Email</div>
                    <a href={`mailto:${BUSINESS.email}`} className="text-[#C97D2E] hover:underline">{BUSINESS.email}</a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="mt-0.5 h-10 w-10 rounded-full bg-[#C97D2E]/10 flex items-center justify-center text-[#C97D2E] text-lg shrink-0">📍</div>
                  <div>
                    <div className="font-semibold text-[#1C3550]">Office</div>
                    <div className="text-slate-600 text-sm">
                      {BUSINESS.address}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-10 rounded-xl border border-slate-200 bg-white p-6">
                <h3 className="font-bold text-[#1C3550] mb-2">Looking to sell a parcel?</h3>
                <p className="text-sm text-slate-600">
                  We work with landowners who want to sell privately — no public listing, no sign on the lot. Call us directly for a quick conversation about your parcel.
                </p>
              </div>
              <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6">
                <h3 className="font-bold text-[#1C3550] mb-2">Looking to buy land?</h3>
                <p className="text-sm text-slate-600">
                  Submit your criteria through the form or call us. We&apos;ll match you to off-market parcels as they come available.
                </p>
              </div>
            </div>

            {/* Form */}
            <div>
              <LandLeadForm variant="full" heading="Send a Message" />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
