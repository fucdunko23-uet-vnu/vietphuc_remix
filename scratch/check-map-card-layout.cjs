const {chromium}=require('D:/n8n/node_modules/playwright-core');
const {createApp}=require('../ai-studio-app/server.cjs');
const assert=require('node:assert/strict');
(async()=>{
 const server=createApp();await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const base=process.argv[2]||'http://127.0.0.1:'+server.address().port;
 try{
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));let checks=0;
  for(const width of [320,390,768,1440,1920]){
   await page.setViewportSize({width,height:900});await page.goto(base+'/#ban-do');await page.evaluate(()=>document.fonts.ready);
   const keys=await page.evaluate(()=>Object.keys(CULTURAL_PROVINCES));
   for(const key of keys){
    await page.evaluate(key=>selectCultureProvince(key),key);
    const probe=await page.evaluate(()=>{
     const rect=el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
     const title=document.querySelector('#callout-wardrobe-name'),era=document.querySelector('#callout-wardrobe-era');
     return {title:rect(title),era:rect(era),overflow:[...document.querySelectorAll('#infographic-callout-deck .box-head')].some(e=>e.scrollWidth>e.clientWidth+1),pageOverflow:document.documentElement.scrollWidth>innerWidth+1,headers:[...document.querySelectorAll('.box-head')].map(el=>({head:rect(el),title:rect(el.querySelector('.box-title'))}))};
    });
    assert.ok(probe.era.y>=probe.title.bottom-1,`${width} ${key}: metadata overlaps title`);
    assert.ok(!probe.overflow&&!probe.pageOverflow,`${width} ${key}: horizontal overflow`);
    for(const h of probe.headers)assert.ok(h.title.width>h.head.width*.55,`${width} ${key}: squeezed title`);
    checks++;
   }
   await page.evaluate(()=>selectCultureProvince('hcm'));
   await page.locator('#infographic-callout-deck').screenshot({path:require('node:path').resolve(__dirname,`../output/map-card-alignment-${width}.png`)});
  }
  assert.equal(errors.length,0,errors.join(';'));console.log(`PASS: ${checks} province/viewport layouts, separate metadata row, readable title width, no overflow or JavaScript errors`);
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e.message);process.exitCode=1});
