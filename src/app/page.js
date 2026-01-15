'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Calendar, Clock, AlertCircle, Zap, ArrowUpRight, ClipboardList, Package } from 'lucide-react'
import Layout from '@/components/Layout'

export const dynamic = 'force-dynamic'

export default function Home() {
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [currentDateDisplay, setCurrentDateDisplay] = useState('')
  const [mounted, setMounted] = useState(false)
  const [fromCache, setFromCache] = useState(false)
  const [greeting, setGreeting] = useState('')

  // Calculate greeting and date on every render to avoid hydration mismatch
  const getGreeting = () => {
    if (!mounted) return '' // Return empty string on server
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) return 'בוקר טוב! ☀️'
    if (hour >= 12 && hour < 17) return 'צהריים טובים! 🌤️'
    if (hour >= 17 && hour < 21) return 'ערב טוב! 🌆'
    return 'לילה טוב! 🌙'
  }

  const getCurrentDate = () => {
    if (!mounted) return '' // Return empty string on server
    const date = new Date()
    return date.toLocaleDateString('he-IL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  useEffect(() => {
    setMounted(true)
    
    // Set greeting and date in state
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) {
      setGreeting('בוקר טוב! ☀️')
    } else if (hour >= 12 && hour < 17) {
      setGreeting('צהריים טובים! 🌤️')
    } else if (hour >= 17 && hour < 21) {
      setGreeting('ערב טוב! 🌆')
    } else {
      setGreeting('לילה טוב! 🌙')
    }

    const date = new Date()
    setCurrentDateDisplay(date.toLocaleDateString('he-IL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }))

    fetchStats()

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
      const ordersResponse = await fetch('/api/cache/orders?limit=5&type=recent')
      const ordersData = await ordersResponse.json()

      if (!ordersData.success) {
        console.error('Error fetching recent orders:', ordersData.error)
        setRecentOrders([])
      } else {
        setRecentOrders(ordersData.data || [])
      }

      setLastUpdate(new Date())
      setFromCache(ordersData.fromCache)

    } catch (err) {
      console.error('Error in fetchStats:', err)
      setError(err.message || 'שגיאה בטעינת הנתונים')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }


  const getStatusBadge = (status) => {
    const statusMap = {
      'new': { label: 'חדש', color: 'bg-blue-500/20 text-blue-300 border border-blue-500/30' },
      'in_progress': { label: 'בתהליך', color: 'bg-amber-500/20 text-amber-300 border border-amber-500/30' },
      'ready': { label: 'מוכן', color: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' },
      'completed': { label: 'הושלם', color: 'bg-slate-500/20 text-slate-300 border border-slate-500/30' }
    }
    const statusInfo = statusMap[status] || { label: status, color: 'bg-slate-500/20 text-slate-300 border border-slate-500/30' }
    return (
      <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    )
  }

  const quickActions = [
    { href: '/orders', icon: '📦', label: 'הזמנות', desc: 'ניהול הזמנות', gradient: 'from-blue-600 to-blue-800', hoverGlow: 'hover:shadow-blue-500/25' },
    { href: '/tasks/board', icon: '📌', label: 'לוח משימות', desc: 'מעקב משימות', gradient: 'from-emerald-600 to-emerald-800', hoverGlow: 'hover:shadow-emerald-500/25' },
    { href: '/customers', icon: '👥', label: 'לקוחות', desc: 'ניהול לקוחות', gradient: 'from-violet-600 to-violet-800', hoverGlow: 'hover:shadow-violet-500/25' },
    { href: '/documents', icon: '📄', label: 'מסמכים', desc: 'ניהול מסמכים', gradient: 'from-amber-600 to-amber-800', hoverGlow: 'hover:shadow-amber-500/25' },
    { href: '/reports', icon: '📊', label: 'דוחות', desc: 'צפייה בדוחות', gradient: 'from-rose-600 to-rose-800', hoverGlow: 'hover:shadow-rose-500/25' },
    { href: '/settings', icon: '⚙️', label: 'הגדרות', desc: 'הגדרות מערכת', gradient: 'from-slate-600 to-slate-800', hoverGlow: 'hover:shadow-slate-500/25' },
  ]

  return (
    <Layout>
      <div className="min-h-screen p-6 lg:p-8">
        {/* Background Effects */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto">
          {/* Header Section */}
          <header className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-3xl lg:text-4xl text-white mb-2">
                  {mounted ? greeting : getGreeting()}
                </h1>
                <p className="text-slate-400 text-xl">ברוכים הבאים למערכת ניהול דפוס קשת</p>
                <div className="flex items-center gap-2 mt-3 text-slate-500">
                  <Calendar size={16} />
                  <span>{mounted ? currentDateDisplay : getCurrentDate()}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Last Update Info */}
                {lastUpdate && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 text-sm text-slate-400">
                    <Clock size={14} />
                    <span>עודכן: {lastUpdate.toLocaleTimeString('he-IL')}</span>
                    {fromCache && (
                      <span className="flex items-center gap-1 bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full text-xs">
                        <Zap size={10} />
                        מהיר
                      </span>
                    )}
                  </div>
                )}

                {/* Sync Button removed */}
              </div>
            </div>


            {error && (
              <div className="mt-4 flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl text-sm">
                <AlertCircle size={16} />
                {error}
              </div>
            )}
          </header>


          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Actions */}
            <section className="lg:col-span-1">
              <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/30">
                <h2 className="text-2xl text-white mb-5 flex items-center gap-2">
                  <Zap size={20} className="text-amber-400" />
                  גישה מהירה
                </h2>
                
                <div className="grid grid-cols-2 gap-3">
                  {quickActions.map((action, index) => (
                    <Link key={index} href={action.href}>
                      <div className={`group relative bg-gradient-to-br ${action.gradient} rounded-xl p-4 transition-all duration-300 hover:scale-105 ${action.hoverGlow} hover:shadow-xl cursor-pointer overflow-hidden`}>
                        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors"></div>
                        <div className="relative">
                          <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-300">
                            {action.icon}
                          </div>
                          <div className="text-white text-base">{action.label}</div>
                          <div className="text-white/70 text-sm mt-0.5">{action.desc}</div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </section>

            {/* Recent Orders */}
            <section className="lg:col-span-2">
              <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/30 h-full">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-2xl text-white flex items-center gap-2">
                    <ClipboardList size={20} className="text-blue-400" />
                    פעולות אחרונות
                  </h2>
                  <Link href="/orders" className="text-blue-400 hover:text-blue-300 text-base flex items-center gap-1 transition-colors">
                    צפה בכל
                    <ArrowUpRight size={14} />
                  </Link>
                </div>

                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-16 bg-slate-700/30 rounded-xl animate-pulse"></div>
                    ))}
                  </div>
                ) : recentOrders.length > 0 ? (
                  <div className="space-y-3">
                    {recentOrders.map((order) => (
                      <Link key={order.id} href="/orders">
                        <div className="group flex items-center justify-between p-4 bg-slate-700/20 hover:bg-slate-700/40 rounded-xl transition-all cursor-pointer border border-transparent hover:border-slate-600/50">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl flex items-center justify-center border border-blue-500/20">
                              <Package size={20} className="text-blue-400" />
                            </div>
                            <div>
                              <div className="text-white text-base">הזמנה #{order.order_number}</div>
                              <div className="text-slate-300 text-sm">{order.customer_name}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-left">
                              <div className="text-white text-base">₪{parseFloat(order.total_with_vat).toLocaleString('he-IL')}</div>
                            </div>
                            {getStatusBadge(order.status)}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <Package size={48} className="mb-4 opacity-50" />
                    <p className="text-base">אין הזמנות אחרונות</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Footer */}
          <footer className="mt-8 text-center text-slate-500 text-sm">
            <p>© 2026 דפוס קשת - מערכת ניהול מתקדמת</p>
          </footer>
        </div>
      </div>
    </Layout>
  )
}