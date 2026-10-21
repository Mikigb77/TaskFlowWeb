#Requires -Version 7.2
<#
.SYNOPSIS
Temporarily exempts one signed browser from the voice demo's daily allowances.
.DESCRIPTION
Open https://taskflow.garbar.tech/?developer=1#voice, open the live demo,
and copy its Browser testing code. Only an authorized Google Cloud owner can
grant access. The code is not a password and the URL flag grants no access.
Expiry is enforced by the server on every request, without a scheduled job.
Bot checks, per-minute rate limits, upload limits and the AI budget still apply.
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [ValidatePattern('^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$')]
    [string]$BrowserCode,
    [ValidateRange(1, 60)][int]$Minutes = 30,
    [switch]$Revoke,
    [ValidatePattern('^[a-z][a-z0-9-]{4,28}[a-z0-9]$')]
    [string]$ProjectId = 'taskflow-511107',
    [ValidatePattern('^[^\s,=]+@[^\s,=]+$')]
    [string]$Account = 'tech.garbar@gmail.com'
)
$ErrorActionPreference = 'Stop'
$token = (& gcloud auth print-access-token "--account=$Account" "--project=$ProjectId").Trim()
if ($LASTEXITCODE -ne 0 -or -not $token) { throw 'Sign in to the authorized Google Cloud account first.' }
try {
    $started = [DateTimeOffset]::UtcNow
    $until = $started.AddMinutes($Minutes)
    $fields = @{
        developerStartedAt = @{ integerValue = if ($Revoke) { '0' } else { [string]$started.ToUnixTimeMilliseconds() } }
        developerUntil = @{ integerValue = if ($Revoke) { '0' } else { [string]$until.ToUnixTimeMilliseconds() } }
        expiresAt = @{ timestampValue = $started.AddDays(2).ToString('o') }
    }
    # Patch only the grant and TTL. Preserve attempts and unrelated fields,
    # including when a submission updates this document concurrently.
    $mask = 'updateMask.fieldPaths=developerStartedAt&updateMask.fieldPaths=developerUntil&updateMask.fieldPaths=expiresAt'
    $uri = "https://firestore.googleapis.com/v1/projects/$ProjectId/databases/(default)/documents/voiceVisitors/${BrowserCode}?$mask"
    $response = Invoke-RestMethod -Method Patch -Uri $uri `
        -Headers @{ Authorization = "Bearer $token" } -ContentType 'application/json' `
        -Body (@{ fields = $fields } | ConvertTo-Json -Depth 4)
    $actualUntil = [long]$response.fields.developerUntil.integerValue
    if ($actualUntil -ne $(if ($Revoke) { 0 } else { $until.ToUnixTimeMilliseconds() })) {
        throw 'The stored expiry did not match. Check the browser status before testing.'
    }
    [ordered]@{
        browserCode = $BrowserCode
        developerTesting = -not [bool]$Revoke
        expiresLocal = if ($Revoke) { $null } else { $until.ToLocalTime().ToString('yyyy-MM-dd HH:mm:ss zzz') }
        expiresUTC = if ($Revoke) { $null } else { $until.ToString('o') }
        publicSubmissionsPer24Hours = 3
        note = 'Click Check developer access in this browser. Daily limits return automatically; AI spending and bot protections remain active.'
    } | ConvertTo-Json
} finally { $token = $null }
