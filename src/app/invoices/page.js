'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import Link from 'next/link'
import {
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Cloud
} from 'lucide-react'

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    fetchInvoices()
  }, [filter])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()

      if (filter !== 'all') {
        if (['draft', 'sent', 'paid', 'cancelled'].includes(filter)) {
          params.append('status', filter)
        } else if (['unpaid', 'partially_paid'].includes(filter)) {
          params.append('payment_status', filter)
        }
      }

      const response = await fetch(`/api/invoices?${params}`)
      const data = await response.json()

      if (data.success) {
        setInvoices(data.invoices)
      }
    } catch (error) {
      console.error('Error fetching invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const syncInvoices = async () => {
    try {
      setSyncing(true)
      const response = await fetch('/api/invoices/sync')
      const data = await response.json()

      if (data.success) {
        await fetchInvoices()
      }
    } catch (error) {
      console.error('Error syncing:', error)
    } finally {
      setSyncing(false)
    }
  }

  const getStatusBadge = (invoice) => {
    const statusMap = {
      draft: { label: 'טיוטה', color: 'bg-gray-500' },
      pending: { label: 'ממתין', color: 'bg-yellow-500' },
      sent: { label: 'נשלח', color: 'bg-blue-500' },
      paid: { label: 'שולם', color: 'bg-green-500' },
      cancelled: { label: 'בוטל', color: 'bg-red-500' },
    }

    const status = statusMap[invoice.status] || statusMap.draft
    return (
      <span className={`${status.color} text-white px-3 py-1 rounded-full text-xs font-semibold`}>
        {status.label}
      </span>
    )
  }

  const getPaymentBadge = (invoice) => {
    if (invoice.payment_status === 'paid') {
      return <CheckCircle size={20} className="text-green-500" />
    }
    if (invoice.payment_status === 'partially_paid') {
      return <Clock size={20} className="text-yellow-500" />
    }
    if (invoice.due_date && new Date(invoice.due_date) < new Date()) {
      return <AlertTriangle size={20} className="text-red-500" />
    }
    return <XCircle size={20} className="text-gray-400" />
  }

  const getSyncStatus = (invoice) => {
    if (invoice.sync_status === 'synced') {
      return <CheckCircle size={16} className="text-green-500" title="מסונכרן" />
    }
    if (invoice.sync_status === 'failed') {
      return <XCircle size={16} className="text-red-500" title="כשל בסנכרון" />
    }
    return <Clock size={16} className="text-gray-400" title="ממתין לסנכרון" />
  }

  const filteredInvoices = invoices.filter(invoice => {
    if (!searchTerm) return true

    const search = searchTerm.toLowerCase()
    return (
      invoice.invoice_number?.toLowerCase().includes(search) ||
      invoice.customers?.name?.toLowerCase().includes(search) ||
      invoice.orders?.order_number?.toLowerCase().includes(search)
    )
  })

  return (
    <Layout>
      <div className="min-h-screen p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <FileText size={32} />
                ניהול חשבוניות
              </h1>
              <p className="text-gray-400 mt-1">
                הפקה וניהול חשבוניות עם סנכרון ל-iCount
              </p>
            </div>

            <div className="flex gap-3">
              <Link href="/invoices/icount">
                <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors">
                  <Cloud size={18} />
                  מסמכים מ-iCount
                </button>
              </Link>

              <button
                onClick={syncInvoices}
                disabled={syncing}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
                {syncing ? 'מסנכרן...' : 'סנכרון'}
              </button>

              <Link href="/invoices/new">
                <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                  <Plus size={18} />
                  חשבונית חדשה
                </button>
              </Link>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="חיפוש לפי מספר חשבונית, לקוח או הזמנה..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-800 text-white rounded-lg px-4 py-2 pr-10 border border-gray-700 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-gray-800 text-white rounded-lg px-4 py-2 border border-gray-700 focus:border-blue-500 focus:outline-none"
            >
              <option value="all">הכל</option>
              <option value="draft">טיוטות</option>
              <option value="sent">נשלחו</option>
              <option value="unpaid">ממתינות לתשלום</option>
              <option value="partially_paid">שולם חלקית</option>
              <option value="paid">שולמו</option>
              <option value="cancelled">בוטלו</option>
            </select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-4 text-white">
            <div className="text-sm opacity-90 mb-1">סה"כ חשבוניות</div>
            <div className="text-3xl font-bold">{invoices.length}</div>
          </div>

          <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-xl p-4 text-white">
            <div className="text-sm opacity-90 mb-1">ממתינות לתשלום</div>
            <div className="text-3xl font-bold">
              {invoices.filter(i => i.payment_status === 'unpaid').length}
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-4 text-white">
            <div className="text-sm opacity-90 mb-1">שולמו</div>
            <div className="text-3xl font-bold">
              {invoices.filter(i => i.payment_status === 'paid').length}
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-4 text-white">
            <div className="text-sm opacity-90 mb-1">סכום כולל</div>
            <div className="text-2xl font-bold">
              ₪{invoices.reduce((sum, i) => sum + parseFloat(i.total_amount || 0), 0).toLocaleString('he-IL')}
            </div>
          </div>
        </div>

        {/* Invoices Table */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">
            טוען חשבוניות...
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            לא נמצאו חשבוניות
          </div>
        ) : (
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="text-right px-6 py-4 text-gray-300 font-semibold">מספר</th>
                  <th className="text-right px-6 py-4 text-gray-300 font-semibold">לקוח</th>
                  <th className="text-right px-6 py-4 text-gray-300 font-semibold">סוג</th>
                  <th className="text-right px-6 py-4 text-gray-300 font-semibold">תאריך הנפקה</th>
                  <th className="text-right px-6 py-4 text-gray-300 font-semibold">תאריך תשלום</th>
                  <th className="text-right px-6 py-4 text-gray-300 font-semibold">סכום</th>
                  <th className="text-right px-6 py-4 text-gray-300 font-semibold">סטטוס</th>
                  <th className="text-center px-6 py-4 text-gray-300 font-semibold">תשלום</th>
                  <th className="text-center px-6 py-4 text-gray-300 font-semibold">סנכרון</th>
                  <th className="text-center px-6 py-4 text-gray-300 font-semibold">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredInvoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="px-6 py-4 text-white font-mono">
                      {invoice.invoice_number || `#${invoice.id}`}
                    </td>
                    <td className="px-6 py-4 text-white">
                      {invoice.customers?.name || 'ללא שם'}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {invoice.invoice_type === 'invoice' && 'חשבונית'}
                      {invoice.invoice_type === 'invoice_receipt' && 'חשבונית מס קבלה'}
                      {invoice.invoice_type === 'receipt' && 'קבלה'}
                      {invoice.invoice_type === 'credit' && 'זיכוי'}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {new Date(invoice.issue_date).toLocaleDateString('he-IL')}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {invoice.due_date
                        ? new Date(invoice.due_date).toLocaleDateString('he-IL')
                        : '-'}
                    </td>
                    <td className="px-6 py-4 text-white font-semibold">
                      ₪{parseFloat(invoice.total_amount).toLocaleString('he-IL')}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(invoice)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getPaymentBadge(invoice)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getSyncStatus(invoice)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <Link href={`/invoices/${invoice.id}`}>
                          <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-blue-400">
                            <FileText size={18} />
                          </button>
                        </Link>
                        <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-green-400">
                          <Download size={18} />
                        </button>
                        <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-purple-400">
                          <Send size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  )
}
