#!/usr/bin/env tsx
/**
 * scripts/audit-env-vars.ts
 *
 * Lint env-var files for the kinds of paste corruption that have bitten this
 * project (literal `\n` appended inside quoted values, unclosed quotes, embedded
 * control characters, etc). Born from the 2026-05-31 incident where
 * POSTHOG_PERSONAL_KEY had `\n` text appended via a bad paste, returning 401
 * for 17 days. The audit revealed PODIO_FALLBACK_URL, PODIO_FULL_SUBMIT_URL,
 * and GITHUB_TOKEN had the same issue in production — Podio lead fallback
 * POSTs were going to malformed URLs and silently failing.
 *
 * Usage:
 *   npx tsx scripts/audit-env-vars.ts                  # audit .env.local
 *   npx tsx scripts/audit-env-vars.ts path/to/.env     # audit a specific file
 *   npx tsx scripts/audit-env-vars.ts --vercel         # also audit Vercel prod
 *                                                       (pulled to tmp, deleted)
 *
 * Exit codes:
 *   0 — no critical/high findings
 *   1 — found critical or high-severity corruption (for pre-commit use)
 */

import fs from 'fs'
import path from 'path'
import os from 'os'
import { execSync } from 'child_process'

type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO'

interface Pattern {
  name: string
  re: RegExp
  severity: Severity
  fix: string
}

// Pattern definitions — ordered by severity. The PostHog incident triggered
// the first two; the others are defensive against related paste mistakes.
const PATTERNS: Pattern[] = [
  {
    name: 'literal-backslash-n-inside-quotes',
    re: /^([A-Z_][A-Z_0-9]*)="[^"]*\\n"\s*$/,
    severity: 'CRITICAL',
    fix: 'Remove the literal \\n before the closing quote. Likely from a bad paste that included an escape sequence.',
  },
  {
    name: 'literal-backslash-n-trailing-unquoted',
    re: /^([A-Z_][A-Z_0-9]*)=[^"]*\\n\s*$/,
    severity: 'CRITICAL',
    fix: 'Remove the trailing \\n text from the value.',
  },
  {
    name: 'literal-backslash-r-or-t-in-value',
    re: /^([A-Z_][A-Z_0-9]*)=.*(\\r|\\t)[^A-Za-z0-9_/-]*$/,
    severity: 'HIGH',
    fix: 'Remove the literal \\r or \\t at end of value.',
  },
  {
    name: 'unclosed-quote',
    re: /^([A-Z_][A-Z_0-9]*)="[^"]*$/,
    severity: 'HIGH',
    fix: 'Add the closing quote, or remove the leading one if not intended.',
  },
  {
    name: 'value-with-embedded-control-char',
    re: /^([A-Z_][A-Z_0-9]*)=[^=]*[\x00-\x08\x0b\x0c\x0e-\x1f]/,
    severity: 'HIGH',
    fix: 'Strip control characters (CR/LF/tab/etc) embedded in the value.',
  },
  {
    name: 'two-key-value-pairs-on-one-line',
    re: /^[A-Z_][A-Z_0-9]*=.*[A-Z_][A-Z_0-9]*=/,
    severity: 'CRITICAL',
    fix: 'Two KEY=VALUE pairs collapsed onto one line — split them across two lines.',
  },
  {
    name: 'trailing-whitespace',
    re: /^([A-Z_][A-Z_0-9]*)=[^"\s].*[ \t]+$/,
    severity: 'MEDIUM',
    fix: 'Trim trailing whitespace from the value.',
  },
]

interface Finding {
  file: string
  line: number
  severity: Severity
  pattern: string
  key: string
  fix: string
}

function auditFile(file: string): Finding[] {
  if (!fs.existsSync(file)) {
    console.error(`✗ File not found: ${file}`)
    return []
  }
  const txt = fs.readFileSync(file, 'utf8')
  const lines = txt.split(/\r?\n/)
  const findings: Finding[] = []

  lines.forEach((line, i) => {
    if (!line || line.trim().startsWith('#') || !line.includes('=')) return
    for (const p of PATTERNS) {
      const m = line.match(p.re)
      if (m) {
        const key = line.match(/^([A-Z_][A-Z_0-9]*)=/)?.[1] ?? '(unknown)'
        findings.push({
          file,
          line: i + 1,
          severity: p.severity,
          pattern: p.name,
          key,
          fix: p.fix,
        })
      }
    }
  })

  return findings
}

function severityRank(s: Severity): number {
  return { CRITICAL: 0, HIGH: 1, MEDIUM: 2, INFO: 3 }[s]
}

function printReport(label: string, findings: Finding[], totalVars: number): void {
  console.log(`\n=== ${label} ===`)
  console.log(`Vars audited: ${totalVars}`)
  if (findings.length === 0) {
    console.log('✓ No corruption found.')
    return
  }
  findings.sort((a, b) => severityRank(a.severity) - severityRank(b.severity) || a.line - b.line)
  for (const f of findings) {
    console.log(`  [${f.severity}] ${f.key} (line ${f.line}) — ${f.pattern}`)
    console.log(`        Fix: ${f.fix}`)
  }
}

function countNonCommentVarLines(file: string): number {
  if (!fs.existsSync(file)) return 0
  const txt = fs.readFileSync(file, 'utf8')
  return txt.split(/\r?\n/).filter((l) => l && !l.trim().startsWith('#') && l.includes('=')).length
}

async function pullVercelEnv(envName: 'production' | 'preview' | 'development'): Promise<string> {
  // Pull into an OS-temp dir, NOT the repo. Symlink .vercel so the CLI finds
  // the project link. Caller is responsible for deletion.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `vercel-audit-${envName}-`))
  const repoVercel = path.resolve(process.cwd(), '.vercel')
  if (fs.existsSync(repoVercel)) {
    fs.symlinkSync(repoVercel, path.join(dir, '.vercel'))
  }
  const file = path.join(dir, `.env.${envName}`)
  execSync(`vercel env pull --environment=${envName} ${path.basename(file)}`, {
    cwd: dir,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  return file
}

function deleteIfExists(file: string): void {
  try {
    if (!file) return
    const dir = path.dirname(file)
    fs.rmSync(file, { force: true })
    // Only remove the parent dir if it's a temp dir we created
    if (dir.includes('vercel-audit-') && dir.startsWith(os.tmpdir())) {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  } catch {
    /* best effort */
  }
}

async function main() {
  const args = process.argv.slice(2)
  const auditVercel = args.includes('--vercel')
  const fileArg = args.find((a) => !a.startsWith('--'))
  const localFile = fileArg ?? path.resolve(process.cwd(), '.env.local')

  let allFindings: Finding[] = []

  // Always audit the local file
  const localFindings = auditFile(localFile)
  printReport(`${path.basename(localFile)}`, localFindings, countNonCommentVarLines(localFile))
  allFindings = allFindings.concat(localFindings)

  // Optionally audit Vercel envs (pulls to temp, deletes after)
  if (auditVercel) {
    for (const env of ['production', 'preview'] as const) {
      let pulled: string | null = null
      try {
        console.log(`\n  → pulling Vercel ${env} env (to temp, will be deleted)...`)
        pulled = await pullVercelEnv(env)
        const f = auditFile(pulled)
        printReport(`Vercel ${env}`, f, countNonCommentVarLines(pulled))
        allFindings = allFindings.concat(f)
      } catch (err) {
        console.error(`✗ Failed to pull Vercel ${env}:`, (err as Error).message.split('\n')[0])
      } finally {
        if (pulled) deleteIfExists(pulled)
      }
    }
  } else {
    console.log('\n(tip: pass --vercel to also audit Vercel preview + production env vars)')
  }

  // Summary + exit code
  const blocking = allFindings.filter((f) => f.severity === 'CRITICAL' || f.severity === 'HIGH')
  console.log(`\n=== SUMMARY ===`)
  console.log(`Total findings: ${allFindings.length} (${blocking.length} blocking — CRITICAL/HIGH)`)

  if (blocking.length > 0) {
    console.log('\n❌ Audit failed. Fix the CRITICAL/HIGH findings above.')
    console.log('   For Vercel: vercel env rm <KEY> production --yes && printf "<value>" | vercel env add <KEY> production')
    console.log('   (NOTE: use printf, NOT echo — echo appends a newline that causes this exact bug.)')
    process.exit(1)
  }
  console.log('\n✓ No blocking findings.')
}

main().catch((err) => {
  console.error('Error:', err.message)
  process.exit(2)
})
