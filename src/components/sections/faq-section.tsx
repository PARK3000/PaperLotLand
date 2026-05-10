'use client'

import { useState } from 'react'
import Link from 'next/link'
import { buttonClassName } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { BUSINESS } from '@/lib/constants'
import type { FAQItem } from '@/lib/site-content'
import { FAQBody } from '@/components/sections/faq-body'

const defaultFAQs: FAQItem[] = []

interface FAQSectionProps {
  title?: string
  subtitle?: string
  faqs?: FAQItem[]
  showCTA?: boolean
}

export function FAQSection({
  title = 'Frequently Asked Questions',
  subtitle = 'Get answers to common questions about our services.',
  faqs = defaultFAQs,
  showCTA = true,
}: FAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section className="section-padding">
      <div className="container-custom">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-[var(--color-text)] md:text-4xl">
            {title}
          </h2>
          <p className="mt-4 text-lg text-[var(--color-text-muted)]">
            {subtitle}
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-3xl">
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-white"
              >
                <h3 className="m-0">
                  <button
                    onClick={() =>
                      setOpenIndex(openIndex === index ? null : index)
                    }
                    className="flex w-full items-center justify-between p-6 text-left"
                    aria-expanded={openIndex === index}
                  >
                    <span className="pr-4 text-lg font-semibold text-[var(--color-text)]">
                      {faq.question}
                    </span>
                    <span
                      className={cn(
                        'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-50)] text-[var(--color-primary)] transition-transform',
                        openIndex === index && 'rotate-180'
                      )}
                    >
                      <ChevronIcon className="h-5 w-5" />
                    </span>
                  </button>
                </h3>
                <div
                  className={cn(
                    'grid transition-all duration-300 ease-in-out',
                    openIndex === index
                      ? 'grid-rows-[1fr] opacity-100'
                      : 'grid-rows-[0fr] opacity-0'
                  )}
                >
                  <div className="overflow-hidden">
                    <div className="px-6 pb-6">
                      <FAQBody faq={faq} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        {showCTA && (
          <div className="mx-auto mt-12 max-w-xl rounded-xl bg-[var(--color-primary-50)] p-8 text-center">
            <h3 className="text-xl font-bold text-[var(--color-text)]">
              Still have questions?
            </h3>
            <p className="mt-2 text-[var(--color-text-muted)]">
              Call us at{' '}
              <a
                href={`tel:${BUSINESS.phone}`}
                className="font-semibold text-[var(--color-primary)]"
              >
                {BUSINESS.phoneDisplay}
              </a>{' '}
              or contact us online.
            </p>
            <div className="mt-4">
              <Link
                href="/contact/"
                className={buttonClassName({ variant: 'primary', size: 'lg' })}
              >
                Contact Us
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}
