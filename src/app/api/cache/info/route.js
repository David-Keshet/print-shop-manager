import { NextResponse } from 'next/server'
import { localCache } from '@/lib/cache/localCache'

/**
 * מידע על מצב ה-cache
 * GET /api/cache/info
 */
export async function GET() {
  try {
    const stats = localCache.getStats()

    return NextResponse.json({
      success: true,
      cache: stats,
      recommendations: {
        shouldClean: stats.utilization > 80,
        performance: stats.utilization < 50 ? 'good' : stats.utilization < 80 ? 'moderate' : 'high',
      },
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

/**
 * ניקוי כל ה-cache
 * DELETE /api/cache/info
 */
export async function DELETE() {
  try {
    localCache.clear()

    return NextResponse.json({
      success: true,
      message: 'All cache cleared',
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
