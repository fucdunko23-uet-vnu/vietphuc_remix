const { chromium } = require('D:/n8n/node_modules/playwright-core');
(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9223');
  try {
    for (const context of browser.contexts()) for (const page of context.pages()) {
      const url = page.url();
      if (!/aistudio\.google\.com|labs\.google|flow\.google/.test(url)) continue;
      console.log('PAGE', url);
      console.log((await page.locator('body').innerText()).slice(0, 9000));
      console.log('CONTROLS', JSON.stringify(await page.locator('button,input,textarea,[contenteditable=true]').evaluateAll(elements => elements.map(e => ({ tag: e.tagName, role: e.getAttribute('role'), type: e.getAttribute('type'), aria: e.getAttribute('aria-label'), placeholder: e.getAttribute('placeholder'), text: e.tagName === 'BUTTON' ? e.innerText?.slice(0, 100) : undefined }))).catch(() => [])));
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
