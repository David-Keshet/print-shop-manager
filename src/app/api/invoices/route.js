import { NextResponse } from 'next/server'
import { invoiceService } from '@/lib/icount/invoiceService'

// קבלת רשימת חשבוניות
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)

    const filters = {}
    if (searchParams.get('status')) {
      filters.status = searchParams.get('status')
    }
    if (searchParams.get('customer_id')) {
      filters.customer_id = parseInt(searchParams.get('customer_id'))
    }
    if (searchParams.get('payment_status')) {
      filters.payment_status = searchParams.get('payment_status')
    }

    const invoices = await invoiceService.getInvoices(filters)

    return NextResponse.json({ success: true, invoices })
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// יצירת חשבונית חדשה
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
      order_id,
      invoice_type
    )

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error creating invoice:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
