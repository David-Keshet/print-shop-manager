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
  FileCheck,
  Plus,
  Filter,
  ArrowUpDown,
  TrendingUp,
  DollarSign,
  Calendar
} from 'lucide-react'

const DOCUMENT_TYPES = {
  invoice: { label: 'חשבונית מס', icon: FileText, color: 'text-blue-400', bgColor: 'bg-blue-400/10' },
  invoice_receipt: { label: 'חשבונית מס קבלה', icon: FileCheck, color: 'text-green-400', bgColor: 'bg-green-400/10' },
  receipt: { label: 'קבלה', icon: Receipt, color: 'text-purple-400', bgColor: 'bg-purple-400/10' },
  credit: { label: 'חשבונית זיכוי', icon: CreditCard, color: 'text-red-400', bgColor: 'bg-red-400/10' },
  quote: { label: 'הצעת מחיר', icon: FileText, color: 'text-yellow-400', bgColor: 'bg-yellow-400/10' },
  delivery_note: { label: 'תעודת משלוח', icon: FileText, color: 'text-indigo-400', bgColor: 'bg-indigo-400/10' },
  return: { label: 'החזרה', icon: FileText, color: 'text-orange-400', bgColor: 'bg-orange-400/10' },
  purchase: { label: 'חשבונית קניה', icon: FileText, color: 'text-cyan-400', bgColor: 'bg-cyan-400/10' }
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    unpaid: 0,
    unpaidAmount: 0,
    totalAmount: 0
  })

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
          params.append('invoice_type', filter)
        }
      }

      const response = await fetch(`/api/invoices?${params}`)
      const data = await response.json()

      if (data.success) {
        setDocuments(data.invoices)
        calculateStats(data.invoices)
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (docs) => {
    const s = docs.reduce((acc, doc) => {
      const total = parseFloat(doc.total_amount || 0)
      const paid = parseFloat(doc.paid_amount || 0)

      acc.total++
      acc.totalAmount += total

      if (doc.status === 'paid' || doc.payment_status === 'paid') {
        acc.paid++
      } else {
        acc.unpaid++
        acc.unpaidAmount += (total - paid)
      }
      return acc
    }, { total: 0, paid: 0, unpaid: 0, unpaidAmount: 0, totalAmount: 0 })

    setStats(s)
  }

  const getStatusBadge = (document) => {
    const statusMap = {
      draft: { label: 'טיוטה', color: 'bg-gray-500/20 text-gray-400 border-gray-500/50' },
      pending: { label: 'ממתין', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' },
      sent: { label: 'נשלח', color: 'bg-blue-500/20 text-blue-400 border-blue-500/50' },
      paid: { label: 'שולם', color: 'bg-green-500/20 text-green-400 border-green-500/50' },
      cancelled: { label: 'בוטל', color: 'bg-red-500/20 text-red-400 border-red-500/50' },
    }

    const status = statusMap[document.status] || statusMap.draft
    return (
      <span className={`${status.color} px-3 py-1 rounded-full text-xs font-semibold border`}>
        {status.label}
      </span>
    )
  }

  const getPaymentStatusIcon = (document) => {
    if (document.payment_status === 'paid') {
      return <div className="flex items-center gap-1 text-green-400 text-xs font-medium bg-green-400/10 px-2 py-1 rounded"><CheckCircle size={14} /> שולם</div>
    }
    if (document.payment_status === 'partially_paid') {
      return <div className="flex items-center gap-1 text-yellow-400 text-xs font-medium bg-yellow-400/10 px-2 py-1 rounded"><Clock size={14} /> חלקי</div>
    }
    if (document.due_date && new Date(document.due_date) < new Date()) {
      return <div className="flex items-center gap-1 text-red-400 text-xs font-medium bg-red-400/10 px-2 py-1 rounded"><AlertTriangle size={14} /> באיחור</div>
    }
    return <div className="flex items-center gap-1 text-gray-400 text-xs font-medium bg-gray-400/10 px-2 py-1 rounded"><XCircle size={14} /> לא שולם</div>
  }

  const getSyncIndicator = (document) => {
    if (document.sync_status === 'synced') {
      return <CheckCircle size={16} className="text-green-500" title="מסונכרן ל-iCount" />
    }
    if (document.sync_status === 'failed') {
      return <XCircle size={16} className="text-red-500" title="כשל בסנכרון" />
    }
    return <Clock size={16} className="text-gray-500" title="ממתין לסנכרון" />
  }

  const getDocumentTypeInfo = (type) => {
    return DOCUMENT_TYPES[type] || { label: type, icon: FileText, color: 'text-gray-400', bgColor: 'bg-gray-400/10' }
  }

  const filteredDocuments = documents.filter(document => {
    const matchesSearch = !searchTerm || (
      document.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      document.customers?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      document.orders?.order_number?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const matchesStatus = statusFilter === 'all' || document.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <Layout>
      <div className="min-h-screen p-6 bg-[#0f1117]">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center rotate-3 shadow-lg shadow-amber-500/20">
                <FileText className="text-white -rotate-3" size={28} />
              </div>
              ניהול מסמכים
            </h1>
            <p className="text-gray-400 mt-2 font-medium">מרכז השליטה בחשבוניות, קבלות ומסמכים עסקיים</p>
          </div>

          <div className="flex gap-3">
            <Link href="/orders">
              <button className="bg-gray-800 hover:bg-gray-700 text-white px-5 py-3 rounded-xl font-bold transition-all flex items-center gap-2 border border-gray-700">
                <Plus size={20} />
                מסמך חדש מהזמנה
              </button>
            </Link>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800/40 border border-gray-700/50 p-6 rounded-3xl backdrop-blur-xl hover:border-amber-500/30 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                <FileText size={24} />
              </div>
              <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded-lg">סה"כ</span>
            </div>
            <h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider">מסמכים פעילים</h3>
            <p className="text-3xl font-black text-white mt-1">{stats.total}</p>
          </div>

          <div className="bg-gray-800/40 border border-gray-700/50 p-6 rounded-3xl backdrop-blur-xl hover:border-green-500/30 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform">
                <CheckCircle size={24} />
              </div>
              <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-lg">שולם</span>
            </div>
            <h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider">סך הכל שולם</h3>
            <p className="text-3xl font-black text-white mt-1">₪{stats.totalAmount.toLocaleString()}</p>
          </div>

          <div className="bg-gray-800/40 border border-gray-700/50 p-6 rounded-3xl backdrop-blur-xl hover:border-rose-500/30 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform">
                <DollarSign size={24} />
              </div>
              <span className="text-xs font-bold text-rose-500 bg-rose-500/10 px-2 py-1 rounded-lg">חוב</span>
            </div>
            <h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider">יתרת חוב כוללת</h3>
            <p className="text-3xl font-black text-white mt-1">₪{stats.unpaidAmount.toLocaleString()}</p>
          </div>

          <div className="bg-gray-800/40 border border-gray-700/50 p-6 rounded-3xl backdrop-blur-xl hover:border-blue-500/30 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                <TrendingUp size={24} />
              </div>
              <span className="text-xs font-bold text-blue-500 bg-blue-500/10 px-2 py-1 rounded-lg">צמיחה</span>
            </div>
            <h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider">ממתינים לתשלום</h3>
            <p className="text-3xl font-black text-white mt-1">{stats.unpaid}</p>
          </div>
        </div>

        {/* Toolbar Section */}
        <div className="bg-gray-800/20 border border-gray-700/30 p-4 rounded-2xl mb-6 flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
            <input
              type="text"
              placeholder="חיפוש מהיר של מספר מסמך, שם לקוח או מספר הזמנה..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-900 shadow-inner text-white rounded-xl px-4 py-3 pr-12 border border-gray-700/50 focus:border-amber-500/50 focus:outline-none focus:ring-4 focus:ring-amber-500/5"
            />
          </div>

          <div className="flex gap-2 bg-gray-900 p-1.5 rounded-xl border border-gray-700/50">
            {['all', 'draft', 'sent', 'paid'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${statusFilter === s
                  ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
              >
                {s === 'all' ? 'הכל' : s === 'draft' ? 'טיוטה' : s === 'sent' ? 'נשלח' : 'שולם'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Filter size={18} className="text-gray-500" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-gray-900 text-white rounded-xl px-4 py-3 border border-gray-700/50 focus:border-amber-500/50 focus:outline-none font-bold text-sm"
            >
              <option value="all">כל הסוגים</option>
              {Object.entries(DOCUMENT_TYPES).map(([key, info]) => (
                <option key={key} value={key}>{info.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table Section */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 animate-pulse">
            <div className="w-16 h-16 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
            <p className="text-gray-400 mt-4 font-bold tracking-widest uppercase text-xs">מטעין מסמכים...</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="bg-gray-800/20 border border-dashed border-gray-700 rounded-3xl py-20 flex flex-col items-center">
            <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center text-gray-600 mb-4">
              <Search size={40} />
            </div>
            <p className="text-gray-400 text-lg font-bold">לא נמצאו מסמכים התואמים לחיפוש</p>
            <button onClick={() => { setSearchTerm(''); setStatusFilter('all'); setFilter('all'); }} className="mt-4 text-amber-500 font-bold hover:underline">אפס מסננים</button>
          </div>
        ) : (
          <div className="bg-gray-800/30 border border-gray-700/50 rounded-[2rem] overflow-hidden backdrop-blur-sm shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-separate border-spacing-0">
                <thead>
                  <tr className="bg-gray-900/50">
                    <th className="px-6 py-5 text-gray-400 font-bold text-sm uppercase border-b border-gray-700/50 tracking-wider">מספר</th>
                    <th className="px-6 py-5 text-gray-400 font-bold text-sm uppercase border-b border-gray-700/50 tracking-wider">לקוח</th>
                    <th className="px-6 py-5 text-gray-400 font-bold text-sm uppercase border-b border-gray-700/50 tracking-wider">סוג מסמך</th>
                    <th className="px-6 py-5 text-gray-400 font-bold text-sm uppercase border-b border-gray-700/50 tracking-wider">תאריך</th>
                    <th className="px-6 py-5 text-gray-400 font-bold text-sm uppercase border-b border-gray-700/50 tracking-wider text-left">סכום</th>
                    <th className="px-6 py-5 text-gray-400 font-bold text-sm uppercase border-b border-gray-700/50 tracking-wider text-center">סטטוס</th>
                    <th className="px-6 py-5 text-gray-400 font-bold text-sm uppercase border-b border-gray-700/50 tracking-wider text-center">תשלום</th>
                    <th className="px-6 py-5 text-gray-400 font-bold text-sm uppercase border-b border-gray-700/50 tracking-wider text-center">פעולות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/30">
                  {filteredDocuments.map((document) => {
                    const typeInfo = getDocumentTypeInfo(document.invoice_type)
                    const Icon = typeInfo.icon

                    return (
                      <tr
                        key={document.id}
                        className="group hover:bg-amber-500/[0.03] transition-colors cursor-default"
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-amber-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <span className="text-white font-mono font-bold tracking-tighter">
                              {document.invoice_number || `#${document.id}`}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col">
                            <span className="text-white font-bold text-base">
                              {(() => {
                                if (document.customers?.name) return document.customers.name
                                try {
                                  if (document.internal_notes) {
                                    const notes = JSON.parse(document.internal_notes)
                                    if (notes.client_name) return notes.client_name
                                  }
                                } catch (e) { }
                                return 'לקוח כללי'
                              })()}
                            </span>
                            {document.orders?.order_number && (
                              <span className="text-gray-500 text-xs mt-0.5">הזמנה #{document.orders.order_number}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl ${typeInfo.bgColor} ${typeInfo.color} font-bold text-xs ring-1 ring-inset ring-current/10`}>
                            <Icon size={14} />
                            {typeInfo.label}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col">
                            <span className="text-gray-300 text-sm font-medium">
                              {new Date(document.issue_date).toLocaleDateString('he-IL')}
                            </span>
                            {document.due_date && (
                              <span className="text-gray-500 text-[10px] mt-0.5 flex items-center gap-1 uppercase tracking-widest font-bold">
                                פירעון: {new Date(document.due_date).toLocaleDateString('he-IL')}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5 text-left">
                          <span className="text-2xl font-black text-white tracking-tighter">
                            <span className="text-sm font-bold text-gray-500 ml-1">₪</span>
                            {parseFloat(document.total_amount).toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-center">
                          {getStatusBadge(document)}
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex justify-center">
                            {getPaymentStatusIcon(document)}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center justify-center gap-2">
                            <Link href={`/documents/${document.id}`}>
                              <button className="p-2.5 bg-gray-800 hover:bg-amber-500 hover:text-white rounded-xl transition-all text-gray-400 group-hover:scale-110 shadow-lg shadow-black/10" title="פרטים מלאים">
                                <FileText size={18} />
                              </button>
                            </Link>
                            <button
                              onClick={() => {
                                const pdfUrl = `${window.location.origin}/documents/${document.id}/pdf`
                                const printWindow = window.open(pdfUrl, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes')
                                if (!printWindow) {
                                  alert('נא לאפשר חוסמי חלונות קופצים')
                                  return
                                }
                                printWindow.focus()
                              }}
                              className="p-2.5 bg-gray-800 hover:bg-green-500 hover:text-white rounded-xl transition-all text-gray-400 group-hover:scale-110 shadow-lg shadow-black/10"
                              title="הדפס/הצג PDF"
                            >
                              <Download size={18} />
                            </button>
                            {getSyncIndicator(document)}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
