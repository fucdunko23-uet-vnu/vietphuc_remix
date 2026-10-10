const {chromium}=require('D:/n8n/node_modules/playwright-core');
(async()=>{const b=await chromium.connectOverCDP('http://127.0.0.1:9223');try{const p=b.contexts()[0].pages().find(p=>p.url().includes('aistudio.google'));
for(const f of p.frames().slice(1)){console.log('Frame:',f.url().split('?')[0]);console.log((await f.locator('body').innerText({timeout:3000}).catch(()=>'' )).slice(0,1500));}
console.log('INPUTS',JSON.stringify(await p.locator('input,textarea').evaluateAll(es=>es.filter(e=>e.getBoundingClientRect().width>0).map(e=>({tag:e.tagName,aria:e.getAttribute('aria-label'),placeholder:e.getAttribute('placeholder'),type:e.type})))));
}finally{await b.close()}})().catch(e=>{console.error(e.message);process.exitCode=1});
