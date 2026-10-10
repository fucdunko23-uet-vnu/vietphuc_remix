const fs=require('node:fs');
const assert=require('node:assert/strict');
const {chromium}=require('D:/n8n/node_modules/playwright-core');
const {createApp}=require('../ai-studio-app/server.cjs');
(async()=>{
 const server=createApp();await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const report={layouts:[],errors:[],history:[]};
 try{
  const p=await browser.newPage();p.on('pageerror',e=>report.errors.push(e.message));
  await p.route(/https:\/\/fonts\./,r=>r.abort());await p.emulateMedia({reducedMotion:'reduce'});
  for(const [width,height]of [[320,844],[390,844],[768,1024],[1024,768],[1101,900],[1280,800],[1440,1000],[844,390]]){
   await p.setViewportSize({width,height});
   for(const route of ['ban-do','trang-chu','kham-pha','thu-do','huong-dan','gioi-thieu']){
    await p.goto(base+'/?dia-diem=daklak#'+route,{waitUntil:'domcontentloaded'});
    await p.locator('[data-page="'+route+'"]').waitFor({state:'visible'});
    await p.waitForTimeout(150);
    const data=await p.evaluate(()=>{
     const visible=e=>e.checkVisibility({checkVisibilityCSS:true})&&getComputedStyle(e).opacity!=='0';
     const controls=[...document.querySelectorAll('button,a,input,select,textarea,summary')].filter(visible);
     const outside=[],clipped=[];
     for(const e of controls){
      const b=e.getBoundingClientRect();
      const label=(e.id||e.textContent.trim().slice(0,60)||e.name);
      let scrollable=false;for(let parent=e.parentElement;parent;parent=parent.parentElement){if(['auto','scroll'].includes(getComputedStyle(parent).overflowX)&&parent.scrollWidth>parent.clientWidth){scrollable=true;break;}}
      if(!scrollable&&(b.left< -2||b.right>innerWidth+2))outside.push(label);
      if(e.matches('button,summary,a')&&!e.closest('svg')){
       const walker=document.createTreeWalker(e,NodeFilter.SHOW_TEXT);let n;
       while(n=walker.nextNode()){
        if(!n.textContent.trim()||!visible(n.parentElement))continue;
        const range=document.createRange();range.selectNodeContents(n);const t=range.getBoundingClientRect();
        if(t.width&&(t.left<b.left-2||t.right>b.right+2||t.top<b.top-2||t.bottom>b.bottom+2)){clipped.push(label);break;}
       }
      }
     }
     const ids=new Set(),duplicates=[];for(const e of document.querySelectorAll('[id]')){if(ids.has(e.id))duplicates.push(e.id);ids.add(e.id);}
     const links=[...document.querySelectorAll('a[href]')].filter(visible).filter(e=>e.getAttribute('href').startsWith('#')&&!document.querySelector('[data-page="'+e.hash.slice(1)+'"]')&&!document.getElementById(e.hash.slice(1))).map(e=>e.getAttribute('href'));
     return {overflow:document.documentElement.scrollWidth>innerWidth,outside,clipped,duplicates,links};
    });
    report.layouts.push({width,height,route,...data});
    if([320,1440].includes(width))await p.screenshot({path:'output/audit-'+route+'-'+width+'.png'});
   }
  }
  await p.setViewportSize({width:1440,height:1000});
  await p.goto(base+'/?dia-diem=laocai#thu-do',{waitUntil:'domcontentloaded'});
  await p.locator('#site-nav [href="#huong-dan"]').click();
  await p.locator('#site-nav [href="#thu-do"]').click();
  await p.locator('#destination-select').selectOption('tthue');
  await p.goBack();await p.waitForURL('**#huong-dan');
  await p.goBack();await p.waitForURL('**#thu-do');
  report.history.push(await p.evaluate(()=>({url:location.href,destination:document.querySelector('#destination-select').value,theme:document.body.dataset.scenicTheme})));
  await p.goto(base+'/#thu-do',{waitUntil:'domcontentloaded'});
  report.history.push(await p.evaluate(()=>({url:location.href,destination:document.querySelector('#destination-select').value,theme:document.body.dataset.scenicTheme})));
  fs.writeFileSync('output/audit-all-pages.json',JSON.stringify(report,null,2));
  const failures=report.layouts.filter(row=>row.overflow||row.outside.length||row.clipped.length||row.duplicates.length||row.links.length);
  assert.deepEqual(failures,[]);assert.deepEqual(report.errors,[]);
  console.log('PASS '+report.layouts.length+' route/viewport combinations: no horizontal overflow, clipped controls, duplicate IDs, invalid local anchors or JS errors. History: '+JSON.stringify(report.history));
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
