@echo off
title Start Standalone iCount Manager
color 0A
echo ========================================
echo Starting Standalone iCount Manager
echo ========================================
echo.
echo 🚀 This will start iCount monitoring WITHOUT Supabase
echo ⚡ 24/7 operation - no external dependencies
echo 🔒 Local credential storage
echo.

cd /d "C:\Users\print\.windsurf\worktrees\print-shop-manager\print-shop-manager-7ac386d5"

echo 📋 Using your iCount credentials:
echo    CID: printkeshet
echo    User: print
echo    Pass: ***HIDDEN***
echo    SID: API3E8-C0A80C03-696793EE-D1C70480C4DECFF5
echo.

echo 🔧 Creating credentials file...
(
echo {
echo   "cid": "printkeshet",
echo   "user": "print", 
echo   "pass": "958075daV+-",
echo   "sid": "API3E8-C0A80C03-696793EE-D1C70480C4DECFF5",
echo   "created": "%date% %time%",
echo   "source": "manual"
echo }
) > .icount-standalone.json

echo ✅ Credentials file created

echo 🚀 Starting 24/7 monitoring...
start /B node standalone-icount-manager.js monitor

echo.
echo ✅ Standalone iCount Manager started!
echo 📝 Logs: icount-standalone.log
echo 📁 Credentials: .icount-standalone.json
echo.
echo 🎯 To check status:
echo    node standalone-icount-manager.js status
echo.
echo 🛑 To stop:
echo    taskkill /F /IM node.exe
echo.
echo 🔄 To restart:
echo    start-standalone-icount.bat
echo.
pause
