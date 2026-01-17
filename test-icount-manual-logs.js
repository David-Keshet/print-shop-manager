/**
 * Test iCount Connection with Manual Environment Loading
 */

// Set environment variables manually from the values you provided
process.env.NEXT_PUBLIC_ICOUNT_CID = "printkeshet";
process.env.NEXT_PUBLIC_ICOUNT_USER = "print";
process.env.NEXT_PUBLIC_ICOUNT_PASS = "958075daV+-";
process.env.NEXT_PUBLIC_ICOUNT_SID = "API3E8-C0A80C03-696793EE-D1C70480C4DECFF5";
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://wbahwlbulcbkkcpinett.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiYWh3bGJ1bGNia2tjcGlubVV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQzMDI3NTEsImV4cCI6MjA0OTg3ODc1MX0.wYJ2zQgJlCuKFYFvLxIFJ0xsBq6aP5V8hN3EJFJn2Qo";

async function testICountManualWithLogs() {
  console.log('🔍 ===== MANUAL iCount CONNECTION TEST WITH REAL CREDENTIALS =====');
  console.log('Time:', new Date().toISOString());
  
  try {
    // Step 1: Check environment variables
    console.log('\n📋 Step 1: Checking environment variables...');
    console.log('NEXT_PUBLIC_ICOUNT_CID:', process.env.NEXT_PUBLIC_ICOUNT_CID ? '✅ Found: ' + process.env.NEXT_PUBLIC_ICOUNT_CID : '❌ Missing');
    console.log('NEXT_PUBLIC_ICOUNT_USER:', process.env.NEXT_PUBLIC_ICOUNT_USER ? '✅ Found: ' + process.env.NEXT_PUBLIC_ICOUNT_USER : '❌ Missing');
    console.log('NEXT_PUBLIC_ICOUNT_PASS:', process.env.NEXT_PUBLIC_ICOUNT_PASS ? '✅ Found: ***' : '❌ Missing');
    console.log('NEXT_PUBLIC_ICOUNT_SID:', process.env.NEXT_PUBLIC_ICOUNT_SID ? '✅ Found: ' + process.env.NEXT_PUBLIC_ICOUNT_SID : '❌ Missing');
    
    // Step 2: Import and test client
    console.log('\n📋 Step 2: Importing iCount client...');
    const { getICountClient } = require('./src/lib/icount/client.js');
    console.log('✅ Client imported successfully');
    
    // Step 3: Create client instance
    console.log('\n📋 Step 3: Creating client instance...');
    const client = getICountClient();
    console.log('✅ Client created');
    console.log('Client type:', typeof client);
    
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
    
    if (result.success) {
      console.log('\n🎉 SUCCESS! iCount connection is working!');
      console.log('✅ The system is ready for 24/7 operation');
    } else {
      console.log('\n❌ Connection failed');
      console.log('Error:', result.message);
    }
    
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
    
    if (error.message.includes('auth')) {
      console.log('💡 Suggestion: Authentication failed - check credentials');
    }
  }
  
  console.log('\n🏁 ===== TEST COMPLETE =====');
}

testICountManualWithLogs().catch(console.error);
