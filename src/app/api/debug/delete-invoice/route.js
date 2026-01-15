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

export async function DELETE(request) {
  try {
    const { invoice_number, invoice_type } = await request.json()
    
    console.log(`Deleting invoice: ${invoice_number}, type: ${invoice_type}`)
    
    const { data, error } = await supabaseAdmin
      .from('invoices')
      .delete()
      .eq('invoice_number', invoice_number)
      .eq('invoice_type', invoice_type)
      .select()
    
    if (error) {
      console.error('Delete error:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }
    
    return Response.json({ 
      success: true, 
      message: 'Invoice deleted successfully',
      deleted: data
    })
    
  } catch (err) {
    console.error('API Error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
