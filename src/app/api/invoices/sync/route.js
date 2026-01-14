import { NextResponse } from 'next/server'
import { invoiceService } from '@/lib/icount/invoiceService'

/**
 * סנכרון חשבונית ספציפית עם iCount
 * POST /api/invoices/sync?invoice_id=123
 */
export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url)
    const invoiceId = searchParams.get('invoice_id')

    if (!invoiceId) {
      return NextResponse.json(
        { success: false, error: 'invoice_id is required' },
        { status: 400 }
      )
    }

    const result = await invoiceService.syncToICount(parseInt(invoiceId))

    return NextResponse.json(result)

  } catch (error) {
    console.error('Error syncing invoice:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

/**
 * סנכרון כל החשבוניות הממתינות
 * GET /api/invoices/sync
 */
export async function GET(request) {
  try {
    const results = await invoiceService.syncPendingInvoices()

    return NextResponse.json({
      success: true,
      results
    })

  } catch (error) {
    console.error('Error syncing pending invoices:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
