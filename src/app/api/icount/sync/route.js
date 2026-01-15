import { NextResponse } from 'next/server'
import { syncService } from '@/lib/icount/syncService'

/**
 * סנכרון נתונים מ-iCount
 * POST /api/icount/sync
 */
export async function POST(request) {
  console.log('🚀 iCount sync API called')
  
  try {
    console.log('🔄 ============ SYNC START ============')

    const body = await request.json().catch(() => ({}))
    const { type = 'all' } = body
    
    console.log(`📋 Sync type: ${type}`)

    let result

    switch (type) {
      case 'all':
        console.log('🔄 Starting full sync...')
        result = await syncService.syncAll()
        break

      case 'orders':
        console.log('📦 Starting orders sync...')
        result = await syncService.syncOrders()
        break

      case 'customers':
        console.log('👥 Starting customers sync...')
        result = await syncService.syncCustomers()
        break

      case 'invoices':
        console.log('📄 Starting invoices sync...')
        result = await syncService.syncInvoices()
        break

      case 'open_count':
        console.log('🔢 Getting open invoices count...')
        result = await syncService.getOpenInvoicesCount()
        break

      default:
        console.error(`❌ Invalid sync type: ${type}`)
        return NextResponse.json(
          { success: false, message: 'Invalid sync type' },
          { status: 400 }
        )
    }

    console.log(`✅ Sync result:`, JSON.stringify(result, null, 2))
    console.log('🔄 ============ SYNC END ============')

    return NextResponse.json(result)
  } catch (error) {
    console.error('🔄 ============ SYNC ERROR ============')
    console.error('❌ Sync API error:', error)
    console.error('❌ Full error stack:', error.stack)
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Sync failed',
        error: error.toString(),
        stack: error.stack
      },
      { status: 500 }
    )
  }
}

/**
 * קבלת סטטוס סנכרון
 * GET /api/icount/sync
 */
export async function GET() {
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    // קבל הגדרות עם מידע על סנכרון אחרון
    const { data: settings } = await supabase
      .from('icount_settings')
      .select('last_sync, sync_status, offline_mode')
      .eq('is_active', true)
      .single()

    // קבל לוג סנכרון אחרון
    const { data: recentLogs } = await supabase
      .from('sync_log')
      .select('*')
      .order('attempted_at', { ascending: false })
      .limit(10)

    return NextResponse.json({
      success: true,
      settings,
      recentLogs,
      syncInProgress: syncService.syncInProgress,
    })
  } catch (error) {
    console.error('Error getting sync status:', error)

    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    )
  }
}
