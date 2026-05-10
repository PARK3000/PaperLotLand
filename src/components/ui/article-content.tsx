'use client'

import Image from 'next/image'
import { slugify } from '@/lib/utils'
import { MidArticleCta } from './mid-article-cta'

export { extractTocItems } from './article-content-utils'

function stripHeadingMarkdown(text: string): string {
  return text
    .replace(/\*\*/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim()
}

function stripForId(text: string): string {
  return text
    .replace(/\*\*/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[\u{1F300}-\u{1FAF8}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}]/gu, '')
    .trim()
}

/**
 * Render inline markdown (links and bold) to React elements.
 */
function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  let remaining = text
  let key = 0

  while (remaining.length > 0) {
    const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/)
    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/)

    if (!linkMatch && !boldMatch) {
      parts.push(remaining)
      break
    }

    const linkIdx = linkMatch ? remaining.indexOf(linkMatch[0]) : Infinity
    const boldIdx = boldMatch ? remaining.indexOf(boldMatch[0]) : Infinity

    if (linkIdx <= boldIdx && linkMatch) {
      if (linkIdx > 0) parts.push(remaining.slice(0, linkIdx))
      parts.push(
        <a
          key={key++}
          href={linkMatch[2]}
          className="text-[var(--color-primary)] underline hover:text-[var(--color-primary-700)]"
        >
          {linkMatch[1]}
        </a>
      )
      remaining = remaining.slice(linkIdx + linkMatch[0].length)
    } else if (boldMatch) {
      if (boldIdx > 0) parts.push(remaining.slice(0, boldIdx))
      parts.push(<strong key={key++}>{boldMatch[1]}</strong>)
      remaining = remaining.slice(boldIdx + boldMatch[0].length)
    }
  }

  return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : <>{parts}</>
}

/**
 * Parse a markdown table block into header + rows.
 */
function parseTable(block: string): { headers: string[]; rows: string[][] } | null {
  const lines = block.split('\n').map((l) => l.trim()).filter(Boolean)
  if (lines.length < 3) return null
  if (!lines[0].startsWith('|') || !lines[1].match(/^\|[\s\-|:]+\|$/)) return null

  const parseRow = (line: string) =>
    line.split('|').slice(1, -1).map((cell) => cell.trim())

  const headers = parseRow(lines[0])
  const rows = lines.slice(2).map(parseRow)
  return { headers, rows }
}

/**
 * Detect if a list block is a pros/cons list (all items start with ✅ or ❌).
 */
function isProsConsList(items: string[]): boolean {
  if (items.length === 0) return false
  return items.every((item) => {
    const text = item.replace(/^- /, '').trim()
    return text.startsWith('✅') || text.startsWith('❌')
  })
}

/**
 * Render the body lines of an expandable block (supports lists and paragraphs).
 */
function renderExpandableBody(lines: string[]): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  let listBuffer: string[] = []
  let key = 0

  const flushList = () => {
    if (listBuffer.length === 0) return
    nodes.push(
      <ul key={key++} className="mt-3 space-y-1.5 pl-1">
        {listBuffer.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5 text-[var(--color-text-muted)]">
            <svg className="mt-[0.45em] h-2 w-2 shrink-0 text-[#5b8ed6]" viewBox="0 0 8 8" fill="currentColor">
              <circle cx="4" cy="4" r="4" />
            </svg>
            <span>{renderInline(item.replace(/^- /, ''))}</span>
          </li>
        ))}
      </ul>
    )
    listBuffer = []
  }

  for (const line of lines) {
    if (line.startsWith('- ')) {
      listBuffer.push(line)
    } else {
      flushList()
      if (line.trim()) {
        nodes.push(
          <p key={key++} className="mt-3 text-[var(--color-text-muted)]">
            {renderInline(line)}
          </p>
        )
      }
    }
  }
  flushList()
  return nodes
}

interface ArticleContentProps {
  content: string
}

export function ArticleContent({ content }: ArticleContentProps) {
  const paragraphs = content.split('\n\n').filter((p) => p.trim())

  let h2Count = 0
  const elements: React.ReactNode[] = []

  paragraphs.forEach((paragraph, index) => {
    const trimmed = paragraph.trim()

    // H2 heading — inject mid-article CTA after every 2nd H2
    if (trimmed.startsWith('## ')) {
      h2Count++
      const raw = trimmed.replace('## ', '')
      const text = stripHeadingMarkdown(raw)
      const id = slugify(stripForId(raw))

      if (h2Count > 1 && h2Count % 2 === 0) {
        elements.push(<MidArticleCta key={`cta-${index}`} />)
      }

      elements.push(
        <h2
          key={index}
          id={id}
          className="group mt-10 scroll-mt-24 text-2xl font-bold text-[#1a4070]"
        >
          {text}
          <a
            href={`#${id}`}
            className="ml-2 opacity-0 transition-opacity group-hover:opacity-50"
            aria-label={`Link to ${text}`}
          >
            #
          </a>
        </h2>
      )
      return
    }

    // H3 heading
    if (trimmed.startsWith('### ')) {
      const raw = trimmed.replace('### ', '')
      const text = stripHeadingMarkdown(raw)
      const id = slugify(stripForId(raw))
      elements.push(
        <h3
          key={index}
          id={id}
          className="group mt-8 scroll-mt-24 text-xl font-bold text-[#1a4070]"
        >
          {text}
          <a
            href={`#${id}`}
            className="ml-2 opacity-0 transition-opacity group-hover:opacity-50"
            aria-label={`Link to ${text}`}
          >
            #
          </a>
        </h3>
      )
      return
    }

    // Expandable/collapsible section — syntax: ">>> Title\nBody line 1\nBody line 2"
    if (trimmed.startsWith('>>> ')) {
      const lines = trimmed.split('\n')
      const title = lines[0].replace('>>> ', '').trim()
      const bodyLines = lines.slice(1)

      elements.push(
        <details
          key={index}
          className="group mt-4 rounded-xl border border-slate-200 open:border-slate-300"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-base font-semibold text-[var(--color-primary)] hover:bg-slate-50">
            <span>{title}</span>
            <span className="ml-4 shrink-0 text-slate-400 transition-transform group-open:rotate-45">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </span>
          </summary>
          <div className="border-t border-slate-200 px-5 pb-5">
            {renderExpandableBody(bodyLines)}
          </div>
        </details>
      )
      return
    }

    // Markdown table
    if (trimmed.startsWith('|')) {
      const table = parseTable(trimmed)
      if (table) {
        elements.push(
          <div key={index} className="mt-8 overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--color-primary)]">
                  {table.headers.map((h, i) => (
                    <th
                      key={i}
                      className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-white"
                    >
                      {renderInline(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {table.rows.map((row, ri) => (
                  <tr
                    key={ri}
                    className="transition-colors hover:bg-blue-50"
                  >
                    {row.map((cell, ci) => (
                      <td
                        key={ci}
                        className={
                          ci === 0
                            ? 'px-5 py-4 font-semibold text-[var(--color-text)]'
                            : 'px-5 py-4 text-slate-600'
                        }
                      >
                        {renderInline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
        return
      }
    }

    // List block
    if (trimmed.includes('\n- ') || trimmed.startsWith('- ')) {
      const rawItems = trimmed.split('\n').filter((l) => l.trim().startsWith('- '))
      const items = rawItems.map((l) => l.trim())

      if (isProsConsList(items)) {
        const pros = items.filter((i) => i.replace(/^- /, '').startsWith('✅'))
        const cons = items.filter((i) => i.replace(/^- /, '').startsWith('❌'))

        elements.push(
          <div key={index} className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="grid sm:grid-cols-2 sm:divide-x sm:divide-slate-200">
              {pros.length > 0 && (
                <div className="p-5">
                  <p className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Pros</p>
                  <ul className="space-y-2.5">
                    {pros.map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                        <svg className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                        </svg>
                        <span>{renderInline(item.replace(/^- ✅\s*/, ''))}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {cons.length > 0 && (
                <div className="border-t border-slate-200 p-5 sm:border-t-0">
                  <p className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Cons</p>
                  <ul className="space-y-2.5">
                    {cons.map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                        <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                        </svg>
                        <span>{renderInline(item.replace(/^- ❌\s*/, ''))}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )
        return
      }

      // Regular list
      elements.push(
        <ul key={index} className="mt-4 space-y-2 pl-2">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-[var(--color-text-muted)]">
              <svg className="mt-[0.45em] h-2 w-2 shrink-0 text-[#5b8ed6]" viewBox="0 0 8 8" fill="currentColor">
                <circle cx="4" cy="4" r="4" />
              </svg>
              <span>{renderInline(item.replace(/^- /, ''))}</span>
            </li>
          ))}
        </ul>
      )
      return
    }

    // Markdown image: ![alt text](path)
    if (trimmed.startsWith('![')) {
      const match = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/)
      if (match) {
        elements.push(
          <div key={index} className="my-8 overflow-hidden rounded-2xl shadow-sm">
            <Image
              src={match[2]}
              alt={match[1]}
              width={800}
              height={500}
              className="w-full object-cover"
            />
          </div>
        )
        return
      }
    }

    // Regular paragraph
    elements.push(
      <p key={index} className="mt-4 text-[var(--color-text-muted)]">
        {renderInline(trimmed)}
      </p>
    )
  })

  return (
    <div className="prose prose-lg max-w-none">
      {elements}
    </div>
  )
}
