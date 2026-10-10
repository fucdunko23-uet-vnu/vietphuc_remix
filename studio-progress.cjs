const {chromium}=require('D:/n8n/node_modules/playwright-core');
(async()=>{const b=await chromium.connectOverCDP('http://127.0.0.1:9223');try{const p=b.contexts()[0].pages().find(p=>p.url().includes('aistudio.google'));console.log((await p.locator('body').innerText()).slice(-1800));}finally{await b.close()}})();
