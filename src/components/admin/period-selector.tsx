'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { PERIOD_LABELS, type PeriodKey } from '@/lib/admin/dashboard-types'

const PERIOD_KEYS: PeriodKey[] = ['today', 'this_week', 'last_7', 'this_month', 'last_30']

export function PeriodSelector({ current }: { current: PeriodKey }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function onChange(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'last_30') {
      params.delete('period')
    } else {
      params.set('period', value)
    }
    const qs = params.toString()
    router.push(`/admin${qs ? `?${qs}` : ''}`)
  }

  return (
    <select
      value={current}
      onChange={(e) => onChange(e.target.value)}
      className="text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer hover:border-gray-300 transition-colors"
    >
      {PERIOD_KEYS.map((key) => (
        <option key={key} value={key}>{PERIOD_LABELS[key]}</option>
      ))}
    </select>
  )
}
