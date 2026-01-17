/**
 * Test iCount Sync API
 */

async function testSyncAPI() {
  console.log('🔍 ===== TESTING iCount SYNC API =====');
  console.log('Time:', new Date().toISOString());
  
  try {
    // Test 1: Orders sync
    console.log('\n📋 Test 1: Orders sync...');
    const ordersResponse = await fetch('http://localhost:3000/api/icount/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type: 'orders' })
    });
    
    const ordersData = await ordersResponse.json();
    console.log('Orders sync response:', ordersData);
    
    // Test 2: Customers sync  
    console.log('\n📋 Test 2: Customers sync...');
    const customersResponse = await fetch('http://localhost:3000/api/icount/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type: 'customers' })
    });
    
    const customersData = await customersResponse.json();
    console.log('Customers sync response:', customersData);
    
    // Test 3: Full sync
    console.log('\n📋 Test 3: Full sync...');
    const fullSyncResponse = await fetch('http://localhost:3000/api/icount/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type: 'all' })
    });
    
    const fullSyncData = await fullSyncResponse.json();
    console.log('Full sync response:', fullSyncData);
    
    // Test 4: Open invoices count
    console.log('\n📋 Test 4: Open invoices count...');
    const countResponse = await fetch('http://localhost:3000/api/icount/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type: 'open_count' })
    });
    
    const countData = await countResponse.json();
    console.log('Open invoices count:', countData);
    
    console.log('\n✅ All API tests completed');
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    console.error('Stack:', error.stack);
  }
  
  console.log('\n🏁 ===== API TEST COMPLETE =====');
}

testSyncAPI().catch(console.error);
