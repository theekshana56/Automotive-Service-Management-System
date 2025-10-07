# Runs a series of diagnostics to figure out why ML service can't be reached.
Param(
  [int]$Port = 8001
)

$ErrorActionPreference = 'Continue'
$mlRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $mlRoot

Write-Host '--- ML SERVICE DIAGNOSTICS ---' -ForegroundColor Cyan

Write-Host '[1] Current Directory:' (Get-Location)
Write-Host '[2] Dataset exists:' (Test-Path 'data/dataset.csv')
Write-Host '[3] Models metadata exists:' (Test-Path 'models/model_metadata.json')

Write-Host '[4] Checking virtual environment python path:'
if (Test-Path 'venv/Scripts/python.exe') {
  & venv/Scripts/python.exe -c "import sys;print(sys.executable)"
} else {
  Write-Host '  venv not found.' -ForegroundColor Yellow
}

Write-Host '[5] FastAPI import test:'
if (Test-Path 'venv/Scripts/python.exe') {
  try { & venv/Scripts/python.exe -c "import fastapi,uvicorn;print('  FastAPI OK')" } catch { Write-Host $_ -ForegroundColor Red }
}

Write-Host "[6] Netstat for port $Port:" -ForegroundColor Cyan
netstat -ano | Select-String $Port | ForEach-Object { $_ }

Write-Host '[7] Listing running python processes:'
Get-Process python -ErrorAction SilentlyContinue | Select-Object Id,ProcessName,Path,StartTime

Write-Host '[8] Sample direct uvicorn dry-run (5s timeout)...'
$job = Start-Job -ScriptBlock {
  Set-Location $using:mlRoot
  & $using:mlRoot/venv/Scripts/python.exe -m uvicorn src.service:app --host 127.0.0.1 --port $using:Port --log-level warning
} | Out-Null
Start-Sleep -Seconds 5

Write-Host '[8a] Checking if port now listening:'
netstat -ano | Select-String $Port | ForEach-Object { $_ }

Write-Host '[8b] Stopping temp job'
Get-Job | Remove-Job -Force

Write-Host '--- END DIAGNOSTICS ---' -ForegroundColor Cyan
