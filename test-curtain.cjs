const assert=require('node:assert/strict');
const {createApp}=require('./ai-studio-app/server.cjs');
const {chromium}=require('D:/n8n/node_modules/playwright-core');
(async()=>{
 const server=createApp();await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
  const p=await browser.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
  const checkOpeningMotion=async()=>{
    await p.waitForFunction(()=>window.openingTrace?.done);
    const samples=await p.evaluate(()=>window.openingTrace.samples);
    const intermediate=samples.filter(n=>n>0.001&&n<1.015);
    assert.ok(intermediate.length>=2,'Opening must visibly pass through intermediate positions: '+samples);
    assert.ok(intermediate.some((n,i)=>i>0&&n>intermediate[i-1]),'Panels must move outwards');
  };
  await p.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//,r=>r.abort());
  await p.goto('http://127.0.0.1:'+server.address().port+'/#ban-do',{waitUntil:'domcontentloaded'});
  await p.evaluate(()=>{
    const curtain=document.querySelector('#scene-transition-curtain');
    let seenShut=false,running=false;
    new MutationObserver(()=>{
      if(curtain.classList.contains('is-curtain-shut')){
        seenShut=true;
        if(!running)window.openingTrace=null;
      }
      if(seenShut&&!running&&curtain.classList.contains('is-opening')){
        seenShut=false;running=true;
        const trace=window.openingTrace={samples:[],done:false};
        const frame=()=>{
          const panel=curtain.querySelector('.curtain-panel-left');
          trace.samples.push(Math.abs(new DOMMatrixReadOnly(getComputedStyle(panel).transform).m41)/panel.getBoundingClientRect().width);
          if(curtain.classList.contains('is-transitioning'))requestAnimationFrame(frame);
          else{trace.done=true;running=false;}
        };
        requestAnimationFrame(frame);
      }
    }).observe(curtain,{attributes:true,attributeFilter:['class']});
  });
  await p.locator('#pin-tay-bac').click();await p.locator('[data-chip-prov="laocai"]').click();
  await p.locator('#callout-try-btn').click();
  await p.waitForFunction(()=>document.querySelector('#scene-transition-curtain').classList.contains('is-curtain-shut'));
  assert.equal(new URL(p.url()).hash,'#ban-do','Map remains until curtains close');
  await p.locator('#scene-transition-curtain').waitFor({state:'visible'});
  await p.waitForURL('**#thu-do');
  assert.equal(await p.locator('#destination-select').inputValue(),'laocai');
  await checkOpeningMotion();
  await p.waitForFunction(()=>!document.querySelector('#scene-transition-curtain').classList.contains('is-transitioning'));
  await p.locator('.back-to-map-btn').click();
  await p.waitForFunction(()=>document.querySelector('#scene-transition-curtain').classList.contains('is-curtain-shut'));
  await p.waitForURL('**#ban-do');
  await checkOpeningMotion();
  await p.waitForFunction(()=>!document.querySelector('#scene-transition-curtain').classList.contains('is-transitioning'));
  await p.emulateMedia({reducedMotion:'reduce'});
  await p.locator('#pin-tay-bac').click();await p.locator('[data-chip-prov="laocai"]').click();await p.locator('#callout-try-btn').click();
  await p.waitForURL('**#thu-do');assert.equal(await p.locator('#scene-transition-curtain').isVisible(),false);
  await p.locator('[data-page="thu-do"]').waitFor({state:'visible'});
  await p.emulateMedia({reducedMotion:'no-preference'});
  await p.evaluate(()=>{window.transitionStarts=[];const original=window.triggerSceneTransition;window.triggerSceneTransition=function(options){transitionStarts.push({title:options.title,hash:location.hash,active:[...document.querySelectorAll('[data-page]')].find(p=>!p.hidden)?.dataset.page,stack:new Error().stack});return original(options);};});
  for(const key of ['kham-pha','huong-dan','gioi-thieu','thu-do']){
    const before=await p.evaluate(()=>transitionStarts.length);
    await p.locator('#site-nav a[href="#'+key+'"]').click();
    await p.locator('#scene-transition-curtain').waitFor({state:'visible'});
    await p.locator('[data-page="'+key+'"]').waitFor({state:'visible'});
    await checkOpeningMotion();
    await p.waitForFunction(()=>!document.querySelector('#scene-transition-curtain').classList.contains('is-transitioning'));
    assert.equal(await p.evaluate(()=>transitionStarts.length),before+1,'Exactly one curtain per navigation: '+JSON.stringify(await p.evaluate(()=>transitionStarts)));
  }
  const beforeBack=await p.evaluate(()=>transitionStarts.length);
  await p.goBack();await p.locator('[data-page="gioi-thieu"]').waitFor({state:'visible'});
  await checkOpeningMotion();
  await p.waitForFunction(()=>!document.querySelector('#scene-transition-curtain').classList.contains('is-transitioning'));
  assert.equal(await p.evaluate(()=>transitionStarts.length),beforeBack+1,'Browser back animates once');
  await p.setViewportSize({width:390,height:844});
  await p.locator('#menu-toggle').click();await p.locator('#site-nav a[href="#kham-pha"]').click();
  await p.locator('[data-page="kham-pha"]').waitFor({state:'visible'});
  await checkOpeningMotion();
  await p.waitForFunction(()=>!document.querySelector('#scene-transition-curtain').classList.contains('is-transitioning'));
  assert.equal(await p.locator('#menu-toggle').getAttribute('aria-expanded'),'false');
  await p.locator('[data-page="kham-pha"] [data-preset="1"]').click();await p.locator('[data-page="thu-do"]').waitFor({state:'visible'});
  await checkOpeningMotion();
  await p.waitForFunction(()=>!document.querySelector('#scene-transition-curtain').classList.contains('is-transitioning'));
  assert.equal(await p.locator('#garment-select').inputValue(),'Áo ngũ thân');
  assert.deepEqual(errors,[]);console.log('PASS: map curtain, all navigation links, browser back, mobile menu, collection preset, no duplicate transitions, reduced motion, no JS errors.');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
