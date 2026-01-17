/**
 * Manual iCount Connection Test
 */

// Set environment variables manually
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://wbahwlbulcbkkcpinett.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiYWh3bGJ1bGNia2tjcGlubVV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQzMDI3NTEsImV4cCI6MjA0OTg3ODc1MX0.wYJ2zQgJlCuKFYFvLxIFJ0xsBq6aP5V8hN3EJFJn2Qo';
process.env.NEXT_PUBLIC_ICOUNT_CID = 'YOUR_CID_HERE';
process.env.NEXT_PUBLIC_ICOUNT_USER = 'YOUR_USER_HERE';
process.env.NEXT_PUBLIC_ICOUNT_PASS = 'YOUR_PASSWORD_HERE';

async function testICountManual() {
  console.log('🔍 ===== MANUAL iCount CONNECTION TEST =====');
  console.log('Time:', new Date().toISOString());
  
  try {
    // Step 1: Check environment variables
    console.log('\n📋 Step 1: Checking environment variables...');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const icountCid = process.env.NEXT_PUBLIC_ICOUNT_CID;
    const icountUser = process.env.NEXT_PUBLIC_ICOUNT_USER;
    const icountPass = process.env.NEXT_PUBLIC_ICOUNT_PASS;
    
    console.log('Supabase URL:', supabaseUrl ? '✅ Found' : '❌ Missing');
    console.log('Supabase Key:', supabaseKey ? '✅ Found' : '❌ Missing');
    console.log('iCount CID:', icountCid ? '✅ Found: ' + icountCid : '❌ Missing');
    console.log('iCount User:', icountUser ? '✅ Found: ' + icountUser : '❌ Missing');
    console.log('iCount Pass:', icountPass ? '✅ Found' : '❌ Missing');
    
    // Step 2: Test Supabase connection
    console.log('\n📋 Step 2: Testing Supabase connection...');
    const { createClient } = require('@supabase/supabase-js');
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    try {
      const { data, error } = await supabase.from('customers').select('count', { count: 'exact', head: true });
      if (error) {
        console.log('❌ Supabase connection failed:', error.message);
      } else {
        console.log('✅ Supabase connection OK - customers count:', data);
      }
    } catch (e) {
      console.log('❌ Supabase test exception:', e.message);
    }
    
    // Step 3: Check iCount settings in Supabase
    console.log('\n📋 Step 3: Checking iCount settings in Supabase...');
    try {
      const { data: settings, error: settingsError } = await supabase
        .from('icount_settings')
        .select('*')
        .eq('is_active', true)
        .single();
      
      if (settingsError) {
        console.log('ℹ️ No active iCount settings found in Supabase');
        console.log('   Error:', settingsError.message);
      } else {
        console.log('✅ Found iCount settings in Supabase:');
        console.log('   CID:', settings.cid);
        console.log('   User:', settings.user_name);
        console.log('   Last sync:', settings.last_sync);
      }
    } catch (e) {
      console.log('❌ Settings check failed:', e.message);
    }
    
    // Step 4: Test iCount client
    console.log('\n📋 Step 4: Testing iCount client...');
    
    if (icountCid === 'YOUR_CID_HERE') {
      console.log('⚠️ iCount credentials not configured');
      console.log('💡 Please run: setup-icount.bat');
      return;
    }
    
    const { getICountClient } = require('./src/lib/icount/client.js');
    
    try {
      console.log('🔌 Getting iCount client...');
      const client = getICountClient();
      
      // Wait for initialization
      console.log('⏳ Waiting for initialization...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      console.log('🔐 Testing connection...');
      const result = await client.testConnection();
      
      console.log('✅ iCount connection result:', result);
      
    } catch (error) {
      console.log('❌ iCount client test failed:');
      console.log('   Error:', error.message);
      console.log('   Stack:', error.stack);
    }
    
  } catch (error) {
    console.log('❌ General test failed:', error.message);
    console.log('Stack:', error.stack);
  }
  
  console.log('\n🏁 ===== TEST COMPLETE =====');
}

testICountManual().catch(console.error);
