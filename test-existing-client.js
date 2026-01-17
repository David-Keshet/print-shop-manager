/**
 * Test with Existing iCount Client
 */

// Set environment variables
process.env.NEXT_PUBLIC_ICOUNT_CID = "printkeshet";
process.env.NEXT_PUBLIC_ICOUNT_USER = "print";
process.env.NEXT_PUBLIC_ICOUNT_PASS = "958075daV+-";
process.env.NEXT_PUBLIC_ICOUNT_SID = "API3E8-C0A80C03-696793EE-D1C70480C4DECFF5";

async function testExistingClient() {
  console.log('🔍 Testing with Existing iCount Client');
  console.log('===================================');
  
  try {
    // Load the existing client
    const { ICountClient } = require('./src/lib/icount/client.js');
    const client = new ICountClient({
      cid: "printkeshet",
      user: "print",
      pass: "958075daV+-",
      sid: "API3E8-C0A80C03-696793EE-D1C70480C4DECFF5"
    });
    
    console.log('✅ Client created');
    
    // Test connection
    console.log('\n🔌 Testing connection...');
    const testResult = await client.testConnection();
    console.log('Connection test:', testResult);
    
    if (!testResult.success) {
      console.log('❌ Connection failed');
      return;
    }
    
    // Try different document requests
    const requests = [
      { path: '/documents', desc: 'All documents' },
      { path: '/documents/order', desc: 'Orders only' },
      { path: '/documents/invoice', desc: 'Invoices only' },
      { path: '/documents/deal', desc: 'Deals only' },
      { path: '/documents/proposal', desc: 'Proposals only' },
      { path: '/customers', desc: 'Customers' },
      { path: '/invoices', desc: 'Direct invoices' }
    ];
    
    for (const req of requests) {
      console.log(`\n🔍 Testing: ${req.desc} (${req.path})`);
      
      try {
        const result = await client.request('GET', req.path, {
          limit: 50,
          from_date: '2025-01-01',
          to_date: '2026-12-31'
        });
        
        console.log(`✅ ${req.desc}:`, Array.isArray(result) ? `${result.length} items` : typeof result);
        
        if (Array.isArray(result) && result.length > 0) {
          console.log('Sample item:', {
            id: result[0].id || result[0].doc_id,
            type: result[0].type,
            date: result[0].date || result[0].doc_date,
            customer: result[0].client_name || result[0].customer_name,
            total: result[0].total || result[0].amount
          });
        } else if (result && typeof result === 'object') {
          console.log('Object keys:', Object.keys(result));
          if (result.documents) {
            console.log('Documents count:', result.documents.length);
          }
          if (result.data) {
            console.log('Data count:', result.data.length);
          }
        }
        
      } catch (error) {
        console.log(`❌ ${req.desc}: Error - ${error.message}`);
      }
    }
    
    // Try raw API calls
    console.log('\n🔍 Testing raw API calls...');
    
    try {
      const rawResult = await client.request('POST', '', {
        method: 'get_documents',
        limit: 50,
        from_date: '2025-01-01',
        to_date: '2026-12-31'
      });
      
      console.log('Raw result:', typeof rawResult);
      if (Array.isArray(rawResult)) {
        console.log('Raw documents found:', rawResult.length);
      }
      
    } catch (error) {
      console.log('Raw API error:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
  
  console.log('\n🏁 Test complete');
}

testExistingClient().catch(console.error);
