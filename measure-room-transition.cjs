const {chromium}=require('D:/n8n/node_modules/playwright-core');
(async()=>{const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{
 const p=await b.newPage({viewport:{width:1440,height:1000}});const c=await p.context().newCDPSession(p);await c.send('Emulation.setCPUThrottlingRate',{rate:4});await c.send('Performance.enable');
 await p.goto(process.env.VPR_TEST_URL||'https://viet-phuc-remix.ai.studio/#ban-do');await p.locator('#vietnam-svg').waitFor();
 if(process.env.VPR_PERF_CSS)await p.addStyleTag({content:process.env.VPR_PERF_CSS});
 await p.locator('#pin-tay-bac').click({force:true});await p.locator('[data-chip-prov="laocai"]').click();
 if(process.argv.includes('--profile')){await c.send('Profiler.enable');await c.send('Profiler.start');}
 if(process.argv.includes('--trace'))await c.send('Tracing.start',{categories:'devtools.timeline,disabled-by-default-devtools.timeline',transferMode:'ReturnAsStream'});
 await p.evaluate(()=>{window.roomPerf={longTasks:[],frames:[],scrolls:[]};new PerformanceObserver(l=>window.roomPerf.longTasks.push(...l.getEntries().map(e=>({start:e.startTime,duration:e.duration})))).observe({type:'longtask',buffered:false});let last=performance.now();const end=last+2500;function tick(t){window.roomPerf.frames.push(t-last);window.roomPerf.scrolls.push(scrollY);last=t;if(t<end)requestAnimationFrame(tick)}requestAnimationFrame(tick);window.roomPerf.start=performance.now();});
 await p.locator('#callout-try-btn').click();await p.waitForTimeout(2600);
 if(process.argv.includes('--trace')){const done=new Promise(r=>c.once('Tracing.tracingComplete',r));await c.send('Tracing.end');const {stream}=await done;let data='';while(true){const chunk=await c.send('IO.read',{handle:stream});data+=chunk.data;if(chunk.eof)break;}await c.send('IO.close',{handle:stream});console.log('Trace:',JSON.parse(data).traceEvents.filter(e=>e.ph==='X'&&e.dur>40000).sort((a,b)=>b.dur-a.dur).slice(0,12).map(e=>({name:e.name,ms:e.dur/1000,args:e.name==='Layout'?JSON.stringify(e.args):undefined})));}
 if(process.argv.includes('--profile')){const {profile}=await c.send('Profiler.stop');console.log('CPU samples:',profile.nodes.filter(n=>n.hitCount).sort((a,b)=>b.hitCount-a.hitCount).slice(0,14).map(n=>({function:n.callFrame.functionName,url:n.callFrame.url.split('/').at(-1),line:n.callFrame.lineNumber,hits:n.hitCount})));}
 console.log(JSON.stringify(await p.evaluate(()=>({url:location.href,...window.roomPerf,activeAnimations:document.getAnimations().filter(a=>a.playState==='running').length})),null,0));
 }finally{await b.close()}})().catch(e=>{console.error(e.message);process.exitCode=1});

