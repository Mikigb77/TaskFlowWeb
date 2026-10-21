#Requires -Version 7.2
<#
.SYNOPSIS
Build and start the local website in Docker at http://localhost:3000.
.DESCRIPTION
Uses compose.yaml and the current working-tree source, without Cloud credentials.
Set TASKFLOW_WEB_PORT to use another localhost port. The live AI demo is disabled.
.PARAMETER Plan
Show the command without starting Docker or building the website.
.EXAMPLE
./scripts/deploy-local.ps1 -Plan
#>
[CmdletBinding()]
param([switch]$Plan)
$ErrorActionPreference = 'Stop'
$taskflowWebRoot = Split-Path -Parent $PSScriptRoot
$taskflowCompose = @('compose', '--project-directory', $taskflowWebRoot,
    '--file', (Join-Path $taskflowWebRoot 'compose.yaml'))

if ($Plan) {
    Write-Output "Local website directory: $taskflowWebRoot"
    Write-Output 'docker compose --project-directory <TaskFlowWeb> --file <TaskFlowWeb>/compose.yaml up --build --detach --wait --wait-timeout 180'
    Write-Output 'Uses the current working tree. No cloud deployment or paid AI calls.'
    return
}
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { throw 'Install Docker Desktop and enable Docker Compose.' }
& docker @taskflowCompose up --build --detach --wait --wait-timeout 180
if ($LASTEXITCODE -ne 0) { throw 'The local website did not become healthy. Check docker compose logs in TaskFlowWeb/.' }
$taskflowWebPort = if ($env:TASKFLOW_WEB_PORT) { $env:TASKFLOW_WEB_PORT } else { '3000' }
Write-Output "Local website ready: http://localhost:$taskflowWebPort (live AI demo disabled)."
