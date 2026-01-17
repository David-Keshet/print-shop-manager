@echo off
title iCount Connection Manager - 24/7 Service
color 0B
echo ========================================
echo iCount Connection Manager - 24/7
echo ========================================
echo.

REM Change to project directory
cd /d "C:\Users\print\.windsurf\worktrees\print-shop-manager\print-shop-manager-7ac386d5"

:MAIN_LOOP
echo [%date% %time%] Checking iCount connection...

REM Check if credentials exist
if not exist ".icount-credentials.json" (
    echo [%date% %time%] Setting up credentials...
    node icount-credentials-manager.js
)

REM Update env file with latest credentials
node -e "const manager = require('./icount-credentials-manager.js'); new manager().updateEnvFile();"

REM Check if server is running
netstat -an | findstr ":3000" >nul
if %errorlevel% neq 0 (
    echo [%date% %time%] Server not running, starting...
    start /B npm run dev
    timeout /t 15 /nobreak >nul
)

REM Test iCount connection
echo [%date% %time%] Testing iCount connection...
node test-icount-connection.js >nul 2>&1

if %errorlevel% equ 0 (
    echo [%date% %time%] ✅ iCount connection OK
) else (
    echo [%date% %time%] ❌ iCount connection failed, restarting server...
    taskkill /F /IM node.exe >nul 2>&1
    timeout /t 5 /nobreak >nul
    start /B npm run dev
)

REM Check every 2 minutes
echo [%date% %time%] Next check in 2 minutes...
timeout /t 120 /nobreak >nul

goto MAIN_LOOP
