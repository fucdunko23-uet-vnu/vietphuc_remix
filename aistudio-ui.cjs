const { chromium } = require('D:/n8n/node_modules/playwright-core');
(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9223');
  try {
    const page = browser.contexts()[0].pages().find(p => p.url().includes('aistudio.google.com'));
    if (!page) throw new Error('AI Studio tab missing.');
    if (process.argv.includes('--add')) {
      await page.getByRole('button', { name: 'Insert files (text, images, audio, video) into your prompt.', exact: true }).click();
      await page.waitForTimeout(500);
    }
    console.log('URL', page.url());
    console.log((await page.locator('body').innerText()).replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]+/g,'[account]').slice(0, 14000));
    console.log('INPUTS', JSON.stringify(await page.locator('input,textarea,[role=menuitem]').evaluateAll(elements => elements.map(e => ({ tag:e.tagName, type:e.getAttribute('type'), aria:e.getAttribute('aria-label'), placeholder:e.getAttribute('placeholder'), text:e.getAttribute('role')==='menuitem'?e.innerText:null })))));
  } finally { await browser.close(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
