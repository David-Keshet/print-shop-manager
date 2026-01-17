/**
 * Final Test with Path Values
 */

const https = require('https');
const querystring = require('querystring');

async function finalTestWithPath() {
  console.log('🔍 Final Test with Path Values');
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
  
  // Test with different path values
  const pathTests = [
    // Method 1: Path as /documents
    {
      name: 'module=documents, path=/documents',
      module: 'documents',
      path: '/documents'
    },
    
    // Method 2: Path as documents (no slash)
    {
      name: 'module=documents, path=documents',
      module: 'documents',
      path: 'documents'
    },
    
    // Method 3: Path as get_documents
    {
      name: 'module=documents, path=get_documents',
      module: 'documents',
      path: 'get_documents'
    },
    
    // Method 4: Path as list
    {
      name: 'module=documents, path=list',
      module: 'documents',
      path: 'list'
    },
    
    // Method 5: Path as index
    {
      name: 'module=documents, path=index',
      module: 'documents',
      path: 'index'
    },
    
    // Method 6: Try with invoices module
    {
      name: 'module=invoices, path=list',
      module: 'invoices',
      path: 'list'
    },
    
    // Method 7: Try with customers module
    {
      name: 'module=customers, path=list',
      module: 'customers',
      path: 'list'
    },
    
    // Method 8: Try without module, just path
    {
      name: 'path=documents, method=get',
      path: 'documents',
      method: 'get'
    },
    
    // Method 9: Try path as action
    {
      name: 'module=documents, action=list',
      module: 'documents',
      action: 'list'
    }
  ];
  
  for (const test of pathTests) {
    console.log(`\n🔍 Testing: ${test.name}`);
    
    let postData = {
      sid: session,
      limit: 50,
      from_date: '2025-01-01',
      to_date: '2026-12-31'
    };
    
    if (test.module) postData.module = test.module;
    if (test.path) postData.path = test.path;
    if (test.method) postData.method = test.method;
    if (test.action) postData.action = test.action;
    
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
              console.log('\n🎉🎉🎉 SUCCESS! FOUND THE INVOICE! 🎉🎉🎉');
              return; // Stop here since we found it
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
                
                const customerDocs = parsed.documents.filter(item => {
                  const customerName = item.client_name || item.customer_name || item.name || '';
                  return customerName.includes('משרד') || customerName.includes('ראש') || customerName.includes('ממשלה');
                });
                
                if (customerDocs.length > 0) {
                  console.log(`🎉 FOUND ${customerDocs.length} documents for "משרד ראש הממשלה":`);
                  customerDocs.forEach((doc, index) => {
                    console.log(`  ${index + 1}. ID: ${doc.id || doc.doc_id}, Number: ${doc.doc_number}, Date: ${doc.date || doc.doc_date}, Total: ${doc.total || doc.amount}`);
                  });
                  console.log('\n🎉🎉🎉 SUCCESS! FOUND THE INVOICE! 🎉🎉🎉');
                  return;
                }
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
      
    } catch (error) {
      console.log(`❌ Request error: ${error.message}`);
    }
  }
  
  console.log('\n🏁 Final test complete');
}

finalTestWithPath().catch(console.error);
