'use client'

import { useState } from 'react'
import type { NavigationContent, NavItem } from '@/lib/site-content'

const inputClass =
  'w-full border border-[#c3c4c7] rounded-lg px-3 py-2 text-sm text-[#1d2327] placeholder-[#a7aaad] focus:outline-none focus:ring-2 focus:ring-[#2271b1] focus:border-transparent'

export function NavigationForm({ initialData }: { initialData: Record<string, unknown> }) {
  const [data, setData] = useState<NavigationContent>(initialData as unknown as NavigationContent)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // --- Main nav helpers ---

  function updateNavItem(index: number, field: 'label' | 'href', value: string) {
    setData((prev) => ({
      ...prev,
      mainNav: prev.mainNav.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    }))
    setMessage(null)
  }

  function addNavItem() {
    setData((prev) => ({
      ...prev,
      mainNav: [...prev.mainNav, { label: '', href: '/' }],
    }))
    setMessage(null)
  }

  function removeNavItem(index: number) {
    setData((prev) => ({
      ...prev,
      mainNav: prev.mainNav.filter((_, i) => i !== index),
    }))
    setMessage(null)
  }

  function moveNavItem(index: number, direction: -1 | 1) {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= data.mainNav.length) return
    setData((prev) => {
      const next = [...prev.mainNav]
      ;[next[index], next[newIndex]] = [next[newIndex], next[index]]
      return { ...prev, mainNav: next }
    })
    setMessage(null)
  }

  // --- Dropdown children helpers ---

  function addChild(parentIndex: number) {
    setData((prev) => ({
      ...prev,
      mainNav: prev.mainNav.map((item, i) =>
        i === parentIndex
          ? { ...item, children: [...(item.children || []), { label: '', href: '/' }] }
          : item,
      ),
    }))
    setMessage(null)
  }

  function updateChild(parentIndex: number, childIndex: number, field: 'label' | 'href', value: string) {
    setData((prev) => ({
      ...prev,
      mainNav: prev.mainNav.map((item, i) =>
        i === parentIndex
          ? {
              ...item,
              children: (item.children || []).map((c, ci) =>
                ci === childIndex ? { ...c, [field]: value } : c,
              ),
            }
          : item,
      ),
    }))
    setMessage(null)
  }

  function removeChild(parentIndex: number, childIndex: number) {
    setData((prev) => ({
      ...prev,
      mainNav: prev.mainNav.map((item, i) => {
        if (i !== parentIndex) return item
        const children = (item.children || []).filter((_, ci) => ci !== childIndex)
        return { ...item, children: children.length > 0 ? children : undefined }
      }),
    }))
    setMessage(null)
  }

  // --- Footer nav helpers ---

  function updateFooterLink(section: 'main' | 'secondary', index: number, field: 'label' | 'href', value: string) {
    setData((prev) => ({
      ...prev,
      footerNav: {
        ...prev.footerNav,
        [section]: prev.footerNav[section].map((item, i) =>
          i === index ? { ...item, [field]: value } : item,
        ),
      },
    }))
    setMessage(null)
  }

  function addFooterLink(section: 'main' | 'secondary') {
    setData((prev) => ({
      ...prev,
      footerNav: {
        ...prev.footerNav,
        [section]: [...prev.footerNav[section], { label: '', href: '/' }],
      },
    }))
    setMessage(null)
  }

  function removeFooterLink(section: 'main' | 'secondary', index: number) {
    setData((prev) => ({
      ...prev,
      footerNav: {
        ...prev.footerNav,
        [section]: prev.footerNav[section].filter((_, i) => i !== index),
      },
    }))
    setMessage(null)
  }

  async function save() {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/site-content/navigation', {
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
      await fetch('/api/admin/site-content/navigation', { method: 'DELETE' })
      const res = await fetch('/api/admin/site-content/navigation')
      const json = await res.json()
      if (json.success) {
        setData(json.value as NavigationContent)
        setMessage({ type: 'success', text: 'Reset to defaults' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to reset' })
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Main Navigation */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-[#1d2327]">Main Navigation</p>
          <button
            onClick={addNavItem}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#2271b1] border border-[#2271b1] rounded hover:bg-[#f0f6fc] transition-colors"
          >
            + Add Item
          </button>
        </div>
        <div className="space-y-3">
          {data.mainNav.map((item, i) => (
            <NavItemEditor
              key={i}
              item={item}
              index={i}
              total={data.mainNav.length}
              onUpdate={updateNavItem}
              onMove={moveNavItem}
              onRemove={removeNavItem}
              onAddChild={addChild}
              onUpdateChild={updateChild}
              onRemoveChild={removeChild}
            />
          ))}
        </div>
      </div>

      {/* Footer — Main links */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-[#1d2327]">Footer Links — Main</p>
          <button
            onClick={() => addFooterLink('main')}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#2271b1] border border-[#2271b1] rounded hover:bg-[#f0f6fc] transition-colors"
          >
            + Add Link
          </button>
        </div>
        <LinkList
          links={data.footerNav.main}
          onUpdate={(i, f, v) => updateFooterLink('main', i, f, v)}
          onRemove={(i) => removeFooterLink('main', i)}
        />
      </div>

      {/* Footer — Secondary links */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-[#1d2327]">Footer Links — Secondary</p>
          <button
            onClick={() => addFooterLink('secondary')}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#2271b1] border border-[#2271b1] rounded hover:bg-[#f0f6fc] transition-colors"
          >
            + Add Link
          </button>
        </div>
        <LinkList
          links={data.footerNav.secondary}
          onUpdate={(i, f, v) => updateFooterLink('secondary', i, f, v)}
          onRemove={(i) => removeFooterLink('secondary', i)}
        />
      </div>

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
// Sub-components
// ---------------------------------------------------------------------------

function NavItemEditor({
  item,
  index,
  total,
  onUpdate,
  onMove,
  onRemove,
  onAddChild,
  onUpdateChild,
  onRemoveChild,
}: {
  item: NavItem
  index: number
  total: number
  onUpdate: (i: number, field: 'label' | 'href', value: string) => void
  onMove: (i: number, dir: -1 | 1) => void
  onRemove: (i: number) => void
  onAddChild: (i: number) => void
  onUpdateChild: (pi: number, ci: number, field: 'label' | 'href', value: string) => void
  onRemoveChild: (pi: number, ci: number) => void
}) {
  return (
    <div className="border border-[#c3c4c7] rounded-lg p-4 bg-[#f6f7f7]">
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="text-xs font-semibold text-[#646970] mt-1">#{index + 1}</span>
        <div className="flex items-center gap-1">
          <MoveButtons index={index} total={total} onMove={onMove} />
          <button
            onClick={() => onRemove(index)}
            className="p-1 text-red-400 hover:text-red-600 transition-colors"
            title="Remove"
          >
            <XIcon />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-[#646970] mb-1">Label</label>
          <input className={inputClass} value={item.label} onChange={(e) => onUpdate(index, 'label', e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#646970] mb-1">URL</label>
          <input className={inputClass} value={item.href} onChange={(e) => onUpdate(index, 'href', e.target.value)} />
        </div>
      </div>

      {/* Dropdown children */}
      <div className="mt-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-medium text-[#a7aaad] uppercase tracking-wider">Dropdown Items</span>
          <button
            onClick={() => onAddChild(index)}
            className="text-[11px] text-[#2271b1] hover:underline"
          >
            + Add
          </button>
        </div>
        {item.children && item.children.length > 0 ? (
          <div className="space-y-2 pl-4 border-l-2 border-[#c3c4c7]">
            {item.children.map((child, ci) => (
              <div key={ci} className="flex items-center gap-2">
                <input
                  className={`${inputClass} flex-1`}
                  value={child.label}
                  onChange={(e) => onUpdateChild(index, ci, 'label', e.target.value)}
                  placeholder="Label"
                />
                <input
                  className={`${inputClass} flex-1`}
                  value={child.href}
                  onChange={(e) => onUpdateChild(index, ci, 'href', e.target.value)}
                  placeholder="/path"
                />
                <button
                  onClick={() => onRemoveChild(index, ci)}
                  className="p-1 text-red-400 hover:text-red-600 shrink-0 transition-colors"
                >
                  <XIcon />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-[#a7aaad] pl-4">No dropdown items</p>
        )}
      </div>
    </div>
  )
}

function LinkList({
  links,
  onUpdate,
  onRemove,
}: {
  links: { label: string; href: string }[]
  onUpdate: (i: number, field: 'label' | 'href', value: string) => void
  onRemove: (i: number) => void
}) {
  return (
    <div className="space-y-2">
      {links.map((link, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            className={`${inputClass} flex-1`}
            value={link.label}
            onChange={(e) => onUpdate(i, 'label', e.target.value)}
            placeholder="Label"
          />
          <input
            className={`${inputClass} flex-1`}
            value={link.href}
            onChange={(e) => onUpdate(i, 'href', e.target.value)}
            placeholder="/path"
          />
          <button
            onClick={() => onRemove(i)}
            className="p-1 text-red-400 hover:text-red-600 shrink-0 transition-colors"
          >
            <XIcon />
          </button>
        </div>
      ))}
      {links.length === 0 && (
        <p className="text-[11px] text-[#a7aaad]">No links added</p>
      )}
    </div>
  )
}

function MoveButtons({ index, total, onMove }: { index: number; total: number; onMove: (i: number, dir: -1 | 1) => void }) {
  return (
    <>
      <button
        onClick={() => onMove(index, -1)}
        disabled={index === 0}
        className="p-1 text-[#646970] hover:text-[#1d2327] disabled:opacity-30 transition-colors"
        title="Move up"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        </svg>
      </button>
      <button
        onClick={() => onMove(index, 1)}
        disabled={index === total - 1}
        className="p-1 text-[#646970] hover:text-[#1d2327] disabled:opacity-30 transition-colors"
        title="Move down"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </>
  )
}

function XIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}
