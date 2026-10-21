#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: bash scripts/deploy-cloud.sh [options]

Build and deploy the website from origin/main to Google Cloud Run.
Local/uncommitted edits are not deployed. Does not deploy the Cloudflare edge.
The protected live voice demo is enabled by default.

  --plan                  Check cloud access and main; do not deploy
  --project VALUE         Override the Google Cloud project (--project-id also works)
  --account VALUE         Override the Google Cloud account
  --region VALUE          Override the Google Cloud region
  --service VALUE         Override the Cloud Run service
  --site-url VALUE        Public origin (default: https://taskflow.garbar.tech)
  --disable-voice         Explicitly disable the live voice demo
  --turnstile-site-key VALUE  Override TaskFlow's public Turnstile site key
  -h, --help              Show help without contacting Google

Uses PowerShell 7.2+ and the existing cloud implementation. On WSL, Windows
PowerShell/Git/Cloud SDK and their Google login are reused when available.
EOF
}

arguments=()
while (($#)); do
  case "$1" in
    -h|--help) usage; exit 0 ;;
    --plan) arguments+=(-Plan); shift ;;
    --disable-voice) arguments+=(-DisableVoice); shift ;;
    --project|--project-id|--account|--region|--service|--site-url|--turnstile-site-key)
      if (($# < 2)) || [[ -z "$2" || "$2" == -* ]]; then
        printf '%s requires a value. Use --help.\n' "$1" >&2
        exit 2
      fi
      case "$1" in
        --project|--project-id) parameter=-ProjectId ;;
        --account) parameter=-Account ;;
        --region) parameter=-Region ;;
        --service) parameter=-Service ;;
        --site-url) parameter=-SiteUrl ;;
        --turnstile-site-key) parameter=-TurnstileSiteKey ;;
      esac
      arguments+=("$parameter" "$2")
      shift 2 ;;
    *) printf 'Unknown argument: %s. Use --help.\n' "$1" >&2; exit 2 ;;
  esac
done

script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)
exec bash "$script_dir/dev/invoke-powershell.sh" "$script_dir/deploy-cloud.ps1" "${arguments[@]}"
