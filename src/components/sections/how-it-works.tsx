import Link from 'next/link'
import { buttonClassName } from '@/components/ui/button'
import { PROCESS_STEPS } from '@/lib/constants'

export function HowItWorks() {
  return (
    <section className="section-padding bg-[var(--color-background-alt)]">
      <div className="container-custom">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-[var(--color-text)] md:text-4xl">
            Simple 3-Step Process
          </h2>
          <p className="mt-4 text-lg text-[var(--color-text-muted)]">
            We make selling your house easy. Most homeowners go from first call to cash in hand in under 14 days.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative mt-16">
          {/* Connection line - desktop */}
          <div className="absolute left-0 right-0 top-16 hidden h-1 bg-[var(--color-primary-100)] lg:block" />

          <div className="grid gap-8 md:grid-cols-3">
            {PROCESS_STEPS.map((step, index) => (
              <div key={step.number} className="relative text-center">
                {/* Step number circle */}
                <div className="relative mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary)] text-xl font-bold text-white shadow-lg">
                  {step.number}
                  {/* Connector dot on desktop */}
                  {index < PROCESS_STEPS.length - 1 && (
                    <div className="absolute -right-4 top-1/2 hidden h-2 w-2 -translate-y-1/2 rounded-full bg-[var(--color-primary)] lg:block" />
                  )}
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold text-[var(--color-text)]">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="mb-4 text-[var(--color-text-muted)]">
            Ready to get your free cash offer?
          </p>
          <Link
            href="/get-your-cash-today/"
            className={buttonClassName({ variant: 'accent', size: 'xl' })}
          >
            Get My Free Cash Offer
          </Link>
        </div>
      </div>
    </section>
  )
}
