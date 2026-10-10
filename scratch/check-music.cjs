const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require('D:/n8n/node_modules/playwright-core');
const {createApp}=require('../ai-studio-app/server.cjs');
(async()=>{
 const server=createApp();await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=process.argv[2]||`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--autoplay-policy=user-gesture-required']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[],audioRequests=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('/audio/'))audioRequests.push(r.url());});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto(base+'/#ban-do');await page.waitForTimeout(250);
  assert.equal(audioRequests.length,0,'No music downloaded before interaction');
  assert.equal(await page.evaluate(()=>VietPhucMusic.getState().playing),false);
  await page.locator('#music-toggle').click();
  await page.waitForFunction(()=>VietPhucMusic.getState().playing&&!VietPhucMusic.getState().failed);
  assert.equal(await page.evaluate(()=>VietPhucMusic.getState().volume),0.12);
  for(const region of ['bac-bo','tay-bac','hue-trung-bo','tay-nguyen','nam-bo']){
   await page.evaluate(region=>zoomToRegion(region),region);
   await page.waitForFunction(region=>VietPhucMusic.getState().track===region&&VietPhucMusic.getState().playing,region);
   await page.waitForTimeout(450);
   assert.equal(await page.evaluate(()=>VietPhucMusic.getState().failed),false);
  }
  await page.evaluate(()=>zoomOutToNational());
  for(const [dock,track]of [['north','bac-bo'],['central','hue-trung-bo'],['south','nam-bo']]){
   await page.locator(`[data-pan-target="${dock}"]`).click();
   assert.equal(await page.evaluate(()=>VietPhucMusic.getState().track),track);
  }
  for(const route of ['trang-chu','kham-pha','thu-do','huong-dan','gioi-thieu','ban-do']){
   await page.evaluate(route=>{location.hash=route;},route);
   await page.locator(`[data-page="${route}"]`).waitFor({state:'visible'});
   assert.equal(await page.evaluate(()=>VietPhucMusic.getState().page),route);
  }
  await page.evaluate(()=>{for(const id of ['bac-bo','nam-bo','tay-bac','hue-trung-bo','tay-nguyen'])VietPhucMusic.setRegion(id);});
  await page.waitForTimeout(850);assert.equal(await page.evaluate(()=>VietPhucMusic.getState().track),'tay-nguyen');
  await page.locator('#music-toggle').click();assert.equal(await page.evaluate(()=>VietPhucMusic.getState().enabled),false);
  await page.reload();await page.locator('#music-settings').click();assert.equal(await page.evaluate(()=>VietPhucMusic.getState().enabled),false);
  await page.locator('#music-toggle').click();await page.waitForFunction(()=>VietPhucMusic.getState().playing);
  await page.locator('#music-settings').click();
  await page.locator('#music-volume').evaluate(el=>{el.value='25';el.dispatchEvent(new Event('input',{bubbles:true}));});
  assert.equal(await page.evaluate(()=>VietPhucMusic.getState().volume),0.25);
  // Simulate browser visibility notifications without accessing the Flow browser.
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
  assert.equal(await page.evaluate(()=>VietPhucMusic.getState().playing),false);
  await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});
  await page.waitForFunction(()=>VietPhucMusic.getState().playing);
  await page.evaluate(()=>startLoadingLounge('flow'));
  assert.equal(await page.locator('#heritage-loading-overlay #music-player').count(),1);
  await page.locator('#music-toggle').click();assert.equal(await page.evaluate(()=>VietPhucMusic.getState().enabled),false);
  await page.evaluate(()=>stopLoadingLounge());assert.equal(await page.locator('body > #music-player').count(),1);
  const photo={mimeType:'image/jpeg',data:fs.readFileSync('test-assets/flow-fictional-person.jpg').toString('base64')};
  await page.evaluate(async photo=>{
   location.hash='thu-do';
   const r=await fetch('/api/preview',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({selection:{'Loại trang phục':'Áo dài','Sự kiện':'Chụp ảnh','Phong cách':'Thanh lịch','Màu yêu thích':'xanh'}})});
   const data=await r.json();window.currentResultsData=null;showResults({...data,images:[photo,photo]},'flow');openPhotoboothStudio('strip');
  },photo);
  await page.locator('#photobooth-modal #music-player').waitFor({state:'visible'});
  await page.locator('#music-settings').click();await page.locator('#music-volume').focus();await page.keyboard.press('Escape');
  assert.equal(await page.locator('#photobooth-modal').isVisible(),true,'Escape first closes music settings');
  await page.keyboard.press('Escape');assert.equal(await page.locator('#photobooth-modal').isVisible(),false);
  for(const width of [320,390,1440]){
   await page.setViewportSize({width,height:844});
   await page.evaluate(()=>{location.hash='ban-do';});
   await page.locator('[data-page="ban-do"]').waitFor({state:'visible'});
   await page.evaluate(()=>zoomToRegion('tay-bac','laocai'));
   await page.waitForTimeout(750);
   await page.evaluate(()=>selectCultureProvince('laocai'));
   await page.locator('#infographic-callout-deck').waitFor({state:'visible'});
   const layout=await page.evaluate(()=>{
    const m=document.querySelector('#music-player').getBoundingClientRect(),d=document.querySelector('#infographic-callout-deck').getBoundingClientRect();
    return {overflow:document.documentElement.scrollWidth>innerWidth,musicInViewport:m.left>=0&&m.right<=innerWidth&&m.bottom<=innerHeight,overlap:innerWidth<=768&&d.bottom>m.top};
   });
   assert.equal(layout.overflow,false);assert.equal(layout.musicInViewport,true);assert.equal(layout.overlap,false);
   await page.screenshot({path:`output/music-map-${width}.png`});
  }
  const restricted=await browser.newPage();await restricted.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new Error('Storage disabled');}});});
  await restricted.goto(base+'/#thu-do');assert.equal(await restricted.locator('#music-player').count(),1);await restricted.close();
  assert.deepEqual(errors,[]);console.log('PASS music: gesture, five regions, three dock buttons, six pages, rapid switches, saved mute/volume, visibility, modal controls, mobile layout and storage fallback.');
  for(const filename of ['overview','bac-bo','tay-bac','hue-trung-bo','tay-nguyen','nam-bo','thu-do','trang-chu','kham-pha','huong-dan','gioi-thieu']){
   const r=await fetch(base+'/audio/'+filename+'.mp3',{headers:{Range:'bytes=0-63'}});assert.equal(r.status,206);assert.equal((await r.arrayBuffer()).byteLength,64);assert.match(r.headers.get('content-type'),/audio\/mpeg/);
  }
  const suffix=await fetch(base+'/audio/overview.mp3',{headers:{Range:'bytes=-64'}});assert.equal(suffix.status,206);assert.equal((await suffix.arrayBuffer()).byteLength,64);
  assert.equal((await fetch(base+'/audio/overview.mp3',{headers:{Range:'bytes=999999999-'}})).status,416);
  assert.equal((await fetch(base+'/audio/overview.mp3',{method:'HEAD'})).status,200);
  console.log('PASS MP3 transport: eleven tracks, byte/suffix ranges, invalid range, HEAD.');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
