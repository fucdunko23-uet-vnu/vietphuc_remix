const {chromium}=require('D:/n8n/node_modules/playwright-core');
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
(async()=>{const b=await chromium.connectOverCDP('http://127.0.0.1:9223',{timeout:10000});try{
 const p=b.contexts()[0].pages().find(p=>p.url().includes('aistudio.google.com/apps/'));p.setDefaultTimeout(10000);await p.bringToFront();
 const action=process.argv[2];
 if(action==='reconnect'){
  await p.goto('https://aistudio.google.com/',{waitUntil:'domcontentloaded'});await p.waitForTimeout(2500);
  console.log('Session page:',p.url(),(await p.locator('body').innerText()).slice(0,900).replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]+/g,'[account]'));
  if(p.url().includes('aistudio.google.com'))await p.goto('https://aistudio.google.com/apps/bdc81a72-7107-4a3a-bdff-b35757552c3d?showAssistant=true&showCode=true',{waitUntil:'domcontentloaded'});
 }
 if(action==='diagnose'){
  p.on('requestfailed',r=>console.log('Failed',new URL(r.url()).hostname,new URL(r.url()).pathname,r.failure()?.errorText));
  p.on('response',r=>{if(r.status()>=400)console.log('HTTP',r.status(),new URL(r.url()).hostname,new URL(r.url()).pathname)});
  p.on('pageerror',e=>console.log('UI error',e.message.slice(0,400)));
  await p.reload({waitUntil:'domcontentloaded'});await p.waitForTimeout(20000);console.log((await p.locator('body').innerText()).slice(-1200));
 }
 if(action==='reload'){await p.reload({waitUntil:'domcontentloaded'});await p.waitForTimeout(2000);console.log('Reloaded editor');}
 if(action==='inspect')console.log((await p.locator('body').innerText()).slice(-11000));
 if(action==='file'){
  const name=process.argv[3];
  await p.getByRole('radio',{name:'Code',exact:true}).click();
  const row=p.getByRole('button',{name:'See more actions for '+name,exact:true,includeHidden:true});
  console.log(await row.evaluate(e=>e.parentElement.outerHTML));
 }
 if(action==='add'){await p.getByRole('button',{name:'Add items to file explorer',exact:true}).click();console.log((await p.locator('body').innerText()).slice(-4000));}
 if(action==='menus')console.log(await p.locator('[role="menu"], [role="dialog"], input').evaluateAll(es=>es.map(e=>({html:e.outerHTML.slice(0,3000)}))));
 if(action==='history-open'){await p.getByRole('button',{name:'Open public/index.html',exact:true}).last().click();await p.waitForTimeout(2000);console.log((await p.locator('body').innerText()).slice(-500));}
 if(action==='zip'){
  await p.keyboard.press('Escape');await p.getByRole('button',{name:'Add items to file explorer',exact:true}).click();
  const chooser=p.waitForEvent('filechooser');await p.getByRole('menuitem',{name:'Upload Zip file',exact:true}).click();
  await(await chooser).setFiles(process.argv[3]||'D:/n8n/temp/viet-phuc-map-public.zip');await p.waitForTimeout(1500);
  console.log((await p.locator('body').innerText()).slice(-3500));
 }
 if(action==='discard'){await p.getByRole('button',{name:'Discard',exact:true}).click();console.log((await p.locator('body').innerText()).slice(-1000));}
 if(action==='save'){await p.getByRole('button',{name:'Save',exact:true}).click();console.log((await p.locator('body').innerText()).slice(-1000));}
 if(action==='export-menu'){await p.getByRole('button',{name:'Export options',exact:true}).click();console.log(await p.getByRole('menu').innerText());}
 if(action==='publish-menu'){await p.getByRole('button',{name:'Ouvrir les paramètres de publication',exact:true}).click();console.log((await p.locator('body').innerText()).slice(-4000));}
 if(action==='republish'){await p.getByRole('button',{name:'Republish',exact:true}).click();await p.waitForTimeout(1000);console.log((await p.locator('body').innerText()).slice(0,1000).replace(/API Key[^\n]*/g,'API Key [hidden]'));}
 if(action==='confirm-publish'){await p.getByRole('button',{name:'Publish your app',exact:true}).click();await p.waitForTimeout(1000);console.log((await p.locator('body').innerText()).slice(0,650).replace(/API Key[^\n]*/g,'API Key [hidden]'));}
 if(action==='publication-status')console.log((await p.locator('body').innerText()).slice(0,700).replace(/API Key[^\n]*/g,'API Key [hidden]'));
 if(action==='export'){
  const dl=p.waitForEvent('download');await p.getByRole('menuitem',{name:/Download/}).click();await(await dl).saveAs(process.argv[3]||'D:/n8n/temp/studio-before-map-backend.zip');console.log('Downloaded backup');
 }
 if(action==='context'){const row=p.locator('mat-tree-node').filter({has:p.locator('.node-name',{hasText:'server.cjs'})}).first();await row.hover();await row.getByRole('button').click();console.log(await p.getByRole('menu').innerText());}
 if(action==='open'||action==='paste'||action==='backup'){
  await p.keyboard.press('Escape');
  const file=process.argv[3],name=path.basename(file);
  const rows=p.locator('mat-tree-node').filter({has:p.locator('.node-name',{hasText:new RegExp('^'+name.replaceAll('.','\\.')+'$')})});
  console.log('Matching rows',await rows.locator('.node-name').allTextContents());
  const target=rows.nth(file.startsWith('public/')?0:await rows.count()-1);
  await target.focus();await target.press('Enter');
  await p.waitForTimeout(1500);
  const editor=p.locator('textarea[aria-label="Editor content"]').last();await editor.focus();await editor.press('Control+a');
  if(action==='paste'){
   const abs=path.join(__dirname,'ai-studio-app',file);
   execFileSync('powershell.exe',['-NoProfile','-Command',"Set-Clipboard -Value (Get-Content -Raw -LiteralPath '"+abs.replaceAll("'","''")+"')"]);
   await editor.press('Control+v');await editor.press('Control+s');console.log('Saved '+file);
  }else if(action==='backup'){
   await editor.press('Control+c');await p.waitForTimeout(200);
   const data=execFileSync('powershell.exe',['-NoProfile','-Command','[Console]::OutputEncoding=[System.Text.Encoding]::UTF8; Get-Clipboard -Raw'],{encoding:'utf8',maxBuffer:2000000});
   const dest=path.join(__dirname,'backup-before-studio-map',file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,data);console.log('Backed up '+file+' ('+data.length+' chars)');
  }
 }
 if(action==='shot')await p.screenshot({path:'D:/n8n/flow-automation/studio-merge-ui.png'});
}finally{await b.close()}})().catch(e=>{console.error(e.message);process.exitCode=1});
