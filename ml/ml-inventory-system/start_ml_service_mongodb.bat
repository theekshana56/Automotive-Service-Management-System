@echo off
REM ML Inventory Service Startup Script for Windows

echo Starting ML Inventory Service with MongoDB Integration...

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install requirements
pip install -r requirements_mongodb.txt

REM Start the ML service
echo Starting ML service on port 8001...
python api/ml_service_mongodb.py

pause
