'use client'

import { useState, useEffect } from 'react'
import { Printer, Download, FileDown } from 'lucide-react'

export default function InvoicePDF({ invoice, items, standalone = false }) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const generatePDF = async () => {
    if (!isClient) return

    try {
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        alert('נא לאפשר חלונות קופצים כדי להדפיס את החשבונית')
        return
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
        return types[type] || 'חשבונית מס'
      }

      const docType = getDocumentTypeLabel(invoice.invoice_type)
      const subtotal = parseFloat(invoice.subtotal || 0)
      const vatAmount = parseFloat(invoice.vat_amount || 0)
      const totalAmount = parseFloat(invoice.total_amount || invoice.total_with_vat || (subtotal + vatAmount))
      const customerName = invoice.customers?.name || invoice.customer_name || 'לקוח כללי'

      const htmlContent = `
        <!DOCTYPE html>
        <html dir="rtl" lang="he">
        <head>
          <meta charset="UTF-8">
          <title>${docType} ${invoice.invoice_number || ''}</title>
          <link href="https://fonts.googleapis.com/css2?family=Assistant:wght@300;400;600;700;800&display=swap" rel="stylesheet">
          <style>
            @page {
              size: A4;
              margin: 10mm;
            }
            body {
              font-family: 'Assistant', sans-serif;
              margin: 0;
              padding: 0;
              background-color: white;
              color: #1a1a1a;
              direction: rtl;
            }
              .page {
                width: 190mm;
              margin: 0 auto;
              padding: 5mm;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              min-height: 277mm;
            }

            .header-top {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 10px;
            }
            .business-details {
              text-align: right;
            }
            .business-details h1 {
              margin: 0;
              color: #000;
              font-size: 28px;
              font-weight: 800;
            }
            .business-details p {
              margin: 3px 0;
              font-size: 15px;
              color: #333;
              font-weight: 600;
            }
            .logo-container {
              text-align: left;
            }
            .logo-container img {
              height: 120px;
              width: auto;
            }

            .doc-title {
              text-align: center;
              margin: 5px 0;
            }
            .doc-title h2 {
              margin: 0;
              font-size: 28px;
              font-weight: 900;
              color: #E53E3E;
              letter-spacing: 1px;
            }

            .dividing-line {
              border-top: 2px solid #000;
              margin: 5px 0 20px 0;
            }

              /* Info Cubes */
              .info-grid {
                display: grid;
              grid-template-columns: 1.5fr 1fr;
              gap: 20px;
              margin-bottom: 25px;
            }
              .cube {
                border: 1.5px solid #000;
              padding: 15px;
              border-radius: 0; /* Rectangular as requested */
              background-color: #fff;
            }
              .cube h3 {
                margin: 0 0 10px 0;
              font-size: 16px;
              font-weight: 800;
              border-bottom: 1.5px solid #000;
              padding-bottom: 5px;
              display: inline-block;
            }
              .cube p {
                margin: 5px 0;
              font-size: 14px;
              font-weight: 600;
              line-height: 1.4;
            }

              /* Table */
              table {
                width: 100%;
              border-collapse: collapse;
              margin-bottom: 25px;
            }
              th {
              background-color: #f3f4f6;
              border: 1.5px solid #000;
              text-align: right;
              padding: 12px;
              font-size: 14px;
              font-weight: 800;
            }
            td {
              padding: 12px;
              border: 1.5px solid #000;
              font-size: 14px;
              font-weight: 600;
            }
            .text-center { text-align: center; }
            .text-left { text-align: left; }

            /* Bottom Cubes */
            .bottom-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 30px;
            }
            .summary-cube {
              background-color: #fff;
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              padding: 5px 0;
              font-size: 15px;
              font-weight: 600;
            }
            .total-row {
              border-top: 2px solid #000;
              margin-top: 10px;
              padding-top: 10px;
              font-size: 20px;
              font-weight: 900;
              color: #2e7d32;
            }

            /* Footer - Left Corner */
            .footer-section {
              margin-top: auto;
              display: flex;
              flex-direction: column;
              align-items: flex-start; /* Left side in RTL */
              padding-bottom: 10px;
              width: 100%;
            }
            .signature-box {
              text-align: center;
              width: 250px;
            }
            .signature-box img {
              height: 90px;
              width: auto;
              margin-bottom: 5px;
            }
            .signature-box p {
              margin: 0;
              font-size: 14px;
              font-weight: 700;
            }
            .thank-you {
              margin-bottom: 15px;
              font-size: 20px;
              font-weight: 800;
              color: #1a1a1a;
            }

            @media print {
              .no-print { display: none !important; }
              body { background-color: white; }
              .page { margin: 0; width: 100%; padding: 5mm 10mm; }
            }
            </style>
          </head>
          <body>
            <div class="page">
              <div class="header-top">
                <div class="business-details">
                  <h1>דפוס קשת - ד.ע קשת הדפסות בע"מ</h1>
                  <p>רח' מורדי הגטאות 15, בית שמש</p>
                  <p>טל: 077-5120070 | דוא"ל: print@dfus-keshet.com</p>
                  <p>ח.פ 514325299</p>
                </div>
                <div class="logo-container">
                  <img src="/Logo .png" alt="לוגו דפוס קשת" />
                </div>
              </div>

              <div class="doc-title">
                <h2>${docType}</h2>
              </div>

              <div class="dividing-line"></div>

              <div class="info-grid">
                <div class="cube">
                  <h3>לכבוד</h3>
                  <p style="font-size: 16px;"><strong>${customerName}</strong></p>
                  <p>כתובת: ${invoice.customers?.billing_address || invoice.customer_address || '-'}</p>
                  <p>טלפון: ${invoice.customers?.phone || invoice.customer_phone || '-'}</p>
                  <p>דוא"ל: ${invoice.customers?.email || invoice.customer_email || '-'}</p>
                </div>
                <div class="cube">
                  <h3>פרטי מסמך</h3>
                  <p>מספר מסמך: <strong>${invoice.invoice_number || invoice.id}</strong></p>
                  <p>תאריך הוצאה: ${new Date(invoice.issue_date || invoice.created_at).toLocaleDateString('he-IL')}</p>
                  <p>תאריך פירעון: ${invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('he-IL') : 'מיידי'}</p>
                </div>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>תיאור השירות / מוצר</th>
                    <th class="text-center" style="width: 80px;">כמות</th>
                    <th class="text-left" style="width: 120px;">מחיר יחידה</th>
                    <th class="text-left" style="width: 120px;">סה"כ</th>
                  </tr>
                </thead>
                <tbody>
                  ${items.map(item => `
                  <tr>
                    <td>${item.description || 'מוצר/שירות'}</td>
                    <td class="text-center">${parseFloat(item.quantity).toLocaleString()}</td>
                    <td class="text-left">₪${parseFloat(item.unit_price).toLocaleString('he-IL', { minimumFractionDigits: 2 })}</td>
                    <td class="text-left">₪${parseFloat(item.total).toLocaleString('he-IL', { minimumFractionDigits: 2 })}</td>
                  </tr>
                `).join('')}
                </tbody>
              </table>

              <div class="bottom-grid">
                <div class="cube">
                  <h3>להעברה בנקאית</h3>
                  <p>בנק: דיסקונט (11), סניף 167</p>
                  <p>חשבון: 023756</p>
                  <p>ע"ש: ד.ע.קשת הדפסות בע"מ</p>
                </div>
                <div class="cube summary-cube">
                  <h3>סיכום כספי</h3>
                  <div class="summary-row">
                    <span>סכום בסיס:</span>
                    <span>₪${subtotal.toLocaleString('he-IL', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div class="summary-row">
                    <span>מע"מ (${invoice.vat_rate || 18}%):</span>
                    <span>₪${vatAmount.toLocaleString('he-IL', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div class="summary-row total-row">
                    <span>סה"כ לתשלום:</span>
                    <span>₪${totalAmount.toLocaleString('he-IL', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              <div class="footer-section">
                <div class="thank-you">תודה על העסקתך!</div>
                <div class="signature-box">
                  <img src="/Signature .png" alt="חתימה דיגיטלית" />
                  <p>דפוס קשת - ד.ע קשת הדפסות בע"מ</p>
                </div>
              </div>
            </div>

            <script>
              window.onload = function() {
                setTimeout(function () {
                  window.print();
                }, 500);
            }
            </script>
          </body>
        </html>
        `

      printWindow.document.write(htmlContent)
      printWindow.document.close()
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('שגיאה בהפקת המסמך')
    }
  }

  if (standalone) {
    return (
      <div className="bg-[#0f1117] min-h-screen p-8 flex flex-col items-center gap-8">
        <div className="flex gap-4">
          <button
            onClick={generatePDF}
            className="bg-amber-500 hover:bg-amber-600 text-white px-8 py-4 rounded-2xl font-black text-xl flex items-center gap-3 transition-all shadow-xl shadow-amber-500/20"
          >
            <Printer size={28} />
            הדפסה עכשיו
          </button>
        </div>

        <div className="bg-white p-12 w-[210mm] min-h-[297mm] shadow-2xl relative" dir="rtl">
          {/* Top Header */}
          <div className="flex justify-between items-start mb-6">
            <div className="text-right">
              <h1 className="text-3xl font-black text-gray-900 m-0">דפוס קשת - ד.ע קשת הדפסות בע"מ</h1>
              <p className="text-gray-600 font-bold m-0 mt-1">רח' מורדי הגטאות 15, בית שמש</p>
              <p className="text-gray-600 font-bold m-0">טל: 077-5120070 | דוא"ל: print@dfus-keshet.com</p>
              <p className="text-gray-600 font-bold m-0 text-sm">ח.פ 514325299</p>
            </div>
            <div className="text-left">
              <img src="/Logo .png" alt="לוגו" className="h-32 object-contain" />
            </div>
          </div>

          <div className="text-center my-6">
            <h2 className="text-3xl font-black text-red-600 tracking-widest uppercase">{getDocumentTypeLabel(invoice.invoice_type)}</h2>
          </div>

          <div className="border-t-4 border-gray-900 my-6"></div>

          {/* Info Cubes */}
          <div className="grid grid-cols-2 gap-8 mb-10">
            <div className="border-2 border-gray-900 p-6">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 border-b-2 border-gray-900 pb-2 inline-block">לכבוד</h3>
              <p className="text-xl font-black text-gray-900 mb-1">{customerName}</p>
              <p className="text-gray-600 font-bold">{invoice.customers?.billing_address || invoice.customer_address || '-'}</p>
              <p className="text-gray-600 font-bold">{invoice.customers?.phone || invoice.customer_phone || '-'}</p>
            </div>
            <div className="border-2 border-gray-900 p-6">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 border-b-2 border-gray-900 pb-2 inline-block">פרטי מסמך</h3>
              <p className="text-gray-600 font-bold">מספר מסמך: <span className="text-gray-900 font-black">{invoice.invoice_number || invoice.id}</span></p>
              <p className="text-gray-600 font-bold">תאריך: <span className="text-gray-900 font-black">{new Date(invoice.issue_date).toLocaleDateString('he-IL')}</span></p>
              <p className="text-gray-600 font-bold">פירעון: <span className="text-gray-900 font-black">{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('he-IL') : 'מיידי'}</span></p>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full border-collapse mb-10">
            <thead>
              <tr className="bg-gray-100 uppercase text-sm">
                <th className="border-2 border-gray-900 p-4 font-black">תיאור השירות / מוצר</th>
                <th className="border-2 border-gray-900 p-4 font-black text-center w-20">כמות</th>
                <th className="border-2 border-gray-900 p-4 font-black text-left w-32">מחיר</th>
                <th className="border-2 border-gray-900 p-4 font-black text-left w-32">סה"כ</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td className="border-2 border-gray-900 p-4 font-bold text-gray-800">{item.description}</td>
                  <td className="border-2 border-gray-900 p-4 text-center font-black text-gray-900">{parseFloat(item.quantity).toLocaleString()}</td>
                  <td className="border-2 border-gray-900 p-4 text-left font-bold text-gray-700">₪{parseFloat(item.unit_price).toLocaleString()}</td>
                  <td className="border-2 border-gray-900 p-4 text-left font-black text-gray-900">₪{parseFloat(item.total).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Bottom Cubes */}
          <div className="grid grid-cols-2 gap-8 mb-10">
            <div className="border-2 border-gray-900 p-6">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 border-b-2 border-gray-900 pb-2 inline-block">פרטים להעברה</h3>
              <p className="text-gray-700 font-bold mb-1">בנק דיסקונט (11), סניף 167</p>
              <p className="text-gray-700 font-bold mb-1">מספר חשבון: 023756</p>
              <p className="text-gray-700 font-bold">ע"ש ד.ע.קשת הדפסות בע"מ</p>
            </div>
            <div className="border-2 border-gray-900 p-6">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 border-b-2 border-gray-900 pb-2 inline-block">סיכום כספי</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-gray-600 font-bold">
                  <span>סכום בסיס</span>
                  <span>₪{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600 font-bold border-b-2 border-gray-200 pb-2">
                  <span>מע"מ ({invoice.vat_rate || 18}%)</span>
                  <span>₪{vatAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-2xl font-black text-green-700 pt-2">
                  <span>סה"כ לתשלום</span>
                  <span>₪{totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-10 flex flex-col items-start">
            <p className="text-2xl font-black text-gray-800 mb-4">תודה על העסקתך!</p>
            <div className="text-center w-64">
              <img src="/Signature .png" alt="חתימה" className="h-24 mx-auto mb-2" />
              <p className="font-black text-gray-900">דפוס קשת - ד.ע קשת הדפסות בע"מ</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={generatePDF}
      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
    >
      <FileDown size={16} />
      הדפס חשבונית
    </button>
  )
}
