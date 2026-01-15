/**
 * React Hook for Offline/Online detection and auto-sync
 */

import { useState, useEffect, useCallback } from 'react'
import { syncService } from './syncService'
import { offlineDB } from './offlineDB'

export function useOffline() {
  const [isOnline, setIsOnline] = useState(true)
  const [syncStatus, setSyncStatus] = useState({
    status: 'idle', // 'idle', 'syncing', 'completed', 'error'
    progress: 0,
    synced: 0,
    total: 0,
    errors: null
  })
  const [pendingCount, setPendingCount] = useState(0)

  // Update online status
  useEffect(() => {
    const updateOnlineStatus = () => {
      // Check if we're in browser
      if (typeof window === 'undefined' || typeof navigator === 'undefined') {
        return
      }

      const online = navigator.onLine
      setIsOnline(online)
      console.log(online ? '✅ Back online' : '📴 Gone offline')

      // Auto-sync when coming back online
      if (online && pendingCount > 0) {
        console.log('🔄 Auto-syncing after reconnection...')
        setTimeout(() => {
          syncService.fullSync()
        }, 1000) // Wait 1 second before syncing
      }
    }

    // Set initial state
    updateOnlineStatus()

    // Listen to online/offline events
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)

    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [pendingCount])

  // Subscribe to sync status changes
  useEffect(() => {
    const unsubscribe = syncService.onSyncStatusChange((status) => {
      setSyncStatus(status)
    })

    return unsubscribe
  }, [])

  // Update pending count periodically
  useEffect(() => {
    const updatePendingCount = async () => {
      try {
        const pending = await offlineDB.getAllPendingSync()
        setPendingCount(pending.total)
      } catch (error) {
        console.error('Failed to get pending count:', error)
        setPendingCount(0) // Set to 0 on error to prevent infinite errors
      }
    }

    updatePendingCount()

    // Update every 10 seconds
    const interval = setInterval(updatePendingCount, 10000)

    return () => clearInterval(interval)
  }, [])

  // Manual sync function
  const sync = useCallback(async () => {
    try {
      const result = await syncService.fullSync()
      return result
    } catch (error) {
      console.error('Sync error:', error)
      return { success: false, error: error.message }
    }
  }, [])

  // Get sync status
  const getStatus = useCallback(async () => {
    return await syncService.getSyncStatus()
  }, [])

  return {
    isOnline,
    syncStatus,
    pendingCount,
    sync,
    getStatus,
    isSyncing: syncStatus.status === 'syncing'
  }
}
