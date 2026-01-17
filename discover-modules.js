/**
 * Discover Available Modules in iCount API
 */

const https = require('https');
const querystring = require('querystring');

async function discoverModules() {
  console.log('🔍 Discovering Available iCount API Modules');
  console.log('==========================================');
  
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
  
  // Try common module names
  const possibleModules = [
    'document', 'documents', 'doc', 'docs',
    'invoice', 'invoices', 'inv', 'invrec',
    'order', 'orders', 'order_management',
    'customer', 'customers', 'client', 'clients',
    'transaction', 'transactions', 'trans',
    'payment', 'payments', 'pay',
    'report', 'reports', 'reporting',
    'accounting', 'account', 'accounts',
    'inventory', 'item', 'items', 'product', 'products',
    'supplier', 'suppliers', 'vendor', 'vendors'
  ];
  
  for (const module of possibleModules) {
    console.log(`\n🔍 Testing module: ${module}`);
    
    const postData = querystring.stringify({
      sid: session,
      module: module,
      method: 'get',
      limit: 10
    });
    
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
      
      if (response.status === 200) {
        try {
          const parsed = JSON.parse(response.data);
          
          if (parsed.status === true) {
            console.log(`✅ SUCCESS! Module "${module}" exists and works!`);
            
            if (Array.isArray(parsed.data) || Array.isArray(parsed.documents) || Array.isArray(parsed.items)) {
              const items = parsed.data || parsed.documents || parsed.items || [];
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
              }
            }
          } else if (parsed.status === false) {
            const error = parsed.reason || parsed.error_description || 'Unknown error';
            if (!error.includes('bad_module') && !error.includes('invalid_module')) {
              console.log(`✅ Module "${module}" might exist - different error: ${error}`);
            } else {
              console.log(`❌ Module "${module}" not found: ${error}`);
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
  }
  
  console.log('\n🏁 Module discovery complete');
}

discoverModules().catch(console.error);
