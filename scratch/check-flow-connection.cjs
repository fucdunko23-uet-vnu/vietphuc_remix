const {chromium}=require('D:/n8n/node_modules/playwright-core');
(async()=>{const browser=await chromium.connectOverCDP('http://127.0.0.1:9223',{timeout:15000});try{
 const page=browser.contexts()[0].pages().find(p=>p.url().startsWith('https://flow.google.com/'));page.setDefaultTimeout(15000);
 if(process.argv.includes('--reload')){await page.reload({waitUntil:'domcontentloaded',timeout:30000});await page.waitForTimeout(5000);}
 console.log(JSON.stringify({fileInputs:await page.locator('input[type=file]').evaluateAll(es=>es.map(e=>({accept:e.accept,multiple:e.multiple}))),buttons:await page.locator('button').evaluateAll(es=>es.filter(e=>e.getBoundingClientRect().width).map(e=>({aria:e.getAttribute('aria-label'),text:e.innerText.slice(0,80)})))}));
 if(process.argv.includes('--upload')){
  await page.getByRole('button',{name:'Thêm thành phần vào ô nhập câu lệnh',exact:true}).click();
  const upload=page.getByRole('button',{name:/Tải nội dung nghe nhìn lên/});
  const chooser=page.waitForEvent('filechooser');await upload.click();
  const file=await chooser;await file.setFiles(require('node:path').resolve(__dirname,'../test-assets/flow-fictional-person.jpg'));
  await page.getByRole('option',{name:/flow-fictional-person/}).waitFor({timeout:90000});
  console.log('PASS: real Google Flow upload, no image generation requested');
 }
}finally{await browser.close();}})().catch(e=>{console.error(e.message.split('\n')[0]);process.exitCode=1});
