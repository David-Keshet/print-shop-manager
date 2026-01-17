/**
 * Test Client Direct - Use existing working client
 */

// Set environment
process.env.NEXT_PUBLIC_ICOUNT_CID = "printkeshet";
process.env.NEXT_PUBLIC_ICOUNT_USER = "print";
process.env.NEXT_PUBLIC_ICOUNT_PASS = "958075daV+-";
process.env.NEXT_PUBLIC_ICOUNT_SID = "API3E8-C0A80C03-696793EE-D1C70480C4DECFF5";

async function testClientDirect() {
  console.log('🔍 Testing Client Direct');
  console.log('==========================');
  
  try {
    // Get the global client
    const { getICountClient } = require('./src/lib/icount/client.js');
    const client = getICountClient();
    
    console.log('✅ Got client');
    
    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test connection
    console.log('\n🔌 Testing connection...');
    const testResult = await client.testConnection();
    console.log('Connection result:', testResult);
    
    if (!testResult.success) {
      console.log('❌ Connection failed');
      return;
    }
    
    // Try different approaches
    console.log('\n🔍 Testing different approaches...');
    
    // Approach 1: Direct API call
    try {
      console.log('Approach 1: Direct API call...');
      const result1 = await client.request('POST', '', {
        method: 'get_documents',
        limit: 50,
        from_date: '2025-01-01',
        to_date: '2026-12-31'
      });
      console.log('Approach 1 result:', Array.isArray(result1) ? `${result1.length} items` : typeof result1);
    } catch (e) {
      console.log('Approach 1 error:', e.message);
    }
    
    // Approach 2: With path
    try {
      console.log('Approach 2: With path...');
      const result2 = await client.request('POST', '', {
        method: 'get_documents',
        path: 'documents',
        limit: 50,
        from_date: '2025-01-01',
        to_date: '2026-12-31'
      });
      console.log('Approach 2 result:', Array.isArray(result2) ? `${result2.length} items` : typeof result2);
    } catch (e) {
      console.log('Approach 2 error:', e.message);
    }
    
    // Approach 3: Different method names
    const methods = ['documents', 'get_documents', 'list_documents', 'find_documents'];
    
    for (const method of methods) {
      try {
        console.log(`Approach 3: Testing method=${method}...`);
        const result3 = await client.request('POST', '', {
          method: method,
          limit: 50,
          from_date: '2025-01-01',
          to_date: '2026-12-31'
        });
        console.log(`Method ${method}:`, Array.isArray(result3) ? `${result3.length} items` : typeof result3);
        
        if (Array.isArray(result3) && result3.length > 0) {
          console.log('SUCCESS! Found documents with method:', method);
          console.log('Sample:', result3[0]);
          break;
        }
      } catch (e) {
        console.log(`Method ${method} error:`, e.message);
      }
    }
    
    // Approach 4: Try without method parameter
    try {
      console.log('Approach 4: Without method parameter...');
      const result4 = await client.request('GET', '/documents', {
        limit: 50,
        from_date: '2025-01-01',
        to_date: '2026-12-31'
      });
      console.log('Approach 4 result:', Array.isArray(result4) ? `${result4.length} items` : typeof result4);
    } catch (e) {
      console.log('Approach 4 error:', e.message);
    }
    
    // Approach 5: Check what methods are available
    try {
      console.log('Approach 5: Check available methods...');
      const result5 = await client.request('POST', '', {
        method: 'help'
      });
      console.log('Help result:', result5);
    } catch (e) {
      console.log('Help error:', e.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
  
  console.log('\n🏁 Test complete');
}

testClientDirect().catch(console.error);
