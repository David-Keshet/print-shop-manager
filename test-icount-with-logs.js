/**
 * Test iCount Connection with Detailed Logs
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function testICountWithLogs() {
  console.log('🔍 ===== DETAILED iCount CONNECTION TEST =====');
  console.log('Time:', new Date().toISOString());
  
  try {
    // Step 1: Check environment variables
    console.log('\n📋 Step 1: Checking environment variables...');
    console.log('NEXT_PUBLIC_ICOUNT_CID:', process.env.NEXT_PUBLIC_ICOUNT_CID ? '✅ Found' : '❌ Missing');
    console.log('NEXT_PUBLIC_ICOUNT_USER:', process.env.NEXT_PUBLIC_ICOUNT_USER ? '✅ Found' : '❌ Missing');
    console.log('NEXT_PUBLIC_ICOUNT_PASS:', process.env.NEXT_PUBLIC_ICOUNT_PASS ? '✅ Found' : '❌ Missing');
    console.log('NEXT_PUBLIC_ICOUNT_SID:', process.env.NEXT_PUBLIC_ICOUNT_SID ? '✅ Found' : '❌ Missing');
    
    // Step 2: Import and test client
    console.log('\n📋 Step 2: Importing iCount client...');
    const { getICountClient } = require('./src/lib/icount/client.js');
    console.log('✅ Client imported successfully');
    
    // Step 3: Create client instance
    console.log('\n📋 Step 3: Creating client instance...');
    const client = getICountClient();
    console.log('✅ Client created');
    console.log('Client type:', typeof client);
    console.log('Client hasCredentials:', typeof client.hasCredentials === 'function' ? '✅' : '❌');
    console.log('Client testConnection:', typeof client.testConnection === 'function' ? '✅' : '❌');
    
    // Step 4: Wait for initialization
    console.log('\n📋 Step 4: Waiting for initialization...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log('✅ Wait completed');
    
    // Step 5: Check credentials
    console.log('\n📋 Step 5: Checking credentials...');
    const hasCreds = client.hasCredentials();
    console.log('Has credentials:', hasCreds);
    
    if (!hasCreds) {
      console.log('❌ No credentials available');
      console.log('Client credentials:', client.credentials);
      return;
    }
    
    // Step 6: Test connection
    console.log('\n📋 Step 6: Testing connection...');
    console.log('Calling testConnection()...');
    
    const result = await client.testConnection();
    
    console.log('✅ Connection test completed');
    console.log('Result:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.log('\n❌ ERROR OCCURRED:');
    console.log('Type:', error.constructor.name);
    console.log('Message:', error.message);
    console.log('Stack:', error.stack);
    
    // Additional debugging
    if (error.message.includes('חסרים פרטי התחברות')) {
      console.log('💡 Suggestion: Check environment variables');
    }
    
    if (error.message.includes('OFFLINE_MODE')) {
      console.log('💡 Suggestion: Check internet connection');
    }
    
    if (error.message.includes('fetch')) {
      console.log('💡 Suggestion: Network connectivity issue');
    }
  }
  
  console.log('\n🏁 ===== TEST COMPLETE =====');
}

testICountWithLogs().catch(console.error);
