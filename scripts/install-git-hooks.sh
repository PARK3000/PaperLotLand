#!/usr/bin/env bash
# scripts/install-git-hooks.sh
#
# Point this repo's git at the tracked .githooks/ directory so all developers
# get the same pre-commit checks (malware scan + env-var audit). Idempotent —
# safe to re-run.
#
# Usage:
#   ./scripts/install-git-hooks.sh

set -euo pipefail

REPO_ROOT=$(git rev-parse --show-toplevel)
cd "$REPO_ROOT"

if [ ! -d .githooks ]; then
  echo "✗ .githooks/ directory not found at $REPO_ROOT/.githooks"
  exit 1
fi

CURRENT=$(git config --get core.hooksPath || echo "")
if [ "$CURRENT" = ".githooks" ]; then
  echo "✓ Already configured: core.hooksPath = .githooks"
else
  git config core.hooksPath .githooks
  echo "✓ Set core.hooksPath = .githooks (was: ${CURRENT:-default .git/hooks})"
fi

# Ensure each hook is executable
for hook in .githooks/*; do
  if [ -f "$hook" ] && [ ! -x "$hook" ]; then
    chmod +x "$hook"
    echo "✓ Made executable: $hook"
  fi
done

echo ""
echo "Done. Active hooks:"
ls -la .githooks/ | tail -n +2 | grep -v '^d' | awk '{print "  " $NF}'
echo ""
echo "Test the env audit manually:"
echo "  npx tsx scripts/audit-env-vars.ts          # audit .env.local"
echo "  npx tsx scripts/audit-env-vars.ts --vercel # also audit Vercel prod+preview"
