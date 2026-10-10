const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('D:/n8n/node_modules/playwright-core');
const {createApp}=require('./ai-studio-app/server.cjs');
(async()=>{
 const server=createApp();await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
  const p=await browser.newPage();p.setDefaultTimeout(10000);const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.route(/https:\/\/fonts\./,r=>r.abort());await p.emulateMedia({reducedMotion:'reduce'});
  const presets=JSON.parse(fs.readFileSync('ai-studio-app/public/presets.json','utf8'));
  let places=0,looks=0,mapPlaces=0;
  for(const width of [1440,320]){
   await p.setViewportSize({width,height:1000});
   await p.goto(base+'/#thu-do',{waitUntil:'domcontentloaded'});
   const keys=await p.locator('#destination-select option').evaluateAll(options=>options.map(o=>o.value));
   for(const key of keys){
    await p.locator('#destination-select').selectOption(key);
    const place=await p.evaluate(key=>VietPhucDestination.places[key],key);
    assert.deepEqual(await p.locator('#garment-select option').allTextContents(),place.garments);
    assert.equal(await p.locator('#destination-scenes button').count(),place.scenes.length);
    await p.locator('#destination-scenes button').last().click();
    assert.equal(await p.locator('#background-select').inputValue(),place.scenes.at(-1));
    await p.locator('#preview').click();
    await p.locator('#results').waitFor({state:'visible'});
    assert.equal(await p.locator('#cards .look-card').count(),2);
    assert.equal(await p.evaluate(()=>currentResultsData.data.input.destinationId),key);
    assert.equal(await p.evaluate(()=>currentResultsData.data.input.background),place.scenes.at(-1));
    assert.ok(!(await p.locator('#results').innerText()).includes('undefined'));
    assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    places++;
   }
   for(const [index,preset]of presets.entries()){
    await p.goto(base+'/#kham-pha',{waitUntil:'domcontentloaded'});
    await p.locator('[data-page="kham-pha"] [data-preset="'+index+'"]').click();await p.waitForURL('**#thu-do');
    assert.equal(await p.locator('#destination-select').inputValue(),preset['Địa điểm']||'general');
    assert.equal(await p.locator('#garment-select').inputValue(),preset['Loại trang phục']);
    looks++;
   }
   await p.goto(base+'/#ban-do',{waitUntil:'domcontentloaded'});
   const provinces=await p.evaluate(()=>Object.entries(CULTURAL_PROVINCES).map(([key,p])=>({key,region:p.regionId})));
   for(const {key,region}of provinces){
    await p.evaluate(({key,region})=>{zoomToRegion(region);selectCultureProvince(key);},{key,region});
    await p.locator('#callout-try-btn').click();await p.waitForURL('**#thu-do');
    assert.equal(await p.locator('#destination-select').inputValue(),key);
    mapPlaces++;
    await p.evaluate(()=>{location.hash='ban-do';});await p.locator('[data-page="ban-do"]').waitFor({state:'visible'});
   }
  }
  assert.deepEqual(errors,[]);
  console.log('PASS '+places+' destination previews, '+looks+' collection presets, '+mapPlaces+' map-to-room selections across desktop/mobile; no undefined results, overflow or JS errors. No Google calls.');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
