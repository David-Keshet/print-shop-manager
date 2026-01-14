/**
 * Cached Supabase Client
 * wrapper ל-Supabase עם cache אוטומטי
 */

import { createClient } from '@supabase/supabase-js'
import { localCache } from './localCache'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

/**
 * קריאה עם cache
 */
export async function cachedQuery(cacheKey, queryFn, ttl = 5 * 60 * 1000) {
  // נסה לקבל מcache
  const cached = localCache.get(cacheKey)
  if (cached) {
    return { data: cached, error: null, fromCache: true }
  }

  // אם אין בcache, קרא מSupabase
  console.log(`🔍 Fetching from Supabase: ${cacheKey}`)
  const result = await queryFn()

  // אם הצליח, שמור בcache
  if (!result.error && result.data) {
    localCache.set(cacheKey, result.data, ttl)
  }

  return { ...result, fromCache: false }
}

/**
 * פונקציות עזר עם cache
 */
export const cachedSupabase = {
  /**
   * הזמנות אחרונות (100 אחרונות)
   */
  async getRecentOrders(limit = 100) {
    return cachedQuery(
      `orders:recent:${limit}`,
      async () => {
        return await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit)
      },
      2 * 60 * 1000 // 2 דקות
    )
  },

  /**
   * הזמנות פעילות
   */
  async getActiveOrders() {
    return cachedQuery(
      'orders:active',
      async () => {
        return await supabase
          .from('orders')
          .select('*')
          .in('status', ['new', 'in_progress'])
          .order('created_at', { ascending: false })
      },
      1 * 60 * 1000 // דקה
    )
  },

  /**
   * לקוחות
   */
  async getCustomers(limit = 100) {
    return cachedQuery(
      `customers:all:${limit}`,
      async () => {
        return await supabase
          .from('customers')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit)
      },
      10 * 60 * 1000 // 10 דקות (לקוחות משתנים פחות)
    )
  },

  /**
   * הכנסות חודשיות
   */
  async getMonthlyRevenue() {
    const currentMonth = new Date().toISOString().slice(0, 7)
    return cachedQuery(
      `revenue:${currentMonth}`,
      async () => {
        return await supabase
          .from('orders')
          .select('total_with_vat')
          .gte('created_at', `${currentMonth}-01T00:00:00`)
          .lte('created_at', `${currentMonth}-31T23:59:59`)
      },
      5 * 60 * 1000 // 5 דקות
    )
  },

  /**
   * חשבוניות אחרונות
   */
  async getRecentInvoices(limit = 100) {
    return cachedQuery(
      `invoices:recent:${limit}`,
      async () => {
        return await supabase
          .from('invoices')
          .select(`
            *,
            customer:customers(name, phone),
            order:orders(order_number)
          `)
          .order('created_at', { ascending: false })
          .limit(limit)
      },
      3 * 60 * 1000 // 3 דקות
    )
  },

  /**
   * סטטיסטיקות כלליות
   */
  async getStats() {
    return cachedQuery(
      'stats:dashboard',
      async () => {
        const [activeOrders, customers, monthlyOrders] = await Promise.all([
          supabase
            .from('orders')
            .select('id', { count: 'exact', head: true })
            .in('status', ['new', 'in_progress']),
          supabase
            .from('customers')
            .select('*', { count: 'exact', head: true }),
          supabase
            .from('orders')
            .select('total_with_vat')
            .gte('created_at', `${new Date().toISOString().slice(0, 7)}-01T00:00:00`),
        ])

        return {
          data: {
            activeOrders: activeOrders.count || 0,
            totalCustomers: customers.count || 0,
            monthlyRevenue: monthlyOrders.data?.reduce(
              (sum, order) => sum + parseFloat(order.total_with_vat || 0),
              0
            ) || 0,
          },
          error: null,
        }
      },
      1 * 60 * 1000 // דקה
    )
  },

  /**
   * פריט בודד (לא cached - תמיד עדכני)
   */
  async getOrder(id) {
    return await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single()
  },

  /**
   * מחיקת cache לאחר עדכון
   */
  invalidateCache(pattern) {
    const stats = localCache.getStats()
    let deleted = 0

    stats.items.forEach(item => {
      if (item.key.includes(pattern)) {
        localCache.delete(item.key)
        deleted++
      }
    })

    console.log(`🗑️ Invalidated ${deleted} cache entries matching: ${pattern}`)
  },

  /**
   * ניקוי כל ה-cache
   */
  clearCache() {
    localCache.clear()
  },
}

export default cachedSupabase
