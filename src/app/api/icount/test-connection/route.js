import { NextResponse } from 'next/server'
import connectionManager from '@/lib/icount/connectionManager'

/**
 * בדיקת חיבור ל-iCount
 * POST /api/icount/test-connection
 */
export async function POST(request) {
  try {
    console.log('🔍 ============ TEST CONNECTION START ============')

    // התחבר עם connection manager (1 retry to avoid rate limit)
    const result = await connectionManager.connect(1)

    console.log('🔍 Connection result:', result)
    console.log('🔍 ============ TEST CONNECTION END ============')

    return NextResponse.json(result)

  } catch (error) {
    console.error('🔍 ============ TEST CONNECTION ERROR ============')
    console.error('Error testing iCount connection:', error)
    console.error('Error stack:', error.stack)

    return NextResponse.json(
      {
        success: false,
        message: error.message || 'שגיאה בבדיקת חיבור',
        details: {
          error: error.toString(),
          stack: error.stack,
        },
      },
      { status: 500 }
    )
  }
}
