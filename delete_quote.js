const https = require('https');
const http = require('http');

const deleteQuote = async () => {
  try {
    const postData = JSON.stringify({
      invoice_number: "8000",
      invoice_type: "quote"
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/debug/delete-invoice',
      method: 'DELETE',
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
          console.log('Delete result:', result);
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

deleteQuote();
