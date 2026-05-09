'use client'

import { useState } from 'react'

const COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#06b6d4', '#94a3b8']

export function TopPagesChart({ pages }: { pages: { page: string; count: number }[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const total = pages.reduce((a, b) => a + b.count, 0)

  let cumulative = 0
  const segments = pages.map((p, i) => {
    const pct = total > 0 ? (p.count / total) * 100 : 0
    const start = cumulative
    cumulative += pct
    return { ...p, pct, start, end: cumulative, color: COLORS[i % COLORS.length] }
  })

  const gradientStops = segments
    .map((s, i) => {
      const dimmed = activeIndex !== null && activeIndex !== i
      const color = dimmed ? `${s.color}30` : s.color
      return `${color} ${s.start}% ${s.end}%`
    })
    .join(', ')

  const active = activeIndex !== null ? segments[activeIndex] : null

  return (
    <div className="bg-white border border-gray-200/80 rounded-2xl p-5 h-full">
      <h2 className="text-sm font-semibold text-gray-900 mb-4">Top Converting Pages</h2>
      {pages.length === 0 ? (
        <p className="text-sm text-gray-400 py-4 text-center">No lead data yet</p>
      ) : (
        <div className="flex flex-col items-center gap-4">
          {/* Donut */}
          <div className="relative shrink-0">
            <div
              className="w-36 h-36 rounded-full transition-all duration-300"
              style={{ background: `conic-gradient(${gradientStops})` }}
            >
              <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center">
                <div className="text-center px-2">
                  {active ? (
                    <>
                      <p className="text-xl font-bold leading-none" style={{ color: active.color }}>
                        {active.count}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{Math.round(active.pct)}%</p>
                    </>
                  ) : (
                    <>
                      <p className="text-xl font-bold text-gray-900 leading-none">{total}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">leads</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Legend — fully static layout, tooltip overlay for full name */}
          <div className="w-full space-y-0.5">
            {segments.map((s, i) => (
              <div
                key={i}
                className="group relative flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-default hover:bg-gray-50"
                onMouseEnter={() => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: s.color }}
                />
                <span className="text-xs text-gray-600 flex-1 min-w-0 truncate">
                  {s.page}
                </span>
                <span className="text-xs font-semibold text-gray-900 tabular-nums shrink-0">{s.count}</span>
                <span className="text-[10px] text-gray-400 w-8 text-right tabular-nums shrink-0">
                  {Math.round(s.pct)}%
                </span>

                {/* Tooltip overlay — like HelpTooltip */}
                <div className="absolute left-0 bottom-full mb-1 z-50 w-full max-w-[280px] px-3 py-2 bg-gray-900 text-white text-xs leading-relaxed rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 pointer-events-none break-all">
                  <span className="font-semibold" style={{ color: s.color }}>{s.count} leads</span>
                  <span className="text-gray-400 mx-1.5">&middot;</span>
                  <span>{Math.round(s.pct)}%</span>
                  <div className="text-gray-300 mt-0.5">{s.page}</div>
                  <div className="absolute left-4 -bottom-1 w-2 h-2 bg-gray-900 rotate-45" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
