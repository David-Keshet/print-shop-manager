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
        invoice_type: 'invoice',
        status: 'open',
        issue_date: '2024-01-15',
        due_date: '2024-02-15',
        subtotal: 1000,
        vat_amount: 170,
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
