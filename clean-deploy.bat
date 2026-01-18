@echo off
echo 🧹 מתחיל ניקוי מלא לפני דיפלוי...

REM ניקוי קבצי Vercel
echo 🗑️ מוחק קבצי Vercel...
if exist .vercel rmdir /s /q .vercel
if exist vercel.json del vercel.json

REM ניקוי build ו-cache
echo 🗑️ מוחק קבצי build...
if exist .next rmdir /s /q .next
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json

REM ניקוי npm cache
echo 🗑️ מנקה npm cache...
npm cache clean --force

REM התקנה מחדש
echo 📦 מתקין dependencies מחדש...
npm install

REM בדיקת build מקומית
echo 🔍 בודק build מקומי...
npm run build

REM יצירת vercel.json חדש
echo ⚙️ יוצר קובץ Vercel חדש...
echo { "version": 2, "name": "print-shop-manager", "buildCommand": "next build", "outputDirectory": ".next", "installCommand": "npm install", "framework": "nextjs" } > vercel.json

echo ✅ ניקוי הסתיים בהצלחה!
echo 🚀 מוכן לדיפלוי ל-Vercel!
pause
