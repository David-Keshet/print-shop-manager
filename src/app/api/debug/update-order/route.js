import { supabase } from '../../../../lib/supabase.js'

export async function POST(request) {
  try {
    const { icount_doc_number, customer_name, doc_type } = await request.json()
    
    console.log(`Updating order with icount_doc_number: ${icount_doc_number}`)
    
    // חפש את ההזמנה לפי מספר iCount
    const { data: existingOrder, error: findError } = await supabase
      .from('orders')
      .select('*')
      .eq('icount_doc_number', icount_doc_number)
      .single()
    
    if (findError) {
      console.log('Find error:', findError)
      return Response.json({ error: findError.message }, { status: 500 })
    }
    
    if (!existingOrder) {
      return Response.json({ error: 'Order not found' }, { status: 404 })
    }
    
    console.log('Found order:', existingOrder)
    
    // עדכן את ההזמנה
    const updateData = {
      customer_name: customer_name,
      doc_type: doc_type
    }
    
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', existingOrder.id)
      .select()
    
    if (updateError) {
      console.log('Update error:', updateError)
      return Response.json({ error: updateError.message }, { status: 500 })
    }
    
    console.log('Updated order:', updatedOrder)
    
    return Response.json({ 
      success: true, 
      message: 'Order updated successfully',
      order: updatedOrder[0]
    })
    
  } catch (err) {
    console.log('General error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
