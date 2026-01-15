const https = require('https');
const http = require('http');

const checkOrderDetails = async () => {
  try {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/debug/check-order-details',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
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
          console.log('Order details:', result);
        } catch (e) {
          console.log('Response:', data);
        }
      });
    });

    req.on('error', (e) => {
      console.error('Error:', e);
    });

    req.end();

  } catch (error) {
    console.error('Error:', error);
  }
};

checkOrderDetails();
