'use client'

import { useMemo, useRef, useState } from 'react'
import { LOT_TYPES, BUDGET_RANGES, JURISDICTIONS, ROLES } from '@/lib/constants'

interface Buyer {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  role: string | null
  lotTypePreference: string | null
  budgetRange: string | null
  jurisdictionPreference: string | null
  status: 'active' | 'cold' | 'closed'
  tags: string[]
  notes: string | null
  lastContactedAt: string | null
  leadDate: string | null
  leadSource: string | null
  createdAt: string
  updatedAt: string
}

interface Props {
  initialBuyers: Buyer[]
}

const ROLE_LABELS: Record<string, string> = Object.fromEntries(ROLES.map((r) => [r.value, r.label]))

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  company: '',
  role: '',
  lotTypePreference: '',
  budgetRange: '',
  jurisdictionPreference: '',
  status: 'active' as Buyer['status'],
  tags: '',
  notes: '',
  lastContactedAt: '',
  leadDate: '',
}

export function BuyersManager({ initialBuyers }: Props) {
  const [buyers, setBuyers] = useState<Buyer[]>(initialBuyers)
  const [showForm, setShowForm] = useState(false)
  const [editingBuyer, setEditingBuyer] = useState<Buyer | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'all' | Buyer['status']>('all')
  const [search, setSearch] = useState('')
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{
    inserted: number
    skippedDuplicateInFile: number
    skippedExisting: number
    skippedInvalid: number
  } | null>(null)
  const [importError, setImportError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    return buyers.filter((b) => {
      if (statusFilter !== 'all' && b.status !== statusFilter) return false
      if (search.trim()) {
        const term = search.toLowerCase()
        const haystack = [b.name, b.email, b.phone, b.company].filter(Boolean).join(' ').toLowerCase()
        if (!haystack.includes(term)) return false
      }
      return true
    })
  }, [buyers, statusFilter, search])

  function openCreate() {
    setEditingBuyer(null)
    setForm(EMPTY_FORM)
    setFormError('')
    setShowForm(true)
  }

  function openEdit(buyer: Buyer) {
    setEditingBuyer(buyer)
    setForm({
      name: buyer.name,
      email: buyer.email ?? '',
      phone: buyer.phone ?? '',
      company: buyer.company ?? '',
      role: buyer.role ?? '',
      lotTypePreference: buyer.lotTypePreference ?? '',
      budgetRange: buyer.budgetRange ?? '',
      jurisdictionPreference: buyer.jurisdictionPreference ?? '',
      status: buyer.status,
      tags: buyer.tags.join(', '),
      notes: buyer.notes ?? '',
      lastContactedAt: buyer.lastContactedAt ?? '',
      leadDate: buyer.leadDate ? buyer.leadDate.slice(0, 10) : '',
    })
    setFormError('')
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingBuyer(null)
    setFormError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      setFormError('Name is required.')
      return
    }
    setSaving(true)
    setFormError('')
    const body = {
      name: form.name,
      email: form.email || null,
      phone: form.phone || null,
      company: form.company || null,
      role: form.role || null,
      lotTypePreference: form.lotTypePreference || null,
      budgetRange: form.budgetRange || null,
      jurisdictionPreference: form.jurisdictionPreference || null,
      status: form.status,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      notes: form.notes || null,
      lastContactedAt: form.lastContactedAt || null,
      leadDate: form.leadDate || null,
    }
    try {
      if (editingBuyer) {
        const res = await fetch(`/api/admin/buyers/${editingBuyer.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const data = await res.json()
        if (!res.ok) { setFormError(data.error || 'Failed'); return }
        setBuyers((prev) => prev.map((b) => (b.id === editingBuyer.id ? data.buyer : b)))
        closeForm()
      } else {
        const res = await fetch('/api/admin/buyers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const data = await res.json()
        if (!res.ok) { setFormError(data.error || 'Failed'); return }
        setBuyers((prev) => [data.buyer, ...prev])
        closeForm()
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(buyer: Buyer) {
    if (!confirm(`Delete "${buyer.name}"? This cannot be undone.`)) return
    const res = await fetch(`/api/admin/buyers/${buyer.id}`, { method: 'DELETE' })
    if (!res.ok) {
      const d = await res.json()
      alert(d.error || 'Failed to delete buyer')
      return
    }
    setBuyers((prev) => prev.filter((b) => b.id !== buyer.id))
  }

  function openImport() {
    setImportError('')
    setImportResult(null)
    fileInputRef.current?.click()
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setImporting(true)
    setImportError('')
    setImportResult(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/admin/buyers/import', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) {
        setImportError(data.error || 'Import failed')
        return
      }
      setImportResult(data)
      const refreshed = await fetch('/api/admin/buyers')
      const refreshedData = await refreshed.json()
      if (refreshed.ok) setBuyers(refreshedData.buyers)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[23px] font-normal text-[#1d2327] leading-tight">Buyers</h1>
          <p className="text-sm text-[#646970] mt-0.5">{buyers.length} buyer{buyers.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleImportFile}
            className="hidden"
          />
          <button
            onClick={openImport}
            disabled={importing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 disabled:opacity-50 text-[#1d2327] text-sm font-medium rounded border border-[#c3c4c7] transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            {importing ? 'Importing…' : 'Import Excel'}
          </button>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2271b1] hover:bg-[#135e96] text-white text-sm font-medium rounded transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Buyer
          </button>
        </div>
      </div>

      {importError && (
        <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {importError}
        </div>
      )}
      {importResult && (
        <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          Imported {importResult.inserted} new buyer{importResult.inserted !== 1 ? 's' : ''}.
          {importResult.skippedExisting > 0 && ` ${importResult.skippedExisting} already existed.`}
          {importResult.skippedDuplicateInFile > 0 && ` ${importResult.skippedDuplicateInFile} duplicate row${importResult.skippedDuplicateInFile !== 1 ? 's' : ''} in file.`}
          {importResult.skippedInvalid > 0 && ` ${importResult.skippedInvalid} row${importResult.skippedInvalid !== 1 ? 's' : ''} had no valid email.`}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, phone, company..."
          className="flex-1 min-w-0 border border-[#c3c4c7] rounded px-3 py-1.5 text-sm text-[#1d2327] placeholder-[#646970] focus:outline-none focus:ring-2 focus:ring-[#2271b1] focus:border-transparent"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | Buyer['status'])}
          className="border border-[#c3c4c7] rounded px-3 py-1.5 text-sm text-[#1d2327] focus:outline-none focus:ring-2 focus:ring-[#2271b1] focus:border-transparent"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="cold">Cold</option>
          <option value="closed">Closed</option>
        </select>
        <span className="text-xs text-[#646970] ml-1 shrink-0">
          {filtered.length} of {buyers.length}
        </span>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#c3c4c7] rounded shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-[#646970]">
            No buyers found. {buyers.length === 0 ? 'Add your first buyer to get started.' : 'Try adjusting your filters.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#c3c4c7] text-[#1d2327] bg-[#f6f7f7]">
                  <th className="text-left px-4 py-2.5 font-semibold">Name</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Contact</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Buy Box</th>
                  <th className="text-left px-4 py-2.5 font-semibold w-24">Status</th>
                  <th className="text-left px-4 py-2.5 font-semibold w-28">Lead Date</th>
                  <th className="text-left px-4 py-2.5 font-semibold w-28">Last Contact</th>
                  <th className="px-4 py-2.5 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0f1]">
                {filtered.map((buyer, i) => (
                  <tr
                    key={buyer.id}
                    className={`group hover:bg-[#f6f7f7] transition-colors ${i % 2 === 0 ? '' : 'bg-[#f9f9f9]'}`}
                  >
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-[#1d2327]">{buyer.name}</div>
                      {buyer.company && <div className="text-xs text-[#646970]">{buyer.company}</div>}
                      {buyer.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {buyer.tags.map((tag) => (
                            <span key={tag} className="inline-block px-1.5 py-0.5 rounded bg-gray-100 text-[10px] text-gray-600">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-[#646970] text-xs">
                      {buyer.email && <div>{buyer.email}</div>}
                      {buyer.phone && <div>{buyer.phone}</div>}
                      {!buyer.email && !buyer.phone && '—'}
                    </td>
                    <td className="px-4 py-2.5 text-[#646970] text-xs">
                      {buyer.role && <div>{ROLE_LABELS[buyer.role] || buyer.role}</div>}
                      {buyer.lotTypePreference && <div>{buyer.lotTypePreference}</div>}
                      {buyer.budgetRange && <div>{buyer.budgetRange}</div>}
                      {buyer.jurisdictionPreference && <div>{buyer.jurisdictionPreference}</div>}
                      {!buyer.role && !buyer.lotTypePreference && !buyer.budgetRange && !buyer.jurisdictionPreference && '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={buyer.status} />
                    </td>
                    <td className="px-4 py-2.5 text-[#646970] text-xs tabular-nums whitespace-nowrap">
                      {buyer.leadDate
                        ? new Date(buyer.leadDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-[#646970] text-xs tabular-nums whitespace-nowrap">
                      {buyer.lastContactedAt
                        ? new Date(buyer.lastContactedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => openEdit(buyer)}
                        className="text-xs text-[#2271b1] hover:text-[#135e96] font-medium mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(buyer)}
                        className="text-xs text-[#d63638] hover:text-[#b32d2e]"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeForm() }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-[#1d2327] mb-5">
              {editingBuyer ? 'Edit Buyer' : 'Add Buyer'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="Name">
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Full name or entity"
                  className={inputCls}
                  autoFocus
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Email">
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="email@example.com"
                    className={inputCls}
                  />
                </Field>
                <Field label="Phone">
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="(702) 555-0100"
                    className={inputCls}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Company">
                  <input
                    type="text"
                    value={form.company}
                    onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                    placeholder="Company / entity name"
                    className={inputCls}
                  />
                </Field>
                <Field label="Role">
                  <select
                    value={form.role}
                    onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                    className={inputCls}
                  >
                    <option value="">— Unspecified —</option>
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Lot Type Preference">
                  <select
                    value={form.lotTypePreference}
                    onChange={(e) => setForm((f) => ({ ...f, lotTypePreference: e.target.value }))}
                    className={inputCls}
                  >
                    <option value="">— Any —</option>
                    {LOT_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Budget Range">
                  <select
                    value={form.budgetRange}
                    onChange={(e) => setForm((f) => ({ ...f, budgetRange: e.target.value }))}
                    className={inputCls}
                  >
                    <option value="">— Any —</option>
                    {BUDGET_RANGES.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Jurisdiction Preference">
                <select
                  value={form.jurisdictionPreference}
                  onChange={(e) => setForm((f) => ({ ...f, jurisdictionPreference: e.target.value }))}
                  className={inputCls}
                >
                  <option value="">— Any —</option>
                  {JURISDICTIONS.map((j) => (
                    <option key={j.slug} value={j.name}>{j.name}</option>
                  ))}
                </select>
              </Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Status">
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Buyer['status'] }))}
                    className={inputCls}
                  >
                    <option value="active">Active</option>
                    <option value="cold">Cold</option>
                    <option value="closed">Closed</option>
                  </select>
                </Field>
                <Field label="Date of Lead">
                  <input
                    type="date"
                    value={form.leadDate}
                    onChange={(e) => setForm((f) => ({ ...f, leadDate: e.target.value }))}
                    className={inputCls}
                  />
                </Field>
                <Field label="Last Contacted">
                  <input
                    type="date"
                    value={form.lastContactedAt}
                    onChange={(e) => setForm((f) => ({ ...f, lastContactedAt: e.target.value }))}
                    className={inputCls}
                  />
                </Field>
              </div>
              <Field label="Tags (comma separated)">
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                  placeholder="cash buyer, repeat client, off-market only"
                  className={inputCls}
                />
              </Field>
              <Field label="Notes">
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Internal notes..."
                  rows={3}
                  className={inputCls}
                />
              </Field>
              {formError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                  {formError}
                </p>
              )}
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2 text-sm text-[#646970] hover:text-[#1d2327] border border-[#c3c4c7] rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm bg-[#2271b1] hover:bg-[#135e96] disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
                >
                  {saving ? 'Saving…' : editingBuyer ? 'Save Changes' : 'Add Buyer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

const inputCls =
  'w-full border border-[#c3c4c7] rounded-lg px-3 py-2 text-sm text-[#1d2327] focus:outline-none focus:ring-2 focus:ring-[#2271b1] focus:border-transparent'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#1d2327] mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function StatusBadge({ status }: { status: Buyer['status'] }) {
  const styles =
    status === 'active'
      ? 'bg-green-50 text-green-700 border-green-200'
      : status === 'cold'
        ? 'bg-gray-50 text-gray-600 border-gray-200'
        : 'bg-blue-50 text-blue-700 border-blue-200'
  const label = status.charAt(0).toUpperCase() + status.slice(1)
  return (
    <span className={`inline-block px-2 py-0.5 rounded border text-xs font-medium ${styles}`}>
      {label}
    </span>
  )
}
