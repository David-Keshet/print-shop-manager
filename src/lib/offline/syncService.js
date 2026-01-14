/**
 * Sync Service
 * Manages synchronization between Supabase, Local IndexedDB, and iCount
 */

import { offlineDB, STORES } from './offlineDB'
import { supabase } from '@/lib/supabase'

class SyncService {
  constructor() {
    this.isSyncing = false
    this.syncListeners = []
    this.lastSyncTime = null
  }

  /**
   * Register sync listener
   */
  onSyncStatusChange(callback) {
    this.syncListeners.push(callback)
    return () => {
      this.syncListeners = this.syncListeners.filter(cb => cb !== callback)
    }
  }

  /**
   * Notify all listeners
   */
  notifyListeners(status) {
    this.syncListeners.forEach(callback => callback(status))
  }

  /**
   * Check if online
   */
  isOnline() {
    // Check if we're in browser
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return false
    }
    return navigator.onLine
  }

  /**
   * Sync all pending changes to Supabase
   */
  async syncToSupabase() {
    if (this.isSyncing) {
      console.log('⏳ Sync already in progress')
      return { success: false, message: 'Sync in progress' }
    }

    if (!this.isOnline()) {
      console.log('📴 Offline - cannot sync')
      return { success: false, message: 'Offline' }
    }

    this.isSyncing = true
    this.notifyListeners({ status: 'syncing', progress: 0 })

    try {
      console.log('🔄 Starting sync to Supabase...')

      const pending = await offlineDB.getAllPendingSync()
      const total = pending.total

      if (total === 0) {
        console.log('✅ Nothing to sync')
        this.lastSyncTime = new Date()
        return { success: true, message: 'Nothing to sync', synced: 0 }
      }

      let synced = 0
      let errors = []

      // Sync orders
      for (const order of pending.orders) {
        try {
          await this.syncOrder(order)
          synced++
          this.notifyListeners({
            status: 'syncing',
            progress: Math.round((synced / total) * 100)
          })
        } catch (error) {
          console.error('Failed to sync order:', order.id, error)
          errors.push({ type: 'order', id: order.id, error: error.message })
        }
      }

      // Sync customers
      for (const customer of pending.customers) {
        try {
          await this.syncCustomer(customer)
          synced++
          this.notifyListeners({
            status: 'syncing',
            progress: Math.round((synced / total) * 100)
          })
        } catch (error) {
          console.error('Failed to sync customer:', customer.id, error)
          errors.push({ type: 'customer', id: customer.id, error: error.message })
        }
      }

      // Sync invoices
      for (const invoice of pending.invoices) {
        try {
          await this.syncInvoice(invoice)
          synced++
          this.notifyListeners({
            status: 'syncing',
            progress: Math.round((synced / total) * 100)
          })
        } catch (error) {
          console.error('Failed to sync invoice:', invoice.id, error)
          errors.push({ type: 'invoice', id: invoice.id, error: error.message })
        }
      }

      this.lastSyncTime = new Date()
      this.notifyListeners({ status: 'completed', synced, total, errors })

      console.log(`✅ Sync completed: ${synced}/${total} items synced`)

      return {
        success: true,
        synced,
        total,
        errors: errors.length > 0 ? errors : null
      }

    } catch (error) {
      console.error('Sync failed:', error)
      this.notifyListeners({ status: 'error', error: error.message })
      return { success: false, error: error.message }
    } finally {
      this.isSyncing = false
    }
  }

  /**
   * Sync single order
   */
  async syncOrder(order) {
    // Check if order already exists in Supabase
    const { data: existing } = await supabase
      .from('orders')
      .select('id, order_number')
      .eq('id', order.id)
      .single()

    if (existing) {
      // Update existing order
      const { error } = await supabase
        .from('orders')
        .update({
          ...order,
          sync_status: 'synced',
          synced_at: new Date().toISOString(),
          is_offline: false
        })
        .eq('id', order.id)

      if (error) throw error

      // Update local copy
      await offlineDB.put(STORES.ORDERS, {
        ...order,
        order_number: existing.order_number,
        sync_status: 'synced',
        synced_at: new Date().toISOString(),
        is_offline: false
      })

      return existing.order_number
    } else {
      // Get next order number from sequence
      const { data: seqData, error: seqError } = await supabase
        .rpc('get_next_order_number')

      if (seqError) throw seqError

      const orderNumber = seqData?.[0]?.next_number || seqData

      // Insert new order with order number
      const { error } = await supabase
        .from('orders')
        .insert({
          ...order,
          order_number: orderNumber,
          sync_status: 'synced',
          synced_at: new Date().toISOString(),
          is_offline: false
        })

      if (error) throw error

      // Update local copy with order number
      await offlineDB.put(STORES.ORDERS, {
        ...order,
        order_number: orderNumber,
        sync_status: 'synced',
        synced_at: new Date().toISOString(),
        is_offline: false
      })

      console.log(`✅ Order ${order.id} synced with number ${orderNumber}`)
      return orderNumber
    }
  }

  /**
   * Sync single customer
   */
  async syncCustomer(customer) {
    const { data: existing } = await supabase
      .from('customers')
      .select('id, customer_number')
      .eq('id', customer.id)
      .single()

    if (existing) {
      // Update
      const { error } = await supabase
        .from('customers')
        .update({
          ...customer,
          sync_status: 'synced',
          synced_at: new Date().toISOString(),
          is_offline: false
        })
        .eq('id', customer.id)

      if (error) throw error

      await offlineDB.put(STORES.CUSTOMERS, {
        ...customer,
        customer_number: existing.customer_number,
        sync_status: 'synced',
        synced_at: new Date().toISOString(),
        is_offline: false
      })
    } else {
      // Get next customer number
      const { data: seqData, error: seqError } = await supabase
        .rpc('get_next_customer_number')

      if (seqError) throw seqError

      const customerNumber = seqData?.[0]?.next_number || seqData

      // Insert
      const { error } = await supabase
        .from('customers')
        .insert({
          ...customer,
          customer_number: customerNumber,
          sync_status: 'synced',
          synced_at: new Date().toISOString(),
          is_offline: false
        })

      if (error) throw error

      await offlineDB.put(STORES.CUSTOMERS, {
        ...customer,
        customer_number: customerNumber,
        sync_status: 'synced',
        synced_at: new Date().toISOString(),
        is_offline: false
      })

      console.log(`✅ Customer ${customer.id} synced with number ${customerNumber}`)
    }
  }

  /**
   * Sync single invoice
   */
  async syncInvoice(invoice) {
    const { data: existing } = await supabase
      .from('invoices')
      .select('id, invoice_number')
      .eq('id', invoice.id)
      .single()

    if (existing) {
      // Update
      const { error } = await supabase
        .from('invoices')
        .update({
          ...invoice,
          sync_status: 'synced',
          synced_at: new Date().toISOString(),
          is_offline: false
        })
        .eq('id', invoice.id)

      if (error) throw error

      await offlineDB.put(STORES.INVOICES, {
        ...invoice,
        sync_status: 'synced',
        synced_at: new Date().toISOString(),
        is_offline: false
      })
    } else {
      // Get next invoice number
      const { data: seqData, error: seqError } = await supabase
        .rpc('get_next_invoice_number')

      if (seqError) throw seqError

      const invoiceNumber = seqData?.[0]?.next_number || seqData

      // Insert
      const { error } = await supabase
        .from('invoices')
        .insert({
          ...invoice,
          invoice_number: invoiceNumber,
          sync_status: 'synced',
          synced_at: new Date().toISOString(),
          is_offline: false
        })

      if (error) throw error

      await offlineDB.put(STORES.INVOICES, {
        ...invoice,
        invoice_number: invoiceNumber,
        sync_status: 'synced',
        synced_at: new Date().toISOString(),
        is_offline: false
      })

      console.log(`✅ Invoice ${invoice.id} synced with number ${invoiceNumber}`)
    }
  }

  /**
   * Sync from Supabase to local
   * Downloads recent changes from server
   */
  async syncFromSupabase(since = null) {
    if (!this.isOnline()) {
      return { success: false, message: 'Offline' }
    }

    try {
      console.log('📥 Syncing from Supabase...')

      const sinceDate = since || this.lastSyncTime || new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24h

      // Get updated orders
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .gte('last_modified_at', sinceDate.toISOString())
        .order('last_modified_at', { ascending: false })

      // Get updated customers
      const { data: customers } = await supabase
        .from('customers')
        .select('*')
        .gte('last_modified_at', sinceDate.toISOString())
        .order('last_modified_at', { ascending: false })

      // Save to local DB
      if (orders) {
        for (const order of orders) {
          await offlineDB.put(STORES.ORDERS, {
            ...order,
            sync_status: 'synced',
            is_offline: false
          })
        }
      }

      if (customers) {
        for (const customer of customers) {
          await offlineDB.put(STORES.CUSTOMERS, {
            ...customer,
            sync_status: 'synced',
            is_offline: false
          })
        }
      }

      console.log(`📥 Downloaded ${orders?.length || 0} orders, ${customers?.length || 0} customers`)

      return {
        success: true,
        downloaded: {
          orders: orders?.length || 0,
          customers: customers?.length || 0
        }
      }
    } catch (error) {
      console.error('Failed to sync from Supabase:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Full sync: both directions
   */
  async fullSync() {
    console.log('🔄 Starting full sync...')

    // First: upload pending changes
    const uploadResult = await this.syncToSupabase()

    // Then: download recent changes
    const downloadResult = await this.syncFromSupabase()

    return {
      success: uploadResult.success && downloadResult.success,
      upload: uploadResult,
      download: downloadResult
    }
  }

  /**
   * Get sync status
   */
  async getSyncStatus() {
    const stats = await offlineDB.getStats()

    return {
      online: this.isOnline(),
      isSyncing: this.isSyncing,
      lastSync: this.lastSyncTime,
      pendingSync: stats.pendingSync,
      pendingDetails: stats.pendingDetails,
      totalLocal: {
        orders: stats.orders,
        customers: stats.customers,
        invoices: stats.invoices
      }
    }
  }
}

// Export singleton
export const syncService = new SyncService()
