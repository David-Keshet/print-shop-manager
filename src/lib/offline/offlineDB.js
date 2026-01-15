/**
 * Offline Database using IndexedDB
 * Stores data locally when offline and syncs when back online
 */

const DB_NAME = 'print_shop_offline'
const DB_VERSION = 1

// Store names
const STORES = {
  ORDERS: 'orders',
  CUSTOMERS: 'customers',
  INVOICES: 'invoices',
  SYNC_QUEUE: 'sync_queue',
}

class OfflineDB {
  constructor() {
    this.db = null
    this.isInitialized = false
  }

  /**
   * Initialize IndexedDB
   */
  async init() {
    if (this.isInitialized && this.db) {
      return this.db
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        this.isInitialized = true
        console.log('✅ IndexedDB initialized')
        resolve(this.db)
      }

      request.onupgradeneeded = (event) => {
        const db = event.target.result

        // Orders store
        if (!db.objectStoreNames.contains(STORES.ORDERS)) {
          const ordersStore = db.createObjectStore(STORES.ORDERS, { keyPath: 'id' })
          ordersStore.createIndex('sync_status', 'sync_status', { unique: false })
          ordersStore.createIndex('order_number', 'order_number', { unique: false })
          ordersStore.createIndex('created_at', 'created_at', { unique: false })
          ordersStore.createIndex('last_modified_at', 'last_modified_at', { unique: false })
        }

        // Customers store
        if (!db.objectStoreNames.contains(STORES.CUSTOMERS)) {
          const customersStore = db.createObjectStore(STORES.CUSTOMERS, { keyPath: 'id' })
          customersStore.createIndex('sync_status', 'sync_status', { unique: false })
          customersStore.createIndex('name', 'name', { unique: false })
          customersStore.createIndex('customer_number', 'customer_number', { unique: false })
        }

        // Invoices store
        if (!db.objectStoreNames.contains(STORES.INVOICES)) {
          const invoicesStore = db.createObjectStore(STORES.INVOICES, { keyPath: 'id' })
          invoicesStore.createIndex('sync_status', 'sync_status', { unique: false })
          invoicesStore.createIndex('invoice_number', 'invoice_number', { unique: false })
        }

        // Sync queue store
        if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
          const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, {
            keyPath: 'id',
            autoIncrement: true
          })
          syncStore.createIndex('type', 'type', { unique: false })
          syncStore.createIndex('status', 'status', { unique: false })
          syncStore.createIndex('created_at', 'created_at', { unique: false })
        }

        console.log('📦 IndexedDB stores created')
      }
    })
  }

  /**
   * Add or update item in store
   */
  async put(storeName, data) {
    await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.put(data)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Get item by ID
   */
  async get(storeName, id) {
    await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.get(id)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Get all items from store
   */
  async getAll(storeName) {
    await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Get items by index
   */
  async getByIndex(storeName, indexName, value) {
    try {
      await this.init()

      // בדוק אם החיבור עדיין פתוח
      if (!this.db || this.db.closed) {
        console.warn('Database connection closed, reinitializing...')
        await this.init()
      }

      return new Promise((resolve, reject) => {
        try {
          const transaction = this.db.transaction([storeName], 'readonly')
          const store = transaction.objectStore(storeName)
          const index = store.index(indexName)
          const request = index.getAll(value)

          request.onsuccess = () => resolve(request.result || [])
          request.onerror = () => reject(request.error)
        } catch (error) {
          console.error('Transaction error:', error)
          reject(error)
        }
      })
    } catch (error) {
      console.error('getByIndex error:', error)
      return [] // Return empty array as fallback
    }
  }

  /**
   * Delete item by ID
   */
  async delete(storeName, id) {
    await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Clear all items from store
   */
  async clear(storeName) {
    await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Count items in store
   */
  async count(storeName) {
    await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.count()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Get pending sync items
   */
  async getPendingSync(storeName) {
    try {
      return await this.getByIndex(storeName, 'sync_status', 'pending')
    } catch (error) {
      console.error(`Failed to get pending sync for ${storeName}:`, error)
      return [] // Return empty array as fallback
    }
  }

  /**
   * Get all pending items across all stores
   */
  async getAllPendingSync() {
    const [orders, customers, invoices] = await Promise.all([
      this.getPendingSync(STORES.ORDERS),
      this.getPendingSync(STORES.CUSTOMERS),
      this.getPendingSync(STORES.INVOICES),
    ])

    return {
      orders: orders || [],
      customers: customers || [],
      invoices: invoices || [],
      total: (orders?.length || 0) + (customers?.length || 0) + (invoices?.length || 0)
    }
  }

  /**
   * Add to sync queue
   */
  async addToSyncQueue(type, action, data) {
    const queueItem = {
      type, // 'order', 'customer', 'invoice'
      action, // 'create', 'update', 'delete'
      data,
      status: 'pending',
      created_at: new Date().toISOString(),
      attempts: 0,
    }

    return this.put(STORES.SYNC_QUEUE, queueItem)
  }

  /**
   * Get sync queue
   */
  async getSyncQueue() {
    return this.getByIndex(STORES.SYNC_QUEUE, 'status', 'pending')
  }

  /**
   * Clear sync queue item
   */
  async clearSyncQueueItem(id) {
    return this.delete(STORES.SYNC_QUEUE, id)
  }

  /**
   * Get database stats
   */
  async getStats() {
    const [ordersCount, customersCount, invoicesCount, queueCount, pendingSync] = await Promise.all([
      this.count(STORES.ORDERS),
      this.count(STORES.CUSTOMERS),
      this.count(STORES.INVOICES),
      this.count(STORES.SYNC_QUEUE),
      this.getAllPendingSync(),
    ])

    return {
      orders: ordersCount,
      customers: customersCount,
      invoices: invoicesCount,
      syncQueue: queueCount,
      pendingSync: pendingSync.total,
      pendingDetails: {
        orders: pendingSync.orders.length,
        customers: pendingSync.customers.length,
        invoices: pendingSync.invoices.length,
      }
    }
  }
}

// Export singleton instance
export const offlineDB = new OfflineDB()
export { STORES }
