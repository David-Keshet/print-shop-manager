/**
 * Create Test Order from iCount Invoice
 */

const { createClient } = require('@supabase/supabase-js')

async function createTestOrder() {
  console.log('🔍 Creating Test Order from iCount Invoice');
  console.log('========================================');
  
  // Supabase connection
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
  
  // The invoice data we found
  const invoiceData = {
    docnum: "2000",
    dateissued: "2026-01-14",
    timeissued: "2026-01-14T09:48:00+00:00",
    client_id: "6",
    currency_id: "5",
    currency_code: "ILS",
    currency: "ש\"ח",
    rate: "1",
    total: "1907.05",
    is_cancellation: 0,
    is_cancelled: 0,
    status: 0
  };
  
  console.log('📄 Invoice data:', invoiceData);
  
  try {
    // Create order in Supabase
    const orderData = {
      order_number: `IC-${invoiceData.docnum}`,
      customer_name: "משרד ראש הממשלה", // We'll use the name we know
      customer_phone: "0523992300", // From the user info
      customer_email: "print@dfus-keshet.com",
      total_with_vat: parseFloat(invoiceData.total),
      status: "חדש",
      icount_doc_number: invoiceData.docnum,
      icount_doc_type: "invoice",
      icount_client_id: invoiceData.client_id,
      icount_date: invoiceData.dateissued,
      icount_total: parseFloat(invoiceData.total),
      notes: `חשבונית מספר ${invoiceData.docnum} מ-iCount`,
      created_at: new Date().toISOString()
    };
    
    console.log('📦 Creating order:', orderData);
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();
    
    if (orderError) {
      console.error('❌ Error creating order:', orderError);
      return;
    }
    
    console.log('✅ Order created successfully:', order);
    
    // Create order items (sample items based on the total)
    const items = [
      {
        order_id: order.id,
        description: "שירותי הדפסה ממשלתית",
        quantity: 1,
        unit_price: 1907.05,
        price: 1907.05,
        notes: "חשבונית מ-iCount"
      }
    ];
    
    console.log('📋 Creating order items:', items);
    
    const { data: createdItems, error: itemsError } = await supabase
      .from('order_items')
      .insert(items)
      .select();
    
    if (itemsError) {
      console.error('❌ Error creating items:', itemsError);
      return;
    }
    
    console.log('✅ Order items created successfully:', createdItems);
    
    // Create task for the order
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert({
        order_id: order.id,
        title: `הזמנה ${order.order_number} - משרד ראש הממשלה`,
        description: "חשבונית מ-iCount סונכרנה למערכת",
        status: "לביצוע",
        priority: "גבוהה",
        department_id: 1, // Default department
        column_id: 1, // Default column
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (taskError) {
      console.error('❌ Error creating task:', taskError);
    } else {
      console.log('✅ Task created successfully:', task);
    }
    
    console.log('\n🎉 SUCCESS! Order created from iCount invoice');
    console.log('📄 Order Number:', order.order_number);
    console.log('👤 Customer:', order.customer_name);
    console.log('💰 Total:', order.total_with_vat);
    console.log('🔗 View in orders page: http://localhost:3000/orders');
    
  } catch (error) {
    console.error('❌ General error:', error);
  }
}

createTestOrder().catch(console.error);
