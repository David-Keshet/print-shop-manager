import { NextResponse } from 'next/server'
import { invoiceService } from '@/lib/icount/invoiceService'

/**
 * יצירת חשבונית חדשה מהזמנה
 * POST /api/invoices/create
 */
export async function POST(request) {
  try {
    const body = await request.json()
    const { orderId, invoiceType, sync_to_icount } = body

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

    // אם יש צורך בסנכרון ל-iCount
    if (sync_to_icount && result.invoice) {
      try {
        const { syncService } = await import('@/lib/icount/syncService')
        const syncResult = await syncService.pushInvoiceToICount(result.invoice.id)
        
        if (syncResult.success) {
          console.log('✅ Invoice synced to iCount successfully')
        } else {
          console.warn('⚠️ Failed to sync invoice to iCount:', syncResult.message)
        }
      } catch (syncError) {
        console.error('❌ Error syncing to iCount:', syncError)
        // לא מכשיל את התהליך אם הסנכרון נכשל
      }
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
