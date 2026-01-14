/**
 * iCount Connection Manager
 * מנהל חיבורים חכם עם retry logic ו-detailed logging
 */

import { getICountClient } from './client'

class ConnectionManager {
  constructor() {
    this.client = null
    this.lastAttempt = null
    this.isConnected = false
    this.connectionDetails = null
  }

  /**
   * טעינת credentials מ-environment או מהגדרות
   */
  async loadCredentials() {
    console.log('📡 ConnectionManager: Loading credentials...')

    // 1. נסה environment variables
    const envCredentials = {
      cid: process.env.NEXT_PUBLIC_ICOUNT_CID,
      user: process.env.NEXT_PUBLIC_ICOUNT_USER,
      pass: process.env.NEXT_PUBLIC_ICOUNT_PASS,
      sid: process.env.NEXT_PUBLIC_ICOUNT_SID,
    }

    console.log('📡 Env credentials:', {
      hasCid: !!envCredentials.cid,
      hasUser: !!envCredentials.user,
      hasPass: !!envCredentials.pass,
      hasSid: !!envCredentials.sid,
      cidValue: envCredentials.cid,
    })

    // 2. אם יש credentials ב-env, השתמש בהם
    if (envCredentials.cid && envCredentials.user && envCredentials.pass) {
      return envCredentials
    }

    // 3. אחרת, נסה לטעון מ-Supabase
    try {
      const response = await fetch('/api/settings/icount')
      const data = await response.json()

      if (data.success && data.settings) {
        console.log('📡 Loaded from Supabase:', {
          hasCid: !!data.settings.cid,
          hasUser: !!data.settings.user_name,
          cidValue: data.settings.cid,
        })

        return {
          cid: data.settings.cid,
          user: data.settings.user_name,
          pass: data.settings.pass,
        }
      }
    } catch (error) {
      console.error('📡 Failed to load from Supabase:', error)
    }

    // 4. אחרון, נסה localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('icount_credentials')
      if (stored) {
        const creds = JSON.parse(stored)
        console.log('📡 Loaded from localStorage:', {
          hasCid: !!creds.cid,
          hasUser: !!creds.user,
        })
        return creds
      }
    }

    console.error('❌ No credentials found!')
    return null
  }

  /**
   * התחברות עם retry logic
   */
  async connect(maxRetries = 3) {
    console.log('🔌 ConnectionManager: Starting connection...')

    const credentials = await this.loadCredentials()

    if (!credentials) {
      throw new Error('No credentials available')
    }

    // נסה להתחבר עם retries
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔌 Connection attempt ${attempt}/${maxRetries}`)
        console.log('🔌 Using credentials:', {
          cid: credentials.cid,
          user: credentials.user,
          hasPass: !!credentials.pass,
        })

        this.client = getICountClient(credentials)

        // נסה בקשה פשוטה לבדוק חיבור - רק נתחבר ונבדוק שיש session
        console.log('🔌 Testing connection - logging in...')
        // אם הצלחנו להגיע לכאן, זה אומר שההתחברות עבדה (login מתבצע בתוך request)
        // פשוט ננסה בקשה שתחזיר משהו - account/get_company_data
        const result = await this.client.request('account/get_company_data', {})

        console.log('✅ Connection successful!', result)

        this.isConnected = true
        this.connectionDetails = {
          connectedAt: new Date(),
          credentials: {
            cid: credentials.cid,
            user: credentials.user,
          },
        }

        return { success: true, message: 'Connected successfully!' }
      } catch (error) {
        console.error(`❌ Connection attempt ${attempt} failed:`, error.message)
        console.error('❌ Full error:', error)

        // אם זו השגיאה האחרונה, זרוק אותה
        if (attempt === maxRetries) {
          return {
            success: false,
            message: error.message,
            details: {
              attempts: maxRetries,
              lastError: error.message,
            },
          }
        }

        // אם זה rate limit (429), המתן יותר זמן
        if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
          console.log('⏰ Rate limited! Waiting 60 seconds...')
          await new Promise((resolve) => setTimeout(resolve, 60000)) // 60 שניות
        } else {
          // המתן לפני ניסיון הבא
          await new Promise((resolve) => setTimeout(resolve, 2000 * attempt))
        }
      }
    }
  }

  /**
   * קבלת סטטוס חיבור
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      lastAttempt: this.lastAttempt,
      connectionDetails: this.connectionDetails,
    }
  }

  /**
   * ניתוק
   */
  disconnect() {
    this.client = null
    this.isConnected = false
    this.connectionDetails = null
    console.log('🔌 Disconnected')
  }

  /**
   * קבלת client מחובר
   */
  getClient() {
    if (!this.isConnected || !this.client) {
      throw new Error('Not connected. Call connect() first.')
    }
    return this.client
  }
}

// יצירת instance גלובלי
const connectionManager = new ConnectionManager()

export default connectionManager
export { ConnectionManager }
