const {chromium}=require('D:/n8n/node_modules/playwright-core');
(async()=>{const b=await chromium.connectOverCDP('http://127.0.0.1:9223');try{for(const p of b.contexts()[0].pages()){
console.log('TAB',p.url().split('?')[0]);
if(p.url().includes('console.cloud.google.com')) console.log((await p.locator('body').innerText()).replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]+/g,'[account]').slice(0,10000));
} }finally{await b.close()}})().catch(e=>{console.error(e.message);process.exitCode=1});
