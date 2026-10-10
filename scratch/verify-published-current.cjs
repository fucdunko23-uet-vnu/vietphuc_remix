const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('D:/n8n/node_modules/playwright-core');
const base='https://viet-phuc-remix.ai.studio';
(async()=>{
 const assets=['index.html','app.js','site.js','map.js','destinations.js','guardrails.js','garment-preview.js','style.css','site.css','presets.json','logo.webp',...fs.readdirSync(path.join(__dirname,'../ai-studio-app/public/collection-art')).map(x=>'collection-art/'+x)];
 for(const asset of assets){const r=await fetch(base+(asset==='index.html'?'/':'/'+asset));assert.equal(r.status,200,asset);const remote=Buffer.from(await r.arrayBuffer());assert.ok(remote.equals(fs.readFileSync(path.join(__dirname,'../ai-studio-app/public',asset))),asset+' differs');}
 console.log('PASS: all '+assets.length+' published frontend assets exactly match latest local source');
 const statusResponse=await fetch(base+'/api/status');assert.equal(statusResponse.status,200);
 const healthStatus=(await fetch(base+'/healthz')).status;
 console.log('Public /healthz HTTP '+healthStatus+'; /api/status HTTP 200');
 const auth=await fetch(base+'/api/worker/claim',{method:'POST',headers:{'Content-Type':'application/json'},body:'{"ready":true}'});assert.equal(auth.status,401);
 console.log('PASS: backend health and worker authentication');
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{const page=await browser.newPage();page.setDefaultTimeout(20000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const width of [390,1440]){await page.setViewportSize({width,height:900});
   for(const route of ['ban-do','trang-chu','kham-pha','thu-do','huong-dan','gioi-thieu']){
    await page.goto(base+'/?dia-diem=laocai#'+route,{waitUntil:'domcontentloaded'});
    await page.locator('[data-page="'+route+'"]').waitFor({state:'visible'});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),width+' '+route+' overflow');
   }
  }
  await page.goto(base+'/?dia-diem=laocai#thu-do',{waitUntil:'domcontentloaded'});
  await page.locator('#preview').click();await page.locator('#results').waitFor({state:'visible'});
  assert.equal(await page.locator('.look-card').count(),2);
  assert.equal(await page.locator('#destination-select').inputValue(),'laocai');
  assert.equal(errors.length,0,errors.join(';'));
  await page.screenshot({path:path.resolve(__dirname,'../output/published-current-smoke.png'),fullPage:true});
  console.log('PASS: 12 public page/viewport checks, Sa Pa preview, no JavaScript errors');
 }finally{await browser.close();}
 console.log(await(await fetch(base+'/api/status')).json());
})().catch(e=>{console.error(e.message);process.exitCode=1});
