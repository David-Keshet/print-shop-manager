import { NextResponse } from 'next/server'
import { syncService } from '@/lib/icount/syncService'

export async function POST(request) {
  console.log('🐛 ===== DEBUG SYNC START =====')
  
  try {
    const result = await syncService.syncOrders()
    console.log('🐛 DEBUG SYNC RESULT:', JSON.stringify(result, null, 2))
    
    return NextResponse.json({
      success: true,
      debug: true,
      result: result
    })
  } catch (error) {
    console.error('🐛 DEBUG SYNC ERROR:', error)
    return NextResponse.json({
      success: false,
      debug: true,
      error: error.message,
      stack: error.stack
    })
  }
}
