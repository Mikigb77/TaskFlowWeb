#!/usr/bin/env bash
set -euo pipefail

plan=false
while (($#)); do
  case "$1" in
    --plan) plan=true; shift ;;
    -h|--help)
      cat <<'EOF'
Usage: bash scripts/deploy-local.sh [--plan]

Build and start the current website in Docker at http://localhost:3000.
Set TASKFLOW_WEB_PORT for another localhost port. Live AI is disabled locally.
Requires Docker Compose (enable Docker Desktop's integration with your WSL distro).
--plan shows the command without starting Docker or building the website.
EOF
      exit 0 ;;
    *) printf 'Unknown argument: %s. Use --help.\n' "$1" >&2; exit 2 ;;
  esac
done

script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)
repo=$(cd -- "$script_dir/.." && pwd -P)
compose=(docker compose --project-directory "$repo" --file "$repo/compose.yaml")
if "$plan"; then
  printf 'Local website directory: %s\n' "$repo"
  printf '%q ' "${compose[@]}" up --build --detach --wait --wait-timeout 180
  printf '\nUses the current working tree. No cloud deployment or paid AI calls.\n'
  exit 0
fi
if ! command -v docker >/dev/null 2>&1; then
  printf '%s\n' 'Install Docker Desktop and enable Docker Compose for this WSL distro.' >&2
  exit 127
fi
"${compose[@]}" up --build --detach --wait --wait-timeout 180
printf 'Local website ready: http://localhost:%s (live AI demo disabled).\n' "${TASKFLOW_WEB_PORT:-3000}"
