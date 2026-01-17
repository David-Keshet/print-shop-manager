@echo off
echo ========================================
echo Installing Print Shop Manager as Service
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

echo Installing NSSM (Non-Sucking Service Manager)...

REM Create service directory
if not exist "C:\services" mkdir "C:\services"

REM Download NSSM (if not exists)
if not exist "C:\services\nssm.exe" (
    echo Downloading NSSM...
    powershell -Command "Invoke-WebRequest -Uri 'https://nssm.cc/release/nssm-2.24.zip' -OutFile 'C:\services\nssm.zip'"
    powershell -Command "Expand-Archive -Path 'C:\services\nssm.zip' -DestinationPath 'C:\services' -Force"
    copy "C:\services\nssm-2.24\win64\nssm.exe" "C:\services\" >nul
)

echo Installing Print Shop Manager service...

REM Install the service
C:\services\nssm.exe install PrintShopManager "%~dp0server-monitor.bat"

REM Configure service
C:\services\nssm.exe set PrintShopManager DisplayName "Print Shop Manager Service"
C:\services\nssm.exe set PrintShopManager Description "Print Shop Manager - 24/7 Production Server"
C:\services\nssm.exe set PrintShopManager Start SERVICE_AUTO_START
C:\services\nssm.exe set PrintShopManager AppStdout "%~dp0logs\service.log"
C:\services\nssm.exe set PrintShopManager AppStderr "%~dp0logs\service_error.log"

REM Create logs directory
if not exist "%~dp0logs" mkdir "%~dp0logs"

echo.
echo ========================================
echo Service Installation Complete!
echo ========================================
echo.
echo Service Name: PrintShopManager
echo Status: Ready to start
echo.
echo To start the service manually:
echo   net start PrintShopManager
echo.
echo To stop the service:
echo   net stop PrintShopManager
echo.
echo To uninstall the service:
echo   C:\services\nssm.exe remove PrintShopManager
echo.
echo Starting service now...
net start PrintShopManager

echo.
echo Service started! The server will now run 24/7
echo You can close this window safely.
pause
