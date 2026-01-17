@echo off
title Standalone iCount Service - 24/7
color 0A
echo ========================================
echo Installing Standalone iCount Service
echo ========================================
echo.
echo This service works WITHOUT Supabase dependency
echo Monitors iCount connection 24/7
echo Automatically restarts on failure
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Please run this script as Administrator!
    echo Right-click the file and select "Run as administrator"
    pause
    exit /b 1
)

cd /d "C:\Users\print\.windsurf\worktrees\print-shop-manager\print-shop-manager-7ac386d5"

echo Installing NSSM (if not exists)...

REM Create service directory
if not exist "C:\services" mkdir "C:\services"

REM Download NSSM (if not exists)
if not exist "C:\services\nssm.exe" (
    echo Downloading NSSM...
    powershell -Command "Invoke-WebRequest -Uri 'https://nssm.cc/release/nssm-2.24.zip' -OutFile 'C:\services\nssm.zip'"
    powershell -Command "Expand-Archive -Path 'C:\services\nssm.zip' -DestinationPath 'C:\services' -Force"
    copy "C:\services\nssm-2.24\win64\nssm.exe" "C:\services\" >nul
)

echo Installing Standalone iCount service...

REM Install the service
C:\services\nssm.exe install StandaloneICount "node.exe" "%~dp0standalone-icount-manager.js" "monitor"

REM Configure service
C:\services\nssm.exe set StandaloneICount DisplayName "Standalone iCount Manager - 24/7"
C:\services\nssm.exe set StandaloneICount Description "Monitors iCount connection 24/7 without external dependencies"
C:\services\nssm.exe set StandaloneICount Start SERVICE_AUTO_START
C:\services\nssm.exe set StandaloneICount AppDirectory "%~dp0"
C:\services\nssm.exe set StandaloneICount AppStdout "%~dp0logs\standalone-service.log"
C:\services\nssm.exe set StandaloneICount AppStderr "%~dp0logs\standalone-service-error.log"
C:\services\nssm.exe set StandaloneICount AppRotateFiles 1
C:\services\nssm.exe set StandaloneICount AppRotateOnline 1
C:\services\nssm.exe set StandaloneICount AppRotateBytes 1048576

REM Create logs directory
if not exist "%~dp0logs" mkdir "%~dp0logs"

echo.
echo ========================================
echo Standalone iCount Service Installed!
echo ========================================
echo.
echo ✅ Service Features:
echo    - Works WITHOUT Supabase
echo    - Monitors iCount 24/7
echo    - Auto-restart on failure
echo    - Local credential storage
echo    - Detailed logging
echo.
echo 📋 Service Management:
echo    Start:   net start StandaloneICount
echo    Stop:    net stop StandaloneICount
echo    Status:  sc query StandaloneICount
echo.
echo 🗑️  To uninstall:
echo    C:\services\nssm.exe remove StandaloneICount
echo.
echo 🚀 Starting service now...
net start StandaloneICount

if %errorlevel% equ 0 (
    echo.
    echo ✅ Standalone iCount Service started!
    echo 📝 Logs: %~dp0icount-standalone.log
    echo 📁 Credentials: %~dp0.icount-standalone.json
    echo.
    echo 🎯 NEXT STEPS:
    echo 1. Wait 30 seconds for service to initialize
    echo 2. Check logs: type icount-standalone.log
    echo 3. If needed, run: node standalone-icount-manager.js setup
    echo.
) else (
    echo.
    echo ❌ Failed to start service
    echo Check Windows Event Viewer for details
)

pause
