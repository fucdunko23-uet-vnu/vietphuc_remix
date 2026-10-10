const {chromium}=require('D:/n8n/node_modules/playwright-core');
(async()=>{const b=await chromium.connectOverCDP('http://127.0.0.1:9223');try{
const p=b.contexts()[0].pages().find(p=>p.url().includes(process.argv[2]));
if(process.argv[3]==='click') await p.getByRole(process.argv[4],{name:process.argv[5],exact:true}).click();
if(process.argv[3]==='text') await p.getByText(process.argv[4],{exact:true}).click();
if(process.argv[3]==='inspect') console.log(JSON.stringify(await p.locator('button,[role=option],input,[contenteditable=true]').evaluateAll(es=>es.map(e=>({tag:e.tagName,role:e.getAttribute('role'),aria:e.getAttribute('aria-label'),text:e.innerText?.slice(0,150),html:e.hasAttribute('contenteditable')?e.outerHTML:undefined})))));
console.log((await p.locator('body').innerText()).replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]+/g,'[account]').slice(0,15000));
}finally{await b.close()}})().catch(e=>{console.error(e.message);process.exitCode=1});
