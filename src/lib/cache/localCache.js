/**
 * Local Cache Manager
 * מנהל cache מקומי חכם עם TTL ו-LRU
 */

class LocalCache {
  constructor() {
    this.cache = new Map()
    this.maxSize = 100 // מקסימום 100 פריטים
    this.defaultTTL = 5 * 60 * 1000 // 5 דקות
  }

  /**
   * שמור בcache
   */
  set(key, value, ttl = this.defaultTTL) {
    // אם ה-cache מלא, מחק את הישן ביותר (LRU)
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value
      this.cache.delete(oldestKey)
      console.log(`🗑️ Cache full, removed oldest: ${oldestKey}`)
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
    })

    console.log(`💾 Cached: ${key} (expires in ${Math.round(ttl / 1000)}s)`)
  }

  /**
   * קבל מcache
   */
  get(key) {
    const cached = this.cache.get(key)

    if (!cached) {
      console.log(`❌ Cache miss: ${key}`)
      return null
    }

    // בדוק אם פג תוקף
    if (Date.now() > cached.expiresAt) {
      console.log(`⏰ Cache expired: ${key}`)
      this.cache.delete(key)
      return null
    }

    const age = Math.round((Date.now() - cached.timestamp) / 1000)
    console.log(`✅ Cache hit: ${key} (age: ${age}s)`)

    // החזר למקום הראשון (LRU)
    this.cache.delete(key)
    this.cache.set(key, cached)

    return cached.value
  }

  /**
   * מחק מcache
   */
  delete(key) {
    this.cache.delete(key)
    console.log(`🗑️ Deleted from cache: ${key}`)
  }

  /**
   * נקה cache שפג תוקפו
   */
  cleanup() {
    const now = Date.now()
    let cleaned = 0

    for (const [key, value] of this.cache.entries()) {
      if (now > value.expiresAt) {
        this.cache.delete(key)
        cleaned++
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} expired cache entries`)
    }

    return cleaned
  }

  /**
   * נקה הכל
   */
  clear() {
    const size = this.cache.size
    this.cache.clear()
    console.log(`🗑️ Cleared entire cache (${size} items)`)
  }

  /**
   * סטטיסטיקות
   */
  getStats() {
    this.cleanup()

    const entries = Array.from(this.cache.entries())
    const now = Date.now()

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      utilization: Math.round((this.cache.size / this.maxSize) * 100),
      items: entries.map(([key, value]) => ({
        key,
        age: Math.round((now - value.timestamp) / 1000),
        ttl: Math.round((value.expiresAt - now) / 1000),
      })),
    }
  }
}

// Singleton
export const localCache = new LocalCache()

// ניקוי אוטומטי כל דקה
if (typeof window === 'undefined') {
  // Server-side only
  setInterval(() => {
    localCache.cleanup()
  }, 60 * 1000)
}
