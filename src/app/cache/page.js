'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { Database, Trash2, RefreshCw, Activity, Clock, TrendingUp } from 'lucide-react'

export default function CachePage() {
  const [cacheInfo, setCacheInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [clearing, setClearing] = useState(false)

  useEffect(() => {
    fetchCacheInfo()
    // Auto-refresh every 5 seconds
    const interval = setInterval(fetchCacheInfo, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchCacheInfo = async () => {
    try {
      const response = await fetch('/api/cache/info')
      const data = await response.json()
      if (data.success) {
        setCacheInfo(data.cache)
      }
    } catch (err) {
      console.error('Error fetching cache info:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleClearCache = async () => {
    if (!confirm('האם אתה בטוח שברצונך לנקות את כל ה-Cache?')) {
      return
    }

    setClearing(true)
    try {
      const response = await fetch('/api/cache/info', { method: 'DELETE' })
      const data = await response.json()
      if (data.success) {
        alert('✅ Cache נוקה בהצלחה!')
        fetchCacheInfo()
      }
    } catch (err) {
      console.error('Error clearing cache:', err)
      alert('❌ שגיאה בניקוי Cache')
    } finally {
      setClearing(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="p-8 flex items-center justify-center">
          <RefreshCw className="animate-spin text-blue-500" size={32} />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Database size={32} className="text-blue-400" />
                מצב Cache
              </h1>
              <p className="text-gray-400 mt-2">
                ניהול ומעקב אחר מטמון המערכת
              </p>
            </div>
            <button
              onClick={handleClearCache}
              disabled={clearing}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-all disabled:opacity-50"
            >
              <Trash2 size={16} />
              {clearing ? 'מנקה...' : 'נקה Cache'}
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            {/* Total Items */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-3">
                <Database size={24} className="text-white" />
                <span className="text-sm font-semibold text-blue-100">פריטים</span>
              </div>
              <div className="text-4xl font-black text-white">
                {cacheInfo?.totalItems || 0}
              </div>
              <div className="text-blue-100 text-sm mt-1">
                מתוך {cacheInfo?.maxSize || 100} מקסימום
              </div>
            </div>

            {/* Utilization */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-3">
                <TrendingUp size={24} className="text-white" />
                <span className="text-sm font-semibold text-purple-100">ניצול</span>
              </div>
              <div className="text-4xl font-black text-white">
                {cacheInfo?.utilization?.toFixed(1) || 0}%
              </div>
              <div className="text-purple-100 text-sm mt-1">
                {cacheInfo?.recommendations?.performance || 'good'}
              </div>
            </div>

            {/* Status */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-3">
                <Activity size={24} className="text-white" />
                <span className="text-sm font-semibold text-green-100">סטטוס</span>
              </div>
              <div className="text-4xl font-black text-white">
                {cacheInfo?.recommendations?.shouldClean ? '⚠️' : '✅'}
              </div>
              <div className="text-green-100 text-sm mt-1">
                {cacheInfo?.recommendations?.shouldClean ? 'צריך ניקוי' : 'תקין'}
              </div>
            </div>
          </div>

          {/* Cache Items */}
          {cacheInfo?.items && cacheInfo.items.length > 0 && (
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Database size={20} />
                פריטים ב-Cache
              </h2>
              <div className="space-y-3">
                {cacheInfo.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all"
                  >
                    <div>
                      <div className="text-white font-semibold">{item.key}</div>
                      <div className="text-gray-400 text-sm flex items-center gap-2 mt-1">
                        <Clock size={12} />
                        נוצר לפני {Math.round((Date.now() - item.timestamp) / 1000)} שניות
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-300 text-sm">
                        פג בעוד {Math.max(0, Math.round((item.expiresAt - Date.now()) / 1000))} שניות
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {(!cacheInfo?.items || cacheInfo.items.length === 0) && (
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-12 border border-white/10 text-center">
              <Database size={48} className="text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">ה-Cache ריק</p>
              <p className="text-gray-500 text-sm mt-2">
                נתונים יאוחסנו אוטומטית כשתבצע שאילתות
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
