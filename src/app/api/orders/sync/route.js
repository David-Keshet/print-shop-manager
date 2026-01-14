import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * Sync offline order to Supabase
 * POST /api/orders/sync
 */
export async function POST(request) {
  try {
    const order = await request.json()

    if (!order || !order.id) {
      return NextResponse.json(
        { success: false, error: 'Invalid order data' },
        { status: 400 }
      )
    }

    // Check if order already exists
    const { data: existing, error: checkError } = await supabase
      .from('orders')
      .select('id, order_number')
      .eq('id', order.id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 = not found, which is OK
      throw checkError
    }

    if (existing) {
      // Update existing order
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          ...order,
          sync_status: 'synced',
          synced_at: new Date().toISOString(),
          is_offline: false,
          last_modified_at: new Date().toISOString()
        })
        .eq('id', order.id)

      if (updateError) throw updateError

      return NextResponse.json({
        success: true,
        message: 'Order updated',
        order_number: existing.order_number
      })
    } else {
      // Get next order number from sequence
      const { data: seqData, error: seqError } = await supabase
        .rpc('get_next_order_number')

      if (seqError) throw seqError

      const orderNumber = seqData?.[0]?.next_number || seqData

      // Insert new order
      const { error: insertError } = await supabase
        .from('orders')
        .insert({
          ...order,
          order_number: orderNumber,
          sync_status: 'synced',
          synced_at: new Date().toISOString(),
          is_offline: false,
          created_at: order.created_at || new Date().toISOString(),
          last_modified_at: new Date().toISOString()
        })

      if (insertError) throw insertError

      return NextResponse.json({
        success: true,
        message: 'Order created',
        order_number: orderNumber
      })
    }
  } catch (error) {
    console.error('Sync order error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to sync order'
      },
      { status: 500 }
    )
  }
}

/**
 * Get orders that need syncing
 * GET /api/orders/sync?since=<timestamp>
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const since = searchParams.get('since')

    let query = supabase
      .from('orders')
      .select('*')
      .order('last_modified_at', { ascending: false })

    if (since) {
      query = query.gte('last_modified_at', since)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({
      success: true,
      orders: data || [],
      count: data?.length || 0
    })
  } catch (error) {
    console.error('Get sync orders error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get orders'
      },
      { status: 500 }
    )
  }
}
