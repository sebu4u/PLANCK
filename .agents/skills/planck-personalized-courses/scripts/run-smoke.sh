#!/usr/bin/env bash
# Run the personalized-course planner end-to-end against a live model and assert
# the output is high-quality. Optionally pass a custom prompt as $1.
#
# Loads .env.local for DEEPSEEK_API_KEY / OPENAI_API_KEY. Exits non-zero on failure.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
cd "$REPO_ROOT"

exec node --experimental-strip-types \
  --import "$SCRIPT_DIR/register.mjs" \
  --env-file-if-exists=.env.local \
  "$SCRIPT_DIR/smoke-planner.mjs" "$@"
