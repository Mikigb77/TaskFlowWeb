#!/usr/bin/env bash
# Internal bridge: share the Windows cloud SDK/login when called from WSL.
set -euo pipefail

entry_point=${1:?Usage: invoke-powershell.sh SCRIPT.ps1 [arguments]}
shift

if command -v wslpath >/dev/null 2>&1; then
  powershell=$(command -v pwsh.exe || true)
  if [[ -z "$powershell" && -x '/mnt/c/Program Files/PowerShell/7/pwsh.exe' ]]; then
    powershell='/mnt/c/Program Files/PowerShell/7/pwsh.exe'
  fi
  if [[ -n "$powershell" ]]; then
    entry_point=$(wslpath -w "$entry_point")
    exec "$powershell" -NoLogo -NoProfile -File "$entry_point" "$@"
  fi
fi

if command -v pwsh >/dev/null 2>&1; then
  exec pwsh -NoLogo -NoProfile -File "$entry_point" "$@"
elif command -v cygpath >/dev/null 2>&1 && command -v pwsh.exe >/dev/null 2>&1; then
  entry_point=$(cygpath -w "$entry_point")
  exec pwsh.exe -NoLogo -NoProfile -File "$entry_point" "$@"
fi

printf '%s\n' 'PowerShell 7.2+ is required. Install it and put pwsh on PATH.' \
  'For WSL, enable Windows interoperability to reuse Windows pwsh.exe and its Cloud SDK login.' >&2
exit 127
