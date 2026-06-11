@echo off
echo Starting AutoElite full stack (AI API + Server + Client)...
echo.

REM Start ML Inventory Service (Python)
echo Starting ML Inventory Service on http://localhost:8001 ...
start cmd /k "cd /d %~dp0ml\ml-inventory-system && start_ml_service_mongodb.bat"

REM Wait a moment for API to boot
timeout /t 3 /nobreak > nul

REM Start Node server (port 5000)
echo Starting Node server on http://localhost:5000 ...
start cmd /k "cd /d %~dp0server && npm start"

REM Wait a moment for server to boot
timeout /t 3 /nobreak > nul

REM Start Vite client (port 5173)
echo Starting Vite client on http://localhost:5173 ...
start cmd /k "cd /d %~dp0client && npm run dev -- --host"

echo.
echo Services launching:
echo  - ML Service:  http://localhost:8001/health
echo  - Server:      http://localhost:5000/api/health
echo  - Client:      http://localhost:5173
echo.
echo Note: Connecting to MongoDB via MONGO_URI configured in the .env file.
echo.
pause


