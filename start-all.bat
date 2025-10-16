@echo off
echo Starting AutoElite full stack (AI API + Server + Client)...
echo.

REM Start Elite Bot API (Python)
echo Starting Elite Bot API on http://127.0.0.1:5001 ...
start cmd /k "cd /d %~dp0ml && python start_elite_bot_api.py --skip-training --host 127.0.0.1 --port 5001"

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
echo  - Elite Bot API:  http://127.0.0.1:5001/health
echo  - Server:         http://localhost:5000/api/health
echo  - Client:         http://localhost:5173
echo.
echo Note: Ensure MongoDB is running locally on port 27017 before starting the server.
echo.
pause


