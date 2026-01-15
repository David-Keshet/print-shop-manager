const https = require('https');
const http = require('http');

const checkInvoice = async () => {
  try {
    const postData = JSON.stringify({
      orderId: "fe03aadf-32d3-4319-b166-459cd5af6b37"
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/debug/check-invoice',
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
          console.log('Result:', result);
        } catch (e) {
          console.log('Response:', data);
        }
      });
    });

    req.on('error', (e) => {
      console.error('Error:', e);
    });

    req.write(postData);
    req.end();

  } catch (error) {
    console.error('Error:', error);
  }
};

checkInvoice();
