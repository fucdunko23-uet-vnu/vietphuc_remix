const assert=require('node:assert/strict');
const {chromium}=require('D:/n8n/node_modules/playwright-core');
const {createApp}=require('./ai-studio-app/server.cjs');
(async()=>{
  const server=createApp();await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const base='http://127.0.0.1:'+server.address().port;
  const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  try{
    const page=await browser.newPage();
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.route(/https:\/\/fonts\./,r=>r.abort());
    await page.emulateMedia({reducedMotion:'reduce'});
    for(const width of [1440,390]){
      await page.setViewportSize({width,height:1000});
      await page.goto(base+'/#kham-pha',{waitUntil:'domcontentloaded'});
      assert.equal(await page.locator('[data-page="kham-pha"] .collection-card').count(),18);
      assert.equal(await page.locator('[data-collection-art]').count(),12);
      assert.equal(await page.locator('[data-original-art]').count(),10);
      const imageErrors=await page.locator('[data-collection-art], .collection-art [data-original-art]').evaluateAll(async images=>{
        const errors=[];
        for(const img of images){
          const response=await fetch(img.src);
          if(!response.ok){errors.push('Missing image '+img.src);continue;}
          const doc=new DOMParser().parseFromString(await response.text(),'image/svg+xml');
          if(doc.querySelector('parsererror'))errors.push('Malformed SVG '+img.src);
          const svg=doc.documentElement;
          const ids=[...svg.querySelectorAll('[id]')].map(e=>e.id);
          for(const match of svg.outerHTML.matchAll(/url\(#([^)]*)\)/g))if(!ids.includes(match[1]))errors.push('Missing paint '+match[1]);
          if(!ids.includes(svg.getAttribute('aria-labelledby')))errors.push('Missing image title');
          if(!img.alt||img.loading!=='lazy')errors.push('Missing accessible description or lazy loading');
          const frame=img.parentElement.getBoundingClientRect(),art=img.getBoundingClientRect();
          if(art.bottom>frame.bottom+1||Math.abs(art.height-art.width*560/480)>2)errors.push('Clipped image');
        }
        return errors;
      });
      assert.deepEqual(imageErrors,[]);
      const broken=await page.locator('.collection-art > svg').evaluateAll(svgs=>{
        const errors=[],seen=new Set();
        for(const svg of svgs){
          for(const element of svg.querySelectorAll('[id]')){
            if(seen.has(element.id))errors.push('Duplicate '+element.id);seen.add(element.id);
          }
          for(const match of svg.outerHTML.matchAll(/url\(#([^)]*)\)/g))if(![...svg.querySelectorAll('[id]')].some(e=>e.id===match[1]))errors.push('Missing paint '+match[1]);
          const title=svg.getAttribute('aria-labelledby');
          if(title&&![...svg.querySelectorAll('title')].some(e=>e.id===title))errors.push('Missing title '+title);
          const frame=svg.parentElement.getBoundingClientRect(),art=svg.getBoundingClientRect();
          if(art.bottom>frame.bottom+1||art.top<frame.top-1)errors.push('Clipped artwork');
        }
        return errors;
      });
      assert.deepEqual(broken,[]);
      for(const [filter,count]of [['Áo Nhật Bình',2],['Váy xòe',1],['Trang phục truyền thống Ba Na',1],['Tất cả',18]]){
        await page.locator('[data-filter="'+filter+'"]').click();
        assert.equal(await page.locator('[data-page="kham-pha"] .collection-card:visible').count(),count);
        assert.ok((await page.locator('#collection-count').innerText()).startsWith(String(count)));
      }
      await page.locator('[data-page="kham-pha"] [data-preset="6"]').scrollIntoViewIfNeeded();
      await page.waitForFunction(()=>{const img=document.querySelector('[data-collection-art="6"]');return img.complete&&img.naturalWidth>0;});
      await page.screenshot({path:'output/collection-redrawn-'+width+'.png'});
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      for(const [index,destination,garment]of [[6,'tthue','Áo Nhật Bình'],[12,'laocai','Váy xòe'],[16,'gialai','Trang phục truyền thống Ba Na']]){
        await page.goto(base+'/#kham-pha',{waitUntil:'domcontentloaded'});
        await page.locator('[data-page="kham-pha"] [data-preset="'+index+'"]').click();
        await page.waitForURL('**#thu-do');
        assert.equal(await page.locator('#destination-select').inputValue(),destination);
        assert.equal(await page.locator('[name="Loại trang phục"]').inputValue(),garment);
      }
    }
    assert.deepEqual(errors,[]);
    console.log('PASS collection desktop/mobile: 18 cards, complete uncropped SVGs, scoped gradients/titles, filters and destination/preset navigation.');
  }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(error=>{console.error(error);process.exitCode=1;});
