'use client'

import { useState, useRef } from 'react'
import type { FAQContent } from '@/lib/site-content'

type FAQItem = FAQContent['items'][number] & { _id: number }

const inputClass =
  'w-full border border-[#c3c4c7] rounded-lg px-3 py-2 text-sm text-[#1d2327] placeholder-[#a7aaad] focus:outline-none focus:ring-2 focus:ring-[#2271b1] focus:border-transparent'

export function FaqsForm({ initialData }: { initialData: Record<string, unknown> }) {
  const nextId = useRef(0)
  function withIds(raw: FAQContent['items']): FAQItem[] {
    return raw.map((item) => ({ ...item, _id: nextId.current++ }))
  }
  const [items, setItems] = useState<FAQItem[]>(() => withIds((initialData as unknown as FAQContent).items))
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  function updateItem(index: number, field: 'question' | 'answer', value: string) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)))
    setMessage(null)
  }

  function addItem() {
    setItems((prev) => [...prev, { question: '', answer: '', _id: nextId.current++ }])
    setMessage(null)
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index))
    setMessage(null)
  }

  function moveItem(index: number, direction: -1 | 1) {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= items.length) return
    setItems((prev) => {
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
      const res = await fetch('/api/admin/site-content/faqs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: { items: items.map(({ _id: _, ...rest }) => rest) } }),
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
      await fetch('/api/admin/site-content/faqs', { method: 'DELETE' })
      const res = await fetch('/api/admin/site-content/faqs')
      const json = await res.json()
      if (json.success) {
        setItems(withIds((json.value as FAQContent).items))
        setMessage({ type: 'success', text: 'Reset to defaults' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to reset' })
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-[#1d2327]">{items.length} FAQ{items.length !== 1 ? 's' : ''}</p>
        <button
          onClick={addItem}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#2271b1] border border-[#2271b1] rounded hover:bg-[#f0f6fc] transition-colors"
        >
          + Add FAQ
        </button>
      </div>

      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={item._id} className="border border-[#c3c4c7] rounded-lg p-4 bg-[#f6f7f7]">
            <div className="flex items-start justify-between gap-2 mb-3">
              <span className="text-xs font-semibold text-[#646970] mt-1">#{i + 1}</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => moveItem(i, -1)}
                  disabled={i === 0}
                  className="p-1 text-[#646970] hover:text-[#1d2327] disabled:opacity-30 transition-colors"
                  title="Move up"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => moveItem(i, 1)}
                  disabled={i === items.length - 1}
                  className="p-1 text-[#646970] hover:text-[#1d2327] disabled:opacity-30 transition-colors"
                  title="Move down"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => removeItem(i)}
                  className="p-1 text-red-400 hover:text-red-600 transition-colors"
                  title="Remove"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <input
                className={inputClass}
                value={item.question}
                onChange={(e) => updateItem(i, 'question', e.target.value)}
                placeholder="Question"
              />
              <textarea
                className={`${inputClass} resize-y`}
                rows={3}
                value={item.answer}
                onChange={(e) => updateItem(i, 'answer', e.target.value)}
                placeholder="Answer"
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
