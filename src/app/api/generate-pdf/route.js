import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { invoice, items, customerName, customerPhone, subtotal, vatAmount, totalWithVat } = await request.json()

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
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
    }
    .top-section { margin-bottom: 24px; }
    .business-details { text-align: left; }
    .business-details h1 { font-size: 20px; font-weight: bold; margin-bottom: 8px; }
    .business-details p { font-size: 16px; margin-bottom: 4px; color: #666; }
    .invoice-title-section { text-align: center; margin-top: 16px; }
    .invoice-title-section h2 { font-size: 32px; font-weight: bold; color: #E53E3E; margin: 0; }
    .border-t-2 { border-top: 2px solid #333; }
    .details-section { margin-bottom: 24px; }
    .customer-details-box { 
      background: #f9f9f9; 
      border: 1px solid #ddd; 
      padding: 16px; 
      border-radius: 5px; 
      width: 350px;
    }
    .customer-details-box h3 { font-size: 16px; font-weight: bold; margin-bottom: 12px; }
    .customer-details-box p { font-size: 14px; margin-bottom: 4px; }
    .invoice-details-box { 
      background: #f9f9f9; 
      border: 1px solid #ddd; 
      padding: 16px; 
      border-radius: 5px; 
      width: 250px;
    }
    .invoice-details-box h3 { font-size: 16px; font-weight: bold; margin-bottom: 12px; }
    .invoice-details-box p { font-size: 14px; margin-bottom: 4px; }
    .items-section { margin-bottom: 24px; }
    .bottom-section { margin-bottom: 24px; }
    .bank-transfer-box { 
      background: #e8f5e8; 
      border: 1px solid #4caf50; 
      padding: 16px; 
      border-radius: 5px; 
      width: 300px;
    }
    .bank-transfer-box h3 { font-size: 16px; font-weight: bold; margin-bottom: 12px; color: #2e7d32; }
    .bank-transfer-box p { font-size: 14px; margin-bottom: 8px; color: #2e7d32; }
    .total-summary-box { 
      background: #f5f5f5; 
      border: 2px solid #333; 
      padding: 16px; 
      border-radius: 5px; 
      width: 300px;
    }
    .total-summary-box h3 { font-size: 16px; font-weight: bold; margin-bottom: 12px; }
    .total-summary-box p { font-size: 14px; margin-bottom: 8px; display: flex; justify-content: space-between; }
    .total-summary-box .total-row { 
      font-weight: bold; 
      border-top: 2px solid #333; 
      padding-top: 12px; 
      margin-top: 8px; 
    }
    .footer-section { margin-top: auto; }
    .signature-section { text-align: right; }
    .digital-signature { 
      height: 80px; 
      width: auto; 
      margin-bottom: 8px; 
    }
    .signature-section p { font-size: 14px; color: #666; }
    .thank-you-section { text-align: left; }
    .thank-you-section p { font-size: 18px; color: #374151; font-weight: 500; }
    .w-full { width: 100%; }
    .border-collapse { border-collapse: collapse; }
    .border { border: 1px solid #333; }
    .border-gray-800 { border-color: #333; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .text-left { text-align: left; }
    .p-3 { padding: 12px; }
    .text-sm { font-size: 14px; }
    .font-bold { font-weight: bold; }
    .leading-relaxed { line-height: 1.5; }
    .font-medium { font-weight: 500; }
    .mt-4 { margin-top: 16px; }
    .flex { display: flex; }
    .justify-between { justify-content: space-between; }
    .items-start { align-items: flex-start; }
    .mb-6 { margin-bottom: 24px; }
    .mb-8 { margin-bottom: 32px; }
  </style>
</head>
<body>
  <div class="invoice">
    <!-- Top Section -->
    <div class="top-section">
      <div class="flex justify-between items-start">
        <!-- Left side - Logo -->
        <div class="logo-section">
          <img src="/Logo .png" alt="לוגו דפוס קשת" class="company-logo" />
        </div>
        
        <!-- Right side - Business Details -->
        <div class="business-details">
          <h1>דפוס קשת - ד.ע קשת הדפסות בע"מ</h1>
          <p>רח' מורדי הגטאות 15, בית שמש</p>
          <p>טל: 077-5120070 | דוא"ל: print@dfus-keshet.com</p>
          <p>ח.פ 514325299</p>
        </div>
      </div>
      
      <!-- Tax Invoice Title -->
      <div class="invoice-title-section text-center mt-4">
        <h2>חשבונית מס</h2>
      </div>
      
      <!-- Dividing Line -->
      <div class="border-t-2 border-gray-800 mt-4"></div>
    </div>

    <!-- Customer and Invoice Details Section -->
    <div class="details-section flex justify-between mb-6">
      <!-- Right side - Customer Details -->
      <div class="customer-details-box">
        <h3>לכבוד</h3>
        <p><strong>שם לקוח:</strong> ${customerName}</p>
        <p><strong>כתובת:</strong> ${invoice.customer_address || 'N/A'}</p>
        <p><strong>טלפון:</strong> ${customerPhone || 'N/A'}</p>
        <p><strong>דוא"ל:</strong> ${invoice.customer_email || 'N/A'}</p>
      </div>
      
      <!-- Left side - Invoice Details -->
      <div class="invoice-details-box">
        <h3>פרטי חשבונית</h3>
        <p><strong>מספר חשבונית:</strong> ${invoice.invoice_number}</p>
        <p><strong>תאריך הוצאה:</strong> ${new Date(invoice.issue_date || invoice.created_at || new Date()).toLocaleDateString('he-IL')}</p>
        <p><strong>תאריך יעד:</strong> ${new Date(new Date(invoice.issue_date || invoice.created_at || new Date()).getTime() + 60 * 24 * 60 * 60 * 1000).toLocaleDateString('he-IL')}</p>
      </div>
    </div>

    <!-- Items Table -->
    ${items && items.length > 0 ? `
    <div class="items-section mb-6">
      <table class="w-full border-collapse border border-gray-800">
        <thead>
          <tr>
            <th class="text-right p-3 text-sm font-bold border border-gray-800">תיאור</th>
            <th class="text-center p-3 text-sm font-bold border border-gray-800" style="width: 80px;">כמות</th>
            <th class="text-left p-3 text-sm font-bold border border-gray-800" style="width: 100px;">מחיר יחידה</th>
            <th class="text-left p-3 text-sm font-bold border border-gray-800" style="width: 100px;">סה"כ</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr>
              <td class="text-right p-3 text-sm leading-relaxed font-medium border border-gray-800">${item.description || 'מוצר'}</td>
              <td class="text-center p-3 text-sm border border-gray-800">${item.quantity || 1}</td>
              <td class="text-left p-3 text-sm border border-gray-800">₪${parseFloat(item.unit_price || 0).toFixed(2)}</td>
              <td class="text-left p-3 text-sm font-bold border border-gray-800">₪${parseFloat(item.total || 0).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}

    <!-- Bottom Section - Two Boxes -->
    <div class="bottom-section flex justify-between mb-6">
      <!-- Right side - Bank Transfer -->
      <div class="bank-transfer-box">
        <h3>להעברה בנקאית</h3>
        <p><strong>בנק:</strong> דיסקונט (11) | סניף 167 (בית שמש)</p>
        <p><strong>חשבון:</strong> 023756 | ע"ש ד.ע.קשת הדפסות בע"מ</p>
      </div>
      
      <!-- Left side - Total Summary -->
      <div class="total-summary-box">
        <h3>סיכום כסלי</h3>
        <p><span>סכום בסיס:</span> <span>₪${parseFloat(subtotal || 0).toFixed(2)}</span></p>
        <p><span>מע"מ (${invoice.vat_rate || 18}%):</span> <span>₪${parseFloat(vatAmount || 0).toFixed(2)}</span></p>
        <p class="total-row"><span>סך הכל:</span> <span style="color: #4caf50; font-size: 18px;">₪${parseFloat(totalWithVat || 0).toFixed(2)}</span></p>
      </div>
    </div>

    <!-- Footer Section -->
    <div class="footer-section mt-auto">
      <div class="flex justify-between items-end">
        <!-- Left corner - Digital Signature -->
        <div class="signature-section text-right">
          <img src="/Signature .jpg" alt="חתימה דיגיטלית" class="digital-signature" />
          <p><strong>דפוס קשת - ד.ע קשת הדפסות בע"מ</strong></p>
        </div>
        
        <!-- Thank you message -->
        <div class="thank-you-section text-left">
          <p>תודה על העסקתך!</p>
        </div>
      </div>
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
    console.error('Error generating PDF HTML:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
