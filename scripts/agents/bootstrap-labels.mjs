#!/usr/bin/env node
/**
 * Idempotently creates the labels declared in scripts/agents/policy.json.
 * Safe to re-run: existing labels are updated; new ones are created.
 *
 * Usage:
 *   GH_TOKEN=ghp_... node scripts/agents/bootstrap-labels.mjs
 *   # or, if `gh` is already authenticated:
 *   node scripts/agents/bootstrap-labels.mjs
 */

import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const policy = JSON.parse(readFileSync(resolve(__dirname, 'policy.json'), 'utf-8'))

for (const [name, meta] of Object.entries(policy.labels)) {
  const args = [
    'label',
    'create',
    name,
    '--color',
    meta.color,
    '--description',
    meta.description,
    '--force', // upsert
  ]
  try {
    execFileSync('gh', args, { stdio: 'inherit' })
    console.log(`✓ ${name}`)
  } catch (err) {
    console.error(`✗ ${name}: ${err.message}`)
    process.exitCode = 1
  }
}
