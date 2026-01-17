/**
 * Test Method and Path Together
 */

const https = require('https');
const querystring = require('querystring');

async function testMethodAndPath() {
  console.log('🔍 Testing Method and Path Together');
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
  
  // Test method and path combinations
  const combinations = [
    // Method 1: get_documents with documents path
    {
      name: 'get_documents + documents',
      method: 'get_documents',
      path: 'documents'
    },
    
    // Method 2: get_documents with documents/invoice
    {
      name: 'get_documents + documents/invoice',
      method: 'get_documents',
      path: 'documents/invoice'
    },
    
    // Method 3: list with documents
    {
      name: 'list + documents',
      method: 'list',
      path: 'documents'
    },
    
    // Method 4: find with documents
    {
      name: 'find + documents',
      method: 'find',
      path: 'documents'
    },
    
    // Method 5: search with documents
    {
      name: 'search + documents',
      method: 'search',
      path: 'documents'
    },
    
    // Method 6: get_invoices with invoices
    {
      name: 'get_invoices + invoices',
      method: 'get_invoices',
      path: 'invoices'
    },
    
    // Method 7: get_customers with customers
    {
      name: 'get_customers + customers',
      method: 'get_customers',
      path: 'customers'
    },
    
    // Method 8: Try with module parameter
    {
      name: 'module=documents',
      module: 'documents',
      method: 'get'
    },
    
    // Method 9: Try with action parameter
    {
      name: 'action=list',
      action: 'list',
      module: 'documents'
    }
  ];
  
  for (const combo of combinations) {
    console.log(`\n🔍 Testing: ${combo.name}`);
    
    let postData = {
      sid: session,
      limit: 50,
      from_date: '2025-01-01',
      to_date: '2026-12-31'
    };
    
    if (combo.method) postData.method = combo.method;
    if (combo.path) postData.path = combo.path;
    if (combo.module) postData.module = combo.module;
    if (combo.action) postData.action = combo.action;
    
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
  
  console.log('\n🏁 Test complete');
}

testMethodAndPath().catch(console.error);
