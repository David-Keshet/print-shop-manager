/**
 * Test Invoices with Path Parameter
 */

const https = require('https');
const querystring = require('querystring');

async function testInvoicesWithPath() {
  console.log('🔍 Testing iCount Invoices with Path');
  console.log('===================================');
  
  const credentials = {
    cid: "printkeshet",
    user: "print",
    pass: "958075daV+-"
  };
  
  // Login
  console.log('🔌 Logging in...');
  const loginData = querystring.stringify({
    cid: credentials.cid,
    user: credentials.user,
    pass: credentials.pass
  });
  
  const session = await new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.icount.co.il',
      path: '/api/v3.php/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(loginData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result.sid);
        } catch (e) {
          reject(e);
        }
      });
    });
    
    req.on('error', reject);
    req.write(loginData);
    req.end();
  });
  
  console.log('✅ Logged in, SID:', session);
  
  // Test with path parameter
  const pathTests = [
    {
      name: 'POST with path=documents/invoice',
      method: 'get_documents',
      path: 'documents/invoice'
    },
    {
      name: 'POST with path=documents/order',
      method: 'get_documents',
      path: 'documents/order'
    },
    {
      name: 'POST with path=documents',
      method: 'get_documents',
      path: 'documents'
    },
    {
      name: 'POST with path=invoices',
      method: 'get_invoices',
      path: 'invoices'
    },
    {
      name: 'POST with path=orders',
      method: 'get_orders',
      path: 'orders'
    }
  ];
  
  for (const test of pathTests) {
    console.log(`\n🔍 Testing: ${test.name}`);
    
    const postData = querystring.stringify({
      sid: session,
      method: test.method,
      path: test.path,
      limit: 50,
      from_date: '2025-01-01',
      to_date: '2026-12-31'
    });
    
    try {
      const response = await new Promise((resolve, reject) => {
        const req = https.request({
          hostname: 'api.icount.co.il',
          path: '/api/v3.php',
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData)
          }
        }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            resolve({ status: res.statusCode, data: data });
          });
        });
        
        req.on('error', reject);
        req.write(postData);
        req.end();
      });
      
      console.log('Status:', response.status);
      
      if (response.status === 200) {
        try {
          const parsed = JSON.parse(response.data);
          
          if (Array.isArray(parsed)) {
            console.log(`✅ SUCCESS! Found ${parsed.length} items`);
            
            if (parsed.length > 0) {
              console.log('Sample item:', {
                id: parsed[0].id || parsed[0].doc_id,
                number: parsed[0].doc_number || parsed[0].invoice_number,
                type: parsed[0].type,
                date: parsed[0].date || parsed[0].doc_date,
                customer: parsed[0].client_name || parsed[0].customer_name,
                total: parsed[0].total || parsed[0].amount,
                status: parsed[0].status || parsed[0].doc_status
              });
            }
          } else {
            console.log('Response type:', typeof parsed);
            console.log('Keys:', Object.keys(parsed));
            
            if (parsed.status === false) {
              console.log('❌ Error:', parsed.reason || parsed.error_description);
            } else if (parsed.documents) {
              console.log(`✅ Found ${parsed.documents.length} documents`);
              if (parsed.documents.length > 0) {
                console.log('Sample:', parsed.documents[0]);
              }
            } else if (parsed.invoices) {
              console.log(`✅ Found ${parsed.invoices.length} invoices`);
              if (parsed.invoices.length > 0) {
                console.log('Sample:', parsed.invoices[0]);
              }
            } else if (parsed.data) {
              console.log(`✅ Found ${parsed.data.length} items in data`);
              if (parsed.data.length > 0) {
                console.log('Sample:', parsed.data[0]);
              }
            }
          }
        } catch (e) {
          console.log('Parse error:', e.message);
          console.log('Raw response:', response.data.substring(0, 300));
        }
      } else {
        console.log('❌ HTTP Error:', response.status);
      }
      
    } catch (error) {
      console.log('❌ Request error:', error.message);
    }
  }
  
  console.log('\n🏁 Test complete');
}

testInvoicesWithPath().catch(console.error);
