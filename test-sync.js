const { ICountSyncService } = require('./src/lib/icount/syncService');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Standard Node fetch mock since we are in Node
if (!global.fetch) {
    global.fetch = require('node-fetch');
}

async function testSync() {
    console.log('--- STARTING ICOUNT SYNC TEST ---');
    const syncService = new ICountSyncService();

    try {
        const result = await syncService.syncInvoices();
        console.log('--- TEST RESULT ---');
        console.log(JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('--- TEST FAILED ---');
        console.error(error);
    }
}

testSync();
