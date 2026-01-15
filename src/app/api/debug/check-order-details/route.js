import { supabase } from '../../../../lib/supabase.js'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('icount_doc_number', '8000')
      .single()
    
    if (error) throw error
    
    return Response.json({ 
      success: true,
      order: data
    })
    
  } catch (err) {
    return Response.json({ 
      success: false, 
      error: err.message 
    }, { status: 500 })
  }
}
