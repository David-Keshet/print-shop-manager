/**
 * Test Different URL Paths
 */

const https = require('https');
const querystring = require('querystring');

async function testURLPaths() {
  console.log('🔍 Testing Different URL Paths');
  console.log('==============================');
  
  const credentials = {
    cid: "printkeshet",
    user: "print",
    pass: "958075daV+-"
  };
  
  // Login
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
  
  // Test different URL paths
  const pathTests = [
    // Method 1: Direct path in URL
    {
      name: 'GET /api/v3.php/documents',
      method: 'GET',
      path: '/api/v3.php/documents',
      data: null
    },
    
    // Method 2: Direct path with method
    {
      name: 'GET /api/v3.php/get_documents',
      method: 'GET',
      path: '/api/v3.php/get_documents',
      data: null
    },
    
    // Method 3: POST to documents path
    {
      name: 'POST /api/v3.php/documents',
      method: 'POST',
      path: '/api/v3.php/documents',
      data: querystring.stringify({
        sid: session,
        limit: 50,
        from_date: '2025-01-01',
        to_date: '2026-12-31'
      })
    },
    
    // Method 4: POST to invoices path
    {
      name: 'POST /api/v3.php/invoices',
      method: 'POST',
      path: '/api/v3.php/invoices',
      data: querystring.stringify({
        sid: session,
        limit: 50,
        from_date: '2025-01-01',
        to_date: '2026-12-31'
      })
    },
    
    // Method 5: Different base path
    {
      name: 'POST /documents',
      method: 'POST',
      path: '/documents',
      data: querystring.stringify({
        sid: session,
        limit: 50
      })
    },
    
    // Method 6: Try with /api/v3.php/v1/
    {
      name: 'POST /api/v3.php/v1/documents',
      method: 'POST',
      path: '/api/v3.php/v1/documents',
      data: querystring.stringify({
        sid: session,
        limit: 50
      })
    }
  ];
  
  for (const test of pathTests) {
    console.log(`\n🔍 Testing: ${test.name}`);
    
    try {
      const options = {
        hostname: 'api.icount.co.il',
        path: test.method === 'GET' ? test.path + '?sid=' + session + '&limit=50&from_date=2025-01-01&to_date=2026-12-31' : test.path,
        method: test.method
      };
      
      if (test.method === 'POST' && test.data) {
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
      
      console.log(`Status: ${response.status}`);
      
      if (response.status === 200) {
        try {
          const parsed = JSON.parse(response.data);
          
          if (Array.isArray(parsed)) {
            console.log(`✅ SUCCESS! Found ${parsed.length} items`);
            
            // Look for the specific customer
            const customerItems = parsed.filter(item => {
              const customerName = item.client_name || item.customer_name || item.name || '';
              return customerName.includes('משרד') || customerName.includes('ראש') || customerName.includes('ממשלה');
            });
            
            if (customerItems.length > 0) {
              console.log(`🎉 FOUND ${customerItems.length} items for "משרד ראש הממשלה":`);
              customerItems.forEach((item, index) => {
                console.log(`  ${index + 1}. ID: ${item.id || item.doc_id}, Number: ${item.doc_number || item.invoice_number}, Date: ${item.date || item.doc_date}, Total: ${item.total || item.amount}, Customer: ${item.client_name || item.customer_name}`);
              });
            }
            
            if (parsed.length > 0) {
              console.log('Sample item:', {
                id: parsed[0].id || parsed[0].doc_id,
                customer: parsed[0].client_name || parsed[0].customer_name,
                date: parsed[0].date || parsed[0].doc_date,
                total: parsed[0].total || parsed[0].amount
              });
            }
          } else {
            console.log(`Response type: ${typeof parsed}`);
            console.log('Keys:', Object.keys(parsed));
            
            if (parsed.status === false) {
              console.log(`❌ Error: ${parsed.reason || parsed.error_description}`);
            } else if (parsed.documents) {
              console.log(`✅ Found ${parsed.documents.length} documents`);
            } else if (parsed.data) {
              console.log(`✅ Found ${parsed.data.length} items in data field`);
            }
          }
        } catch (e) {
          console.log('Parse error:', e.message);
          console.log('Raw response:', response.data.substring(0, 300));
        }
      } else {
        console.log(`❌ HTTP Error: ${response.status}`);
      }
      
    } catch (error) {
      console.log(`❌ Request error: ${error.message}`);
    }
  }
  
  console.log('\n🏁 Test complete');
}

testURLPaths().catch(console.error);
