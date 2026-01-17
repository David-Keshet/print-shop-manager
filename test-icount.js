/**
 * Test iCount Connection
 */
const { ICountClient } = require('./src/lib/icount/client.js');

async function testICountConnection() {
  console.log('🔍 Testing iCount connection...');
  
  try {
    // Test with sample credentials - replace with actual ones
    const client = new ICountClient({
      cid: 'YOUR_CID_HERE',
      user: 'YOUR_USER_HERE', 
      pass: 'YOUR_PASSWORD_HERE'
    });
    
    console.log('📡 Testing basic connection...');
    
    // Test basic API call
    const response = await client.request('doc/search', {
      limit: 1
    });
    
    console.log('✅ iCount connection successful!');
    console.log('Response:', JSON.stringify(response, null, 2));
    
  } catch (error) {
    console.error('❌ iCount connection failed:', error.message);
    console.error('Full error:', error);
  }
}

// Test Supabase connection
async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...');
  
  try {
    const { createClient } = require('@supabase/supabase-js');
    
    const supabase = createClient(
      'https://wbahwlbulcbkkcpinett.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiYWh3bGJ1bGNia2tjcGlubVV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQzMDI3NTEsImV4cCI6MjA0OTg3ODc1MX0.wYJ2zQgJlCuKFYFvLxIFJ0xsBq6aP5V8hN3EJFJn2Qo'
    );
    
    // Test basic connection
    const { data, error } = await supabase.from('customers').select('count');
    
    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
    } else {
      console.log('✅ Supabase connection successful!');
      console.log('Customers count:', data);
    }
    
    // Check iCount settings
    const { data: settings, error: settingsError } = await supabase
      .from('icount_settings')
      .select('*')
      .eq('is_active', true)
      .single();
    
    if (settingsError) {
      console.log('ℹ️ No active iCount settings found');
    } else {
      console.log('✅ iCount settings found:', settings);
    }
    
  } catch (error) {
    console.error('❌ Supabase test failed:', error.message);
  }
}

async function runAllTests() {
  console.log('🚀 ===== CONNECTION TESTS START =====');
  
  await testSupabaseConnection();
  console.log('\n');
  await testICountConnection();
  
  console.log('\n🏁 ===== CONNECTION TESTS END =====');
}

runAllTests();
