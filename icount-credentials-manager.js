/**
 * iCount Credentials Manager
 * מנהל פרטי התחברות מאובטחים ל-iCount
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class ICCountCredentialsManager {
  constructor() {
    this.credentialsFile = path.join(__dirname, '.icount-credentials.json');
    this.encryptionKey = this.getOrCreateKey();
  }

  /**
   * יצירת או טעינת מפתח הצפנה
   */
  getOrCreateKey() {
    const keyFile = path.join(__dirname, '.icount-key');
    
    if (fs.existsSync(keyFile)) {
      return fs.readFileSync(keyFile, 'utf8');
    }
    
    // צור מפתח חדש
    const key = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(keyFile, key, 'utf8');
    return key;
  }

  /**
   * הצפנת פרטי התחברות
   */
  encrypt(text) {
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(this.encryptionKey, 'hex');
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher(algorithm, key);
    cipher.setAAD(Buffer.from('iCount', 'utf8'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  /**
   * פענוח פרטי התחברות
   */
  decrypt(encryptedData) {
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(this.encryptionKey, 'hex');
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const authTag = Buffer.from(encryptedData.authTag, 'hex');
    
    const decipher = crypto.createDecipher(algorithm, key);
    decipher.setAAD(Buffer.from('iCount', 'utf8'));
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * שמירת פרטי התחברות מוצפנים
   */
  saveCredentials(cid, user, pass) {
    const credentials = {
      cid: this.encrypt(cid),
      user: this.encrypt(user),
      pass: this.encrypt(pass),
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync(this.credentialsFile, JSON.stringify(credentials, null, 2));
    console.log('✅ iCount credentials saved securely');
  }

  /**
   * טעינת פרטי התחברות
   */
  loadCredentials() {
    if (!fs.existsSync(this.credentialsFile)) {
      return null;
    }
    
    try {
      const encrypted = JSON.parse(fs.readFileSync(this.credentialsFile, 'utf8'));
      
      return {
        cid: this.decrypt(encrypted.cid),
        user: this.decrypt(encrypted.user),
        pass: this.decrypt(encrypted.pass),
        timestamp: encrypted.timestamp
      };
    } catch (error) {
      console.error('❌ Failed to load credentials:', error.message);
      return null;
    }
  }

  /**
   * עדכון קובץ .env.local עם פרטים מוצפנים
   */
  updateEnvFile() {
    const credentials = this.loadCredentials();
    if (!credentials) {
      console.log('❌ No credentials found');
      return false;
    }

    const envPath = path.join(__dirname, '.env.local');
    let envContent = '';
    
    // קרא תוכן קיים
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    // הסר שורות ישנות של iCount
    const lines = envContent.split('\n');
    const filteredLines = lines.filter(line => 
      !line.startsWith('NEXT_PUBLIC_ICOUNT_')
    );

    // הוסף פרטים חדשים
    filteredLines.push('NEXT_PUBLIC_ICOUNT_CID=' + credentials.cid);
    filteredLines.push('NEXT_PUBLIC_ICOUNT_USER=' + credentials.user);
    filteredLines.push('NEXT_PUBLIC_ICOUNT_PASS=' + credentials.pass);

    // שמור בחזרה
    fs.writeFileSync(envPath, filteredLines.join('\n'));
    
    console.log('✅ .env.local updated with iCount credentials');
    return true;
  }

  /**
   * אתחול אינטראקטיבי
   */
  async setup() {
    console.log('🔧 iCount Credentials Setup');
    console.log('================================');
    
    // בדוק אם כבר יש פרטים
    const existing = this.loadCredentials();
    if (existing) {
      console.log('📋 Found existing credentials:');
      console.log(`   CID: ${existing.cid}`);
      console.log(`   User: ${existing.user}`);
      console.log(`   Saved: ${existing.timestamp}`);
      
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const answer = await new Promise(resolve => {
        rl.question('Use existing credentials? (y/n): ', resolve);
      });
      
      rl.close();
      
      if (answer.toLowerCase() === 'y') {
        this.updateEnvFile();
        return true;
      }
    }

    // קלוט פרטים חדשים
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

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

    // שמור ועדכן
    this.saveCredentials(cid, user, pass);
    this.updateEnvFile();
    
    return true;
  }
}

// אם מריצים ישירות
if (require.main === module) {
  const manager = new ICCountCredentialsManager();
  manager.setup().then(() => {
    console.log('✅ Setup complete!');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  });
}

module.exports = ICCountCredentialsManager;
