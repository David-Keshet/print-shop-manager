/**
 * React Hook for Realtime updates
 * מאזין לשינויים בזמן אמת ומעדכן את ה-UI
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { realtimeService } from './realtimeService'
import { offlineDB, STORES } from '@/lib/offline/offlineDB'

/**
 * Hook לקבלת עדכונים בזמן אמת
 * @param {string} table - שם הטבלה (orders, customers, invoices)
 * @param {Object} options - אפשרויות
 */
export function useRealtime(table, options = {}) {
  const { autoConnect = true, onUpdate } = options
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const onUpdateRef = useRef(onUpdate)

  // עדכון ref כשה-callback משתנה
  useEffect(() => {
    onUpdateRef.current = onUpdate
  }, [onUpdate])

  // טעינה ראשונית מ-IndexedDB
  const loadLocalData = useCallback(async () => {
    try {
      const storeName = getStoreName(table)
      const localData = await offlineDB.getAll(storeName)
      setData(localData.sort((a, b) =>
        new Date(b.created_at || 0) - new Date(a.created_at || 0)
      ))
      setLoading(false)
    } catch (error) {
      console.error('Failed to load local data:', error)
      setLoading(false)
    }
  }, [table])

  // התחברות ל-Realtime
  useEffect(() => {
    if (!autoConnect) return

    const connect = async () => {
      await realtimeService.connect()
      setIsConnected(true)
    }

    connect()

    return () => {
      // לא מנתקים בעת unmount כי אולי יש קומפוננטות אחרות שמשתמשות
    }
  }, [autoConnect])

  // האזנה לשינויים
  useEffect(() => {
    // טעינה ראשונית
    loadLocalData()

    // הרשמה לעדכונים
    const unsubscribe = realtimeService.subscribe(table, (event) => {
      console.log(`🔄 Realtime update for ${table}:`, event.type)

      // עדכון ה-state המקומי
      setData(prevData => {
        let newData = [...prevData]

        if (event.type === 'insert') {
          // הוסף רשומה חדשה (אם לא קיימת)
          if (!newData.some(item => item.id === event.data.id)) {
            newData = [event.data, ...newData]
          }
        } else if (event.type === 'update') {
          // עדכן רשומה קיימת
          const index = newData.findIndex(item => item.id === event.data.id)
          if (index !== -1) {
            newData[index] = { ...newData[index], ...event.data }
          } else {
            // אם לא נמצא, הוסף
            newData = [event.data, ...newData]
          }
        } else if (event.type === 'delete') {
          // מחק רשומה
          newData = newData.filter(item => item.id !== event.data.id)
        }

        return newData
      })

      setLastUpdate(new Date())

      // קרא ל-callback אם קיים
      if (onUpdateRef.current) {
        onUpdateRef.current(event)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [table, loadLocalData])

  // רענון ידני
  const refresh = useCallback(async () => {
    setLoading(true)
    await loadLocalData()
  }, [loadLocalData])

  return {
    data,
    loading,
    lastUpdate,
    isConnected,
    refresh
  }
}

/**
 * Hook ספציפי להזמנות
 */
export function useRealtimeOrders(options = {}) {
  return useRealtime('orders', options)
}

/**
 * Hook ספציפי ללקוחות
 */
export function useRealtimeCustomers(options = {}) {
  return useRealtime('customers', options)
}

/**
 * Hook ספציפי לחשבוניות
 */
export function useRealtimeInvoices(options = {}) {
  return useRealtime('invoices', options)
}

// Helper
function getStoreName(table) {
  const map = {
    orders: STORES.ORDERS,
    customers: STORES.CUSTOMERS,
    invoices: STORES.INVOICES
  }
  return map[table] || table
}
