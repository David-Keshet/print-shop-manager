/**
 * iCount Session Cache
 * מנגנון cache לשמירת session ID כדי למנוע התחברות מיותרת
 */

class SessionCache {
  constructor() {
    this.cache = new Map()
    this.SESSION_DURATION = 30 * 60 * 1000 // 30 דקות
  }

  /**
   * שמור session
   */
  set(key, sessionId, credentials = null) {
    this.cache.set(key, {
      sessionId,
      credentials,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.SESSION_DURATION,
    })

    console.log(`💾 Session cached for ${key} (expires in 30 min)`)
  }

  /**
   * קבל session
   */
  get(key) {
    const cached = this.cache.get(key)

    if (!cached) {
      console.log(`❌ No cached session for ${key}`)
      return null
    }

    // בדוק אם פג תוקף
    if (Date.now() > cached.expiresAt) {
      console.log(`⏰ Session expired for ${key}`)
      this.cache.delete(key)
      return null
    }

    const remainingMinutes = Math.floor((cached.expiresAt - Date.now()) / 60000)
    console.log(`✅ Using cached session for ${key} (${remainingMinutes} min remaining)`)

    return cached.sessionId
  }

  /**
   * מחק session
   */
  clear(key) {
    this.cache.delete(key)
    console.log(`🗑️ Cleared session cache for ${key}`)
  }

  /**
   * מחק את כל ה-sessions שפג תוקפם
   */
  cleanup() {
    const now = Date.now()
    let cleared = 0

    for (const [key, value] of this.cache.entries()) {
      if (now > value.expiresAt) {
        this.cache.delete(key)
        cleared++
      }
    }

    if (cleared > 0) {
      console.log(`🧹 Cleaned up ${cleared} expired sessions`)
    }
  }

  /**
   * כמה sessions פעילים יש
   */
  size() {
    this.cleanup() // נקה לפני ספירה
    return this.cache.size
  }
}

// Singleton instance
export const sessionCache = new SessionCache()

// ניקוי אוטומטי כל 5 דקות
setInterval(() => {
  sessionCache.cleanup()
}, 5 * 60 * 1000)
