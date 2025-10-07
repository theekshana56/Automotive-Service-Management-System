@echo off
echo Stopping all Node.js processes...

taskkill /IM node.exe /F > nul 2>&1
taskkill /IM npm.exe /F > nul 2>&1

echo All servers stopped.
pause