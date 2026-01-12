'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Calendar, TrendingUp, DollarSign, Package, Users } from 'lucide-react'
import Layout from '@/components/Layout'

export default function Reports() {
  const [reportType, setReportType] = useState('daily') // daily, monthly, yearly, custom
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    completedOrders: 0,
    newCustomers: 0
  })
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchReportData()
  }, [reportType, selectedDate, selectedMonth, selectedYear])

  const fetchReportData = async () => {
    setLoading(true)
    try {
      let startDate, endDate

      // חישוב טווח תאריכים לפי סוג הדוח
      if (reportType === 'daily') {
        startDate = `${selectedDate}T00:00:00`
        endDate = `${selectedDate}T23:59:59`
      } else if (reportType === 'monthly') {
        const year = selectedMonth.split('-')[0]
        const month = selectedMonth.split('-')[1]
        const lastDay = new Date(year, month, 0).getDate()
        startDate = `${selectedMonth}-01T00:00:00`
        endDate = `${selectedMonth}-${lastDay}T23:59:59`
      } else if (reportType === 'yearly') {
        startDate = `${selectedYear}-01-01T00:00:00`
        endDate = `${selectedYear}-12-31T23:59:59`
      }

      // שליפת הזמנות
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false })

      if (ordersError) throw ordersError

      // שליפת לקוחות חדשים
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('id')
        .gte('created_at', startDate)
        .lte('created_at', endDate)

      if (customersError) throw customersError

      // חישוב סטטיסטיקות
      const totalRevenue = ordersData.reduce((sum, order) => sum + parseFloat(order.total_with_vat), 0)
      const completedOrders = ordersData.filter(order => order.status === 'completed').length

      setStats({
        totalOrders: ordersData.length,
        totalRevenue,
        completedOrders,
        newCustomers: customersData.length
      })

      setOrders(ordersData)
    } catch (error) {
      console.error('שגיאה בטעינת דוח:', error)
    } finally {
      setLoading(false)
    }
  }

  const reportTypes = [
    { value: 'daily', label: 'דוח יומי', icon: Calendar },
    { value: 'monthly', label: 'דוח חודשי', icon: TrendingUp },
    { value: 'yearly', label: 'דוח שנתי', icon: Package }
  ]

  return (
    <Layout>
      <div className="p-8">
        <div>

        <div className="card mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <span>📊</span>
            דוחות
          </h1>

          {/* בחירת סוג דוח */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {reportTypes.map((type) => {
              const Icon = type.icon
              return (
                <button
                  key={type.value}
                  onClick={() => setReportType(type.value)}
                  className={`p-4 rounded-xl border-2 transition-all flex items-center justify-center gap-3 font-bold ${
                    reportType === type.value
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'
                  }`}
                >
                  <Icon size={24} />
                  {type.label}
                </button>
              )
            })}
          </div>

          {/* בחירת תאריך/תקופה */}
          <div className="mb-6">
            {reportType === 'daily' && (
              <div>
                <label className="block text-gray-700 font-bold mb-2">בחר תאריך</label>
                <input
                  type="date"
                  className="input-field max-w-md"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
            )}
            {reportType === 'monthly' && (
              <div>
                <label className="block text-gray-700 font-bold mb-2">בחר חודש</label>
                <input
                  type="month"
                  className="input-field max-w-md"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                />
              </div>
            )}
            {reportType === 'yearly' && (
              <div>
                <label className="block text-gray-700 font-bold mb-2">בחר שנה</label>
                <select
                  className="input-field max-w-md"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                >
                  {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">טוען נתונים...</p>
            </div>
          ) : (
            <>
              {/* כרטיסי סטטיסטיקה */}
              <div className="grid grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border-2 border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <Package className="text-blue-600" size={32} />
                  </div>
                  <p className="text-4xl font-extrabold text-blue-700 mb-1">{stats.totalOrders}</p>
                  <p className="text-gray-700 font-bold">סה"כ הזמנות</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border-2 border-green-200">
                  <div className="flex items-center justify-between mb-3">
                    <DollarSign className="text-green-600" size={32} />
                  </div>
                  <p className="text-4xl font-extrabold text-green-700 mb-1">₪{stats.totalRevenue.toFixed(0)}</p>
                  <p className="text-gray-700 font-bold">הכנסות</p>
                </div>

                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl p-6 border-2 border-indigo-200">
                  <div className="flex items-center justify-between mb-3">
                    <TrendingUp className="text-indigo-600" size={32} />
                  </div>
                  <p className="text-4xl font-extrabold text-indigo-700 mb-1">{stats.completedOrders}</p>
                  <p className="text-gray-700 font-bold">הזמנות שהושלמו</p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border-2 border-orange-200">
                  <div className="flex items-center justify-between mb-3">
                    <Users className="text-orange-600" size={32} />
                  </div>
                  <p className="text-4xl font-extrabold text-orange-700 mb-1">{stats.newCustomers}</p>
                  <p className="text-gray-700 font-bold">לקוחות חדשים</p>
                </div>
              </div>

              {/* טבלת הזמנות */}
              {orders.length > 0 ? (
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">הזמנות בתקופה</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-3 text-right font-bold">מספר הזמנה</th>
                          <th className="px-4 py-3 text-right font-bold">לקוח</th>
                          <th className="px-4 py-3 text-right font-bold">סכום</th>
                          <th className="px-4 py-3 text-right font-bold">סטטוס</th>
                          <th className="px-4 py-3 text-right font-bold">תאריך</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => (
                          <tr key={order.id} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-3 font-bold text-blue-600">#{order.order_number}</td>
                            <td className="px-4 py-3">{order.customer_name}</td>
                            <td className="px-4 py-3 font-bold">₪{order.total_with_vat.toFixed(2)}</td>
                            <td className="px-4 py-3">
                              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                order.status === 'completed' ? 'bg-green-100 text-green-700' :
                                order.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {order.status === 'completed' ? 'הושלמה' :
                                 order.status === 'in_progress' ? 'בתהליך' : 'חדשה'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {new Date(order.created_at).toLocaleDateString('he-IL')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">אין הזמנות בתקופה זו</p>
                </div>
              )}
            </>
          )}
        </div>
        </div>
      </div>
    </Layout>
  )
}
