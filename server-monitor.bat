@echo off
title Print Shop Manager - 24/7 Service
color 0A
echo ========================================
echo Print Shop Manager - 24/7 Service
echo ========================================
echo.

:MAIN_LOOP
echo [%date% %time%] Starting server monitoring...

REM Change to project directory
cd /d "C:\Users\print\.windsurf\worktrees\print-shop-manager\print-shop-manager-7ac386d5"

REM Check if server is running on port 3000
netstat -an | findstr ":3000" >nul
if %errorlevel% equ 0 (
    echo [%date% %time%] Server is running on port 3000
) else (
    echo [%date% %time%] Server not found, starting...
    
    REM Kill any remaining node processes
    taskkill /F /IM node.exe >nul 2>&1
    
    REM Wait a moment
    timeout /t 3 /nobreak >nul
    
    REM Start server in background
    start /B npm run dev
    
    REM Wait for server to start
    timeout /t 15 /nobreak >nul
    
    echo [%date% %time%] Server started
)

REM Check every 30 seconds
echo [%date% %time%] Next check in 30 seconds...
timeout /t 30 /nobreak >nul

goto MAIN_LOOP
