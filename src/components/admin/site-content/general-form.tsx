'use client'

import { useState } from 'react'
import type { GeneralContent } from '@/lib/site-content'

const inputClass =
  'w-full border border-[#c3c4c7] rounded-lg px-3 py-2 text-sm text-[#1d2327] placeholder-[#a7aaad] focus:outline-none focus:ring-2 focus:ring-[#2271b1] focus:border-transparent'

export function GeneralForm({ initialData }: { initialData: Record<string, unknown> }) {
  const [data, setData] = useState<GeneralContent>(initialData as unknown as GeneralContent)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  function update<K extends keyof GeneralContent>(key: K, value: GeneralContent[K]) {
    setData((prev) => ({ ...prev, [key]: value }))
    setMessage(null)
  }

  function updateAddress(key: keyof GeneralContent['address'], value: string) {
    setData((prev) => ({ ...prev, address: { ...prev.address, [key]: value } }))
    setMessage(null)
  }

  async function save() {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/site-content/general', {
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
      await fetch('/api/admin/site-content/general', { method: 'DELETE' })
      const res = await fetch('/api/admin/site-content/general')
      const json = await res.json()
      if (json.success) {
        setData(json.value as GeneralContent)
        setMessage({ type: 'success', text: 'Reset to defaults' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to reset' })
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Business Name">
          <input className={inputClass} value={data.businessName} onChange={(e) => update('businessName', e.target.value)} />
        </Field>
        <Field label="Tagline">
          <input className={inputClass} value={data.tagline} onChange={(e) => update('tagline', e.target.value)} />
        </Field>
        <Field label="Phone (raw)">
          <input className={inputClass} value={data.phone} onChange={(e) => update('phone', e.target.value)} placeholder="7022139800" />
        </Field>
        <Field label="Phone (display)">
          <input className={inputClass} value={data.phoneDisplay} onChange={(e) => update('phoneDisplay', e.target.value)} placeholder="(702) 213-9800" />
        </Field>
        <Field label="Email">
          <input className={inputClass} type="email" value={data.email} onChange={(e) => update('email', e.target.value)} />
        </Field>
        <Field label="License">
          <input className={inputClass} value={data.license} onChange={(e) => update('license', e.target.value)} />
        </Field>
      </div>

      <div>
        <p className="text-sm font-medium text-[#1d2327] mb-3">Address</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Street">
            <input className={inputClass} value={data.address.street} onChange={(e) => updateAddress('street', e.target.value)} />
          </Field>
          <Field label="City">
            <input className={inputClass} value={data.address.city} onChange={(e) => updateAddress('city', e.target.value)} />
          </Field>
          <Field label="State">
            <input className={inputClass} value={data.address.state} onChange={(e) => updateAddress('state', e.target.value)} />
          </Field>
          <Field label="ZIP">
            <input className={inputClass} value={data.address.zip} onChange={(e) => updateAddress('zip', e.target.value)} />
          </Field>
        </div>
      </div>

      <Field label="Hours">
        <input className={inputClass} value={data.hours} onChange={(e) => update('hours', e.target.value)} />
      </Field>

      {/* Actions */}
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
