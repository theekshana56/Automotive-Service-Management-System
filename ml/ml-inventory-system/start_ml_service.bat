@echo off
echo 🚀 Starting ML Inventory Forecasting Service...
echo.

REM Navigate to ML directory
cd /d "%~dp0"

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Check if virtual environment is activated
if "%VIRTUAL_ENV%"=="" (
    echo ❌ Virtual environment not activated. Please run setup first.
    pause
    exit /b 1
)

echo ✅ Virtual environment activated: %VIRTUAL_ENV%
echo.

REM Check if data exists
if not exist "data\automotive_parts_usage.csv" (
    echo 📊 Generating sample data...
    python src\data_generator.py
    echo.
)

REM Check if models exist
if not exist "models\part_stats.json" (
    echo 🤖 Training models...
    python src\linear_model.py
    echo.
)

REM Start ML service
echo 🌐 Starting FastAPI service on http://localhost:8001
echo 📖 API docs available at http://localhost:8001/docs
echo.
python api\ml_service.py

pause
