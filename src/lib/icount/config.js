/**
 * iCount API Configuration
 * התצורה לחיבור ל-API של iCount
 */

export const ICOUNT_CONFIG = {
  // כתובת API של iCount
  baseUrl: 'https://api.icount.co.il/api/v3.php',

  // Base URL without method
  apiBaseUrl: 'https://api.icount.co.il/api/v3.php',

  // זמן המתנה מקסימלי לבקשות (30 שניות)
  timeout: 30000,

  // האם לעבוד במצב אופליין כברירת מחדל
  offlineMode: false,

  // זמן בין ניסיונות סנכרון (5 דקות)
  syncInterval: 5 * 60 * 1000,
}

/**
 * סוגי מסמכים ב-iCount
 */
export const DOCUMENT_TYPES = {
  INVOICE: 'invoice',                    // חשבונית
  INVOICE_RECEIPT: 'invoice_receipt',    // חשבונית מס קבלה
  RECEIPT: 'receipt',                    // קבלה
  CREDIT: 'credit',                      // חשבונית זיכוי
  QUOTE: 'quote',                        // הצעת מחיר
  DELIVERY_NOTE: 'delivery_note',        // תעודת משלוח
  RETURN: 'return',                      // החזרה
  PURCHASE: 'purchase'                   // חשבונית קניה
}

/**
 * סטטוסים של מסמכים
 */
export const DOCUMENT_STATUS = {
  DRAFT: 'draft',           // טיוטה
  PENDING: 'pending',       // ממתין
  SENT: 'sent',            // נשלח
  PAID: 'paid',            // שולם
  CANCELLED: 'cancelled',   // בוטל
  SYNCED: 'synced',        // מסונכרן
  SYNC_FAILED: 'sync_failed' // כשל בסנכרון
}

/**
 * אפשרויות תשלום
 */
export const PAYMENT_TYPES = {
  CASH: 1,              // מזומן
  CHECK: 2,             // צ'ק
  CREDIT_CARD: 3,       // כרטיס אשראי
  BANK_TRANSFER: 4,     // העברה בנקאית
  PAYPAL: 5,            // PayPal
  DIRECT_DEBIT: 6,      // הוראת קבע
  OTHER: 7              // אחר
}

/**
 * שיעורי מע"מ
 */
export const VAT_RATES = {
  STANDARD: 17,         // מע"מ רגיל
  REDUCED: 0,          // פטור ממע"מ
  EXEMPT: -1           // ללא מע"מ
}
