#Requires -Version 7.2
<#
.SYNOPSIS
Build and deploy the latest origin/main to a small, public Cloud Run service.
.DESCRIPTION
Uses a temporary git archive, not the working tree. Requires Git, tar, gcloud,
Google authentication and an already billed project. Docker/Node are not needed
locally: Cloud Build builds the container. Does not modify gcloud defaults or DNS.
#>
[CmdletBinding()]
param(
    [ValidatePattern('^[a-z][a-z0-9-]{4,28}[a-z0-9]$')]
    [string]$ProjectId = 'taskflow-511107',
    [ValidatePattern('^[^\s,=]+@[^\s,=]+$')]
    [string]$Account = 'tech.garbar@gmail.com',
    [ValidatePattern('^[a-z]+-[a-z]+[0-9]+$')]
    [string]$Region = 'europe-southwest1',
    [ValidatePattern('^[a-z][a-z0-9-]{0,19}[a-z0-9]$')]
    [string]$Service = 'taskflow-web',
    [ValidatePattern('^https://[a-z0-9.-]+$')]
    [string]$SiteUrl,
    [switch]$EnableVoice,
    [ValidatePattern('^[A-Za-z0-9_-]+$')]
    [string]$TurnstileSiteKey,
    [switch]$Plan
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

function Invoke-Checked {
    param([string]$Program, [string[]]$Arguments)
    & $Program @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "$Program failed with exit code $LASTEXITCODE. Deployment stopped."
    }
}

$cloudFlags = @("--project=$ProjectId", "--account=$Account", '--quiet')
function Invoke-Cloud {
    param([string[]]$Command)
    Invoke-Checked 'gcloud' ($Command + $cloudFlags)
}

foreach ($tool in @('git', 'tar', 'gcloud')) {
    if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
        throw "Install $tool before deploying. See README.md."
    }
}
$repo = (Invoke-Checked 'git' @('-C', $PSScriptRoot, 'rev-parse', '--show-toplevel')).Trim()
Invoke-Checked 'git' @('-C', $repo, 'fetch', '--no-tags', 'origin', 'refs/heads/main:refs/remotes/origin/main')
$commit = (Invoke-Checked 'git' @('-C', $repo, 'rev-parse', 'refs/remotes/origin/main')).Trim()
$tracked = @(Invoke-Checked 'git' @('-C', $repo, 'ls-tree', '-r', '--name-only', $commit))
foreach ($required in @('Dockerfile', 'cloudbuild.yaml', '.gcloudignore', '.dockerignore')) {
    if ($required -notin $tracked) {
        throw "origin/main does not contain $required. Merge the deployment PR first."
    }
}
$privateFiles = @($tracked | Where-Object {
    ($_ -match '(^|/)\.env($|\.)' -and $_ -notmatch '(^|/)\.env\.example$') -or
    $_ -match '\.(pem|p12|key)$'
})
if ($privateFiles.Count -gt 0) {
    throw "Refusing to upload tracked environment/credential files: $($privateFiles -join ', ')"
}

$project = (Invoke-Cloud @('projects', 'describe', $ProjectId, '--format=json')) | ConvertFrom-Json
$billing = (Invoke-Cloud @('billing', 'projects', 'describe', $ProjectId, '--format=json')) | ConvertFrom-Json
if (-not $billing.billingEnabled) {
    throw "Billing is not enabled for $ProjectId. Enable it in Google Cloud before deploying."
}
$origin = "https://$Service-$($project.projectNumber).$Region.run.app"
if (-not $SiteUrl) { $SiteUrl = $origin }
if ($EnableVoice -and (-not $TurnstileSiteKey -or $SiteUrl -ne 'https://taskflow.garbar.tech')) {
    throw 'Voice requires the protected TaskFlow hostname and a public Turnstile site key.'
}
$image = "$Region-docker.pkg.dev/$ProjectId/$Service/website:$commit"
$runtimeId = "$Service-runtime"
$builderId = "$Service-builder"
$runtimeEmail = "$runtimeId@$ProjectId.iam.gserviceaccount.com"
$builderEmail = "$builderId@$ProjectId.iam.gserviceaccount.com"
$bucket = "$ProjectId-$Service-builds"

[ordered]@{
    project = $ProjectId
    account = $Account
    region = $Region
    branch = 'origin/main'
    commit = $commit
    image = $image
    url = $SiteUrl
    voiceEnabled = [bool]$EnableVoice
    aiMonthlyPauseEUR = 25
    scaling = '0–1 instances; 1 CPU; 512 MiB; request-based billing'
    indexable = $false
} | ConvertTo-Json | Write-Host
if ($Plan) { return }

# Bootstrap only the resources used by this website. No service account keys.
Invoke-Cloud @('services', 'enable', 'run.googleapis.com', 'cloudbuild.googleapis.com',
    'artifactregistry.googleapis.com', 'iam.googleapis.com', 'storage.googleapis.com')
$accounts = @(Invoke-Cloud @('iam', 'service-accounts', 'list', '--format=value(email)'))
if ($runtimeEmail -notin $accounts) {
    Invoke-Cloud @('iam', 'service-accounts', 'create', $runtimeId,
        '--display-name=TaskFlow website runtime')
}
if ($builderEmail -notin $accounts) {
    Invoke-Cloud @('iam', 'service-accounts', 'create', $builderId,
        '--display-name=TaskFlow website builds')
}
$repositories = @((Invoke-Cloud @('artifacts', 'repositories', 'list', "--location=$Region", '--format=json')) | ConvertFrom-Json)
$repositoryName = "projects/$ProjectId/locations/$Region/repositories/$Service"
if ($repositoryName -notin @($repositories | ForEach-Object { $_.name })) {
    Invoke-Cloud @('artifacts', 'repositories', 'create', $Service,
        "--location=$Region", '--repository-format=docker',
        '--description=TaskFlow website release images')
}
$buckets = @(Invoke-Cloud @('storage', 'buckets', 'list', '--format=value(name)')) |
    ForEach-Object { $_ -replace '^gs://', '' -replace '/$', '' }
if ($bucket -notin $buckets) {
    Invoke-Cloud @('storage', 'buckets', 'create', "gs://$bucket",
        "--location=$Region", '--uniform-bucket-level-access', '--public-access-prevention')
}
# Voice runtime roles are provisioned separately. Builder can only read this source bucket, write
# this image repository and emit logs; it cannot deploy or administer the app.
Invoke-Cloud @('artifacts', 'repositories', 'add-iam-policy-binding', $Service,
    "--location=$Region", "--member=serviceAccount:$builderEmail", '--role=roles/artifactregistry.writer')
Invoke-Cloud @('storage', 'buckets', 'add-iam-policy-binding', "gs://$bucket",
    "--member=serviceAccount:$builderEmail", '--role=roles/storage.objectViewer')
Invoke-Cloud @('projects', 'add-iam-policy-binding', $ProjectId,
    "--member=serviceAccount:$builderEmail", '--role=roles/logging.logWriter', '--condition=None')

$tempBase = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath())
$stageRoot = Join-Path $tempBase ("taskflow-web-deploy-" + [guid]::NewGuid().ToString('N'))
$source = Join-Path $stageRoot 'source'
try {
    New-Item -ItemType Directory -Path $source -Force | Out-Null
    $archive = Join-Path $stageRoot 'main.tar'
    Invoke-Checked 'git' @('-C', $repo, 'archive', '--format=tar', "--output=$archive", $commit)
    Invoke-Checked 'tar' @('-xf', $archive, '-C', $source)
    $substitutions = "_IMAGE=$image,_SITE_URL=$SiteUrl,_SITE_INDEXABLE=false,COMMIT_SHA=$commit"
    Invoke-Cloud @('builds', 'submit', $source, "--region=$Region",
        "--config=$(Join-Path $source 'cloudbuild.yaml')",
        "--service-account=projects/$ProjectId/serviceAccounts/$builderEmail",
        "--gcs-source-staging-dir=gs://$bucket/source", "--substitutions=$substitutions")
    # Resolve the immutable digest so the revision is tied to this exact build.
    $imageDetails = (Invoke-Cloud @('artifacts', 'docker', 'images', 'describe', $image,
        '--format=json')) | ConvertFrom-Json
    $digestImage = $imageDetails.image_summary.fully_qualified_digest
    if (-not $digestImage) { throw 'Artifact Registry did not return an image digest.' }
    $voiceFlags = @('--update-env-vars=VOICE_DEMO_ENABLED=false')
    if ($EnableVoice) {
        $voiceFlags = @("--update-env-vars=GOOGLE_CLOUD_PROJECT=$ProjectId,VOICE_DEMO_ENABLED=true,VOICE_PUBLIC_ORIGIN=$SiteUrl,VOICE_MONTHLY_BUDGET_EUR=25,TURNSTILE_SITE_KEY=$TurnstileSiteKey",
            '--update-secrets=VOICE_APP_SECRET=taskflow-voice-app:latest,VOICE_EDGE_SECRET=taskflow-voice-edge:latest,TURNSTILE_SECRET_KEY=taskflow-turnstile:latest')
    }
    Invoke-Cloud (@('run', 'deploy', $Service, "--region=$Region", "--image=$digestImage",
        "--service-account=$runtimeEmail", '--allow-unauthenticated', '--ingress=all',
        '--default-url', '--execution-environment=gen2', '--port=8080', '--cpu=1',
        '--memory=512Mi', '--min=0', '--max=1', '--concurrency=8', '--timeout=60',
        '--cpu-throttling', '--no-cpu-boost',
        "--labels=app=taskflow-web,git-sha=$commit", '--description=TaskFlow marketing preview from main') + $voiceFlags)
    Invoke-Cloud @('run', 'services', 'update-traffic', $Service, "--region=$Region", '--to-latest')
    $url = (Invoke-Cloud @('run', 'services', 'describe', $Service,
        "--region=$Region", '--format=value(status.url)')).Trim()
    $health = Invoke-RestMethod -Uri "$url/health/" -TimeoutSec 90
    if ($health.status -ne 'ok' -or $health.commit -ne $commit) {
        throw 'The public health check did not match the deployed main commit.'
    }
    Write-Host "Deployed origin/main ($commit): $url"
    Write-Host "Shareable preview: $SiteUrl"
} finally {
    # Delete only the unique temporary directory this invocation created.
    $resolvedStage = [System.IO.Path]::GetFullPath($stageRoot)
    $resolvedParent = [System.IO.Directory]::GetParent($resolvedStage).FullName
    if ($resolvedParent.TrimEnd('\', '/') -ne $tempBase.TrimEnd('\', '/') -or
        [System.IO.Path]::GetFileName($resolvedStage) -notmatch '^taskflow-web-deploy-[a-f0-9]{32}$') {
        throw "Unsafe temporary cleanup path: $resolvedStage"
    }
    if (Test-Path -LiteralPath $resolvedStage) {
        Remove-Item -LiteralPath $resolvedStage -Recurse -Force
    }
}
