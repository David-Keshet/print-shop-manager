#!/bin/bash

# סקריפט ניקוי מלא לפני דיפלוי
echo "🧹 מתחיל ניקוי מלא לפני דיפלוי..."

# ניקוי קבצי Vercel
echo "🗑️ מוחק קבצי Vercel..."
rm -rf .vercel vercel.json

# ניקוי build ו-cache
echo "🗑️ מוחק קבצי build..."
rm -rf .next node_modules package-lock.json

# ניקוי npm cache
echo "🗑️ מנקה npm cache..."
npm cache clean --force

# התקנה מחדש
echo "📦 מתקין dependencies מחדש..."
npm install

# בדיקת build מקומית
echo "🔍 בודק build מקומי..."
npm run build

# יצירת vercel.json חדש
echo "⚙️ יוצר קובץ Vercel חדש..."
cat > vercel.json << EOF
{
  "version": 2,
  "name": "print-shop-manager",
  "buildCommand": "next build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "framework": "nextjs"
}
EOF

echo "✅ ניקוי הסתיים בהצלחה!"
echo "🚀 מוכן לדיפלוי ל-Vercel!"
