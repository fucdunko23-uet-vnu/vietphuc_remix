const {chromium}=require('D:/n8n/node_modules/playwright-core');
(async()=>{const b=await chromium.connectOverCDP('http://127.0.0.1:9223');try{const p=b.contexts()[0].pages().find(p=>p.url().includes('flow.google'));
await p.getByRole('option',{name:/flow-fictional-person.jpg/}).click();
await p.getByRole('button',{name:'Thêm vào câu lệnh',exact:true}).click();
console.log(await p.locator('[contenteditable=true]').evaluate(e=>e.outerHTML));
console.log(JSON.stringify(await p.locator('button').evaluateAll(es=>es.map(e=>({aria:e.getAttribute('aria-label'),text:e.innerText})))));
}finally{await b.close()}})().catch(e=>{console.error(e.message);process.exitCode=1});
