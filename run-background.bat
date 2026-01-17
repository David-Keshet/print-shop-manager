@echo off
echo Starting Print Shop Manager in background...
cd /d "C:\Users\print\.windsurf\worktrees\print-shop-manager\print-shop-manager-7ac386d5"
start /MIN cmd /c "npm run dev"
echo Server started in background window
echo Access at: http://localhost:3000
echo.
echo To stop: Close the background window or run taskkill /F /IM node.exe
pause
