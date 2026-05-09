'use client'

import { useState } from 'react'

interface User {
  id: string
  email: string
  name: string
  role: 'super_admin' | 'author'
  createdAt: string
}

interface Props {
  initialUsers: User[]
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  author: 'Author',
}

export function UsersManager({ initialUsers }: Props) {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'author' as 'super_admin' | 'author' })
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  function openCreate() {
    setEditingUser(null)
    setForm({ name: '', email: '', password: '', role: 'author' })
    setFormError('')
    setShowForm(true)
  }

  function openEdit(user: User) {
    setEditingUser(user)
    setForm({ name: user.name, email: user.email, password: '', role: user.role })
    setFormError('')
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingUser(null)
    setFormError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim()) {
      setFormError('Name and email are required.')
      return
    }
    if (!editingUser && !form.password.trim()) {
      setFormError('Password is required for new users.')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      if (editingUser) {
        const body: Record<string, string> = { name: form.name, email: form.email, role: form.role }
        if (form.password.trim()) body.password = form.password
        const res = await fetch(`/api/admin/users/${editingUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const data = await res.json()
        if (!res.ok) { setFormError(data.error || 'Failed'); return }
        setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? data.user : u)))
        closeForm()
      } else {
        const res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        const data = await res.json()
        if (!res.ok) { setFormError(data.error || 'Failed'); return }
        setUsers((prev) => [...prev, data.user])
        closeForm()
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(user: User) {
    if (!confirm(`Delete "${user.name}" (${user.email})? This cannot be undone.`)) return
    const res = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' })
    if (!res.ok) {
      const d = await res.json()
      alert(d.error || 'Failed to delete user')
      return
    }
    setUsers((prev) => prev.filter((u) => u.id !== user.id))
  }

  return (
    <div className="p-6">
      {/* Page header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[23px] font-normal text-[#1d2327] leading-tight">Users</h1>
          <p className="text-sm text-[#646970] mt-0.5">{users.length} user{users.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2271b1] hover:bg-[#135e96] text-white text-sm font-medium rounded transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add New User
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#c3c4c7] rounded shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#c3c4c7] text-[#1d2327] bg-[#f6f7f7]">
              <th className="text-left px-4 py-2.5 font-semibold">Name</th>
              <th className="text-left px-4 py-2.5 font-semibold">Email</th>
              <th className="text-left px-4 py-2.5 font-semibold w-32">Role</th>
              <th className="text-left px-4 py-2.5 font-semibold w-32">Created</th>
              <th className="px-4 py-2.5 w-6"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f0f1]">
            {users.map((user, i) => (
              <tr
                key={user.id}
                className={`group hover:bg-[#f6f7f7] transition-colors ${i % 2 === 0 ? '' : 'bg-[#f9f9f9]'}`}
              >
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <span className="text-xs font-semibold text-blue-700">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="font-medium text-[#1d2327]">{user.name}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 pl-9 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(user)}
                      className="text-xs text-[#2271b1] hover:text-[#135e96] font-medium"
                    >
                      Edit
                    </button>
                    <span className="text-[#c3c4c7]">|</span>
                    <button
                      onClick={() => handleDelete(user)}
                      className="text-xs text-[#d63638] hover:text-[#b32d2e]"
                    >
                      Delete
                    </button>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-[#646970] text-xs">{user.email}</td>
                <td className="px-4 py-2.5">
                  <RoleBadge role={user.role} />
                </td>
                <td className="px-4 py-2.5 text-[#646970] text-xs tabular-nums">
                  {new Date(user.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <button
                    onClick={() => openEdit(user)}
                    className="text-[#646970] hover:text-[#2271b1] transition-colors"
                    title="Edit user"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={(e) => { if (e.target === e.currentTarget) closeForm() }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-semibold text-[#1d2327] mb-5">
              {editingUser ? 'Edit User' : 'Add New User'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="Name">
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Full name"
                  className={inputCls}
                  autoFocus
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="email@example.com"
                  className={inputCls}
                />
              </Field>
              <Field label={editingUser ? 'New Password (leave blank to keep current)' : 'Password'}>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  className={inputCls}
                />
              </Field>
              <Field label="Role">
                <select
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as 'super_admin' | 'author' }))}
                  className={inputCls}
                >
                  <option value="author">Author</option>
                  <option value="super_admin">Super Admin</option>
                </select>
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
                  {saving ? 'Saving…' : editingUser ? 'Save Changes' : 'Create User'}
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

function RoleBadge({ role }: { role: string }) {
  const cls =
    role === 'super_admin'
      ? 'bg-blue-50 text-blue-700 border-blue-200'
      : 'bg-gray-50 text-gray-600 border-gray-200'
  return (
    <span className={`inline-block px-2 py-0.5 rounded border text-xs font-medium ${cls}`}>
      {ROLE_LABELS[role] ?? role}
    </span>
  )
}
