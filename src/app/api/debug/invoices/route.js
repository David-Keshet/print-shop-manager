import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

/**
 * בדיקת חשבוניות במסד נתונים
 * GET /api/debug/invoices
 */
export async function GET() {
  try {
    console.log('🔍 Checking invoices in Supabase...')

    // ספירה
    const { count, error: countError } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })

    if (countError) throw countError

    console.log(`📊 Total invoices: ${count}`)

    // קבל חשבוניות
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select(`
        id,
        invoice_number,
        invoice_type,
        total_amount,
        status,
        sync_status,
        icount_doc_id,
        created_at,
        customer:customers(name)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    // קבל sync logs
    const { data: logs } = await supabase
      .from('sync_log')
      .select('*')
      .order('attempted_at', { ascending: false })
      .limit(10)

    return NextResponse.json({
      success: true,
      count,
      invoices: invoices || [],
      sync_logs: logs || [],
      message: count === 0 ? 'No invoices found - sync may not have created any yet' : `Found ${count} invoices`
    })

  } catch (error) {
    console.error('Error checking invoices:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        details: error.toString()
      },
      { status: 500 }
    )
  }
}
