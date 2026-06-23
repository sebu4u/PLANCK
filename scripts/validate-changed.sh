#!/usr/bin/env bash
# Run tsc and show only errors in files changed vs `base` (default: main).
# Exit 0 = clean, exit 1 = errors in changed files.
set -e

base="${1:-main}"
project_root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$project_root"

# Get the list of changed files (added/modified) under TS roots we care about.
# `git diff` against origin/main if available, else local main.
if git rev-parse --verify "origin/$base" >/dev/null 2>&1; then
  diff_base="origin/$base"
else
  diff_base="$base"
fi

changed=$(git diff --name-only --diff-filter=AM "$diff_base"...HEAD 2>/dev/null | grep -E '\.(ts|tsx)$' | grep -vE '^\.next/' || true)

if [ -z "$changed" ]; then
  # Also include uncommitted + staged changes
  changed=$( (git diff --name-only --diff-filter=AM HEAD 2>/dev/null; git diff --cached --name-only --diff-filter=AM 2>/dev/null) | grep -E '\.(ts|tsx)$' | grep -vE '^\.next/' | sort -u || true)
fi

# Also include untracked TS files (e.g. newly added) so brand-new files get checked too.
untracked=$(git ls-files --others --exclude-standard 2>/dev/null | grep -E '\.(ts|tsx)$' | grep -vE '^\.next/' || true)
if [ -n "$untracked" ]; then
  changed=$(printf '%s\n%s\n' "$changed" "$untracked" | sort -u | grep -v '^$' || true)
fi

if [ -z "$changed" ]; then
  echo "[validate-changed] no changed TS files vs $base"
  exit 0
fi

echo "[validate-changed] running tsc on changed files:"
printf '  %s\n' $changed
echo

# Run tsc, then filter to only errors in changed files.
output=$(pnpm exec tsc --noEmit --pretty false 2>&1 || true)
# Build a fixed-string alternation (no regex metachars).
pattern=$(echo "$changed" | tr '\n' '|' | sed 's/|$//')
relevant=$(echo "$output" | grep -F -e "" | grep -E "^(${pattern}):" || true)

if [ -z "$relevant" ]; then
  echo "[validate-changed] OK — no tsc errors in changed files"
  exit 0
fi

echo "[validate-changed] tsc errors in changed files:"
echo "$relevant"
exit 1
