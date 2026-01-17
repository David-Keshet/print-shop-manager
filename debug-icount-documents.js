/**
 * Debug iCount Documents - Find orders and invoices
 */

async function debugICountDocuments() {
  console.log('🔍 ===== DEBUG iCount DOCUMENTS =====');
  console.log('Time:', new Date().toISOString());
  
  try {
    // Load credentials
    const fs = require('fs');
    const path = require('path');
    const credentialsFile = path.join(__dirname, '.icount-standalone.json');
    
    if (!fs.existsSync(credentialsFile)) {
      console.log('❌ No credentials file found');
      return;
    }
    
    const credentials = JSON.parse(fs.readFileSync(credentialsFile, 'utf8'));
    console.log('✅ Loaded credentials for:', credentials.cid);
    
    // Create iCount client
    const { ICountClient } = require('./src/lib/icount/client.js');
    const client = new ICountClient({
      cid: credentials.cid,
      user: credentials.user,
      pass: credentials.pass,
      sid: credentials.sid
    });
    
    console.log('🔌 Testing connection...');
    const testResult = await client.testConnection();
    console.log('Connection test:', testResult);
    
    if (!testResult.success) {
      console.log('❌ Connection failed');
      return;
    }
    
    console.log('\n📋 Step 1: Get all document types...');
    
    // Try different document types
    const documentTypes = [
      'order', 'deal', 'proposal', 'invoice', 'invrec', 'receipt', 'quote', 'credit'
    ];
    
    for (const type of documentTypes) {
      console.log(`\n🔍 Checking ${type} documents...`);
      
      try {
        // Get documents from last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const formatDate = (date) => {
          const d = date.getDate().toString().padStart(2, '0');
          const m = (date.getMonth() + 1).toString().padStart(2, '0');
          const y = date.getFullYear();
          return `${y}-${m}-${d}`;
        };
        
        const fromDate = formatDate(thirtyDaysAgo);
        const toDate = formatDate(new Date());
        
        const documents = await client.request('GET', `/documents/${type}`, {
          from_date: fromDate,
          to_date: toDate,
          limit: 50
        });
        
        console.log(`${type}: Found ${documents.length} documents`);
        
        if (documents.length > 0) {
          console.log(`Sample ${type}:`, documents[0]);
        }
        
      } catch (error) {
        console.log(`${type}: Error - ${error.message}`);
      }
    }
    
    console.log('\n📋 Step 2: Try broad search for ANY documents...');
    
    try {
      // Try to get documents without type filter
      const broadSearch = await client.request('GET', '/documents', {
        limit: 100,
        from_date: '2025-01-01',
        to_date: '2026-12-31'
      });
      
      console.log('Broad search: Found', broadSearch.length, 'documents');
      
      if (broadSearch.length > 0) {
        console.log('Sample documents:');
        broadSearch.slice(0, 5).forEach((doc, index) => {
          console.log(`  ${index + 1}. Type: ${doc.type || 'unknown'}, ID: ${doc.id || doc.doc_id}, Date: ${doc.date || doc.doc_date}`);
        });
      }
      
    } catch (error) {
      console.log('Broad search error:', error.message);
    }
    
    console.log('\n📋 Step 3: Check customers...');
    
    try {
      const customers = await client.request('GET', '/customers', {
        limit: 50
      });
      
      console.log('Found', customers.length, 'customers');
      
      if (customers.length > 0) {
        console.log('Sample customers:');
        customers.slice(0, 3).forEach((customer, index) => {
          console.log(`  ${index + 1}. ID: ${customer.id || customer.client_id}, Name: ${customer.name || customer.client_name}`);
        });
      }
      
    } catch (error) {
      console.log('Customers error:', error.message);
    }
    
    console.log('\n📋 Step 4: Try direct document search...');
    
    try {
      // Try to search for documents by different methods
      const searchMethods = [
        { endpoint: '/documents/search', params: { limit: 100 } },
        { endpoint: '/docs', params: { limit: 100 } },
        { endpoint: '/api/v3.php/documents', params: { limit: 100 } }
      ];
      
      for (const method of searchMethods) {
        console.log(`Trying: ${method.endpoint}`);
        
        try {
          const result = await client.request('GET', method.endpoint, method.params);
          console.log(`Success: Found ${result.length} documents`);
          
          if (result.length > 0) {
            console.log('Sample:', result[0]);
          }
          
        } catch (error) {
          console.log(`Failed: ${error.message}`);
        }
      }
      
    } catch (error) {
      console.log('Direct search error:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error('Stack:', error.stack);
  }
  
  console.log('\n🏁 ===== DEBUG COMPLETE =====');
}

debugICountDocuments().catch(console.error);
