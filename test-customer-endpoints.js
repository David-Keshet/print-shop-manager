/**
 * Test Different Customer Endpoints
 */

const https = require('https');
const querystring = require('querystring');

async function testCustomerEndpoints() {
  console.log('🔍 Testing Different Customer Endpoints');
  console.log('=====================================');
  
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
  
  // Test different customer endpoints
  const endpoints = [
    {
      name: 'client/get',
      path: '/api/v3.php/client/get',
      params: { sid: session, client_id: '6' }
    },
    {
      name: 'customer/get',
      path: '/api/v3.php/customer/get',
      params: { sid: session, customer_id: '6' }
    },
    {
      name: 'client/search',
      path: '/api/v3.php/client/search',
      params: { sid: session, free_text: 'משרד ראש הממשלה' }
    },
    {
      name: 'customer/search',
      path: '/api/v3.php/customer/search',
      params: { sid: session, free_text: 'משרד ראש הממשלה' }
    },
    {
      name: 'client/list',
      path: '/api/v3.php/client/list',
      params: { sid: session, limit: 50 }
    },
    {
      name: 'customer/list',
      path: '/api/v3.php/customer/list',
      params: { sid: session, limit: 50 }
    },
    {
      name: 'get_clients',
      path: '/api/v3.php/get_clients',
      params: { sid: session, limit: 50 }
    },
    {
      name: 'get_customers',
      path: '/api/v3.php/get_customers',
      params: { sid: session, limit: 50 }
    }
  ];
  
  for (const endpoint of endpoints) {
    console.log(`\n🔍 Testing: ${endpoint.name}`);
    
    const postData = querystring.stringify(endpoint.params);
    
    try {
      const response = await new Promise((resolve, reject) => {
        const req = https.request({
          hostname: 'api.icount.co.il',
          path: endpoint.path,
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
          
          if (parsed.status === true) {
            console.log(`✅ SUCCESS! ${endpoint.name} works!`);
            
            if (Array.isArray(parsed.data) || Array.isArray(parsed.clients) || Array.isArray(parsed.customers)) {
              const items = parsed.data || parsed.clients || parsed.customers || [];
              console.log(`Found ${items.length} customers`);
              
              // Look for the specific customer
              const targetCustomer = items.find(item => {
                const customerName = item.name || item.client_name || item.company || '';
                return customerName.includes('משרד') || customerName.includes('ראש') || customerName.includes('ממשלה');
              });
              
              if (targetCustomer) {
                console.log(`🎉 FOUND "משרד ראש הממשלה":`, targetCustomer);
              } else if (items.length > 0) {
                console.log('Sample customer:', items[0]);
              }
            } else if (parsed.id || parsed.name) {
              console.log('Single customer:', {
                id: parsed.id,
                name: parsed.name || parsed.client_name,
                company: parsed.company
              });
              
              const customerName = parsed.name || parsed.client_name || parsed.company || '';
              if (customerName.includes('משרד') || customerName.includes('ראש') || customerName.includes('ממשלה')) {
                console.log(`🎉 FOUND "משרד ראש הממשלה":`, parsed);
              }
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
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  console.log('\n🏁 Test complete');
}

testCustomerEndpoints().catch(console.error);
