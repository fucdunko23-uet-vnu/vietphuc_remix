const assert=require('node:assert/strict');
const {createApp}=require('./ai-studio-app/server.cjs');
const {chromium}=require('D:/n8n/node_modules/playwright-core');
(async()=>{
 const server=createApp();await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}});await page.route(/https:\/\/fonts\./,r=>r.abort());
  await page.goto('http://127.0.0.1:'+server.address().port+'/?dia-diem=laocai#thu-do',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#pv-garment-layer').children.length>0);
  await page.evaluate(()=>{
   window.serializations=0;const NativeFormData=window.FormData;
   window.FormData=class extends NativeFormData{constructor(...args){super(...args);window.serializations++;}};
   window.previewRenders=0;const render=VietPhucGarmentPreview.render;
   VietPhucGarmentPreview.render=(...args)=>{window.previewRenders++;return render(...args);};
   const field=document.querySelector('#color-input');
   for(let i=0;i<30;i++){field.value=i===29?'#527AB5':'#647A52';field.dispatchEvent(new Event('input',{bubbles:true}));field.dispatchEvent(new Event('change',{bubbles:true}));}
  });
  await page.waitForFunction(()=>document.querySelector('#pv-mannequin-svg').style.getPropertyValue('--pv-fabric')==='#527AB5');
  assert.equal(await page.evaluate(()=>serializations),0,'Editing should not serialize the full form');
  assert.equal(await page.evaluate(()=>previewRenders),1,'One preview render for a burst of field changes');
  await page.locator('#step-btn-4').click();
  await page.locator('#extra-wishes').fill('khỏa thân');
  assert.equal(await page.locator('#preview').isDisabled(),true,'Instant safety checks remain active');
  await page.locator('#extra-wishes').fill('không hở ngực; ưu tiên giày bệt');
  assert.equal(await page.locator('#preview').isEnabled(),true);
  const ring=page.locator('.curtain-seal-ring');
  assert.equal(await ring.evaluate(e=>getComputedStyle(e).animationPlayState),'paused');
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.locator('#site-nav [href="#kham-pha"]').click();
  assert.equal(await page.locator('[data-page="thu-do"]').evaluate(e=>e.classList.contains('is-room-prepared')),false);
  await page.locator('[data-preset="6"]').scrollIntoViewIfNeeded();
  await page.locator('[data-preset="6"]').locator('..').locator('[data-jump-lore]').click();
  await page.waitForFunction(()=>!document.querySelector('[data-lore-panel="nhat-binh"]').hidden);
  assert.equal(await page.locator('[data-lore-tab="nhat-binh"]').getAttribute('aria-selected'),'true');
  console.log('PASS: 60 events → 1 preview render, zero form serializations, immediate guardrails, idle curtain paused, room layout released, lore navigation intact.');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
