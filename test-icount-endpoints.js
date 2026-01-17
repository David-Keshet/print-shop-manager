/**
 * Test Different iCount API Endpoints
 */

const https = require('https');
const querystring = require('querystring');

async function testEndpoints() {
  console.log('🔍 Testing iCount API Endpoints');
  console.log('===============================');
  
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
  
  // Test different endpoint approaches
  const testCases = [
    // Method 1: POST with method parameter
    {
      name: 'POST /api/v3.php with method=get_documents',
      method: 'POST',
      path: '/api/v3.php',
      data: querystring.stringify({
        sid: session,
        method: 'get_documents',
        limit: 50,
        from_date: '2025-01-01',
        to_date: '2026-12-31'
      })
    },
    
    // Method 2: GET with method in query
    {
      name: 'GET /api/v3.php/documents?method=get_documents',
      method: 'GET',
      path: '/api/v3.php/documents?method=get_documents&sid=' + session + '&limit=50&from_date=2025-01-01&to_date=2026-12-31',
      data: null
    },
    
    // Method 3: Direct endpoint
    {
      name: 'GET /api/v3.php/get_documents',
      method: 'GET',
      path: '/api/v3.php/get_documents?sid=' + session + '&limit=50&from_date=2025-01-01&to_date=2026-12-31',
      data: null
    },
    
    // Method 4: Different method names
    {
      name: 'POST /api/v3.php with method=documents',
      method: 'POST',
      path: '/api/v3.php',
      data: querystring.stringify({
        sid: session,
        method: 'documents',
        limit: 50,
        from_date: '2025-01-01',
        to_date: '2026-12-31'
      })
    },
    
    // Method 5: Try without method parameter
    {
      name: 'GET /api/v3.php/documents (no method)',
      method: 'GET',
      path: '/api/v3.php/documents?sid=' + session + '&limit=50&from_date=2025-01-01&to_date=2026-12-31',
      data: null
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n🔍 Testing: ${testCase.name}`);
    
    try {
      const response = await new Promise((resolve, reject) => {
        const options = {
          hostname: 'api.icount.co.il',
          path: testCase.path,
          method: testCase.method
        };
        
        if (testCase.method === 'POST' && testCase.data) {
          options.headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(testCase.data)
          };
        }
        
        const req = https.request(options, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            resolve({ status: res.statusCode, data: data });
          });
        });
        
        req.on('error', reject);
        
        if (testCase.method === 'POST' && testCase.data) {
          req.write(testCase.data);
        }
        
        req.end();
      });
      
      console.log('Status:', response.status);
      
      if (response.status === 200) {
        try {
          const parsed = JSON.parse(response.data);
          
          if (Array.isArray(parsed)) {
            console.log(`✅ SUCCESS! Found ${parsed.length} documents`);
            
            if (parsed.length > 0) {
              console.log('Sample document:', {
                id: parsed[0].id || parsed[0].doc_id,
                type: parsed[0].type,
                date: parsed[0].date || parsed[0].doc_date,
                customer: parsed[0].client_name || parsed[0].customer_name,
                total: parsed[0].total || parsed[0].amount
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
            } else if (parsed.data) {
              console.log(`✅ Found ${parsed.data.length} documents in data field`);
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

testEndpoints().catch(console.error);
