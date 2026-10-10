const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('D:/n8n/node_modules/playwright-core');
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1180, height: 1000 } });
    await page.goto('http://localhost:5678/form/viet-phuc-remix-studio', { waitUntil: 'domcontentloaded' });
    const sample = JSON.parse(fs.readFileSync(path.join(__dirname, 'demo-input.json'), 'utf8'));
    const fields = ['Nhân vật', 'Loại trang phục', 'Sự kiện', 'Bối cảnh', 'Màu yêu thích', 'Phong cách', 'Phụ kiện yêu thích', 'Mong muốn thêm'];
    for (const label of fields) {
      const field = page.getByLabel(label, { exact: false });
      if (await field.evaluate(el => el.tagName) === 'SELECT') await field.selectOption({ label: sample[label] });
      else await field.fill(sample[label]);
    }
    await page.locator('textarea').fill(sample['Mong muốn thêm']);
    await page.getByRole('button', { name: 'Ghép trang phục và bối cảnh' }).click();
    await page.locator('.look-card').first().waitFor({ timeout: 60000 });
    assert.equal(await page.locator('.look-card').count(), 2);
    assert.equal(await page.locator('.swatch').count(), 6);
    assert.equal(await page.locator('svg.outfit-scene').count(), 2);
    const badge = (await page.locator('.badge').innerText()).trim();
    if (process.argv.includes('--require-ai')) {
      assert.equal(badge, 'GIẢI THÍCH BẰNG GEMINI', 'The live workflow must use the real Google response.');
      const verificationPath = 'D:/n8n/workflows/Viet-phuc-Remix-Studio/validation-google.json';
      const verification = JSON.parse(fs.readFileSync(verificationPath, 'utf8'));
      verification.workflowEndToEnd = 'passed';
      fs.writeFileSync(verificationPath, JSON.stringify(verification, null, 2));
    }
    await page.screenshot({ path: 'D:/n8n/workflows/Viet-phuc-Remix-Studio/Ket-qua-tren-may.png', fullPage: true });
    console.log('PASS: live Studio form on port 5678; two outfit scenes and six color swatches displayed. Mode: ' + badge);
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
