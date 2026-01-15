const https = require('https');
const http = require('http');

const debugFetch = async () => {
  console.log('Debugging fetchDocuments...');
  
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
          console.log('=== INVOICES ===');
          console.log('Count:', result.totalInvoices);
          result.invoices.forEach((inv, i) => {
            console.log(`${i+1}. ${inv.invoice_number} - ${inv.invoice_type} - ${inv.internal_notes}`);
          });
          
          console.log('\n=== ORDERS ===');
          console.log('Count:', result.totalOrders);
          result.orders.forEach((order, i) => {
            console.log(`${i+1}. ${order.icount_doc_number} - ${order.customer_name} - ${order.status}`);
          });
          
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

debugFetch();
