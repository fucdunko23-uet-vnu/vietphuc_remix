const fs=require('node:fs');
(async()=>{
 const tabs=await(await fetch('http://127.0.0.1:9223/json/list')).json();
 const page=tabs.find(t=>t.type==='page'&&t.url.includes(process.argv[2]==='flow-inspect'?'flow.google.com/':'aistudio.google.com/apps/'));if(!page)throw Error('Application tab missing');
 const ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j});let seq=0;const pending=new Map();
 ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id)}};
 const send=(method,params={})=>new Promise((r,j)=>{const id=++seq;const timer=setTimeout(()=>{pending.delete(id);j(Error('CDP timeout: '+method))},10000);pending.set(id,m=>{clearTimeout(timer);m.error?j(Error(m.error.message)):r(m.result)});ws.send(JSON.stringify({id,method,params}))});
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true});if(r.exceptionDetails)throw Error('UI evaluation failed');return r.result.value;};
 const action=process.argv[2];
 try{
 if(action==='inspect')console.log((await evaluate('document.body.innerText')).slice(-2500).replace(/API Key[^\n]*/g,'API Key [hidden]'));
 if(action==='flow-inspect')console.log((await evaluate('document.body.innerText')).slice(0,1500).replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]+/g,'[account]'));
 if(action==='status')console.log((await evaluate('document.body.innerText')).slice(0,850).replace(/API Key[^\n]*/g,'API Key [hidden]'));
 if(action==='buttons')console.log(await evaluate('JSON.stringify([...document.querySelectorAll("button")].filter(e=>e.getBoundingClientRect().width).map(e=>({text:e.innerText,aria:e.getAttribute("aria-label")})))'));
 if(action==='download-setup'){fs.mkdirSync('D:/n8n/temp/studio-destination-backup',{recursive:true});await send('Page.setDownloadBehavior',{behavior:'allow',downloadPath:'D:/n8n/temp/studio-destination-backup'});console.log('Backup download directory ready');}
 if(action==='download'){
  fs.mkdirSync('D:/n8n/temp/studio-destination-backup',{recursive:true});await send('Page.setDownloadBehavior',{behavior:'allow',downloadPath:'D:/n8n/temp/studio-destination-backup'});
  await evaluate(`document.querySelector('button[aria-label="Export options"]').click()`);
  await new Promise(r=>setTimeout(r,300));await evaluate(`[...document.querySelectorAll('[role="menuitem"]')].find(e=>e.textContent.includes('Download as .zip file')).click()`);
  await new Promise(r=>setTimeout(r,4000));console.log(fs.readdirSync('D:/n8n/temp/studio-destination-backup'));
 }
 if(action==='click'){
  const label=process.argv[3];console.log(await evaluate(`(()=>{const label=${JSON.stringify(label)};const e=[...document.querySelectorAll('button,[role="menuitem"]')].find(e=>e.getBoundingClientRect().width&&(e.getAttribute('aria-label')===label||e.textContent.trim()===label||e.innerText.trim().split('\\n').at(-1)===label||e.getAttribute('role')==='menuitem'&&e.textContent.includes(label)));if(!e)return 'Button missing';e.click();return 'Clicked';})()`));
 }
 if(action==='upload'){
  const dom=await send('DOM.getDocument');const inputs=await send('DOM.querySelectorAll',{nodeId:dom.root.nodeId,selector:'input[type="file"][accept=".zip"]'});if(!inputs.nodeIds.length)throw Error('Zip input missing');
  await send('DOM.setFileInputFiles',{nodeId:inputs.nodeIds[0],files:[process.argv[3]]});console.log('Uploaded archive through file input');
 }
 }finally{ws.close()}
})().catch(e=>{console.error(e.message);process.exitCode=1});
