/**
 * Rate Limiter for iCount API
 * מונע שליחת יותר מדי בקשות ל-iCount
 */

class RateLimiter {
  constructor() {
    this.requests = []
    this.MAX_REQUESTS = 25 // פחות מהמגבלה של iCount (30)
    this.TIME_WINDOW = 60 * 1000 // דקה אחת
  }

  /**
   * בדוק אם מותר לשלוח בקשה
   */
  canMakeRequest() {
    this.cleanup()

    if (this.requests.length >= this.MAX_REQUESTS) {
      const oldestRequest = this.requests[0]
      const waitTime = this.TIME_WINDOW - (Date.now() - oldestRequest)
      console.log(`⏸️ Rate limit reached. Wait ${Math.ceil(waitTime / 1000)}s`)
      return false
    }

    return true
  }

  /**
   * רשום בקשה
   */
  recordRequest() {
    this.cleanup()
    this.requests.push(Date.now())
    console.log(`📊 API requests: ${this.requests.length}/${this.MAX_REQUESTS} in last minute`)
  }

  /**
   * כמה זמן צריך לחכות
   */
  getWaitTime() {
    this.cleanup()

    if (this.requests.length < this.MAX_REQUESTS) {
      return 0
    }

    const oldestRequest = this.requests[0]
    return Math.max(0, this.TIME_WINDOW - (Date.now() - oldestRequest))
  }

  /**
   * נקה בקשות ישנות
   */
  cleanup() {
    const cutoff = Date.now() - this.TIME_WINDOW
    this.requests = this.requests.filter(timestamp => timestamp > cutoff)
  }

  /**
   * אפס את המונה
   */
  reset() {
    this.requests = []
    console.log('🔄 Rate limiter reset')
  }

  /**
   * סטטיסטיקות
   */
  getStats() {
    this.cleanup()
    return {
      current: this.requests.length,
      max: this.MAX_REQUESTS,
      remaining: this.MAX_REQUESTS - this.requests.length,
      percentage: Math.round((this.requests.length / this.MAX_REQUESTS) * 100),
      waitTime: this.getWaitTime(),
    }
  }
}

// Singleton
export const rateLimiter = new RateLimiter()
