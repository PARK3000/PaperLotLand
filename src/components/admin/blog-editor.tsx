'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const AI_DEFAULT_WIDTH = 300
const AI_MIN_WIDTH = 220
const AI_MAX_WIDTH = 560

const CATEGORIES = [
  'Selling a Home',
  'Sell Your House',
  'Sell My House Fast',
  'Buying a Home',
  'Uncategorized',
]

export interface BlogPostDraft {
  slug: string
  title: string
  excerpt: string
  category: string
  author: string
  publishedAt: string
  updatedAt: string
  readTime: string
  featured: boolean
  content: string
  image: string
  imageAlt: string
  seo: {
    title: string
    description: string
    keywords: string[]
  }
}

interface BlogEditorProps {
  initialData?: Partial<BlogPostDraft>
  mode: 'new' | 'edit'
}

function emptyDraft(authorName = 'Admin'): BlogPostDraft {
  const now = new Date().toISOString()
  return {
    slug: '',
    title: '',
    excerpt: '',
    category: 'Selling a Home',
    author: authorName,
    publishedAt: now,
    updatedAt: now,
    readTime: '5 min read',
    featured: false,
    content: '',
    image: '',
    imageAlt: '',
    seo: { title: '', description: '', keywords: [] },
  }
}

export default function BlogEditor({ initialData, mode }: BlogEditorProps) {
  const router = useRouter()
  const base = emptyDraft(initialData?.author)
  const [draft, setDraft] = useState<BlogPostDraft>({
    ...base,
    ...initialData,
    seo: { ...base.seo, ...(initialData?.seo ?? {}) },
  })

  const [activeTab, setActiveTab] = useState<'content' | 'seo' | 'preview'>('content')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)

  // AI state
  const [aiPanel, setAiPanel] = useState(true)
  const [aiPanelWidth, setAiPanelWidth] = useState(AI_DEFAULT_WIDTH)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiMessages, setAiMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([])
  const [aiInput, setAiInput] = useState('')

  // Drag-to-resize refs
  const isDragging = useRef(false)
  const dragStartX = useRef(0)
  const dragStartWidth = useRef(0)

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!isDragging.current) return
      const delta = dragStartX.current - e.clientX
      const next = Math.min(AI_MAX_WIDTH, Math.max(AI_MIN_WIDTH, dragStartWidth.current + delta))
      setAiPanelWidth(next)
    }
    function onUp() {
      if (!isDragging.current) return
      isDragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  function startDrag(e: React.MouseEvent) {
    isDragging.current = true
    dragStartX.current = e.clientX
    dragStartWidth.current = aiPanelWidth
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    e.preventDefault()
  }

  // Image upload state
  const [imageUploading, setImageUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function set<K extends keyof BlogPostDraft>(key: K, value: BlogPostDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  function setSeo<K extends keyof BlogPostDraft['seo']>(key: K, value: BlogPostDraft['seo'][K]) {
    setDraft((d) => ({ ...d, seo: { ...d.seo, [key]: value } }))
  }

  function handleTitleChange(title: string) {
    set('title', title)
    if (mode === 'new') {
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
      set('slug', slug)
    }
  }

  function recalcReadTime(content: string) {
    const words = content.trim().split(/\s+/).length
    const minutes = Math.max(1, Math.round(words / 200))
    set('readTime', `${minutes} min read`)
  }

  function handleContentChange(content: string) {
    set('content', content)
    recalcReadTime(content)
  }

  async function handleImageUpload(file: File) {
    setImageUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('slug', draft.slug || 'blog-image')
      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      set('image', data.path)
      set('imageAlt', draft.imageAlt || draft.title || file.name.replace(/\.[^.]+$/, ''))
    } catch (e: unknown) {
      alert((e as Error).message)
    } finally {
      setImageUploading(false)
    }
  }

  async function handleSave() {
    if (!draft.title.trim()) return alert('Title is required')
    if (!draft.slug.trim()) return alert('Slug is required')
    if (!draft.content.trim()) return alert('Content is required')

    setSaving(true)
    setSaveError('')
    setSaveSuccess(false)

    try {
      const url = mode === 'new' ? '/api/admin/blogs' : `/api/admin/blogs/${draft.slug}`
      const method = mode === 'new' ? 'POST' : 'PUT'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...draft, updatedAt: new Date().toISOString() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      setSaveSuccess(true)
      if (mode === 'new') {
        router.push(`/admin/blogs/${data.slug}/edit`)
      }
    } catch (e: unknown) {
      setSaveError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function sendAiMessage(userMessage: string, action?: string) {
    if (aiLoading) return
    setAiLoading(true)
    setAiMessages((prev) => [...prev, { role: 'user', text: userMessage }])
    setAiInput('')

    try {
      const res = await fetch('/api/admin/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          message: userMessage,
          context: {
            title: draft.title,
            content: draft.content,
            category: draft.category,
            excerpt: draft.excerpt,
          },
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'AI request failed')
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let assistantText = ''

      setAiMessages((prev) => [...prev, { role: 'assistant', text: '' }])

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          assistantText += decoder.decode(value, { stream: true })
          setAiMessages((prev) => {
            const updated = [...prev]
            updated[updated.length - 1] = { role: 'assistant', text: assistantText }
            return updated
          })
        }
      }

      if (action === 'generate_content') {
        handleContentChange(assistantText.trim())
      } else if (action === 'generate_seo') {
        try {
          const jsonMatch = assistantText.match(/```json\n([\s\S]*?)\n```/)
          if (jsonMatch) {
            const seoData = JSON.parse(jsonMatch[1])
            if (seoData.title) setSeo('title', seoData.title)
            if (seoData.description) setSeo('description', seoData.description)
            if (seoData.keywords) setSeo('keywords', seoData.keywords)
          }
        } catch { /* leave as chat text */ }
      } else if (action === 'generate_excerpt') {
        const cleaned = assistantText.replace(/^["']|["']$/g, '').trim()
        set('excerpt', cleaned)
      }
    } catch (e: unknown) {
      setAiMessages((prev) => [
        ...prev,
        { role: 'assistant', text: `Error: ${(e as Error).message}` },
      ])
    } finally {
      setAiLoading(false)
    }
  }

  function applyAiContent() {
    const last = [...aiMessages].reverse().find((m) => m.role === 'assistant')
    if (last) handleContentChange(last.text)
  }

  return (
    <div className="flex h-full overflow-hidden bg-[#f0f0f1]">
      {/* ── Left: editor ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Toolbar — h-12 */}
        <div className="h-12 flex items-center justify-between px-5 bg-white border-b border-[#c3c4c7] shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-semibold text-[#1d2327]">
              {mode === 'new' ? 'Add New Post' : 'Edit Post'}
            </h1>
            {draft.slug && (
              <a
                href={`/blog/${draft.slug}/`}
                target="_blank"
                className="text-xs text-[#2271b1] hover:underline"
              >
                View post ↗
              </a>
            )}
          </div>

          <div className="flex items-center gap-3">
            {saveSuccess && <span className="text-xs text-[#00a32a] font-medium">Post saved.</span>}
            {saveError && <span className="text-xs text-[#b32d2e]">{saveError}</span>}
            <button
              onClick={() => setAiPanel((v) => !v)}
              className="px-3 py-1.5 text-xs text-[#646970] border border-[#c3c4c7] rounded hover:bg-[#f6f7f7] transition-colors"
            >
              {aiPanel ? 'Hide AI' : 'AI Assistant'}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1.5 bg-[#2271b1] hover:bg-[#135e96] disabled:opacity-60 text-white text-sm font-medium rounded transition-colors"
            >
              {saving ? 'Saving…' : mode === 'new' ? 'Publish' : 'Update'}
            </button>
          </div>
        </div>

        {/* Tabs — h-10 */}
        <div className="h-10 flex items-center border-b border-[#c3c4c7] bg-white shrink-0">
          {(['content', 'seo', 'preview'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`h-full px-5 text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'text-[#1d2327] border-b-2 border-[#2271b1]'
                  : 'text-[#646970] hover:text-[#1d2327]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'content' && (
            <ContentTab
              draft={draft}
              onTitleChange={handleTitleChange}
              onSlugChange={(v) => set('slug', v)}
              onExcerptChange={(v) => set('excerpt', v)}
              onCategoryChange={(v) => set('category', v)}
              onAuthorChange={(v) => set('author', v)}
              onPublishedAtChange={(v) => set('publishedAt', v)}
              onReadTimeChange={(v) => set('readTime', v)}
              onFeaturedChange={(v) => set('featured', v)}
              onContentChange={handleContentChange}
              onImageUpload={handleImageUpload}
              onImageAltChange={(v) => set('imageAlt', v)}
              imageUploading={imageUploading}
              fileInputRef={fileInputRef}
              mode={mode}
            />
          )}
          {activeTab === 'seo' && (
            <SeoTab
              seo={draft.seo}
              onTitleChange={(v) => setSeo('title', v)}
              onDescriptionChange={(v) => setSeo('description', v)}
              onKeywordsChange={(v) => setSeo('keywords', v)}
              onGenerateSeo={() =>
                sendAiMessage(
                  `Generate SEO metadata for a blog post titled "${draft.title}". Return a JSON block with title (50-60 chars), description (150-160 chars), and keywords array (5-8 items).`,
                  'generate_seo'
                )
              }
            />
          )}
          {activeTab === 'preview' && <PreviewTab draft={draft} />}
        </div>
      </div>

      {/* ── Drag handle ── */}
      {aiPanel && (
        <div
          onMouseDown={startDrag}
          className="w-1 shrink-0 bg-[#c3c4c7] hover:bg-[#2271b1] cursor-col-resize transition-colors"
          title="Drag to resize"
        />
      )}

      {/* ── Right: AI Panel ── */}
      {aiPanel && (
        <div
          style={{ width: aiPanelWidth }}
          className="shrink-0 border-l border-[#c3c4c7] bg-white flex flex-col overflow-hidden"
        >
          {/* Header row 1 — h-12, matches toolbar */}
          <div className="h-12 flex items-center gap-2 px-4 border-b border-[#c3c4c7] shrink-0 bg-[#f6f7f7]">
            <SparklesIcon className="w-4 h-4 text-[#9b59b6] shrink-0" />
            <span className="text-sm font-semibold text-[#1d2327] truncate">AI Writing Assistant</span>
          </div>
          {/* Header row 2 — h-10, matches tabs */}
          <div className="h-10 flex items-center px-4 border-b border-[#c3c4c7] shrink-0 bg-[#f6f7f7]">
            <p className="text-xs text-[#646970]">Powered by Claude</p>
          </div>

          {/* Quick actions */}
          <div className="px-4 py-3 border-b border-[#c3c4c7] shrink-0">
            <p className="text-xs text-[#646970] mb-2 font-medium uppercase tracking-wider">Quick Actions</p>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                {
                  label: 'Write Draft',
                  action: 'generate_content',
                  msg: `Write a comprehensive, SEO-optimized blog post for We Buy Any Vegas House about: "${draft.title || 'cash home buying in Las Vegas'}". Category: ${draft.category}. Use ## for main sections, ### for subsections. Include local Las Vegas references. Write in a helpful, trustworthy tone. Output only the blog content in markdown.`,
                },
                {
                  label: 'Review',
                  action: 'review',
                  msg: `Review this blog post and give specific suggestions to improve it for SEO, readability, and conversion.\n\nTitle: "${draft.title}"\nContent:\n${draft.content || '(empty)'}`,
                },
                {
                  label: 'Improve',
                  action: 'generate_content',
                  msg: `Improve the writing quality of this blog content. Make it more engaging, clear, and persuasive. Keep the same structure but improve the prose.\n\n${draft.content || '(empty)'}`,
                },
                {
                  label: 'Excerpt',
                  action: 'generate_excerpt',
                  msg: `Write a compelling 1-2 sentence excerpt (under 160 characters) for this blog post titled "${draft.title}". Output only the excerpt, no quotes.`,
                },
                {
                  label: 'Add FAQs',
                  action: 'review',
                  msg: `Suggest 3-5 FAQ questions with answers for a blog post titled "${draft.title}". Format each as "**Q: question**\n\nA: answer"`,
                },
                {
                  label: 'SEO Meta',
                  action: 'generate_seo',
                  msg: `Generate SEO metadata for the blog post titled "${draft.title}" in the "${draft.category}" category. Return a JSON block with: title (50-60 chars), description (150-160 chars), keywords (array of 6-8 strings).`,
                },
              ].map(({ label, action, msg }) => (
                <button
                  key={label}
                  onClick={() => sendAiMessage(msg, action)}
                  disabled={aiLoading}
                  className="px-2 py-1.5 text-xs bg-[#f6f7f7] hover:bg-[#ececec] disabled:opacity-50 text-[#1d2327] border border-[#c3c4c7] rounded transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {aiMessages.length === 0 && (
              <p className="text-xs text-[#a7aaad] text-center mt-4">
                Use quick actions above or type a message to get help.
              </p>
            )}
            {aiMessages.map((msg, i) => (
              <div key={i} className={`text-xs ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                <div
                  className={`inline-block max-w-full px-3 py-2 rounded text-left whitespace-pre-wrap break-words ${
                    msg.role === 'user'
                      ? 'bg-[#2271b1] text-white'
                      : 'bg-[#f6f7f7] border border-[#c3c4c7] text-[#1d2327]'
                  }`}
                >
                  {msg.text || (aiLoading && i === aiMessages.length - 1 ? '…' : '')}
                </div>
                {msg.role === 'assistant' && i === aiMessages.length - 1 && !aiLoading && (
                  <div className="mt-1 flex gap-3">
                    <button
                      onClick={applyAiContent}
                      className="text-[11px] text-[#2271b1] hover:underline"
                    >
                      Apply as content
                    </button>
                    <button
                      onClick={() => navigator.clipboard.writeText(msg.text)}
                      className="text-[11px] text-[#646970] hover:underline"
                    >
                      Copy
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-[#c3c4c7] shrink-0">
            <div className="flex gap-2">
              <textarea
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    if (aiInput.trim()) sendAiMessage(aiInput)
                  }
                }}
                placeholder="Ask Claude anything…"
                rows={2}
                className="flex-1 resize-none border border-[#c3c4c7] rounded px-2.5 py-1.5 text-xs text-[#1d2327] placeholder-[#a7aaad] focus:outline-none focus:border-[#2271b1]"
              />
              <button
                onClick={() => aiInput.trim() && sendAiMessage(aiInput)}
                disabled={aiLoading || !aiInput.trim()}
                className="px-2.5 py-1.5 bg-[#2271b1] hover:bg-[#135e96] disabled:opacity-40 text-white rounded transition-colors self-end"
              >
                <SendIcon className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[10px] text-[#a7aaad] mt-1">Enter to send · Shift+Enter for newline</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ──

function ContentTab({
  draft,
  onTitleChange,
  onSlugChange,
  onExcerptChange,
  onCategoryChange,
  onAuthorChange,
  onPublishedAtChange,
  onReadTimeChange,
  onFeaturedChange,
  onContentChange,
  onImageUpload,
  onImageAltChange,
  imageUploading,
  fileInputRef,
  mode,
}: {
  draft: BlogPostDraft
  onTitleChange: (v: string) => void
  onSlugChange: (v: string) => void
  onExcerptChange: (v: string) => void
  onCategoryChange: (v: string) => void
  onAuthorChange: (v: string) => void
  onPublishedAtChange: (v: string) => void
  onReadTimeChange: (v: string) => void
  onFeaturedChange: (v: boolean) => void
  onContentChange: (v: string) => void
  onImageUpload: (file: File) => void
  onImageAltChange: (v: string) => void
  imageUploading: boolean
  fileInputRef: React.RefObject<HTMLInputElement | null>
  mode: 'new' | 'edit'
}) {
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files[0]
      if (file?.type.startsWith('image/')) onImageUpload(file)
    },
    [onImageUpload]
  )

  return (
    <div className="p-5 space-y-4 max-w-4xl">
      {/* Title */}
      <div>
        <input
          value={draft.title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Add title"
          className="w-full border border-[#c3c4c7] rounded px-3 py-2.5 text-xl font-semibold text-[#1d2327] placeholder-[#a7aaad] focus:outline-none focus:border-[#2271b1] bg-white"
        />
      </div>

      {/* Permalink */}
      <div className="flex items-center gap-2 text-sm text-[#646970]">
        <span>Permalink:</span>
        <span className="text-[#a7aaad]">webuyanyvegashouse.com/blog/</span>
        <input
          value={draft.slug}
          onChange={(e) => onSlugChange(e.target.value)}
          className="border-b border-[#c3c4c7] focus:border-[#2271b1] focus:outline-none text-[#2271b1] text-sm font-mono min-w-0 bg-transparent"
          style={{ width: `${Math.max(10, draft.slug.length)}ch` }}
          readOnly={mode === 'edit'}
          title={mode === 'edit' ? 'Slug cannot be changed after publishing' : undefined}
        />
        {mode === 'edit' && (
          <span className="text-xs text-[#a7aaad]">(locked after publish)</span>
        )}
      </div>

      {/* Metadata row */}
      <div className="grid grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-medium text-[#646970] mb-1">Category</label>
          <select
            value={draft.category}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full border border-[#c3c4c7] rounded px-2 py-1.5 text-sm text-[#1d2327] focus:outline-none focus:border-[#2271b1] bg-white"
          >
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#646970] mb-1">Author</label>
          <input
            value={draft.author}
            onChange={(e) => onAuthorChange(e.target.value)}
            className="w-full border border-[#c3c4c7] rounded px-2 py-1.5 text-sm text-[#1d2327] focus:outline-none focus:border-[#2271b1] bg-white"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#646970] mb-1">Publish Date</label>
          <input
            type="date"
            value={draft.publishedAt.split('T')[0]}
            onChange={(e) =>
              onPublishedAtChange(e.target.value ? `${e.target.value}T10:00:00` : draft.publishedAt)
            }
            className="w-full border border-[#c3c4c7] rounded px-2 py-1.5 text-sm text-[#1d2327] focus:outline-none focus:border-[#2271b1] bg-white"
          />
        </div>
        <div className="flex items-end pb-1.5">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={draft.featured}
              onChange={(e) => onFeaturedChange(e.target.checked)}
              className="w-4 h-4 accent-[#2271b1]"
            />
            <span className="text-sm text-[#1d2327]">Featured</span>
          </label>
        </div>
      </div>

      {/* Excerpt */}
      <div>
        <label className="block text-xs font-medium text-[#646970] mb-1">
          Excerpt <span className="font-normal text-[#a7aaad]">{draft.excerpt.length} chars</span>
        </label>
        <textarea
          value={draft.excerpt}
          onChange={(e) => onExcerptChange(e.target.value)}
          rows={2}
          placeholder="Short description shown in blog listings…"
          className="w-full border border-[#c3c4c7] rounded px-3 py-2 text-sm text-[#1d2327] placeholder-[#a7aaad] focus:outline-none focus:border-[#2271b1] resize-none bg-white"
        />
      </div>

      {/* Featured Image */}
      <div>
        <label className="block text-xs font-medium text-[#646970] mb-1">Featured Image</label>
        <div
          className={`border-2 border-dashed rounded p-4 transition-colors ${
            imageUploading
              ? 'border-[#2271b1] bg-blue-50'
              : 'border-[#c3c4c7] hover:border-[#a7aaad] bg-white'
          }`}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          {draft.image ? (
            <div className="flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={draft.image}
                alt={draft.imageAlt}
                className="w-20 h-14 object-cover rounded border border-[#c3c4c7]"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#1d2327] font-mono truncate">{draft.image}</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-[#2271b1] hover:underline mt-0.5"
                >
                  Replace image
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-1">
              <p className="text-sm text-[#646970]">
                {imageUploading ? 'Uploading…' : 'Drop an image here, or'}
              </p>
              {!imageUploading && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm text-[#2271b1] hover:underline mt-0.5"
                >
                  select a file
                </button>
              )}
              <p className="text-xs text-[#a7aaad] mt-1">JPG, PNG, WebP · max 5 MB</p>
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onImageUpload(file)
          }}
        />
        <input
          value={draft.imageAlt}
          onChange={(e) => onImageAltChange(e.target.value)}
          placeholder="Image alt text"
          className="w-full mt-2 border border-[#c3c4c7] rounded px-3 py-1.5 text-sm text-[#1d2327] placeholder-[#a7aaad] focus:outline-none focus:border-[#2271b1] bg-white"
        />
      </div>

      {/* Content editor */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-medium text-[#646970]">Content (Markdown)</label>
          <span className="text-xs text-[#a7aaad]">{draft.readTime}</span>
        </div>
        <MarkdownEditor content={draft.content} onChange={onContentChange} />
        <p className="text-xs text-[#a7aaad] mt-1">
          ## Heading · ### Sub-heading · **bold** · [link](url) · - list item
        </p>
      </div>
    </div>
  )
}

function MarkdownEditor({ content, onChange }: { content: string; onChange: (v: string) => void }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function insert(before: string, after = '') {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = content.slice(start, end)
    onChange(content.slice(0, start) + before + selected + after + content.slice(end))
    setTimeout(() => {
      ta.selectionStart = start + before.length
      ta.selectionEnd = start + before.length + selected.length
      ta.focus()
    }, 0)
  }

  return (
    <div className="border border-[#c3c4c7] rounded overflow-hidden bg-white">
      <div className="flex items-center gap-1 px-3 py-1.5 bg-[#f6f7f7] border-b border-[#c3c4c7]">
        <TBtn label="H2" onClick={() => insert('\n\n## ', '\n\n')} />
        <TBtn label="H3" onClick={() => insert('\n\n### ', '\n\n')} />
        <TSep />
        <TBtn label="B" bold onClick={() => insert('**', '**')} />
        <TBtn label="Link" onClick={() => insert('[', '](url)')} />
        <TBtn label="• List" onClick={() => insert('\n\n- ')} />
        <TSep />
        <TBtn label="¶" onClick={() => insert('\n\n')} title="Paragraph break" />
      </div>
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => onChange(e.target.value)}
        rows={30}
        placeholder="Start writing your post…&#10;&#10;## Introduction&#10;&#10;Your opening paragraph here…&#10;&#10;## Section 2&#10;&#10;More content…"
        className="w-full px-4 py-3 text-sm text-[#1d2327] font-mono leading-relaxed placeholder-[#c3c4c7] focus:outline-none resize-none"
      />
    </div>
  )
}

function TBtn({ label, onClick, bold, title }: { label: string; onClick: () => void; bold?: boolean; title?: string }) {
  return (
    <button
      type="button"
      title={title || label}
      onClick={onClick}
      className={`px-2 py-0.5 text-xs rounded text-[#646970] hover:bg-[#ececec] hover:text-[#1d2327] transition-colors ${bold ? 'font-bold' : ''}`}
    >
      {label}
    </button>
  )
}

function TSep() {
  return <span className="w-px h-3.5 bg-[#c3c4c7] mx-0.5" />
}

function SeoTab({
  seo,
  onTitleChange,
  onDescriptionChange,
  onKeywordsChange,
  onGenerateSeo,
}: {
  seo: BlogPostDraft['seo']
  onTitleChange: (v: string) => void
  onDescriptionChange: (v: string) => void
  onKeywordsChange: (v: string[]) => void
  onGenerateSeo: () => void
}) {
  const [kwInput, setKwInput] = useState(seo.keywords.join(', '))

  return (
    <div className="p-5 space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-[#1d2327]">SEO Settings</h2>
        <button
          onClick={onGenerateSeo}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#f6f7f7] hover:bg-[#ececec] text-[#1d2327] border border-[#c3c4c7] rounded transition-colors"
        >
          <SparklesIcon className="w-3.5 h-3.5 text-[#9b59b6]" />
          Generate with AI
        </button>
      </div>

      <div>
        <label className="block text-xs font-medium text-[#646970] mb-1">
          SEO Title
          <span className={`ml-2 font-normal ${seo.title.length > 60 ? 'text-[#b32d2e]' : 'text-[#a7aaad]'}`}>
            {seo.title.length}/60
          </span>
        </label>
        <input
          value={seo.title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="SEO-optimized page title (50-60 chars)"
          className="w-full border border-[#c3c4c7] rounded px-3 py-2 text-sm text-[#1d2327] placeholder-[#a7aaad] focus:outline-none focus:border-[#2271b1] bg-white"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-[#646970] mb-1">
          Meta Description
          <span className={`ml-2 font-normal ${seo.description.length > 160 ? 'text-[#b32d2e]' : 'text-[#a7aaad]'}`}>
            {seo.description.length}/160
          </span>
        </label>
        <textarea
          value={seo.description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={3}
          placeholder="Compelling meta description (150-160 chars)"
          className="w-full border border-[#c3c4c7] rounded px-3 py-2 text-sm text-[#1d2327] placeholder-[#a7aaad] focus:outline-none focus:border-[#2271b1] resize-none bg-white"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-[#646970] mb-1">Keywords (comma-separated)</label>
        <input
          value={kwInput}
          onChange={(e) => {
            setKwInput(e.target.value)
            onKeywordsChange(e.target.value.split(',').map((k) => k.trim()).filter(Boolean))
          }}
          placeholder="sell house fast, las vegas, cash buyer…"
          className="w-full border border-[#c3c4c7] rounded px-3 py-2 text-sm text-[#1d2327] placeholder-[#a7aaad] focus:outline-none focus:border-[#2271b1] bg-white"
        />
        <div className="flex flex-wrap gap-1.5 mt-2">
          {seo.keywords.map((kw) => (
            <span key={kw} className="px-2 py-0.5 bg-[#f6f7f7] border border-[#c3c4c7] rounded text-xs text-[#646970]">
              {kw}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function PreviewTab({ draft }: { draft: BlogPostDraft }) {
  const wordCount = draft.content.trim().split(/\s+/).length

  return (
    <div className="p-5">
      <div className="max-w-2xl mx-auto bg-white border border-[#c3c4c7] rounded shadow-sm p-6">
        {/* SERP snippet */}
        <div className="bg-[#f6f7f7] border border-[#c3c4c7] rounded p-3 mb-5 text-xs">
          <p className="text-[#006621]">webuyanyvegashouse.com › blog › {draft.slug}</p>
          <p className="text-[#1a0dab] font-medium text-sm mt-0.5">{draft.seo.title || draft.title}</p>
          <p className="text-[#545454] mt-0.5">{draft.seo.description || draft.excerpt}</p>
        </div>

        {draft.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={draft.image} alt={draft.imageAlt} className="w-full h-44 object-cover rounded mb-4" />
        )}
        <div className="flex items-center gap-2 text-xs text-[#646970] mb-3">
          <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded font-medium">
            {draft.category}
          </span>
          <span>{draft.readTime}</span>
          <span>·</span>
          <span>{wordCount} words</span>
          <span>·</span>
          <span>{draft.author}</span>
        </div>
        <h1 className="text-2xl font-bold text-[#1d2327] mb-3">{draft.title || 'Untitled Post'}</h1>
        {draft.excerpt && (
          <p className="text-[#646970] border-l-4 border-[#2271b1] pl-3 mb-4">{draft.excerpt}</p>
        )}
        <div className="text-sm text-[#1d2327] space-y-2">
          <MarkdownPreview content={draft.content} />
        </div>
      </div>
    </div>
  )
}

function MarkdownPreview({ content }: { content: string }) {
  if (!content) return <p className="text-[#a7aaad] italic">No content yet…</p>

  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let key = 0

  for (const line of lines) {
    if (line.startsWith('## ')) {
      elements.push(<h2 key={key++} className="text-lg font-bold text-[#1d2327] mt-5 mb-2">{line.slice(3)}</h2>)
    } else if (line.startsWith('### ')) {
      elements.push(<h3 key={key++} className="text-base font-semibold text-[#1d2327] mt-4 mb-1">{line.slice(4)}</h3>)
    } else if (line.startsWith('- ')) {
      elements.push(<li key={key++} className="ml-4 list-disc text-[#1d2327]">{renderInline(line.slice(2))}</li>)
    } else if (line.trim() === '') {
      elements.push(<div key={key++} className="h-1.5" />)
    } else {
      elements.push(<p key={key++} className="text-[#1d2327] leading-relaxed">{renderInline(line)}</p>)
    }
  }
  return <>{elements}</>
}

function renderInline(text: string): React.ReactNode {
  return text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>
    const m = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (m) return <a key={i} href={m[2]} className="text-[#2271b1] underline">{m[1]}</a>
    return part
  })
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  )
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
    </svg>
  )
}
