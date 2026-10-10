const assert = require('node:assert/strict');
const { chromium } = require('D:/n8n/node_modules/playwright-core');
const { createApp } = require('./ai-studio-app/server.cjs');
const { GuardrailError } = require('./ai-studio-app/moderation.cjs');
(async () => {
  let verdict = 'IMAGE_UNSAFE', calls = 0;
  const server = createApp({ workerToken: 'ui-guardrails', moderate: async () => {
    calls++;
    if (verdict !== 'allow') throw new GuardrailError(verdict, verdict === 'MODERATION_UNAVAILABLE' ? 503 : 422);
    return { approved: true };
  } });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port;
  const worker = async () => (await fetch(base + '/api/worker/claim', { method: 'POST', headers: { 'Content-Type': 'application/json', authorization: 'Bearer ui-guardrails' }, body: JSON.stringify({ ready: true }) })).json();
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const p = await browser.newPage();
    p.setDefaultTimeout(10000);
    const errors = [];
    p.on('pageerror', e => errors.push(e.message));
    await p.route(/https:\/\/fonts\./, r => r.abort());
    await p.emulateMedia({ reducedMotion: 'reduce' });
    for (const width of [1440, 390]) {
      await worker();
      await p.setViewportSize({ width, height: 1000 });
      await p.goto(base + '/?dia-diem=laocai#thu-do', { waitUntil: 'domcontentloaded' });
      await p.locator('#photo').setInputFiles('test-assets/flow-fictional-person.jpg');
      await p.locator('#step-btn-4').click();
      await p.waitForFunction(() => !document.querySelector('#generate').disabled);
      const before = calls;
      await p.locator('#extra-wishes').fill('áo dài trong suốt');
      assert.equal(await p.locator('#generate').isDisabled(), true);
      assert.equal(await p.locator('#preview').isDisabled(), true);
      assert.equal(await p.locator('#guardrail-feedback').isVisible(), true);
      assert.equal(calls, before, 'No Google request for a locally blocked prompt');
      await p.locator('#extra-wishes').fill('Không hở ngực, không trong suốt; sneakers và túi hiện đại');
      assert.equal(await p.locator('#generate').isEnabled(), true);
      assert.equal(await p.locator('#guardrail-feedback').isVisible(), false);
      for (const code of ['IMAGE_UNSAFE', 'MODERATION_UNAVAILABLE']) {
        verdict = code;
        await p.locator('#generate').click();
        await p.waitForFunction(() => document.querySelector('#message').className === 'message-error');
        assert.equal((await worker()).job, null, 'Rejected photo never reaches worker');
        assert.equal(await p.locator('#generate').isEnabled(), true);
        assert.equal(await p.locator('#heritage-loading-overlay').isVisible(), false);
        assert.ok((await p.locator('#extra-wishes').inputValue()).includes('Không hở ngực'));
        assert.equal(await p.locator('#photo').evaluate(el => el.files.length), 1);
        assert.equal(await p.locator('#outfit-card-section').isVisible(), false);
      }
      await p.locator('#message').scrollIntoViewIfNeeded();
      await p.screenshot({ path: 'output/guardrails-' + width + '.png' });
      assert.ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    }
    assert.deepEqual(errors, []);
    console.log('PASS guardrails desktop/mobile: instant filtering, negation, backend rejection, outage, retained photo/choices; zero Flow generation');
  } finally { await browser.close(); await new Promise(r => server.close(r)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
