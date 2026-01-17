/**
 * Test Only Invoices - Focused Approach
 */

const https = require('https');
const querystring = require('querystring');

async function testInvoicesOnly() {
  console.log('🔍 Testing iCount Invoices Only');
  console.log('==============================');
  
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
  
  // Test different invoice approaches
  const invoiceTests = [
    // Method 1: POST with method=get_invoices
    {
      name: 'POST method=get_invoices',
      method: 'POST',
      data: querystring.stringify({
        sid: session,
        method: 'get_invoices',
        limit: 50,
        from_date: '2025-01-01',
        to_date: '2026-12-31'
      })
    },
    
    // Method 2: POST with method=invoices
    {
      name: 'POST method=invoices',
      method: 'POST',
      data: querystring.stringify({
        sid: session,
        method: 'invoices',
        limit: 50,
        from_date: '2025-01-01',
        to_date: '2026-12-31'
      })
    },
    
    // Method 3: POST with path=documents/invoice
    {
      name: 'POST path=documents/invoice',
      method: 'POST',
      data: querystring.stringify({
        sid: session,
        method: 'get_documents',
        path: 'documents/invoice',
        limit: 50,
        from_date: '2025-01-01',
        to_date: '2026-12-31'
      })
    },
    
    // Method 4: GET with invoices endpoint
    {
      name: 'GET /invoices',
      method: 'GET',
      path: '/invoices?sid=' + session + '&limit=50&from_date=2025-01-01&to_date=2026-12-31',
      data: null
    },
    
    // Method 5: GET with documents/invoice
    {
      name: 'GET /documents/invoice',
      method: 'GET',
      path: '/documents/invoice?sid=' + session + '&limit=50&from_date=2025-01-01&to_date=2026-12-31',
      data: null
    }
  ];
  
  for (const test of invoiceTests) {
    console.log(`\n🔍 Testing: ${test.name}`);
    
    try {
      const options = {
        hostname: 'api.icount.co.il',
        path: test.method === 'GET' ? test.path : '/api/v3.php',
        method: test.method
      };
      
      if (test.method === 'POST') {
        options.headers = {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(test.data)
        };
      }
      
      const response = await new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            resolve({ status: res.statusCode, data: data });
          });
        });
        
        req.on('error', reject);
        
        if (test.method === 'POST' && test.data) {
          req.write(test.data);
        }
        
        req.end();
      });
      
      console.log('Status:', response.status);
      
      if (response.status === 200) {
        try {
          const parsed = JSON.parse(response.data);
          
          if (Array.isArray(parsed)) {
            console.log(`✅ SUCCESS! Found ${parsed.length} invoices`);
            
            if (parsed.length > 0) {
              console.log('Sample invoice:', {
                id: parsed[0].id || parsed[0].doc_id,
                number: parsed[0].doc_number || parsed[0].invoice_number,
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
            } else if (parsed.invoices) {
              console.log(`✅ Found ${parsed.invoices.length} invoices`);
              if (parsed.invoices.length > 0) {
                console.log('Sample:', parsed.invoices[0]);
              }
            } else if (parsed.documents) {
              console.log(`✅ Found ${parsed.documents.length} documents`);
              if (parsed.documents.length > 0) {
                console.log('Sample:', parsed.documents[0]);
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
  
  console.log('\n🏁 Invoice test complete');
}

testInvoicesOnly().catch(console.error);
