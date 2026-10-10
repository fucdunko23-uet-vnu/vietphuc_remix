const assert=require('node:assert/strict');
const {createApp}=require('./ai-studio-app/server.cjs');
const {chromium}=require('D:/n8n/node_modules/playwright-core');
(async()=>{
 const server=createApp();await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route(/https:\/\/fonts\./,r=>r.abort());
  await page.goto('http://127.0.0.1:'+server.address().port+'/#ban-do',{waitUntil:'domcontentloaded'});
  await page.locator('#vietnam-svg').waitFor();await page.waitForTimeout(700);
  const box=()=>page.locator('#vietnam-svg').evaluate(el=>{const b=el.viewBox.baseVal;return {x:b.x,y:b.y,width:b.width,height:b.height};});
  let initial=await box();
  const bounded=async()=>{const b=await box();assert.ok(b.x>=initial.x-.01&&b.y>=initial.y-.01&&b.x+b.width<=initial.x+initial.width+.01&&b.y+b.height<=initial.y+initial.height+.01,JSON.stringify(b));return b;};
  const drag=async(x,y)=>{await page.mouse.move(600,550);await page.mouse.down();await page.mouse.move(x,y,{steps:8});await page.mouse.up();};
  await drag(1100,800);assert.deepEqual(await box(),initial,'Overview cannot pan');
  assert.equal(await page.locator('#svg-map-container').evaluate(el=>el.classList.contains('is-pan-locked')),true);
  const viewportAspect=await page.locator('#vietnam-svg').evaluate(el=>{const r=el.getBoundingClientRect();return r.width/r.height;});
  assert.ok(Math.abs(initial.width/initial.height-viewportAspect)<.001,'Camera fills viewport');
  await page.mouse.move(900,400);
  for(let i=0;i<30;i++){await page.mouse.wheel(0,300);await page.waitForTimeout(20);}
  let b=await bounded();assert.ok(Math.abs(b.width/b.height-initial.width/initial.height)<0.001,'Zoom preserves aspect ratio');
  assert.deepEqual(b,initial,'Zoom-out stops at fixed overview');
  for(let i=0;i<30;i++){await page.mouse.wheel(0,-300);await page.waitForTimeout(20);}
  b=await bounded();assert.ok(b.width>=159.99&&b.height>=159.99,'Zoom-in limit');
  const beforePan=await box();await drag(800,650);assert.notDeepEqual(await box(),beforePan,'Zoomed map can pan');
  for(const [x,y] of [[-3000,-3000],[4000,4000],[-3000,4000],[4000,-3000]]){
    await drag(x,y);await bounded();
  }
  for(const region of ['tay-bac','bac-bo','hue-trung-bo','tay-nguyen','nam-bo']){
    await page.evaluate(id=>window.zoomToRegion(id),region);await page.waitForTimeout(700);await bounded();
  }
  await page.evaluate(()=>window.zoomOutToNational());
  await page.waitForFunction(width=>Math.abs(document.querySelector('#vietnam-svg').viewBox.baseVal.width-width)<.01,initial.width);
  assert.ok(Math.abs((await bounded()).height-initial.height)<0.01);
  for(const country of ['china','laos','cambodia','thailand','hainam'])assert.equal(await page.locator('#neighbor-'+country).count(),1);
  await page.screenshot({path:'output/map-fixed-neighbors-desktop.png'});
  await page.setViewportSize({width:390,height:844});
  await page.waitForFunction(()=>{const e=document.querySelector('#vietnam-svg'),r=e.getBoundingClientRect(),b=e.viewBox.baseVal;return Math.abs(b.width/b.height-r.width/r.height)<.001;});
  initial=await box();await bounded();
  const mobileAspect=await page.locator('#vietnam-svg').evaluate(el=>{const r=el.getBoundingClientRect();return r.width/r.height;});
  assert.ok(Math.abs(initial.width/initial.height-mobileAspect)<.001,'Mobile camera fills viewport');
  await page.screenshot({path:'output/map-fixed-neighbors-mobile.png'});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.deepEqual(errors,[]);
  console.log('PASS: neighbors, zoom limits, aspect ratio, four extreme drags, all regional targets, reset, desktop/mobile and no JS errors.');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e.stack);process.exitCode=1});
