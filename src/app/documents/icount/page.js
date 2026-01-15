'use client'

import { useState, useEffect, useCallback } from 'react'
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
  ExternalLink,
  X,
  MapPin,
  Phone,
  Info,
  Plus,
  Wifi,
  WifiOff,
  Zap
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { realtimeService } from '@/lib/realtime'

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
  const [isOnline, setIsOnline] = useState(true)
  const [realtimeConnected, setRealtimeConnected] = useState(false)

  // חיבור ל-Realtime
  useEffect(() => {
    const connectRealtime = async () => {
      try {
        await realtimeService.connect()
        setRealtimeConnected(true)
      } catch (err) {
        console.error('Realtime connection failed:', err)
      }
    }

    connectRealtime()

    // האזנה לשינויים בחשבוניות
    const unsubscribe = realtimeService.subscribe('invoices', (event) => {
      console.log('📡 Invoice update:', event.type)

      setDocuments(prev => {
        if (event.type === 'insert') {
          // הוסף חשבונית חדשה בראש הרשימה
          if (!prev.some(d => d.id === event.data.id)) {
            return [event.data, ...prev]
          }
        } else if (event.type === 'update') {
          // עדכן חשבונית קיימת
          return prev.map(d => d.id === event.data.id ? { ...d, ...event.data } : d)
        } else if (event.type === 'delete') {
          // הסר חשבונית
          return prev.filter(d => d.id !== event.data.id)
        }
        return prev
      })
    })

    return () => unsubscribe()
  }, [])

  // מעקב אחרי סטטוס online/offline
  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine)

    updateOnlineStatus()
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)

    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [])

  // טעינה ראשונית
  useEffect(() => {
    fetchDocuments()
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

  const [selectedDoc, setSelectedDoc] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [fetchingDoc, setFetchingDoc] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creatingInvoice, setCreatingInvoice] = useState(false)
  const [newInvoice, setNewInvoice] = useState({
    customer_name: '',
    description: '',
    amount: '',
    vat_included: true
  })

  // יצירת חשבונית חדשה ב-iCount
  const handleCreateInvoice = async () => {
    if (!newInvoice.customer_name || !newInvoice.amount) {
      setError('נא למלא שם לקוח וסכום')
      return
    }

    setCreatingInvoice(true)
    setError(null)

    try {
      const response = await fetch('/api/icount/create-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: newInvoice.customer_name,
          items: [{
            description: newInvoice.description || 'שירותי דפוס',
            quantity: 1,
            price: parseFloat(newInvoice.amount),
            vat_included: newInvoice.vat_included
          }]
        })
      })

      const data = await response.json()

      if (data.success) {
        setSyncMessage(`✅ חשבונית ${data.invoice_number} נוצרה בהצלחה!`)
        setShowCreateModal(false)
        setNewInvoice({ customer_name: '', description: '', amount: '', vat_included: true })
        // רענן את הרשימה
        fetchDocuments()
      } else {
        setError(data.message || 'שגיאה ביצירת חשבונית')
      }
    } catch (err) {
      console.error('Create invoice error:', err)
      setError('שגיאה בתקשורת עם השרת')
    } finally {
      setCreatingInvoice(false)
    }
  }

  const handleViewDoc = async (doc) => {
    setSelectedDoc(doc)
    setShowModal(true)
    setFetchingDoc(true)

    try {
      // Fetch items for this invoice
      const { data: items, error: itemsError } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', doc.id)
        .order('line_number', { ascending: true })

      if (!itemsError) {
        setSelectedDoc(prev => ({ ...prev, items }))
      }
    } catch (err) {
      console.error('Error fetching doc items:', err)
    } finally {
      setFetchingDoc(false)
    }
  }

  const getDocumentTypeInfo = (type) => {
    const types = {
      invoice: { label: 'חשבונית מס', color: 'bg-blue-500', icon: FileText },
      invoice_receipt: { label: 'חשבונית מס קבלה', color: 'bg-green-500', icon: FileText },
      receipt: { label: 'קבלה', color: 'bg-purple-500', icon: CheckCircle },
      credit: { label: 'חשבונית זיכוי', color: 'bg-red-500', icon: XCircle },
      quote: { label: 'הצעת מחיר', color: 'bg-amber-500', icon: FileText },
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

          {/* Header with Status */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${realtimeConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
                מסמכי iCount
              </h1>
              {/* Status indicators */}
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-full">
                    <Wifi size={12} />
                    מחובר
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded-full">
                    <WifiOff size={12} />
                    לא מחובר
                  </span>
                )}
                {realtimeConnected && (
                  <span className="flex items-center gap-1 text-xs text-purple-400 bg-purple-500/10 px-2 py-1 rounded-full">
                    <Zap size={12} />
                    Realtime
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCreateModal(true)}
                disabled={!isOnline}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg text-sm font-bold transition-all flex items-center gap-2"
              >
                <Plus size={14} />
                הפק חשבונית
              </button>
              <button
                onClick={handleSyncFromICount}
                disabled={syncing || !isOnline}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg text-sm font-bold transition-all flex items-center gap-2"
              >
                <Cloud size={14} className={syncing ? 'animate-pulse' : ''} />
                {syncing ? 'מסנכרן...' : 'סנכרן מ-iCount'}
              </button>
              <button
                onClick={fetchDocuments}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-bold border border-white/10 transition-all flex items-center gap-2"
              >
                <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                רענן
              </button>
            </div>
          </div>

          {/* Sync Message */}
          {syncMessage && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm">
              {syncMessage}
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

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
                              <button
                                onClick={() => handleViewDoc(doc)}
                                className="p-2 bg-white/5 hover:bg-blue-600 rounded-lg transition-all"
                                title="צפה"
                              >
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

      {/* Document Details Modal (iCount Style) */}
      {showModal && selectedDoc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setShowModal(false)}></div>

          <div className="relative w-full max-w-6xl max-h-[90vh] bg-[#f8fafc] text-slate-900 rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300">

            {/* Modal Header */}
            <div className="flex justify-between items-center px-8 py-4 border-b border-slate-200 bg-white">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${selectedDoc.status === 'paid' ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                <span className="font-bold text-slate-500 uppercase text-xs tracking-widest">
                  {selectedDoc.status === 'paid' ? 'שולם' : 'טרם שולם'}
                </span>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden flex-col md:flex-row">

              {/* Sidebar (Left in Heb / Right in Eng - here Left) */}
              <div className="w-full md:w-80 bg-slate-50 border-l border-slate-200 p-8 flex flex-col gap-10 overflow-y-auto">

                {/* Client Section */}
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">לקוח</h4>
                  <div className="flex flex-col gap-1">
                    <span className="text-xl font-black text-blue-700">
                      {(() => {
                        try {
                          return JSON.parse(selectedDoc.internal_notes).client_name || 'לקוח iCount';
                        } catch (e) { return 'לקוח iCount'; }
                      })()}
                    </span>
                    {selectedDoc.customer?.phone && (
                      <div className="flex items-center gap-2 text-slate-500 text-sm mt-3">
                        <Phone size={14} />
                        <span>{selectedDoc.customer.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Totals Section */}
                <div className="bg-white/50 p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 text-center">תשלום</h4>
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center text-sm font-medium">
                      <span className="text-slate-500">סה"כ</span>
                      <span>₪{parseFloat(selectedDoc.total_amount).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-medium">
                      <span className="text-slate-500">שולם</span>
                      <span className="text-green-600">0%</span>
                    </div>
                    <div className="h-px bg-slate-200 my-1"></div>
                    <div className="flex justify-between items-center font-black text-lg text-blue-900 leading-none">
                      <span className="text-sm">יתרה</span>
                      <span>₪{parseFloat(selectedDoc.total_amount - (selectedDoc.paid_amount || 0)).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Details Section */}
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">תאריך הפקה</span>
                    <span className="text-sm font-bold">{new Date(selectedDoc.issue_date).toLocaleDateString('he-IL')}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">לתשלום עד</span>
                    <span className="text-sm font-bold">{new Date(selectedDoc.issue_date).toLocaleDateString('he-IL')}</span>
                  </div>
                </div>

                {/* Footer Sidebar */}
                <div className="mt-auto pt-6 border-t border-slate-200">
                  <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                    <Info size={12} />
                    <span>הערות פנימיות</span>
                  </div>
                </div>
              </div>

              {/* Main Content (Right) */}
              <div className="flex-1 p-10 overflow-y-auto bg-white">

                {/* Doc Branding */}
                <div className="flex justify-between items-start mb-16">
                  <div className="flex flex-col">
                    <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                      {getDocumentTypeInfo(selectedDoc.invoice_type).label} מס {selectedDoc.invoice_number}
                    </h2>
                    <div className="flex flex-col text-slate-500 text-sm mt-4 gap-1">
                      <span>לכבוד: {(() => {
                        try { return JSON.parse(selectedDoc.internal_notes).client_name; } catch (e) { return '...'; }
                      })()}</span>
                      <span className="flex items-center gap-1"><MapPin size={12} /> הקריה, ירושלים</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">תאריך</div>
                    <div className="font-bold text-slate-700">{new Date(selectedDoc.issue_date).toLocaleDateString('he-IL')}</div>
                  </div>
                </div>

                {/* Items Table */}
                <div className="mb-12">
                  <table className="w-full text-right">
                    <thead>
                      <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                        <th className="pb-4 w-10">#</th>
                        <th className="pb-4">פירוט</th>
                        <th className="pb-4 text-center">כמות</th>
                        <th className="pb-4 text-center">מחיר יחידה</th>
                        <th className="pb-4 text-center">מע"מ</th>
                        <th className="pb-4 text-left">סה"כ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {fetchingDoc ? (
                        <tr>
                          <td colSpan="6" className="py-20 text-center">
                            <RefreshCw className="animate-spin text-blue-500 mx-auto mb-2" size={32} />
                            <span className="text-slate-400 font-bold">טוען פרטים מלאים...</span>
                          </td>
                        </tr>
                      ) : selectedDoc.items && selectedDoc.items.length > 0 ? (
                        selectedDoc.items.map((item, idx) => (
                          <tr key={idx} className="group transition-colors">
                            <td className="py-6 text-slate-400 font-medium text-sm">{idx + 1}.</td>
                            <td className="py-6">
                              <span className="font-bold text-slate-800">{item.description}</span>
                            </td>
                            <td className="py-6 text-center text-slate-600 font-bold">{item.quantity}</td>
                            <td className="py-6 text-center text-slate-600">₪{parseFloat(item.unit_price).toLocaleString()}</td>
                            <td className="py-6 text-center">
                              <div className="flex flex-col leading-none">
                                <span className="text-[10px] text-slate-400 font-bold">מע"מ {item.vat_rate}%</span>
                                <span className="text-xs text-slate-500 font-medium">₪{parseFloat(item.vat_amount).toLocaleString()}</span>
                              </div>
                            </td>
                            <td className="py-6 text-left font-black text-slate-800">₪{parseFloat(item.total).toLocaleString()}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="py-12 text-center text-slate-400 italic">
                            לא נמצא פירוט פריטים עבור מסמך זה.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Summary Section */}
                <div className="flex flex-col items-end gap-2 border-t border-slate-100 pt-8">
                  <div className="w-full max-w-xs flex flex-col gap-3">
                    <div className="flex justify-between items-center text-sm font-bold text-slate-500">
                      <span>סה"כ כמות</span>
                      <span>{selectedDoc.items?.reduce((acc, i) => acc + (parseFloat(i.quantity) || 0), 0) || '--'}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-bold text-slate-500">
                      <span>סה"כ לפני מע"מ</span>
                      <span>₪{parseFloat(selectedDoc.subtotal).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-bold text-slate-500">
                      <span>18% מע"מ</span>
                      <span>₪{parseFloat(selectedDoc.vat_amount).toLocaleString()}</span>
                    </div>
                    <div className="h-px bg-slate-100 my-2"></div>
                    <div className="flex justify-between items-center text-xl font-black text-slate-900 uppercase">
                      <span>סה"כ לתשלום</span>
                      <span className="text-2xl">₪{parseFloat(selectedDoc.total_amount).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setShowCreateModal(false)}></div>

          <div className="relative w-full max-w-lg bg-[#1e293b] text-white rounded-2xl shadow-2xl border border-white/10 animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-white/10">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Plus size={20} className="text-green-400" />
                הפקת חשבונית חדשה
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">שם לקוח *</label>
                <input
                  type="text"
                  value={newInvoice.customer_name}
                  onChange={(e) => setNewInvoice(prev => ({ ...prev, customer_name: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                  placeholder="הכנס שם לקוח..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">תיאור</label>
                <input
                  type="text"
                  value={newInvoice.description}
                  onChange={(e) => setNewInvoice(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                  placeholder="שירותי דפוס..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">סכום *</label>
                <div className="relative">
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">₪</span>
                  <input
                    type="number"
                    value={newInvoice.amount}
                    onChange={(e) => setNewInvoice(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pr-10 pl-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="vat_included"
                  checked={newInvoice.vat_included}
                  onChange={(e) => setNewInvoice(prev => ({ ...prev, vat_included: e.target.checked }))}
                  className="w-5 h-5 rounded border-white/20 bg-white/5 text-green-500 focus:ring-green-500"
                />
                <label htmlFor="vat_included" className="text-sm text-gray-300">הסכום כולל מע"מ</label>
              </div>

              {/* Preview */}
              {newInvoice.amount && (
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="text-xs text-gray-400 mb-2">תצוגה מקדימה</div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">סה"כ לחיוב:</span>
                    <span className="text-xl font-bold text-green-400">
                      ₪{parseFloat(newInvoice.amount || 0).toLocaleString('he-IL', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {newInvoice.vat_included && (
                    <div className="flex justify-between items-center text-sm text-gray-400 mt-1">
                      <span>מתוכו מע"מ (18%):</span>
                      <span>₪{(parseFloat(newInvoice.amount || 0) - parseFloat(newInvoice.amount || 0) / 1.18).toLocaleString('he-IL', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-white/10">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-bold transition-all"
              >
                ביטול
              </button>
              <button
                onClick={handleCreateInvoice}
                disabled={creatingInvoice || !newInvoice.customer_name || !newInvoice.amount}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg text-sm font-bold transition-all flex items-center gap-2"
              >
                {creatingInvoice ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    מפיק...
                  </>
                ) : (
                  <>
                    <FileText size={14} />
                    הפק חשבונית
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
