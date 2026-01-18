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
            font-family: Arial, sans-serif;
            padding: 40px;
            direction: rtl;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #333;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            font-size: 32px;
            color: #333;
            margin-bottom: 10px;
          }
          .invoice-number {
            font-size: 24px;
            color: #666;
          }
          .customer-info {
            background: #f5f5f5;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
          }
          .customer-info h2 {
            font-size: 20px;
            margin-bottom: 15px;
          }
          .customer-info p {
            font-size: 16px;
            margin-bottom: 8px;
          }
          .invoice-details {
            background: #f9f9f9;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
          }
          .invoice-details h2 {
            font-size: 20px;
            margin-bottom: 15px;
          }
          .invoice-details p {
            font-size: 16px;
            margin-bottom: 8px;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          .items-table th {
            background: #333;
            color: white;
            padding: 12px;
            text-align: right;
            font-size: 16px;
          }
          .items-table td {
            padding: 12px;
            border-bottom: 1px solid #ddd;
            text-align: right;
            font-size: 14px;
          }
          .items-table tr:nth-child(even) {
            background: #f9f9f9;
          }
          .total-section {
            background: #e8f5e8;
            padding: 20px;
            border-radius: 8px;
            text-align: left;
          }
          .total-section p {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 8px;
          }
          .total-section .total {
            font-size: 24px;
            color: #2c5f2d;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
          }
          @media print {
            body { padding: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>חשבונית מס</h1>
          <div class="invoice-number">מספר חשבונית: ${invoice.invoice_number}</div>
        </div>

        <div class="customer-info">
          <h2>פרטי לקוח</h2>
          <p><strong>שם:</strong> ${invoice.customer_name}</p>
          <p><strong>מספר לקוח:</strong> ${invoice.customer_id || 'N/A'}</p>
        </div>

        <div class="invoice-details">
          <h2>פרטי חשבונית</h2>
          <p><strong>תאריך הנפקה:</strong> ${new Date(invoice.issue_date).toLocaleDateString('he-IL')}</p>
          <p><strong>תאריך פרעון:</strong> ${new Date(invoice.due_date).toLocaleDateString('he-IL')}</p>
          <p><strong>סטטוס:</strong> ${invoice.status}</p>
          <p><strong>סוג מסמך:</strong> ${invoice.invoice_type}</p>
        </div>

        ${items && items.length > 0 ? `
        <table class="items-table">
          <thead>
            <tr>
              <th>תיאור</th>
              <th>כמות</th>
              <th>מחיר יחידה</th>
              <th>סה"כ</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td>${item.description || 'מוצר'}</td>
                <td>${item.quantity || 1}</td>
                <td>₪${parseFloat(item.unit_price || 0).toLocaleString('he-IL')}</td>
                <td>₪${parseFloat(item.total || 0).toLocaleString('he-IL')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ` : ''}

        <div class="total-section">
          <p><strong>סכום בסיס:</strong> ₪${parseFloat(invoice.subtotal || 0).toLocaleString('he-IL')}</p>
          <p><strong>מע"מ:</strong> ₪${parseFloat(invoice.vat_amount || 0).toLocaleString('he-IL')}</p>
          <p class="total"><strong>סך הכל:</strong> ₪${parseFloat(invoice.total_with_vat || 0).toLocaleString('he-IL')}</p>
        </div>

        ${invoice.notes ? `
        <div style="margin: 30px 0; padding: 20px; background: #f9f9f9; border-radius: 8px;">
          <h3 style="font-size: 18px; margin-bottom: 10px;">הערות</h3>
          <p style="font-size: 14px; line-height: 1.5;">${invoice.notes}</p>
        </div>
        ` : ''}

        <div class="footer">
          <p>חשבונית זו נוצרה במערכת ניהול בית הדפוס</p>
          <p>תודה על עסקתך!</p>
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
            body { font-family: Arial, sans-serif; padding: 40px; direction: rtl; }
            .header { text-align: center; border-bottom: 3px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { font-size: 32px; color: #333; margin-bottom: 10px; }
            .invoice-number { font-size: 24px; color: #666; }
            .customer-info { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
            .customer-info h2 { font-size: 20px; margin-bottom: 15px; }
            .customer-info p { font-size: 16px; margin-bottom: 8px; }
            .invoice-details { background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
            .invoice-details h2 { font-size: 20px; margin-bottom: 15px; }
            .invoice-details p { font-size: 16px; margin-bottom: 8px; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .items-table th { background: #333; color: white; padding: 12px; text-align: right; font-size: 16px; }
            .items-table td { padding: 12px; border-bottom: 1px solid #ddd; text-align: right; font-size: 14px; }
            .items-table tr:nth-child(even) { background: #f9f9f9; }
            .total-section { background: #e8f5e8; padding: 20px; border-radius: 8px; text-align: left; }
            .total-section p { font-size: 18px; font-weight: bold; margin-bottom: 8px; }
            .total-section .total { font-size: 24px; color: #2c5f2d; }
            .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
          </style>
          <div class="header">
            <h1>חשבונית מס</h1>
            <div class="invoice-number">מספר חשבונית: ${invoice.invoice_number}</div>
          </div>
          <div class="customer-info">
            <h2>פרטי לקוח</h2>
            <p><strong>שם:</strong> ${invoice.customer_name}</p>
            <p><strong>מספר לקוח:</strong> ${invoice.customer_id || 'N/A'}</p>
          </div>
          <div class="invoice-details">
            <h2>פרטי חשבונית</h2>
            <p><strong>תאריך הנפקה:</strong> ${new Date(invoice.issue_date).toLocaleDateString('he-IL')}</p>
            <p><strong>תאריך פרעון:</strong> ${new Date(invoice.due_date).toLocaleDateString('he-IL')}</p>
            <p><strong>סטטוס:</strong> ${invoice.status}</p>
            <p><strong>סוג מסמך:</strong> ${invoice.invoice_type}</p>
          </div>
          <div class="total-section">
            <p><strong>סכום בסיס:</strong> ₪${parseFloat(invoice.subtotal || 0).toLocaleString('he-IL')}</p>
            <p><strong>מע"מ:</strong> ₪${parseFloat(invoice.vat_amount || 0).toLocaleString('he-IL')}</p>
            <p class="total"><strong>סך הכל:</strong> ₪${parseFloat(invoice.total_with_vat || 0).toLocaleString('he-IL')}</p>
          </div>
          ${invoice.notes ? `
          <div style="margin: 30px 0; padding: 20px; background: #f9f9f9; border-radius: 8px;">
            <h3 style="font-size: 18px; margin-bottom: 10px;">הערות</h3>
            <p style="font-size: 14px; line-height: 1.5;">${invoice.notes}</p>
          </div>
          ` : ''}
          <div class="footer">
            <p>חשבונית זו נוצרה במערכת ניהול בית הדפוס</p>
            <p>תודה על עסקתך!</p>
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
