#Requires -Version 7.2
param([string]$ProjectId = 'taskflow-511107', [string]$Account = 'tech.garbar@gmail.com', [string]$WslDistribution = 'kali-linux')
$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$wslRepo = (& wsl -d $WslDistribution -- wslpath -a ($repo -replace '\\', '/')).Trim()
if ($wslRepo -notmatch '^/mnt/[a-z]/[A-Za-z0-9/_. -]+$') { throw 'Unsupported workspace path.' }
& wsl -d $WslDistribution -- bash -lc "source ~/.nvm/nvm.sh && cd '$wslRepo' && bash scripts/deploy-edge.sh"
if ($LASTEXITCODE -ne 0) { throw 'Edge deployment failed.' }
# Pipe structured JSON straight into Wrangler. Do not expose the secret in
# process arguments, console output, source, build args, or browser JavaScript.
$secret = (& gcloud secrets versions access latest --secret=taskflow-voice-edge "--account=$Account" "--project=$ProjectId").Trim()
if ($LASTEXITCODE -ne 0 -or -not $secret) { throw 'Could not read the origin secret.' }
try {
    @{ VOICE_EDGE_SECRET = $secret } | ConvertTo-Json -Compress | & wsl -d $WslDistribution -- bash -lc "source ~/.nvm/nvm.sh && cd '$wslRepo' && ./node_modules/.bin/wrangler secret bulk --config edge/wrangler.jsonc"
    if ($LASTEXITCODE -ne 0) { throw 'Could not synchronize the edge secret.' }
} finally { $secret = $null }
Write-Host 'TaskFlow custom hostname: https://taskflow.garbar.tech'
