const {chromium}=require('D:/n8n/node_modules/playwright-core');
(async()=>{
 const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try {
  const p=await b.newPage({viewport:{width:1440,height:1000}});p.setDefaultTimeout(5000);
  const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://127.0.0.1:3000/#ban-do');
  await p.locator('#vietnam-svg').waitFor({state:'visible'});
  await p.screenshot({path:'D:/n8n/flow-automation/map-fixed-3000.png'});
  console.log('Map visible at port 3000:',await p.locator('#vietnam-svg').isVisible());
  await p.locator('#pin-hue-trung-bo').focus();await p.locator('#pin-hue-trung-bo').press('Enter');
  console.log('Drawer:',await p.locator('#drawer-title').innerText());
  await p.screenshot({path:'D:/n8n/flow-automation/map-review-drawer.png'});
  await p.locator('.wardrobe-try-btn').first().click();
  console.log('Transferred garment:',await p.locator('[name="Loại trang phục"]').inputValue());
  await p.goto('http://127.0.0.1:3000/#ban-do');await p.setViewportSize({width:390,height:844});
  await p.screenshot({path:'D:/n8n/flow-automation/map-review-mobile.png'});
  await p.locator('#pin-bac-bo').focus();await p.locator('#pin-bac-bo').press('Enter');
  await p.waitForTimeout(500);
  await p.screenshot({path:'D:/n8n/flow-automation/map-review-mobile-drawer.png'});
  console.log('Mobile drawer:',await p.locator('#heritage-drawer').boundingBox());
  console.log('Browser errors:',JSON.stringify(errors));
  if(errors.length)throw new Error('Browser errors detected');
 } finally {await b.close();}
})().catch(e=>{console.error(e.message);process.exitCode=1});
