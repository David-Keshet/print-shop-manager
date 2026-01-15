import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request) {
  try {
    const { icount_doc_number, customer_name, doc_type } = await request.json()
    
    console.log(`Updating order: ${icount_doc_number}, ${customer_name}, ${doc_type}`)
    
    // יצירת מופע ידני של השירות
    const syncService = new SyncService()
    
    const result = await syncService.updateOrderWithCorrectData(
      icount_doc_number,
      customer_name,
      doc_type
    )
    
    return Response.json(result)
    
  } catch (err) {
    console.error('API Error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
