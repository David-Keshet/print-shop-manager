/**
 * Check Documents with Fixed API Call
 */

const https = require('https');
const querystring = require('querystring');

async function checkFixed() {
  console.log('🔍 Fixed iCount Documents Check');
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
  
  // Check documents with method parameter
  const endpoints = [
    { path: '/documents', method: 'get_documents' },
    { path: '/documents/order', method: 'get_documents_order' },
    { path: '/documents/invoice', method: 'get_documents_invoice' },
    { path: '/documents/deal', method: 'get_documents_deal' },
    { path: '/documents/proposal', method: 'get_documents_proposal' }
  ];
  
  for (const endpoint of endpoints) {
    console.log(`\n🔍 Checking: ${endpoint.path} with method: ${endpoint.method}`);
    
    const docOptions = {
      hostname: 'api.icount.co.il',
      path: '/api/v3.php' + endpoint.path + '?' + querystring.stringify({
        sid: session,
        method: endpoint.method,
        limit: 50,
        from_date: '2025-01-01',
        to_date: '2026-12-31'
      }),
      method: 'GET'
    };
    
    try {
      const response = await new Promise((resolve, reject) => {
        const req = https.request(docOptions, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            resolve({ status: res.statusCode, data: data });
          });
        });
        
        req.on('error', reject);
        req.end();
      });
      
      console.log('Status:', response.status);
      
      if (response.status === 200) {
        try {
          const parsed = JSON.parse(response.data);
          
          if (Array.isArray(parsed)) {
            console.log(`✅ Found ${parsed.length} documents`);
            
            if (parsed.length > 0) {
              console.log('Sample:', {
                id: parsed[0].id || parsed[0].doc_id,
                type: parsed[0].type,
                date: parsed[0].date || parsed[0].doc_date,
                customer: parsed[0].client_name || parsed[0].customer_name,
                total: parsed[0].total || parsed[0].amount
              });
            }
          } else {
            console.log('Response type:', typeof parsed);
            if (parsed.documents) {
              console.log(`✅ Found ${parsed.documents.length} documents`);
              if (parsed.documents.length > 0) {
                console.log('Sample:', parsed.documents[0]);
              }
            } else {
              console.log('Keys:', Object.keys(parsed));
              if (parsed.status === false) {
                console.log('❌ Error:', parsed.reason || parsed.error_description);
              }
            }
          }
        } catch (e) {
          console.log('Parse error:', e.message);
          console.log('Raw response:', response.data.substring(0, 200));
        }
      } else {
        console.log('❌ HTTP Error:', response.status);
      }
      
    } catch (error) {
      console.log('❌ Request error:', error.message);
    }
  }
  
  console.log('\n🏁 Check complete');
}

checkFixed().catch(console.error);
