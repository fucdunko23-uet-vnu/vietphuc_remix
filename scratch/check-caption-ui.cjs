const fs=require('fs'),assert=require('node:assert/strict');
const {chromium}=require('D:/n8n/node_modules/playwright-core');
const {createApp}=require('../ai-studio-app/server.cjs');
(async()=>{
 let calls=0;
 const server=createApp({workerToken:'test',moderate:async()=>({approved:true}),caption:async({photo})=>{assert.equal(photo.mimeType,'image/jpeg');calls++;await new Promise(r=>setTimeout(r,300));return {caption:'Nắng khẽ chạm tà áo, mình giữ một nét xưa. 🌿',source:'vision'};}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
 const post=async(route,data,token,method='POST')=>{const r=await fetch(base+route,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(data)});assert(r.ok);return r.json();};
 const photo={mimeType:'image/jpeg',data:fs.readFileSync('test-assets/flow-fictional-person.jpg').toString('base64')};
 await post('/api/worker/claim',{ready:true},'test');
 const job=await post('/api/jobs',{photo,selection:{'Loại trang phục':'Áo dài','Sự kiện':'Chụp ảnh','Phong cách':'Thanh lịch','Màu yêu thích':'xanh'}});
 const {job:claimed}=await post('/api/worker/claim',{ready:true},'test');
 await post('/api/worker/complete',{id:job.id,lease:claimed.lease,success:true,images:[photo,photo]},'test');
 const state=await (await fetch(base+'/api/jobs/'+job.id,{headers:{Authorization:'Bearer '+job.token}})).json();
 await post('/api/jobs/'+job.id,{},job.token,'DELETE');
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.context().grantPermissions(['clipboard-read','clipboard-write']);
  for(const width of [390,1440]){
   await page.setViewportSize({width,height:900});await page.goto(base+'/#thu-do');
   await page.evaluate(({state,job,source})=>{photo=source;showResults({...state,captionSession:job},'flow');openPhotoboothStudio('strip');},{state,job,source:photo});
   await page.locator('#pb-caption-card').waitFor({state:'visible'});
   assert.equal(await page.locator('#btn-pb-download').isEnabled(),true);
   await page.waitForFunction(()=>!document.querySelector('#btn-pb-copy-caption').disabled);
   await page.locator('#btn-pb-copy-caption').click();
   const copied=await page.evaluate(()=>navigator.clipboard.readText());assert.match(copied,/#VietPhucRemix/);assert.match(copied,/Nắng khẽ/);
   const before=calls;await page.evaluate(()=>renderPhotoboothCanvas());await page.waitForTimeout(850);assert.equal(calls,before);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   await page.locator('#pb-caption-card').scrollIntoViewIfNeeded();await page.screenshot({path:`output/photobooth-caption-${width}.png`});
   await page.keyboard.press('Escape');
   console.log('PASS caption loading, independent download, copy/signature, rerender cache:',width);
  }
  assert.deepEqual(errors,[]);
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
