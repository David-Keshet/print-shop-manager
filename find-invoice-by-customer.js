/**
 * Find Invoice by Customer Name - "משרד ראש הממשלה"
 */

const https = require('https');
const querystring = require('querystring');

async function findInvoiceByCustomer() {
  console.log('🔍 Finding Invoice for Customer: משרד ראש הממשלה');
  console.log('====================================================');
  
  const credentials = {
    cid: "printkeshet",
    user: "print",
    pass: "958075daV+-"
  };
  
  // Login with timeout
  console.log('🔌 Logging in...');
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
      },
      timeout: 10000
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
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Login timeout'));
    });
    
    req.write(loginData);
    req.end();
  });
  
  if (!session) {
    console.log('❌ Login failed');
    return;
  }
  
  console.log('✅ Logged in, SID:', session);
  
  // Try every possible way to find the invoice
  const searchMethods = [
    // Method 1: Search by customer name
    {
      name: 'Search by customer name',
      data: {
        sid: session,
        method: 'search_documents',
        client_name: 'משרד ראש הממשלה',
        limit: 50
      }
    },
    
    // Method 2: Get all invoices and filter
    {
      name: 'Get all invoices',
      data: {
        sid: session,
        method: 'get_invoices',
        limit: 100,
        from_date: '2025-01-01',
        to_date: '2026-12-31'
      }
    },
    
    // Method 3: Get all documents
    {
      name: 'Get all documents',
      data: {
        sid: session,
        method: 'get_documents',
        limit: 100,
        from_date: '2025-01-01',
        to_date: '2026-12-31'
      }
    },
    
    // Method 4: Search with different parameter names
    {
      name: 'Search with customer',
      data: {
        sid: session,
        method: 'search',
        customer: 'משרד ראש הממשלה',
        limit: 50
      }
    },
    
    // Method 5: Find by client
    {
      name: 'Find by client',
      data: {
        sid: session,
        method: 'find_client',
        name: 'משרד ראש הממשלה'
      }
    },
    
    // Method 6: Get customers first
    {
      name: 'Get customers',
      data: {
        sid: session,
        method: 'get_customers',
        limit: 100
      }
    },
    
    // Method 7: List documents with path
    {
      name: 'List documents with path',
      data: {
        sid: session,
        method: 'list',
        path: 'documents',
        limit: 100
      }
    },
    
    // Method 8: Try without method
    {
      name: 'Direct documents call',
      data: {
        sid: session,
        limit: 100,
        from_date: '2025-01-01',
        to_date: '2026-12-31'
      }
    }
  ];
  
  for (const method of searchMethods) {
    console.log(`\n🔍 Trying: ${method.name}`);
    
    const postData = querystring.stringify(method.data);
    
    try {
      const response = await new Promise((resolve, reject) => {
        const req = https.request({
          hostname: 'api.icount.co.il',
          path: '/api/v3.php',
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData)
          },
          timeout: 15000
        }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            resolve({ status: res.statusCode, data: data });
          });
        });
        
        req.on('error', reject);
        req.on('timeout', () => {
          req.destroy();
          reject(new Error('Request timeout'));
        });
        
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
            const customerInvoices = parsed.filter(item => {
              const customerName = item.client_name || item.customer_name || item.name || '';
              return customerName.includes('משרד') || customerName.includes('ראש') || customerName.includes('ממשלה');
            });
            
            if (customerInvoices.length > 0) {
              console.log(`🎉 FOUND ${customerInvoices.length} invoices for "משרד ראש הממשלה":`);
              customerInvoices.forEach((inv, index) => {
                console.log(`  ${index + 1}. ID: ${inv.id || inv.doc_id}, Number: ${inv.doc_number || inv.invoice_number}, Date: ${inv.date || inv.doc_date}, Total: ${inv.total || inv.amount}`);
              });
            } else {
              console.log('No invoices found for this customer in this batch');
            }
            
            if (parsed.length > 0 && !customerInvoices.length) {
              console.log('Sample item (first result):', {
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
      if (error.message.includes('timeout')) {
        console.log('❌ Request timeout - skipping');
      } else {
        console.log(`❌ Request error: ${error.message}`);
      }
    }
  }
  
  console.log('\n🏁 Search complete');
}

findInvoiceByCustomer().catch(console.error);
