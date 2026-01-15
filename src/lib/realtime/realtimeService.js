/**
 * Supabase Realtime Service
 * מאזין לשינויים בזמן אמת ומעדכן את כל המחשבים המחוברים
 */

import { supabase } from '@/lib/supabase'
import { offlineDB, STORES } from '@/lib/offline/offlineDB'

class RealtimeService {
  constructor() {
    this.channels = {}
    this.listeners = {
      orders: [],
      customers: [],
      invoices: [],
    }
    this.isConnected = false
  }

  /**
   * התחברות לכל הערוצים
   */
  async connect() {
    if (this.isConnected) {
      console.log('⚡ Realtime already connected')
      return
    }

    console.log('⚡ Connecting to Supabase Realtime...')

    // ערוץ הזמנות
    this.channels.orders = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => this.handleChange('orders', payload)
      )
      .subscribe((status) => {
        console.log('📡 Orders channel:', status)
      })

    // ערוץ לקוחות
    this.channels.customers = supabase
      .channel('customers-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'customers' },
        (payload) => this.handleChange('customers', payload)
      )
      .subscribe((status) => {
        console.log('📡 Customers channel:', status)
      })

    // ערוץ חשבוניות
    this.channels.invoices = supabase
      .channel('invoices-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'invoices' },
        (payload) => this.handleChange('invoices', payload)
      )
      .subscribe((status) => {
        console.log('📡 Invoices channel:', status)
      })

    this.isConnected = true
    console.log('✅ Realtime connected to all channels')
  }

  /**
   * טיפול בשינוי שהתקבל
   */
  async handleChange(table, payload) {
    const { eventType, new: newRecord, old: oldRecord } = payload

    console.log(`⚡ Realtime ${table}:`, eventType, newRecord?.id || oldRecord?.id)

    // עדכון IndexedDB המקומי
    try {
      const storeName = this.getStoreName(table)

      if (eventType === 'INSERT' || eventType === 'UPDATE') {
        // שמור את הרשומה החדשה/מעודכנת ב-IndexedDB
        await offlineDB.put(storeName, {
          ...newRecord,
          sync_status: 'synced',
          is_offline: false,
          realtime_updated: true
        })
      } else if (eventType === 'DELETE') {
        // מחק מ-IndexedDB
        await offlineDB.delete(storeName, oldRecord.id)
      }
    } catch (error) {
      console.error('Failed to update local DB from realtime:', error)
    }

    // הודע ל-listeners
    this.notifyListeners(table, {
      type: eventType.toLowerCase(),
      data: newRecord || oldRecord,
      old: oldRecord
    })
  }

  /**
   * המרת שם טבלה לשם store
   */
  getStoreName(table) {
    const map = {
      orders: STORES.ORDERS,
      customers: STORES.CUSTOMERS,
      invoices: STORES.INVOICES
    }
    return map[table] || table
  }

  /**
   * הרשמה לעדכונים
   */
  subscribe(table, callback) {
    if (!this.listeners[table]) {
      this.listeners[table] = []
    }
    this.listeners[table].push(callback)

    // החזר פונקציה לביטול הרשמה
    return () => {
      this.listeners[table] = this.listeners[table].filter(cb => cb !== callback)
    }
  }

  /**
   * הודעה ל-listeners
   */
  notifyListeners(table, event) {
    if (this.listeners[table]) {
      this.listeners[table].forEach(callback => {
        try {
          callback(event)
        } catch (error) {
          console.error('Listener error:', error)
        }
      })
    }
  }

  /**
   * ניתוק מכל הערוצים
   */
  async disconnect() {
    console.log('🔌 Disconnecting from Realtime...')

    for (const [name, channel] of Object.entries(this.channels)) {
      await supabase.removeChannel(channel)
      console.log(`📴 Disconnected from ${name}`)
    }

    this.channels = {}
    this.isConnected = false
    console.log('✅ Realtime disconnected')
  }

  /**
   * בדיקת סטטוס חיבור
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      channels: Object.keys(this.channels),
      listenersCount: {
        orders: this.listeners.orders.length,
        customers: this.listeners.customers.length,
        invoices: this.listeners.invoices.length
      }
    }
  }
}

// Singleton export
export const realtimeService = new RealtimeService()
