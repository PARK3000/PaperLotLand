import { siteConfig } from '@/lib/config'

interface ComparisonRow {
  feature: string
  traditional: string
  ourWay: string
}

// Default comparison data - customize based on business type
const defaultComparisonData: ComparisonRow[] = [
  {
    feature: 'Speed of Service',
    traditional: 'Can take weeks or months',
    ourWay: 'Fast turnaround',
  },
  {
    feature: 'Pricing',
    traditional: 'Hidden fees and surprises',
    ourWay: 'Transparent pricing',
  },
  {
    feature: 'Customer Support',
    traditional: 'Call centers and hold times',
    ourWay: 'Direct access to our team',
  },
  {
    feature: 'Quality',
    traditional: 'Varies by provider',
    ourWay: 'Consistent excellence',
  },
  {
    feature: 'Flexibility',
    traditional: 'Rigid processes',
    ourWay: 'Tailored to your needs',
  },
]

interface ComparisonTableProps {
  title?: string
  subtitle?: string
  data?: ComparisonRow[]
  traditionalLabel?: string
  ourLabel?: string
}

export function ComparisonTable({
  title = 'Why Choose Us?',
  subtitle = 'See how we compare to traditional options.',
  data = defaultComparisonData,
  traditionalLabel = 'Traditional',
  ourLabel = 'Our Way',
}: ComparisonTableProps) {
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

        <div className="mt-12 overflow-hidden rounded-xl border border-[var(--color-border)] shadow-lg">
          {/* Table header */}
          <div className="grid grid-cols-3 bg-[var(--color-primary)]">
            <div className="p-4 text-center font-semibold text-white md:p-6">
              Feature
            </div>
            <div className="border-l border-white/20 p-4 text-center font-semibold text-white md:p-6">
              {traditionalLabel}
            </div>
            <div className="border-l border-white/20 bg-[var(--color-accent)] p-4 text-center font-semibold text-white md:p-6">
              {ourLabel}
            </div>
          </div>

          {/* Table body */}
          {data.map((row, index) => (
            <div
              key={index}
              className={`grid grid-cols-3 ${
                index % 2 === 0 ? 'bg-white' : 'bg-[var(--color-background-alt)]'
              }`}
            >
              <div className="flex items-center p-4 text-sm font-medium text-[var(--color-text)] md:p-6 md:text-base">
                {row.feature}
              </div>
              <div className="flex items-center justify-center border-l border-[var(--color-border)] p-4 text-center text-sm text-[var(--color-text-muted)] md:p-6 md:text-base">
                <span className="flex items-center gap-2">
                  <svg
                    className="h-5 w-5 flex-shrink-0 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  {row.traditional}
                </span>
              </div>
              <div className="flex items-center justify-center border-l border-[var(--color-border)] bg-[var(--color-success-light)]/50 p-4 text-center text-sm font-medium text-[var(--color-text)] md:p-6 md:text-base">
                <span className="flex items-center gap-2">
                  <svg
                    className="h-5 w-5 flex-shrink-0 text-[var(--color-success)]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {row.ourWay}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
