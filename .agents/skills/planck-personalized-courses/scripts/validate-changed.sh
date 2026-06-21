#!/usr/bin/env bash
# Run `tsc --noEmit` and show ONLY type errors in files changed vs `main`.
# Collapses the ~30 pre-existing unrelated errors the repo always emits into the
# 0-3 lines that actually matter for the current change.
#
# Usage: ./validate-changed.sh [base]   (base defaults to `main`)
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
cd "$REPO_ROOT"

BASE="${1:-main}"
CHANGED="$(git diff --name-only "$BASE" 2>/dev/null | grep -E '\.(ts|tsx)$' || true)"

if [ -z "$CHANGED" ]; then
  echo "No changed .ts/.tsx files vs $BASE."
  exit 0
fi

echo "Checking tsc errors in changed files vs $BASE:"
echo "$CHANGED" | sed 's/^/  - /'

# Filter tsc output to lines mentioning any changed path (fixed-string match).
HITS="$(pnpm exec tsc --noEmit --pretty false 2>&1 | grep -F -f <(printf '%s\n' "$CHANGED") || true)"

if [ -n "$HITS" ]; then
  echo ""
  echo "Type errors in changed files:"
  echo "$HITS"
  exit 1
fi

echo ""
echo "No type errors in changed files. (Pre-existing errors elsewhere are hidden by this script.)"
