'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import Link from 'next/link'
import {
  FileText,
  Search,
  Download,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Receipt,
  CreditCard,
  FileCheck
} from 'lucide-react'

const DOCUMENT_TYPES = {
  invoice: { label: 'חשבונית מס', icon: FileText, color: 'blue' },
  invoice_receipt: { label: 'חשבונית מס קבלה', icon: FileCheck, color: 'green' },
  receipt: { label: 'קבלה', icon: Receipt, color: 'purple' },
  credit: { label: 'חשבונית זיכוי', icon: CreditCard, color: 'red' },
  quote: { label: 'הצעת מחיר', icon: FileText, color: 'yellow' },
  delivery_note: { label: 'תעודת משלוח', icon: FileText, color: 'indigo' },
  return: { label: 'החזרה', icon: FileText, color: 'orange' },
  purchase: { label: 'חשבונית קניה', icon: FileText, color: 'cyan' }
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchDocuments()
  }, [filter])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()

      if (filter !== 'all') {
        if (['draft', 'sent', 'paid', 'cancelled'].includes(filter)) {
          params.append('status', filter)
        } else if (['unpaid', 'partially_paid'].includes(filter)) {
          params.append('payment_status', filter)
        } else {
          // Filter by document type
          params.append('invoice_type', filter)
        }
      }

      const response = await fetch(`/api/invoices?${params}`)
      const data = await response.json()

      if (data.success) {
        setDocuments(data.invoices)
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (document) => {
    const statusMap = {
      draft: { label: 'טיוטה', color: 'bg-gray-500' },
      pending: { label: 'ממתין', color: 'bg-yellow-500' },
      sent: { label: 'נשלח', color: 'bg-blue-500' },
      paid: { label: 'שולם', color: 'bg-green-500' },
      cancelled: { label: 'בוטל', color: 'bg-red-500' },
    }

    const status = statusMap[document.status] || statusMap.draft
    return (
      <span className={`${status.color} text-white px-3 py-1 rounded-full text-xs font-semibold`}>
        {status.label}
      </span>
    )
  }

  const getPaymentBadge = (document) => {
    if (document.payment_status === 'paid') {
      return <CheckCircle size={20} className="text-green-500" />
    }
    if (document.payment_status === 'partially_paid') {
      return <Clock size={20} className="text-yellow-500" />
    }
    if (document.due_date && new Date(document.due_date) < new Date()) {
      return <AlertTriangle size={20} className="text-red-500" />
    }
    return <XCircle size={20} className="text-gray-400" />
  }

  const getSyncStatus = (document) => {
    if (document.sync_status === 'synced') {
      return <CheckCircle size={16} className="text-green-500" title="מסונכרן" />
    }
    if (document.sync_status === 'failed') {
      return <XCircle size={16} className="text-red-500" title="כשל בסנכרון" />
    }
    return <Clock size={16} className="text-gray-400" title="ממתין לסנכרון" />
  }

  const getDocumentTypeInfo = (type) => {
    return DOCUMENT_TYPES[type] || { label: type, icon: FileText, color: 'gray' }
  }

  const filteredDocuments = documents.filter(document => {
    if (!searchTerm) return true

    const search = searchTerm.toLowerCase()
    return (
      document.invoice_number?.toLowerCase().includes(search) ||
      document.customers?.name?.toLowerCase().includes(search) ||
      document.orders?.order_number?.toLowerCase().includes(search)
    )
  })

  return (
    <Layout>
      <div className="min-h-screen p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <FileText size={32} />
                ניהול מסמכים
              </h1>
              <p className="text-gray-400 mt-1">
                ניהול חשבוניות, קבלות, זיכויים ומסמכים נוספים עם סנכרון ל-iCount
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-3 mb-4 flex-wrap">
            <div className="flex-1 relative min-w-[250px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="חיפוש לפי מספר, לקוח או הזמנה..."
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
              <option value="all">כל המסמכים</option>
              <optgroup label="סוג מסמך">
                <option value="invoice">חשבונית מס</option>
                <option value="invoice_receipt">חשבונית מס קבלה</option>
                <option value="receipt">קבלה</option>
                <option value="credit">חשבונית זיכוי</option>
                <option value="quote">הצעת מחיר</option>
                <option value="delivery_note">תעודת משלוח</option>
                <option value="return">החזרה</option>
                <option value="purchase">חשבונית קניה</option>
              </optgroup>
              <optgroup label="סטטוס">
                <option value="draft">טיוטות</option>
                <option value="sent">נשלחו</option>
                <option value="paid">שולמו</option>
                <option value="cancelled">בוטלו</option>
              </optgroup>
              <optgroup label="תשלום">
                <option value="unpaid">ממתינים לתשלום</option>
                <option value="partially_paid">שולם חלקית</option>
              </optgroup>
            </select>
          </div>
        </div>

        {/* Documents Table */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">
            טוען מסמכים...
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            לא נמצאו מסמכים
          </div>
        ) : (
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="text-right px-6 py-4 text-gray-300 font-semibold">מספר</th>
                  <th className="text-right px-6 py-4 text-gray-300 font-semibold">לקוח</th>
                  <th className="text-right px-6 py-4 text-gray-300 font-semibold">סוג מסמך</th>
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
                {filteredDocuments.map((document) => {
                  const typeInfo = getDocumentTypeInfo(document.invoice_type)
                  const Icon = typeInfo.icon

                  return (
                    <tr
                      key={document.id}
                      className="hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="px-6 py-4 text-white font-mono">
                        {document.invoice_number || `#${document.id}`}
                      </td>
                      <td className="px-6 py-4 text-white">
                        {(() => {
                          // Try to get customer name from multiple sources
                          if (document.customers?.name) return document.customers.name
                          
                          // Try to parse from internal_notes (for iCount synced docs)
                          try {
                            if (document.internal_notes) {
                              const notes = JSON.parse(document.internal_notes)
                              if (notes.client_name) return notes.client_name
                            }
                          } catch (e) {
                            // If parsing fails, continue
                          }
                          
                          return 'לקוח iCount'
                        })()}
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        <div className="flex items-center gap-2">
                          <Icon size={16} className={`text-${typeInfo.color}-400`} />
                          {typeInfo.label}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        {new Date(document.issue_date).toLocaleDateString('he-IL')}
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        {document.due_date
                          ? new Date(document.due_date).toLocaleDateString('he-IL')
                          : '-'}
                      </td>
                      <td className="px-6 py-4 text-white font-semibold">
                        ₪{parseFloat(document.total_amount).toLocaleString('he-IL')}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(document)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {getPaymentBadge(document)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {getSyncStatus(document)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Link href={`/documents/${document.id}`}>
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
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  )
}