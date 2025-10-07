@echo off
echo Starting Automotive Service Management System...

echo.
echo Starting Server...
start cmd /k "cd /d %~dp0server && npm start"

timeout /t 3 /nobreak > nul

echo.
echo Starting Client...
start cmd /k "cd /d %~dp0client && npm run dev"

echo.
echo Both servers are starting...
echo Server: http://localhost:5000
echo Client: http://localhost:5173
echo.
pause