const fs = require('node:fs');
const { chromium } = require('D:/n8n/node_modules/playwright-core');
const { loadLocalGoogleKey } = require('../local-google-key.cjs');
const config = JSON.parse(fs.readFileSync('D:/n8n/flow-automation/worker-config.json', 'utf8'));
const secrets = [config.workerToken, loadLocalGoogleKey()].filter(Boolean);
function clean(s) { for (const value of secrets) s = s.split(value).join('[secret]'); return s.replace(/AIza[\w-]+/g, '[key]').replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]+/g, '[account]'); }
(async () => {
 const browser = await chromium.connectOverCDP(config.cdpUrl);
 try {
  const page = browser.contexts()[0].pages().find(p => p.url().includes('aistudio.google.com/apps/'));
  page.setDefaultTimeout(15000);
  const action = process.argv[2];
  if(['code','backup','zip','release'].includes(action)){
   const close=page.getByRole('button',{name:'Fermer le panneau',exact:true});
   if(await close.isVisible())await close.click();
  }
  if(action==='status') {console.log(clean((await page.locator('body').innerText()).slice(0,2200)));return;}
  if(action==='chat') {const text=await page.locator('body').innerText();console.log(clean(text.slice(0,text.indexOf('\nvisibility\nPreview')).slice(-6500)));return;}
  if(action==='reload') {await page.reload({waitUntil:'domcontentloaded'});await page.waitForTimeout(1500);}
  if (action === 'code') await page.getByRole('radio', { name: 'Code', exact: true }).click();
  if (action === 'zip' || action === 'release') {
   await page.getByRole('radio', { name: 'Code', exact: true }).click();
   await page.getByRole('button', { name: 'Add items to file explorer', exact: true }).click();
   const chooser = page.waitForEvent('filechooser');
   await page.getByRole('menuitem', { name: 'Upload Zip file', exact: true }).click();
   await (await chooser).setFiles(require('node:path').resolve(__dirname, '..', process.argv[3]||'output/viet-phuc-remix-ai-studio.zip'));
   await page.waitForTimeout(1500);
   if(action==='release'){
    const save=page.getByRole('button',{name:'Save',exact:true});
    await save.click();await save.waitFor({state:'hidden',timeout:60000});
    await page.getByRole('button',{name:'Ouvrir les paramètres de publication',exact:true}).click();
    await page.getByRole('button',{name:'Republish',exact:true}).click();
    await page.getByRole('button',{name:'Publish your app',exact:true}).click();
    console.log('Saved the scoped patch and requested publication.');return;
   }
  }
  if (action === 'publish-menu') await page.getByRole('button', { name: 'Ouvrir les paramètres de publication', exact: true }).click();
  if (action === 'click') await page.getByRole('button', { name: process.argv[3], exact: true }).click();
  if (action === 'escape') await page.keyboard.press('Escape');
  if (action === 'backup') {
   await page.getByRole('radio', { name: 'Code', exact: true }).click();
   const folder=require('node:path').resolve(__dirname,'../output/studio-downloads-'+Date.now());
   fs.mkdirSync(folder,{recursive:true});
   const session=await browser.newBrowserCDPSession();
   await session.send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:folder,eventsEnabled:true});
   await page.getByRole('button', { name: 'Export options', exact: true }).click();
   const download = page.waitForEvent('download');
   await page.getByRole('menuitem', { name: /Download/ }).click();
   const dl=await download;
   const dest=require('node:path').resolve(__dirname, '../output/'+(process.argv[3]||'studio-before-current-deploy.zip'));
   const local=require('node:path').join(folder,dl.suggestedFilename());
   for(let i=0;i<100&&!fs.existsSync(local);i++)await page.waitForTimeout(200);
   if(!fs.existsSync(local))throw new Error('Fresh exported ZIP was not downloaded');
   fs.copyFileSync(local,dest);
   await session.send('Browser.setDownloadBehavior',{behavior:'default'});
   console.log('Saved source archive');
  }
  if (action === 'secret-names') console.log('Secret names:', await page.locator('input[aria-label="Name"]').evaluateAll(es=>es.map(e=>e.value)));
  if (action === 'validate-build') {
   await page.getByRole('button',{name:'Fermer le panneau',exact:true}).click();
   await page.locator('textarea[placeholder="Make changes, add new features, ask for anything"]').fill('Deploy the exact manually uploaded current source, preserving every public asset and all UI/animation/guardrail/API behavior. Before publishing, run npm test (all three test files including moderation.test.cjs), add a build script that actually checks server.cjs, styling.cjs, moderation.cjs and the frontend JS syntax, and run compile_applet. This is the existing Node HTTP app, not a React rewrite. Check the platform gateway: the previous working server used port 3000 when PORT=8080 because 8080 is the preview gateway; retain the required platform-specific startup compatibility. Add /index.html as an alias of / if needed. Keep production CSP/security and all API authentication/moderation. Verify the live preview renders and /healthz works. GEMINI_API_KEY and FLOW_WORKER_TOKEN are already configured server-only Secrets; never print or copy their values into code, client files, chat or logs. Do not send photo jobs or spend Flow generation credits. Do not alter public UI files; report only build/test/preview results and any deployment-specific backend changes.');
   await page.getByRole('button',{name:'Send',exact:true}).click();
  }
  await page.waitForTimeout(900);
  const dialogs = page.locator('[role="dialog"]');
  console.log(clean((await (await dialogs.count() ? dialogs.last() : page.locator('body')).innerText()).slice(-3500)));
  console.log(JSON.stringify(await page.locator('button, input').evaluateAll(es => es.filter(e => e.getBoundingClientRect().width > 0 && !/^(Open |See more actions for )/.test(e.getAttribute('aria-label') || '')).map(e => ({tag:e.tagName, aria:e.getAttribute('aria-label'), text:e.tagName==='INPUT'?undefined:e.innerText.slice(0,100), type:e.getAttribute('type')})))));
 } finally { await browser.close(); }
})().catch(e => { console.error(clean(e.message)); process.exitCode = 1; });
