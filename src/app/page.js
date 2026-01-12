'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { BarChart3, Users, Package, DollarSign, TrendingUp, Calendar, Menu, X } from 'lucide-react'
import Layout from '@/components/Layout'

export const dynamic = 'force-dynamic'

export default function Home() {
  const [stats, setStats] = useState({
    activeOrders: 0,
    totalCustomers: 0,
    monthlyRevenue: 0
  })
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      // שליפת הזמנות פעילות
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('total_with_vat, status')
        .in('status', ['new', 'in_progress'])

      if (ordersError) throw ordersError

      // שליפת כל הלקוחות
      const { count: customersCount, error: customersError } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })

      if (customersError) throw customersError

      // חישוב הכנסות החודש
      const currentMonth = new Date().toISOString().slice(0, 7)
      const { data: monthlyOrders, error: monthlyError } = await supabase
        .from('orders')
        .select('total_with_vat')
        .gte('created_at', `${currentMonth}-01T00:00:00`)
        .lte('created_at', `${currentMonth}-31T23:59:59`)

      if (monthlyError) throw monthlyError

      const monthlyRevenue = monthlyOrders?.reduce((sum, order) =>
        sum + parseFloat(order.total_with_vat), 0) || 0

      setStats({
        activeOrders: orders?.length || 0,
        totalCustomers: customersCount || 0,
        monthlyRevenue
      })
    } catch (error) {
      console.error('שגיאה בטעינת סטטיסטיקות:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Toggle Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-6 right-6 z-50 p-2 bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg text-white hover:bg-white/20 transition-all shadow-xl"
      >
        {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-white/10 backdrop-blur-lg border-l border-white/20 shadow-2xl flex flex-col transition-all duration-300 overflow-hidden`}>
        {/* Logo */}
        <Link href="/">
          <div className="p-6 border-b border-white/20 cursor-pointer hover:bg-white/5 transition-all">
            <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
              <span>🖨️</span>
              <span>דפוס קשת</span>
            </h1>
          </div>
        </Link>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <Link href="/orders">
            <button className="w-full text-right px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 transition-all flex items-center gap-3 group">
              <span className="text-xl group-hover:scale-110 transition-transform">📦</span>
              <span>הזמנות</span>
            </button>
          </Link>

          <Link href="/tasks/board">
            <button className="w-full text-right px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 transition-all flex items-center gap-3 group">
              <span className="text-xl group-hover:scale-110 transition-transform">📌</span>
              <span>לוח משימות</span>
            </button>
          </Link>

          <div className="border-t border-white/10 my-3"></div>

          <Link href="/customers">
            <button className="w-full text-right px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 transition-all flex items-center gap-3 group">
              <span className="text-xl group-hover:scale-110 transition-transform">👥</span>
              <span>לקוחות</span>
            </button>
          </Link>

          <div className="border-t border-white/10 my-3"></div>

          <Link href="/reports">
            <button className="w-full text-right px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 transition-all flex items-center gap-3 group">
              <span className="text-xl group-hover:scale-110 transition-transform">📊</span>
              <span>דוחות</span>
            </button>
          </Link>

          <div className="border-t border-white/10 my-3"></div>

          <Link href="/users">
            <button className="w-full text-right px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 transition-all flex items-center gap-3 group">
              <span className="text-xl group-hover:scale-110 transition-transform">👨‍💼</span>
              <span>ניהול משתמשים</span>
            </button>
          </Link>

          <Link href="/settings">
            <button className="w-full text-right px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 transition-all flex items-center gap-3 group">
              <span className="text-xl group-hover:scale-110 transition-transform">⚙️</span>
              <span>הגדרות</span>
            </button>
          </Link>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/20">
          <p className="text-xs text-white/50 text-center">© 2026 דפוס קשת</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="w-[90%] mx-auto p-8">
          {/* Welcome Card */}
          <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-8 mb-8 border border-white/20">
            <h2 className="text-4xl font-extrabold text-gray-800 mb-3">ברוכים הבאים למערכת!</h2>
            <p className="text-lg text-gray-600">בחר פעולה מהתפריט הצדדי כדי להתחיל</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border-2 border-blue-200 hover:shadow-xl transition-all">
              <div className="flex items-center justify-between mb-4">
                <span className="text-4xl">📦</span>
                <span className="text-xs text-blue-600 font-semibold bg-blue-200 px-3 py-1 rounded-full">LIVE</span>
              </div>
              <p className="text-5xl font-extrabold text-blue-700 mb-2">
                {loading ? '...' : stats.activeOrders}
              </p>
              <p className="text-gray-700 font-bold text-lg">הזמנות פעילות</p>
              <p className="text-gray-500 text-sm mt-1">בתהליך עיבוד</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border-2 border-green-200 hover:shadow-xl transition-all">
              <div className="flex items-center justify-between mb-4">
                <span className="text-4xl">👥</span>
                <span className="text-xs text-green-600 font-semibold bg-green-200 px-3 py-1 rounded-full">TOTAL</span>
              </div>
              <p className="text-5xl font-extrabold text-green-700 mb-2">
                {loading ? '...' : stats.totalCustomers}
              </p>
              <p className="text-gray-700 font-bold text-lg">לקוחות במערכת</p>
              <p className="text-gray-500 text-sm mt-1">סה"כ לקוחות</p>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-blue-100 rounded-2xl p-6 border-2 border-indigo-200 hover:shadow-xl transition-all">
              <div className="flex items-center justify-between mb-4">
                <span className="text-4xl">💰</span>
                <span className="text-xs text-indigo-600 font-semibold bg-indigo-200 px-3 py-1 rounded-full">MONTH</span>
              </div>
              <p className="text-5xl font-extrabold text-indigo-700 mb-2">
                {loading ? '...' : `₪${stats.monthlyRevenue.toFixed(0)}`}
              </p>
              <p className="text-gray-700 font-bold text-lg">הכנסות החודש</p>
              <p className="text-gray-500 text-sm mt-1">עד כה</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
