/**
 * Check results_list from doc/search
 */

const https = require('https');
const querystring = require('querystring');

async function checkResultsList() {
  console.log('🔍 Checking results_list from doc/search');
  console.log('========================================');
  
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
  
  // Test with different doctypes to find documents
  const doctypes = ['order', 'invoice', 'deal', 'proposal'];
  
  for (const doctype of doctypes) {
    console.log(`\n🔍 Testing doctype: ${doctype}`);
    
    const postData = querystring.stringify({
      sid: session,
      doctype: doctype,
      limit: 50
    });
    
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
      
      if (response.status === 200) {
        try {
          const parsed = JSON.parse(response.data);
          
          if (parsed.status === true && parsed.results_list) {
            console.log(`✅ Found ${parsed.results_count} ${doctype} documents`);
            
            // Look for the specific customer
            const customerDocs = parsed.results_list.filter(item => {
              const customerName = item.client_name || item.customer_name || item.name || '';
              return customerName.includes('משרד') || customerName.includes('ראש') || customerName.includes('ממשלה');
            });
            
            if (customerDocs.length > 0) {
              console.log(`🎉 FOUND ${customerDocs.length} ${doctype} documents for "משרד ראש הממשלה":`);
              customerDocs.forEach((doc, index) => {
                console.log(`  ${index + 1}. ID: ${doc.id || doc.doc_id}, Number: ${doc.doc_number || doc.invoice_number}, Date: ${doc.date || doc.doc_date}, Total: ${doc.total || doc.amount}, Customer: ${doc.client_name || doc.customer_name}, Status: ${doc.status || doc.doc_status}`);
              });
            } else if (parsed.results_list.length > 0) {
              console.log(`Sample ${doctype}:`, {
                id: parsed.results_list[0].id || parsed.results_list[0].doc_id,
                customer: parsed.results_list[0].client_name || parsed.results_list[0].customer_name,
                date: parsed.results_list[0].date || parsed.results_list[0].doc_date,
                total: parsed.results_list[0].total || parsed.results_list[0].amount,
                status: parsed.results_list[0].status || parsed.results_list[0].doc_status
              });
            }
          } else {
            console.log(`❌ Error: ${parsed.reason || parsed.error_description}`);
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
    
    // Small delay
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n🏁 Check complete');
}

checkResultsList().catch(console.error);
