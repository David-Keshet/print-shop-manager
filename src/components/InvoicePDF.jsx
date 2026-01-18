'use client'

import { FileDown } from 'lucide-react'

export default function InvoicePDF({ invoice, items, standalone = false }) {
  const generatePDF = () => {
    // יצירת חלון חדש עם תוכן ה-PDF
    const printWindow = window.open('', '_blank')

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>חשבונית ${invoice.invoice_number}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Arial', 'Helvetica', sans-serif;
            padding: 20px;
            direction: rtl;
            background: white;
            color: #333;
          }
          .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            border: 2px solid #333;
            padding: 30px;
            background: white;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 3px solid #333;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .logo-section {
            text-align: right;
          }
          .logo-section h1 {
            font-size: 28px;
            font-weight: bold;
            color: #333;
            margin-bottom: 5px;
          }
          .logo-section p {
            font-size: 14px;
            color: #666;
            margin-bottom: 3px;
          }
          .invoice-number-section {
            text-align: left;
            background: #f8f8f8;
            padding: 15px;
            border: 1px solid #ddd;
            min-width: 200px;
          }
          .invoice-number-section h2 {
            font-size: 16px;
            color: #333;
            margin-bottom: 8px;
            font-weight: normal;
          }
          .invoice-number-section .number {
            font-size: 24px;
            font-weight: bold;
            color: #333;
          }
          .invoice-number-section .date {
            font-size: 14px;
            color: #666;
            margin-top: 5px;
          }
          .customer-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            gap: 20px;
          }
          .customer-info {
            flex: 1;
            background: #f9f9f9;
            padding: 20px;
            border: 1px solid #ddd;
          }
          .customer-info h3 {
            font-size: 18px;
            margin-bottom: 15px;
            color: #333;
            border-bottom: 1px solid #ddd;
            padding-bottom: 8px;
          }
          .customer-info p {
            font-size: 14px;
            margin-bottom: 8px;
            line-height: 1.4;
          }
          .invoice-details {
            flex: 1;
            background: #f9f9f9;
            padding: 20px;
            border: 1px solid #ddd;
          }
          .invoice-details h3 {
            font-size: 18px;
            margin-bottom: 15px;
            color: #333;
            border-bottom: 1px solid #ddd;
            padding-bottom: 8px;
          }
          .invoice-details p {
            font-size: 14px;
            margin-bottom: 8px;
            line-height: 1.4;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            border: 1px solid #333;
          }
          .items-table th {
            background: #333;
            color: white;
            padding: 12px 8px;
            text-align: right;
            font-size: 14px;
            font-weight: bold;
            border: 1px solid #333;
          }
          .items-table td {
            padding: 12px 8px;
            border: 1px solid #333;
            text-align: right;
            font-size: 13px;
            vertical-align: top;
          }
          .items-table .description {
            text-align: right;
            font-weight: 500;
          }
          .items-table .quantity {
            text-align: center;
            width: 80px;
          }
          .items-table .unit-price {
            text-align: left;
            width: 100px;
          }
          .items-table .total {
            text-align: left;
            width: 100px;
            font-weight: bold;
          }
          .totals-section {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 30px;
          }
          .totals-box {
            background: #f8f8f8;
            border: 2px solid #333;
            padding: 20px;
            min-width: 250px;
            text-align: left;
          }
          .totals-box p {
            font-size: 14px;
            margin-bottom: 8px;
            display: flex;
            justify-content: space-between;
          }
          .totals-box .total-row {
            font-size: 16px;
            font-weight: bold;
            border-top: 2px solid #333;
            padding-top: 10px;
            margin-top: 10px;
          }
          .payment-info {
            background: #e8f4e8;
            border: 1px solid #4caf50;
            padding: 15px;
            margin-bottom: 20px;
            text-align: center;
          }
          .payment-info p {
            font-size: 14px;
            margin-bottom: 5px;
            color: #2e7d32;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 12px;
          }
          .footer p {
            margin-bottom: 5px;
          }
          @media print {
            body { padding: 10px; }
            .invoice-container { border: none; box-shadow: none; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="header">
            <div class="logo-section">
              <h1>דפוס קשת - ד.ע קשת הדפסות בע"מ</h1>
              <p>רח' מורדי הגטאות 15 (הרצל 7 לשעבר) בית שמש (מתחם השוקניון)</p>
              <p>ת.ד. 176 | טל: 077-5120070 | דוא"ל: print@dfus-keshet.com</p>
              <p>אתר: WWW.dfus-keshet.com | ח.פ 514325299</p>
            </div>
            <div class="invoice-number-section">
              <h2>חשבונית מס/קבלה</h2>
              <div class="number">${invoice.invoice_number}</div>
              <div class="date">תאריך: ${new Date(invoice.issue_date).toLocaleDateString('he-IL')}</div>
            </div>
          </div>

          <div class="customer-section">
            <div class="customer-info">
              <h3>פרטי לקוח</h3>
              <p><strong>${invoice.customer_name}</strong></p>
              <p>חשבונית מס/קבלה: ${invoice.customer_id || 'N/A'}</p>
              <p>טלפון: ${invoice.customer_phone || 'N/A'}</p>
              <p>דוא"ל: ${invoice.customer_email || 'N/A'}</p>
              <p>כתובת: ${invoice.customer_address || 'N/A'}</p>
            </div>
            <div class="invoice-details">
              <h3>פרטי חשבונית</h3>
              <p><strong>מספר חשבונית:</strong> ${invoice.invoice_number}</p>
              <p><strong>תאריך הנפקה:</strong> ${new Date(invoice.issue_date).toLocaleDateString('he-IL')}</p>
              <p><strong>תאריך פרעון:</strong> ${new Date(invoice.due_date).toLocaleDateString('he-IL')}</p>
              <p><strong>סטטוס:</strong> <span style="color: ${invoice.status === 'paid' ? '#4caf50' : invoice.status === 'open' ? '#ff9800' : '#f44336'}; font-weight: bold;">${invoice.status === 'paid' ? 'שולם' : invoice.status === 'open' ? 'פתוח' : invoice.status}</span></p>
              <p><strong>סוג מסמך:</strong> ${invoice.invoice_type === 'invoice' ? 'חשבונית מס' : 'קבלה'}</p>
            </div>
          </div>

          ${items && items.length > 0 ? `
          <table class="items-table">
            <thead>
              <tr>
                <th class="description">תיאור השירות/מוצר</th>
                <th class="quantity">כמות</th>
                <th class="unit-price">מחיר יחידה</th>
                <th class="total">סה"כ</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => `
                <tr>
                  <td class="description">${item.description || 'מוצר'}</td>
                  <td class="quantity">${item.quantity || 1}</td>
                  <td class="unit-price">₪${parseFloat(item.unit_price || 0).toLocaleString('he-IL', { minimumFractionDigits: 2 })}</td>
                  <td class="total">₪${parseFloat(item.total || 0).toLocaleString('he-IL', { minimumFractionDigits: 2 })}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          ` : ''}

          <div class="totals-section">
            <div class="totals-box">
              <p><span>סכום בסיס:</span> <span>₪${parseFloat(invoice.subtotal || 0).toLocaleString('he-IL', { minimumFractionDigits: 2 })}</span></p>
              <p><span>מע"מ (${invoice.vat_rate || 17}%):</span> <span>₪${parseFloat(invoice.vat_amount || 0).toLocaleString('he-IL', { minimumFractionDigits: 2 })}</span></p>
              <p class="total-row"><span>סך הכל לתשלום:</span> <span style="color: #4caf50; font-size: 18px;">₪${parseFloat(invoice.total_with_vat || 0).toLocaleString('he-IL', { minimumFractionDigits: 2 })}</span></p>
              ${invoice.status === 'paid' ? '<p style="color: #4caf50; font-weight: bold; text-align: center; margin-top: 10px;">✓ החשבונית שולמה</p>' : invoice.status === 'open' ? '<p style="color: #ff9800; font-weight: bold; text-align: center; margin-top: 10px;">⏳ ממתין לתשלום</p>' : ''}
            </div>
          </div>

          <div class="payment-info">
            <p><strong>אמצעי תשלום:</strong> העברה בנקאית</p>
            <p><strong>בנק דיסקונט (11)</strong></p>
            <p><strong>סניף 167 (בית שמש)</strong></p>
            <p><strong>מספר חשבון: 023756</strong></p>
            <p><strong>ע"ש ד.ע.קשת הדפסות בע"מ</strong></p>
          </div>

          ${invoice.notes ? `
          <div style="margin: 20px 0; padding: 15px; background: #f9f9f9; border: 1px solid #ddd;">
            <h3 style="font-size: 16px; margin-bottom: 10px; color: #333;">הערות</h3>
            <p style="font-size: 13px; line-height: 1.4;">${invoice.notes}</p>
          </div>
          ` : ''}

          <div class="footer">
            <p><strong>דפוס קשת - ד.ע קשת הדפסות בע"מ</strong></p>
            <p>רח' מורדי הגטאות 15 (הרצל 7 לשעבר) בית שמש (מתחם השוקניון)</p>
            <p>ת.ד. 176 | טל: 077-5120070 | דוא"ל: print@dfus-keshet.com</p>
            <p>אתר: WWW.dfus-keshet.com | ח.פ 514325299</p>
            <p>תודה על עסקתך!</p>
          </div>
        </div>
      </body>
      </html>
    `

    printWindow.document.write(htmlContent)
    printWindow.document.close()
    
    printWindow.onload = () => {
      printWindow.print()
      printWindow.close()
    }
  }

  if (standalone) {
    return (
      <div className="p-8">
        <div className="no-print mb-4">
          <button
            onClick={generatePDF}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <FileDown size={20} />
            הדפס חשבונית
          </button>
        </div>
        <div dangerouslySetInnerHTML={{ __html: `
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Arial', 'Helvetica', sans-serif; padding: 20px; direction: rtl; background: white; color: #333; }
            .invoice-container { max-width: 800px; margin: 0 auto; border: 2px solid #333; padding: 30px; background: white; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .logo-section { text-align: right; }
            .logo-section h1 { font-size: 28px; font-weight: bold; color: #333; margin-bottom: 5px; }
            .logo-section p { font-size: 14px; color: #666; margin-bottom: 3px; }
            .invoice-number-section { text-align: left; background: #f8f8f8; padding: 15px; border: 1px solid #ddd; min-width: 200px; }
            .invoice-number-section h2 { font-size: 16px; color: #333; margin-bottom: 8px; font-weight: normal; }
            .invoice-number-section .number { font-size: 24px; font-weight: bold; color: #333; }
            .invoice-number-section .date { font-size: 14px; color: #666; margin-top: 5px; }
            .customer-section { display: flex; justify-content: space-between; margin-bottom: 30px; gap: 20px; }
            .customer-info { flex: 1; background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
            .customer-info h3 { font-size: 18px; margin-bottom: 15px; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 8px; }
            .customer-info p { font-size: 14px; margin-bottom: 8px; line-height: 1.4; }
            .invoice-details { flex: 1; background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
            .invoice-details h3 { font-size: 18px; margin-bottom: 15px; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 8px; }
            .invoice-details p { font-size: 14px; margin-bottom: 8px; line-height: 1.4; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 1px solid #333; }
            .items-table th { background: #333; color: white; padding: 12px 8px; text-align: right; font-size: 14px; font-weight: bold; border: 1px solid #333; }
            .items-table td { padding: 12px 8px; border: 1px solid #333; text-align: right; font-size: 13px; vertical-align: top; }
            .items-table .description { text-align: right; font-weight: 500; }
            .items-table .quantity { text-align: center; width: 80px; }
            .items-table .unit-price { text-align: left; width: 100px; }
            .items-table .total { text-align: left; width: 100px; font-weight: bold; }
            .totals-section { display: flex; justify-content: flex-end; margin-bottom: 30px; }
            .totals-box { background: #f8f8f8; border: 2px solid #333; padding: 20px; min-width: 250px; text-align: left; }
            .totals-box p { font-size: 14px; margin-bottom: 8px; display: flex; justify-content: space-between; }
            .totals-box .total-row { font-size: 16px; font-weight: bold; border-top: 2px solid #333; padding-top: 10px; margin-top: 10px; }
            .payment-info { background: #e8f4e8; border: 1px solid #4caf50; padding: 15px; margin-bottom: 20px; text-align: center; }
            .payment-info p { font-size: 14px; margin-bottom: 5px; color: #2e7d32; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
            .footer p { margin-bottom: 5px; }
          </style>
          <div class="invoice-container">
            <div class="header">
              <div class="logo-section">
                <h1>דפוס קשת - ד.ע קשת הדפסות בע"מ</h1>
                <p>רח' מורדי הגטאות 15 (הרצל 7 לשעבר) בית שמש (מתחם השוקניון)</p>
                <p>ת.ד. 176 | טל: 077-5120070 | דוא"ל: print@dfus-keshet.com</p>
                <p>אתר: WWW.dfus-keshet.com | ח.פ 514325299</p>
              </div>
              <div class="invoice-number-section">
                <h2>חשבונית מס/קבלה</h2>
                <div class="number">${invoice.invoice_number}</div>
                <div class="date">תאריך: ${new Date(invoice.issue_date).toLocaleDateString('he-IL')}</div>
              </div>
            </div>
            <div class="customer-section">
              <div class="customer-info">
                <h3>פרטי לקוח</h3>
                <p><strong>${invoice.customer_name}</strong></p>
                <p>חשבונית מס/קבלה: ${invoice.customer_id || 'N/A'}</p>
                <p>טלפון: ${invoice.customer_phone || 'N/A'}</p>
                <p>דוא"ל: ${invoice.customer_email || 'N/A'}</p>
                <p>כתובת: ${invoice.customer_address || 'N/A'}</p>
              </div>
              <div class="invoice-details">
                <h3>פרטי חשבונית</h3>
                <p><strong>מספר חשבונית:</strong> ${invoice.invoice_number}</p>
                <p><strong>תאריך הנפקה:</strong> ${new Date(invoice.issue_date).toLocaleDateString('he-IL')}</p>
                <p><strong>תאריך פרעון:</strong> ${new Date(invoice.due_date).toLocaleDateString('he-IL')}</p>
                <p><strong>סטטוס:</strong> <span style="color: ${invoice.status === 'paid' ? '#4caf50' : invoice.status === 'open' ? '#ff9800' : '#f44336'}; font-weight: bold;">${invoice.status === 'paid' ? 'שולם' : invoice.status === 'open' ? 'פתוח' : invoice.status}</span></p>
                <p><strong>סוג מסמך:</strong> ${invoice.invoice_type === 'invoice' ? 'חשבונית מס' : 'קבלה'}</p>
              </div>
            </div>
            <div class="totals-section">
              <div class="totals-box">
                <p><span>סכום בסיס:</span> <span>₪${parseFloat(invoice.subtotal || 0).toLocaleString('he-IL', { minimumFractionDigits: 2 })}</span></p>
                <p><span>מע"מ (${invoice.vat_rate || 17}%):</span> <span>₪${parseFloat(invoice.vat_amount || 0).toLocaleString('he-IL', { minimumFractionDigits: 2 })}</span></p>
                <p class="total-row"><span>סך הכל לתשלום:</span> <span style="color: #4caf50; font-size: 18px;">₪${parseFloat(invoice.total_with_vat || 0).toLocaleString('he-IL', { minimumFractionDigits: 2 })}</span></p>
                ${invoice.status === 'paid' ? '<p style="color: #4caf50; font-weight: bold; text-align: center; margin-top: 10px;">✓ החשבונית שולמה</p>' : invoice.status === 'open' ? '<p style="color: #ff9800; font-weight: bold; text-align: center; margin-top: 10px;">⏳ ממתין לתשלום</p>' : ''}
              </div>
            </div>
            <div class="payment-info">
              <p><strong>אמצעי תשלום:</strong> העברה בנקאית</p>
              <p><strong>בנק דיסקונט (11)</strong></p>
              <p><strong>סניף 167 (בית שמש)</strong></p>
              <p><strong>מספר חשבון: 023756</strong></p>
              <p><strong>ע"ש ד.ע.קשת הדפסות בע"מ</strong></p>
            </div>
            ${invoice.notes ? `
            <div style="margin: 20px 0; padding: 15px; background: #f9f9f9; border: 1px solid #ddd;">
              <h3 style="font-size: 16px; margin-bottom: 10px; color: #333;">הערות</h3>
              <p style="font-size: 13px; line-height: 1.4;">${invoice.notes}</p>
            </div>
            ` : ''}
            <div class="footer">
              <p><strong>דפוס קשת - ד.ע קשת הדפסות בע"מ</strong></p>
              <p>רח' מורדי הגטאות 15 (הרצל 7 לשעבר) בית שמש (מתחם השוקניון)</p>
              <p>ת.ד. 176 | טל: 077-5120070 | דוא"ל: print@dfus-keshet.com</p>
              <p>אתר: WWW.dfus-keshet.com | ח.פ 514325299</p>
              <p>תודה על עסקתך!</p>
            </div>
          </div>
        `}} />
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
