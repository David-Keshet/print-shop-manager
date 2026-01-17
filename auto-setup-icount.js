/**
 * Auto Setup iCount from ENV
 * קורא פרטים מ-env ומגדיר אוטומטית
 */

const fs = require('fs');
const path = require('path');

// קרא משתני סביבה
require('dotenv').config({ path: '.env.local' });

async function autoSetup() {
  console.log('🔧 Auto Setup iCount from Environment');
  console.log('=====================================');
  
  const cid = process.env.NEXT_PUBLIC_ICOUNT_CID;
  const user = process.env.NEXT_PUBLIC_ICOUNT_USER;
  const pass = process.env.NEXT_PUBLIC_ICOUNT_PASS;
  
  console.log('CID:', cid);
  console.log('User:', user);
  console.log('Pass:', pass ? '*** Found ***' : 'Not found');
  
  if (!cid || !user || !pass || cid === 'YOUR_CID_HERE') {
    console.log('❌ No valid credentials found in environment');
    console.log('Please update .env.local with real iCount credentials');
    return false;
  }
  
  // צור קובץ credentials למערכת העצמאית
  const credentials = {
    cid: cid,
    user: user,
    pass: pass,
    created: new Date().toISOString(),
    source: 'environment'
  };
  
  const credentialsFile = path.join(__dirname, '.icount-standalone.json');
  fs.writeFileSync(credentialsFile, JSON.stringify(credentials, null, 2));
  
  console.log('✅ Credentials saved to:', credentialsFile);
  
  // בדוק את החיבור
  const { StandaloneICountManager } = require('./standalone-icount-manager.js');
  const manager = new StandaloneICountManager();
  
  console.log('🔍 Testing connection...');
  const isConnected = await manager.checkConnection();
  
  if (isConnected) {
    console.log('✅ Connection successful!');
    console.log('🚀 Starting 24/7 monitoring...');
    
    // הפעל ניטור ברקע
    const { spawn } = require('child_process');
    const monitor = spawn('node', ['standalone-icount-manager.js', 'monitor'], {
      detached: true,
      stdio: 'ignore'
    });
    
    monitor.unref();
    
    console.log('✅ 24/7 monitoring started!');
    console.log('📝 Logs: icount-standalone.log');
    return true;
    
  } else {
    console.log('❌ Connection failed');
    console.log('Please check your iCount credentials');
    return false;
  }
}

autoSetup().then(success => {
  if (success) {
    console.log('\n🎉 Setup complete! iCount is now monitored 24/7');
  } else {
    console.log('\n❌ Setup failed. Please check your credentials');
  }
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ Setup error:', error);
  process.exit(1);
});
