'use client'

import { useState, useEffect } from 'react'
import { useOffline } from '@/lib/offline/useOffline'
import { Wifi, WifiOff, RefreshCw, CheckCircle2, AlertCircle, Cloud } from 'lucide-react'

export default function SyncIndicator() {
  const [mounted, setMounted] = useState(false)
  const { isOnline, syncStatus, pendingCount, sync, isSyncing } = useOffline()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleManualSync = async () => {
    if (!isOnline) {
      alert('📴 לא מחובר לאינטרנט')
      return
    }

    if (pendingCount === 0) {
      alert('✅ הכל מסונכרן!')
      return
    }

    await sync()
  }

  // Status colors and icons
  const getStatusDisplay = () => {
    if (!isOnline) {
      return {
        icon: <WifiOff size={16} />,
        text: 'אופליין',
        color: 'bg-red-500/20 text-red-300 border-red-500/30',
        pulse: false
      }
    }

    if (isSyncing) {
      return {
        icon: <RefreshCw size={16} className="animate-spin" />,
        text: `מסנכרן... ${syncStatus.progress}%`,
        color: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        pulse: true
      }
    }

    if (pendingCount > 0) {
      return {
        icon: <Cloud size={16} />,
        text: `${pendingCount} ממתינים`,
        color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
        pulse: false
      }
    }

    return {
      icon: <CheckCircle2 size={16} />,
      text: 'מסונכרן',
      color: 'bg-green-500/20 text-green-300 border-green-500/30',
      pulse: false
    }
  }

  const display = getStatusDisplay()

  // Don't render until mounted (avoid hydration mismatch)
  if (!mounted) {
    return null
  }

  return (
    <div className="fixed top-4 left-4 z-50 flex items-center gap-2">
      {/* Status Badge */}
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border backdrop-blur-lg ${display.color} ${display.pulse ? 'animate-pulse' : ''} transition-all`}
      >
        {display.icon}
        <span className="text-sm font-semibold">{display.text}</span>
      </div>

      {/* Manual Sync Button */}
      {isOnline && pendingCount > 0 && !isSyncing && (
        <button
          onClick={handleManualSync}
          className="flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-all hover:scale-105 shadow-lg"
          title="סנכרון ידני"
        >
          <RefreshCw size={16} />
          סנכרן עכשיו
        </button>
      )}

      {/* Sync Errors */}
      {syncStatus.status === 'error' && (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg backdrop-blur-lg">
          <AlertCircle size={16} />
          <span className="text-sm font-semibold">שגיאת סנכרון</span>
        </div>
      )}
    </div>
  )
}
