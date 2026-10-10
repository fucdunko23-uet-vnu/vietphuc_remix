const {chromium}=require('D:/n8n/node_modules/playwright-core');
(async()=>{
 const browser=await chromium.connectOverCDP('http://127.0.0.1:9223');
 try{
  const page=browser.contexts()[0].pages().find(p=>p.url().includes('aistudio.google.com/apps/'));
  page.on('response',async r=>{
   if(r.request().method()!=='GET'&&r.url().includes('google')){
    const path=new URL(r.url()).pathname;
    console.log('Response',r.status(),path);
    if(r.status()>=400){const s=await r.text().catch(()=>'');console.log('Error summary',s.replace(/AIza[\w-]+/g,'[key]').replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]+/g,'[account]').slice(0,600));}
   }
  });
  const close=page.getByRole('button',{name:'Fermer le panneau',exact:true});
  if(await close.isVisible())await close.click();
  await page.getByRole('button',{name:'Save',exact:true}).click();
  await page.waitForTimeout(15000);
  console.log('Save still visible',await page.getByRole('button',{name:'Save',exact:true}).isVisible());
  console.log('Recent status',(await page.locator('body').innerText()).slice(-400));
 }finally{await browser.close();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
