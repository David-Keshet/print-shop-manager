/**
 * Discover API Endpoint - Try to find the correct way
 */

const https = require('https');
const querystring = require('querystring');

async function discoverAPIEndpoint() {
  console.log('🔍 Discovering iCount API Endpoint');
  console.log('===================================');
  
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
  
  // Try different endpoint approaches based on common API patterns
  const endpointTests = [
    // Method 1: Try with full path in URL
    {
      name: 'GET /api/v3.php/documents/get_documents',
      method: 'GET',
      url: '/api/v3.php/documents/get_documents'
    },
    
    // Method 2: Try with module parameter
    {
      name: 'POST with module=documents',
      method: 'POST',
      url: '/api/v3.php',
      data: {
        sid: session,
        module: 'documents',
        action: 'list',
        limit: 50
      }
    },
    
    // Method 3: Try with type parameter
    {
      name: 'POST with type=documents',
      method: 'POST',
      url: '/api/v3.php',
      data: {
        sid: session,
        type: 'documents',
        action: 'get',
        limit: 50
      }
    },
    
    // Method 4: Try with resource parameter
    {
      name: 'POST with resource=documents',
      method: 'POST',
      url: '/api/v3.php',
      data: {
        sid: session,
        resource: 'documents',
        method: 'list',
        limit: 50
      }
    },
    
    // Method 5: Try with endpoint parameter
    {
      name: 'POST with endpoint=documents',
      method: 'POST',
      url: '/api/v3.php',
      data: {
        sid: session,
        endpoint: 'documents',
        method: 'list',
        limit: 50
      }
    },
    
    // Method 6: Try with controller parameter
    {
      name: 'POST with controller=documents',
      method: 'POST',
      url: '/api/v3.php',
      data: {
        sid: session,
        controller: 'documents',
        action: 'index',
        limit: 50
      }
    },
    
    // Method 7: Try different path format
    {
      name: 'POST with path=/documents',
      method: 'POST',
      url: '/api/v3.php',
      data: {
        sid: session,
        method: 'get',
        path: '/documents',
        limit: 50
      }
    },
    
    // Method 8: Try with documents as method
    {
      name: 'POST method=documents',
      method: 'POST',
      url: '/api/v3.php',
      data: {
        sid: session,
        method: 'documents',
        limit: 50
      }
    }
  ];
  
  for (const test of endpointTests) {
    console.log(`\n🔍 Testing: ${test.name}`);
    
    try {
      let options = {
        hostname: 'api.icount.co.il',
        path: test.method === 'GET' ? test.url + '?sid=' + session + '&limit=50' : test.url,
        method: test.method
      };
      
      if (test.method === 'POST') {
        const postData = querystring.stringify(test.data);
        options.headers = {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData)
        };
        
        const response = await new Promise((resolve, reject) => {
          const req = https.request(options, (res) => {
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
              } else if (parsed.length > 0) {
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
              
              if (parsed.status === true) {
                console.log('✅ Request successful!');
                if (parsed.documents) {
                  console.log(`Found ${parsed.documents.length} documents`);
                }
                if (parsed.data) {
                  console.log(`Found ${parsed.data.length} items in data field`);
                }
              } else if (parsed.status === false) {
                console.log(`❌ Error: ${parsed.reason || parsed.error_description}`);
              }
            }
          } catch (e) {
            console.log('Parse error:', e.message);
            console.log('Raw response:', response.data.substring(0, 300));
          }
        } else {
          console.log(`❌ HTTP Error: ${response.status}`);
        }
      } else {
        // GET request
        const response = await new Promise((resolve, reject) => {
          const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
              resolve({ status: res.statusCode, data: data });
            });
          });
          
          req.on('error', reject);
          req.end();
        });
        
        console.log(`Status: ${response.status}`);
        console.log('Response:', response.data.substring(0, 200));
      }
      
    } catch (error) {
      console.log(`❌ Request error: ${error.message}`);
    }
  }
  
  console.log('\n🏁 Discovery complete');
}

discoverAPIEndpoint().catch(console.error);
