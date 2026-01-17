/**
 * Test doc/search endpoint - The correct one!
 */

const https = require('https');
const querystring = require('querystring');

async function testDocSearch() {
  console.log('🔍 Testing doc/search endpoint');
  console.log('===============================');
  
  const credentials = {
    cid: "printkeshet",
    user: "print",
    pass: "958075daV+-"
  };
  
  // Login
  console.log('🔌 Login...');
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
  
  // Test doc/search with different parameters
  const tests = [
    {
      name: 'Test 1: Basic doc/search',
      params: {
        sid: session,
        limit: 50
      }
    },
    {
      name: 'Test 2: With date range',
      params: {
        sid: session,
        from_date: '2025-01-01',
        to_date: '2026-12-31',
        limit: 50
      }
    },
    {
      name: 'Test 3: With doc_type',
      params: {
        sid: session,
        doc_type: 'order',
        limit: 50
      }
    },
    {
      name: 'Test 4: With doctype',
      params: {
        sid: session,
        doctype: 'order',
        limit: 50
      }
    },
    {
      name: 'Test 5: With free_text search',
      params: {
        sid: session,
        free_text: 'משרד ראש הממשלה',
        limit: 50
      }
    },
    {
      name: 'Test 6: All parameters together',
      params: {
        sid: session,
        from_date: '2025-01-01',
        to_date: '2026-12-31',
        doc_type: 'order',
        doctype: 'order',
        free_text: 'משרד ראש הממשלה',
        limit: 50
      }
    },
    {
      name: 'Test 7: Try invoice type',
      params: {
        sid: session,
        from_date: '2025-01-01',
        to_date: '2026-12-31',
        doc_type: 'invoice',
        doctype: 'invoice',
        free_text: 'משרד ראש הממשלה',
        limit: 50
      }
    }
  ];
  
  for (const test of tests) {
    console.log(`\n🔍 ${test.name}`);
    
    const postData = querystring.stringify(test.params);
    
    try {
      const response = await new Promise((resolve, reject) => {
        const req = https.request({
          hostname: 'api.icount.co.il',
          path: '/api/v3.php/doc/search',
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
                console.log(`  ${index + 1}. ID: ${doc.id || doc.doc_id}, Number: ${doc.doc_number || doc.invoice_number}, Date: ${doc.date || doc.doc_date}, Total: ${doc.total || doc.amount}, Customer: ${doc.client_name || doc.customer_name}, Type: ${doc.type || doc.doc_type}`);
              });
              console.log('\n🎉🎉🎉 FOUND THE DOCUMENTS! 🎉🎉🎉');
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
                
                const customerDocs = parsed.documents.filter(item => {
                  const customerName = item.client_name || item.customer_name || item.name || '';
                  return customerName.includes('משרד') || customerName.includes('ראש') || customerName.includes('ממשלה');
                });
                
                if (customerDocs.length > 0) {
                  console.log(`🎉 FOUND ${customerDocs.length} documents for "משרד ראש הממשלה":`);
                  customerDocs.forEach((doc, index) => {
                    console.log(`  ${index + 1}. ID: ${doc.id || doc.doc_id}, Number: ${doc.doc_number}, Date: ${doc.date || doc.doc_date}, Total: ${doc.total || doc.amount}`);
                  });
                  console.log('\n🎉🎉🎉 FOUND THE DOCUMENTS! 🎉🎉🎉');
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
          console.log('Raw response:', response.data.substring(0, 500));
        }
      } else {
        console.log(`❌ HTTP Error: ${response.status}`);
      }
      
    } catch (error) {
      console.log(`❌ Request error: ${error.message}`);
    }
    
    // Small delay
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log('\n🏁 Test complete');
}

testDocSearch().catch(console.error);
