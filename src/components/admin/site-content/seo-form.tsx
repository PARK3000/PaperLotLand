'use client'

import { useState } from 'react'
import type { SeoDefaultsContent } from '@/lib/site-content'

const inputClass =
  'w-full border border-[#c3c4c7] rounded-lg px-3 py-2 text-sm text-[#1d2327] placeholder-[#a7aaad] focus:outline-none focus:ring-2 focus:ring-[#2271b1] focus:border-transparent'

export function SeoForm({ initialData }: { initialData: Record<string, unknown> }) {
  const init = initialData as unknown as SeoDefaultsContent
  const [data, setData] = useState<SeoDefaultsContent>(init)
  const [keywordsText, setKeywordsText] = useState(init.defaultKeywords.join(', '))
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  function updateKeywords(text: string) {
    setKeywordsText(text)
    setData((prev) => ({
      ...prev,
      defaultKeywords: text.split(',').map((k) => k.trim()).filter(Boolean),
    }))
    setMessage(null)
  }

  async function save() {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/site-content/seo_defaults', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: data }),
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
      await fetch('/api/admin/site-content/seo_defaults', { method: 'DELETE' })
      const res = await fetch('/api/admin/site-content/seo_defaults')
      const json = await res.json()
      if (json.success) {
        const val = json.value as SeoDefaultsContent
        setData(val)
        setKeywordsText(val.defaultKeywords.join(', '))
        setMessage({ type: 'success', text: 'Reset to defaults' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to reset' })
    }
  }

  return (
    <div className="p-6 space-y-4">
      <Field label="Default Title">
        <input
          className={inputClass}
          value={data.defaultTitle}
          onChange={(e) => { setData((p) => ({ ...p, defaultTitle: e.target.value })); setMessage(null) }}
        />
        <p className="text-[11px] text-[#a7aaad] mt-1">{data.defaultTitle.length}/60 characters</p>
      </Field>

      <Field label="Default Description">
        <textarea
          className={`${inputClass} resize-y`}
          rows={3}
          value={data.defaultDescription}
          onChange={(e) => { setData((p) => ({ ...p, defaultDescription: e.target.value })); setMessage(null) }}
        />
        <p className="text-[11px] text-[#a7aaad] mt-1">{data.defaultDescription.length}/160 characters</p>
      </Field>

      <Field label="Default Keywords (comma-separated)">
        <textarea
          className={`${inputClass} resize-y`}
          rows={2}
          value={keywordsText}
          onChange={(e) => updateKeywords(e.target.value)}
        />
        <p className="text-[11px] text-[#a7aaad] mt-1">{data.defaultKeywords.length} keywords</p>
      </Field>

      <Field label="OG Image Path">
        <input
          className={inputClass}
          value={data.ogImage}
          onChange={(e) => { setData((p) => ({ ...p, ogImage: e.target.value })); setMessage(null) }}
          placeholder="/images/og-image.jpg"
        />
      </Field>

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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#646970] mb-1">{label}</label>
      {children}
    </div>
  )
}
