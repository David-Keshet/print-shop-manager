const https = require('https');
const http = require('http');

const updateOrder = async () => {
  try {
    const postData = JSON.stringify({
      icount_doc_number: "8000",
      customer_name: "דוד הלוי",
      doc_type: "הזמנת עבודה"
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/debug/fix-order',
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

updateOrder();
