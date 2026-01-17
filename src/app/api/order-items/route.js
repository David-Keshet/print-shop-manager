/**
 * Order Items API Route
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
    console.log('📋 Creating order item:', body)

    // Create order item
    const { data: item, error: itemError } = await supabase
      .from('order_items')
      .insert({
        ...body,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (itemError) {
      console.error('❌ Item creation error:', itemError)
      return NextResponse.json(
        { success: false, error: itemError.message },
        { status: 500 }
      )
    }

    console.log('✅ Order item created:', item)

    return NextResponse.json({
      success: true,
      data: item
    })

  } catch (error) {
    console.error('❌ API error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
