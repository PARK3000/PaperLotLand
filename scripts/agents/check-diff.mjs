#!/usr/bin/env node
/**
 * Validates the staged diff against scripts/agents/policy.json:
 *   - paths must match safe_fix_allowlist[<label>].paths
 *   - excluded paths are hard-NACK
 *   - diff_size_caps enforced
 *   - per-label regex diff_filter applied to added/removed lines
 *
 * Reads ISSUE_LABELS env var (JSON array of {name}). Exits non-zero on violation.
 */

import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const policy = JSON.parse(readFileSync(resolve(__dirname, 'policy.json'), 'utf-8'))

const labels = JSON.parse(process.env.ISSUE_LABELS ?? '[]').map((l) => l.name)
const fixLabel = labels.find((l) => l.startsWith('fix:'))
if (!fixLabel) {
  console.error('No fix:* label on issue — refusing to validate diff.')
  process.exit(1)
}

const rule = policy.safe_fix_allowlist[fixLabel]
if (!rule) {
  console.error(`No allowlist entry for label ${fixLabel}.`)
  process.exit(1)
}

// Glob → regex (basic ** + * support)
function globToRegex(glob) {
  const re = glob
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '::DOUBLESTAR::')
    .replace(/\*/g, '[^/]*')
    .replace(/::DOUBLESTAR::/g, '.*')
  return new RegExp('^' + re + '$')
}
const allowedRegexes = rule.paths.map(globToRegex)
const excludedRegexes = policy.explicitly_excluded_paths.map((p) => globToRegex(p))

const changedFiles = execFileSync('git', ['diff', '--name-only', 'origin/main...HEAD'], {
  encoding: 'utf-8',
})
  .trim()
  .split('\n')
  .filter(Boolean)

if (changedFiles.length > policy.diff_size_caps.max_files_changed) {
  console.error(`Too many files: ${changedFiles.length} > ${policy.diff_size_caps.max_files_changed}`)
  process.exit(1)
}

for (const f of changedFiles) {
  if (excludedRegexes.some((r) => r.test(f))) {
    console.error(`Excluded path edited: ${f}`)
    process.exit(1)
  }
  if (!allowedRegexes.some((r) => r.test(f))) {
    console.error(`Path outside allowlist for ${fixLabel}: ${f}`)
    process.exit(1)
  }
}

const diff = execFileSync('git', ['diff', '--unified=0', 'origin/main...HEAD'], { encoding: 'utf-8' })
const addedLines = diff.split('\n').filter((l) => l.startsWith('+') && !l.startsWith('+++'))
const removedLines = diff.split('\n').filter((l) => l.startsWith('-') && !l.startsWith('---'))

const totalChanged = addedLines.length + removedLines.length
if (totalChanged > policy.diff_size_caps.max_lines_changed) {
  console.error(`Too many lines changed: ${totalChanged} > ${policy.diff_size_caps.max_lines_changed}`)
  process.exit(1)
}

const filter = rule.diff_filter
if (filter.added_lines_must_match) {
  const re = new RegExp(filter.added_lines_must_match)
  const ignoreRe = filter.ignore_pattern ? new RegExp(filter.ignore_pattern) : null
  for (const l of addedLines) {
    if (ignoreRe && ignoreRe.test(l)) continue
    if (!re.test(l)) {
      console.error(`Added line fails diff_filter (${fixLabel}): ${l}`)
      process.exit(1)
    }
  }
}
if (filter.removed_lines_must_match) {
  const re = new RegExp(filter.removed_lines_must_match)
  const ignoreRe = filter.ignore_pattern ? new RegExp(filter.ignore_pattern) : null
  for (const l of removedLines) {
    if (ignoreRe && ignoreRe.test(l)) continue
    if (!re.test(l)) {
      console.error(`Removed line fails diff_filter (${fixLabel}): ${l}`)
      process.exit(1)
    }
  }
}

console.log(`Diff OK: ${changedFiles.length} file(s), ${totalChanged} line(s) under ${fixLabel} allowlist.`)
