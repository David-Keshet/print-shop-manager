@echo off
echo ========================================
echo Print Shop Manager - Auto Start Script
echo ========================================
echo.

REM Change to project directory
cd /d "C:\Users\print\.windsurf\worktrees\print-shop-manager\print-shop-manager-7ac386d5"

REM Kill any existing node processes on ports 3000-3010
echo Cleaning up existing processes...
for /l %%i in (3000,1,3010) do (
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":%%i"') do (
        taskkill /F /PID %%a 2>nul
    )
)

REM Wait a moment for cleanup
timeout /t 2 /nobreak >nul

REM Start the server
echo Starting server...
echo Time: %date% %time%
npm run dev

REM If server crashes, wait and restart
echo Server stopped, restarting in 10 seconds...
timeout /t 10 /nobreak >nul
goto :eof
