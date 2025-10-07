Param(
  [int]$Port = 8001,
  [switch]$Reload,
  [switch]$AllInterfaces
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$ml = Join-Path $root 'ml'
if (-not (Test-Path $ml)) { Write-Host "[RUN-ML] ml folder not found." -ForegroundColor Red; exit 1 }
Set-Location $ml

Write-Host "[RUN-ML] Working directory: $(Get-Location)" -ForegroundColor Cyan

if (-not (Test-Path 'venv/Scripts/Activate.ps1')) {
  Write-Host '[RUN-ML] Creating virtual environment...' -ForegroundColor Yellow
  python -m venv venv
}

. ./venv/Scripts/Activate.ps1
Write-Host "[RUN-ML] Python: $(python --version)" -ForegroundColor Green

if (-not (Get-Command uvicorn -ErrorAction SilentlyContinue)) {
  Write-Host '[RUN-ML] Installing requirements...' -ForegroundColor Yellow
  python -m pip install --upgrade pip setuptools wheel
  python -m pip install -r requirements.txt
}

if (-not (Test-Path 'data/dataset.csv')) {
  Write-Host '[RUN-ML] Generating synthetic dataset (90 days, 6 parts)...' -ForegroundColor Yellow
  python -m src.sample_data_generator --days 90 --parts 6
}

if (-not (Test-Path 'models/model_metadata.json')) {
  Write-Host '[RUN-ML] Training baseline models...' -ForegroundColor Yellow
  python -m src.train_baseline --data data/dataset.csv
}

$hostBind = if ($AllInterfaces) { '0.0.0.0' } else { '127.0.0.1' }

Write-Host "[RUN-ML] Launching service host=$hostBind port=$Port reload=$Reload" -ForegroundColor Cyan

if ($Reload) { $env:ML_SERVICE_RELOAD = '1' } else { Remove-Item Env:ML_SERVICE_RELOAD -ErrorAction SilentlyContinue }
$env:ML_SERVICE_PORT = "$Port"
$env:ML_SERVICE_HOST = $hostBind

python -m src.service
