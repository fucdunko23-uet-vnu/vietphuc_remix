// One real, intentionally submitted Flow job, using a fictional adult fixture.
// No automatic retry and no keys or private job tokens are logged.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('D:/n8n/node_modules/playwright-core');
const base='https://viet-phuc-remix.ai.studio';
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}});page.setDefaultTimeout(20000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('response',async r=>{try{if(new URL(r.url()).pathname==='/api/jobs'&&r.request().method()==='POST')console.log('Photo submission HTTP '+r.status());}catch{}});
  await page.goto(base+'/?dia-diem=laocai#thu-do',{waitUntil:'domcontentloaded'});
  await page.locator('#photo').setInputFiles(path.resolve(__dirname,'../test-assets/flow-fictional-person.jpg'));
  await page.waitForFunction(()=>!document.querySelector('#generate').disabled);
  await page.locator('#generate').click();
  console.log('Submitted ONE public try-on job: Sa Pa, fictional adult; waiting for two real Flow images.');
  const start=Date.now();let last='';
  while(Date.now()-start<8*60000){
   await page.waitForTimeout(3000);
   const state=await page.evaluate(()=>({done:!!window.currentResultsData&&window.currentResultsData.mode==='flow',message:document.querySelector('#message').textContent,error:document.querySelector('#message').className==='message-error'}));
   if(state.message!==last){console.log(state.message);last=state.message;}
   if(state.error)throw new Error(state.message);
   if(state.done){
    await page.waitForFunction(()=>[...document.querySelectorAll('.look-image')].length===2&&[...document.querySelectorAll('.look-image')].every(im=>im.complete&&im.naturalWidth>500));
    const images=await page.locator('.look-image').evaluateAll(es=>es.map(e=>({src:e.src,width:e.naturalWidth,height:e.naturalHeight})));
    assert.notEqual(images[0].src,images[1].src);
    for(let i=0;i<images.length;i++)fs.writeFileSync(path.resolve(__dirname,'../output/published-current-flow-'+(i+1)+'.png'),Buffer.from(images[i].src.split(',')[1],'base64'));
    assert.equal(errors.length,0,errors.join(';'));
    await page.locator('#results').scrollIntoViewIfNeeded();
    await page.screenshot({path:path.resolve(__dirname,'../output/published-current-flow-results.png'),fullPage:true});
    console.log(JSON.stringify({passed:true,flowImages:2,dimensions:images.map(im=>[im.width,im.height]),durationMs:Date.now()-start,jsErrors:errors.length}));return;
   }
  }
  throw new Error('Timed out; job was NOT automatically resubmitted.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e.message);process.exitCode=1});
