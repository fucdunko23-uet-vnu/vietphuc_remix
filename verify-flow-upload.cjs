const {chromium}=require('D:/n8n/node_modules/playwright-core');
(async()=>{const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{
 const p=await b.newPage();await p.goto('https://viet-phuc-remix.ai.studio/#thu-do');
 await p.locator('#connection.ready').waitFor({timeout:15000});
 await p.locator('#photo').setInputFiles(require('node:path').join(__dirname,'test-assets/flow-fictional-person.jpg'));
 await p.waitForFunction(()=>!document.querySelector('#generate').disabled);
 console.log('Connection:',await p.locator('#connection').innerText());
 console.log('Photo preview visible:',await p.locator('#photo-preview').isVisible());
 console.log('Generate enabled:',await p.locator('#generate').isEnabled());
}finally{await b.close()}})().catch(e=>{console.error(e.message);process.exitCode=1});
