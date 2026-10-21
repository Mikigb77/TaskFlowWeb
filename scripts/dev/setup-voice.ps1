#Requires -Version 7.2
<# Provisions the server-only voice demo. No AI API key or service-account key is used.
   Run after `wrangler login` with Workers and Turnstile permissions. Uses the free
   Turnstile plan; does not upgrade Cloudflare or change billing accounts. #>
[CmdletBinding()]
param([string]$ProjectId = 'taskflow-511107', [string]$Account = 'tech.garbar@gmail.com', [string]$WslDistribution = 'kali-linux')
$ErrorActionPreference = 'Stop'
$flags = @("--project=$ProjectId", "--account=$Account", '--quiet')
function Cloud([string[]]$Arguments) { & gcloud @Arguments @flags; if ($LASTEXITCODE -ne 0) { throw 'Google Cloud command failed.' } }
$repo = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$wslRepo = (& wsl -d $WslDistribution -- wslpath -a ($repo -replace '\\', '/')).Trim()
if ($wslRepo -notmatch '^/mnt/[a-z]/[A-Za-z0-9/_. -]+$') { throw 'Unsupported workspace path.' }
function Wrangler([string]$Arguments) {
    $output = & wsl -d $WslDistribution -- bash -lc "source ~/.nvm/nvm.sh && cd '$wslRepo' && ./node_modules/.bin/wrangler $Arguments --config edge/wrangler.jsonc"
    if ($LASTEXITCODE -ne 0) { throw 'Cloudflare command failed.' }
    return $output
}
Cloud @('services', 'enable', 'aiplatform.googleapis.com', 'firestore.googleapis.com', 'secretmanager.googleapis.com')
$databases = (Cloud @('firestore', 'databases', 'list', '--format=json')) | ConvertFrom-Json
if ("projects/$ProjectId/databases/(default)" -notin @($databases.name)) {
    Cloud @('firestore', 'databases', 'create', '--location=europe-southwest1', '--type=firestore-native', '--database=(default)', '--delete-protection')
}
$runtime = "taskflow-web-runtime@$ProjectId.iam.gserviceaccount.com"
# Dedicated project; no client can access Firestore directly. Runtime can invoke
# the model and transact quota records; only this service gets the three secrets.
foreach ($role in @('roles/aiplatform.user', 'roles/datastore.user')) {
    Cloud @('projects', 'add-iam-policy-binding', $ProjectId, "--member=serviceAccount:$runtime", "--role=$role", '--condition=None', '--format=none')
}
function Put-Secret([string]$Name, [string]$Value) {
    $path = Join-Path ([IO.Path]::GetTempPath()) ("taskflow-secret-" + [guid]::NewGuid().ToString('N'))
    try {
        [IO.File]::WriteAllText($path, $Value, [Text.UTF8Encoding]::new($false))
        Cloud @('secrets', 'create', $Name, '--replication-policy=user-managed', '--locations=europe-southwest1', "--data-file=$path", '--format=none')
    } finally { if (Test-Path -LiteralPath $path) { Remove-Item -LiteralPath $path -Force } }
}
$secrets = @(Cloud @('secrets', 'list', '--format=value(name)')) | ForEach-Object { ($_ -split '/')[-1] }
foreach ($name in @('taskflow-voice-app', 'taskflow-voice-edge')) {
    if ($name -notin $secrets) { Put-Secret $name ([Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))) }
}
$widgets = (Wrangler 'turnstile widget list --json') | ConvertFrom-Json
$widget = @($widgets | Where-Object { $_.name -eq 'TaskFlow voice demo' }) | Select-Object -First 1
if (-not $widget) {
    # Keep returned secret in memory; never write the response to a log or repository.
    $widget = (Wrangler 'turnstile widget create "TaskFlow voice demo" --domain taskflow.garbar.tech --mode managed --clearance-level no_clearance --json') | ConvertFrom-Json
}
if (-not $widget.sitekey) { throw 'Cloudflare did not return a site key.' }
if ('taskflow-turnstile' -notin $secrets) {
    if (-not $widget.secret) { throw 'Existing Turnstile secret is missing from Secret Manager; recover it through the Cloudflare dashboard.' }
    Put-Secret 'taskflow-turnstile' $widget.secret
}
foreach ($name in @('taskflow-voice-app', 'taskflow-voice-edge', 'taskflow-turnstile')) {
    Cloud @('secrets', 'add-iam-policy-binding', $name, "--member=serviceAccount:$runtime", '--role=roles/secretmanager.secretAccessor', '--format=none')
}
foreach ($collection in @('voiceVisitors', 'voiceNetworks', 'voiceJobs')) {
    Cloud @('firestore', 'fields', 'ttls', 'update', 'expiresAt', "--collection-group=$collection", '--database=(default)', '--enable-ttl', '--async')
}
Write-Host "Voice infrastructure ready. Public Turnstile site key: $($widget.sitekey)"
Write-Host 'The cloud deployment enables voice by default. If the widget key changed, use scripts/deploy-cloud.ps1 -TurnstileSiteKey <public-site-key>.'
