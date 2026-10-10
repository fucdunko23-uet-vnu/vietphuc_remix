const { chromium } = require('D:/n8n/node_modules/playwright-core');
const fs = require('node:fs');
(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9223');
  try {
    const page = browser.contexts()[0].pages().find(p => /flow\.google\.com|labs\.google.*flow/.test(p.url()));
    if (!page) throw new Error('No signed-in Flow tab found.');
    if (process.argv.includes('--new')) {
      await page.getByRole('button', { name: /Dự án mới|New project/ }).click();
      await page.waitForTimeout(4000);
    }
    if (process.argv.includes('--settings')) {
      const start = page.getByRole('button', { name: 'Bắt đầu', exact: true });
      if (await start.isVisible().catch(() => false)) await start.click();
      await page.getByRole('button', { name: 'Điều kiện kích hoạt cài đặt', exact: true }).click();
    }
    if (process.argv.includes('--configure')) {
      if (!(await page.getByRole('radio', { name: 'x1', exact: true }).isVisible().catch(() => false))) await page.getByRole('button', { name: 'Điều kiện kích hoạt cài đặt', exact: true }).click();
      await page.getByRole('radio', { name: /Hình ảnh/ }).click();
      await page.getByRole('radio', { name: /3:4/ }).click();
      await page.getByRole('radio', { name: 'x1', exact: true }).click();
      await page.keyboard.press('Escape');
      await page.getByLabel('Văn bản có thể chỉnh sửa', { exact: true }).fill('Việt phục Remix — kiểm thử tự động');
      await page.getByLabel('Văn bản có thể chỉnh sửa', { exact: true }).press('Enter');
    }
    if (process.argv.includes('--generate-fixture')) {
      const settings = await page.getByRole('button', { name: 'Điều kiện kích hoạt cài đặt', exact: true }).innerText();
      if (!settings.includes('Nano Banana') || !settings.includes('x1')) throw new Error('Image model and one output must be configured first.');
      await page.locator('[contenteditable=true]').fill('Create one realistic full-length studio photograph of a fictional adult Vietnamese woman, age 25, wearing a plain blue T-shirt, straight dark jeans and white sneakers. Shoulder-length dark hair, natural expression, standing facing the camera with relaxed arms slightly away from the torso. Natural body proportions. Both shoes fully visible. Neutral grey background and soft daylight, vertical 3:4 photo. No text or collage. This is a fictional reference person for testing a clothing visualization application.');
      await page.getByRole('button', { name: 'Bắt đầu tạo', exact: true }).click();
      await page.waitForTimeout(2000);
    }
    if (process.argv.includes('--images')) {
      console.log('IMAGES', JSON.stringify(await page.locator('img').evaluateAll(elements => elements.map(e => ({ src: e.src, alt: e.alt, width: e.naturalWidth, height: e.naturalHeight, html: e.outerHTML.slice(0, 1200) })))));
    }
    if (process.argv.includes('--save-fixture')) {
      const source = await page.locator('img[data-media-id]').first().getAttribute('src');
      const response = await page.request.get(source);
      if (!response.ok()) throw new Error('Unable to download generated test image.');
      fs.writeFileSync(require('node:path').join(__dirname, 'test-assets', 'flow-fictional-person.jpg'), await response.body());
      console.log('Saved generated fictional test person.');
    }
    if (process.argv.includes('--upload-fixture')) {
      const upload = page.getByRole('button', { name: /Tải nội dung nghe nhìn lên/ });
      if (!(await upload.isVisible())) await page.getByRole('button', { name: 'Thêm thành phần vào ô nhập câu lệnh', exact: true }).click();
      const choosing = page.waitForEvent('filechooser');
      await upload.click();
      await (await choosing).setFiles(require('node:path').join(__dirname, 'test-assets', 'flow-fictional-person.jpg'));
      await page.waitForTimeout(1500);
    }
    if (process.argv.includes('--add')) {
      await page.getByRole('button', { name: 'Thêm thành phần vào ô nhập câu lệnh', exact: true }).click();
      await page.waitForTimeout(500);
    }
    console.log('URL', page.url());
    console.log((await page.locator('body').innerText()).slice(0, 14000));
    console.log('CONTROLS', JSON.stringify(await page.locator('button,input,textarea,[contenteditable=true]').evaluateAll(elements => elements.map(e => ({ tag:e.tagName, role:e.getAttribute('role'), type:e.getAttribute('type'), aria:e.getAttribute('aria-label'), placeholder:e.getAttribute('placeholder'), text:e.tagName==='BUTTON'?e.innerText?.slice(0,100):undefined })))));
    fs.writeFileSync('D:/n8n/flow-automation/current-project-url.txt', page.url());
    await page.screenshot({ path: 'D:/n8n/flow-automation/flow-ui.png' });
  } finally { await browser.close(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
