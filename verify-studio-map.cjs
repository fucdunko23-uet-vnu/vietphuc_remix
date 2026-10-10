const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('D:/n8n/node_modules/playwright-core');
(async()=>{
 const base='https://viet-phuc-remix.ai.studio';
 for(const name of ['index.html','map.js','style.css','site.js','site.css','app.js','presets.json']){
  const r=await fetch(base+(name==='index.html'?'/':'/'+name),{signal:AbortSignal.timeout(20000)});
  const bytes=Buffer.from(await r.arrayBuffer());const same=bytes.equals(fs.readFileSync(path.join(__dirname,'ai-studio-app/public',name)));
  console.log(name,r.status,'matches local:',same);if(r.status!==200||!same)throw new Error('Published file mismatch: '+name);
 }
 const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{const p=await b.newPage({viewport:{width:1440,height:1000}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(base+'/#ban-do');await p.locator('#vietnam-svg').waitFor({state:'visible'});
  await p.screenshot({path:'D:/n8n/flow-automation/published-map-verified.png'});
  await p.locator('#pin-hue-trung-bo').focus();await p.locator('#pin-hue-trung-bo').press('Enter');
  console.log('Region:',await p.locator('#drawer-title').innerText());await p.locator('.wardrobe-try-btn').first().click();
  console.log('Transferred:',await p.locator('[name="Loại trang phục"]').inputValue());
  await p.setViewportSize({width:390,height:844});await p.goto(base+'/#ban-do');await p.locator('#vietnam-svg').waitFor({state:'visible'});
  console.log('Mobile map visible:',await p.locator('#vietnam-svg').isVisible());console.log('JS errors:',errors);
  if(errors.length)throw new Error('Published browser error');
 }finally{await b.close()}
})().catch(e=>{console.error(e.message);process.exitCode=1});
