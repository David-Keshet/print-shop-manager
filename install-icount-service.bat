@echo off
echo ========================================
echo Installing iCount Connection Service
echo ========================================
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Please run this script as Administrator!
    echo Right-click the file and select "Run as administrator"
    pause
    exit /b 1
)

echo Installing iCount 24/7 Service...

REM Create service directory
if not exist "C:\services" mkdir "C:\services"

REM Download NSSM (if not exists)
if not exist "C:\services\nssm.exe" (
    echo Downloading NSSM...
    powershell -Command "Invoke-WebRequest -Uri 'https://nssm.cc/release/nssm-2.24.zip' -OutFile 'C:\services\nssm.zip'"
    powershell -Command "Expand-Archive -Path 'C:\services\nssm.zip' -DestinationPath 'C:\services' -Force"
    copy "C:\services\nssm-2.24\win64\nssm.exe" "C:\services\" >nul
)

echo Installing iCount Connection service...

REM Install the service
C:\services\nssm.exe install iCountService "%~dp0ensure-icount-connection.bat"

REM Configure service
C:\services\nssm.exe set iCountService DisplayName "iCount Connection Manager - 24/7"
C:\services\nssm.exe set iCountService Description "Ensures iCount connection is always active for Print Shop Manager"
C:\services\nssm.exe set iCountService Start SERVICE_AUTO_START
C:\services\nssm.exe set iCountService AppStdout "%~dp0logs\icount-service.log"
C:\services\nssm.exe set iCountService AppStderr "%~dp0logs\icount-service-error.log"
C:\services\nssm.exe set iCountService AppRotateFiles 1
C:\services\nssm.exe set iCountService AppRotateOnline 1
C:\services\nssm.exe set iCountService AppRotateBytes 1048576

REM Create logs directory
if not exist "%~dp0logs" mkdir "%~dp0logs"

echo.
echo ========================================
echo iCount Service Installation Complete!
echo ========================================
echo.
echo Service Name: iCountService
echo Purpose: Maintains iCount connection 24/7
echo Status: Ready to start
echo.
echo Features:
echo - Automatic credentials management
echo - Connection monitoring every 2 minutes
echo - Auto-restart on failure
echo - Encrypted credential storage
echo.
echo To start the service manually:
echo   net start iCountService
echo.
echo To stop the service:
echo   net stop iCountService
echo.
echo To check service status:
echo   sc query iCountService
echo.
echo To uninstall the service:
echo   C:\services\nssm.exe remove iCountService
echo.
echo Starting service now...
net start iCountService

echo.
echo ✅ iCount Service started! 
echo The connection will be maintained 24/7 automatically
echo.
echo 📋 Next steps:
echo 1. Run: node icount-credentials-manager.js (one-time setup)
echo 2. Enter your iCount credentials when prompted
echo 3. The service will handle everything else automatically
echo.
pause
