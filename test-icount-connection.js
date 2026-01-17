/**
 * Test iCount Connection after fixes
 */

async function testICountConnection() {
  console.log('🔍 Testing iCount connection after fixes...');
  
  try {
    // Import the client
    const { getICountClient } = require('./src/lib/icount/client.js');
    
    console.log('📡 Getting iCount client...');
    const client = getICountClient();
    
    // Wait a moment for initialization
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('🔐 Testing connection...');
    const result = await client.testConnection();
    
    console.log('✅ Test result:', result);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

testICountConnection();
