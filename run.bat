@echo off
echo Starting Team Work Flow Tracker...

:: Start Backend in a new window
start "TeamTrack Backend" cmd /k "cd /d "%~dp0" && backend\venv\Scripts\python.exe -m uvicorn backend.main:app --reload"

:: Start Frontend in a new window
start "TeamTrack Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo Both servers are starting in new windows!
