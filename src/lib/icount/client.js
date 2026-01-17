/**
 * iCount API Client
 * שירות לחיבור ל-API של iCount
 */

import { ICOUNT_CONFIG } from './config.js'
import { sessionCache } from './sessionCache.js'
import { rateLimiter } from './rateLimiter.js'

export class ICountClient {
  constructor(credentials = null) {
    this.credentials = credentials
    this.offlineMode = ICOUNT_CONFIG.offlineMode
    this.sessionId = null // Store session ID for reuse
    this.cacheKey = 'default' // מפתח ייחודי ל-cache
    this.credentialsLoaded = false
  }

  /**
   * אתחול אסינכרוני של הפרטים
   */
  async init() {
    if (!this.credentialsLoaded) {
      this.credentials = this.credentials || await this.loadCredentials()
      this.cacheKey = this.getCacheKey()
      this.credentialsLoaded = true
    }
    return this.credentials
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
  async loadCredentials() {
    // ניסיון לטעון מ-localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('icount_credentials')
      if (stored) {
        return JSON.parse(stored)
      }
    }

    // ניסיון לטעון ממשתני סביבה
    let credentials = {
      // Prefer SID/Token (recommended by iCount)
      sid: process.env.NEXT_PUBLIC_ICOUNT_SID || null,
      // Legacy credentials
      cid: process.env.NEXT_PUBLIC_ICOUNT_CID || null,
      user: process.env.NEXT_PUBLIC_ICOUNT_USER || null,
      pass: process.env.NEXT_PUBLIC_ICOUNT_PASS || null,
    }

    // אם אין פרטים במשתני סביבה, ננסה מ-Supabase
    if (!credentials.cid && !credentials.sid) {
      try {
        const { createClient } = await import('@supabase/supabase-js')
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        )

        const { data: settings } = await supabase
          .from('icount_settings')
          .select('*')
          .eq('is_active', true)
          .single()

        if (settings) {
          const { decrypt } = await import('../encryption.js')
          credentials = {
            cid: settings.cid,
            user: settings.user_name,
            pass: decrypt(settings.encrypted_pass)
          }
        }
      } catch (error) {
        console.warn('Failed to load iCount settings from Supabase:', error.message)
      }
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

    // 0. אם יש SID קבוע (API Key), אין צורך בהתחברות
    if (this.credentials.sid) {
      this.sessionId = this.credentials.sid
      return this.credentials.sid
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

      const cid = isNaN(parseInt(this.credentials.cid, 10)) ? this.credentials.cid : parseInt(this.credentials.cid, 10)
      const formParams = new URLSearchParams()
      formParams.append('cid', cid)
      formParams.append('user', this.credentials.user)
      formParams.append('pass', this.credentials.pass)

      const response = await fetch('https://api.icount.co.il/api/v3.php/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formParams.toString(),
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
    // ודא שהפרטים נטענו
    await this.init()
    
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

      // חזרה למבנה ה-URL שעובד
      const url = `${ICOUNT_CONFIG.baseUrl}/${method}`

      const fullRequestBody = {
        ...params,
      }

      // טיפול עקבי ב-CID
      const cid = isNaN(parseInt(this.credentials.cid, 10))
        ? this.credentials.cid
        : parseInt(this.credentials.cid, 10)

      if (this.credentials.cid) {
        fullRequestBody.cid = cid
      }

      // אם יש SID קבוע (API Key), השתמש בו
      const sid = this.credentials.sid || this.sessionId

      if (this.credentials.apiKey) {
        fullRequestBody.api_key = this.credentials.apiKey
        fullRequestBody.user = this.credentials.user
        fullRequestBody.pass = this.credentials.pass
      }
      else if (sid) {
        fullRequestBody.sid = sid
      }
      else {
        fullRequestBody.user = this.credentials.user
        fullRequestBody.pass = this.credentials.pass
      }

      console.log(`📡 iCount Request [${method}] to ${url}`)

      // בניית גוף הבקשה כ-URLSearchParams (form-urlencoded)
      const formParams = new URLSearchParams()
      Object.keys(fullRequestBody).forEach(key => {
        if (fullRequestBody[key] !== undefined && fullRequestBody[key] !== null) {
          formParams.append(key, fullRequestBody[key])
        }
      })

      console.log('📦 Request body (Form):', formParams.toString())

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formParams.toString(),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('📥 iCount Response:', JSON.stringify(data, null, 2))

      // בדיקת שגיאות מ-iCount
      if (data.status === false || data.status === 0) {
        if (data.error_description === 'שאילתא ריקה' || data.error_description === 'Empty Query') {
          console.error('❌ iCount Error: Empty Query. The parameters provided might not be sufficient for iCount to perform a search.')
        }

        // אם השגיאה היא auth_required, נסה להתחבר מחדש
        if (data.reason === 'auth_required' && this.sessionId) {
          this.sessionId = null
          return this.request(method, params) // נסה שוב
        }

        throw new Error(data.error_description || data.message || 'שגיאה מ-iCount')
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
    // אתחל אוטומטית את הפרטים אם לא סופקו
    if (!credentials) {
      icountClient.init().catch(console.error)
    }
  }
  return icountClient
}
