import { NextResponse } from 'next/server'
import { invoiceService } from '@/lib/icount/invoiceService'

/**
 * קבלת פרטי חשבונית ספציפית
 * GET /api/invoices/[id]
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params
    
    // השתמש רק ב-mock data ללא תלות ל-service
    const mockInvoices = [
      {
        id: 1,
        invoice_number: '2000',
        customer_name: 'משרד ראש הממשלה',
        customer_id: 'CUST-001',
<<<<<<< C:\Users\print\print-shop-manager\src\app\api\invoices\[id]\route.js
=======
        customer_phone: '03-1234567',
        customer_email: 'office@pmo.gov.il',
        customer_address: 'רח' הקפלן 3, ירושלים',
>>>>>>> c:\Users\print\.windsurf\worktrees\print-shop-manager\print-shop-manager-7ac386d5\src\app\api\invoices\[id]\route.js
        invoice_type: 'invoice',
        status: 'open',
        issue_date: '2024-01-15',
        due_date: '2024-02-15',
        subtotal: 1000,
        vat_amount: 170,
<<<<<<< C:\Users\print\print-shop-manager\src\app\api\invoices\[id]\route.js
=======
        vat_rate: 17,
>>>>>>> c:\Users\print\.windsurf\worktrees\print-shop-manager\print-shop-manager-7ac386d5\src\app\api\invoices\[id]\route.js
        total_with_vat: 1170,
        notes: 'תשלומים עבור שירותי הדפסה',
        items: [
          {
            id: 1,
            description: 'הדפסת חוברות',
            quantity: 500,
            unit_price: 2,
            total: 1000
          }
        ]
<<<<<<< C:\Users\print\print-shop-manager\src\app\api\invoices\[id]\route.js
=======
      },
      {
        id: 2,
        invoice_number: '2001',
        customer_name: 'עיריית תל אביב',
        customer_id: 'CUST-002',
        customer_phone: '03-9211111',
        customer_email: 'info@tel-aviv.gov.il',
        customer_address: 'רח' איבן גבירול 69, תל אביב',
        invoice_type: 'invoice',
        status: 'paid',
        issue_date: '2024-01-20',
        due_date: '2024-02-20',
        subtotal: 2500,
        vat_amount: 425,
        vat_rate: 17,
        total_with_vat: 2925,
        notes: 'הדפסת כרזות וחוברות לעירייה',
        items: [
          {
            id: 1,
            description: 'הדפסת כרזות',
            quantity: 100,
            unit_price: 15,
            total: 1500
          },
          {
            id: 2,
            description: 'הדפסת חוברות',
            quantity: 200,
            unit_price: 5,
            total: 1000
          }
        ]
      },
      {
        id: 3,
        invoice_number: '2002',
        customer_name: 'בנק לאומי',
        customer_id: 'CUST-003',
        customer_phone: '03-6234234',
        customer_email: 'service@leumi.co.il',
        customer_address: 'רח' הרצל 21, תל אביב',
        invoice_type: 'receipt',
        status: 'open',
        issue_date: '2024-01-25',
        due_date: '2024-02-25',
        subtotal: 800,
        vat_amount: 136,
        vat_rate: 17,
        total_with_vat: 936,
        notes: 'הדפסת טפסים ומסמכים פנימיים',
        items: [
          {
            id: 1,
            description: 'הדפסת טפסים',
            quantity: 1000,
            unit_price: 0.8,
            total: 800
          }
        ]
>>>>>>> c:\Users\print\.windsurf\worktrees\print-shop-manager\print-shop-manager-7ac386d5\src\app\api\invoices\[id]\route.js
      }
    ]
    
    const invoice = mockInvoices.find(inv => inv.id === parseInt(id))
    const items = invoice ? invoice.items : []
    
    if (!invoice) {
      return NextResponse.json(
        { success: false, error: 'חשבונית לא נמצאה' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      invoice,
      items: items || []
    })
  } catch (error) {
    console.error('Error fetching invoice:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

/**
 * עדכון חשבונית
 * PUT /api/invoices/[id]
 */
export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const body = await request.json()

    const invoice = await invoiceService.updateInvoice(parseInt(id), body)

    return NextResponse.json({
      success: true,
      invoice
    })

  } catch (error) {
    console.error('Error updating invoice:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

/**
 * ביטול חשבונית
 * DELETE /api/invoices/[id]
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const reason = searchParams.get('reason') || 'בוטל ע"י משתמש'

    const invoice = await invoiceService.cancelInvoice(parseInt(id), reason)

    return NextResponse.json({
      success: true,
      invoice
    })

  } catch (error) {
    console.error('Error cancelling invoice:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
