/**
 * Offline-enabled Orders API
 * Works both online and offline
 */

import { offlineDB, STORES } from './offlineDB'
import { supabase } from '@/lib/supabase'
import { syncService } from './syncService'

/**
 * Create new order (works offline)
 */
export async function createOrder(orderData) {
  const isOnline = typeof window !== 'undefined' && typeof navigator !== 'undefined' && navigator.onLine

  // Generate UUID for the order
  const orderId = crypto.randomUUID()

  const newOrder = {
    id: orderId,
    ...orderData,
    order_number: null, // Will be assigned when synced
    sync_status: isOnline ? 'pending' : 'pending',
    is_offline: !isOnline,
    local_created_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    last_modified_at: new Date().toISOString()
  }

  // Save to local DB first
  await offlineDB.put(STORES.ORDERS, newOrder)

  // If online, sync immediately
  if (isOnline) {
    try {
      const orderNumber = await syncService.syncOrder(newOrder)
      console.log(`✅ Order created online with number ${orderNumber}`)
      return { success: true, id: orderId, order_number: orderNumber, offline: false }
    } catch (error) {
      console.error('Failed to sync order online:', error)
      // Keep in local DB as pending
      return { success: true, id: orderId, offline: true, pending: true }
    }
  } else {
    console.log(`📴 Order created offline: ${orderId}`)
    return { success: true, id: orderId, offline: true, pending: true }
  }
}

/**
 * Update order (works offline)
 */
export async function updateOrder(orderId, updates) {
  const isOnline = typeof window !== 'undefined' && typeof navigator !== 'undefined' && navigator.onLine

  // Get existing order from local DB
  const existing = await offlineDB.get(STORES.ORDERS, orderId)

  if (!existing) {
    throw new Error('Order not found')
  }

  const updatedOrder = {
    ...existing,
    ...updates,
    sync_status: 'pending',
    last_modified_at: new Date().toISOString()
  }

  // Update local DB
  await offlineDB.put(STORES.ORDERS, updatedOrder)

  // If online, sync immediately
  if (isOnline) {
    try {
      await syncService.syncOrder(updatedOrder)
      console.log(`✅ Order ${orderId} updated online`)
      return { success: true, offline: false }
    } catch (error) {
      console.error('Failed to sync order update:', error)
      return { success: true, offline: true, pending: true }
    }
  } else {
    console.log(`📴 Order ${orderId} updated offline`)
    return { success: true, offline: true, pending: true }
  }
}

/**
 * Get all orders (local-first)
 */
export async function getOrders() {
  const isOnline = typeof window !== 'undefined' && typeof navigator !== 'undefined' && navigator.onLine

  // Always get from local DB first (faster)
  const localOrders = await offlineDB.getAll(STORES.ORDERS)

  // If online, sync in background
  if (isOnline) {
    syncService.syncFromSupabase().catch(err => {
      console.error('Background sync failed:', err)
    })
  }

  return {
    orders: localOrders.sort((a, b) =>
      new Date(b.created_at) - new Date(a.created_at)
    ),
    offline: !isOnline
  }
}

/**
 * Get single order
 */
export async function getOrder(orderId) {
  const order = await offlineDB.get(STORES.ORDERS, orderId)

  if (!order) {
    // Try fetching from Supabase if online
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && navigator.onLine) {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()

      if (!error && data) {
        // Save to local DB
        await offlineDB.put(STORES.ORDERS, {
          ...data,
          sync_status: 'synced',
          is_offline: false
        })
        return data
      }
    }

    throw new Error('Order not found')
  }

  return order
}

/**
 * Delete order (works offline)
 */
export async function deleteOrder(orderId) {
  const isOnline = typeof window !== 'undefined' && typeof navigator !== 'undefined' && navigator.onLine

  // Delete from local DB
  await offlineDB.delete(STORES.ORDERS, orderId)

  // If online, delete from Supabase
  if (isOnline) {
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId)

      if (error) throw error

      console.log(`✅ Order ${orderId} deleted online`)
      return { success: true, offline: false }
    } catch (error) {
      console.error('Failed to delete order online:', error)
      // Add to sync queue for later deletion
      return { success: true, offline: true, pending: true }
    }
  } else {
    console.log(`📴 Order ${orderId} deleted offline`)
    return { success: true, offline: true, pending: true }
  }
}

/**
 * Get orders by status
 */
export async function getOrdersByStatus(status) {
  const { orders } = await getOrders()
  return orders.filter(order => order.status === status)
}

/**
 * Search orders
 */
export async function searchOrders(query) {
  const { orders } = await getOrders()

  if (!query) return orders

  const lowerQuery = query.toLowerCase()

  return orders.filter(order =>
    order.customer_name?.toLowerCase().includes(lowerQuery) ||
    order.order_number?.toString().includes(query) ||
    order.id?.toLowerCase().includes(lowerQuery)
  )
}
