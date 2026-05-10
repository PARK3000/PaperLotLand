---
title: Closed-Loop Agentic Monitoring & Auto-Fix
type: feat
date: 2026-04-28
brainstorm: docs/brainstorms/2026-04-28-closed-loop-agentic-monitoring-brainstorm.md
revision: 3
revision_notes: Second reviewer pass applied. DHH/Simplicity cuts (drop JSON envelope, AST filter, separate canonical lib, calendar phase-split, separate verify workflow, severity labels, layered flake-suppressors). Kieran correctness fixes kept (canary signature, file:line evidence on verify, issue-scoped concurrency, post-create dedupe re-query, root-cause check). Final shape: 3 source files, 1 workflow, 1 env-var gate.
---

# ✨ Closed-Loop Agentic Monitoring & Auto-Fix

## Overview

A daily-running detection → fix → verify → close loop using **GitHub Issues as the shared state machine**. One scheduled GitHub Action workflow runs detection (site health and SEO via a job matrix), opens structured GitHub Issues, and on the next run auto-closes recovered ones. A second event-driven workflow handles fix+verify in one place: when an issue is labeled `auto-fix` (or someone `@claude`s it), Claude Code branches, edits within an allowlist, opens a PR with `Fixes #N`, and immediately runs an adversarial verify pass on the diff.

Auto-fix is gated by a single env var: `MONITOR_AUTOFIX=true|false`. No phase ceremony — flip the flag when the system is trusted.

Scope: single repo (`paperlotland`), daily cadence, two fix types day-one (`fix:meta`, `fix:alt`), Claude-native end-to-end.

## Problem Statement

Site health and SEO regressions are caught manually today — weekly CRO report, ad-hoc GSC checks, or by ranking drops that already cost traffic. The fix path is also manual. Result: slow MTTR, no verification that fixes actually fixed, and humans bottlenecking mechanical SEO maintenance (alt text, meta updates).

Goal: detect, fix, verify, close. Humans only at the merge checkpoint.

## What Changed Across Revisions

**Revision 1 → 2:** First reviewer pass cut overengineering — 5 phases to 2, ~14 files to 6, ~20 labels to 4, dropped `fix:deps`/`fix:schema`/`fix:sitemap`/`fix:robots`/`fix:internal-link` from v1, added technical guardrails (envelope, AST filter, canonicalization, concurrency).

**Revision 2 → 3 (this revision):** Second reviewer pass cut the defensive complexity I'd added in revision 2 and replaced it with surgical correctness fixes:

| Change | Why |
|---|---|
| Drop JSON envelope; use markdown sections + regex parse | Sidecar protocol for a problem we don't have yet |
| Drop AST diff filter; use regex `^\+.*\salt=` line filter | TS compiler API is overkill to gate string-literal edits |
| Drop separate `url-canonical.ts` | Use whatever the trailing-slash plan produces; don't fork |
| Drop 2-phase calendar split | Single env var `MONITOR_AUTOFIX` — same code, no phase boundary |
| Drop separate `agent-fix.yml` + `agent-verify.yml` | One workflow, two jobs (`fix` then `verify`); shares 80% of setup |
| Drop `severity:p0` label | No behavioral consequence at v1 fix-type set |
| Drop CDN grace + N-of-M sampling | Keep only 7d cooldown (cheapest, covers most flake) |
| Drop adversarial-verify as separate prompt file | One paragraph appended to verify prompt |
| **Add: canary signature** | Detector silent-failure detection — every run injects a known synthetic check; if not detected, workflow fails loudly |
| **Add: `file:line` evidence required on verify** | Forces verify to cite specific diff locations, kills generic-risk gaming |
| **Add: issue-scoped concurrency on fix workflow** | `concurrency.group: agent-fix-${{ github.event.issue.number }}` |
| **Add: post-create dedupe re-query** | Closes the TOCTOU window on title-prefix dedupe |
| **Add: "right layer to fix?" check in verify** | Catches "fixed alt on image that shouldn't exist" symptom-vs-root-cause errors |

## URL Canonical Form (Already Decided — Don't Touch)

The site's canonical URL form is **already established and stable**:

- Pages serve at `/path/` (Next.js `trailingSlash: true` since `3964256`)
- `siteUrl` in `config/site.config.json` is the **bare** form `https://paperlotland.com` (no trailing slash). Build-time guard in `src/lib/config.ts` throws if anyone re-adds one. (Reason: `fa1e4d5` added a trailing slash to `siteUrl`, producing 152 double-slash URLs in the sitemap; `9064263` reverted and locked it.)
- Sitemap, redirects, JSON-LD, per-page canonicals all consistent. Pages indexed by Google in this form.

**No site changes are needed for this monitoring loop.** Earlier revisions of this plan referenced an untracked draft (`docs/PLAN-remove-trailing-slashes.md`) as a prerequisite — that was wrong. The current URL form is correct and shipped.

What this loop actually needs is a small **client-side canonicalization helper inside the monitoring scripts**, so URLs returned by Ahrefs/GSC (which may include `www.`, `?utm_*` params, missing trailing slash, etc.) normalize to the form Google has indexed before being used as dedupe signatures or recovery-check targets.

```ts
// scripts/agents/detect.ts — ~15 lines, no site changes
function canonicalize(rawUrl: string): string {
  const u = new URL(rawUrl);
  u.hostname = u.hostname.replace(/^www\./, '');
  u.protocol = 'https:';
  u.search = '';
  u.hash = '';
  if (!u.pathname.endsWith('/')) u.pathname += '/';
  return u.toString();
}
```

A small fixture suite alongside it covers the inputs we actually see (Ahrefs ranking entries, GSC URL-inspection results, raw page URLs from Playwright). That's the entire scope of "canonicalization" for this plan. No migration, no redirects, no risk of breaking what's working.

## Architecture

```
┌─ Detection workflow (daily cron, 1 file, matrix job) ────────────────┐
│  matrix: [site-health, seo]                                          │
│  job:                                                                 │
│    1. canary check  →  fail run if synthetic issue not detected      │
│    2. detect anomalies via PostHog/Playwright/Ahrefs/GSC             │
│    3. for each finding: canonicalize URL, build signature,           │
│       search-then-create issue (post-create re-query for TOCTOU)     │
│    4. auto-close pass: iterate open agent issues, run recovery check │
└──────────────────────────────────────────────────────────────────────┘
                              ↓
┌─ Fix+Verify workflow (event-driven, 1 file, 2 jobs) ─────────────────┐
│  on: issues.labeled, issue_comment.created, pull_request.opened      │
│  concurrency: agent-fix-${{ event.issue.number }} (cancel: false)    │
│                                                                       │
│  job: fix     (gated by MONITOR_AUTOFIX env + label/mention)         │
│    - reads issue, parses markdown evidence sections                  │
│    - branches claude/<n>-<slug>, edits within allowlist              │
│    - regex diff filter on staged changes; abort if violations        │
│    - opens PR with Fixes #N                                          │
│                                                                       │
│  job: verify  (always runs on PRs from claude/* branches)            │
│    - adversarial prompt: ≥3 risks, each with file:line evidence      │
│    - "right layer to fix?" check                                     │
│    - on reject: removes auto-fix label, escalates                    │
└──────────────────────────────────────────────────────────────────────┘
                              ↓
                  Human merges → Vercel deploys
                              ↓
            Tomorrow's auto-close pass closes the issue
```

## File Layout (Final)

```
.github/workflows/
├── agents-detect.yml          # NEW — daily cron, matrix(site-health, seo)
├── agents-fix.yml             # NEW — fix + verify jobs
├── ci.yml                     # EXTEND — add actionlint step
└── weekly-cro-report.yml      # existing precedent

scripts/agents/
├── detect.ts                  # Detection orchestrator (mode flag) + auto-close pass + canary
├── prompts/
│   ├── detect-site-health.md
│   ├── detect-seo.md
│   ├── fix.md
│   └── verify.md              # includes adversarial paragraph + file:line + root-cause check
└── policy.json                # labels + safe-fix-allowlist + cooldown days + canary def

docs/agents/README.md          # SINGLE doc: policy + runbook + kill switches
CLAUDE.md                      # NEW section: "Agentic Auto-Fix Policy"
```

3 source files (`detect.ts`, `lib/gh.ts` — folded into `detect.ts` if < 100 lines, else extracted), 1 policy file, 4 prompt files, 2 workflows, 1 doc.

## Issue Body Format (Markdown, Not JSON)

Detection writes structured sections under known H2 headings. Fix and verify parse with regex — no schema validation library needed.

```markdown
## Symptom

Title tag on `https://paperlotland.com/resources/henderson/` regressed.
Expected: "Henderson Land Resources & Zoning Codes — PaperLotLand"
Found: "Henderson"

## Evidence

- GSC: https://search.google.com/search-console/...
- Live page: https://paperlotland.com/resources/henderson/
- Detected at: 2026-04-29T15:03:22Z
- Detector run: https://github.com/.../actions/runs/123456
- Prompt version: detect-seo@2026-04-29-r1

## Suggested fix

Edit `src/app/(main)/henderson/page.tsx` `metadata.title` to match expected.

## Recovery check

`fix:meta` predicate against the URL above.

## Signature

`[agent:fix:meta:henderson:title-too-short]`

## Cooldown

Closed issues with this signature block reopen until `2026-05-06T15:03:22Z` (7d).
```

The signature in title prefix `[agent:<sig>]` is the dedupe key. Searchable with `gh issue list --search`. Human-readable. No hashing.

## Labels (Final)

| Label | Semantics |
|---|---|
| `fix:meta` | One of two safe fix types |
| `fix:alt` | One of two safe fix types |
| `auto-fix` | Detection-set gate. Fix workflow auto-runs only when present. |

Three labels. That's it. No domain, no severity, no surface, no lifecycle. Bot author filter (`is:pr author:app/claude-code`) handles audit trail.

## Safe-Fix Allowlist

```jsonc
{
  "fix:meta": {
    "paths": ["src/app/**/page.tsx", "src/app/**/layout.tsx"],
    "diff_filter": "only changes inside `metadata` export object or `generateMetadata` function body"
  },
  "fix:alt": {
    "paths": ["content/blog/**", "src/components/sections/**"],
    "diff_filter": "added/changed lines must match /^\\+.*\\salt=/ ; rejects any other line addition"
  }
}
```

`src/lib/constants.ts` is **not** in any allowlist — too kitchen-sink. Constants-file alt fixes fall back to manual review.

`diff_filter` is a regex check on staged-but-not-committed changes inside the fix job. Failing the filter aborts the run with a comment on the issue. No AST parser.

## Recovery Checks (Inline `switch`)

```ts
async function isRecovered(issue: ParsedIssue): Promise<RecoveryResult> {
  const url = canonicalize(issue.target_url);  // from trailing-slash plan
  switch (issue.fix_type) {
    case 'fix:meta': {
      const html = await fetchAfterCacheGrace(url);
      return compareMetadata(html, issue.expected);
    }
    case 'fix:alt': {
      const html = await fetchAfterCacheGrace(url);
      return checkAllImagesHaveAlt(html);
    }
  }
}
```

Two cases, inline. `fetchAfterCacheGrace` is one helper that retries up to 3 times over 5 minutes — covers the CDN-propagation case without a separate "grace period" concept.

## Concurrency & Idempotency

**Detection workflow:**
```yaml
concurrency:
  group: agents-detect-${{ matrix.mode }}
  cancel-in-progress: false
```

**Fix workflow (issue-scoped — Kieran's fix):**
```yaml
concurrency:
  group: agent-fix-${{ github.event.issue.number || github.event.pull_request.number }}
  cancel-in-progress: false
```

**Idempotent issue creation:** title prefix `[agent:<sig>]` is the lock. Before creating: `gh issue list --search "[agent:<sig>] in:title"`. After creating: re-query the same search; if a lower-numbered issue exists with the same prefix, close yours as duplicate. Closes the TOCTOU window.

## Canary Signature (Detector Silent-Failure Guard)

`policy.json` declares a synthetic issue the detector should always find:

```json
{
  "canary": {
    "signature": "canary:always-detected",
    "expected_finding": "Synthetic check: this URL must always appear in the SEO Operator's daily output."
  }
}
```

The SEO detector seeds this finding in its output unconditionally. If, on any run, the canary signature is **not** present in the detector's findings list before issue-creation, the workflow fails loudly with a Slack alert: "Detection pipeline broken — investigate before trusting today's results." Catches the case where Ahrefs/GSC API contracts change and the detector silently returns empty.

## Adversarial Verify Prompt (Inline)

`prompts/verify.md` includes (not as a separate file):

> You are reviewing a Claude-authored fix PR adversarially. You receive only the issue body and the diff — no fix-prompt context.
>
> Produce a structured response:
>
> ```json
> {
>   "verdict": "approve" | "reject",
>   "right_layer_to_fix": true | false,
>   "right_layer_reasoning": "<one sentence>",
>   "risks": [
>     {
>       "risk": "<specific failure mode>",
>       "evidence_locator": "<file>:<line> from the diff",
>       "severity": "low" | "medium" | "high"
>     },
>     ... (at least 3, each with a real file:line in this diff)
>   ]
> }
> ```
>
> Hard rules:
> - Cannot return `approve` with empty `risks`
> - Each risk's `evidence_locator` must reference a path actually changed in this PR — generic risks ("regression risk", "untested edges") are rejected by the response parser
> - If `right_layer_to_fix` is `false`, must `reject` regardless of risk severity (e.g., "added alt text to image that shouldn't exist; root cause is the layout component using the wrong prop")

Response parsing in `agents-fix.yml` rejects malformed verify output and re-runs once before escalating to human.

## Implementation

Single env var gates auto-fix behavior. No phase split. No calendar gate.

```yaml
# .github/workflows/agents-fix.yml
env:
  MONITOR_AUTOFIX: ${{ vars.MONITOR_AUTOFIX || 'false' }}
jobs:
  fix:
    if: |
      (vars.MONITOR_AUTOFIX == 'true' && github.event.action == 'labeled' && github.event.label.name == 'auto-fix')
      || contains(github.event.comment.body, '@claude')
```

Roll-out:
1. Land the workflows + scripts with `MONITOR_AUTOFIX=false`. Detection runs daily; only manual `@claude` triggers fixes.
2. Watch for 2 weeks. Track: false-positive rate, fix-PR pass rate, verify reject rate.
3. When false-positive rate ≤ 5% and verify has caught at least one bad fix unprompted, set `MONITOR_AUTOFIX=true`. Same code, one variable change.
4. If the loop misbehaves, set `MONITOR_AUTOFIX=false`. Instant kill switch.

## Build Order

1. `scripts/agents/policy.json` + `docs/agents/README.md` + `CLAUDE.md` policy section (includes the 15-line `canonicalize()` helper + fixture tests)
2. `scripts/agents/detect.ts` (canary, detect, dedupe, auto-close in one file)
3. `scripts/agents/prompts/*.md` (with `PROMPT_VERSION` headers)
4. `.github/workflows/agents-detect.yml` (cron + matrix + concurrency)
5. `.github/workflows/agents-fix.yml` (issue-scoped concurrency + verify job)
6. `actionlint` step in `ci.yml`
7. Manual test: trigger a known issue, run `@claude`, verify PR appears, verify response, manual merge, verify auto-close on next run.
8. Soak with `MONITOR_AUTOFIX=false` for 2 weeks. Flip when criteria met.

## Acceptance Criteria

**Functional:**
- [ ] Daily detection runs both modes, completes in < 5 min, posts one-line summary
- [ ] Canary check fails the run loudly if not detected
- [ ] Issues filed have markdown evidence sections + signature in title
- [ ] Re-running same day produces no duplicates (post-create re-query verified)
- [ ] `@claude` mention produces a passing fix-PR < 5 min
- [ ] Diff filter blocks out-of-spec changes before push
- [ ] Verify rejects a deliberately bad fix in shadow test (without human prompting)
- [ ] Verify rejects a "fixed wrong layer" deliberately-bad fix (root-cause check works)
- [ ] Auto-close pass closes a recovered issue with verification comment
- [ ] `MONITOR_AUTOFIX=false` blocks auto-trigger; `@claude` still works
- [ ] `MONITOR_AUTOFIX=true` enables auto-trigger on `auto-fix` label

**Non-functional:**
- [ ] Each detection run ≤ 5 minutes
- [ ] False positive rate ≤ 10% week 1, ≤ 5% by week 4
- [ ] No agent PR introduces a regression caught only post-deploy in first 30 days
- [ ] Ahrefs/GSC call volume within rate limits
- [ ] Secrets never logged

**Quality gates:**
- [ ] `actionlint` runs in CI and passes
- [ ] All prompts include `PROMPT_VERSION` header logged in issue body
- [ ] `docs/agents/README.md` reviewed before workflows enabled
- [ ] CLAUDE.md updates reviewed before `@claude` path enabled

## Success Metrics

| Metric | Target |
|---|---|
| MTTR for SEO regressions | < 24h (vs ~7 days) |
| Auto-fix coverage of meta+alt issues by week 8 | ≥ 60% |
| False positive rate | ≤ 5% by week 4 |
| Auto-close success rate | ≥ 90% within 48h of merge |
| Regressions from agent PRs in first 30 days | 0 |
| Detector-silent-failure incidents caught by canary | All (target 100%) |

## Dependencies

**Hard:**
- (No site changes required. Canonical URL form is already shipped and stable; the loop adds only a small client-side normalization helper inside `detect.ts`.)
- `ANTHROPIC_API_KEY` (Opus access)
- `AHREFS_API_TOKEN` (client's Ahrefs subscription)
- PostHog (already wired)
- Claude Code GitHub App installed
- GSC API enabled on existing service account; key written to runner via `GOOGLE_APPLICATION_CREDENTIALS` from base64 secret (never echoed)

**Soft:**
- `SLACK_AGENT_WEBHOOK_URL` for canary failure alerts (the only Slack integration in v1)

## Risk Table

| Risk | Mitigation |
|---|---|
| Issue spam | Conservative thresholds + canonicalized signature + 7d cooldown after close |
| Bad agent PR merged | Human merge required; adversarial verify with file:line evidence; right-layer check; diff filter; allowlist |
| Detector silent failure (API contract change) | Canary signature checked every run; loud Slack alert if missing |
| Verify rubber-stamping | Structured response with file:line evidence; generic risks rejected by parser |
| Symptom-vs-root-cause | Verify "right layer to fix?" check |
| Concurrent runs racing on issue creation | Workflow concurrency by mode + post-create re-query for TOCTOU |
| Concurrent fix runs on same issue | Issue-scoped concurrency group on fix workflow |
| URL canonicalization drift | Site URL form is decided + build-time guarded (commit `9064263`). Loop adds a small client-side normalizer with fixture tests; no site changes. |
| Loop instability (close → reopen flap) | 7d cooldown on signature after close |
| Secrets in logs | Never echo; mask at action level; quarterly rotation |

## Resource Requirements

- **Time:** ~1.5-2 weeks for build, then 2-week soak with `MONITOR_AUTOFIX=false` before flipping
- **Cost:** ~$100-150/mo Anthropic API. Ahrefs uses client subscription. GH Actions minutes negligible at daily cadence.
- **People:** 1 implementer; reviewer for the README + CLAUDE.md updates

## Future Considerations (deferred)

- Add `fix:schema`, `fix:sitemap`, `fix:robots`, `fix:internal-link` once meta+alt prove safe
- Performance Operator (Lighthouse / CWV) — same shape, third matrix mode
- Multi-repo extraction if pattern adopted by sister sites
- Auto-merge for tier-S safe changes after 90 days clean
- Severity tiering with escalation if issue volume justifies it
- Self-improving prompts: log false positives as eval data

## Open Questions Before Build

1. **Anthropic tier** — verify sustained Opus volume in budget at daily cadence
2. **GSC API enablement** — confirm Search Console API enabled on `search-console@we-buy-any-vegas-house.iam.gserviceaccount.com` (currently used for GTM/Drive)
3. **Canary signature wording** — what synthetic finding should the SEO detector always emit? (Suggestion: a known robots.txt directive presence check that should always pass)
4. **Slack channel for canary alerts** — `#wbv-monitoring`? Existing channel?
5. ~~Trailing-slash plan ship date~~ — **resolved**: not a prerequisite. Site URL form is already shipped, stable, and build-time guarded. Loop adds only a client-side normalizer.

## References

- Brainstorm: `docs/brainstorms/2026-04-28-closed-loop-agentic-monitoring-brainstorm.md`
- Workflow precedent: `.github/workflows/weekly-cro-report.yml`
- URL form lock-in: commit `9064263` (`fix(seo): revert trailing slash on siteUrl and guard against regression`) — explains why `siteUrl` must stay bare while pages keep their trailing slash. The build-time assertion is in `src/lib/config.ts`.
- Service account auth pattern: `scripts/gtm-api.js`
- PostHog event taxonomy: PR #101 (commit `6c67016`)
- Claude Code GitHub Action: https://github.com/anthropics/claude-code-action
- Ahrefs API: https://ahrefs.com/api
- Google Search Console API: https://developers.google.com/webmaster-tools
