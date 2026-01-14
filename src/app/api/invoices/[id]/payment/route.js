import { NextResponse } from 'next/server'
import { invoiceService } from '@/lib/icount/invoiceService'

/**
 * רישום תשלום על חשבונית
 * POST /api/invoices/[id]/payment
 */
export async function POST(request, { params }) {
  try {
    const { id } = await params
    const body = await request.json()

    const payment = await invoiceService.recordPayment(parseInt(id), body)

    return NextResponse.json({
      success: true,
      payment
    })

  } catch (error) {
    console.error('Error recording payment:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
