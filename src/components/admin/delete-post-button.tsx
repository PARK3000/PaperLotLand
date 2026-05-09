'use client'

export function DeletePostButton({ slug, title }: { slug: string; title: string }) {
  async function handleDelete() {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    const res = await fetch(`/api/admin/blogs/${slug}`, { method: 'DELETE' })
    if (res.ok) {
      window.location.reload()
    } else {
      const data = await res.json()
      alert(data.error || 'Delete failed')
    }
  }

  return (
    <button
      onClick={handleDelete}
      className="text-xs text-[#b32d2e] hover:text-[#8a2122] transition-colors"
    >
      Delete
    </button>
  )
}
