'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Search, Edit2, Trash2, FileText, Download, Eye, CheckCircle, AlertCircle } from 'lucide-react'
import Layout from '@/components/Layout'

export const dynamic = 'force-dynamic'

export default function Invoices() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [invoiceItems, setInvoiceItems] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')

  // טעינת חשבוניות
  useEffect(() => {
    fetchInvoices()
  }, [])

  const fetchInvoices = async () => {
    try {
      const response = await fetch('/api/invoices')
      const data = await response.json()
      
      if (data.success) {
        setInvoices(data.invoices || [])
      } else {
        console.error('Failed to fetch invoices:', data.error)
      }
    } catch (error) {
      console.error('Error fetching invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  // סינון חשבוניות לפי חיפוש וסטטוס
  const filteredInvoices = invoices.filter(invoice => {
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter
    
    // סינון לפי סטטוס מתורגם
    const matchesSearch = invoice.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.invoice_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         translateStatus(invoice.status).toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch && matchesStatus
  })

  // צפייה בחשבונית
  const viewInvoice = async (invoice) => {
    try {
      // נסה לקבל את פריטי החשבונית
      const response = await fetch(`/api/invoices/${invoice.id}`)
      const data = await response.json()
      
      if (data.success) {
        setSelectedInvoice({
          ...invoice,
          items: data.items || []
        })
      }
    } catch (error) {
      console.error('Error fetching invoice details:', error)
    }
  }

  // פונקציית תרגום סוג מסמך
  const translateInvoiceType = (type) => {
    const translations = {
      'invoice': 'חשבונית',
      'invoice_receipt': 'חשבונית מס קבלה',
      'receipt': 'קבלה',
      'credit': 'חשבונית זיכוי',
      'quote': 'הצעת מחיר',
      'delivery_note': 'תעודת משלוח',
      'return': 'החזרה',
      'purchase': 'חשבונית קניה'
    }
    return translations[type] || type
  }

  // פונקציית תרגום סטטוס
  const translateStatus = (status) => {
    const translations = {
      'open': 'פתוח',
      'paid': 'שולם',
      'overdue': 'איחור',
      'cancelled': 'בוטל',
      'draft': 'טיוטה',
      'pending': 'ממתין',
      'sent': 'נשלח'
    }
    return translations[status] || status
  }
  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-700'
    
    switch (status.toLowerCase()) {
      case 'open':
        return 'bg-yellow-100 text-yellow-700'
      case 'paid':
        return 'bg-green-100 text-green-700'
      case 'overdue':
        return 'bg-red-100 text-red-700'
      case 'cancelled':
        return 'bg-gray-100 text-gray-700'
      default:
        return 'bg-blue-100 text-blue-700'
    }
  }

  // תצוגת PDF לחשבונית
  const downloadPDF = (invoice) => {
    // פתיחת חלון PDF חדש עם כל הפרטים
    const pdfUrl = `${window.location.origin}/invoices/${invoice.id}/pdf`
    const printWindow = window.open(pdfUrl, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes')
    if (!printWindow) {
      alert('נא לאפשר חוסמיון חלונות')
      return
    }
    printWindow.focus()
  }

  // תצוגת חשבונית נבחרת
  if (selectedInvoice) {
    return (
      <Layout>
        <div className="p-8">
          <div>
            <button
              onClick={() => setSelectedInvoice(null)}
              className="btn-secondary mb-4"
            >
              ← חזרה לרשימת חשבוניות
            </button>
            
            {/* תצוגת פרטי חשבונית */}
            <div className="card">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">חשבונית מספר {selectedInvoice.invoice_number}</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => downloadPDF(selectedInvoice)}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Download size={20} />
                    הורד PDF
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-bold mb-2">פרטי לקוח</h3>
                  <p><strong>שם:</strong> {selectedInvoice.customer_name}</p>
                  <p><strong>מספר לקוח:</strong> {selectedInvoice.customer_id}</p>
                </div>
                <div>
                  <h3 className="font-bold mb-2">פרטי חשבונית</h3>
                  <p><strong>סוג מסמך:</strong> {translateInvoiceType(selectedInvoice.invoice_type)}</p>
                  <p><strong>תאריך הנפקה:</strong> {new Date(selectedInvoice.issue_date).toLocaleDateString('he-IL')}</p>
                  <p><strong>תאריך פרעון:</strong> {new Date(selectedInvoice.due_date).toLocaleDateString('he-IL')}</p>
                  <p><strong>סטטוס:</strong> 
                    <span className={`mr-2 px-2 py-1 rounded text-sm ${getStatusColor(selectedInvoice.status)}`}>
                      {translateStatus(selectedInvoice.status)}
                    </span>
                  </p>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="font-bold mb-2">סיכום תשלומים</h3>
                <div className="bg-gray-50 p-4 rounded">
                  <p><strong>סכום בסיס:</strong> ₪{parseFloat(selectedInvoice.subtotal || 0).toLocaleString('he-IL')}</p>
                  <p><strong>מע"מ:</strong> ₪{parseFloat(selectedInvoice.vat_amount || 0).toLocaleString('he-IL')}</p>
                  <p className="text-xl font-bold"><strong>סך הכל:</strong> ₪{parseFloat(selectedInvoice.total_with_vat || 0).toLocaleString('he-IL')}</p>
                </div>
              </div>
              
              {selectedInvoice.notes && (
                <div>
                  <h3 className="font-bold mb-2">הערות</h3>
                  <p className="text-gray-600">{selectedInvoice.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-8">
        <div className="card">
          {/* כותרת וכפתורי פעולה */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <span className="text-green-600">🧾</span>
              חשבוניות
            </h1>
            
            <button
              onClick={() => window.location.href = '/orders'}
              className="btn-secondary flex items-center gap-2"
            >
              ← חזרה להזמנות
            </button>
          </div>

          {/* מסננים */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="חפש לפי מספר חשבונית, לקוח או סוג..."
                className="input-field pr-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* מסנני סטטוס */}
            <div className="flex gap-2">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  statusFilter === 'all' 
                    ? 'bg-gray-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                הכל
              </button>
              <button
                onClick={() => setStatusFilter('open')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  statusFilter === 'open' 
                    ? 'bg-yellow-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                פתוח
              </button>
              <button
                onClick={() => setStatusFilter('paid')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  statusFilter === 'paid' 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                שולם
              </button>
              <button
                onClick={() => setStatusFilter('overdue')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  statusFilter === 'overdue' 
                    ? 'bg-red-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                איחור
              </button>
            </div>
          </div>

          {/* טבלת חשבוניות */}
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">טוען חשבוניות...</p>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'לא נמצאו חשבוניות' : 'אין חשבוניות במערכת'}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="btn-primary mx-auto"
                >
                  הצג את החיפוש
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-gradient-to-r from-green-600 to-green-700 text-white">
                  <tr>
                    <th className="px-4 py-4 text-right font-bold border border-gray-300">מספר חשבונית</th>
                    <th className="px-4 py-4 text-right font-bold border border-gray-300">לקוח</th>
                    <th className="px-4 py-4 text-right font-bold border border-gray-300">סוג</th>
                    <th className="px-4 py-4 text-right font-bold border border-gray-300">תאריך הנפקה</th>
                    <th className="px-4 py-4 text-right font-bold border border-gray-300">תאריך פרעון</th>
                    <th className="px-4 py-4 text-right font-bold border border-gray-300">סכום</th>
                    <th className="px-4 py-4 text-right font-bold border border-gray-300">סטטוס</th>
                    <th className="px-4 py-4 text-center font-bold border border-gray-300">פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                      <td
                        className="px-4 py-4 font-bold text-blue-600 border border-gray-200"
                        onClick={() => viewInvoice(invoice)}
                      >
                        #{invoice.invoice_number}
                      </td>
                      <td
                        className="px-4 py-4 border border-gray-200"
                        onClick={() => viewInvoice(invoice)}
                      >
                        {invoice.customer_name}
                      </td>
                      <td
                        className="px-4 py-4 border border-gray-200"
                        onClick={() => viewInvoice(invoice)}
                      >
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                          {translateInvoiceType(invoice.invoice_type)}
                        </span>
                      </td>
                      <td
                        className="px-4 py-4 text-gray-600 border border-gray-200"
                        onClick={() => viewInvoice(invoice)}
                      >
                        {new Date(invoice.issue_date).toLocaleDateString('he-IL')}
                      </td>
                      <td
                        className="px-4 py-4 text-gray-600 border border-gray-200"
                        onClick={() => viewInvoice(invoice)}
                      >
                        {new Date(invoice.due_date).toLocaleDateString('he-IL')}
                      </td>
                      <td
                        className="px-4 py-4 font-bold border border-gray-200"
                        onClick={() => viewInvoice(invoice)}
                      >
                        ₪{parseFloat(invoice.total_with_vat).toLocaleString('he-IL')}
                      </td>
                      <td
                        className="px-4 py-4 border border-gray-200"
                        onClick={() => viewInvoice(invoice)}
                      >
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(invoice.status)}`}>
                          {translateStatus(invoice.status)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center border border-gray-200">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              viewInvoice(invoice)
                            }}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                            title="צפה בחשבונית"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              downloadPDF(invoice)
                            }}
                            className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50 transition-colors"
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
        </div>
      </div>
    </Layout>
  )
}
