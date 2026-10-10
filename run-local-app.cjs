const fs=require('node:fs');
const config=JSON.parse(fs.readFileSync('D:/n8n/flow-automation/worker-config.json','utf8'));
const { createGoogleModerator } = require('./ai-studio-app/moderation.cjs');
const { loadLocalGoogleKey } = require('./local-google-key.cjs');
const { createGoogleCaption } = require('./ai-studio-app/caption.cjs');
const apiKey=loadLocalGoogleKey();
require('./ai-studio-app/server.cjs').createApp({workerToken:config.workerToken, moderate:createGoogleModerator({apiKey}), caption:createGoogleCaption({apiKey})}).listen(3000,'127.0.0.1',()=>console.log('Việt phục Remix: http://localhost:3000'));
