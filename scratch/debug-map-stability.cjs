const {chromium}=require('D:/n8n/node_modules/playwright-core');const {createApp}=require('../ai-studio-app/server.cjs');
(async()=>{const s=createApp();await new Promise(r=>s.listen(0,'127.0.0.1',r));const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{
 const p=await b.newPage();await p.route(/https:\/\/fonts\./,r=>r.abort());await p.emulateMedia({reducedMotion:'reduce'});
 for(const width of [1440,320]){
  await p.setViewportSize({width,height:1000});await p.goto('http://127.0.0.1:'+s.address().port+'/#ban-do');
  const provinces=await p.evaluate(()=>Object.entries(CULTURAL_PROVINCES).map(([key,p])=>({key,region:p.regionId})));
  for(const {key,region}of provinces){
   await p.evaluate(({key,region})=>{
    zoomToRegion(region);selectCultureProvince(key);window.stabilityProbe=[];
    function frame(){const e=document.querySelector('#callout-try-btn'),r=e.getBoundingClientRect(),parent=e.closest('.callout-box');
     stabilityProbe.push({y:r.y,h:r.height,scroll:e.closest('.callout-boxes-container').scrollTop,hover:e.matches(':hover'),parentHover:parent.matches(':hover'),transform:getComputedStyle(e).transform,parentTransform:getComputedStyle(parent).transform});
     if(stabilityProbe.length<650)window.stabilityFrame=requestAnimationFrame(frame);
    }window.stabilityFrame=requestAnimationFrame(frame);
   },{key,region});
   try{await p.locator('#callout-try-btn').click({timeout:6000});await p.waitForURL('**#thu-do');}
   catch(e){console.log('FAIL',width,key,await p.evaluate(()=>[...new Set(stabilityProbe.slice(-80).map(e=>JSON.stringify(e)))]));throw e;}
   finally{await p.evaluate(()=>cancelAnimationFrame(stabilityFrame));}
   await p.evaluate(()=>location.hash='ban-do');await p.locator('[data-page="ban-do"]').waitFor({state:'visible'});
  }
 }console.log('PASS map click stability');
}finally{await b.close();await new Promise(r=>s.close(r));}})().catch(e=>{console.error(e.message);process.exitCode=1});
