# הגדרת מסד הנתונים ב-Supabase - דפוס קשת

## שלב 1: יצירת הטבלאות

1. היכנס ל-Supabase Dashboard שלך: https://wbahwlbulcbkkcpinett.supabase.co
2. עבור ל-**SQL Editor** בתפריט הצדדי
3. לחץ על **New Query**
4. העתק את כל התוכן מהקובץ `supabase-schema.sql`
5. הדבק אותו ב-SQL Editor
6. לחץ על **Run** (או Ctrl+Enter)

## שלב 2: בדיקה שהטבלאות נוצרו

1. עבור ל-**Table Editor** בתפריט הצדדי
2. ודא שהטבלאות הבאות נוצרו:
   - ✅ customers (לקוחות)
   - ✅ orders (הזמנות)
   - ✅ order_items (פריטי הזמנה)
   - ✅ departments (מחלקות)
   - ✅ columns (עמודות לוח משימות)
   - ✅ tasks (משימות)
   - ✅ users (משתמשים)
   - ✅ settings (הגדרות מערכת)

## שלב 3: בדיקת נתונים ראשוניים

בטבלת **departments** צריכות להופיע 5 מחלקות:
- מזכירות
- עיצוב
- הדפסה
- גימור
- משלוחים

בטבלת **columns** צריכות להופיע 15 עמודות (3 לכל מחלקה):
- ממתין
- בתהליך
- הושלם

בטבלת **settings** צריכות להופיע 5 הגדרות:
- whatsapp_new_order (הודעת WhatsApp להזמנה חדשה)
- whatsapp_order_ready (הודעת WhatsApp להזמנה מוכנה)
- company_name (שם החברה)
- company_phone (טלפון החברה)
- company_email (אימייל החברה)

## שלב 4: בדיקת חיבור

הרץ את הפרויקט:
```bash
npm run dev
```

עבור ל-http://localhost:3002/orders/new ונסה ליצור הזמנה חדשה.

אם הכל עובד - ההזמנה תישמר והודעת הצלחה תופיע!

## פתרון בעיות

### אם הטבלאות כבר קיימות
אם קיבלת שגיאות שהטבלאות כבר קיימות, זה בסדר - המערכת משתמשת ב-`IF NOT EXISTS`.

### אם יש שגיאות הרשאות
ודא שה-Anon Key תקין בקובץ `.env.local`

### אם ההזמנה לא נשמרת
1. בדוק את ה-Console בדפדפן (F12)
2. בדוק את ה-Network tab לשגיאות
3. ודא שה-Supabase URL ו-Key תקינים
