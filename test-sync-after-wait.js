/**
 * Test Sync API After Rate Limit Wait
 */

async function testSyncAfterWait() {
  console.log('🔍 ===== TESTING iCount SYNC API AFTER WAIT =====');
  console.log('Time:', new Date().toISOString());
  
  // Wait 55 seconds to avoid rate limit
  console.log('⏳ Waiting 55 seconds to avoid rate limit...');
  await new Promise(resolve => setTimeout(resolve, 55000));
  console.log('✅ Wait completed, testing now...');
  
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
    
    // Test 2: Invoices sync
    console.log('\n📋 Test 2: Invoices sync...');
    const invoicesResponse = await fetch('http://localhost:3000/api/icount/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type: 'invoices' })
    });
    
    const invoicesData = await invoicesResponse.json();
    console.log('Invoices sync response:', invoicesData);
    
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
    
    console.log('\n✅ All API tests completed');
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    console.error('Stack:', error.stack);
  }
  
  console.log('\n🏁 ===== API TEST COMPLETE =====');
}

testSyncAfterWait().catch(console.error);
