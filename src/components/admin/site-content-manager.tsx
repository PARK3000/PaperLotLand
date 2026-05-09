'use client'

import { useState } from 'react'
import type { AllSiteContent, SiteContentKey } from '@/lib/site-content'
import { GeneralForm } from './site-content/general-form'
import { HomepageForm } from './site-content/homepage-form'
import { NavigationForm } from './site-content/navigation-form'
import { SeoForm } from './site-content/seo-form'
import { FaqsForm } from './site-content/faqs-form'
import { TestimonialsForm } from './site-content/testimonials-form'

const TABS: { key: SiteContentKey; label: string }[] = [
  { key: 'general', label: 'General' },
  { key: 'homepage', label: 'Homepage' },
  { key: 'navigation', label: 'Navigation' },
  { key: 'seo_defaults', label: 'SEO' },
  { key: 'faqs', label: 'FAQs' },
  { key: 'testimonials', label: 'Testimonials' },
]

export function SiteContentManager({ initialContent }: { initialContent: AllSiteContent }) {
  const [activeTab, setActiveTab] = useState<SiteContentKey>('general')

  const section = initialContent[activeTab]

  return (
    <div>
      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-[#c3c4c7] mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
              activeTab === tab.key
                ? 'text-[#1d2327] border-b-2 border-[#2271b1] -mb-px'
                : 'text-[#646970] hover:text-[#1d2327]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Source indicator */}
      {section.source === 'db' && section.updatedAt && (
        <p className="text-xs text-[#646970] mb-4">
          Last saved {new Date(section.updatedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })}
        </p>
      )}

      {/* Section form */}
      <div className="bg-white border border-[#c3c4c7] rounded shadow-sm">
        {activeTab === 'general' && (
          <GeneralForm initialData={section.value} />
        )}
        {activeTab === 'homepage' && (
          <HomepageForm initialData={section.value} />
        )}
        {activeTab === 'navigation' && (
          <NavigationForm initialData={section.value} />
        )}
        {activeTab === 'seo_defaults' && (
          <SeoForm initialData={section.value} />
        )}
        {activeTab === 'faqs' && (
          <FaqsForm initialData={section.value} />
        )}
        {activeTab === 'testimonials' && (
          <TestimonialsForm initialData={section.value} />
        )}
      </div>
    </div>
  )
}
