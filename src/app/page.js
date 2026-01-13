'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Package, Users, DollarSign, TrendingUp, Calendar, RefreshCw, Clock, AlertCircle, CheckCircle2 } from 'lucide-react'
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
  const [error, setError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [currentDateDisplay, setCurrentDateDisplay] = useState('')

  useEffect(() => {
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
      // 1. Get active orders (new or in_progress)
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id')
        .in('status', ['new', 'in_progress'])

      if (ordersError) throw ordersError

      // 2. Get total customers
      const { count: customersCount, error: customersError } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })

      if (customersError) throw customersError

      // 3. Get monthly revenue
      const currentMonth = new Date().toISOString().slice(0, 7)
      const { data: monthlyOrders, error: monthlyError } = await supabase
        .from('orders')
        .select('total_with_vat')
        .gte('created_at', `${currentMonth}-01T00:00:00`)
        .lte('created_at', `${currentMonth}-31T23:59:59`)

      if (monthlyError) throw monthlyError

      const monthlyRevenue = monthlyOrders?.reduce((sum, order) =>
        sum + parseFloat(order.total_with_vat || 0), 0) || 0

      // 4. Get recent orders (top 5)
      const { data: recent, error: recentError } = await supabase
        .from('orders')
        .select('id, order_number, customer_name, total_with_vat, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5)

      if (recentError) {
        console.error('Error fetching recent orders:', recentError)
      } else {
        setRecentOrders(recent || [])
      }

      setStats({
        activeOrders: orders?.length || 0,
        totalCustomers: customersCount || 0,
        monthlyRevenue
      })

      setLastUpdate(new Date())

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
      <div className="min-h-screen p-8">
        {/* Hero Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-5xl font-black text-gray-200 mb-3">
                דפוס קשת 🖨️
              </h1>
              <p className="text-xl text-blue-200 flex items-center gap-2 min-h-[28px]">
                {currentDateDisplay && (
                  <>
                    <Calendar size={20} className="text-blue-300" />
                    {currentDateDisplay}
                  </>
                )}
              </p>
            </div>
            <button
              onClick={handleManualRefresh}
              disabled={loading || refreshing}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
              רענן נתונים
            </button>
          </div>

          {/* Last Update & Error Display */}
          <div className="flex items-center gap-4 text-sm min-h-[24px]">
            {lastUpdate && (
              <div className="flex items-center gap-2 text-gray-300">
                <Clock size={16} />
                עודכן לאחרונה: {lastUpdate.toLocaleTimeString('he-IL')}
              </div>
            )}
            {error && (
              <div className="flex items-center gap-2 text-red-400 bg-red-900/20 px-4 py-2 rounded-lg">
                <AlertCircle size={16} />
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Active Orders Card */}
          <Link href="/orders">
            <div className="group bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-8 shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105 cursor-pointer relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                    <Package size={32} className="text-white" />
                  </div>
                  <span className="text-xs font-bold bg-white/30 text-white px-3 py-1.5 rounded-full backdrop-blur-sm animate-pulse">
                    LIVE
                  </span>
                </div>
                <div className="text-6xl font-black text-white mb-3">
                  {loading ? '...' : stats.activeOrders}
                </div>
                <div className="text-blue-100 text-lg font-semibold mb-1">
                  הזמנות פעילות
                </div>
                <div className="text-blue-200 text-sm">
                  בתהליך עיבוד כרגע
                </div>
              </div>
            </div>
          </Link>

          {/* Total Customers Card */}
          <Link href="/customers">
            <div className="group bg-gradient-to-br from-green-500 to-green-600 rounded-3xl p-8 shadow-2xl hover:shadow-green-500/50 transition-all duration-300 hover:scale-105 cursor-pointer relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                    <Users size={32} className="text-white" />
                  </div>
                  <span className="text-xs font-bold bg-white/30 text-white px-3 py-1.5 rounded-full backdrop-blur-sm">
                    TOTAL
                  </span>
                </div>
                <div className="text-6xl font-black text-white mb-3">
                  {loading ? '...' : stats.totalCustomers}
                </div>
                <div className="text-green-100 text-lg font-semibold mb-1">
                  לקוחות במערכת
                </div>
                <div className="text-green-200 text-sm">
                  סה"כ לקוחות רשומים
                </div>
              </div>
            </div>
          </Link>

          {/* Monthly Revenue Card */}
          <Link href="/reports">
            <div className="group bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl p-8 shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 cursor-pointer relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                    <DollarSign size={32} className="text-white" />
                  </div>
                  <span className="text-xs font-bold bg-white/30 text-white px-3 py-1.5 rounded-full backdrop-blur-sm">
                    MONTH
                  </span>
                </div>
                <div className="text-5xl font-black text-white mb-3">
                  {loading ? '...' : `₪${stats.monthlyRevenue.toLocaleString('he-IL', { maximumFractionDigits: 0 })}`}
                </div>
                <div className="text-purple-100 text-lg font-semibold mb-1">
                  הכנסות החודש
                </div>
                <div className="text-purple-200 text-sm">
                  מתחילת החודש עד היום
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Orders Section */}
        {recentOrders.length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-200 mb-6">הזמנות אחרונות</h2>
            <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10">
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <Link key={order.id} href={`/orders`}>
                    <div className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all duration-300 cursor-pointer group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Package size={24} className="text-blue-300" />
                        </div>
                        <div>
                          <div className="text-white font-semibold flex items-center gap-2">
                            <span>הזמנה #{order.order_number}</span>
                            <span className="text-xs text-gray-400 font-normal">
                              {new Date(order.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="text-gray-400 text-sm">{order.customer_name}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-left">
                          <div className="text-white font-bold">₪{parseFloat(order.total_with_vat).toLocaleString('he-IL')}</div>
                        </div>
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
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-200 mb-6">גישה מהירה</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Link href="/orders">
              <div className="group bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-white/10 hover:border-blue-500 cursor-pointer">
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">📦</div>
                <div className="text-lg font-bold text-white mb-1">הזמנות</div>
                <div className="text-sm text-gray-300">ניהול הזמנות</div>
              </div>
            </Link>

            <Link href="/tasks/board">
              <div className="group bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-white/10 hover:border-green-500 cursor-pointer">
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">📌</div>
                <div className="text-lg font-bold text-white mb-1">לוח משימות</div>
                <div className="text-sm text-gray-300">מעקב אחר משימות</div>
              </div>
            </Link>

            <Link href="/customers">
              <div className="group bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-white/10 hover:border-purple-500 cursor-pointer">
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">👥</div>
                <div className="text-lg font-bold text-white mb-1">לקוחות</div>
                <div className="text-sm text-gray-300">רשימת לקוחות</div>
              </div>
            </Link>

            <Link href="/reports">
              <div className="group bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-white/10 hover:border-orange-500 cursor-pointer">
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">📊</div>
                <div className="text-lg font-bold text-white mb-1">דוחות</div>
                <div className="text-sm text-gray-300">דוחות וניתוחים</div>
              </div>
            </Link>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-gradient-to-r from-green-500/10 to-green-600/10 backdrop-blur-sm rounded-3xl p-8 border border-green-500/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                <CheckCircle2 size={28} className="text-green-400" />
                מערכת פעילה ומוכנה לעבודה
              </h3>
              <p className="text-gray-300">כל המערכות עובדות כראוי • מתעדכן אוטומטית כל 30 שניות</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
              <span className="text-green-400 font-semibold">מחובר</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
