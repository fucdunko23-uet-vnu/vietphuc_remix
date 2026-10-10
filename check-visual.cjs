const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { spawn, execFileSync } = require('node:child_process');
const { randomUUID } = require('node:crypto');

// This harness only starts a fresh, isolated n8n instance. It does not log in to
// or change the user's instance on port 5678.
const workflowPath = path.join(__dirname, 'Viet-phuc-Remix.n8n.json');
const wf = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));
const sample = JSON.parse(fs.readFileSync(path.join(__dirname, 'demo-input.json'), 'utf8'));
const codeOf = name => {
  const node = wf.nodes.find(n => n.name === name);
  assert.ok(node, `Workflow node exists: ${name}`);
  return node.parameters.jsCode;
};
const prepareCode = codeOf('Chuẩn bị dữ liệu');
const renderCode = codeOf('Tạo thẻ kết quả');
const runCode = (code, input, prep) => vm.runInNewContext(`(function(){${code}\n})()`, {
  $input: { first: () => ({ json: input }) },
  $: name => {
    assert.equal(name, 'Chuẩn bị dữ liệu');
    return { first: () => ({ json: prep }) };
  },
}, { timeout: 2000 });
const prepare = values => runCode(prepareCode, { ...sample, formMode: 'production', ...values })[0].json;
const render = prep => runCode(renderCode, prep.sampleResult, prep)[0].json;
const normalize = value => JSON.parse(JSON.stringify(value));
const svgOf = html => html.match(/<svg\b[^>]*\bclass="[^"]*\boutfit-scene\b[^"]*"[^>]*>[\s\S]*?<\/svg>/g) ?? [];
const classCount = (html, cls) => (html.match(new RegExp(`class="[^"]*\\b${cls}\\b[^"]*"`, 'g')) ?? []).length;
const garments = ['Áo dài', 'Áo ngũ thân', 'Áo tứ thân'];
const backgrounds = ['Sân trường', 'Phố cổ', 'Sân vườn'];
const avatars = ['Tóc ngắn', 'Tóc dài'];
const accessories = ['Túi mini', 'Túi tote', 'Khăn lụa', 'Quạt giấy', 'Kẹp tóc', 'Không dùng phụ kiện'];
const model = html => svgOf(html).join('\n');
const checks = [];
let combinations = 0;

assert.ok(renderCode.includes('function renderOutfitScene'), 'Workflow embeds the standalone SVG renderer');
assert.equal(prepare({}).useAI, false, 'Imported demo runs without any API credential');
assert.equal(wf.nodes.find(n => n.name === 'Biểu mẫu Việt phục Remix').parameters.options.path, 'viet-phuc-remix-studio');

for (const garment of garments) {
  for (const background of backgrounds) {
    for (const avatar of avatars) {
      const prep = prepare({ 'Loại trang phục': garment, 'Bối cảnh': background, 'Nhân vật': avatar });
      const result = render(prep);
      assert.equal(result.looks.length, 2);
      assert.equal(classCount(result.html, 'look-card'), 2);
      assert.equal(svgOf(result.html).length, 2);
      assert.equal(classCount(result.html, 'swatch'), 6);
      assert.equal(result.source, 'demo');
      assert.ok(result.html.includes('DỮ LIỆU MẪU'));
      assert.ok(result.html.includes(prep.heritage.url), 'Cultural source appears in the result');
      assert.equal(prep.input.garment, garment);
      assert.equal(prep.input.background, background);
      assert.equal(prep.input.avatar, avatar);
      for (const svg of svgOf(result.html)) {
        assert.ok(svg.includes(`data-garment="${garment}"`), 'Illustration identifies the selected garment');
        assert.ok(svg.includes(`data-background="${background}"`), 'Illustration identifies the selected background');
        assert.ok(svg.includes(`data-avatar="${avatar}"`), 'Illustration identifies the selected avatar');
        assert.match(svg, /viewBox="[^"]+"/);
        assert.ok(!/<script\b|\bon(?:load|error|click)=|javascript:/i.test(svg), 'Artwork has no executable input');
      }
      combinations++;
    }
  }
}
checks.push(`${combinations} garment/background/avatar combinations`);

const basePrep = prepare({});
const baseResult = render(basePrep);
const baselineSvg = model(baseResult.html);
for (const [field, alternatives] of [
  ['Loại trang phục', garments], ['Bối cảnh', backgrounds], ['Nhân vật', avatars],
]) {
  const pictures = alternatives.map(value => model(render(prepare({ [field]: value })).html));
  assert.equal(new Set(pictures).size, alternatives.length, `${field} changes the illustration`);
}
const accessoryPictures = accessories.map(value => {
  const result = render(prepare({ 'Phụ kiện yêu thích': value }));
  assert.equal(svgOf(result.html).length, 2);
  return model(result.html);
});
assert.equal(new Set(accessoryPictures).size, accessories.length, 'Each accessory has distinct illustration output');
assert.notEqual(model(render(prepare({ 'Màu yêu thích': 'đỏ' })).html), model(render(prepare({ 'Màu yêu thích': 'xanh mint' })).html), 'Favorite color changes artwork');
checks.push('all 6 accessories, 3 backgrounds, 3 garments, 2 avatars and favorite color affect artwork');

const aiPrep = prepare({});
aiPrep.useAI = true;
const fixture = body => ({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify(body) }] } }] });
const explanations = [{ reason: 'Phương án thử AI thứ nhất, phù hợp với nhu cầu đã chọn.' }, { reason: 'Phương án thử AI thứ hai, giữ nét trang phục và phối màu hài hòa.' }];
const aiResult = runCode(renderCode, fixture({ explanations }), aiPrep)[0].json;
assert.equal(aiResult.source, 'ai');
assert.equal(model(aiResult.html), baselineSvg, 'AI explanation never replaces deterministic artwork');
for (let i = 0; i < 2; i++) {
  assert.equal(aiResult.looks[i].reason, explanations[i].reason);
  const { reason: aiReason, ...aiLook } = aiResult.looks[i];
  const { reason: sampleReason, ...sampleLook } = baseResult.looks[i];
  assert.deepEqual(normalize(aiLook), normalize(sampleLook), 'AI preserves garment, palette, shoes and accessory');
}
const poisonedFixture = fixture({ explanations, looks: [{ garment: 'changed', colors: [{ hex: '#000000' }] }], input: { garment: 'changed' }, heritage: { text: 'invented' } });
const poisonedResult = runCode(renderCode, poisonedFixture, aiPrep)[0].json;
assert.equal(model(poisonedResult.html), baselineSvg, 'Unexpected model fields cannot alter the illustration');
for (const bad of [
  { error: 'API unavailable' },
  { candidates: [{ finishReason: 'MAX_TOKENS', content: { parts: [{ text: JSON.stringify({ explanations }) }] } }] },
  { candidates: [{ finishReason: 'SAFETY' }] },
  fixture({}),
  fixture({ explanations: [{ reason: 'Only one explanation' }] }),
  { candidates: [{ finishReason: 'STOP', content: { parts: [{ text: '{invalid JSON' }] } }] },
]) {
  const fallback = runCode(renderCode, bad, aiPrep)[0].json;
  assert.equal(fallback.source, 'demo');
  assert.ok(fallback.html.includes('DỮ LIỆU MẪU'));
  assert.equal(model(fallback.html), baselineSvg);
}
checks.push('Gemini explanation fixture, unexpected fields, network/parse/refusal/incomplete response fallbacks');

for (const field of ['Loại trang phục', 'Bối cảnh', 'Nhân vật', 'Sự kiện', 'Phong cách', 'Phụ kiện yêu thích']) {
  try {
    const malicious = render(prepare({ [field]: '<script>alert(1)</script>' }));
    assert.ok(!malicious.html.includes('<script>'), `${field} rejects or escapes unknown values`);
    assert.equal(svgOf(malicious.html).length, 2);
  } catch (error) {
    if (error.code === 'ERR_ASSERTION') throw error;
    assert.ok(error.message, `${field} rejects invalid input with an error`);
  }
}
const escaped = render(prepare({ 'Mong muốn thêm': '<img src=x onerror=alert(1)>', 'Màu yêu thích': '<script>alert(2)</script>' }));
assert.ok(!escaped.html.includes('<img src=x'));
assert.ok(!escaped.html.includes('<script>'));
assert.ok(escaped.html.includes('&lt;img'), 'Free text stays visible, escaped');
checks.push('enumerated input validation and HTML escaping');

assert.match(baseResult.html, /class="back"[^>]*href="\/form\/viet-phuc-remix-studio"/, 'Production result has a usable retry route');
const testMode = render(prepare({ formMode: 'test' }));
assert.equal(classCount(testMode.html, 'back'), 0, 'Test mode does not link to an unrelated production form');
assert.ok(testMode.html.includes('Execute workflow'), 'Test mode tells users how to run another test');
checks.push('production retry and test-mode rerun guidance');

fs.writeFileSync(path.join(__dirname, 'Xem-truoc-ghep-trang-phuc.html'), `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Việt phục Remix · Bản phối mẫu</title><style>body{margin:0}</style></head><body>${baseResult.html}</body></html>`);
console.log('PASS static: ' + checks.join('; ') + '.');

async function endToEnd() {
  const { chromium } = require('D:/n8n/node_modules/playwright-core');
  const portIndex = process.argv.indexOf('--port');
  const port = portIndex >= 0 ? Number(process.argv[portIndex + 1]) : 5689;
  assert.ok(Number.isInteger(port) && port >= 5689 && port < 65000, 'Use a non-production test port');
  const assertPortFree = target => new Promise((resolve, reject) => {
    const probe = require('node:net').createServer();
    probe.once('error', () => reject(new Error(`Test port ${target} is already occupied; use --port with a free port pair.`)));
    probe.listen(target, '127.0.0.1', () => probe.close(resolve));
  });
  await assertPortFree(port);
  await assertPortFree(port + 1);
  const runtime = path.join('D:/n8n/temp', `viet-remix-visual-test-${Date.now()}`);
  fs.mkdirSync(runtime, { recursive: true });
  const logFile = fs.openSync(path.join(runtime, 'server.log'), 'a');
  const base = `http://127.0.0.1:${port}`;
  const env = {
    ...process.env, N8N_USER_FOLDER: runtime, N8N_PORT: String(port), N8N_HOST: '127.0.0.1',
    N8N_LISTEN_ADDRESS: '127.0.0.1', N8N_EDITOR_BASE_URL: base, WEBHOOK_URL: base + '/',
    N8N_RUNNERS_BROKER_PORT: String(port + 1), N8N_SECURE_COOKIE: 'false',
    N8N_DIAGNOSTICS_ENABLED: 'false', N8N_VERSION_NOTIFICATIONS_ENABLED: 'false',
    N8N_TEMPLATES_ENABLED: 'false', N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS: 'false',
    N8N_LOG_LEVEL: 'warn', GENERIC_TIMEZONE: 'Asia/Ho_Chi_Minh',
  };
  const server = spawn(process.execPath, ['D:/n8n/node_modules/n8n/bin/n8n', 'start'], {
    env, cwd: runtime, windowsHide: true, stdio: ['ignore', logFile, logFile],
  });
  let browser;
  try {
    console.log(`Starting isolated n8n visual test on port ${port} (PID ${server.pid}).`);
    let ready = false;
    for (let i = 0; i < 180; i++) {
      if (server.exitCode !== null) throw new Error('Isolated n8n exited; inspect ' + runtime);
      try { ready = (await fetch(base + '/healthz/readiness', { signal: AbortSignal.timeout(1500) })).ok; } catch {}
      if (ready) break;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    assert.ok(ready, 'Isolated n8n readiness');
    browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
    const context = await browser.newContext({ viewport: { width: 1180, height: 1000 } });
    const browserId = randomUUID();
    const api = async (route, data, method = 'POST') => {
      const response = await context.request.fetch(base + '/rest' + route, { method, data, headers: { 'browser-id': browserId } });
      const json = await response.json();
      if (!response.ok()) throw new Error(`${route}: HTTP ${response.status()} ${JSON.stringify(json).slice(0, 1000)}`);
      return json.data;
    };
    await api('/owner/setup', { email: 'remix-visual@example.invalid', firstName: 'Visual', lastName: 'Test', password: 'TestOnly7!' + randomUUID() });
    const imported = normalize(wf);
    imported.active = false;
    const saved = await api('/workflows', imported);
    await api(`/workflows/${saved.id}/activate`, { versionId: saved.versionId, expectedChecksum: saved.checksum });
    console.log('Imported and published the JSON in the isolated instance.');
    const page = await context.newPage();
    page.setDefaultTimeout(30000);
    await page.goto(base + '/form/viet-phuc-remix-studio', { waitUntil: 'domcontentloaded' });
    await page.screenshot({ path: path.join(__dirname, 'Bieu-mau-ghep-trang-phuc.png'), fullPage: true });

    // Use the rendered label associations, so adding or reordering fields does
    // not accidentally submit a different garment or background.
    const fieldFor = async labelText => {
      const direct = page.getByLabel(labelText, { exact: false });
      if (await direct.count() === 1) return direct;
      const label = page.locator('label').filter({ hasText: labelText }).first();
      const id = await label.getAttribute('for');
      if (id) return page.locator(`[id=${JSON.stringify(id)}]`);
      const wrapper = label.locator('..');
      const control = wrapper.locator('input, select, textarea');
      assert.equal(await control.count(), 1, `Unique control for ${labelText}`);
      return control;
    };
    for (const label of ['Nhân vật', 'Loại trang phục', 'Sự kiện', 'Bối cảnh', 'Phong cách', 'Phụ kiện yêu thích']) {
      await (await fieldFor(label)).selectOption({ label: sample[label] });
    }
    for (const label of ['Màu yêu thích', 'Mong muốn thêm']) await (await fieldFor(label)).fill(sample[label] ?? '');
    await page.getByRole('button', { name: 'Ghép trang phục và bối cảnh', exact: true }).click();
    await page.locator('.look-card').first().waitFor({ timeout: 60000 });
    assert.equal(await page.locator('.look-card').count(), 2);
    assert.equal(await page.locator('svg.outfit-scene').count(), 2, 'n8n preserves both inline SVG artworks');
    assert.equal(await page.locator('.swatch').count(), 6);
    assert.equal((await page.locator('.badge').innerText()).trim(), 'DỮ LIỆU MẪU');
    for (const scene of await page.locator('svg.outfit-scene').all()) {
      assert.equal(await scene.getAttribute('data-garment'), sample['Loại trang phục']);
      assert.equal(await scene.getAttribute('data-background'), sample['Bối cảnh']);
      assert.equal(await scene.getAttribute('data-avatar'), sample['Nhân vật']);
      const box = await scene.boundingBox();
      assert.ok(box && box.width > 200 && box.height > 250, 'Artwork has a visible desktop area');
      assert.ok(await scene.locator('path, rect, circle, ellipse, polygon').count() > 10, 'The SVG contains drawn outfit layers');
    }
    await page.screenshot({ path: path.join(__dirname, 'Ket-qua-ghep-trang-phuc.png'), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, 'Mobile layout has no horizontal overflow');
    for (const scene of await page.locator('svg.outfit-scene').all()) {
      const box = await scene.boundingBox();
      assert.ok(box && box.width > 150 && box.x >= 0 && box.x + box.width <= 390, 'Mobile artwork stays within the viewport');
    }
    await page.screenshot({ path: path.join(__dirname, 'Ket-qua-ghep-trang-phuc-mobile.png'), fullPage: true });
    await page.locator('.back').click();
    await page.getByRole('button', { name: 'Ghép trang phục và bối cảnh', exact: true }).waitFor();
    assert.equal(new URL(page.url()).pathname, '/form/viet-phuc-remix-studio', 'Retry returns to a live form');
    await (await fieldFor('Loại trang phục')).selectOption({ label: 'Áo tứ thân' });
    console.log('PASS browser: actual n8n import, publish, form submit, 2 visible SVG cards, desktop/mobile layout and usable retry link.');
    const n8nVersion = JSON.parse(fs.readFileSync('D:/n8n/node_modules/n8n/package.json', 'utf8')).version;
    fs.writeFileSync(path.join(__dirname, 'validation-visual.json'), JSON.stringify({
      n8nVersion, staticChecks: checks, inputCombinations: combinations, demoEndToEnd: 'passed',
      desktopScreenshot: 'Ket-qua-ghep-trang-phuc.png', mobileScreenshot: 'Ket-qua-ghep-trang-phuc-mobile.png',
      liveGeminiCall: 'not run: no Google API key supplied', testRuntime: runtime,
    }, null, 2));
  } finally {
    if (browser) await browser.close();
    if (server.exitCode === null) {
      // This process was started above with an isolated user folder.
      execFileSync('taskkill.exe', ['/PID', String(server.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' });
    }
    fs.closeSync(logFile);
  }
}

if (process.argv.includes('--e2e')) endToEnd().catch(error => { console.error(error.stack ?? error.message); process.exitCode = 1; });
