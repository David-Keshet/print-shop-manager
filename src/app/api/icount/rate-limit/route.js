import { NextResponse } from 'next/server'
import { rateLimiter } from '@/lib/icount/rateLimiter'
import { sessionCache } from '@/lib/icount/sessionCache'

/**
 * קבלת מצב Rate Limit
 * GET /api/icount/rate-limit
 */
export async function GET() {
  try {
    const stats = rateLimiter.getStats()

    return NextResponse.json({
      success: true,
      rateLimiter: {
        ...stats,
        status: stats.remaining > 5 ? 'good' : stats.remaining > 0 ? 'warning' : 'critical',
        message: stats.remaining === 0
          ? `Rate limit reached! Wait ${Math.ceil(stats.waitTime / 1000)}s`
          : `${stats.remaining} requests remaining`,
      },
      sessionCache: {
        activeSessions: sessionCache.size(),
      },
      timestamp: new Date().toISOString(),
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
 * איפוס Rate Limiter (לבדיקות בלבד!)
 * POST /api/icount/rate-limit
 */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))

    if (body.action === 'reset') {
      rateLimiter.reset()

      return NextResponse.json({
        success: true,
        message: 'Rate limiter reset successfully',
      })
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Invalid action. Use {action: "reset"}',
      },
      { status: 400 }
    )
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
