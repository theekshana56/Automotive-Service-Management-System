@echo off
echo ========================================
echo   Enhanced ML Service Startup
echo ========================================
echo.

REM Navigate to ML directory
cd /d "%~dp0"

echo Starting Enhanced ML Service with all 45 parts...
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python 3.8 or higher
    pause
    exit /b 1
)

REM Install required packages
echo Installing required packages...
pip install fastapi uvicorn pydantic pandas numpy

REM Check if enhanced data exists
if not exist "data\automotive_parts_usage_enhanced.csv" (
    echo Generating enhanced usage data for all 45 parts...
    python src\enhanced_data_generator.py
    echo.
)

REM Start enhanced ML service
echo.
echo Starting Enhanced ML Service...
echo Service will be available at: http://localhost:8001
echo API docs will be available at: http://localhost:8001/docs
echo.
echo Features:
echo - All 45 parts from your database
echo - Realistic usage patterns
echo - Seasonal and weekly patterns
echo - Dynamic reorder recommendations
echo - Model performance metrics
echo - Inventory optimization insights
echo.
echo Press Ctrl+C to stop the service
echo.

python enhanced_ml_service.py

pause
