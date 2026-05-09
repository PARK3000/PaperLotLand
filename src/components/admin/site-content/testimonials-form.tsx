'use client'

import { useState } from 'react'
import type { TestimonialsContent } from '@/lib/site-content'

const inputClass =
  'w-full border border-[#c3c4c7] rounded-lg px-3 py-2 text-sm text-[#1d2327] placeholder-[#a7aaad] focus:outline-none focus:ring-2 focus:ring-[#2271b1] focus:border-transparent'

type Review = TestimonialsContent['fallbackReviews'][number]

export function TestimonialsForm({ initialData }: { initialData: Record<string, unknown> }) {
  const [reviews, setReviews] = useState<Review[]>(
    (initialData as unknown as TestimonialsContent).fallbackReviews,
  )
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  function updateReview(index: number, field: keyof Review, value: string | number) {
    setReviews((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)),
    )
    setMessage(null)
  }

  function addReview() {
    setReviews((prev) => [...prev, { name: '', date: '', text: '', rating: 5 }])
    setMessage(null)
  }

  function removeReview(index: number) {
    setReviews((prev) => prev.filter((_, i) => i !== index))
    setMessage(null)
  }

  function moveReview(index: number, direction: -1 | 1) {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= reviews.length) return
    setReviews((prev) => {
      const next = [...prev]
      ;[next[index], next[newIndex]] = [next[newIndex], next[index]]
      return next
    })
    setMessage(null)
  }

  async function save() {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/site-content/testimonials', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: { fallbackReviews: reviews } }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to save')
      }
      setMessage({ type: 'success', text: 'Saved successfully' })
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save' })
    } finally {
      setSaving(false)
    }
  }

  async function resetToDefaults() {
    if (!confirm('Reset this section to its original defaults? Any saved overrides will be removed.')) return
    try {
      await fetch('/api/admin/site-content/testimonials', { method: 'DELETE' })
      const res = await fetch('/api/admin/site-content/testimonials')
      const json = await res.json()
      if (json.success) {
        setReviews((json.value as TestimonialsContent).fallbackReviews)
        setMessage({ type: 'success', text: 'Reset to defaults' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to reset' })
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-sm font-medium text-[#1d2327]">
            {reviews.length} Fallback Review{reviews.length !== 1 ? 's' : ''}
          </p>
          <p className="text-[11px] text-[#a7aaad] mt-0.5">
            Shown only when Google Places API reviews are unavailable.
          </p>
        </div>
        <button
          onClick={addReview}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#2271b1] border border-[#2271b1] rounded hover:bg-[#f0f6fc] transition-colors"
        >
          + Add Review
        </button>
      </div>

      <div className="space-y-3">
        {reviews.map((review, i) => (
          <div key={i} className="border border-[#c3c4c7] rounded-lg p-4 bg-[#f6f7f7]">
            <div className="flex items-start justify-between gap-2 mb-3">
              <span className="text-xs font-semibold text-[#646970] mt-1">#{i + 1}</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => moveReview(i, -1)}
                  disabled={i === 0}
                  className="p-1 text-[#646970] hover:text-[#1d2327] disabled:opacity-30 transition-colors"
                  title="Move up"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => moveReview(i, 1)}
                  disabled={i === reviews.length - 1}
                  className="p-1 text-[#646970] hover:text-[#1d2327] disabled:opacity-30 transition-colors"
                  title="Move down"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => removeReview(i)}
                  className="p-1 text-red-400 hover:text-red-600 transition-colors"
                  title="Remove"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#646970] mb-1">Name</label>
                <input
                  className={inputClass}
                  value={review.name}
                  onChange={(e) => updateReview(i, 'name', e.target.value)}
                  placeholder="Reviewer name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#646970] mb-1">Date</label>
                <input
                  className={inputClass}
                  value={review.date}
                  onChange={(e) => updateReview(i, 'date', e.target.value)}
                  placeholder="January 1, 2026"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#646970] mb-1">Rating</label>
                <select
                  className={inputClass}
                  value={review.rating}
                  onChange={(e) => updateReview(i, 'rating', parseInt(e.target.value))}
                >
                  {[5, 4, 3, 2, 1].map((r) => (
                    <option key={r} value={r}>
                      {'★'.repeat(r)}{'☆'.repeat(5 - r)} ({r})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-xs font-medium text-[#646970] mb-1">Review Text</label>
              <textarea
                className={`${inputClass} resize-y`}
                rows={3}
                value={review.text}
                onChange={(e) => updateReview(i, 'text', e.target.value)}
                placeholder="Review text..."
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 pt-2 border-t border-[#f0f0f1]">
        <button
          onClick={save}
          disabled={saving}
          className="px-4 py-2 bg-[#2271b1] hover:bg-[#135e96] text-white text-sm font-medium rounded transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        <button
          onClick={resetToDefaults}
          className="px-4 py-2 text-sm text-[#646970] hover:text-[#1d2327] border border-[#c3c4c7] rounded transition-colors"
        >
          Reset to Defaults
        </button>
        {message && (
          <span className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {message.text}
          </span>
        )}
      </div>
    </div>
  )
}
