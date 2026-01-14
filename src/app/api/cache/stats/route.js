import { NextResponse } from 'next/server'
import cachedSupabase from '@/lib/cache/cachedSupabase'

/**
 * סטטיסטיקות עם cache
 * GET /api/cache/stats
 */
export async function GET() {
  try {
    const { data, error, fromCache } = await cachedSupabase.getStats()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data,
      fromCache,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching cached stats:', error)
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
 * DELETE /api/cache/stats
 */
export async function DELETE() {
  try {
    cachedSupabase.invalidateCache('stats')

    return NextResponse.json({
      success: true,
      message: 'Stats cache cleared',
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
