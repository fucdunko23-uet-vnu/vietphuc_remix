const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { spawn, execFileSync } = require('node:child_process');
const { randomUUID } = require('node:crypto');
const { chromium } = require('D:/n8n/node_modules/playwright-core');
const sample = { ...JSON.parse(fs.readFileSync(path.join(__dirname, 'demo-input.json'), 'utf8')), 'Kiểu ảnh': 'Ảnh toàn thân' };
const simulated = process.argv.includes('--simulated');
const userPhotoIndex = process.argv.indexOf('--photo');
const userPhoto = userPhotoIndex >= 0 ? path.resolve(process.argv[userPhotoIndex + 1]) : null;
const expectImages = process.argv.includes('--expect-images');
const output = 'D:/n8n/workflows/Viet-phuc-Thu-do';
fs.mkdirSync(output, { recursive: true });
const fixture = path.join(__dirname, 'test-assets', 'anh-minh-hoa-kiem-thu.png');

(async () => {
  let browser, server, logFile;
  try {
    let base = 'http://127.0.0.1:5678';
    browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
    const context = await browser.newContext({ viewport: { width: 1180, height: 1000 } });
    const page = await context.newPage();
    if (!userPhoto && !fs.existsSync(fixture)) {
      fs.mkdirSync(path.dirname(fixture), { recursive: true });
      await page.goto('file:///' + path.join(__dirname, 'Xem-truoc-ghep-trang-phuc.html').replaceAll('\\', '/'));
      await page.locator('svg.outfit-scene').first().screenshot({ path: fixture });
    }
    if (simulated) {
      base = 'http://127.0.0.1:5693';
      const runtime = 'D:/n8n/temp/photo-tryon-test-' + Date.now(); fs.mkdirSync(runtime, { recursive: true });
      logFile = fs.openSync(path.join(runtime, 'server.log'), 'a');
      server = spawn(process.execPath, ['D:/n8n/node_modules/n8n/bin/n8n', 'start'], { cwd: runtime, windowsHide: true, stdio: ['ignore', logFile, logFile], env: {
        ...process.env, N8N_USER_FOLDER: runtime, N8N_PORT: '5693', N8N_HOST: '127.0.0.1', N8N_LISTEN_ADDRESS: '127.0.0.1', N8N_EDITOR_BASE_URL: base, N8N_WEBHOOK_URL: base + '/', N8N_RUNNERS_BROKER_PORT: '5694', N8N_SECURE_COOKIE: 'false', N8N_DIAGNOSTICS_ENABLED: 'false', N8N_VERSION_NOTIFICATIONS_ENABLED: 'false', N8N_LOG_LEVEL: 'warn',
      } });
      let ready;
      for (let i = 0; i < 180; i++) {
        try { ready = (await fetch(base + '/healthz/readiness', { signal: AbortSignal.timeout(1000) })).ok; } catch {}
        if (ready) break;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      assert.ok(ready, 'Isolated n8n ready');
      const api = async (route, data) => {
        const response = await context.request.post(base + '/rest' + route, { data, headers: { 'browser-id': 'photo-test' } });
        assert.ok(response.ok(), `${route}: ${response.status()}`); return (await response.json()).data;
      };
      await api('/owner/setup', { email: 'photo-test@example.invalid', firstName: 'Photo', lastName: 'Test', password: 'TestOnly7!' + randomUUID() });
      const workflow = JSON.parse(fs.readFileSync(path.join(__dirname, 'Viet-phuc-Thu-do.n8n.json'), 'utf8'));
      const google = workflow.nodes.find(n => n.name === 'Google tạo ảnh thử đồ');
      google.type = 'n8n-nodes-base.code'; google.typeVersion = 2;
      google.parameters = { jsCode: `// SIMULATED response for UI testing only; never deployed to the real instance.\nreturn $input.all().map((item, i) => ({json:{candidates:[{finishReason:'STOP',content:{parts:[{inlineData:item.json.photo}]}}]},pairedItem:{item:i}}));` };
      const saved = await api('/workflows', workflow);
      await api('/workflows/' + saved.id + '/activate', { versionId: saved.versionId, expectedChecksum: saved.checksum });
      let formReady = false;
      for (let i = 0; i < 60; i++) {
        const response = await fetch(base + '/form/viet-phuc-thu-do');
        formReady = response.ok;
        if (formReady) break;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      assert.ok(formReady, 'Published form registered');
    }
    const submit = async (filePath, photoType) => {
      await page.goto(base + '/form/viet-phuc-thu-do', { waitUntil: 'domcontentloaded' });
      for (const [label, value] of Object.entries({ ...sample, 'Kiểu ảnh': photoType })) {
        if (label === 'Nhân vật') continue;
        const field = page.getByLabel(label, { exact: false });
        if (await field.evaluate(el => el.tagName) === 'SELECT') await field.selectOption({ label: value });
        else await field.fill(value);
      }
      await page.locator('input[type=file]').setInputFiles(filePath);
      await page.getByRole('button', { name: 'Thử Việt phục trên ảnh của tôi', exact: true }).click();
      await page.locator('main.tryon').waitFor({ timeout: 400000 });
    };
    await page.goto(base + '/form/viet-phuc-thu-do');
    await page.screenshot({ path: path.join(output, 'Bieu-mau-tai-anh.png'), fullPage: true });
    await submit(userPhoto || fixture, 'Ảnh toàn thân');
    assert.equal(await page.locator('.look-card').count(), 2);
    assert.ok(await page.locator('.original-image').evaluate(el => el.complete && el.naturalWidth > 0));
    const images = await page.locator('.tryon-image').count();
    if (simulated || expectImages) {
      assert.equal(images, 2, 'Two try-on images');
      for (const img of await page.locator('.tryon-image').all()) assert.ok(await img.evaluate(el => el.complete && el.naturalWidth > 0));
      const downloaded = page.waitForEvent('download');
      await page.locator('.download').first().click();
      assert.match((await downloaded).suggestedFilename(), /^viet-phuc-ban-phoi-1\.(png|jpg|webp)$/);
    } else {
      assert.equal(images, 0, 'Do not substitute demo images when Google quota is zero.');
      assert.equal(await page.locator('.failure').count(), 2);
      assert.match(await page.locator('.failure').first().innerText(), /hạn mức/);
    }
    await page.screenshot({ path: path.join(output, simulated ? 'Kiem-thu-giao-dien-phan-hoi-gia-lap.png' : expectImages ? 'Ket-qua-anh-Google.png' : 'Thong-bao-han-muc-Google.png'), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    if (simulated) {
      await page.screenshot({ path: path.join(output, 'Kiem-thu-giao-dien-mobile-gia-lap.png'), fullPage: true });
      await page.locator('footer .button').click();
      await page.locator('input[type=file]').waitFor();
      await submit(fixture, 'Ảnh khuôn mặt');
      assert.match(await page.locator('.summary').innerText(), /AI dựng thêm/);
      const invalid = { name: 'invalid.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('This is not an image.') };
      await submit(invalid, 'Ảnh toàn thân');
      assert.equal(await page.locator('.tryon-image').count(), 0);
      assert.match(await page.locator('.failure').innerText(), /không phải ảnh/);
    }
    const report = { checkedAt: new Date().toISOString(), mode: simulated ? 'ISOLATED SIMULATED GOOGLE RESPONSE; UI ONLY' : expectImages ? 'REAL GOOGLE IMAGE EDIT' : 'REAL GOOGLE QUOTA ERROR', input: userPhoto ? 'user supplied photo' : 'SVG character screenshot; not a real person', formUpload: 'passed', displayedImages: images, mobileLayout: 'passed', downloads: simulated || expectImages ? 'passed' : 'not available without generated images' };
    fs.writeFileSync(path.join(output, simulated ? 'validation-ui-simulated.json' : 'validation-google-photo.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report));
  } finally {
    if (browser) await browser.close();
    if (server && server.exitCode === null) execFileSync('taskkill.exe', ['/PID', String(server.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' });
    if (logFile !== undefined) fs.closeSync(logFile);
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
