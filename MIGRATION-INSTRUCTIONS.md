# 🚀 הוראות הרצת Migration למערכת החשבוניות

## ⚠️ חשוב!
הרצת ה-migration הזה היא **הכרחית** כדי שמערכת החשבוניות תעבוד. בלי זה:
- לא ניתן לשמור הגדרות iCount
- לא ניתן ליצור חשבוניות
- לא ניתן לסנכרן עם iCount

---

## 📋 שלבים להרצת Migration

### שלב 1: כניסה ל-Supabase
1. היכנס ל-[Supabase Dashboard](https://supabase.com/dashboard)
2. בחר את הפרוייקט שלך
3. עבור ל-**SQL Editor** (בתפריט צד שמאל)

### שלב 2: הרצת ה-SQL
1. לחץ על **+ New Query**
2. **העתק את כל התוכן** מהקובץ `migrations/006_invoices_system.sql`
3. **הדבק** ב-SQL Editor
4. לחץ על **Run** (או Ctrl+Enter)

### שלב 3: בדיקה שהכל עבר בהצלחה
אחרי הרצת ה-migration, אמור לראות הודעה:
```
Success. No rows returned
```

### שלב 4: וידוא שהטבלאות נוצרו
1. עבור ל-**Table Editor**
2. ודא שהטבלאות הבאות קיימות:
   - ✅ `icount_settings`
   - ✅ `invoices`
   - ✅ `invoice_items`
   - ✅ `invoice_payments`
   - ✅ `sync_log`

---

## 🎯 מה ה-Migration יוצר?

### טבלאות:
1. **icount_settings** - הגדרות חיבור ל-iCount (CID, User, Pass מוצפן)
2. **invoices** - חשבוניות
3. **invoice_items** - פריטים בחשבונית
4. **invoice_payments** - תשלומים על חשבוניות
5. **sync_log** - לוג סנכרון עם iCount

### Views (דוחות):
- **active_invoices** - חשבוניות פעילות
- **invoices_due** - חשבוניות לתשלום
- **customer_balances** - סיכום חובות לקוחות

### עמודות חדשות:
- בטבלת **orders**: `invoiced` (האם נוצרה חשבונית)
- בטבלת **customers**: `email`, `tax_id`, `company_name`, `billing_address`, `city`, `postal_code`

---

## ✅ אחרי שה-Migration הצליח

### 1. שמור הגדרות iCount
1. לך לדף **הגדרות > iCount**
2. מלא את הפרטים:
   - **CID**: `printkeshet`
   - **User**: `print`
   - **Pass**: הסיסמה שלך
3. לחץ **שמור הגדרות**
4. עכשיו זה אמור לעבוד! ✅

### 2. צור חשבונית ראשונה
1. לך לדף **הזמנות**
2. בחר הזמנה קיימת
3. לחץ **צור חשבונית**
4. החשבונית תיוצר ותסתנכרן ל-iCount אוטומטית

### 3. צפה בחשבוניות
1. לך לדף **חשבוניות**
2. תראה רשימת חשבוניות עם סטטוסים
3. לחץ על חשבונית לצפייה מפורטת

---

## 🔧 פתרון בעיות

### אם יש שגיאה: "relation does not exist"
- ודא שהרצת את **כל** ה-SQL (263 שורות)
- נסה להריץ שוב

### אם יש שגיאה: "column already exists"
- זה בסדר! המיגריישן כבר רץ חלקית
- אפשר להמשיך

### אם יש שגיאה: "foreign key constraint"
- ודא שהטבלאות `orders` ו-`customers` קיימות
- בדוק שהעמודה `id` בטבלאות אלו היא מסוג UUID

---

## 📞 צריך עזרה?
אם יש בעיה, העתק את הודעת השגיאה המלאה מ-Supabase והודע לי.
