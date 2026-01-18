import { NextResponse } from 'next/server'
import { invoiceService } from '@/lib/icount/invoiceService'

/**
 * קבלת רשימת מסמכים/חשבוניות
 * GET /api/invoices
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const filters = {
      status: searchParams.get('status'),
      customer_id: searchParams.get('customer_id'),
      payment_status: searchParams.get('payment_status'),
      invoice_type: searchParams.get('invoice_type')
    }

    const invoices = await invoiceService.getInvoices(filters)

    return NextResponse.json({
      success: true,
      invoices
    })
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

/**
 * יצירת חשבונית חדשה מהזמנה
 * POST /api/invoices
 */
export async function POST(request) {
  try {
    const body = await request.json()
    const { order_id, invoice_type } = body

    if (!order_id) {
      return NextResponse.json(
        { success: false, error: 'order_id is required' },
        { status: 400 }
      )
    }

    const result = await invoiceService.createInvoiceFromOrder(
      parseInt(order_id),
      invoice_type
    )

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      invoice: result.invoice,
      message: 'חשבונית נוצרה בהצלחה'
    })

  } catch (error) {
    console.error('Error creating invoice:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

