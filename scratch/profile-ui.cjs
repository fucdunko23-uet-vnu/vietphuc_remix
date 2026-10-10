const fs=require('node:fs');
const {chromium}=require('D:/n8n/node_modules/playwright-core');
const {createApp}=require('../ai-studio-app/server.cjs');
(async()=>{
 const server=createApp();await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const results=[];
 try{
  for(const width of [1440,390]){
   const page=await browser.newPage({viewport:{width,height:1000}});
   await page.route(/https:\/\/fonts\./,r=>r.abort());
   const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
   await page.goto('http://127.0.0.1:'+server.address().port+'/#ban-do',{waitUntil:'domcontentloaded'});
   await page.waitForTimeout(1200);
   await page.locator('#pin-tay-bac').click();await page.locator('[data-chip-prov="laocai"]').click();
   const sample=async(name,action,duration=2300)=>{
    await page.evaluate(()=>{
     window.perfProbe={tasks:[],frames:[]};window.perfObserver?.disconnect();
     window.perfObserver=new PerformanceObserver(l=>perfProbe.tasks.push(...l.getEntries().map(e=>Math.round(e.duration))));perfObserver.observe({type:'longtask'});
     window.perfProbe.start=performance.now();let last=performance.now();window.perfProbe.running=true;
     function frame(t){if(!perfProbe.running)return;perfProbe.frames.push(t-last);last=t;requestAnimationFrame(frame)}requestAnimationFrame(frame);
    });
    if(process.argv.includes('--profile')){await cdp.send('Profiler.enable');await cdp.send('Profiler.start');}
    await action();await page.waitForTimeout(duration);
    const data=await page.evaluate(()=>{perfProbe.running=false;perfObserver.disconnect();const sorted=perfProbe.frames.filter(n=>n>0).sort((a,b)=>a-b);return{tasks:perfProbe.tasks,totalBlockingMs:perfProbe.tasks.reduce((s,n)=>s+Math.max(0,n-50),0),maxTaskMs:Math.max(0,...perfProbe.tasks),p95FrameMs:Math.round(sorted[Math.floor(sorted.length*.95)]||0),domNodes:document.querySelectorAll('*').length};});
    results.push({width,name,...data});
    if(process.argv.includes('--profile')){const {profile}=await cdp.send('Profiler.stop');console.log(name,width,'hotspots',JSON.stringify(profile.nodes.filter(n=>n.hitCount).sort((a,b)=>b.hitCount-a.hitCount).slice(0,9).map(n=>({fn:n.callFrame.functionName,file:n.callFrame.url.split('/').at(-1),line:n.callFrame.lineNumber+1,hits:n.hitCount}))));}
   };
   await sample('map-to-room',()=>page.locator('#callout-try-btn').click());
   await sample('destination-change',()=>page.locator('#destination-select').selectOption('gialai'),600);
   await sample('open-collection',async()=>{if(width<700)await page.locator('#menu-toggle').click();await page.locator('#site-nav [href="#kham-pha"]').click();});
   await sample('scroll-collection',()=>page.evaluate(()=>window.scrollTo({top:document.body.scrollHeight*.65,behavior:'smooth'})),1000);
   await page.close();
  }
  const label=process.argv.find(a=>a.startsWith('--label='))?.split('=')[1]||'current';
  fs.writeFileSync('output/perf-'+label+'.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results));
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
