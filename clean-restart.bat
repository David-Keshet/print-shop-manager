@echo off
echo 🧹 Cleaning Next.js cache...

REM Kill all node processes
taskkill /F /IM node.exe >nul 2>&1

REM Delete cache directories
if exist .next rmdir /s /q .next
if exist node_modules\.cache rmdir /s /q node_modules\.cache

REM Clean npm cache
npm cache clean --force

echo ✅ Cache cleaned!
echo 🚀 Starting dev server...

REM Start dev server
npm run dev
