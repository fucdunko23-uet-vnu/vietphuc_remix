const test = require('node:test');
const assert = require('node:assert/strict');
const { createGoogleCaption } = require('./caption.cjs');
const { createApp } = require('./server.cjs');
const photo = { mimeType: 'image/jpeg', data: require('node:fs').readFileSync(require('node:path').join(__dirname,'../test-assets/flow-fictional-person.jpg')).toString('base64') };
test('Caption reads image with server credential and rejects invalid output without exposing provider errors', async () => {
 let payload;
 const caption = createGoogleCaption({ apiKey:'test-secret', fetchImpl:async (url, options) => {
  assert.equal(options.headers['x-goog-api-key'],'test-secret'); payload=JSON.parse(options.body);
  return {ok:true,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{text:'Một nét xưa giữa ngày xanh. 🌿'}]}}]})};
 }});
 assert.equal((await caption({photo,input:{garment:'Áo dài'}})).source,'vision');
 assert.deepEqual(payload.contents[0].parts[1].inlineData,photo);
 const invalid=createGoogleCaption({apiKey:'key',fetchImpl:async()=>({ok:true,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{text:'#bad'}]}}]})})});
 assert.equal((await invalid({photo})).source,'fallback');
 assert.equal((await createGoogleCaption({apiKey:''})({photo})).source,'fallback');
});
test('Caption endpoint requires a completed private job, survives image cleanup, deduplicates and expires', async t => {
 let now=Date.now(), calls=0;
 const server=createApp({workerToken:'worker',clock:()=>now,moderate:async()=>({approved:true}),caption:async()=>{calls++;return {caption:'Nét xưa trong ngày mới. ✨',source:'vision'};}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));
 const base=`http://127.0.0.1:${server.address().port}`;
 const post=(route,data,token,method='POST')=>fetch(base+route,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(data)});
 await post('/api/worker/claim',{ready:true},'worker');
 const job=await (await post('/api/jobs',{photo,selection:{'Loại trang phục':'Áo dài','Sự kiện':'Chụp ảnh','Phong cách':'Thanh lịch','Màu yêu thích':'xanh'}})).json();
 assert.ok(job.id);
 const route=`/api/jobs/${job.id}/caption`;
 assert.equal((await post(route,{photo},job.token)).status,404);
 const {job:claimed}=await (await post('/api/worker/claim',{ready:true},'worker')).json();
 await post('/api/worker/complete',{id:job.id,lease:claimed.lease,success:true,images:[photo,photo]},'worker');
 await post('/api/jobs/'+job.id,{},job.token,'DELETE');
 assert.equal((await post(route,{photo},'wrong')).status,404);
 assert.equal((await post(route,{photo:{mimeType:'image/jpeg',data:'YmFk'}},job.token)).status,400);
 const results=await Promise.all([post(route,{photo},job.token),post(route,{photo},job.token)]);
 assert(results.every(r=>r.status===200));assert.equal(calls,1);
 now+=21*60000;assert.equal((await post(route,{photo},job.token)).status,404);
});
