const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('D:/n8n/node_modules/playwright-core');
(async()=>{
const base='http://127.0.0.1:3000';
const state=await (await fetch(base+'/api/status')).json();
if(!state.ready)throw new Error('Worker is offline.');
const r=await fetch(base+'/api/jobs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({selection:{'Kiểu ảnh':'Ảnh toàn thân','Loại trang phục':'Áo dài','Sự kiện':'Chụp ảnh','Bối cảnh':'Phố cổ','Phong cách':'Năng động','Màu yêu thích':'xanh mint','Phụ kiện yêu thích':'Túi mini'},photo:{mimeType:'image/jpeg',data:fs.readFileSync(path.join(__dirname,'test-assets/flow-fictional-person.jpg')).toString('base64')}})});
const job=await r.json();if(!r.ok)throw new Error(job.error);
console.log('Submitted fictional adult reference to the live Flow worker.');
for(let i=0;i<110;i++){
await new Promise(r=>setTimeout(r,5000));
const result=await (await fetch(base+'/api/jobs/'+job.id,{headers:{authorization:'Bearer '+job.token}})).json();
if(result.status==='failed')throw new Error(result.message);
if(result.status==='succeeded'){
for(let n=0;n<result.images.length;n++)fs.writeFileSync(path.join(__dirname,'test-assets/flow-tryon-'+(n+1)+'.png'),Buffer.from(result.images[n].data,'base64'));
fs.writeFileSync(path.join(__dirname,'test-assets/flow-live-result.json'),JSON.stringify({...result,images:result.images.map(x=>({mimeType:x.mimeType,bytes:Buffer.from(x.data,'base64').length}))},null,2));
console.log('SUCCESS: Two real Flow images saved.');return;
}
if(i%6===0)console.log('Status: '+result.status);
}throw new Error('Test timed out without resubmitting.');
})().catch(e=>{console.error(e.message);process.exitCode=1});
