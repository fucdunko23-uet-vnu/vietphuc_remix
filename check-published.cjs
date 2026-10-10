const fs=require('node:fs');
(async()=>{
const config=JSON.parse(fs.readFileSync('D:/n8n/flow-automation/worker-config.json','utf8'));
const base=config.appUrl;
const health=await fetch(base+'/api/status');if(health.status!==200)throw new Error('Status endpoint failed');
const auth=await fetch(base+'/api/worker/claim',{method:'POST',headers:{'Content-Type':'application/json'},body:'{"ready":true}'});if(auth.status!==401)throw new Error('Unauthenticated worker was not rejected');
for(const route of ['/','/app.js','/style.css']){const r=await fetch(base+route);const s=await r.text();if(!r.ok||s.includes(config.workerToken))throw new Error('Static route or secret isolation failed');}
const status=await(await fetch(base+'/api/status')).json();
console.log(JSON.stringify({url:base,health:200,unauthenticatedWorker:401,secretAbsentFromFrontend:true,flowReady:status.ready}));
})().catch(e=>{console.error(e.message);process.exitCode=1});
