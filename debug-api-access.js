/**
 * Debug API Access - Check why we can't get documents
 */

const https = require('https');
const querystring = require('querystring');

async function debugAPIAccess() {
  console.log('🔍 Debugging iCount API Access');
  console.log('=================================');
  
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
          console.log('Login response:', JSON.stringify(result, null, 2));
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
  
  // Step 2: Check what endpoints are available
  console.log('\n🔍 Step 2: Check available endpoints...');
  
  // Try to get user info to see permissions
  const userInfoData = querystring.stringify({
    sid: session,
    method: 'get_user_info'
  });
  
  try {
    const userInfoResponse = await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'api.icount.co.il',
        path: '/api/v3.php',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(userInfoData)
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({ status: res.statusCode, data: data });
        });
      });
      
      req.on('error', reject);
      req.write(userInfoData);
      req.end();
    });
    
    console.log('User info status:', userInfoResponse.status);
    if (userInfoResponse.status === 200) {
      const userInfo = JSON.parse(userInfoResponse.data);
      console.log('User info:', JSON.stringify(userInfo, null, 2));
    }
  } catch (error) {
    console.log('User info error:', error.message);
  }
  
  // Step 3: Try different document approaches
  console.log('\n🔍 Step 3: Try document approaches...');
  
  const approaches = [
    {
      name: 'Method 1: documents with module',
      data: {
        sid: session,
        module: 'documents',
        method: 'list',
        limit: 50
      }
    },
    {
      name: 'Method 2: documents without module',
      data: {
        sid: session,
        method: 'documents',
        limit: 50
      }
    },
    {
      name: 'Method 3: get_documents',
      data: {
        sid: session,
        method: 'get_documents',
        limit: 50
      }
    },
    {
      name: 'Method 4: list_documents',
      data: {
        sid: session,
        method: 'list_documents',
        limit: 50
      }
    }
  ];
  
  for (const approach of approaches) {
    console.log(`\n🔍 Testing: ${approach.name}`);
    
    const postData = querystring.stringify(approach.data);
    
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
            console.log(`✅ SUCCESS! Found ${parsed.length} documents`);
            
            // Look for the specific customer
            const customerDocs = parsed.filter(item => {
              const customerName = item.client_name || item.customer_name || item.name || '';
              return customerName.includes('משרד') || customerName.includes('ראש') || customerName.includes('ממשלה');
            });
            
            if (customerDocs.length > 0) {
              console.log(`🎉 FOUND ${customerDocs.length} documents for "משרד ראש הממשלה":`);
              customerDocs.forEach((doc, index) => {
                console.log(`  ${index + 1}. ID: ${doc.id || doc.doc_id}, Number: ${doc.doc_number || doc.invoice_number}, Date: ${doc.date || doc.doc_date}, Total: ${doc.total || doc.amount}, Customer: ${doc.client_name || doc.customer_name}`);
              });
            } else if (parsed.length > 0) {
              console.log('Sample document:', {
                id: parsed[0].id || parsed[0].doc_id,
                customer: parsed[0].client_name || parsed[0].customer_name,
                date: parsed[0].date || parsed[0].doc_date,
                total: parsed[0].total || parsed[0].amount,
                type: parsed[0].type || parsed[0].doc_type
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
          console.log('Raw response:', response.data.substring(0, 500));
        }
      } else {
        console.log(`❌ HTTP Error: ${response.status}`);
      }
      
    } catch (error) {
      console.log(`❌ Request error: ${error.message}`);
    }
  }
  
  console.log('\n🏁 Debug complete');
}

debugAPIAccess().catch(console.error);
