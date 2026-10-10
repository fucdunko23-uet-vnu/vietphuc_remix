const {chromium}=require('D:/n8n/node_modules/playwright-core');
(async()=>{const b=await chromium.connectOverCDP('http://127.0.0.1:9223');try{const p=b.contexts()[0].pages().find(p=>p.url().includes('aistudio.google'));
await p.locator('textarea[placeholder="Describe your app"]').fill('Thử áo dài, áo ngũ thân và áo tứ thân trên ảnh của bạn. Khám phá hai cách phối màu, phụ kiện và bối cảnh, kèm câu chuyện văn hóa. Ảnh thử đồ do Google Flow tạo; hình minh họa mẫu được ghi nhãn riêng.');
await p.locator('input[placeholder="enter-app-name"]').fill('viet-phuc-remix');
if(process.argv.includes('--publish')){await p.getByRole('button',{name:'Publish your app',exact:true}).click();console.log('Publication requested.');}
else console.log('Publication metadata prepared.');
}finally{await b.close()}})().catch(e=>{console.error(e.message);process.exitCode=1});
