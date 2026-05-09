'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

type PostStatus = 'published' | 'pending' | 'rejected'

interface BlogPostMeta {
  slug: string
  title: string
  excerpt: string
  category: string
  author: string
  publishedAt: string
  updatedAt: string
  readTime: string
  featured?: boolean
  image?: string
  imageAlt?: string
  status?: PostStatus
}

interface Props {
  initialPosts: BlogPostMeta[]
  isSuperAdmin: boolean
}

export function PostsManager({ initialPosts, isSuperAdmin }: Props) {
  const [posts, setPosts] = useState(initialPosts)
  const [titleFilter, setTitleFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [authorFilter, setAuthorFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const categories = useMemo(
    () => Array.from(new Set(initialPosts.map((p) => p.category))).sort(),
    [initialPosts]
  )

  const filtered = useMemo(() => {
    return posts.filter((p) => {
      if (titleFilter && !p.title.toLowerCase().includes(titleFilter.toLowerCase())) return false
      if (categoryFilter && p.category !== categoryFilter) return false
      if (authorFilter && !p.author.toLowerCase().includes(authorFilter.toLowerCase())) return false
      if (statusFilter) {
        const effectiveStatus = p.status ?? 'published'
        if (effectiveStatus !== statusFilter) return false
      }
      return true
    })
  }, [posts, titleFilter, categoryFilter, authorFilter, statusFilter])

  const counts = useMemo(() => {
    const all = posts.length
    const published = posts.filter((p) => !p.status || p.status === 'published').length
    const pending = posts.filter((p) => p.status === 'pending').length
    const rejected = posts.filter((p) => p.status === 'rejected').length
    return { all, published, pending, rejected }
  }, [posts])

  async function handleApprove(slug: string, action: 'approve' | 'reject') {
    const res = await fetch(`/api/admin/blogs/${slug}/approve`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    if (!res.ok) {
      const d = await res.json()
      alert(d.error || 'Failed')
      return
    }
    const { status } = await res.json()
    setPosts((prev) => prev.map((p) => (p.slug === slug ? { ...p, status } : p)))
  }

  async function handleDelete(slug: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    const res = await fetch(`/api/admin/blogs/${slug}`, { method: 'DELETE' })
    if (!res.ok) {
      const d = await res.json()
      alert(d.error || 'Failed to delete post')
      return
    }
    setPosts((prev) => prev.filter((p) => p.slug !== slug))
  }

  return (
    <div className="p-6">
      {/* Page header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[23px] font-normal text-[#1d2327] leading-tight">Posts</h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-[#646970]">
            <button
              onClick={() => setStatusFilter('')}
              className={`hover:text-[#2271b1] ${statusFilter === '' ? 'font-semibold text-[#1d2327]' : ''}`}
            >
              All ({counts.all})
            </button>
            <span className="text-[#c3c4c7]">|</span>
            <button
              onClick={() => setStatusFilter('published')}
              className={`hover:text-[#2271b1] ${statusFilter === 'published' ? 'font-semibold text-[#1d2327]' : ''}`}
            >
              Published ({counts.published})
            </button>
            <span className="text-[#c3c4c7]">|</span>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`hover:text-[#2271b1] ${statusFilter === 'pending' ? 'font-semibold text-[#1d2327]' : ''}`}
            >
              Pending ({counts.pending})
            </button>
            {counts.rejected > 0 && (
              <>
                <span className="text-[#c3c4c7]">|</span>
                <button
                  onClick={() => setStatusFilter('rejected')}
                  className={`hover:text-[#2271b1] ${statusFilter === 'rejected' ? 'font-semibold text-[#1d2327]' : ''}`}
                >
                  Rejected ({counts.rejected})
                </button>
              </>
            )}
          </div>
        </div>
        <Link
          href="/admin/blogs/new"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2271b1] hover:bg-[#135e96] text-white text-sm font-medium rounded transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add New Post
        </Link>
      </div>

      {/* Filter row */}
      <div className="flex items-center gap-2 mb-4">
        <input
          type="text"
          placeholder="Search by title…"
          value={titleFilter}
          onChange={(e) => setTitleFilter(e.target.value)}
          className="flex-1 min-w-0 border border-[#c3c4c7] rounded px-3 py-1.5 text-sm text-[#1d2327] placeholder-[#646970] focus:outline-none focus:ring-2 focus:ring-[#2271b1] focus:border-transparent"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="border border-[#c3c4c7] rounded px-3 py-1.5 text-sm text-[#1d2327] focus:outline-none focus:ring-2 focus:ring-[#2271b1] focus:border-transparent"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Author…"
          value={authorFilter}
          onChange={(e) => setAuthorFilter(e.target.value)}
          className="w-36 border border-[#c3c4c7] rounded px-3 py-1.5 text-sm text-[#1d2327] placeholder-[#646970] focus:outline-none focus:ring-2 focus:ring-[#2271b1] focus:border-transparent"
        />
        {(titleFilter || categoryFilter || authorFilter || statusFilter) && (
          <button
            onClick={() => { setTitleFilter(''); setCategoryFilter(''); setAuthorFilter(''); setStatusFilter('') }}
            className="px-2 py-1.5 text-xs text-[#646970] hover:text-[#1d2327] border border-[#c3c4c7] rounded transition-colors"
          >
            Clear
          </button>
        )}
        <span className="text-xs text-[#646970] ml-1 shrink-0">
          {filtered.length} of {posts.length}
        </span>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#c3c4c7] rounded shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#c3c4c7] text-[#1d2327] bg-[#f6f7f7]">
              <th className="text-left px-4 py-2.5 font-semibold">Title</th>
              <th className="text-left px-4 py-2.5 font-semibold w-36">Category</th>
              <th className="text-left px-4 py-2.5 font-semibold w-28">Author</th>
              <th className="text-left px-4 py-2.5 font-semibold w-24">Date</th>
              <th className="text-left px-4 py-2.5 font-semibold w-24">Status</th>
              <th className="px-4 py-2.5 w-6"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f0f1]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-[#646970]">
                  No posts found.
                </td>
              </tr>
            ) : (
              filtered.map((post, i) => {
                const effectiveStatus: PostStatus = post.status ?? 'published'
                return (
                  <tr
                    key={post.slug}
                    className={`group hover:bg-[#f6f7f7] transition-colors ${i % 2 === 0 ? '' : 'bg-[#f9f9f9]'}`}
                  >
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-[#1d2327] group-hover:text-[#2271b1] leading-snug">
                        {post.title}
                        {post.featured && (
                          <span className="ml-2 text-[10px] bg-[#fcf9e8] border border-[#f0c33c] text-[#856404] px-1.5 py-0.5 rounded font-medium">
                            Featured
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          href={`/admin/blogs/${post.slug}/edit`}
                          className="text-xs text-[#2271b1] hover:text-[#135e96] font-medium"
                        >
                          Edit
                        </Link>
                        {effectiveStatus === 'published' && (
                          <>
                            <span className="text-[#c3c4c7]">|</span>
                            <Link
                              href={`/blog/${post.slug}/`}
                              target="_blank"
                              className="text-xs text-[#646970] hover:text-[#1d2327]"
                            >
                              View
                            </Link>
                          </>
                        )}
                        {isSuperAdmin && effectiveStatus === 'pending' && (
                          <>
                            <span className="text-[#c3c4c7]">|</span>
                            <button
                              onClick={() => handleApprove(post.slug, 'approve')}
                              className="text-xs text-green-700 hover:text-green-900 font-medium"
                            >
                              Approve
                            </button>
                            <span className="text-[#c3c4c7]">|</span>
                            <button
                              onClick={() => handleApprove(post.slug, 'reject')}
                              className="text-xs text-red-600 hover:text-red-800"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {isSuperAdmin && effectiveStatus === 'rejected' && (
                          <>
                            <span className="text-[#c3c4c7]">|</span>
                            <button
                              onClick={() => handleApprove(post.slug, 'approve')}
                              className="text-xs text-green-700 hover:text-green-900 font-medium"
                            >
                              Approve
                            </button>
                          </>
                        )}
                        <span className="text-[#c3c4c7]">|</span>
                        <button
                          onClick={() => handleDelete(post.slug, post.title)}
                          className="text-xs text-[#d63638] hover:text-[#b32d2e]"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <CategoryBadge category={post.category} />
                    </td>
                    <td className="px-4 py-2.5 text-[#646970] text-xs">{post.author}</td>
                    <td className="px-4 py-2.5 text-[#646970] text-xs tabular-nums">
                      {new Date(post.publishedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={effectiveStatus} />
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Link
                        href={`/admin/blogs/${post.slug}/edit`}
                        className="text-[#646970] hover:text-[#2271b1] transition-colors"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function CategoryBadge({ category }: { category: string }) {
  const colors: Record<string, string> = {
    'Selling a Home': 'bg-green-50 text-green-700 border-green-200',
    'Sell Your House': 'bg-blue-50 text-blue-700 border-blue-200',
    'Sell My House Fast': 'bg-purple-50 text-purple-700 border-purple-200',
    'Buying a Home': 'bg-orange-50 text-orange-700 border-orange-200',
    'Uncategorized': 'bg-gray-50 text-gray-600 border-gray-200',
  }
  const cls = colors[category] || 'bg-gray-50 text-gray-600 border-gray-200'
  return (
    <span className={`inline-block px-2 py-0.5 rounded border text-xs font-medium ${cls}`}>
      {category}
    </span>
  )
}

function StatusBadge({ status }: { status: PostStatus }) {
  const map: Record<PostStatus, string> = {
    published: 'bg-green-50 text-green-700 border-green-200',
    pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    rejected: 'bg-red-50 text-red-600 border-red-200',
  }
  const labels: Record<PostStatus, string> = {
    published: 'Published',
    pending: 'Pending',
    rejected: 'Rejected',
  }
  return (
    <span className={`inline-block px-2 py-0.5 rounded border text-xs font-medium ${map[status]}`}>
      {labels[status]}
    </span>
  )
}
