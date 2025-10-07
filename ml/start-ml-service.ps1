Param(
    [int]$Port = 8001,
    [switch]$AllInterfaces
)

$ErrorActionPreference = 'Stop'
Write-Host "[ML-SCRIPT] Starting ML service on port $Port" -ForegroundColor Cyan

$mlRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $mlRoot

if (-not (Test-Path 'venv')) {
    Write-Host '[ML-SCRIPT] Creating virtual environment...' -ForegroundColor Yellow
    python -m venv venv
}

# Activate
. ./venv/Scripts/Activate.ps1

Write-Host '[ML-SCRIPT] Python:' (python --version)
Write-Host '[ML-SCRIPT] Pip version:' (python -m pip --version)

if (-not (Get-Command uvicorn -ErrorAction SilentlyContinue)) {
    Write-Host '[ML-SCRIPT] Installing requirements...' -ForegroundColor Yellow
    python -m pip install --upgrade pip setuptools wheel
    python -m pip install -r requirements.txt
}

if (-not (Test-Path 'data/dataset.csv')) {
    Write-Host '[ML-SCRIPT] Generating synthetic dataset...' -ForegroundColor Yellow
    python -m src.sample_data_generator --days 90 --parts 6
}

if (-not (Test-Path 'models/model_metadata.json')) {
    Write-Host '[ML-SCRIPT] Training baseline models...' -ForegroundColor Yellow
    python -m src.train_baseline --data data/dataset.csv
}

$hostParam = '127.0.0.1'
if ($AllInterfaces) { $hostParam = '0.0.0.0' }

Write-Host "[ML-SCRIPT] Launching uvicorn (host=$hostParam port=$Port)" -ForegroundColor Green
uvicorn src.service:app --host $hostParam --port $Port --reload --log-level info
