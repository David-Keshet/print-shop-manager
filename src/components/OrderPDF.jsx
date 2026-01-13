'use client'

import { FileDown } from 'lucide-react'

export default function OrderPDF({ order, items, standalone = false }) {
  const generatePDF = () => {
    // יצירת חלון חדש עם תוכן ה-PDF
    const printWindow = window.open('', '_blank')

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>הזמנה ${order.order_number}</title>
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
          .order-number {
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
            color: #333;
          }
          .info-row {
            display: flex;
            margin-bottom: 10px;
            font-size: 16px;
          }
          .info-label {
            font-weight: bold;
            width: 120px;
            color: #555;
          }
          .info-value {
            color: #333;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          th {
            background: #333;
            color: white;
            padding: 12px;
            text-align: right;
            font-size: 16px;
          }
          td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: right;
            font-size: 15px;
          }
          tr:nth-child(even) {
            background: #f9f9f9;
          }
          .totals {
            margin-top: 30px;
            border-top: 2px solid #333;
            padding-top: 20px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 10px;
            font-size: 18px;
          }
          .total-row.final {
            background: #333;
            color: white;
            font-size: 22px;
            font-weight: bold;
            padding: 15px;
            border-radius: 5px;
          }
          .footer {
            margin-top: 50px;
            text-align: center;
            color: #666;
            font-size: 14px;
            border-top: 1px solid #ddd;
            padding-top: 20px;
          }
          @media print {
            body { padding: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🖨️ הזמנת דפוס</h1>
          <div class="order-number">הזמנה מספר: ${order.order_number}</div>
        </div>

        <div class="customer-info">
          <h2>פרטי לקוח</h2>
          <div class="info-row">
            <span class="info-label">שם לקוח לחשבונית:</span>
            <span class="info-value">${order.customer_name}</span>
          </div>
          <div class="info-row">
            <span class="info-label">טלפון:</span>
            <span class="info-value">${order.customer_phone}</span>
          </div>
          ${order.contact_person ? `
          <div class="info-row">
            <span class="info-label">איש קשר:</span>
            <span class="info-value">${order.contact_person}</span>
          </div>
          ` : ''}
          ${order.id_number ? `
          <div class="info-row">
            <span class="info-label">ת"ז / ח.פ:</span>
            <span class="info-value">${order.id_number}</span>
          </div>
          ` : ''}
          <div class="info-row">
            <span class="info-label">תאריך:</span>
            <span class="info-value">${new Date(order.created_at).toLocaleDateString('he-IL')}</span>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 50%">תיאור</th>
              <th style="width: 15%">כמות</th>
              <th style="width: 15%">מחיר יחידה</th>
              <th style="width: 20%">סה"כ</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td>
                  <div style="font-weight: bold;">${item.description}</div>
                  ${item.notes ? `<div style="font-size: 12px; color: #666; margin-top: 4px;">📂 מיקום קובץ: ${item.notes}</div>` : ''}
                </td>
                <td>${item.quantity}</td>
                <td>₪${(item.unit_price || (item.price / item.quantity) || 0).toFixed(2)}</td>
                <td>₪${(item.price || 0).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <div class="total-row">
            <span>סה"כ לפני מע"מ:</span>
            <span>₪${order.total.toFixed(2)}</span>
          </div>
          <div class="total-row">
            <span>מע"מ (18%):</span>
            <span>₪${order.vat.toFixed(2)}</span>
          </div>
          <div class="total-row final">
            <span>סה"כ לתשלום:</span>
            <span>₪${order.total_with_vat.toFixed(2)}</span>
          </div>
        </div>

        <div class="footer">
          <p>תודה שבחרת בשירותי הדפוס שלנו! 🎨</p>
          <p>במקרה של שאלות, צור קשר בטלפון: ${order.customer_phone}</p>
        </div>

        <div class="no-print" style="margin-top: 30px; text-align: center;">
          <button onclick="window.print()" style="
            background: #333;
            color: white;
            padding: 15px 30px;
            border: none;
            border-radius: 8px;
            font-size: 18px;
            cursor: pointer;
            font-family: Arial;
          ">
            🖨️ הדפס / שמור כ-PDF
          </button>
          <button onclick="window.close()" style="
            background: #666;
            color: white;
            padding: 15px 30px;
            border: none;
            border-radius: 8px;
            font-size: 18px;
            cursor: pointer;
            margin-right: 10px;
            font-family: Arial;
          ">
            ✖️ סגור
          </button>
        </div>
      </body>
      </html>
    `

    printWindow.document.write(htmlContent)
    printWindow.document.close()
  }

  if (standalone) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              הזמנה מספר #{order.order_number}
            </h2>
            <p className="text-gray-600">
              לקוח: {order.customer_name} | טלפון: {order.customer_phone}
            </p>
            {order.contact_person && (
              <p className="text-gray-600">
                איש קשר: {order.contact_person}
              </p>
            )}
            {order.id_number && (
              <p className="text-gray-600">
                ת"ז / ח.פ: {order.id_number}
              </p>
            )}
            <p className="text-gray-600 mt-1">
              תאריך: {new Date(order.created_at).toLocaleDateString('he-IL')}
            </p>
          </div>

          <div className="mb-6 bg-blue-50 p-4 rounded-xl inline-block">
            <p className="text-sm text-gray-600 mb-1">סה"כ לתשלום</p>
            <p className="text-4xl font-extrabold text-blue-700">
              ₪{order.total_with_vat.toFixed(2)}
            </p>
          </div>

          <div className="max-w-md mx-auto">
            <button
              onClick={generatePDF}
              className="btn-primary w-full flex items-center justify-center gap-2 text-lg py-4"
            >
              <FileDown size={24} />
              הורד / הדפס PDF
            </button>
            <p className="text-xs text-gray-500 mt-3">
              לחץ על הכפתור להצגת המסמך בחלון חדש
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={generatePDF}
      className="btn-secondary w-full flex items-center justify-center gap-2 mt-3"
    >
      <FileDown size={20} />
      הורד PDF להזמנה #{order.order_number}
    </button>
  )
}
