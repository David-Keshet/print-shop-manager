const https = require('https');
const http = require('http');

const testFetchDocuments = async () => {
  console.log('Testing fetchDocuments...');
  
  try {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/debug/check-documents',
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
          console.log('Documents result:', result);
        } catch (e) {
          console.log('Documents response:', data);
        }
      });
    });

    req.on('error', (e) => {
      console.error('Documents fetch error:', e);
    });

    req.end();

  } catch (error) {
    console.error('Error:', error);
  }
};

testFetchDocuments();
