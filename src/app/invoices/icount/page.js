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
  ArrowRight,
  Filter,
  TrendingUp,
  TrendingDown,
  Calendar,
  Layers,
  ExternalLink
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export default function ICountDocumentsPage() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState(null)
  const [syncMessage, setSyncMessage] = useState(null)

  useEffect(() => {
    fetchDocuments()

    // רענון אוטומטי של התצוגה כל 30 שניות
    const interval = setInterval(fetchDocuments, 30000)

    return () => clearInterval(interval)
  }, [])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: supabaseError } = await supabase
        .from('invoices')
        .select(`
          *,
          customer:customers(name, phone),
          order:orders(order_number)
        `)
        .order('issue_date', { ascending: false })
        .limit(100)

      if (supabaseError) throw supabaseError

      setDocuments(data || [])
    } catch (error) {
      console.error('Error fetching documents:', error)
      setError(error.message || 'שגיאה בטעינת חשבוניות')
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
        body: JSON.stringify({ type: 'invoices' })
      })

      const data = await response.json()

      if (data.success) {
        setSyncMessage('✅ הסנכרון הושלם! כל המסמכים העדכניים כאן.')
        fetchDocuments()
      } else {
        setError(data.message || 'שגיאה בסנכרון')
      }
    } catch (err) {
      console.error('Sync error:', err)
      setError('שגיאה בתקשורת עם השרת')
    } finally {
      setSyncing(false)
      setTimeout(() => setSyncMessage(null), 5000)
    }
  }

  const getDocumentTypeInfo = (type) => {
    const types = {
      invoice: { label: 'חשבונית מס', color: 'text-blue-400', bg: 'bg-blue-500/10' },
      invoice_receipt: { label: 'חשבונית מס קבלה', color: 'text-green-400', bg: 'bg-green-500/10' },
      receipt: { label: 'קבלה', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
      credit: { label: 'חשבונית זיכוי', color: 'text-red-400', bg: 'bg-red-500/10' },
      quote: { label: 'הצעת מחיר', color: 'text-purple-400', bg: 'bg-purple-500/10' },
      delivery_note: { label: 'תעודת משלוח', color: 'text-amber-400', bg: 'bg-amber-500/10' },
    }
    return types[type] || { label: type, color: 'text-gray-400', bg: 'bg-gray-500/10' }
  }

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = !searchTerm || (
      doc.invoice_number?.toString().includes(searchTerm) ||
      doc.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const matchesFilter = activeFilter === 'all' || doc.invoice_type === activeFilter

    return matchesSearch && matchesFilter
  })

  // Stats calculation
  const totalAmount = filteredDocuments.reduce((sum, doc) => sum + parseFloat(doc.total_amount || 0), 0)
  const invoicesCount = filteredDocuments.filter(d => d.invoice_type?.includes('invoice')).length

  return (
    <Layout>
      <div className="min-h-screen bg-[#0f172a] text-white p-4 md:p-8">
        <div className="max-w-7xl mx-auto">

          {/* Minimalist Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
              מסמכי iCount
            </h1>
            <div className="flex gap-2">
              <button
                onClick={fetchDocuments}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-bold border border-white/10 transition-all flex items-center gap-2"
              >
                <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                רענן
              </button>
            </div>
          </div>

          {/* Minimal Search */}
          <div className="relative mb-6">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input
              type="text"
              placeholder="חיפוש מהיר..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pr-10 pl-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Main Content Table (Matching iCount Layout) */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <RefreshCw className="animate-spin text-blue-500" size={48} />
              <p className="text-blue-200 font-bold">מתחבר ל-iCount וטוען נתונים...</p>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-24 bg-white/5 rounded-3xl border border-white/10 shadow-2xl">
              <Layers className="text-gray-600 mx-auto mb-4" size={64} />
              <h3 className="text-2xl font-bold text-gray-300">לא נמצאו מסמכים</h3>
              <p className="text-gray-500 mt-2">נסה לבצע סנכרון או לשנות את החיפוש</p>
            </div>
          ) : (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10">
                      <th className="px-4 py-5 font-bold text-gray-400 text-xs w-10 text-center">
                        <input type="checkbox" className="rounded border-white/20 bg-white/5" />
                      </th>
                      <th className="px-4 py-5 font-bold text-gray-400 text-xs">לקוח / ספק</th>
                      <th className="px-4 py-5 font-bold text-gray-400 text-xs">מספר מסמך</th>
                      <th className="px-4 py-5 font-bold text-gray-400 text-xs">תאריך</th>
                      <th className="px-4 py-5 font-bold text-gray-400 text-xs">סוג הכנסה</th>
                      <th className="px-4 py-5 font-bold text-gray-400 text-xs">סה"כ לפני מע"מ</th>
                      <th className="px-4 py-5 font-bold text-gray-400 text-xs">מע"מ</th>
                      <th className="px-4 py-5 font-bold text-gray-400 text-xs">סה"כ כולל מע"מ</th>
                      <th className="px-4 py-5 font-bold text-gray-400 text-xs">יתרה</th>
                      <th className="px-4 py-5 font-bold text-gray-400 text-xs">פרטים נוספים</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredDocuments.map((doc) => {
                      const typeInfo = getDocumentTypeInfo(doc.invoice_type);
                      const getPrefix = (type) => {
                        const prefixes = {
                          invoice: 'ח"מ',
                          invoice_receipt: 'חמ"ק',
                          receipt: 'קב.',
                          credit: 'זי.',
                          quote: 'הצ.',
                          delivery_note: 'ת.מ.',
                        }
                        return prefixes[type] || 'מס.';
                      };

                      return (
                        <tr key={doc.id} className="hover:bg-white/5 transition-colors group">
                          <td className="px-4 py-5 text-center">
                            <input type="checkbox" className="rounded border-white/20 bg-white/5" />
                          </td>
                          <td className="px-4 py-5">
                            <div className="flex items-center gap-3">
                              {(() => {
                                let displayName = doc.customer?.name;

                                try {
                                  if (doc.internal_notes) {
                                    const meta = JSON.parse(doc.internal_notes);
                                    if (meta.client_name) displayName = meta.client_name;
                                  }
                                } catch (e) { }

                                if (!displayName) displayName = 'לקוח לא רשום';

                                return (
                                  <>
                                    <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs uppercase border border-blue-500/20 shadow-sm">
                                      {displayName.substring(0, 1)}
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="font-bold text-blue-50">{displayName}</span>
                                      {doc.customer?.phone && <span className="text-[10px] text-gray-500">{doc.customer.phone}</span>}
                                    </div>
                                  </>
                                )
                              })()}
                            </div>
                          </td>
                          <td className="px-4 py-5">
                            <div className="flex flex-col">
                              <span className="text-blue-400 font-bold">
                                {getPrefix(doc.invoice_type)} {doc.invoice_number || '---'}
                              </span>
                              <span className="text-[9px] text-gray-500 font-medium">הופק ע"י המערכת</span>
                            </div>
                          </td>
                          <td className="px-4 py-5">
                            <span className="text-gray-300 text-sm">
                              {doc.issue_date ? new Date(doc.issue_date).toLocaleDateString('he-IL') : '---'}
                            </span>
                          </td>
                          <td className="px-4 py-5 text-gray-500 text-xs">
                            -
                          </td>
                          <td className="px-4 py-5">
                            <span className="text-gray-300">₪{parseFloat(doc.subtotal || 0).toLocaleString('he-IL', { minimumFractionDigits: 2 })}</span>
                          </td>
                          <td className="px-4 py-5">
                            <span className="text-gray-300">₪{parseFloat(doc.vat_amount || 0).toLocaleString('he-IL', { minimumFractionDigits: 2 })}</span>
                          </td>
                          <td className="px-4 py-5">
                            <span className="text-gray-200 font-bold">₪{parseFloat(doc.total_amount || 0).toLocaleString('he-IL', { minimumFractionDigits: 2 })}</span>
                          </td>
                          <td className="px-4 py-5 text-center">
                            {(() => {
                              let balance = doc.total_amount - (doc.paid_amount || 0);
                              try {
                                if (doc.internal_notes) {
                                  const meta = JSON.parse(doc.internal_notes);
                                  if (meta.original_balance !== undefined) balance = meta.original_balance;
                                }
                              } catch (e) { }

                              return (
                                <div className={`inline-block px-2 py-1 rounded font-bold text-xs ${balance > 0 ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' : 'text-gray-500'}`}>
                                  ₪{parseFloat(balance).toLocaleString('he-IL', { minimumFractionDigits: 2 })}
                                </div>
                              )
                            })()}
                          </td>
                          <td className="px-4 py-5">
                            <div className="flex items-center gap-2">
                              <button className="p-2 bg-white/5 hover:bg-blue-600 rounded-lg transition-all" title="צפה">
                                <Eye size={14} className="text-blue-400 group-hover:text-white" />
                              </button>
                              <button className="p-2 bg-white/5 hover:bg-green-600 rounded-lg transition-all" title="הורד">
                                <Download size={14} className="text-green-400 group-hover:text-white" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
