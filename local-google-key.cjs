// Local launcher only. Never bundle machine-specific credentials into the app ZIP.
const fs = require('node:fs');
function loadLocalGoogleKey() {
  if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  try {
    const { DatabaseSync } = require('node:sqlite');
    const { CipherAes256CBC } = require('D:/n8n/node_modules/n8n-core/dist/encryption/aes-256-cbc.js');
    const db = new DatabaseSync('D:/n8n/data/.n8n/database.sqlite', { readOnly: true });
    let row;
    try { row = db.prepare('SELECT data FROM credentials_entity WHERE id=?').get('vietPhucGoogleGemini'); }
    finally { db.close(); }
    const config = JSON.parse(fs.readFileSync('D:/n8n/data/.n8n/config', 'utf8'));
    return JSON.parse(new CipherAes256CBC().decrypt(row.data, config.encryptionKey)).apiKey || '';
  } catch { return ''; }
}
module.exports = { loadLocalGoogleKey };
