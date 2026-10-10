const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('D:/n8n/node_modules/playwright-core');
const { createApp } = require('./ai-studio-app/server.cjs');
(async () => {
  const server = createApp({workerToken:'audit-worker', moderate:async()=>({approved:true})});
  await new Promise(r => server.listen(0,'127.0.0.1',r));
  const base = 'http://127.0.0.1:'+server.address().port;
  const browser = await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  const worker = async (route,data) => {
    const r = await fetch(base+'/api/worker/'+route,{method:'POST',headers:{'Content-Type':'application/json',authorization:'Bearer audit-worker'},body:JSON.stringify(data)});
    assert.equal(r.status,200);return r.json();
  };
  try {
    const p = await browser.newPage({viewport:{width:1440,height:1000}});
    p.setDefaultTimeout(10000);
    const errors=[];p.on('pageerror',e=>errors.push(e.message));
    await p.route(/https:\/\/fonts\./,r=>r.abort());
    await p.goto(base+'/#ban-do',{waitUntil:'domcontentloaded'});
    assert.equal(await p.locator('#outfit-card-section').isVisible(),false);
    await p.locator('#pin-tay-bac').click(); // Real mouse click, no force or evaluate.
    await p.locator('[data-chip-prov="laocai"]').click();
    await p.locator('#callout-try-btn').click();
    await p.waitForURL('**#thu-do');
    assert.equal(await p.locator('#destination-select').inputValue(),'laocai');
    await p.route('**/api/preview',r=>r.fulfill({status:502,contentType:'text/html',body:'upstream unavailable'}));
    await p.locator('#preview').click();
    await p.waitForFunction(()=>document.querySelector('#message').className==='message-error');
    assert.equal(await p.locator('#heritage-loading-overlay').isVisible(),false);
    assert.equal(await p.locator('#preview').isEnabled(),true);
    await p.unroute('**/api/preview');
    await p.locator('#preview').click();await p.locator('#results').waitFor({state:'visible'});
    assert.equal(await p.locator('.look-card').count(),2);
    assert.equal(await p.locator('#outfit-card-section').isVisible(),false,'Demo cannot open generated photo tools');
    assert.equal(await p.locator('#cards .btn-card-ootd').count(),0,'Card tools are separated from suggestions');
    await p.evaluate(()=>openPhotoboothStudio('ootd',0));
    assert.equal(await p.locator('#photobooth-modal').isVisible(),false);
    // Exercise the actual backend through the UI with a simulated worker. No Google credits used.
    await worker('claim',{ready:true});
    await p.reload();
    await p.locator('#photo').setInputFiles('test-assets/flow-fictional-person.jpg');
    await p.locator('#generate').waitFor({state:'visible'});
    await p.waitForFunction(()=>!document.querySelector('#generate').disabled);
    let interrupted=false;
    await p.route(/\/api\/jobs\/[A-Za-z0-9_-]+$/,r=>{
      if(r.request().method()==='GET'&&!interrupted) {
        interrupted=true;return r.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Temporary outage'})});
      }
      return r.continue();
    });
    await p.locator('#generate').click();
    assert.equal(await p.locator('#outfit-card-section').isVisible(),false,'Generating keeps card tools hidden');
    let claimed;
    for(let i=0;i<30&&!claimed;i++) {
      claimed=(await worker('claim',{ready:true})).job;
      if(!claimed)await new Promise(r=>setTimeout(r,100));
    }
    assert.ok(claimed,'UI submitted a job');
    const image={mimeType:'image/jpeg',data:fs.readFileSync('test-assets/flow-fictional-person.jpg').toString('base64')};
    await worker('complete',{id:claimed.id,lease:claimed.lease,success:true,images:[image,image]});
    await p.locator('#results').waitFor({state:'visible'});
    assert.equal(await p.locator('.look-image').count(),2);
    assert.equal(interrupted,true);
    await p.waitForFunction(()=>document.querySelector('#heritage-loading-overlay').hidden);
    await p.locator('#outfit-card-section').waitFor({state:'visible'});
    assert.equal(await p.locator('#outfit-card-looks button').count(),2);
    assert.equal(await p.locator('#results #outfit-card-section').count(),0,'Independent section');
    assert.ok(!(await p.locator('[data-page="thu-do"]').innerText()).includes('OOTD'));
    await p.locator('#outfit-card-looks button').last().click();
    await p.locator('#photobooth-modal').waitFor({state:'visible'});
    await p.waitForFunction(()=>!document.querySelector('#btn-pb-download').disabled);
    const seal = p.locator('#draggable-seal-stamp');
    await seal.scrollIntoViewIfNeeded();
    const sealBefore = await seal.boundingBox();
    const bounds = await p.locator('#pb-canvas-container').boundingBox();
    await p.mouse.move(sealBefore.x+sealBefore.width/2,sealBefore.y+sealBefore.height/2);
    await p.mouse.down();
    await p.mouse.move(bounds.x+bounds.width/2,bounds.y+bounds.height/2,{steps:20});
    await p.mouse.up();
    await p.waitForFunction(()=>!document.querySelector('#btn-pb-download').disabled);
    const sealAfter = await seal.boundingBox();
    assert.ok(Math.hypot(sealAfter.x-sealBefore.x,sealAfter.y-sealBefore.y)>20,'Seal drag moves the rendered position');
    assert.ok(sealAfter.x>=bounds.x-1&&sealAfter.y>=bounds.y-1&&sealAfter.x+sealAfter.width<=bounds.x+bounds.width+1&&sealAfter.y+sealAfter.height<=bounds.y+bounds.height+1,'Seal remains within the photo');
    await p.evaluate(()=>closePhotoboothStudio());
    await p.locator('#outfit-card-section').scrollIntoViewIfNeeded();
    await p.screenshot({path:'output/outfit-card-section-desktop.png'});
    await p.route('**/api/preview',r=>r.fulfill({status:502,contentType:'text/html',body:'upstream unavailable'}));
    await p.locator('#preview').click();
    await p.waitForFunction(()=>document.querySelector('#message').className==='message-error');
    assert.equal(await p.locator('#outfit-card-section').isVisible(),false,'Failed new request hides old card tools');
    await p.evaluate(()=>openPhotoboothStudio('ootd',0));
    assert.equal(await p.locator('#photobooth-modal').isVisible(),false);
    await p.unroute('**/api/preview');
    const client=await p.context().newCDPSession(p);
    await client.send('Emulation.setCPUThrottlingRate',{rate:4});
    await p.goto(base+'/#ban-do');
    await p.locator('#pin-tay-bac').click();
    await p.locator('[data-chip-prov="laocai"]').click();
    await p.evaluate(()=>{window.auditTasks=[];new PerformanceObserver(l=>auditTasks.push(...l.getEntries().map(e=>Math.round(e.duration)))).observe({type:'longtask'});window.auditStart=performance.now();});
    await p.locator('#callout-try-btn').click();
    await p.waitForURL('**#thu-do');
    await p.waitForTimeout(1000);
    console.log('Room transition, CPU 4x:',await p.evaluate(()=>({longTasks:auditTasks,maxTaskMs:Math.max(0,...auditTasks)})));
    await client.send('Emulation.setCPUThrottlingRate',{rate:1});
    for (const width of [1440,390]) {
      await p.setViewportSize({width,height:844});
      for(const route of ['trang-chu','kham-pha','thu-do','huong-dan','gioi-thieu','ban-do']) {
        await p.goto(base+'/#'+route);
        await p.locator('[data-page="'+route+'"]').waitFor({state:'visible'});
        assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),route+' overflow at '+width);
      }
    }
    await p.emulateMedia({reducedMotion:'reduce'});
    await p.goto(base+'/#ban-do');await p.locator('#pin-tay-bac').click();
    await p.locator('[data-chip-prov="laocai"]').click();await p.locator('#callout-try-btn').click();
    await p.waitForURL('**#thu-do');
    assert.equal(await p.locator('#scene-transition-curtain').isVisible(),false);
    assert.deepEqual(errors,[]);
    console.log('PASS: mouse map selection, preview error recovery, photobooth, simulated Flow lifecycle, all 6 routes desktop/mobile, reduced motion, no JS errors.');
  } finally {await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e.stack);process.exitCode=1});
