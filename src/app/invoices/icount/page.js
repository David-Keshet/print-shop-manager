'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import Link from 'next/link'
import {
  FileText,
  RefreshCw,
  Search,
  Download,
  Eye,
  Cloud,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function ICountDocumentsPage() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState(null)
  const [syncMessage, setSyncMessage] = useState(null)

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      setError(null)

      // קרא חשבוניות מ-Supabase (לא ישירות מ-iCount!)
      const { data, error: supabaseError } = await supabase
        .from('invoices')
        .select(`
          *,
          customer:customers(name, phone),
          order:orders(order_number)
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      if (supabaseError) throw supabaseError

      setDocuments(data || [])
    } catch (error) {
      console.error('Error fetching documents:', error)
      setError(error.message || 'שגיאה בטעינת חשבוניות')
      setDocuments([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
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
        fetchDocuments() // Refresh after sync
      } else {
        setError(data.message || 'שגיאה בסנכרון')
      }
    } catch (err) {
      console.error('Sync error:', err)
      setError('שגיאה בסנכרון עם iCount')
    } finally {
      setSyncing(false)
      setTimeout(() => setSyncMessage(null), 3000)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchDocuments()
  }

  const getDocumentTypeName = (type) => {
    const typeMap = {
      invoice: 'חשבונית',
      invoice_receipt: 'חשבונית מס קבלה',
      receipt: 'קבלה',
      credit: 'חשבונית זיכוי',
      quote: 'הצעת מחיר',
      delivery_note: 'תעודת משלוח',
      purchase: 'חשבונית קניה',
    }
    return typeMap[type] || type
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      draft: { label: 'טיוטה', color: 'bg-gray-500' },
      sent: { label: 'נשלח', color: 'bg-blue-500' },
      paid: { label: 'שולם', color: 'bg-green-500' },
      cancelled: { label: 'בוטל', color: 'bg-red-500' },
    }

    const statusInfo = statusMap[status] || { label: status, color: 'bg-gray-500' }
    return (
      <span className={`${statusInfo.color} text-white px-3 py-1 rounded-full text-xs font-semibold`}>
        {statusInfo.label}
      </span>
    )
  }

  const filteredDocuments = documents.filter((doc) => {
    if (!searchTerm) return true

    const search = searchTerm.toLowerCase()
    return (
      doc.invoice_number?.toString().includes(search) ||
      doc.customer?.name?.toLowerCase().includes(search) ||
      doc.notes?.toLowerCase().includes(search)
    )
  })

  return (
    <Layout>
      <div className="min-h-screen p-6">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/invoices"
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-4"
          >
            <ArrowRight size={20} />
            חזרה לחשבוניות
          </Link>

          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Cloud size={32} />
                מסמכים מ-iCount
              </h1>
              <p className="text-gray-400 mt-1">
                צפייה בכל החשבוניות והמסמכים שלך מ-iCount
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSyncFromICount}
                disabled={syncing}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                <Cloud size={18} className={syncing ? 'animate-pulse' : ''} />
                {syncing ? 'מסנכרן...' : 'סנכרן מ-iCount'}
              </button>

              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                {refreshing ? 'מרענן...' : 'רענן'}
              </button>
            </div>
          </div>

          {/* Success Message */}
          {syncMessage && (
            <div className="flex items-center gap-2 text-green-400 bg-green-900/20 px-4 py-3 rounded-lg mb-4">
              <CheckCircle size={20} />
              {syncMessage}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 text-red-400 bg-red-900/20 px-4 py-3 rounded-lg mb-4">
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          {/* Search */}
          <div className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="חיפוש לפי מספר מסמך, לקוח או תיאור..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-800 text-white rounded-lg px-4 py-2 pr-10 border border-gray-700 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 mb-6 flex items-center gap-3 text-red-200">
            <AlertCircle size={24} className="flex-shrink-0" />
            <div>
              <p className="font-semibold">שגיאה</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-4 text-white">
            <div className="text-sm opacity-90 mb-1">סה"כ מסמכים</div>
            <div className="text-3xl font-bold">{documents.length}</div>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-4 text-white">
            <div className="text-sm opacity-90 mb-1">חשבוניות</div>
            <div className="text-3xl font-bold">
              {documents.filter(d => d.invoice_type === 'invoice' || d.invoice_type === 'invoice_receipt').length}
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-4 text-white">
            <div className="text-sm opacity-90 mb-1">קבלות</div>
            <div className="text-3xl font-bold">
              {documents.filter(d => d.invoice_type === 'receipt').length}
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl p-4 text-white">
            <div className="text-sm opacity-90 mb-1">זיכויים</div>
            <div className="text-3xl font-bold">
              {documents.filter(d => d.invoice_type === 'credit').length}
            </div>
          </div>
        </div>

        {/* Documents Table */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">
            <RefreshCw size={48} className="animate-spin mx-auto mb-4" />
            טוען מסמכים מ-iCount...
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <Cloud size={64} className="mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400 text-lg mb-2">
              {documents.length === 0 ? 'אין מסמכים זמינים' : 'לא נמצאו מסמכים'}
            </p>
            {documents.length === 0 && (
              <p className="text-gray-500 text-sm">
                המסמכים שתיצור יופיעו כאן
              </p>
            )}
          </div>
        ) : (
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="text-right px-6 py-4 text-gray-300 font-semibold">מספר מסמך</th>
                  <th className="text-right px-6 py-4 text-gray-300 font-semibold">סוג</th>
                  <th className="text-right px-6 py-4 text-gray-300 font-semibold">לקוח</th>
                  <th className="text-right px-6 py-4 text-gray-300 font-semibold">תאריך</th>
                  <th className="text-right px-6 py-4 text-gray-300 font-semibold">סכום</th>
                  <th className="text-right px-6 py-4 text-gray-300 font-semibold">תיאור</th>
                  <th className="text-center px-6 py-4 text-gray-300 font-semibold">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredDocuments.map((doc) => (
                  <tr
                    key={doc.id}
                    className="hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="px-6 py-4 text-white font-mono font-semibold">
                      {doc.invoice_number || '-'}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs">
                        {getDocumentTypeName(doc.invoice_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white">
                      {doc.customer?.name || 'לא צוין'}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {doc.issue_date ? new Date(doc.issue_date).toLocaleDateString('he-IL') : '-'}
                    </td>
                    <td className="px-6 py-4 text-white font-semibold">
                      {doc.total_amount ? (
                        `₪${parseFloat(doc.total_amount).toLocaleString('he-IL')}`
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-300 max-w-xs truncate">
                      {doc.notes || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-blue-400"
                          title="צפה"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-green-400"
                          title="הורד PDF"
                        >
                          <Download size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Debug Info */}
        {documents.length > 0 && (
          <div className="mt-4 text-center text-xs text-gray-500">
            מציג {filteredDocuments.length} מתוך {documents.length} מסמכים
          </div>
        )}
      </div>
    </Layout>
  )
}
