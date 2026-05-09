import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

// ---------------------------------------------------------------------------
// Regression guard for nested interactive elements.
//
// Background: We shipped 4215d2f after Clarity surfaced 215 dead clicks on the
// "Get My Free Cash Offer" CTA in 30 days. Root cause: <Link><Button>...</Button></Link>
// renders as <a><button>... — invalid HTML. iOS Safari inconsistently swallows
// the touch event on the inner <button>, so the outer <a>'s navigation never
// fires and the CTA appears unresponsive.
//
// This test scans the source tree for that anti-pattern (and a few siblings)
// so it can't silently come back during refactors.
// ---------------------------------------------------------------------------

const ROOT = process.cwd()
const SRC_DIR = path.join(ROOT, 'src')

function walkTsx(dir: string): string[] {
  const out: string[] = []
  if (!fs.existsSync(dir)) return out
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      out.push(...walkTsx(full))
    } else if (/\.tsx$/.test(entry.name)) {
      out.push(full)
    }
  }
  return out
}

interface Violation {
  file: string
  line: number
  snippet: string
  pattern: string
}

// Match a parent opening tag followed (within ~6 lines, allowing JSX attribute
// wrapping and whitespace) by a forbidden child opening tag. We don't need a
// full JSX parser — these patterns appear in a tight, recognizable shape.
function findViolations(
  files: string[],
  parent: RegExp,
  child: RegExp,
  patternLabel: string
): Violation[] {
  const violations: Violation[] = []
  for (const file of files) {
    const lines = fs.readFileSync(file, 'utf8').split('\n')
    for (let i = 0; i < lines.length; i++) {
      if (!parent.test(lines[i])) continue
      // Look ahead up to 6 lines for the child tag, but stop if we hit a
      // closing tag for the parent or another opening interactive sibling.
      for (let j = i + 1; j < Math.min(i + 7, lines.length); j++) {
        if (child.test(lines[j])) {
          violations.push({
            file: path.relative(ROOT, file),
            line: i + 1,
            snippet: `${lines[i].trim()} … ${lines[j].trim()}`,
            pattern: patternLabel,
          })
          break
        }
        // Stop scanning if we hit JSX content that closes/breaks the wrapper.
        if (/<\/Link>|<\/a>/.test(lines[j])) break
      }
    }
  }
  return violations
}

const TSX_FILES = walkTsx(SRC_DIR)

describe('no nested interactive elements', () => {
  it('finds tsx files to scan', () => {
    expect(TSX_FILES.length).toBeGreaterThan(50)
  })

  it('has no <Link><Button> nesting', () => {
    const violations = findViolations(
      TSX_FILES,
      /<Link\b/,
      /<Button\b/,
      '<Link><Button>'
    )
    if (violations.length) {
      const msg = violations
        .map((v) => `  ${v.file}:${v.line}  ${v.snippet}`)
        .join('\n')
      throw new Error(
        `Found ${violations.length} <Link><Button> nesting violation(s):\n${msg}\n\n` +
          `Use buttonClassName() from '@/components/ui/Button' on the <Link> instead. ` +
          `See commit 4215d2f for context.`
      )
    }
  })

  it('has no <Link><button> (lowercase) nesting', () => {
    const violations = findViolations(
      TSX_FILES,
      /<Link\b/,
      /<button\b/,
      '<Link><button>'
    )
    expect(violations, JSON.stringify(violations, null, 2)).toEqual([])
  })

  it('has no <a><Button> nesting (use PhoneLink for tel:)', () => {
    const violations = findViolations(
      TSX_FILES,
      /<a\s+href=/,
      /<Button\b/,
      '<a><Button>'
    )
    if (violations.length) {
      const msg = violations
        .map((v) => `  ${v.file}:${v.line}  ${v.snippet}`)
        .join('\n')
      throw new Error(
        `Found ${violations.length} <a><Button> nesting violation(s):\n${msg}\n\n` +
          `For tel: links use <PhoneLink className={buttonClassName(...)}>. ` +
          `For other anchors use <a className={buttonClassName(...)}> directly.`
      )
    }
  })

  it('has no <a><button> (lowercase) nesting', () => {
    const violations = findViolations(
      TSX_FILES,
      /<a\s+href=/,
      /<button\b/,
      '<a><button>'
    )
    expect(violations, JSON.stringify(violations, null, 2)).toEqual([])
  })

  // Hero-pill click-target pattern (fix/hero-pill-click-target): we wrap the
  // address input in <label htmlFor> so clicks on the white pill chrome focus
  // the input. That's safe — but nesting <button> or <a> inside a <label> with
  // htmlFor causes double-fire (label click → input focus → bubbled click on
  // the button) and is invalid HTML. Don't reintroduce it.
  it('has no <label htmlFor><button> nesting', () => {
    const violations = findViolations(
      TSX_FILES,
      /<label\s+[^>]*htmlFor=/,
      /<button\b/,
      '<label htmlFor><button>'
    )
    expect(violations, JSON.stringify(violations, null, 2)).toEqual([])
  })

  it('has no <label htmlFor><a> nesting', () => {
    const violations = findViolations(
      TSX_FILES,
      /<label\s+[^>]*htmlFor=/,
      /<a\s+href=/,
      '<label htmlFor><a>'
    )
    expect(violations, JSON.stringify(violations, null, 2)).toEqual([])
  })
})
