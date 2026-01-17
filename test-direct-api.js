/**
 * Test Direct API - Bypass client initialization
 */

const https = require('https');
const querystring = require('querystring');

async function testDirectAPI() {
  console.log('🔍 Testing Direct iCount API');
  console.log('==============================');
  
  const credentials = {
    cid: "printkeshet",
    user: "print",
    pass: "958075daV+-"
  };
  
  // Step 1: Login
  console.log('🔌 Step 1: Login...');
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
          console.log('Login response:', result);
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
  
  if (!session) {
    console.log('❌ Login failed');
    return;
  }
  
  console.log('✅ Logged in, SID:', session);
  
  // Step 2: Test different method names that might work
  const possibleMethods = [
    'get_documents',
    'documents',
    'list_documents',
    'find_documents',
    'get_invoices',
    'invoices',
    'get_orders',
    'orders',
    'get_customers',
    'customers'
  ];
  
  for (const method of possibleMethods) {
    console.log(`\n🔍 Testing method: ${method}`);
    
    const postData = querystring.stringify({
      sid: session,
      method: method,
      limit: 10,
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
      
      console.log(`Status: ${response.status}`);
      
      if (response.status === 200) {
        try {
          const parsed = JSON.parse(response.data);
          
          if (Array.isArray(parsed)) {
            console.log(`✅ SUCCESS! ${method}: Found ${parsed.length} items`);
            
            if (parsed.length > 0) {
              console.log('Sample item:', {
                id: parsed[0].id || parsed[0].doc_id,
                type: parsed[0].type,
                date: parsed[0].date || parsed[0].doc_date,
                customer: parsed[0].client_name || parsed[0].customer_name,
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
              if (parsed.documents.length > 0) {
                console.log('Sample:', parsed.documents[0]);
              }
            } else if (parsed.data) {
              console.log(`✅ Found ${parsed.data.length} items in data field`);
              if (parsed.data.length > 0) {
                console.log('Sample:', parsed.data[0]);
              }
            }
          }
        } catch (e) {
          console.log('Parse error:', e.message);
          console.log('Raw response:', response.data.substring(0, 200));
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

testDirectAPI().catch(console.error);
