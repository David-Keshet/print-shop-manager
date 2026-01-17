/**
 * Search Customer Name in Multiple Formats
 */

const https = require('https');
const querystring = require('querystring');

async function searchCustomerName() {
  console.log('🔍 Searching Customer Name in Multiple Formats');
  console.log('==============================================');
  
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
  
  // Search for the customer in multiple formats
  const searchTerms = [
    'משרד ראש הממשלה',
    'משרד ראש הממשלה ',
    ' משרד ראש הממשלה',
    'ראש הממשלה',
    'ממשלה',
    'משרד',
    'ראש',
    'ממשלה ראש',
    'הממשלה',
    'משרד ראש',
    'ראש ממשלה',
    'ממשלה ראש הממשלה'
  ];
  
  for (const searchTerm of searchTerms) {
    console.log(`\n🔍 Searching for: "${searchTerm}"`);
    
    const postData = querystring.stringify({
      sid: session,
      doctype: 'invoice',
      free_text: searchTerm,
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
            console.log(`✅ Found ${parsed.results_count} documents for "${searchTerm}"`);
            
            if (parsed.results_list.length > 0) {
              console.log('Documents found:');
              parsed.results_list.forEach((doc, index) => {
                console.log(`  ${index + 1}. Invoice #${doc.docnum}, Amount: ₪${doc.total}, Date: ${doc.dateissued}, Client ID: ${doc.client_id}`);
              });
              
              // If we found documents, try to get customer details
              console.log(`\n🔍 Getting customer details for client_id: ${parsed.results_list[0].client_id}`);
              
              try {
                const customerData = querystring.stringify({
                  sid: session,
                  client_id: parsed.results_list[0].client_id
                });
                
                const customerResponse = await new Promise((resolve, reject) => {
                  const req = https.request({
                    hostname: 'api.icount.co.il',
                    path: '/api/v3.php/doc/search',
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/x-www-form-urlencoded',
                      'Content-Length': Buffer.byteLength(customerData)
                    }
                  }, (res) => {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => {
                      resolve({ status: res.statusCode, data: data });
                    });
                  });
                  
                  req.on('error', reject);
                  req.write(customerData);
                  req.end();
                });
                
                if (customerResponse.status === 200) {
                  const customerParsed = JSON.parse(customerResponse.data);
                  console.log('Customer response:', customerParsed);
                }
              } catch (custError) {
                console.log('Customer lookup error:', custError.message);
              }
            }
          } else {
            console.log(`❌ No results for "${searchTerm}": ${parsed.reason || parsed.error_description}`);
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
    
    // Small delay
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n🏁 Search complete');
}

searchCustomerName().catch(console.error);
