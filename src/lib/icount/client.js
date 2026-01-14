/**
 * iCount API Client
 * שירות לחיבור ל-API של iCount
 */

import { ICOUNT_CONFIG } from './config'
import { sessionCache } from './sessionCache'
import { rateLimiter } from './rateLimiter'

export class ICountClient {
  constructor(credentials = null) {
    this.credentials = credentials || this.loadCredentials()
    this.offlineMode = ICOUNT_CONFIG.offlineMode
    this.sessionId = null // Store session ID for reuse
    this.cacheKey = this.getCacheKey() // מפתח ייחודי ל-cache
  }

  /**
   * יוצר מפתח cache ייחודי לפי credentials
   */
  getCacheKey() {
    if (this.credentials?.cid && this.credentials?.user) {
      return `${this.credentials.cid}:${this.credentials.user}`
    }
    return 'default'
  }

  /**
   * טעינת פרטי התחברות
   */
  loadCredentials() {
    // ניסיון לטעון מ-localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('icount_credentials')
      if (stored) {
        return JSON.parse(stored)
      }
    }

    // ניסיון לטעון ממשתני סביבה
    const credentials = {
      // Prefer SID/Token (recommended by iCount)
      sid: process.env.NEXT_PUBLIC_ICOUNT_SID || null,
      // Legacy credentials
      cid: process.env.NEXT_PUBLIC_ICOUNT_CID || null,
      user: process.env.NEXT_PUBLIC_ICOUNT_USER || null,
      pass: process.env.NEXT_PUBLIC_ICOUNT_PASS || null,
    }

    return credentials
  }

  /**
   * שמירת פרטי התחברות
   */
  saveCredentials(credentials) {
    this.credentials = credentials
    if (typeof window !== 'undefined') {
      localStorage.setItem('icount_credentials', JSON.stringify(credentials))
    }
  }

  /**
   * בדיקה האם יש פרטי התחברות תקינים
   */
  hasCredentials() {
    if (!this.credentials) return false

    // תמיכה ב-SID/Token (שיטה מומלצת)
    if (this.credentials.sid) {
      return true
    }

    // תמיכה ב-API Key
    if (this.credentials.apiKey && this.credentials.user && this.credentials.pass) {
      return true
    }

    // תמיכה ב-CID/User/Pass
    return !!(
      this.credentials.cid &&
      this.credentials.user &&
      this.credentials.pass
    )
  }

  /**
   * התחברות לקבלת session ID
   */
  async login() {
    if (!this.credentials.cid || !this.credentials.user || !this.credentials.pass) {
      throw new Error('חסרים פרטי התחברות (CID, user, pass)')
    }

    // 1. בדוק אם יש session ב-cache
    const cachedSession = sessionCache.get(this.cacheKey)
    if (cachedSession) {
      this.sessionId = cachedSession
      return cachedSession
    }

    // 2. בדוק rate limit לפני שליחת בקשה
    if (!rateLimiter.canMakeRequest()) {
      const waitTime = rateLimiter.getWaitTime()
      throw new Error(`Rate limit reached. Please wait ${Math.ceil(waitTime / 1000)} seconds`)
    }

    try {
      // 3. רשום שאנחנו שולחים בקשה
      rateLimiter.recordRequest()

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), ICOUNT_CONFIG.timeout)

      console.log('🔐 Logging in to iCount (no cached session)...')

      const response = await fetch('https://api.icount.co.il/api/v3.php/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cid: isNaN(parseInt(this.credentials.cid, 10)) ? this.credentials.cid : parseInt(this.credentials.cid, 10),
          user: this.credentials.user,
          pass: this.credentials.pass
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.sid) {
        this.sessionId = data.sid

        // 4. שמור session ב-cache ל-30 דקות
        sessionCache.set(this.cacheKey, data.sid, this.credentials)
        console.log('✅ Login successful, session cached')

        return data.sid
      } else if (data.status === false) {
        throw new Error(data.error_description || 'התחברות נכשלה')
      }

      throw new Error('לא התקבל session ID')
    } catch (error) {
      if (error.name === 'AbortError' || error.message.includes('Failed to fetch')) {
        this.offlineMode = true
        throw new Error('OFFLINE_MODE')
      }
      throw error
    }
  }

  /**
   * שליחת בקשה ל-API של iCount
   */
  async request(method, params = {}) {
    if (!this.hasCredentials()) {
      throw new Error('חסרים פרטי התחברות ל-iCount')
    }

    // אם במצב אופליין, זרוק שגיאה מיוחדת
    if (this.offlineMode) {
      throw new Error('OFFLINE_MODE')
    }

    // אם יש SID (Token), השתמש בו ישירות
    if (this.credentials.sid) {
      this.sessionId = this.credentials.sid
    }

    // אם אין session ID ואין SID, נסה להתחבר עם CID/User/Pass
    if (!this.sessionId && !this.credentials.sid) {
      try {
        await this.login()
      } catch (error) {
        // אם ההתחברות נכשלה, נסה בקשה ישירה עם פרטי התחברות
        console.warn('Login failed, falling back to direct auth:', error.message)
      }
    }

    // בדוק rate limit
    if (!rateLimiter.canMakeRequest()) {
      const stats = rateLimiter.getStats()
      console.warn(`⏸️ Rate limit: ${stats.current}/${stats.max} requests. Wait ${Math.ceil(stats.waitTime / 1000)}s`)
      throw new Error(`Rate limit reached (${stats.percentage}%). Wait ${Math.ceil(stats.waitTime / 1000)} seconds before retry`)
    }

    try {
      // רשום בקשה
      rateLimiter.recordRequest()

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), ICOUNT_CONFIG.timeout)

      // בניית URL עם method ב-path (לא ב-body!)
      const url = `${ICOUNT_CONFIG.baseUrl}/${method}`

      // בניית גוף הבקשה ללא action
      const fullRequestBody = {
        ...params,
      }

      // אם יש API Key, השתמש בו
      if (this.credentials.apiKey) {
        fullRequestBody.api_key = this.credentials.apiKey  // iCount expects 'api_key' not 'apiKey'
        fullRequestBody.user = this.credentials.user
        fullRequestBody.pass = this.credentials.pass
      }
      // אם יש session ID או SID, השתמש בו
      else if (this.sessionId) {
        fullRequestBody.sid = this.sessionId
      }
      // אחרת, שלח CID/User/Pass
      else {
        // CID צריך להישאר string אם זה לא מספר
        const cidValue = this.credentials.cid
        console.log('Sending CID:', cidValue, 'Type:', typeof cidValue)

        fullRequestBody.cid = cidValue
        fullRequestBody.user = this.credentials.user
        fullRequestBody.pass = this.credentials.pass
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fullRequestBody),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      // בדיקת שגיאות מ-iCount
      if (data.status === false || data.status === 0) {
        // אם השגיאה היא auth_required, נסה להתחבר מחדש
        if (data.reason === 'auth_required' && this.sessionId) {
          this.sessionId = null
          return this.request(method, params) // נסה שוב
        }
        throw new Error(data.error_description || data.message || 'שגיאה לא ידועה מ-iCount')
      }

      return data
    } catch (error) {
      // אם יש שגיאת רשת, נעבור למצב אופליין
      if (error.name === 'AbortError' || error.message.includes('Failed to fetch')) {
        this.offlineMode = true
        throw new Error('OFFLINE_MODE')
      }
      throw error
    }
  }

  /**
   * בדיקת חיבור ל-API
   */
  async testConnection() {
    try {
      await this.request('doc/list', { limit: 1 })
      this.offlineMode = false
      return { success: true, message: 'החיבור ל-iCount תקין' }
    } catch (error) {
      if (error.message === 'OFFLINE_MODE') {
        return { success: false, message: 'אין חיבור לאינטרנט - מצב אופליין', offline: true }
      }
      return { success: false, message: error.message }
    }
  }

  /**
   * קבלת רשימת מסמכים
   */
  async getDocuments(type = null, filters = {}) {
    const params = {
      ...filters,
    }

    if (type) {
      params.type = type
    }

    return this.request('doc/list', params)
  }

  /**
   * יצירת מסמך חדש
   */
  async createDocument(documentData) {
    return this.request('doc/create', documentData)
  }

  /**
   * עדכון מסמך קיים
   */
  async updateDocument(docId, documentData) {
    return this.request('doc/update', {
      docid: docId,
      ...documentData,
    })
  }

  /**
   * מחיקת מסמך
   */
  async deleteDocument(docId) {
    return this.request('doc/delete', { docid: docId })
  }

  /**
   * קבלת פרטי מסמך ספציפי
   */
  async getDocument(docId) {
    return this.request('doc/get', { docid: docId })
  }

  /**
   * קבלת רשימת לקוחות
   */
  async getClients(filters = {}) {
    return this.request('client/list', filters)
  }

  /**
   * יצירת לקוח חדש
   */
  async createClient(clientData) {
    return this.request('client/create', clientData)
  }

  /**
   * עדכון לקוח קיים
   */
  async updateClient(clientId, clientData) {
    return this.request('client/update', {
      clientid: clientId,
      ...clientData,
    })
  }

  /**
   * קבלת רשימת פריטים/שירותים
   */
  async getItems(filters = {}) {
    return this.request('item/list', filters)
  }

  /**
   * יצירת פריט/שירות חדש
   */
  async createItem(itemData) {
    return this.request('item/create', itemData)
  }

  /**
   * שליחת מסמך בדוא"ל
   */
  async sendDocumentByEmail(docId, email, subject = '', body = '') {
    return this.request('doc/send_email', {
      docid: docId,
      email,
      subject,
      body,
    })
  }

  /**
   * הורדת PDF של מסמך
   */
  async getDocumentPDF(docId) {
    return this.request('doc/pdf', { docid: docId })
  }
}

// יצירת instance גלובלי
let icountClient = null

export function getICountClient(credentials = null) {
  if (!icountClient || credentials) {
    icountClient = new ICountClient(credentials)
  }
  return icountClient
}
