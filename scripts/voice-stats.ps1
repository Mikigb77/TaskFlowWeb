#Requires -Version 7.2
param([string]$ProjectId = 'taskflow-511107', [string]$Account = 'tech.garbar@gmail.com', [ValidatePattern('^\d{4}-\d{2}$')][string]$Month = [DateTime]::UtcNow.ToString('yyyy-MM'))
$ErrorActionPreference = 'Stop'
$token = (& gcloud auth print-access-token "--account=$Account" "--project=$ProjectId").Trim()
if ($LASTEXITCODE -ne 0) { throw 'Sign in to Google Cloud first.' }
try {
    $doc = Invoke-RestMethod -Uri "https://firestore.googleapis.com/v1/projects/$ProjectId/databases/(default)/documents/voiceMonths/$Month" -Headers @{ Authorization = "Bearer $token" }
} catch { if ([int]$_.Exception.Response.StatusCode -eq 404) { Write-Host "No demo usage in $Month."; return }; throw }
finally { $token = $null }
function Number-Field([string]$Name) {
    $field = $doc.fields.$Name
    if ($field.integerValue) { return [double]$field.integerValue }
    if ($field.doubleValue) { return [double]$field.doubleValue }
    return 0
}
$requests = Number-Field 'requests'
$charged = (Number-Field 'chargedMicros') / 1000000
$reserved = (Number-Field 'reservedMicros') / 1000000
$cap = (Number-Field 'budgetMicros') / 1000000
[ordered]@{
    monthUTC = $Month; attempts = $requests; successful = Number-Field 'succeeded'; failed = Number-Field 'failed'
    drafts = Number-Field 'taskCount'; audioMinutes = [Math]::Round((Number-Field 'audioSeconds') / 60, 2)
    textAttempts = Number-Field 'textRequests'; audioAttempts = Number-Field 'audioRequests'
    conservativeChargeEUR = [Math]::Round($charged, 5); pendingOrUnsettledEUR = [Math]::Round($reserved, 5)
    monthlyPauseEUR = $cap; remainingEUR = [Math]::Round([Math]::Max([double]0, [double]($cap - $charged)), 5)
    meanCostPerAttemptEUR = if ($requests) { [Math]::Round($charged / $requests, 5) } else { 0 }
    note = 'Conservative estimate, not a Google invoice. Failed/unknown calls reserve EUR 0.02. Hosting, Firestore, tax, and any other Google usage are separate.'
} | ConvertTo-Json
