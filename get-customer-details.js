/**
 * Get Customer Details by client_id
 */

const https = require('https');
const querystring = require('querystring');

async function getCustomerDetails() {
  console.log('🔍 Getting Customer Details');
  console.log('===========================');
  
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
  
  // First, get all documents to find the client_id
  console.log('\n🔍 Step 1: Get all documents to find client_id...');
  
  const invoiceData = querystring.stringify({
    sid: session,
    doctype: 'invoice',
    limit: 50
  });
  
  const invoiceResponse = await new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.icount.co.il',
      path: '/api/v3.php/doc/search',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(invoiceData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, data: data });
      });
    });
    
    req.on('error', reject);
    req.write(invoiceData);
    req.end();
  });
  
  if (invoiceResponse.status === 200) {
    const parsed = JSON.parse(invoiceResponse.data);
    
    if (parsed.results_list && parsed.results_list.length > 0) {
      const clientIds = [...new Set(parsed.results_list.map(doc => doc.client_id))];
      console.log('Found client_ids:', clientIds);
      
      // Now get customer details for each client_id
      console.log('\n🔍 Step 2: Get customer details for each client_id...');
      
      for (const clientId of clientIds) {
        console.log(`\n🔍 Getting details for client_id: ${clientId}`);
        
        const customerData = querystring.stringify({
          sid: session,
          client_id: clientId
        });
        
        try {
          const customerResponse = await new Promise((resolve, reject) => {
            const req = https.request({
              hostname: 'api.icount.co.il',
              path: '/api/v3.php/client/get',
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
            try {
              const customer = JSON.parse(customerResponse.data);
              
              if (customer.status === true) {
                console.log(`✅ Client ${clientId} details:`, {
                  id: customer.id || client_id,
                  name: customer.name || customer.client_name,
                  company: customer.company || customer.company_name,
                  email: customer.email,
                  phone: customer.phone || customer.mobile
                });
                
                // Check if this is "משרד ראש הממשלה"
                const customerName = customer.name || customer.client_name || customer.company || '';
                if (customerName.includes('משרד') || customerName.includes('ראש') || customerName.includes('ממשלה')) {
                  console.log(`🎉 FOUND "משרד ראש הממשלה" - Client ID: ${clientId}`);
                  console.log('Full customer details:', JSON.stringify(customer, null, 2));
                }
              } else {
                console.log(`❌ Client ${clientId} error:`, customer.reason || customer.error_description);
              }
            } catch (e) {
              console.log(`❌ Parse error for client ${clientId}:`, e.message);
            }
          } else {
            console.log(`❌ HTTP error for client ${clientId}:`, customerResponse.status);
          }
          
        } catch (error) {
          console.log(`❌ Request error for client ${clientId}:`, error.message);
        }
        
        // Small delay
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
  }
  
  console.log('\n🏁 Customer details complete');
}

getCustomerDetails().catch(console.error);
