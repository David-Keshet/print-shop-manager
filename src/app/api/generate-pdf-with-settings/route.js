import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { invoice, items, customerName, customerPhone, subtotal, vatAmount, totalWithVat, settings } = await request.json()

    const htmlContent = `<!DOCTYPE html>
<html dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>חשבונית ${invoice.invoice_number}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: Arial, sans-serif; 
      padding: 20px; 
      direction: rtl; 
      background: white; 
      margin: 0;
      padding: 0;
    }
    @page {
      size: A4;
      margin: 15mm;
    }
    .invoice { 
      width: 210mm; 
      max-width: 210mm; 
      margin: 0 auto; 
      border: 1px solid #ccc; 
      padding: 20px; 
      min-height: 297mm;
      position: relative;
      box-sizing: border-box;
    }
    .element {
      position: absolute;
      border: 1px solid #ddd;
      background: white;
      padding: 10px;
      border-radius: 4px;
    }
    .logo-element {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .logo-element img {
      max-width: 100%;
      max-height: 100%;
    }
    .company-info-element h1 { font-size: 16px; margin-bottom: 4px; }
    .company-info-element p { font-size: 12px; margin-bottom: 2px; color: #666; }
    .invoice-number-element h2 { font-size: 18px; font-weight: bold; color: #E53E3E; margin-bottom: 4px; }
    .invoice-number-element p { font-size: 12px; margin-bottom: 2px; }
    .customer-info-element h3 { font-size: 14px; font-weight: bold; margin-bottom: 6px; }
    .customer-info-element p { font-size: 12px; margin-bottom: 2px; }
    .table-element { 
      width: 100%; 
      border-collapse: collapse; 
      font-size: 12px;
    }
    .table-element th, .table-element td { 
      border: 1px solid #ddd; 
      padding: 8px; 
      text-align: right; 
    }
    .table-element th { background: #333; color: white; }
    .totals-element p { 
      font-size: 12px; 
      margin-bottom: 4px; 
      display: flex; 
      justify-content: space-between; 
    }
    .totals-element .total { 
      font-weight: bold; 
      border-top: 1px solid #333; 
      padding-top: 4px; 
      margin-top: 8px; 
    }
    .payment-element p { 
      font-size: 12px; 
      margin-bottom: 2px; 
    }
    .signature-element img {
      max-width: 100%;
      max-height: 100%;
    }
    .footer-element p {
      font-size: 12px;
      text-align: center;
    }
    @media print {
      body { padding: 0; margin: 0; }
      .invoice { border: none; box-shadow: none; }
      .element { border: 1px solid #333; }
    }
  </style>
</head>
<body>
  <div class="invoice">
    <!-- Logo -->
    <div class="element logo-element" style="left: ${settings.logoPosition.x}px; top: ${settings.logoPosition.y}px; width: ${settings.logoPosition.width}px; height: ${settings.logoPosition.height}px;">
      <img src="/Logo .png" alt="לוגו" />
    </div>

    <!-- Company Info -->
    <div class="element company-info-element" style="left: ${settings.companyInfoPosition.x}px; top: ${settings.companyInfoPosition.y}px; width: ${settings.companyInfoPosition.width}px; height: ${settings.companyInfoPosition.height}px;">
      <h1>דפוס קשת - ד.ע קשת הדפסות בע"מ</h1>
      <p>רח' מורדי הגטאות 15, בית שמש</p>
      <p>טל: 077-5120070 | דוא"ל: print@dfus-keshet.com</p>
      <p>ח.פ 514325299</p>
    </div>

    <!-- Invoice Number -->
    <div class="element invoice-number-element" style="left: ${settings.invoiceNumberPosition.x}px; top: ${settings.invoiceNumberPosition.y}px; width: ${settings.invoiceNumberPosition.width}px; height: ${settings.invoiceNumberPosition.height}px;">
      <h2>חשבונית מס</h2>
      <p><strong>מספר:</strong> ${invoice.invoice_number}</p>
      <p><strong>תאריך:</strong> ${new Date(invoice.issue_date || invoice.created_at || new Date()).toLocaleDateString('he-IL')}</p>
      <p><strong>תאריך יעד:</strong> ${new Date(new Date(invoice.issue_date || invoice.created_at || new Date()).getTime() + 60 * 24 * 60 * 60 * 1000).toLocaleDateString('he-IL')}</p>
    </div>

    <!-- Customer Info -->
    <div class="element customer-info-element" style="left: ${settings.customerInfoPosition.x}px; top: ${settings.customerInfoPosition.y}px; width: ${settings.customerInfoPosition.width}px; height: ${settings.customerInfoPosition.height}px;">
      <h3>לכבוד</h3>
      <p><strong>שם:</strong> ${customerName}</p>
      <p><strong>כתובת:</strong> ${invoice.customer_address || 'N/A'}</p>
      <p><strong>טלפון:</strong> ${customerPhone || 'N/A'}</p>
      <p><strong>דוא"ל:</strong> ${invoice.customer_email || 'N/A'}</p>
    </div>

    <!-- Items Table -->
    ${items && items.length > 0 ? `
    <div class="element table-element" style="left: ${settings.itemsTablePosition.x}px; top: ${settings.itemsTablePosition.y}px; width: ${settings.itemsTablePosition.width}px; height: ${settings.itemsTablePosition.height}px;">
      <table>
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
              <td>₪${parseFloat(item.unit_price || 0).toFixed(2)}</td>
              <td>₪${parseFloat(item.total || 0).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}

    <!-- Totals -->
    <div class="element totals-element" style="left: ${settings.totalsPosition.x}px; top: ${settings.totalsPosition.y}px; width: ${settings.totalsPosition.width}px; height: ${settings.totalsPosition.height}px;">
      <p><span>סכום בסיס:</span> <span>₪${parseFloat(subtotal || 0).toFixed(2)}</span></p>
      <p><span>מע"מ:</span> <span>₪${parseFloat(vatAmount || 0).toFixed(2)}</span></p>
      <p class="total"><span>סך הכל:</span> <span style="color: #4caf50;">₪${parseFloat(totalWithVat || 0).toFixed(2)}</span></p>
    </div>

    <!-- Payment Info -->
    <div class="element payment-element" style="left: ${settings.paymentInfoPosition.x}px; top: ${settings.paymentInfoPosition.y}px; width: ${settings.paymentInfoPosition.width}px; height: ${settings.paymentInfoPosition.height}px;">
      <p><strong>להעברה בנקאית</strong></p>
      <p><strong>בנק:</strong> דיסקונט (11) | סניף 167 (בית שמש)</p>
      <p><strong>חשבון:</strong> 023756 | ע"ש ד.ע.קשת הדפסות בע"מ</p>
    </div>

    <!-- Signature -->
    <div class="element signature-element" style="left: ${settings.signaturePosition.x}px; top: ${settings.signaturePosition.y}px; width: ${settings.signaturePosition.width}px; height: ${settings.signaturePosition.height}px;">
      <img src="/Signature .jpg" alt="חתימה" />
    </div>

    <!-- Footer -->
    <div class="element footer-element" style="left: ${settings.footerPosition.x}px; top: ${settings.footerPosition.y}px; width: ${settings.footerPosition.width}px; height: ${settings.footerPosition.height}px;">
      <p>תודה על העסקתך!</p>
    </div>
  </div>
</body>
</html>`

    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    })
  } catch (error) {
    console.error('Error generating PDF with settings:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
