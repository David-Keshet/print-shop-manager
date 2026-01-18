'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import Link from 'next/link'
import {
  FileText,
  Download,
  Send,
  DollarSign,
  Calendar,
  User,
  Phone,
  Mail,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  Printer,
  ChevronLeft,
  Briefcase,
  MapPin,
  Loader2,
  Trash2,
  RefreshCw
} from 'lucide-react'

export default function DocumentDetailsPage({ params }) {
  const [documentId, setDocumentId] = useState(null)
  const [document, setDocument] = useState(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [paymentReference, setPaymentReference] = useState('')

  useEffect(() => {
    const getId = async () => {
      const resolvedParams = await params
      setDocumentId(resolvedParams.id)
    }
    getId()
  }, [params])

  useEffect(() => {
    if (documentId) {
      fetchDocument()
    }
  }, [documentId])

  const fetchDocument = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/invoices/${documentId}`)
      const data = await response.json()

      if (data.success) {
        setDocument(data.invoice)
        setPaymentAmount((data.invoice.total_amount - (data.invoice.paid_amount || 0)).toString())
      }
    } catch (error) {
      console.error('Error fetching document:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    try {
      setSyncing(true)
      const response = await fetch(`/api/invoices/sync?invoice_id=${documentId}`, {
        method: 'POST'
      })
      const data = await response.json()
      if (data.success) {
        alert('סונכרן בהצלחה ל-iCount!')
        fetchDocument()
      } else {
        alert(`שגיאת סנכרון: ${data.error}`)
      }
    } catch (error) {
      console.error('Sync failed:', error)
      alert('סנכרון נכשל')
    } finally {
      setSyncing(false)
    }
  }

  const handlePayment = async () => {
    try {
      const response = await fetch(`/api/invoices/${documentId}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_date: new Date().toISOString().split('T')[0],
          amount: parseFloat(paymentAmount),
          payment_method: paymentMethod,
          reference_number: paymentReference,
        }),
      })

      const data = await response.json()

      if (data.success) {
        alert('התשלום נרשם בהצלחה!')
        setShowPaymentModal(false)
        fetchDocument()
      } else {
        alert(`שגיאה: ${data.error}`)
      }
    } catch (error) {
      console.error('Error recording payment:', error)
      alert('שגיאה ברישום תשלום')
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f1117]">
          <Loader2 className="w-12 h-12 text-amber-500 animate-spin mb-4" />
          <p className="text-gray-400 font-bold tracking-widest text-xs uppercase text-center">טוען את פרטי המסמך...</p>
        </div>
      </Layout>
    )
  }

  if (!document) {
    return (
      <Layout>
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f1117]">
          <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500 mb-6 font-bold text-2xl">?</div>
          <h2 className="text-2xl font-black text-white mb-2">המסמך לא נמצא</h2>
          <Link href="/documents">
            <button className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-3 rounded-xl font-bold transition-all border border-gray-700 mt-4">
              חזרה למסמכים
            </button>
          </Link>
        </div>
      </Layout>
    )
  }

  const getDocumentTypeLabel = (type) => {
    const types = {
      invoice: 'חשבונית מס',
      invoice_receipt: 'חשבונית מס קבלה',
      receipt: 'קבלה',
      credit: 'חשבונית זיכוי',
      quote: 'הצעת מחיר',
      delivery_note: 'תעודת משלוח',
      return: 'החזרה',
      purchase: 'חשבונית קניה'
    }
    return types[type] || type
  }

  const balance = parseFloat(document.total_amount) - parseFloat(document.paid_amount || 0)

  return (
    <Layout>
      <div className="min-h-screen p-6 bg-[#0f1117]">
        {/* Navbar-style Header */}
        <div className="max-w-7xl mx-auto mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4">
              <Link href="/documents">
                <button className="w-12 h-12 bg-gray-800/50 hover:bg-gray-700 rounded-2xl flex items-center justify-center text-gray-400 hover:text-white transition-all border border-gray-700">
                  <ArrowRight size={24} />
                </button>
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-black text-white">
                    {getDocumentTypeLabel(document.invoice_type)}
                    <span className="text-amber-500 mr-2">#{document.invoice_number || document.id}</span>
                  </h1>
                </div>
                <p className="text-gray-500 font-medium">נוצר בתאריך {new Date(document.created_at).toLocaleDateString('he-IL')}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleSync}
                disabled={syncing}
                className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-5 py-3 rounded-2xl transition-all border border-gray-700 font-bold"
              >
                {syncing ? <RefreshCw size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                סנכרן
              </button>
              <Link href={`/documents/${document.id}/pdf`}>
                <button className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-2xl transition-all font-bold shadow-lg shadow-amber-500/20">
                  <Printer size={20} />
                  תצוגה והדפסה
                </button>
              </Link>
              <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl transition-all font-bold shadow-lg shadow-blue-500/20">
                <Send size={18} />
                שלח במייל
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">

            {/* 3. פריטי המסמך - הבאתי למעלה כי זה הכי חשוב */}
            <div className="bg-gray-800/40 rounded-[2.5rem] border border-gray-700/50 overflow-hidden backdrop-blur-xl">
              <div className="p-8 border-b border-gray-700/50 flex justify-between items-center">
                <h2 className="text-xl font-black text-white flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                    <Briefcase size={20} />
                  </div>
                  פירוט פריטים
                </h2>
                <div className="text-gray-500 text-sm font-bold bg-gray-900 px-3 py-1 rounded-lg border border-gray-700/50">
                  {document.invoice_items?.length || 0} פריטים
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right border-separate border-spacing-0">
                  <thead>
                    <tr className="bg-gray-900/30">
                      <th className="px-8 py-4 text-gray-500 font-bold text-xs uppercase tracking-widest border-b border-gray-700/30">תיאור</th>
                      <th className="px-4 py-4 text-gray-500 font-bold text-xs uppercase tracking-widest text-center border-b border-gray-700/30">כמות</th>
                      <th className="px-4 py-4 text-gray-500 font-bold text-xs uppercase tracking-widest text-left border-b border-gray-700/30">מחיר יחידה</th>
                      <th className="px-8 py-4 text-gray-500 font-bold text-xs uppercase tracking-widest text-left border-b border-gray-700/30">סה"כ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/30">
                    {document.invoice_items?.map((item) => (
                      <tr key={item.id} className="hover:bg-white/[0.02]">
                        <td className="px-8 py-5 text-white font-bold text-base">{item.description}</td>
                        <td className="px-4 py-5 text-center text-gray-300 font-mono">
                          {parseFloat(item.quantity)}
                        </td>
                        <td className="px-4 py-5 text-left text-gray-300 font-mono italic">
                          ₪{parseFloat(item.unit_price).toLocaleString('he-IL')}
                        </td>
                        <td className="px-8 py-5 text-left text-white font-black text-lg tracking-tighter">
                          ₪{parseFloat(item.total).toLocaleString('he-IL')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-gray-900/50 p-8 space-y-4">
                <div className="flex justify-between text-gray-400 font-bold">
                  <span>סכום ביניים</span>
                  <span className="font-mono">₪{parseFloat(document.subtotal).toLocaleString('he-IL')}</span>
                </div>
                <div className="flex justify-between text-gray-400 font-bold">
                  <span>מע"מ ({document.invoice_items?.[0]?.vat_rate || 17}%)</span>
                  <span className="font-mono">₪{parseFloat(document.vat_amount).toLocaleString('he-IL')}</span>
                </div>
                <div className="flex justify-between items-center pt-6 border-t border-gray-700 mt-2">
                  <span className="text-2xl font-black text-white uppercase tracking-tighter">סה"כ לתשלום</span>
                  <div className="text-4xl font-black text-white bg-amber-500 px-6 py-2 rounded-2xl shadow-xl shadow-amber-500/10 tracking-tighter">
                    <span className="text-xl font-bold ml-1">₪</span>
                    {parseFloat(document.total_amount).toLocaleString('he-IL')}
                  </div>
                </div>
              </div>
            </div>

            {/* פרטי לקוח ותשלומים */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-gray-800/40 rounded-[2rem] border border-gray-700/50 p-8">
                <h2 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500">
                    <User size={20} />
                  </div>
                  פרטי הלקוח
                </h2>

                <div className="space-y-6">
                  <div className="flex items-start gap-4 p-4 bg-gray-900/50 rounded-2xl border border-gray-700/30">
                    <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-gray-400">
                      <Briefcase size={18} />
                    </div>
                    <div>
                      <div className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1">שם העסק</div>
                      <div className="text-white font-black text-lg">
                        {(() => {
                          if (document.customers?.name) return document.customers.name
                          try {
                            if (document.internal_notes) {
                              const notes = JSON.parse(document.internal_notes)
                              if (notes.client_name) return notes.client_name
                            }
                          } catch (e) { }
                          return 'לקוח iCount'
                        })()}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {document.customers?.email && (
                      <div className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors cursor-pointer bg-gray-900/30 p-3 rounded-xl">
                        <Mail size={16} />
                        <span className="text-sm font-medium">{document.customers.email}</span>
                      </div>
                    )}
                    {document.customers?.phone && (
                      <div className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors cursor-pointer bg-gray-900/30 p-3 rounded-xl">
                        <Phone size={16} />
                        <span className="text-sm font-medium font-mono">{document.customers.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-gray-400 bg-gray-900/30 p-3 rounded-xl">
                      <MapPin size={16} />
                      <span className="text-sm font-medium">{document.customers?.city || 'בית שמש'}, ישראל</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* תשלומים */}
              <div className="bg-gray-800/40 rounded-[2rem] border border-gray-700/50 p-8 flex flex-col">
                <h2 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500">
                    <DollarSign size={20} />
                  </div>
                  תשלומים שבוצעו
                </h2>

                {document.invoice_payments && document.invoice_payments.length > 0 ? (
                  <div className="flex-1 space-y-3 overflow-y-auto max-h-[250px] pr-2 custom-scrollbar">
                    {document.invoice_payments.map((payment) => (
                      <div key={payment.id} className="bg-green-500/5 border border-green-500/10 p-4 rounded-2xl flex justify-between items-center group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center text-green-500">
                            <CheckCircle size={18} />
                          </div>
                          <div>
                            <div className="text-white font-black tracking-tighter underline decoration-green-500/30 decoration-4">₪{parseFloat(payment.amount).toLocaleString()}</div>
                            <div className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">{new Date(payment.payment_date).toLocaleDateString('he-IL')} | {payment.payment_method}</div>
                          </div>
                        </div>
                        <div className="text-gray-600 font-mono text-xs">{payment.reference_number || 'ללא אסמכתא'}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center opacity-40">
                    <DollarSign size={40} className="text-gray-600 mb-2" />
                    <p className="text-gray-500 font-bold">טרם נרשמו תשלומים</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Status Card */}
            <div className="bg-gray-800/40 rounded-[2.5rem] border border-gray-700/50 p-8 backdrop-blur-xl">
              <h3 className="text-sm font-black text-gray-500 uppercase tracking-[0.2em] mb-6">מצב המסמך</h3>

              <div className="space-y-8">
                <div>
                  <div className="text-xs font-bold text-gray-500 mb-2">סטטוס סנכרון iCount</div>
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl font-bold border ${document.sync_status === 'synced'
                      ? 'bg-green-500/10 text-green-500 border-green-500/20'
                      : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                    }`}>
                    {document.sync_status === 'synced' ? <CheckCircle size={18} /> : <Clock size={18} />}
                    {document.sync_status === 'synced' ? 'מסונכרן מלא' : 'ממתין לסנכרון'}
                  </div>
                </div>

                <div className="p-6 bg-gray-900 rounded-[2rem] border border-gray-700/30">
                  <div className="text-xs font-bold text-gray-500 mb-4 uppercase tracking-widest text-center">יתרה לתשלום</div>
                  <div className={`text-5xl font-black text-center tracking-tighter ${balance > 0 ? 'text-rose-500' : 'text-green-500'}`}>
                    <span className="text-2xl ml-1 font-bold">₪</span>
                    {balance.toLocaleString()}
                  </div>
                  {document.paid_amount > 0 && (
                    <div className="mt-4 text-center">
                      <span className="text-xs font-bold text-gray-500 bg-gray-800 px-3 py-1 rounded-full border border-gray-700">שולם: ₪{parseFloat(document.paid_amount).toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {balance > 0 && (
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-5 rounded-[2rem] font-black text-lg transition-all shadow-xl shadow-green-600/20 flex items-center justify-center gap-3"
                  >
                    <DollarSign size={24} />
                    רשום תשלום חדש
                  </button>
                )}

                {document.orders && (
                  <Link href={`/orders`}>
                    <button className="w-full bg-gray-800 hover:bg-gray-700 text-white py-4 rounded-[2rem] font-bold text-sm transition-all border border-gray-700 flex items-center justify-center gap-3">
                      <ChevronLeft size={18} />
                      צפה בהזמנה המקורית
                    </button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1c23] border border-gray-700/50 rounded-[3rem] p-8 w-full max-w-lg shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full -mr-32 -mt-32 blur-[100px]"></div>

              <h3 className="text-3xl font-black text-white mb-8 flex items-center gap-4">
                <div className="w-14 h-14 bg-green-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-green-500/30 rotate-6">
                  <DollarSign size={32} />
                </div>
                רישום תשלום
              </h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3">סכום לתשלום (₪)</label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full bg-gray-800/50 text-white text-3xl font-black rounded-3xl px-6 py-5 border border-gray-700 focus:border-green-500 focus:outline-none focus:ring-4 focus:ring-green-500/5 transition-all text-center tracking-tighter"
                    placeholder="0.00"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3">אמצעי תשלום</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full bg-gray-800/50 text-white rounded-2xl px-4 py-4 border border-gray-700 focus:border-green-500 focus:outline-none appearance-none font-bold"
                    >
                      <option value="cash">💵 מזומן</option>
                      <option value="credit_card">💳 כרטיס אשראי</option>
                      <option value="bank_transfer">🏦 העברה בנקאית</option>
                      <option value="check">📜 צ'ק</option>
                      <option value="other">❓ אחר</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3">אסמכתא / הערה</label>
                    <input
                      type="text"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      className="w-full bg-gray-800/50 text-white rounded-2xl px-4 py-4 border border-gray-700 focus:border-green-500 focus:outline-none font-bold placeholder:text-gray-600"
                      placeholder="מספר אישור..."
                    />
                  </div>
                </div>

                <div className="flex gap-4 mt-8">
                  <button
                    onClick={handlePayment}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-5 rounded-[2rem] font-black text-xl transition-all shadow-xl shadow-green-600/20"
                  >
                    אשר עסקה
                  </button>
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="flex-1 bg-gray-900 hover:bg-gray-800 text-gray-400 py-5 rounded-[2rem] font-bold"
                  >
                    ביטול
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
