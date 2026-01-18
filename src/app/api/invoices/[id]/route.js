import { NextResponse } from 'next/server'
import { invoiceService } from '@/lib/icount/invoiceService'

/**
 * קבלת פרטי חשבונית ספציפית
 * GET /api/invoices/[id]
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params
    const invoice = await invoiceService.getInvoice(parseInt(id))
    const items = await invoiceService.getInvoiceItems(parseInt(id))

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
