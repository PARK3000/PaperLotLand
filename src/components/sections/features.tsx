import { cn } from '@/lib/utils'

interface Feature {
  title: string
  description: string
  icon?: React.ReactNode
}

interface FeaturesProps {
  headline?: string
  subheadline?: string
  features: Feature[]
  columns?: 2 | 3 | 4
  className?: string
}

export function Features({
  headline,
  subheadline,
  features,
  columns = 3,
  className,
}: FeaturesProps) {
  return (
    <section className={cn('px-4 py-24 sm:px-6 lg:px-8', className)}>
      <div className="mx-auto max-w-7xl">
        {(headline || subheadline) && (
          <div className="mx-auto max-w-2xl text-center">
            {headline && (
              <h2 className="text-3xl font-bold tracking-tight text-text sm:text-4xl">
                {headline}
              </h2>
            )}
            {subheadline && (
              <p className="mt-4 text-lg text-text-muted">{subheadline}</p>
            )}
          </div>
        )}

        <div
          className={cn('mt-16 grid gap-8', {
            'sm:grid-cols-2': columns === 2,
            'sm:grid-cols-2 lg:grid-cols-3': columns === 3,
            'sm:grid-cols-2 lg:grid-cols-4': columns === 4,
          })}
        >
          {features.map((feature, index) => (
            <div
              key={index}
              className="rounded-lg border border-border bg-surface p-6 transition-shadow hover:shadow-md"
            >
              {feature.icon && (
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {feature.icon}
                </div>
              )}
              <h3 className="text-lg font-semibold text-text">
                {feature.title}
              </h3>
              <p className="mt-2 text-text-muted">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
