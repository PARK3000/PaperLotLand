import { Fragment } from 'react'
import { cn } from '@/lib/utils'
import type { FAQBodySection, FAQItem, FAQTable } from '@/lib/site-content'

/**
 * Shared structured-FAQ body renderer. Used by the homepage FAQ accordion
 * and by per-page FAQ sections (situation, location, answer-first templates).
 *
 * Rendering precedence:
 *   1. If `body` is provided, render `summary` as a lead paragraph followed by
 *      structured sections (heading, paragraphs, bullets, numbered, table, callout).
 *   2. If only `answer` is provided (legacy seeded data), render as a single paragraph.
 */
export function FAQBody({ faq }: { faq: FAQItem }) {
  const summary = faq.summary ?? faq.answer ?? ''
  const hasStructuredBody = (faq.body?.length ?? 0) > 0

  if (!faq.summary && !hasStructuredBody) {
    return <p className="text-[var(--color-text-muted)]">{summary}</p>
  }

  return (
    <div className="space-y-5 text-[var(--color-text-muted)]">
      {summary && (
        <p className="font-medium text-[var(--color-text)]">{summary}</p>
      )}
      {faq.body?.map((section, idx) => (
        <FAQSectionBlock key={idx} section={section} />
      ))}
    </div>
  )
}

function FAQSectionBlock({ section }: { section: FAQBodySection }) {
  return (
    <div className="space-y-3">
      {section.heading && (
        <h4 className="text-base font-bold text-[var(--color-text)]">
          {section.heading}
        </h4>
      )}
      {section.paragraphs?.map((p, i) => (
        <p key={i}>{renderInline(p)}</p>
      ))}
      {section.bullets && section.bullets.length > 0 && (
        <ul className="ml-5 list-disc space-y-1">
          {section.bullets.map((b, i) => (
            <li key={i}>{renderInline(b)}</li>
          ))}
        </ul>
      )}
      {section.numbered && section.numbered.length > 0 && (
        <ol className="ml-5 list-decimal space-y-1">
          {section.numbered.map((b, i) => (
            <li key={i}>{renderInline(b)}</li>
          ))}
        </ol>
      )}
      {section.table && <FAQTableBlock table={section.table} />}
      {section.callout && (
        <p className="rounded-md border-l-4 border-[var(--color-primary)] bg-[var(--color-primary-50)] px-4 py-3 text-[var(--color-text)]">
          {renderInline(section.callout)}
        </p>
      )}
    </div>
  )
}

function FAQTableBlock({ table }: { table: FAQTable }) {
  return (
    <div className="-mx-2 overflow-x-auto">
      <table className="w-full min-w-[480px] border-collapse text-sm">
        {table.caption && (
          <caption className="mb-2 text-left text-xs italic text-[var(--color-text-muted)]">
            {table.caption}
          </caption>
        )}
        <thead>
          <tr className="border-b border-[var(--color-border)]">
            {table.headers.map((h, i) => (
              <th
                key={i}
                className={cn(
                  'px-3 py-2 text-left font-semibold text-[var(--color-text)]',
                  table.highlightColumnIndex === i &&
                    'bg-[var(--color-primary-50)]'
                )}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, rIdx) => (
            <tr
              key={rIdx}
              className="border-b border-[var(--color-border)] last:border-b-0"
            >
              {row.map((cell, cIdx) => (
                <td
                  key={cIdx}
                  className={cn(
                    'px-3 py-2 align-top',
                    table.highlightColumnIndex === cIdx &&
                      'bg-[var(--color-primary-50)] font-medium text-[var(--color-text)]'
                  )}
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
}

/**
 * Minimal inline formatter: supports `**bold**` segments. Keeps the renderer
 * dependency-free; no Markdown engine, no XSS surface.
 */
function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-[var(--color-text)]">
          {part.slice(2, -2)}
        </strong>
      )
    }
    return <Fragment key={i}>{part}</Fragment>
  })
}
