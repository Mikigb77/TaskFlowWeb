#Requires -Version 7.2
# Additional provider-side safeguard. Google enforcement can lag behind usage;
# the application's conservative reservation counter is the first line of defense.
param([string]$ProjectId = 'taskflow-511107', [string]$Account = 'tech.garbar@gmail.com')
$ErrorActionPreference = 'Stop'
$flags = @("--project=$ProjectId", "--account=$Account", '--quiet')
& gcloud services enable billingbudgets.googleapis.com cloudbilling.googleapis.com @flags
if ($LASTEXITCODE -ne 0) { throw 'Could not enable the billing APIs.' }
$project = (& gcloud projects describe $ProjectId --format=json @flags) | ConvertFrom-Json
$billing = (& gcloud billing projects describe $ProjectId --format=json @flags) | ConvertFrom-Json
if (-not $billing.billingEnabled) { throw 'Existing billing is required.' }
$token = (& gcloud auth print-access-token @flags).Trim()
try {
    $headers = @{ Authorization = "Bearer $token"; 'x-goog-user-project' = $ProjectId }
    $accountInfo = Invoke-RestMethod -Uri "https://cloudbilling.googleapis.com/v1/$($billing.billingAccountName)" -Headers $headers
    if ($accountInfo.currencyCode -ne 'EUR') { throw 'This script expects EUR billing; no budget has been created.' }
    $url = "https://billingbudgets.googleapis.com/v1/$($billing.billingAccountName)/budgets"
    $existing = Invoke-RestMethod -Uri $url -Headers $headers
    $match = @($existing.budgets | Where-Object { $_.spendCap -and "projects/$($project.projectNumber)" -in $_.budgetFilter.projects -and 'services/C7E2-9256-1C43' -in $_.budgetFilter.services })
    if ($match.Count) {
        if ($match[0].amount.specifiedAmount.currencyCode -ne 'EUR' -or [decimal]$match[0].amount.specifiedAmount.units -ne 25) { throw 'A different AI spend cap already exists; inspect it before changing it.' }
        $saved = $match[0]
    } else {
        $body = @{
            displayName = 'TaskFlow AI monthly EUR 25 pause'
            budgetFilter = @{ projects = @("projects/$($project.projectNumber)"); services = @('services/C7E2-9256-1C43'); calendarPeriod = 'MONTH'; creditTypesTreatment = 'EXCLUDE_ALL_CREDITS' }
            amount = @{ specifiedAmount = @{ currencyCode = 'EUR'; units = '25' } }
            thresholdRules = @(@{ thresholdPercent = 0.5; spendBasis = 'CURRENT_SPEND' }, @{ thresholdPercent = 0.8; spendBasis = 'CURRENT_SPEND' }, @{ thresholdPercent = 1.0; spendBasis = 'CURRENT_SPEND' })
            notificationsRule = @{ enableProjectLevelRecipients = $true; disableDefaultIamRecipients = $false }
            spendCap = @{ inputState = 'CONFIGURED' }
        } | ConvertTo-Json -Depth 8
        $saved = Invoke-RestMethod -Method Post -Uri $url -Headers $headers -ContentType 'application/json' -Body $body
    }
    [ordered]@{ name = $saved.name; amount = $saved.amount; spendCap = $saved.spendCap; scope = 'Only TaskFlow managed AI; website hosting stays available.' } | ConvertTo-Json -Depth 5
} finally { $token = $null; $headers = $null }
