'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { cn } from '@/lib/utils'

export interface TocItem {
  id: string
  text: string
  level: 2 | 3
}

interface TableOfContentsProps {
  items: TocItem[]
  variant?: 'sidebar' | 'mobile'
}

export function TableOfContents({ items, variant = 'sidebar' }: TableOfContentsProps) {
  const [activeIndex, setActiveIndex] = useState<number>(-1)
  const [isOpen, setIsOpen] = useState(false)
  const dotRefs = useRef<(HTMLSpanElement | null)[]>([])

  const handleClick = useCallback((id: string) => {
    const el = document.getElementById(id)
    if (el) {
      const offset = 80
      const top = el.getBoundingClientRect().top + window.scrollY - offset
      window.scrollTo({ top, behavior: 'smooth' })
      setIsOpen(false)
    }
  }, [])

  useEffect(() => {
    const headings = items
      .map((item) => document.getElementById(item.id))
      .filter(Boolean) as HTMLElement[]

    if (headings.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = items.findIndex((item) => item.id === entry.target.id)
            if (idx !== -1) setActiveIndex(idx)
          }
        })
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    )

    headings.forEach((h) => observer.observe(h))
    return () => observer.disconnect()
  }, [items])

  if (items.length < 2) return null

  // Mobile: collapsible dropdown
  if (variant === 'mobile') {
    return (
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex w-full items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-background-alt)] px-4 py-3 text-sm font-semibold text-[var(--color-text)]"
        >
          <span>Table of Contents</span>
          <svg
            className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isOpen && (
          <nav className="mt-2 rounded-lg border border-[var(--color-border)] bg-white p-4">
            <ul className="space-y-2">
              {items.map((item, idx) => (
                <li key={item.id}>
                  <button
                    onClick={() => handleClick(item.id)}
                    className={cn(
                      'block w-full text-left text-sm transition-colors hover:text-[var(--color-primary)]',
                      item.level === 3 && 'pl-4',
                      activeIndex === idx
                        ? 'font-medium text-[var(--color-primary)]'
                        : 'text-[var(--color-text-muted)]'
                    )}
                  >
                    {item.text}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    )
  }

  // Desktop: sidebar with blue vertical line + active dot
  return (
    <nav>
      <div className="relative pl-4">
        {/* Vertical track line */}
        <div className="absolute left-0 top-0 h-full w-0.5 bg-slate-200" />
        {/* Active indicator line — covers from top to active dot */}
        {activeIndex >= 0 && (
          <div
            className="absolute left-0 top-0 w-0.5 bg-[#3b82f6] transition-all duration-300"
            style={{
              height: dotRefs.current[activeIndex]
                ? dotRefs.current[activeIndex]!.offsetTop + 6
                : 0,
            }}
          />
        )}

        <ul className="space-y-0.5">
          {items.map((item, idx) => {
            const isPast = activeIndex >= 0 && idx < activeIndex
            const isActive = idx === activeIndex

            return (
              <li key={item.id} className={cn('relative', item.level === 3 && 'pl-4')}>
                {/* Dot on the track */}
                <span
                  ref={(el) => { dotRefs.current[idx] = el }}
                  className={cn(
                    'absolute -left-4 top-[0.6rem] h-2.5 w-2.5 -translate-x-[3px] rounded-full border-2 transition-all duration-200',
                    item.level === 3 && '-left-8',
                    isActive
                      ? 'border-[#3b82f6] bg-[#3b82f6] shadow-[0_0_0_3px_rgba(59,130,246,0.15)]'
                      : isPast
                      ? 'border-slate-300 bg-slate-300'
                      : 'border-slate-300 bg-white'
                  )}
                />
                <button
                  onClick={() => handleClick(item.id)}
                  className={cn(
                    'block w-full py-1.5 text-left text-sm transition-colors',
                    isActive
                      ? 'font-semibold text-[#3b82f6]'
                      : isPast
                      ? 'text-slate-400 hover:text-slate-600'
                      : 'text-slate-600 hover:text-[#3b82f6]'
                  )}
                >
                  {item.text}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
