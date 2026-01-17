/**
 * Standalone iCount Manager - Works without Supabase dependency
 * מנהל iCount עצמאי שעובד 24/7 בלי תלות במערכות חיצוניות
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

class StandaloneICountManager {
  constructor() {
    this.credentialsFile = path.join(__dirname, '.icount-standalone.json');
    this.logFile = path.join(__dirname, 'icount-standalone.log');
    this.isRunning = false;
    this.lastCheck = null;
    this.connectionStatus = 'unknown';
  }

  /**
   * כתיבת לוג
   */
  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}\n`;
    console.log(logMessage.trim());
    fs.appendFileSync(this.logFile, logMessage);
  }

  /**
   * טעינת פרטי iCount מקובץ מקומי
   */
  loadCredentials() {
    try {
      if (!fs.existsSync(this.credentialsFile)) {
        this.log('Credentials file not found, creating template', 'WARN');
        this.createCredentialsTemplate();
        return null;
      }
      
      const data = fs.readFileSync(this.credentialsFile, 'utf8');
      const credentials = JSON.parse(data);
      
      // בדוק שכל השדות קיימים
      if (!credentials.cid || !credentials.user || !credentials.pass) {
        this.log('Incomplete credentials', 'ERROR');
        return null;
      }
      
      return credentials;
    } catch (error) {
      this.log(`Failed to load credentials: ${error.message}`, 'ERROR');
      return null;
    }
  }

  /**
   * יצירת תבנית קובץ פרטים
   */
  createCredentialsTemplate() {
    const template = {
      cid: "YOUR_CID_HERE",
      user: "YOUR_USER_HERE", 
      pass: "YOUR_PASSWORD_HERE",
      created: new Date().toISOString(),
      notes: "Replace YOUR_* values with actual iCount credentials"
    };
    
    fs.writeFileSync(this.credentialsFile, JSON.stringify(template, null, 2));
    this.log('Created credentials template file', 'INFO');
  }

  /**
   * בדיקת חיבור ל-iCount
   */
  async testConnection(credentials) {
    return new Promise((resolve, reject) => {
      const formData = new URLSearchParams();
      formData.append('cid', credentials.cid);
      formData.append('user', credentials.user);
      formData.append('pass', credentials.pass);

      const options = {
        hostname: 'api.icount.co.il',
        port: 443,
        path: '/api/v3.php/auth/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(formData.toString())
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            if (result.sid) {
              resolve({ success: true, sid: result.sid, message: 'Connection successful' });
            } else {
              resolve({ success: false, error: result.error_description || 'Login failed' });
            }
          } catch (parseError) {
            resolve({ success: false, error: 'Invalid response format' });
          }
        });
      });

      req.on('error', (error) => {
        resolve({ success: false, error: error.message });
      });

      req.setTimeout(10000, () => {
        req.destroy();
        resolve({ success: false, error: 'Connection timeout' });
      });

      req.write(formData.toString());
      req.end();
    });
  }

  /**
   * הפעלת בדיקת חיבור
   */
  async checkConnection() {
    const credentials = this.loadCredentials();
    if (!credentials) {
      this.connectionStatus = 'no_credentials';
      this.log('No credentials available', 'ERROR');
      return false;
    }

    if (credentials.cid === 'YOUR_CID_HERE') {
      this.connectionStatus = 'template_credentials';
      this.log('Using template credentials - please configure', 'WARN');
      return false;
    }

    this.log('Testing iCount connection...', 'INFO');
    const result = await this.testConnection(credentials);
    
    if (result.success) {
      this.connectionStatus = 'connected';
      this.log('✅ iCount connection successful', 'INFO');
      return true;
    } else {
      this.connectionStatus = 'failed';
      this.log(`❌ iCount connection failed: ${result.error}`, 'ERROR');
      return false;
    }
  }

  /**
   * הגדרת פרטי iCount אינטראקטיבית
   */
  async setupCredentials() {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log('\n🔧 iCount Credentials Setup');
    console.log('============================');

    const cid = await new Promise(resolve => {
      rl.question('Enter iCount CID: ', resolve);
    });
    
    const user = await new Promise(resolve => {
      rl.question('Enter iCount User: ', resolve);
    });
    
    const pass = await new Promise(resolve => {
      rl.question('Enter iCount Password: ', resolve);
    });
    
    rl.close();

    const credentials = {
      cid: cid.trim(),
      user: user.trim(),
      pass: pass.trim(),
      created: new Date().toISOString(),
      lastTest: null
    };

    fs.writeFileSync(this.credentialsFile, JSON.stringify(credentials, null, 2));
    this.log('✅ Credentials saved successfully', 'INFO');
    
    // בדיקה מיידית
    const testResult = await this.testConnection(credentials);
    if (testResult.success) {
      credentials.lastTest = new Date().toISOString();
      credentials.status = 'working';
      fs.writeFileSync(this.credentialsFile, JSON.stringify(credentials, null, 2));
      this.log('✅ Credentials verified and working', 'INFO');
    } else {
      credentials.status = 'failed';
      credentials.error = testResult.error;
      fs.writeFileSync(this.credentialsFile, JSON.stringify(credentials, null, 2));
      this.log(`❌ Credentials test failed: ${testResult.error}`, 'ERROR');
    }

    return testResult.success;
  }

  /**
   * הפעלת ניטור רציף
   */
  async startMonitoring(intervalMinutes = 5) {
    this.isRunning = true;
    this.log(`🚀 Starting iCount monitoring (check every ${intervalMinutes} minutes)`, 'INFO');

    while (this.isRunning) {
      try {
        this.lastCheck = new Date();
        const isConnected = await this.checkConnection();
        
        if (!isConnected) {
          this.log('⚠️ Connection issue detected', 'WARN');
        }

        // המתן לבדיקה הבאה
        const waitTime = intervalMinutes * 60 * 1000;
        this.log(`Next check in ${intervalMinutes} minutes...`, 'INFO');
        
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
      } catch (error) {
        this.log(`Monitoring error: ${error.message}`, 'ERROR');
        await new Promise(resolve => setTimeout(resolve, 30000)); // 30 שניות במקרה שגיאה
      }
    }
  }

  /**
   * עצירת ניטור
   */
  stopMonitoring() {
    this.isRunning = false;
    this.log('🛑 Monitoring stopped', 'INFO');
  }

  /**
   * הצגת סטטוס
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastCheck: this.lastCheck,
      connectionStatus: this.connectionStatus,
      logFile: this.logFile,
      credentialsFile: this.credentialsFile
    };
  }
}

// הפעלה ישירה
if (require.main === module) {
  const manager = new StandaloneICountManager();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'setup':
      manager.setupCredentials().then(success => {
        if (success) {
          console.log('\n✅ Setup complete! Starting monitoring...');
          manager.startMonitoring();
        } else {
          console.log('\n❌ Setup failed. Please check your credentials and try again.');
          process.exit(1);
        }
      });
      break;
      
    case 'monitor':
      manager.startMonitoring();
      break;
      
    case 'test':
      manager.checkConnection().then(success => {
        console.log(`\n${success ? '✅' : '❌'} Connection test ${success ? 'passed' : 'failed'}`);
        process.exit(success ? 0 : 1);
      });
      break;
      
    case 'status':
      const status = manager.getStatus();
      console.log('\n📊 iCount Manager Status:');
      console.log('========================');
      console.log(`Running: ${status.isRunning ? '✅' : '❌'}`);
      console.log(`Last Check: ${status.lastCheck || 'Never'}`);
      console.log(`Connection: ${status.connectionStatus}`);
      console.log(`Log File: ${status.logFile}`);
      console.log(`Credentials: ${status.credentialsFile}`);
      break;
      
    default:
      console.log('\n🔧 Standalone iCount Manager');
      console.log('============================');
      console.log('Usage:');
      console.log('  node standalone-icount-manager.js setup    - Setup credentials and start monitoring');
      console.log('  node standalone-icount-manager.js monitor  - Start monitoring only');
      console.log('  node standalone-icount-manager.js test    - Test connection');
      console.log('  node standalone-icount-manager.js status   - Show status');
      console.log('\nQuick start:');
      console.log('  1. Run: node standalone-icount-manager.js setup');
      console.log('  2. Enter your iCount credentials');
      console.log('  3. The system will monitor 24/7 automatically');
      break;
  }
}

module.exports = StandaloneICountManager;
