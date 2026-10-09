#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
# Secret is entered through stdin with `npx wrangler secret put VOICE_EDGE_SECRET
# --config edge/wrangler.jsonc`; it must match Google Secret Manager.
# This script publishes only the reviewed main branch.
git fetch origin main
if [[ "$(git rev-parse HEAD)" != "$(git rev-parse origin/main)" ]] || [[ -n "$(git status --porcelain --untracked-files=no)" ]]; then
  echo 'Merge and check out the clean main commit before deploying the edge.' >&2
  exit 1
fi
npx wrangler deploy --config edge/wrangler.jsonc
