/**
 * Test All Possible Path Formats
 */

const https = require('https');
const querystring = require('querystring');

async function testAllPaths() {
  console.log('🔍 Testing All Possible Path Formats');
  console.log('====================================');
  
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
  
  // Test every possible path format
  const pathTests = [
    // Method 1: Different path formats
    { path: '/', desc: 'Root path' },
    { path: '/documents', desc: 'Documents path' },
    { path: '/documents/', desc: 'Documents with trailing slash' },
    { path: '/api/v3.php/documents', desc: 'Full documents path' },
    { path: '/api/v3.php/documents/', desc: 'Full documents with slash' },
    { path: 'documents', desc: 'Documents without slash' },
    { path: 'documents/', desc: 'Documents with slash only' },
    
    // Method 2: Module-based paths
    { module: 'documents', desc: 'Module documents' },
    { module: 'document', desc: 'Module document' },
    { module: 'docs', desc: 'Module docs' },
    { module: 'doc', desc: 'Module doc' },
    
    // Method 3: Action-based paths
    { action: 'list', module: 'documents', desc: 'Action list + documents' },
    { action: 'get', module: 'documents', desc: 'Action get + documents' },
    { action: 'find', module: 'documents', desc: 'Action find + documents' },
    { action: 'search', module: 'documents', desc: 'Action search + documents' },
    
    // Method 4: Method-based paths
    { method: 'list', module: 'documents', desc: 'Method list + documents' },
    { method: 'get', module: 'documents', desc: 'Method get + documents' },
    { method: 'find', module: 'documents', desc: 'Method find + documents' },
    { method: 'search', module: 'documents', desc: 'Method search + documents' },
    
    // Method 5: Resource-based paths
    { resource: 'documents', desc: 'Resource documents' },
    { resource: 'document', desc: 'Resource document' },
    
    // Method 6: Endpoint-based paths
    { endpoint: 'documents', desc: 'Endpoint documents' },
    { endpoint: 'document', desc: 'Endpoint document' },
    
    // Method 7: Controller-based paths
    { controller: 'documents', desc: 'Controller documents' },
    { controller: 'document', desc: 'Controller document' },
    
    // Method 8: Type-based paths
    { type: 'documents', desc: 'Type documents' },
    { type: 'document', desc: 'Type document' }
  ];
  
  for (let i = 0; i < pathTests.length; i++) {
    const test = pathTests[i];
    console.log(`\n🔍 Test ${i + 1}/${pathTests.length}: ${test.desc}`);
    
    let postData = {
      sid: session,
      limit: 10
    };
    
    // Add all possible parameters
    if (test.path) postData.path = test.path;
    if (test.module) postData.module = test.module;
    if (test.action) postData.action = test.action;
    if (test.method) postData.method = test.method;
    if (test.resource) postData.resource = test.resource;
    if (test.endpoint) postData.endpoint = test.endpoint;
    if (test.controller) postData.controller = test.controller;
    if (test.type) postData.type = test.type;
    
    const queryString = querystring.stringify(postData);
    
    try {
      const response = await new Promise((resolve, reject) => {
        const req = https.request({
          hostname: 'api.icount.co.il',
          path: '/api/v3.php',
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(queryString)
          }
        }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            resolve({ status: res.statusCode, data: data });
          });
        });
        
        req.on('error', reject);
        req.write(queryString);
        req.end();
      });
      
      if (response.status === 200) {
        try {
          const parsed = JSON.parse(response.data);
          
          if (parsed.status === true) {
            console.log(`✅ SUCCESS! ${test.desc} works!`);
            
            if (Array.isArray(parsed.data) || Array.isArray(parsed.documents)) {
              const items = parsed.data || parsed.documents || [];
              console.log(`Found ${items.length} items`);
              
              // Look for the specific customer
              const customerItems = items.filter(item => {
                const customerName = item.client_name || item.customer_name || item.name || '';
                return customerName.includes('משרד') || customerName.includes('ראש') || customerName.includes('ממשלה');
              });
              
              if (customerItems.length > 0) {
                console.log(`🎉 FOUND ${customerItems.length} items for "משרד ראש הממשלה":`);
                customerItems.forEach((item, index) => {
                  console.log(`  ${index + 1}. ID: ${item.id || item.doc_id}, Number: ${item.doc_number || item.invoice_number}, Date: ${item.date || item.doc_date}, Total: ${item.total || item.amount}`);
                });
                console.log('\n🎉🎉🎉 FOUND THE WORKING FORMAT! 🎉🎉🎉');
                return; // Stop here since we found it
              }
            }
          } else if (parsed.status === false) {
            const error = parsed.reason || parsed.error_description || 'Unknown error';
            if (!error.includes('empty_path') && !error.includes('bad_module')) {
              console.log(`✅ Different error (might work): ${error}`);
            } else {
              console.log(`❌ ${error}`);
            }
          }
        } catch (e) {
          console.log('Parse error:', e.message);
        }
      } else {
        console.log(`❌ HTTP Error: ${response.status}`);
      }
      
    } catch (error) {
      console.log(`❌ Request error: ${error.message}`);
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n🏁 All tests complete');
}

testAllPaths().catch(console.error);
