import { supabase } from '../../../../lib/supabase.js'

export async function GET() {
  try {
    // קבל חשבוניות
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select(`
        *,
        customer:customers(name, phone),
        order:orders(order_number)
      `)
      .order('issue_date', { ascending: false })
      .limit(10)

    if (invoicesError) throw invoicesError

    // קבל הזמנות מ-iCount
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        *,
        customer:customers(name, phone)
      `)
      .not('icount_doc_number', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10)

    if (ordersError) throw ordersError

    return Response.json({ 
      success: true,
      invoices: invoices || [],
      orders: orders || [],
      totalInvoices: invoices?.length || 0,
      totalOrders: orders?.length || 0
    })
    
  } catch (err) {
    return Response.json({ 
      success: false, 
      error: err.message 
    }, { status: 500 })
  }
}
