import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function POST(request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Missing Supabase configuration' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // קרא את קובץ ה-migration
    const migrationPath = path.join(process.cwd(), 'migrations', '006_invoices_system.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

    // פצל לפקודות נפרדות (לפי נקודה-פסיק)
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    const results = []
    const errors = []

    for (const statement of statements) {
      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement })

        if (error) {
          // נסה גישה ישירה אם RPC לא עובד
          const { error: directError } = await supabase.from('_migrations').select('*').limit(1)

          if (directError && directError.code === 'PGRST204') {
            // אין גישה ל-RPC, נשתמש בגישה חלופית
            console.log('Direct SQL execution not available, using Supabase client methods')
          }

          errors.push({ statement: statement.substring(0, 100), error: error.message })
        } else {
          results.push({ success: true })
        }
      } catch (err) {
        errors.push({ statement: statement.substring(0, 100), error: err.message })
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      message: errors.length === 0
        ? 'Migration completed successfully'
        : `Migration completed with ${errors.length} errors`,
      executed: results.length,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
