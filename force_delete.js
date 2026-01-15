const { createClient } = require('@supabase/supabase-js');

// נשתמש ב-service role key למחיקה
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

const forceDelete = async () => {
  try {
    console.log('🔍 Finding all quotes with invoice_number 8000...');
    
    // חפש את כל הרשומות
    const { data: quotes, error: findError } = await supabaseAdmin
      .from('invoices')
      .select('*')
      .eq('invoice_number', '8000')
      .eq('invoice_type', 'quote');
    
    if (findError) {
      console.error('❌ Find error:', findError);
      return;
    }
    
    console.log('📋 Found quotes:', quotes?.length || 0);
    quotes.forEach((quote, i) => {
      console.log(`${i+1}. ID: ${quote.id}, Type: ${quote.invoice_type}, Created: ${quote.created_at}`);
    });
    
    if (quotes.length > 0) {
      console.log('🗑️ Deleting all quotes...');
      
      const { data: deleted, error: deleteError } = await supabaseAdmin
        .from('invoices')
        .delete()
        .eq('invoice_number', '8000')
        .eq('invoice_type', 'quote')
        .select();
      
      if (deleteError) {
        console.error('❌ Delete error:', deleteError);
        return;
      }
      
      console.log('✅ Deleted:', deleted?.length || 0, 'quotes');
    }
    
    // בדוק שוב
    const { data: check, error: checkError } = await supabaseAdmin
      .from('invoices')
      .select('id, invoice_number, invoice_type')
      .eq('invoice_number', '8000');
    
    if (checkError) {
      console.error('❌ Check error:', checkError);
      return;
    }
    
    console.log('🔍 Remaining documents with number 8000:');
    check.forEach((doc, i) => {
      console.log(`${i+1}. ID: ${doc.id}, Type: ${doc.invoice_type}`);
    });
    
  } catch (err) {
    console.error('❌ General error:', err);
  }
};

forceDelete();
