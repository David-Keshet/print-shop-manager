'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Package, Users, DollarSign, TrendingUp, ArrowLeft, Calendar } from 'lucide-react'
import Layout from '@/components/Layout'

export const dynamic = 'force-dynamic'

export default function Home() {
  const [stats, setStats] = useState({
    activeOrders: 0,
    totalCustomers: 0,
    monthlyRevenue: 0
  })
  const [loading, setLoading] = useState(true)

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

  const currentDate = new Date()
  const hebrewDate = currentDate.toLocaleDateString('he-IL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

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
              <p className="text-xl text-blue-200 flex items-center gap-2">
                <Calendar size={20} className="text-blue-300" />
                {hebrewDate}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Active Orders Card */}
          <div className="group bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-8 shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105 cursor-pointer relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50/10 rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gray-50/10 rounded-full -ml-12 -mb-12"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div className="p-4 bg-gray-50/20 rounded-2xl backdrop-blur-sm">
                  <Package size={32} className="text-gray-200" />
                </div>
                <span className="text-xs font-bold bg-gray-50/30 text-gray-200 px-3 py-1.5 rounded-full backdrop-blur-sm">
                  LIVE
                </span>
              </div>
              <div className="text-6xl font-black text-gray-200 mb-3">
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

          {/* Total Customers Card */}
          <div className="group bg-gradient-to-br from-green-500 to-green-600 rounded-3xl p-8 shadow-2xl hover:shadow-green-500/50 transition-all duration-300 hover:scale-105 cursor-pointer relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50/10 rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gray-50/10 rounded-full -ml-12 -mb-12"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div className="p-4 bg-gray-50/20 rounded-2xl backdrop-blur-sm">
                  <Users size={32} className="text-gray-200" />
                </div>
                <span className="text-xs font-bold bg-gray-50/30 text-gray-200 px-3 py-1.5 rounded-full backdrop-blur-sm">
                  TOTAL
                </span>
              </div>
              <div className="text-6xl font-black text-gray-200 mb-3">
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

          {/* Monthly Revenue Card */}
          <div className="group bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl p-8 shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 cursor-pointer relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50/10 rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gray-50/10 rounded-full -ml-12 -mb-12"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div className="p-4 bg-gray-50/20 rounded-2xl backdrop-blur-sm">
                  <DollarSign size={32} className="text-gray-200" />
                </div>
                <span className="text-xs font-bold bg-gray-50/30 text-gray-200 px-3 py-1.5 rounded-full backdrop-blur-sm">
                  MONTH
                </span>
              </div>
              <div className="text-5xl font-black text-gray-200 mb-3">
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
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-200 mb-6">גישה מהירה</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Link href="/orders">
              <div className="group bg-gray-50 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border-2 border-gray-100 hover:border-blue-500 cursor-pointer">
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">📦</div>
                <div className="text-lg font-bold text-gray-800 mb-1">הזמנות</div>
                <div className="text-sm text-gray-500">ניהול הזמנות</div>
              </div>
            </Link>

            <Link href="/tasks/board">
              <div className="group bg-gray-50 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border-2 border-gray-100 hover:border-green-500 cursor-pointer">
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">📌</div>
                <div className="text-lg font-bold text-gray-800 mb-1">לוח משימות</div>
                <div className="text-sm text-gray-500">מעקב אחר משימות</div>
              </div>
            </Link>

            <Link href="/customers">
              <div className="group bg-gray-50 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border-2 border-gray-100 hover:border-purple-500 cursor-pointer">
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">👥</div>
                <div className="text-lg font-bold text-gray-800 mb-1">לקוחות</div>
                <div className="text-sm text-gray-500">רשימת לקוחות</div>
              </div>
            </Link>

            <Link href="/reports">
              <div className="group bg-gray-50 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border-2 border-gray-100 hover:border-orange-500 cursor-pointer">
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">📊</div>
                <div className="text-lg font-bold text-gray-800 mb-1">דוחות</div>
                <div className="text-sm text-gray-500">דוחות וניתוחים</div>
              </div>
            </Link>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-3xl p-8 border-2 border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">מערכת פעילה ומוכנה לעבודה</h3>
              <p className="text-gray-600">כל המערכות עובדות כראוי • עודכן לאחרונה: עכשיו</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-700 font-semibold">מחובר</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
