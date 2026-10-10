const fs=require('node:fs');
const {chromium}=require('D:/n8n/node_modules/playwright-core');
(async()=>{const b=await chromium.connectOverCDP('http://127.0.0.1:9223');try{const p=b.contexts()[0].pages().find(p=>p.url().includes('aistudio.google.com'));
if(process.argv.includes('--secret')){
const config=JSON.parse(fs.readFileSync('D:/n8n/flow-automation/worker-config.json','utf8'));
const nameInput=p.locator('input[aria-label="Name"]').last();
if(await nameInput.isEditable()) await nameInput.fill('FLOW_WORKER_TOKEN');
else if(await nameInput.inputValue()!=='FLOW_WORKER_TOKEN') throw new Error('Unexpected secret name.');
await p.locator('input[aria-label="Value"]').last().fill(config.workerToken);
await p.getByRole('button',{name:'Apply',exact:true}).click();
console.log('Server-only worker secret configured.');
}
if(process.argv.includes('--fixes')){
await p.locator('textarea[placeholder="Make changes, add new features, ask for anything"]').fill('Apply these small verified fixes, preserving the app: (1) public/app.js showResults currently reads look.shoes and look.accessories but the exact data schema from styling.cjs uses look.shoe and look.accessory. Fix both so the result cards never show undefined. (2) In server.cjs worker claim handler, after updating worker state and the !worker.ready early return, add if (state.busy === true) return send(200, { job: null }); so heartbeats during a running job cannot accidentally claim another job if the previous one expires. (3) Change the privacy paragraph to: Khi thử đồ, ảnh được gửi đến tài khoản Google Flow của ứng dụng và có thể được lưu trong dự án Flow. Chỉ dùng ảnh bạn có quyền sử dụng. (4) Preserve FLOW_WORKER_TOKEN as a server-only secret, never display it or hardcode it. Run npm test. Configure production to one instance because the queue is in memory. Check preview iframe works; server CSP must permit the actual AI Studio preview origin, with no changes to the API contracts.');
await p.locator('button').filter({hasText:'arrow_upward_alt'}).click();
console.log('Submitted verified corrections.');
}
}finally{await b.close()}})().catch(e=>{console.error(e.message);process.exitCode=1});
