/**
 * Detailed iCount Connection Test with Logs
 */

async function testICountConnectionDetailed() {
  console.log('🔍 ===== DETAILED iCount CONNECTION TEST =====');
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
    console.log('iCount CID:', icountCid ? '✅ Found' : '❌ Missing');
    console.log('iCount User:', icountUser ? '✅ Found' : '❌ Missing');
    console.log('iCount Pass:', icountPass ? '✅ Found' : '❌ Missing');
    
    // Step 2: Test Supabase connection
    console.log('\n📋 Step 2: Testing Supabase connection...');
    const { createClient } = require('@supabase/supabase-js');
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('❌ Cannot test Supabase - missing credentials');
      return;
    }
    
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
      
      if (error.message.includes('חסרים פרטי התחברות')) {
        console.log('💡 Suggestion: Run setup-icount.bat to configure credentials');
      }
    }
    
  } catch (error) {
    console.log('❌ General test failed:', error.message);
    console.log('Stack:', error.stack);
  }
  
  console.log('\n🏁 ===== TEST COMPLETE =====');
}

testICountConnectionDetailed().catch(console.error);
