'use client'

import { useState, useEffect } from 'react'
import { useOffline } from '@/lib/offline/useOffline'

/**
 * SyncIndicator - Minimalist green dot indicator
 * Changed from large banners to a subtle dot in the bottom right
 */
export default function SyncIndicator() {
  const [mounted, setMounted] = useState(false)
  const { isOnline, isSyncing } = useOffline()

  useEffect(() => {
    setMounted(true)

    // פונקציית סנכרון iCount ברקע
    const triggerICountSync = async () => {
      if (!navigator.onLine) return;

      try {
        console.log('🔄 Triggering background iCount sync...')
        const response = await fetch('/api/icount/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'invoices' })
        });
        const data = await response.json();
        console.log('✅ Background sync result:', data.message);
      } catch (err) {
        console.error('❌ Background sync failed:', err);
      }
    };

    // הפעלה ראשונה אחרי 5 שניות
    const firstSync = setTimeout(triggerICountSync, 5000);

    // הפעלה מחזורית כל 5 דקות
    const interval = setInterval(triggerICountSync, 5 * 60 * 1000);

    return () => {
      clearTimeout(firstSync);
      clearInterval(interval);
    }
  }, [])

  if (!mounted) return null

  return (
    <div className="fixed bottom-6 left-6 z-50 pointer-events-none select-none">
      <div className={`p-1.5 rounded-full bg-slate-900/10 backdrop-blur-md border border-white/10 transition-all duration-700 ${isSyncing || !isOnline ? 'scale-100 opacity-100' : 'scale-75 opacity-20 hover:opacity-100 hover:scale-100'}`}>
        <div className="relative flex h-2.5 w-2.5">
          {!isOnline ? (
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span>
          ) : (
            <>
              {isSyncing && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isSyncing ? 'bg-green-500' : 'bg-green-400'} shadow-[0_0_8px_rgba(34,197,94,0.5)]`}></span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
