import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function GET() {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .or('icount_doc_number.eq.8000,order_number.eq.8000')
      .limit(10)
    
    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }
    
    return Response.json({ orders })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
