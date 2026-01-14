'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Package, Users, DollarSign, TrendingUp, Calendar, RefreshCw, Clock, AlertCircle, CheckCircle2, CloudSync, Database } from 'lucide-react'
import Layout from '@/components/Layout'

export const dynamic = 'force-dynamic'

export default function Home() {
  const [stats, setStats] = useState({
    activeOrders: 0,
    totalCustomers: 0,
    monthlyRevenue: 0
  })
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState(null)
  const [error, setError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [currentDateDisplay, setCurrentDateDisplay] = useState('')
  const [mounted, setMounted] = useState(false)
  const [fromCache, setFromCache] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Set date on client side to avoid hydration mismatch
    const date = new Date()
    setCurrentDateDisplay(date.toLocaleDateString('he-IL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }))

    fetchStats()

    // Auto refresh every 30 seconds
    const interval = setInterval(() => {
      fetchStats(true)
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const fetchStats = async (isAutoRefresh = false) => {
    if (!isAutoRefresh) {
      setLoading(true)
    } else {
      setRefreshing(true)
    }
    setError(null)

    try {
      // Use cached API endpoints for faster loading
      const [statsResponse, ordersResponse] = await Promise.all([
        fetch('/api/cache/stats'),
        fetch('/api/cache/orders?limit=5&type=recent')
      ])

      const statsData = await statsResponse.json()
      const ordersData = await ordersResponse.json()

      if (!statsData.success) {
        throw new Error(statsData.error || 'שגיאה בטעינת סטטיסטיקות')
      }

      if (!ordersData.success) {
        console.error('Error fetching recent orders:', ordersData.error)
        setRecentOrders([])
      } else {
        setRecentOrders(ordersData.data || [])
      }

      setStats({
        activeOrders: statsData.data.activeOrders || 0,
        totalCustomers: statsData.data.totalCustomers || 0,
        monthlyRevenue: statsData.data.monthlyRevenue || 0
      })

      setLastUpdate(new Date())

      // Track cache status
      setFromCache(statsData.fromCache || ordersData.fromCache)

      // Log cache status for debugging
      if (statsData.fromCache) {
        console.log('📦 Stats loaded from cache')
      }
      if (ordersData.fromCache) {
        console.log('📦 Orders loaded from cache')
      }

    } catch (err) {
      console.error('Error in fetchStats:', err)
      setError(err.message || 'שגיאה בטעינת הנתונים')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleManualRefresh = () => {
    fetchStats()
  }

  const handleSyncFromICount = async () => {
    setSyncing(true)
    setSyncMessage(null)
    setError(null)

    try {
      const response = await fetch('/api/icount/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'all' })
      })

      const data = await response.json()

      if (data.success) {
        setSyncMessage('✅ סנכרון הושלם בהצלחה!')

        // Clear cache to force fresh data
        await Promise.all([
          fetch('/api/cache/stats', { method: 'DELETE' }),
          fetch('/api/cache/orders', { method: 'DELETE' })
        ])

        // Refresh stats after sync with fresh data
        fetchStats()
      } else {
        setError(data.message || 'שגיאה בסנכרון')
      }
    } catch (err) {
      console.error('Sync error:', err)
      setError('שגיאה בסנכרון עם iCount')
    } finally {
      setSyncing(false)
      // Clear message after 3 seconds
      setTimeout(() => setSyncMessage(null), 3000)
    }
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      'new': { label: 'חדש', color: 'bg-blue-100 text-blue-800' },
      'in_progress': { label: 'בתהליך', color: 'bg-yellow-100 text-yellow-800' },
      'ready': { label: 'מוכן', color: 'bg-green-100 text-green-800' },
      'completed': { label: 'הושלם', color: 'bg-gray-100 text-gray-800' }
    }
    const statusInfo = statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    )
  }

  return (
    <Layout>
      <div className="h-screen overflow-hidden flex flex-col p-4">
        {/* Hero Section - Compact */}
        <div className="mb-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              {mounted && currentDateDisplay && (
                <div className="flex items-center gap-2 text-sm text-blue-200">
                  <Calendar size={14} className="text-blue-300" />
                  {currentDateDisplay}
                </div>
              )}
              {lastUpdate && (
                <div className="flex items-center gap-2 text-xs text-gray-300">
                  <Clock size={12} />
                  {lastUpdate.toLocaleTimeString('he-IL')}
                  {fromCache && (
                    <span className="flex items-center gap-1 bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full">
                      <Database size={10} />
                      Cache
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Sync Button */}
            <button
              onClick={handleSyncFromICount}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg text-sm font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg"
            >
              <CloudSync size={16} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'מסנכרן...' : 'סנכרן עם iCount'}
            </button>
          </div>

          {/* Success Message */}
          {syncMessage && (
            <div className="flex items-center gap-2 text-green-400 bg-green-900/20 px-3 py-1.5 rounded-lg text-xs animate-pulse">
              <CheckCircle2 size={14} />
              {syncMessage}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 text-red-400 bg-red-900/20 px-3 py-1.5 rounded-lg text-xs">
              <AlertCircle size={14} />
              {error}
            </div>
          )}
        </div>

        {/* Stats Grid - Compact */}
        <div className="grid grid-cols-3 gap-4 mb-4 flex-shrink-0">
          {/* Active Orders Card */}
          <Link href="/orders">
            <div className="group bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 shadow-xl hover:shadow-blue-500/50 transition-all hover:scale-105 cursor-pointer relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <Package size={20} className="text-white" />
                  </div>
                  <span className="text-[10px] font-bold bg-white/30 text-white px-2 py-0.5 rounded-full animate-pulse">
                    LIVE
                  </span>
                </div>
                <div className="text-4xl font-black text-white mb-1">
                  {loading ? '...' : stats.activeOrders}
                </div>
                <div className="text-blue-100 text-sm font-semibold">
                  הזמנות פעילות
                </div>
              </div>
            </div>
          </Link>

          {/* Total Customers Card */}
          <Link href="/customers">
            <div className="group bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-4 shadow-xl hover:shadow-green-500/50 transition-all hover:scale-105 cursor-pointer relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <Users size={20} className="text-white" />
                  </div>
                  <span className="text-[10px] font-bold bg-white/30 text-white px-2 py-0.5 rounded-full">
                    TOTAL
                  </span>
                </div>
                <div className="text-4xl font-black text-white mb-1">
                  {loading ? '...' : stats.totalCustomers}
                </div>
                <div className="text-green-100 text-sm font-semibold">
                  לקוחות במערכת
                </div>
              </div>
            </div>
          </Link>

          {/* Monthly Revenue Card */}
          <Link href="/reports">
            <div className="group bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 shadow-xl hover:shadow-purple-500/50 transition-all hover:scale-105 cursor-pointer relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <DollarSign size={20} className="text-white" />
                  </div>
                  <span className="text-[10px] font-bold bg-white/30 text-white px-2 py-0.5 rounded-full">
                    MONTH
                  </span>
                </div>
                <div className="text-3xl font-black text-white mb-1">
                  {loading ? '...' : `₪${stats.monthlyRevenue.toLocaleString('he-IL', { maximumFractionDigits: 0 })}`}
                </div>
                <div className="text-purple-100 text-sm font-semibold">
                  הכנסות החודש
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Orders & Quick Actions - Side by Side */}
        <div className="flex-1 grid grid-cols-2 gap-4 overflow-hidden">
          {/* Recent Orders Section */}
          {recentOrders.length > 0 && (
            <div className="flex flex-col overflow-hidden">
              <h2 className="text-xl font-bold text-gray-200 mb-3">הזמנות אחרונות</h2>
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 border border-white/10 flex-1 overflow-y-auto">
                <div className="space-y-2">
                  {recentOrders.map((order) => (
                    <Link key={order.id} href={`/orders`}>
                      <div className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer group">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                            <Package size={16} className="text-blue-300" />
                          </div>
                          <div>
                            <div className="text-white text-sm font-semibold">הזמנה #{order.order_number}</div>
                            <div className="text-gray-400 text-xs">{order.customer_name}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-white text-sm font-bold">₪{parseFloat(order.total_with_vat).toLocaleString('he-IL')}</div>
                          {getStatusBadge(order.status)}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex flex-col overflow-hidden">
            <h2 className="text-xl font-bold text-gray-200 mb-3">גישה מהירה</h2>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/orders">
                <div className="group bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-xl p-4 shadow-lg hover:shadow-xl transition-all hover:scale-105 border border-white/10 hover:border-blue-500 cursor-pointer">
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">📦</div>
                  <div className="text-sm font-bold text-white">הזמנות</div>
                </div>
              </Link>

              <Link href="/tasks/board">
                <div className="group bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-xl p-4 shadow-lg hover:shadow-xl transition-all hover:scale-105 border border-white/10 hover:border-green-500 cursor-pointer">
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">📌</div>
                  <div className="text-sm font-bold text-white">לוח משימות</div>
                </div>
              </Link>

              <Link href="/customers">
                <div className="group bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-xl p-4 shadow-lg hover:shadow-xl transition-all hover:scale-105 border border-white/10 hover:border-purple-500 cursor-pointer">
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">👥</div>
                  <div className="text-sm font-bold text-white">לקוחות</div>
                </div>
              </Link>

              <Link href="/reports">
                <div className="group bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-xl p-4 shadow-lg hover:shadow-xl transition-all hover:scale-105 border border-white/10 hover:border-orange-500 cursor-pointer">
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">📊</div>
                  <div className="text-sm font-bold text-white">דוחות</div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
