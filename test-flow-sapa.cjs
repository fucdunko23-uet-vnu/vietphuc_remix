const fs=require('node:fs'),path=require('node:path');
(async()=>{
 const base='https://viet-phuc-remix.ai.studio';
 const request=async(route,body,token,method)=>{const r=await fetch(base+route,{method:method||(body?'POST':'GET'),headers:{...(body?{'Content-Type':'application/json'}:{}),...(token?{authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(20000)});const data=await r.json();if(!r.ok)throw Error(data.error||'HTTP '+r.status);return data;};
 const selection={'Địa điểm':'laocai','Loại trang phục':'Váy xòe','Bối cảnh':'Thung lũng Mường Hoa','Chi tiết phong cảnh':'Ruộng bậc thang xanh, sương nhẹ, không có đám đông','Ánh sáng':'Sáng sớm','Kiểu ảnh':'Ảnh toàn thân','Sự kiện':'Chụp ảnh','Phong cách':'Thanh lịch','Màu yêu thích':'xanh chàm','Phụ kiện yêu thích':'Không dùng phụ kiện'};
 const state=await request('/api/status');if(!state.ready)throw Error(state.message);
 const photo={mimeType:'image/jpeg',data:fs.readFileSync(path.join(__dirname,'test-assets/flow-fictional-person.jpg')).toString('base64')};
 const job=await request('/api/jobs',{selection,photo});console.log('Submitted Sa Pa test with fictional adult fixture.');
 const start=Date.now();let last;
 while(Date.now()-start<8*60000){await new Promise(r=>setTimeout(r,10000));const result=await request('/api/jobs/'+job.id,null,job.token);
  if(result.status!==last){console.log(result.status,result.message||'');last=result.status;}
  if(result.status==='failed')throw Error(result.message);
  if(result.status==='succeeded'){
   if(result.input.destination!=='Sa Pa'||result.input.garment!=='Váy xòe'||result.images.length!==2)throw Error('Incorrect result metadata');
   result.images.forEach((im,i)=>fs.writeFileSync('D:/n8n/flow-automation/sapa-tryon-'+(i+1)+'.png',Buffer.from(im.data,'base64')));
   await request('/api/jobs/'+job.id,null,job.token,'DELETE');console.log('PASS: 2 Flow images received for Sa Pa / váy xòe / Mường Hoa.');return;
  }
 }
 throw Error('Timed out; do not automatically resubmit the generation.');
})().catch(e=>{console.error(e.message);process.exitCode=1});
