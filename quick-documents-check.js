/**
 * Quick Documents Check - Simple and Fast
 */

const https = require('https');
const querystring = require('querystring');

async function quickCheck() {
  console.log('🔍 Quick iCount Documents Check');
  console.log('================================');
  
  const credentials = {
    cid: "printkeshet",
    user: "print",
    pass: "958075daV+-"
  };
  
  // Step 1: Login
  console.log('🔌 Logging in...');
  
  const loginData = querystring.stringify({
    cid: credentials.cid,
    user: credentials.user,
    pass: credentials.pass
  });
  
  const loginOptions = {
    hostname: 'api.icount.co.il',
    path: '/api/v3.php/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(loginData)
    }
  };
  
  const session = await new Promise((resolve, reject) => {
    const req = https.request(loginOptions, (res) => {
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
  
  if (!session) {
    console.log('❌ Login failed');
    return;
  }
  
  console.log('✅ Logged in, SID:', session);
  
  // Step 2: Check documents
  console.log('\n📋 Checking documents...');
  
  const checkEndpoints = [
    '/api/v3.php/documents',
    '/api/v3.php/documents/order',
    '/api/v3.php/documents/invoice',
    '/api/v3.php/documents/deal',
    '/api/v3.php/documents/proposal'
  ];
  
  for (const endpoint of checkEndpoints) {
    console.log(`\n🔍 Checking: ${endpoint}`);
    
    const docOptions = {
      hostname: 'api.icount.co.il',
      path: endpoint + '?' + querystring.stringify({
        sid: session,
        limit: 10,
        from_date: '2025-01-01',
        to_date: '2026-12-31'
      }),
      method: 'GET'
    };
    
    try {
      const result = await new Promise((resolve, reject) => {
        const req = https.request(docOptions, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              resolve(parsed);
            } catch (e) {
              resolve(data);
            }
          });
        });
        
        req.on('error', reject);
        req.end();
      });
      
      console.log(`✅ ${endpoint}:`, Array.isArray(result) ? `${result.length} documents` : typeof result);
      
      if (Array.isArray(result) && result.length > 0) {
        console.log('   Sample:', {
          id: result[0].id || result[0].doc_id,
          type: result[0].type,
          date: result[0].date || result[0].doc_date,
          customer: result[0].client_name || result[0].customer_name
        });
      }
      
    } catch (error) {
      console.log(`❌ ${endpoint}: Error - ${error.message}`);
    }
  }
  
  console.log('\n🏁 Check complete');
}

quickCheck().catch(console.error);
