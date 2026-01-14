# משימות מערכת החשבוניות - iCount Integration

## ✅ הושלם
- [x] חיבור ל-API של iCount - עובד בהצלחה
- [x] אימות עם CID: printkeshet, User: print
- [x] קבלת Session ID
- [x] יצירת ICountClient
- [x] הגדרות סביבה (.env.local)
- [x] נקודת בדיקה (API test endpoint)

## 📋 משימות שנותרו

### 1. בסיס נתונים
- [ ] הרצת migration: `migrations/006_invoices_system.sql` ב-Supabase
  - טבלת `invoices` - חשבוניות
  - טבלת `invoice_items` - פריטי חשבונית
  - טבלת `invoice_sync_log` - לוג סנכרון
  - אינדקסים ו-constraints

### 2. API Endpoints - חשבוניות
- [x] `/api/invoices` - קבלת רשימת חשבוניות
- [x] `/api/invoices/[id]` - פרטי חשבונית ספציפית (GET, PUT, DELETE)
- [x] `/api/invoices/create` - יצירת חשבונית חדשה
- [x] `/api/invoices/sync` - סנכרון עם iCount
- [x] `/api/invoices/[id]/payment` - רישום תשלום על חשבונית
- [ ] `/api/invoices/send` - שליחת חשבונית במייל

### 3. שירותי חשבוניות (invoiceService.js)
- [x] בדיקה ועדכון של קובץ `src/lib/icount/invoiceService.js`
- [x] פונקציות ליצירת חשבונית מהזמנה
- [x] סנכרון דו-כיווני עם iCount
- [x] ניהול סטטוסים (draft, sent, paid)
- [x] טיפול בשגיאות offline/online

### 4. ממשק משתמש - עמוד חשבוניות
- [x] תיקון `src/app/invoices/page.js` - רשימת חשבוניות
  - טבלה עם פילטרים (סטטוס, תאריך, לקוח)
  - חיפוש חשבוניות
  - כפתור יצירת חשבונית חדשה
  - אינדיקטור סנכרון

### 5. ממשק משתמש - פרטי חשבונית
- [x] תיקון `src/app/invoices/[id]/page.js` - פרטי חשבונית
  - הצגת כל פרטי החשבונית
  - רשימת פריטים
  - סטטוס תשלום
  - כפתורי פעולה (הורדת PDF, שליחה במייל, סנכרון)
  - רישום תשלומים

### 6. אינטגרציה עם הזמנות
- [x] עדכון `src/app/orders/page.js`
  - כפתור "צור חשבונית" בכל הזמנה
  - קישור לחשבונית אם קיימת
  - אינדיקטור סטטוס חשבונית

### 7. הגדרות iCount
- [ ] תיקון `src/app/settings/icount/page.js`
  - הצגת סטטוס חיבור
  - ניהול פרטי התחברות
  - בדיקת חיבור
  - הגדרות סנכרון (אוטומטי/ידני, תדירות)

### 8. תיקון באגים ידועים
- [ ] תיקון `src/app/test-icount/page.js` - שגיאת webpack
- [ ] תיקון endpoint `doc/list` - מחזיר "bad_method"
  - צריך לברר מה הפרמטרים הנכונים
- [ ] בדיקה שה-SID Token עובד (כרגע רק CID/User/Pass עובד)

### 9. דוחות (Reports) - לפי בקשת המשתמש
- [ ] דוח הזמנות לקוח
- [ ] דוח חייבים
- [ ] דוח חשבוניות פתוחות
- [ ] דוח חשבוניות באיחור
- [ ] דוח לקוח מפורט

### 10. בדיקות ותיקוף
- [ ] בדיקת יצירת חשבונית ראשונה
- [ ] בדיקת סנכרון עם iCount
- [ ] בדיקת שליחת חשבונית במייל
- [ ] בדיקת הורדת PDF
- [ ] בדיקת offline mode
- [ ] בדיקת טיפול בשגיאות

### 11. תיעוד
- [ ] הוספת הערות לקוד
- [ ] יצירת README עם הוראות שימוש
- [ ] תיעוד API endpoints
- [ ] תיעוד מבנה מסד הנתונים

## 🔧 טכנולוגיות
- **Frontend**: Next.js 14 (App Router), React, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **External API**: iCount API v3
- **Authentication**: CID/User/Pass → Session ID

## 📝 הערות חשבות
1. **אל תבצע GIT commit** עד שהכל עובד ומאומת
2. **CID הנכון**: `printkeshet` (מחרוזת, לא מספר!)
3. **SID Token לא עובד**: צריך להשתמש ב-CID/User/Pass login
4. **מצב Offline**: המערכת צריכה לעבוד גם בלי אינטרנט ולסנכרן אחר כך

## 🎯 סדר ביצוע מומלץ
1. הרצת migration בבסיס הנתונים
2. בדיקת invoiceService
3. יצירת API endpoints
4. בניית ממשק משתמש
5. אינטגרציה עם הזמנות
6. בדיקות מקיפות
7. GIT commit

---
**תאריך יצירה**: 2026-01-14
**סטטוס**: החיבור ל-iCount עובד ✅ | נותר ליישם את הפונקציונליות
