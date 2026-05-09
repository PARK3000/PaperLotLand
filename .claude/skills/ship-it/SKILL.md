---
name: ship-it
description: Creates a branch, commits changes, and opens a pull request. Use when the user says "ship it", "ship", "ship this", or asks to open a PR for current changes.
---

# Ship It

Create a branch from current changes, commit, and open a pull request in one step.

## Instructions

When triggered, follow these steps in order:

### Step 1: Check for changes

Run `git status` and `git diff` to confirm there are uncommitted changes. If the working tree is clean (no staged or unstaged changes, no untracked files relevant to the project), inform the user there's nothing to ship.

Ignore these paths — they are never committed:
- `.mcp.json`
- `.playwright-mcp/`
- `docs/solutions/`

### Step 2: Determine branch name

If already on a feature branch (not `main`), use the current branch. Otherwise:

1. Look at the changes to infer a short descriptive slug (e.g., `fix/noindex-booking-page`, `feat/add-contact-form`)
2. Create and checkout the new branch: `git checkout -b <branch-name>`

### Step 3: Stage and commit

1. Stage relevant files — prefer naming specific files over `git add -A`. Never stage `.env`, credentials, or the ignored paths above.
2. Analyze the diff and write a clear, concise commit message (1-2 sentences) focusing on the "why."
3. Commit with the message, ending with:
   ```
   Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
   ```

### Step 4: Push and open PR

1. Push the branch: `git push -u origin <branch-name>`
2. Create a pull request using `gh pr create` with:
   - A short title (under 70 chars)
   - A body containing:
     - `## Summary` — 1-3 bullet points describing the changes
     - `## Test plan` — checklist of how to verify
     - The footer: `Generated with [Claude Code](https://claude.com/claude-code)`
3. Return the PR URL to the user.

### Step 5: Deploy (optional)

After the PR is created, ask the user if they want to deploy to Vercel preview or production.

## Examples

**User says:** "ship it"
**Result:** Branch created, changes committed, PR opened, URL displayed.

**User says:** "ship" (already on a feature branch with staged changes)
**Result:** Commits to current branch, pushes, opens PR against `main`, URL displayed.

## Guidelines

- Always target `main` as the base branch for PRs
- Never force-push or amend commits
- Never commit secrets or environment files
- If there are merge conflicts with main, inform the user rather than resolving automatically
- Use HEREDOC format for commit messages and PR bodies to preserve formatting
