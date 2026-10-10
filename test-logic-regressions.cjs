const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('D:/n8n/node_modules/playwright-core');
const {createApp}=require('./ai-studio-app/server.cjs');
(async()=>{
 const server=createApp({workerToken:'logic-worker',moderate:async()=>({approved:true})});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
  const p=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.route(/https:\/\/fonts\./,r=>r.abort());await p.emulateMedia({reducedMotion:'reduce'});
  await p.goto(base+'/?dia-diem=laocai#thu-do',{waitUntil:'domcontentloaded'});
  await p.locator('#site-nav [href="#huong-dan"]').click();await p.locator('#site-nav [href="#thu-do"]').click();
  await p.locator('#destination-select').selectOption('tthue');
  await p.goBack();await p.waitForURL('**#huong-dan');await p.goBack();await p.waitForURL('**#thu-do');
  assert.equal(await p.locator('#destination-select').inputValue(),'laocai','Back restores destination as well as URL');
  await p.goForward();await p.waitForURL('**#huong-dan');await p.goForward();await p.waitForURL('**#thu-do');
  assert.equal(await p.locator('#destination-select').inputValue(),'tthue');
  await p.locator('#scene-detail').fill('Sương nhẹ, ít người');await p.locator('#scene-light').selectOption({index:2});
  await p.locator('#destination-scenes button').last().click();
  const scene=await p.locator('#background-select').inputValue();
  await p.locator('.dest-card[data-dest-key="tthue"]').click();
  assert.equal(await p.locator('#scene-detail').inputValue(),'Sương nhẹ, ít người','Re-selecting the same destination preserves customization');
  assert.equal(await p.locator('#background-select').inputValue(),scene);
  await p.locator('#color-input').fill('khỏa thân');assert.equal(await p.locator('#preview').isDisabled(),true);
  await p.locator('.color-chip').first().click();assert.equal(await p.locator('#preview').isEnabled(),true,'Color chip runs field validation');
  for(const color of ['#12345','red']){
   await p.locator('#color-input').fill(color);
   await p.waitForFunction(()=>document.querySelector('#pv-mannequin-svg').style.getPropertyValue('--pv-fabric')==='#DDCCB4');
   const result=await p.evaluate(async()=>{const r=await fetch('/api/preview',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({selection:Object.fromEntries(new FormData(document.querySelector('#styling-form')))})});return r.json();});
   assert.equal(result.looks[0].colors[0].hex,'#DDCCB4','Live preview matches backend fallback');
  }
  await p.locator('#color-input').fill('xanh mint');
  const worker=async(route,data)=>{const r=await fetch(base+'/api/worker/'+route,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer logic-worker'},body:JSON.stringify(data)});assert.ok(r.ok);return r.json();};
  await worker('claim',{ready:true});await p.evaluate(()=>refreshTryOnConnection());
  await p.locator('#photo').setInputFiles('test-assets/flow-fictional-person.jpg');
  await p.waitForFunction(()=>!document.querySelector('#generate').disabled);
  await p.locator('#generate').click();
  await p.waitForFunction(()=>document.querySelector('#heritage-loading-overlay').contains(document.activeElement));
  assert.equal(await p.locator('[data-page="thu-do"]').evaluate(e=>e.inert),true,'Waiting room prevents background edits');
  let claimed;for(let i=0;i<40&&!claimed;i++){claimed=(await worker('claim',{ready:true})).job;if(!claimed)await new Promise(r=>setTimeout(r,100));}
  assert.ok(claimed);const original=fs.readFileSync('test-assets/flow-fictional-person.jpg');
  const image={mimeType:'image/jpeg',data:original.toString('base64')};
  await worker('complete',{id:claimed.id,lease:claimed.lease,success:true,images:[image,image]});
  await p.locator('#outfit-card-section').waitFor({state:'visible'});
  assert.equal(await p.locator('[data-page="thu-do"]').evaluate(e=>e.inert),false);
  const tiny=await p.evaluate(()=>{const c=document.createElement('canvas');c.width=c.height=20;return c.toDataURL().split(',')[1];});
  await p.locator('#photo').setInputFiles({name:'new-photo.png',mimeType:'image/png',buffer:Buffer.from(tiny,'base64')});
  await p.waitForFunction(()=>document.querySelector('#photo-preview').naturalWidth===20);
  assert.equal(await p.evaluate(()=>currentResultsData.sourcePhoto.mimeType),'image/jpeg','Generated result keeps its own original photo');
  const trigger=p.locator('#outfit-card-looks button').first();await trigger.click();
  await p.waitForFunction(()=>!document.querySelector('#btn-pb-download').disabled);
  assert.equal(await p.locator('#btn-close-photobooth').evaluate(e=>e===document.activeElement),true);
  assert.equal(await p.locator('body').evaluate(e=>e.classList.contains('has-ui-dialog')),true);
  for(const layout of ['strip','duo','ootd']){
    await p.locator('[data-layout="'+layout+'"]').click();
    await p.waitForFunction(()=>!document.querySelector('#btn-pb-download').disabled);
    assert.ok(await p.evaluate(()=>{
      const handle=document.querySelector('#draggable-seal-stamp').getBoundingClientRect(),canvas=document.querySelector('#photobooth-canvas'),rect=canvas.getBoundingClientRect(),g=renderedSealGeometry;
      return Math.abs(handle.x+handle.width/2-(rect.x+g.x*rect.width/canvas.width))<1&&Math.abs(handle.y+handle.height/2-(rect.y+g.y*rect.height/canvas.height))<1;
    }),'Seal handle aligns with the exported canvas in '+layout);
  }
  await p.locator('#draggable-seal-stamp').focus();const beforeSeal=await p.evaluate(()=>renderedSealGeometry.x);
  await p.keyboard.press('ArrowRight');await p.waitForFunction(x=>renderedSealGeometry.x>x,beforeSeal);
  await p.waitForFunction(()=>!document.querySelector('#btn-pb-download').disabled);
  await p.locator('#btn-close-photobooth').focus();
  await p.keyboard.press('Shift+Tab');assert.equal(await p.locator('#photobooth-modal').evaluate(e=>e.contains(document.activeElement)),true,'Focus stays inside modal');
  await p.locator('#pb-toggle-seal').uncheck();await p.locator('#draggable-seal-stamp').waitFor({state:'hidden'});
  await p.locator('#pb-toggle-seal').check();await p.locator('#draggable-seal-stamp').waitFor({state:'visible'});
  await p.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{write:()=>Promise.reject(new DOMException('Denied','NotAllowedError'))}}));
  await p.locator('#btn-pb-copy').click();
  await p.waitForFunction(()=>document.querySelector('#pb-feedback').classList.contains('message-error'));
  assert.equal(await p.locator('#pb-feedback').isVisible(),true,'Clipboard rejection is visible in the modal');
  await p.screenshot({path:'output/audit-photobooth-desktop.png'});
  await p.keyboard.press('Escape');assert.equal(await p.locator('#photobooth-modal').isVisible(),false);
  assert.equal(await trigger.evaluate(e=>e===document.activeElement),true,'Closing restores caller focus');
  assert.equal(await p.locator('body').evaluate(e=>e.classList.contains('has-ui-dialog')),false);
  await p.setViewportSize({width:320,height:844});await trigger.click();await p.waitForFunction(()=>!document.querySelector('#btn-pb-download').disabled);
  await p.screenshot({path:'output/audit-photobooth-mobile.png'});
  assert.ok(await p.evaluate(()=>{const e=document.querySelector('.photobooth-dialog').getBoundingClientRect();return e.left>=0&&e.right<=innerWidth&&e.top>=0&&e.bottom<=innerHeight;}));
  await p.locator('#pb-canvas-container').scrollIntoViewIfNeeded();
  await p.screenshot({path:'output/audit-photobooth-mobile-preview.png'});
  const downloadPromise=p.waitForEvent('download');
  await p.locator('#btn-pb-download').click();const download=await downloadPromise;
  assert.match(download.suggestedFilename(),/\.png$/);
  assert.equal(fs.readFileSync(await download.path()).subarray(0,8).toString('hex'),'89504e470d0a1a0a','Export is a real PNG');
  await p.evaluate(async()=>{currentResultsData.data.images[1].data=btoa('broken photo');photoboothImageCache=null;await renderPhotoboothCanvas();});
  assert.equal(await p.locator('#btn-pb-download').isDisabled(),true,'A broken generated image cannot export a substituted original');
  assert.equal(await p.locator('#pb-feedback').isVisible(),true);
  assert.equal(await p.locator('#draggable-seal-stamp').isVisible(),false);
  // The result controls must not survive a destination switch after the result is hidden.
  await p.keyboard.press('Escape');await p.locator('#destination-select').selectOption('daklak');
  assert.equal(await p.locator('#results').isVisible(),false);assert.equal(await p.locator('#outfit-card-section').isVisible(),false);
  assert.equal(await p.evaluate(()=>currentResultsData),null);
  await p.goto(base+'/#ban-do',{waitUntil:'domcontentloaded'});
  await p.locator('#map-site-menu summary').click();await p.locator('#map-site-menu [href="#huong-dan"]').click();
  await p.waitForURL('**#huong-dan');assert.equal(await p.locator('#map-site-menu').evaluate(e=>e.open),false);
  await p.goto(base+'/#ban-do',{waitUntil:'domcontentloaded'});
  await p.locator('#pin-tay-nguyen').press('Enter');
  await p.locator('[data-chip-prov="gialai"]').click();
  await p.waitForTimeout(750); // Camera completion must not overwrite a choice made during its animation.
  assert.equal(await p.locator('#callout-prov-title').innerText(),await p.evaluate(()=>CULTURAL_PROVINCES.gialai.name));
  await p.locator('#callout-try-btn').click();await p.waitForURL('**#thu-do');
  assert.equal(await p.locator('#destination-select').inputValue(),'gialai');
  assert.deepEqual(errors,[]);
  console.log('PASS history, destination persistence, color consistency/validation, isolated loading/modal focus, original photo snapshot, seal toggle, clipboard failure, mobile modal, stale results and map navigation. No Google generation calls.');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
