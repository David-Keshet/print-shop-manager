const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

const updateOrderDirectly = async () => {
  try {
    console.log('🔧 Updating order directly with admin client...');
    
    // חפש את ההזמנה
    const { data: existingOrder, error: findError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('icount_doc_number', '8000')
      .single();
    
    if (findError) {
      console.error('❌ Find error:', findError);
      return;
    }
    
    if (!existingOrder) {
      console.error('❌ Order not found');
      return;
    }
    
    console.log('✅ Found order:', existingOrder);
    
    // עדכן את ההזמנה
    const updateData = {
      customer_name: 'דוד הלוי'
    };
    
    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from('orders')
      .update(updateData)
      .eq('id', existingOrder.id)
      .select();
    
    if (updateError) {
      console.error('❌ Update error:', updateError);
      return;
    }
    
    console.log('✅ Updated order successfully:', updatedOrder[0]);
    
    // בדוק שהעדכון נשמר
    const { data: checkOrder } = await supabaseAdmin
      .from('orders')
      .select('customer_name')
      .eq('id', existingOrder.id)
      .single();
    
    console.log('🔍 Verification - customer_name is now:', checkOrder?.customer_name);
    
  } catch (err) {
    console.error('❌ General error:', err);
  }
};

updateOrderDirectly();
