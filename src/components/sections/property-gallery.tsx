'use client'

import Image from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface GalleryItem {
  src: string
  alt: string
  caption?: string
}

const defaultGalleryItems: GalleryItem[] = [
  {
    src: '/images/properties/property-1.webp',
    alt: 'Las Vegas home purchased for cash',
    caption: 'Closed in 10 days — no repairs needed',
  },
  {
    src: '/images/properties/property-2.webp',
    alt: 'Cash home purchase in Henderson',
    caption: 'As-is purchase — seller walked away stress-free',
  },
  {
    src: '/images/properties/property-3.jpg',
    alt: 'Fast cash sale in Summerlin',
    caption: 'Fair cash offer accepted same week',
  },
]

interface Stat {
  number: string
  label: string
}

const defaultStats: Stat[] = [
  { number: '100+', label: 'Projects Completed' },
  { number: '5.0', label: 'Average Rating' },
  { number: '10+', label: 'Years Experience' },
  { number: '100%', label: 'Satisfaction Rate' },
]

interface PortfolioGalleryProps {
  title?: string
  subtitle?: string
  items?: GalleryItem[]
  stats?: Stat[]
  showStats?: boolean
}

export function PropertyGallery({
  title = 'Our Work',
  subtitle = 'See examples of our quality work and satisfied customers.',
  items = defaultGalleryItems,
  stats = defaultStats,
  showStats = true,
}: PortfolioGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  // Show placeholder if no real images
  const hasImages = items.length > 0 && !items[0].src.includes('placeholder')

  if (!hasImages) {
    return (
      <section className="section-padding bg-[var(--color-background-alt)]">
        <div className="container-custom">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold text-[var(--color-primary)] md:text-4xl">
              {title}
            </h2>
            <p className="mt-4 text-lg text-[var(--color-text-muted)]">
              {subtitle}
            </p>
          </div>
          <div className="mt-10 rounded-xl border-2 border-dashed border-[var(--color-border)] bg-white p-12 text-center">
            <p className="text-[var(--color-text-muted)]">
              Gallery images will be populated after scraping the target website.
            </p>
          </div>
          {showStats && (
            <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
              {stats.map((stat, index) => (
                <StatCard key={index} number={stat.number} label={stat.label} />
              ))}
            </div>
          )}
        </div>
      </section>
    )
  }

  return (
    <section className="section-padding bg-[var(--color-background-alt)]">
      <div className="container-custom">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-[var(--color-primary)] md:text-4xl">
            {title}
          </h2>
          <p className="mt-4 text-lg text-[var(--color-text-muted)]">
            {subtitle}
          </p>
        </div>

        {/* Main Image */}
        <div className="relative mx-auto mt-10 max-w-4xl">
          <div className="relative aspect-[16/10] overflow-hidden rounded-2xl shadow-xl">
            <Image
              src={items[activeIndex].src}
              alt={items[activeIndex].alt}
              fill
              className="object-cover transition-opacity duration-300"
              sizes="(max-width: 768px) 100vw, 896px"
            />
            {items[activeIndex].caption && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                <p className="text-lg font-semibold text-white">
                  {items[activeIndex].caption}
                </p>
              </div>
            )}
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={() => setActiveIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1))}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg transition-all hover:bg-white hover:scale-110"
            aria-label="Previous image"
          >
            <ChevronLeftIcon className="h-6 w-6 text-[var(--color-primary)]" />
          </button>
          <button
            onClick={() => setActiveIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1))}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg transition-all hover:bg-white hover:scale-110"
            aria-label="Next image"
          >
            <ChevronRightIcon className="h-6 w-6 text-[var(--color-primary)]" />
          </button>
        </div>

        {/* Thumbnail Navigation */}
        <div className="mt-6 flex justify-center gap-3">
          {items.map((item, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={cn(
                'relative h-16 w-24 overflow-hidden rounded-lg transition-all',
                activeIndex === index
                  ? 'ring-2 ring-[var(--color-secondary)] ring-offset-2'
                  : 'opacity-60 hover:opacity-100'
              )}
              aria-label={`View ${item.alt}`}
            >
              <Image
                src={item.src}
                alt={item.alt}
                fill
                className="object-cover"
                sizes="96px"
              />
            </button>
          ))}
        </div>

        {/* Stats */}
        {showStats && (
          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
            {stats.map((stat, index) => (
              <StatCard key={index} number={stat.number} label={stat.label} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div className="rounded-xl bg-white p-4 text-center shadow-sm">
      <p className="text-2xl font-bold text-[var(--color-secondary)]">{number}</p>
      <p className="text-sm text-[var(--color-text-muted)]">{label}</p>
    </div>
  )
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  )
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )
}
