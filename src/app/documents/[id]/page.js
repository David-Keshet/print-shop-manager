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
  Printer
} from 'lucide-react'

export default function DocumentDetailsPage({ params }) {
  const [documentId, setDocumentId] = useState(null)
  const [document, setDocument] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [paymentReference, setPaymentReference] = useState('')

  useEffect(() => {
    // Extract id from params
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
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-xl text-gray-400">טוען מסמך...</div>
        </div>
      </Layout>
    )
  }

  if (!document) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-xl text-gray-400">מסמך לא נמצא</div>
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
      <div className="min-h-screen p-6">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/documents"
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-4"
          >
            <ArrowRight size={20} />
            חזרה למסמכים
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <FileText size={32} />
                {getDocumentTypeLabel(document.invoice_type)} {document.invoice_number || `#${document.id}`}
              </h1>
              <p className="text-gray-400 mt-1">
                נוצר ב-{new Date(document.created_at).toLocaleDateString('he-IL')}
              </p>
            </div>

            <div className="flex gap-3">
              <button className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors">
                <Printer size={18} />
                הדפס
              </button>
              <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                <Download size={18} />
                הורד PDF
              </button>
              <button className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors">
                <Send size={18} />
                שלח במייל
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* פרטי מסמך */}
          <div className="col-span-2 space-y-6">
            {/* כרטיס פרטי המסמך */}
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
              <h2 className="text-xl font-bold text-white mb-4">פרטי המסמך</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-400 mb-1">סוג מסמך</div>
                  <div className="text-white font-semibold">
                    {getDocumentTypeLabel(document.invoice_type)}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-400 mb-1">תאריך הנפקה</div>
                  <div className="text-white font-semibold flex items-center gap-2">
                    <Calendar size={16} />
                    {new Date(document.issue_date).toLocaleDateString('he-IL')}
                  </div>
                </div>

                {document.due_date && (
                  <div>
                    <div className="text-sm text-gray-400 mb-1">תאריך תשלום</div>
                    <div className="text-white font-semibold flex items-center gap-2">
                      <Calendar size={16} />
                      {new Date(document.due_date).toLocaleDateString('he-IL')}
                    </div>
                  </div>
                )}

                {document.orders && (
                  <div>
                    <div className="text-sm text-gray-400 mb-1">הזמנה</div>
                    <div className="text-white font-semibold">
                      #{document.orders.order_number}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* פרטי לקוח */}
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
              <h2 className="text-xl font-bold text-white mb-4">פרטי לקוח</h2>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <User size={18} className="text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-400">שם</div>
                    <div className="text-white font-semibold">
                      {(() => {
                        if (document.customers?.name) return document.customers.name
                        try {
                          if (document.internal_notes) {
                            const notes = JSON.parse(document.internal_notes)
                            if (notes.client_name) return notes.client_name
                          }
                        } catch (e) {}
                        return 'לקוח iCount'
                      })()}
                    </div>
                  </div>
                </div>

                {document.customers?.email && (
                  <div className="flex items-center gap-3">
                    <Mail size={18} className="text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-400">אימייל</div>
                      <div className="text-white">{document.customers.email}</div>
                    </div>
                  </div>
                )}

                {document.customers?.phone && (
                  <div className="flex items-center gap-3">
                    <Phone size={18} className="text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-400">טלפון</div>
                      <div className="text-white">{document.customers.phone}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* פריטי המסמך */}
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-700">
                <h2 className="text-xl font-bold text-white">פריטים</h2>
              </div>

              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="text-right px-6 py-3 text-gray-300">תיאור</th>
                    <th className="text-center px-6 py-3 text-gray-300">כמות</th>
                    <th className="text-right px-6 py-3 text-gray-300">מחיר יחידה</th>
                    <th className="text-right px-6 py-3 text-gray-300">מע"מ</th>
                    <th className="text-right px-6 py-3 text-gray-300">סה"כ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {document.invoice_items?.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 text-white">{item.description}</td>
                      <td className="px-6 py-4 text-center text-white">
                        {parseFloat(item.quantity)}
                      </td>
                      <td className="px-6 py-4 text-white">
                        ₪{parseFloat(item.unit_price).toLocaleString('he-IL')}
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        {parseFloat(item.vat_rate)}%
                      </td>
                      <td className="px-6 py-4 text-white font-semibold">
                        ₪{parseFloat(item.total).toLocaleString('he-IL')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="bg-gray-800 p-6 space-y-2">
                <div className="flex justify-between text-gray-300">
                  <span>סכום ביניים:</span>
                  <span>₪{parseFloat(document.subtotal).toLocaleString('he-IL')}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>מע"מ:</span>
                  <span>₪{parseFloat(document.vat_amount).toLocaleString('he-IL')}</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-white pt-2 border-t border-gray-700">
                  <span>סה"כ לתשלום:</span>
                  <span>₪{parseFloat(document.total_amount).toLocaleString('he-IL')}</span>
                </div>
              </div>
            </div>

            {/* תשלומים */}
            {document.invoice_payments && document.invoice_payments.length > 0 && (
              <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-700">
                  <h2 className="text-xl font-bold text-white">תשלומים</h2>
                </div>

                <table className="w-full">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="text-right px-6 py-3 text-gray-300">תאריך</th>
                      <th className="text-right px-6 py-3 text-gray-300">סכום</th>
                      <th className="text-right px-6 py-3 text-gray-300">אמצעי</th>
                      <th className="text-right px-6 py-3 text-gray-300">אסמכתא</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {document.invoice_payments.map((payment) => (
                      <tr key={payment.id}>
                        <td className="px-6 py-4 text-white">
                          {new Date(payment.payment_date).toLocaleDateString('he-IL')}
                        </td>
                        <td className="px-6 py-4 text-green-400 font-semibold">
                          ₪{parseFloat(payment.amount).toLocaleString('he-IL')}
                        </td>
                        <td className="px-6 py-4 text-white">{payment.payment_method}</td>
                        <td className="px-6 py-4 text-gray-300">
                          {payment.reference_number || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Sidebar - סטטוס ופעולות */}
          <div className="space-y-6">
            {/* סטטוס */}
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
              <h3 className="text-lg font-bold text-white mb-4">סטטוס</h3>

              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-400 mb-2">סטטוס מסמך</div>
                  <span
                    className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                      document.status === 'paid'
                        ? 'bg-green-500 text-white'
                        : document.status === 'sent'
                        ? 'bg-blue-500 text-white'
                        : document.status === 'cancelled'
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-500 text-white'
                    }`}
                  >
                    {document.status === 'draft' && 'טיוטה'}
                    {document.status === 'pending' && 'ממתין'}
                    {document.status === 'sent' && 'נשלח'}
                    {document.status === 'paid' && 'שולם'}
                    {document.status === 'cancelled' && 'בוטל'}
                  </span>
                </div>

                <div>
                  <div className="text-sm text-gray-400 mb-2">סטטוס תשלום</div>
                  <div className="flex items-center gap-2">
                    {document.payment_status === 'paid' ? (
                      <CheckCircle className="text-green-500" size={20} />
                    ) : document.payment_status === 'partially_paid' ? (
                      <Clock className="text-yellow-500" size={20} />
                    ) : (
                      <XCircle className="text-red-500" size={20} />
                    )}
                    <span className="text-white">
                      {document.payment_status === 'paid' && 'שולם במלואו'}
                      {document.payment_status === 'partially_paid' && 'שולם חלקית'}
                      {document.payment_status === 'unpaid' && 'לא שולם'}
                    </span>
                  </div>
                </div>

                {document.sync_status && (
                  <div>
                    <div className="text-sm text-gray-400 mb-2">סנכרון iCount</div>
                    <div className="flex items-center gap-2">
                      {document.sync_status === 'synced' ? (
                        <CheckCircle className="text-green-500" size={20} />
                      ) : document.sync_status === 'failed' ? (
                        <XCircle className="text-red-500" size={20} />
                      ) : (
                        <Clock className="text-gray-400" size={20} />
                      )}
                      <span className="text-white">
                        {document.sync_status === 'synced' && 'מסונכרן'}
                        {document.sync_status === 'failed' && 'כשל'}
                        {document.sync_status === 'pending' && 'ממתין'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* סיכום תשלום */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white">
              <h3 className="text-lg font-bold mb-4">סיכום תשלום</h3>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>סכום כולל:</span>
                  <span className="font-bold">
                    ₪{parseFloat(document.total_amount).toLocaleString('he-IL')}
                  </span>
                </div>

                {document.paid_amount > 0 && (
                  <div className="flex justify-between text-green-300">
                    <span>שולם:</span>
                    <span className="font-bold">
                      ₪{parseFloat(document.paid_amount).toLocaleString('he-IL')}
                    </span>
                  </div>
                )}

                {balance > 0 && (
                  <div className="flex justify-between text-xl font-bold pt-3 border-t border-blue-500">
                    <span>יתרה:</span>
                    <span>₪{balance.toLocaleString('he-IL')}</span>
                  </div>
                )}
              </div>

              {balance > 0 && (
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="w-full mt-4 bg-white text-blue-600 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                >
                  <DollarSign size={20} />
                  רשום תשלום
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <DollarSign className="text-green-500" size={24} />
                רישום תשלום
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    סכום
                  </label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    אמצעי תשלום
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  >
                    <option value="cash">מזומן</option>
                    <option value="credit_card">כרטיס אשראי</option>
                    <option value="bank_transfer">העברה בנקאית</option>
                    <option value="check">צ'ק</option>
                    <option value="other">אחר</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    אסמכתא (אופציונלי)
                  </label>
                  <input
                    type="text"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    placeholder="מספר אסמכתא"
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handlePayment}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold"
                  >
                    אשר תשלום
                  </button>
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg font-bold"
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