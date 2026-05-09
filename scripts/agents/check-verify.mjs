#!/usr/bin/env node
/**
 * Parses the verify operator's JSON output and enforces structural rules:
 *   - approve verdict requires non-empty risks
 *   - ≥ 3 risks
 *   - each risk has a real path:line evidence_locator referencing this PR's diff
 *   - right_layer_to_fix=false ⇒ verdict must be reject
 *
 * On reject: comments on PR, removes auto-fix label from linked issue, and
 * fails the workflow so the PR is unmergeable until a human acts.
 */

import { execFileSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'

const verdictPath = process.env.VERDICT_PATH ?? '/tmp/verdict.json'
const prNumber = process.env.PR_NUMBER
const issueNumber = process.env.ISSUE_NUMBER

function fail(msg) {
  console.error(`::error::${msg}`)
  process.exit(1)
}

if (!existsSync(verdictPath)) {
  fail(`verdict file not written at ${verdictPath} — verify operator did not produce JSON`)
}
let raw
try {
  raw = readFileSync(verdictPath, 'utf-8')
} catch (e) {
  fail(`could not read verdict at ${verdictPath}: ${e.message}`)
}
if (!raw.trim()) fail(`verdict file at ${verdictPath} is empty`)

// Extract JSON object (model may wrap in prose despite instructions)
const match = raw.match(/\{[\s\S]*\}/)
if (!match) fail('verify output contained no JSON object')

let parsed
try {
  parsed = JSON.parse(match[0])
} catch (e) {
  fail(`verify JSON malformed: ${e.message}`)
}

const errors = []
if (!['approve', 'reject'].includes(parsed.verdict)) errors.push('verdict not approve|reject')
if (typeof parsed.right_layer_to_fix !== 'boolean') errors.push('right_layer_to_fix not boolean')
if (!Array.isArray(parsed.risks)) errors.push('risks not array')
else {
  if (parsed.risks.length < 3) errors.push(`risks has ${parsed.risks.length} entries, need ≥ 3`)
  for (const [i, r] of parsed.risks.entries()) {
    if (!r || typeof r !== 'object') errors.push(`risks[${i}] not object`)
    else {
      if (!r.risk || typeof r.risk !== 'string') errors.push(`risks[${i}].risk missing`)
      if (!r.evidence_locator || !/.+:\d+/.test(r.evidence_locator)) {
        errors.push(`risks[${i}].evidence_locator missing path:line`)
      }
      if (!['low', 'medium', 'high'].includes(r.severity)) {
        errors.push(`risks[${i}].severity invalid`)
      }
    }
  }
}
if (parsed.verdict === 'approve' && parsed.risks?.length === 0) {
  errors.push('approve with empty risks')
}
if (parsed.right_layer_to_fix === false && parsed.verdict !== 'reject') {
  errors.push('right_layer_to_fix=false requires verdict=reject')
}

// Cross-check: each evidence_locator path was actually changed in the PR
let changedFiles = []
try {
  changedFiles = execFileSync('git', ['diff', '--name-only', 'origin/main...HEAD'], {
    encoding: 'utf-8',
  })
    .trim()
    .split('\n')
    .filter(Boolean)
} catch {
  /* fall through; let path check fail loudly if needed */
}

if (Array.isArray(parsed.risks)) {
  for (const [i, r] of parsed.risks.entries()) {
    const path = r.evidence_locator?.split(':')[0]
    if (path && !changedFiles.includes(path)) {
      errors.push(`risks[${i}].evidence_locator path "${path}" not in PR diff`)
    }
  }
}

const summary =
  `**Verify verdict:** \`${parsed.verdict}\`\n` +
  `**Right layer:** \`${parsed.right_layer_to_fix}\` — ${parsed.right_layer_reasoning ?? ''}\n\n` +
  (Array.isArray(parsed.risks)
    ? parsed.risks
        .map((r, i) => `${i + 1}. **[${r.severity}]** ${r.risk}\n   _${r.evidence_locator}_`)
        .join('\n')
    : '')

if (errors.length > 0) {
  console.error('Verify response failed structural check:')
  for (const e of errors) console.error(`  - ${e}`)
  if (prNumber) {
    execFileSync('gh', [
      'pr',
      'comment',
      prNumber,
      '--body',
      `**Verify rejected (malformed response):**\n\n- ${errors.join('\n- ')}\n\nRaw output:\n\n\`\`\`\n${raw.slice(0, 2000)}\n\`\`\``,
    ])
  }
  process.exit(1)
}

if (prNumber) {
  execFileSync('gh', ['pr', 'comment', prNumber, '--body', summary])
}

if (parsed.verdict === 'reject') {
  if (issueNumber) {
    execFileSync('gh', [
      'issue',
      'edit',
      issueNumber,
      '--remove-label',
      'auto-fix',
    ])
    execFileSync('gh', [
      'issue',
      'comment',
      issueNumber,
      '--body',
      `Verify rejected PR #${prNumber}. \`auto-fix\` label removed. Human review required.`,
    ])
  }
  // Best-effort Slack alert when the secret is configured
  const slackUrl = process.env.SLACK_AGENT_WEBHOOK_URL
  if (slackUrl) {
    try {
      const text = `:warning: Agentic verify *rejected* PR #${prNumber} (issue #${issueNumber ?? '?'}). ${parsed.risks?.length ?? 0} risks cited.`
      execFileSync('curl', [
        '-sS',
        '-X',
        'POST',
        '-H',
        'Content-Type: application/json',
        '--data',
        JSON.stringify({ text }),
        slackUrl,
      ])
    } catch {
      /* best-effort */
    }
  }
  fail('verify rejected the PR')
}

console.log('Verify approved.')
