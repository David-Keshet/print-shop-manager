import { NextResponse } from 'next/server'
import cachedSupabase from '@/lib/cache/cachedSupabase'

/**
 * הזמנות אחרונות עם cache
 * GET /api/cache/orders?limit=100&type=recent|active
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const type = searchParams.get('type') || 'recent'

    let result

    switch (type) {
      case 'active':
        result = await cachedSupabase.getActiveOrders()
        break
      case 'recent':
      default:
        result = await cachedSupabase.getRecentOrders(limit)
        break
    }

    const { data, error, fromCache } = result

    if (error) throw error

    return NextResponse.json({
      success: true,
      data,
      fromCache,
      count: data?.length || 0,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching cached orders:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    )
  }
}

/**
 * ניקוי cache
 * DELETE /api/cache/orders
 */
export async function DELETE() {
  try {
    cachedSupabase.invalidateCache('orders')

    return NextResponse.json({
      success: true,
      message: 'Orders cache cleared',
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    )
  }
}
