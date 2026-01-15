const https = require('https');
const http = require('http');

const testSync = async () => {
  console.log('Testing invoices sync...');
  
  try {
    const postData = JSON.stringify({ type: 'invoices' });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/icount/sync',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('Invoices sync result:', result);
        } catch (e) {
          console.log('Invoices response:', data);
        }
      });
    });

    req.on('error', (e) => {
      console.error('Invoices sync error:', e);
    });

    req.write(postData);
    req.end();

  } catch (error) {
    console.error('Error:', error);
  }

  console.log('\nTesting orders sync...');
  
  try {
    const postData = JSON.stringify({ type: 'orders' });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/icount/sync',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('Orders sync result:', result);
        } catch (e) {
          console.log('Orders response:', data);
        }
      });
    });

    req.on('error', (e) => {
      console.error('Orders sync error:', e);
    });

    req.write(postData);
    req.end();

  } catch (error) {
    console.error('Error:', error);
  }
};

testSync();
