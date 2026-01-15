import { supabase } from '../../../../lib/supabase.js'

export async function POST(request) {
  try {
    const { orderId } = await request.json()
    
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('order_id', orderId)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      return Response.json({ error: error.message }, { status: 500 })
    }
    
    return Response.json({ 
      success: true, 
      invoice: data,
      message: data ? 'Invoice found' : 'No invoice found for this order'
    })
    
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
