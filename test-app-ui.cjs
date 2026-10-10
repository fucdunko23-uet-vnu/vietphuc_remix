const {chromium}=require('D:/n8n/node_modules/playwright-core');
const fs=require('node:fs');
(async()=>{const b=await chromium.connectOverCDP('http://127.0.0.1:9223');try{
const p=await b.contexts()[0].newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.goto('http://127.0.0.1:3000');await p.locator('#preview').click();await p.locator('#results').waitFor({state:'visible'});
const text=await p.locator('#results').innerText();if(text.includes('undefined'))throw new Error('Undefined result fields: '+text);
if(await p.locator('.look-card').count()!==2)throw new Error('Expected two cards');
await p.screenshot({path:'D:/n8n/flow-automation/app-desktop.png',fullPage:true});
await p.setViewportSize({width:390,height:844});
if(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw new Error('Mobile horizontal overflow');
await p.screenshot({path:'D:/n8n/flow-automation/app-mobile.png',fullPage:true});
if(errors.length)throw new Error(errors.join('; '));console.log('UI passed: two preview cards, no undefined fields, mobile fits, no JavaScript errors.');
await p.close();}finally{await b.close()}})().catch(e=>{console.error(e.message);process.exitCode=1});
