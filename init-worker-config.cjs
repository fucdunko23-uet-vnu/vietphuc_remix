const fs=require('node:fs');
const file='D:/n8n/flow-automation/worker-config.json';
fs.writeFileSync(file,JSON.stringify({appUrl:'http://127.0.0.1:3000',cdpUrl:'http://127.0.0.1:9223',workerToken:require('node:crypto').randomBytes(32).toString('base64url')},null,2));
console.log('Local worker configuration created without exposing the secret.');
