@echo off
echo ========================================
echo iCount Setup - One Time Configuration
echo ========================================
echo.

cd /d "C:\Users\print\.windsurf\worktrees\print-shop-manager\print-shop-manager-7ac386d5"

echo 📋 This will configure iCount credentials securely
echo 📋 Credentials will be encrypted and stored locally
echo 📋 The service will maintain connection 24/7
echo.

pause

echo 🔧 Setting up credentials...
node icount-credentials-manager.js

echo.
echo ✅ Setup complete!
echo.
echo 🚀 To install the 24/7 service:
echo    Run: install-icount-service.bat (as Administrator)
echo.
echo 🔄 To test connection now:
echo    Run: test-icount-connection.js
echo.
echo 📝 Your credentials are encrypted and stored in:
echo    .icount-credentials.json
echo.
pause
