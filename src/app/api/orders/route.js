/**
 * Orders API Route
 */

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    const body = await request.json()
    console.log('📦 Creating order:', body)

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        ...body,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (orderError) {
      console.error('❌ Order creation error:', orderError)
      return NextResponse.json(
        { success: false, error: orderError.message },
        { status: 500 }
      )
    }

    console.log('✅ Order created:', order)

    return NextResponse.json({
      success: true,
      data: order
    })

  } catch (error) {
    console.error('❌ API error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Return mock data for now to test the UI
    const mockOrders = [
      {
        id: 1,
        order_number: 'IC-2000',
        customer_name: 'משרד ראש הממשלה',
        customer_phone: '0523992300',
        customer_email: 'print@dfus-keshet.com',
        total_with_vat: 1907.05,
        status: 'חדש',
        icount_doc_number: '2000',
        icount_doc_type: 'invoice',
        icount_client_id: '6',
        icount_date: '2026-01-14',
        icount_total: 1907.05,
        notes: 'חשבונית מספר 2000 מ-iCount סונכרנה בהצלחה!',
        created_at: new Date().toISOString()
      }
    ];

    return NextResponse.json({
      success: true,
      data: mockOrders
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
