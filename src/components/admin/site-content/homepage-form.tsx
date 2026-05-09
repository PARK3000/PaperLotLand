'use client'

import { useState } from 'react'
import type { HomepageContent } from '@/lib/site-content'

const inputClass =
  'w-full border border-[#c3c4c7] rounded-lg px-3 py-2 text-sm text-[#1d2327] placeholder-[#a7aaad] focus:outline-none focus:ring-2 focus:ring-[#2271b1] focus:border-transparent'

export function HomepageForm({ initialData }: { initialData: Record<string, unknown> }) {
  const [data, setData] = useState<HomepageContent>(initialData as unknown as HomepageContent)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  function setField<K extends keyof HomepageContent>(key: K, value: HomepageContent[K]) {
    setData((prev) => ({ ...prev, [key]: value }))
    setMessage(null)
  }

  async function save() {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/site-content/homepage', {
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
      await fetch('/api/admin/site-content/homepage', { method: 'DELETE' })
      const res = await fetch('/api/admin/site-content/homepage')
      const json = await res.json()
      if (json.success) {
        setData(json.value as HomepageContent)
        setMessage({ type: 'success', text: 'Reset to defaults' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to reset' })
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Hero fields */}
      <Section title="Hero Section">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Hero Title">
            <input className={inputClass} value={data.heroTitle} onChange={(e) => setField('heroTitle', e.target.value)} />
          </Field>
          <Field label="Hero Subtitle">
            <input className={inputClass} value={data.heroSubtitle} onChange={(e) => setField('heroSubtitle', e.target.value)} />
          </Field>
          <Field label="CTA Button Text">
            <input className={inputClass} value={data.heroCtaText} onChange={(e) => setField('heroCtaText', e.target.value)} />
          </Field>
        </div>
      </Section>

      {/* Trust Stats */}
      <Section title="Trust Stats">
        <ArrayEditor
          items={data.trustStats}
          fields={['value', 'label', 'icon']}
          placeholders={{ value: '2,000+', label: 'Homes Purchased', icon: 'home' }}
          onChange={(items) => setField('trustStats', items)}
        />
      </Section>

      {/* Key Features */}
      <Section title="Key Features (Hero)">
        <ArrayEditor
          items={data.keyFeatures}
          fields={['title', 'description', 'icon']}
          placeholders={{ title: 'Zero Fees', description: 'No commissions...', icon: 'dollar' }}
          onChange={(items) => setField('keyFeatures', items)}
          textareaField="description"
        />
      </Section>

      {/* Process Steps */}
      <Section title="Process Steps (How It Works)">
        <div className="space-y-3">
          {data.processSteps.map((step, i) => (
            <div key={i} className="border border-[#c3c4c7] rounded-lg p-4 bg-[#f6f7f7]">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 bg-[#2271b1] text-white rounded-full flex items-center justify-center text-xs font-bold">
                  {step.number}
                </span>
                <span className="text-xs font-semibold text-[#646970]">Step {step.number}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Title">
                  <input
                    className={inputClass}
                    value={step.title}
                    onChange={(e) => {
                      const next = [...data.processSteps]
                      next[i] = { ...next[i], title: e.target.value }
                      setField('processSteps', next)
                    }}
                  />
                </Field>
                <Field label="Short Title">
                  <input
                    className={inputClass}
                    value={step.shortTitle}
                    onChange={(e) => {
                      const next = [...data.processSteps]
                      next[i] = { ...next[i], shortTitle: e.target.value }
                      setField('processSteps', next)
                    }}
                  />
                </Field>
              </div>
              <div className="mt-3">
                <Field label="Description">
                  <textarea
                    className={`${inputClass} resize-y`}
                    rows={2}
                    value={step.description}
                    onChange={(e) => {
                      const next = [...data.processSteps]
                      next[i] = { ...next[i], description: e.target.value }
                      setField('processSteps', next)
                    }}
                  />
                </Field>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Value Props */}
      <Section title="Value Propositions">
        <ArrayEditor
          items={data.valueProps}
          fields={['title', 'description', 'icon']}
          placeholders={{ title: 'Zero Fees to Sell', description: 'We cover all closing costs...', icon: 'dollar-sign' }}
          onChange={(items) => setField('valueProps', items)}
          textareaField="description"
        />
      </Section>

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm font-semibold text-[#1d2327] mb-3">{title}</p>
      {children}
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

function ArrayEditor<T extends Record<string, string>>({
  items,
  fields,
  placeholders,
  onChange,
  textareaField,
}: {
  items: T[]
  fields: (keyof T & string)[]
  placeholders: Partial<Record<keyof T & string, string>>
  onChange: (items: T[]) => void
  textareaField?: keyof T & string
}) {
  function updateItem(index: number, field: keyof T & string, value: string) {
    const next = items.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    onChange(next)
  }

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="border border-[#c3c4c7] rounded-lg p-4 bg-[#f6f7f7]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#646970]">#{i + 1}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {fields.map((field) =>
              field === textareaField ? null : (
                <Field key={field} label={field.charAt(0).toUpperCase() + field.slice(1)}>
                  <input
                    className={inputClass}
                    value={item[field] as string}
                    onChange={(e) => updateItem(i, field, e.target.value)}
                    placeholder={placeholders[field] || ''}
                  />
                </Field>
              ),
            )}
          </div>
          {textareaField && (
            <div className="mt-3">
              <Field label={String(textareaField).charAt(0).toUpperCase() + String(textareaField).slice(1)}>
                <textarea
                  className={`${inputClass} resize-y`}
                  rows={2}
                  value={item[textareaField] as string}
                  onChange={(e) => updateItem(i, textareaField, e.target.value)}
                  placeholder={placeholders[textareaField] || ''}
                />
              </Field>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
