const fs=require('node:fs');
(async()=>{
const file='D:/n8n/flow-automation/worker-config.json';
const config=JSON.parse(fs.readFileSync(file,'utf8'));
const url=new URL(process.argv[2]);
if(url.protocol!=='https:'||!url.hostname.endsWith('.ai.studio'))throw new Error('Expected the published AI Studio HTTPS URL.');
const r=await fetch(new URL('/api/worker/claim',url),{method:'POST',headers:{'Content-Type':'application/json',authorization:'Bearer '+config.workerToken},body:JSON.stringify({ready:false,detail:'Đang kết nối bộ điều khiển Flow…'}),signal:AbortSignal.timeout(20000)});
if(!r.ok)throw new Error('Cloud worker authentication failed: HTTP '+r.status);
const data=await r.json();if(!Object.hasOwn(data,'job'))throw new Error('Unexpected API contract.');
config.appUrl=url.origin;
fs.writeFileSync(file,JSON.stringify(config,null,2));
console.log('Authenticated and configured worker for '+url.origin);
})().catch(e=>{console.error(e.message);process.exitCode=1});
