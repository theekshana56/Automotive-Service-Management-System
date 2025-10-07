@echo off
echo ========================================
echo   ML Inventory System Startup
echo ========================================
echo.

REM Navigate to ML directory
cd /d "%~dp0"

REM Check if virtual environment exists
if not exist "venv\Scripts\activate.bat" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install required packages
echo Installing required packages...
pip install pandas numpy scikit-learn fastapi uvicorn requests

REM Check if data exists
if not exist "data\automotive_parts_usage.csv" (
    echo Generating sample data...
    python src\data_generator.py
)

REM Check if models exist
if not exist "models\part_stats.json" (
    echo Training models...
    python src\linear_model.py
)

REM Start ML service
echo.
echo Starting ML service...
echo Service will be available at: http://localhost:8001
echo API docs will be available at: http://localhost:8001/docs
echo.
echo Press Ctrl+C to stop the service
echo.

python simple_ml_service.py

pause
