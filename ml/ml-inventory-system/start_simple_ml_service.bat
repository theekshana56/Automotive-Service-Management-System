@echo off
REM Simple ML Service Starter for Windows
REM This starts a basic ML service with fallback data

echo Starting Simple ML Service...
echo This service provides basic ML functionality with sample data
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python 3.8 or higher
    pause
    exit /b 1
)

REM Install basic requirements if needed
echo Installing basic requirements...
pip install fastapi uvicorn pydantic

REM Start the simple ML service
echo.
echo Starting ML service on port 8001...
echo You can test it at: http://localhost:8001/health
echo.
python simple_ml_service_starter.py

pause
