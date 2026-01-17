/**
 * Check Documents Detail - What's in the response?
 */

const https = require('https');
const querystring = require('querystring');

async function checkDetail() {
  console.log('🔍 Checking iCount Response Detail');
  console.log('==================================');
  
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
  
  console.log('✅ Logged in');
  
  // Check documents with full response
  const docOptions = {
    hostname: 'api.icount.co.il',
    path: '/api/v3.php/documents?' + querystring.stringify({
      sid: session,
      limit: 50,
      from_date: '2025-01-01',
      to_date: '2026-12-31'
    }),
    method: 'GET'
  };
  
  const response = await new Promise((resolve, reject) => {
    const req = https.request(docOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, data: data });
      });
    });
    
    req.on('error', reject);
    req.end();
  });
  
  console.log('Status:', response.status);
  console.log('Raw data length:', response.data.length);
  console.log('First 500 chars:', response.data.substring(0, 500));
  
  try {
    const parsed = JSON.parse(response.data);
    console.log('Parsed type:', typeof parsed);
    console.log('Is array:', Array.isArray(parsed));
    console.log('Keys:', Object.keys(parsed));
    
    if (parsed.documents) {
      console.log('Documents count:', parsed.documents.length);
      if (parsed.documents.length > 0) {
        console.log('Sample document:', parsed.documents[0]);
      }
    }
    
    if (parsed.data) {
      console.log('Data count:', parsed.data.length);
      if (parsed.data.length > 0) {
        console.log('Sample data:', parsed.data[0]);
      }
    }
    
    if (Array.isArray(parsed)) {
      console.log('Direct array length:', parsed.length);
      if (parsed.length > 0) {
        console.log('Sample array item:', parsed[0]);
      }
    }
    
  } catch (e) {
    console.log('Parse error:', e.message);
  }
}

checkDetail().catch(console.error);
