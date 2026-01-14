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
import { getICountClient } from '@/lib/icount/client'

export default function ICountDocumentsPage() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState(null)

  useEffect(() => {
    checkConnection()
    fetchDocuments()
  }, [])

  const checkConnection = async () => {
    try {
      const client = getICountClient()
      const result = await client.testConnection()
      setConnectionStatus(result)
    } catch (error) {
      setConnectionStatus({
        success: false,
        message: error.message,
      })
    }
  }

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      setError(null)

      const client = getICountClient()

      // בדוק אם יש חיבור
      if (!client.hasCredentials()) {
        setError('לא הוגדרו פרטי התחברות ל-iCount. אנא הגדר בעמוד ההגדרות.')
        setLoading(false)
        return
      }

      // שלוף את כל המסמכים
      const response = await client.getDocuments(null, {
        limit: 100,
        offset: 0
      })

      console.log('iCount response:', response)

      if (response.data) {
        setDocuments(response.data)
      } else if (Array.isArray(response)) {
        setDocuments(response)
      } else {
        setDocuments([])
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
      setError(error.message || 'שגיאה בטעינת מסמכים מ-iCount')
      setDocuments([])
    } finally {
      setLoading(false)
      setRefreshing(false)
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
      doc.doc_num?.toString().includes(search) ||
      doc.client_name?.toLowerCase().includes(search) ||
      doc.description?.toLowerCase().includes(search)
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

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'מרענן...' : 'רענן'}
            </button>
          </div>

          {/* Connection Status */}
          {connectionStatus && (
            <div
              className={`flex items-center gap-3 p-4 rounded-lg mb-4 ${
                connectionStatus.success
                  ? 'bg-green-900/20 border border-green-700 text-green-200'
                  : 'bg-red-900/20 border border-red-700 text-red-200'
              }`}
            >
              {connectionStatus.success ? (
                <CheckCircle size={24} className="flex-shrink-0" />
              ) : (
                <XCircle size={24} className="flex-shrink-0" />
              )}
              <div>
                <p className="font-semibold">
                  {connectionStatus.success ? 'מחובר ל-iCount' : 'אין חיבור ל-iCount'}
                </p>
                <p className="text-sm opacity-90">{connectionStatus.message}</p>
                {!connectionStatus.success && (
                  <Link href="/settings/icount" className="text-sm underline hover:opacity-80 mt-1 inline-block">
                    עבור להגדרות
                  </Link>
                )}
              </div>
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
              {documents.filter(d => d.type === 'invoice' || d.type === 'invoice_receipt').length}
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-4 text-white">
            <div className="text-sm opacity-90 mb-1">קבלות</div>
            <div className="text-3xl font-bold">
              {documents.filter(d => d.type === 'receipt').length}
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl p-4 text-white">
            <div className="text-sm opacity-90 mb-1">זיכויים</div>
            <div className="text-3xl font-bold">
              {documents.filter(d => d.type === 'credit').length}
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
                    key={doc.docid || doc.doc_id}
                    className="hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="px-6 py-4 text-white font-mono font-semibold">
                      {doc.doc_num || doc.docnum || '-'}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs">
                        {getDocumentTypeName(doc.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white">
                      {doc.client_name || 'לא צוין'}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {doc.date ? new Date(doc.date).toLocaleDateString('he-IL') : '-'}
                    </td>
                    <td className="px-6 py-4 text-white font-semibold">
                      {doc.amount || doc.total ? (
                        `₪${parseFloat(doc.amount || doc.total).toLocaleString('he-IL')}`
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-300 max-w-xs truncate">
                      {doc.description || doc.remarks || '-'}
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
