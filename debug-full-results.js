/**
 * Debug Full Results Structure
 */

const https = require('https');
const querystring = require('querystring');

async function debugFullResults() {
  console.log('🔍 Debugging Full Results Structure');
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
  
  // Get full results for invoices
  console.log('\n🔍 Getting full invoice results...');
  
  const postData = querystring.stringify({
    sid: session,
    doctype: 'invoice',
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
      const parsed = JSON.parse(response.data);
      
      console.log('Full response structure:');
      console.log('Keys:', Object.keys(parsed));
      console.log('Status:', parsed.status);
      console.log('Results count:', parsed.results_count);
      console.log('Results total:', parsed.results_total);
      
      if (parsed.results_list && parsed.results_list.length > 0) {
        console.log('\nFirst result full structure:');
        console.log(JSON.stringify(parsed.results_list[0], null, 2));
        
        // Look for the specific customer
        const customerDocs = parsed.results_list.filter(item => {
          const customerName = item.client_name || item.customer_name || item.name || '';
          return customerName.includes('משרד') || customerName.includes('ראש') || customerName.includes('ממשלה');
        });
        
        if (customerDocs.length > 0) {
          console.log(`\n🎉 FOUND ${customerDocs.length} documents for "משרד ראש הממשלה":`);
          customerDocs.forEach((doc, index) => {
            console.log(`\n${index + 1}. Full document structure:`);
            console.log(JSON.stringify(doc, null, 2));
          });
        } else {
          console.log('\n❌ No documents found for "משרד ראש הממשלה"');
          console.log('All customers found:');
          parsed.results_list.forEach((doc, index) => {
            const customerName = doc.client_name || doc.customer_name || doc.name || 'Unknown';
            console.log(`  ${index + 1}. ${customerName}`);
          });
        }
      }
    }
    
  } catch (error) {
    console.log('❌ Request error:', error.message);
  }
  
  console.log('\n🏁 Debug complete');
}

debugFullResults().catch(console.error);
