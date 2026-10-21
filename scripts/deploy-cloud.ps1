#Requires -Version 7.2
<#
.SYNOPSIS
Build and deploy the website from origin/main to Google Cloud Run.
.DESCRIPTION
The shared implementation lives in scripts/dev/deploy-cloud-run.ps1.
Requires Git, tar and an authenticated Google Cloud SDK. Does not deploy the edge.
The protected live voice demo is enabled by default.
.PARAMETER DisableVoice
Explicitly disable the live voice demo for this deployment.
.PARAMETER Plan
Check cloud access and the main release commit without deploying resources.
.EXAMPLE
./scripts/deploy-cloud.ps1 -Plan
#>
[CmdletBinding()]
param(
    [Alias('Project')][string]$ProjectId,
    [string]$Account,
    [string]$Region,
    [string]$Service,
    [string]$SiteUrl,
    [switch]$DisableVoice,
    [string]$TurnstileSiteKey,
    [switch]$Plan
)
$ErrorActionPreference = 'Stop'
$global:LASTEXITCODE = 0
& (Join-Path $PSScriptRoot 'dev/deploy-cloud-run.ps1') @PSBoundParameters
if ($global:LASTEXITCODE -ne 0) { exit $global:LASTEXITCODE }
