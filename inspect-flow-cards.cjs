const {chromium}=require('D:/n8n/node_modules/playwright-core');
(async()=>{const b=await chromium.connectOverCDP('http://127.0.0.1:9223');try{const p=b.contexts()[0].pages().find(p=>p.url().includes('flow.google'));
console.log(JSON.stringify(await p.locator('img[data-media-id]').evaluateAll(es=>es.map(e=>({id:e.dataset.mediaId,parents:Array.from((function*(el){for(let i=0;el&&i<8;i++,el=el.parentElement)yield el})(e)).map(el=>({tag:el.tagName,role:el.getAttribute('role'),cls:el.className,attrs:[...el.attributes].filter(a=>!['src','class','style'].includes(a.name)).map(a=>[a.name,a.value]),text:el.innerText?.slice(0,160)}))}))),null,2));
}finally{await b.close()}})();
