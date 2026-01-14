import { NextResponse } from 'next/server'
import { invoiceService } from '@/lib/icount/invoiceService'

/**
 * יצירת חשבונית חדשה מהזמנה
 * POST /api/invoices/create
 */
export async function POST(request) {
  try {
    const body = await request.json()
    const { orderId, invoiceType } = body

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // צור חשבונית
    const result = await invoiceService.createInvoiceFromOrder(orderId, invoiceType)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      invoice: result.invoice
    })

  } catch (error) {
    console.error('Error creating invoice:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
