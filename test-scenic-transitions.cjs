const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { createApp } = require('./ai-studio-app/server.cjs');

async function getBrowser() {
  try {
    const { chromium } = require('D:/n8n/node_modules/playwright-core');
    const b = await chromium.launch({
      executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
      headless: true
    });
    return b;
  } catch (e) {
    console.log('Playwright not available or Chrome failed:', e.message);
    return null;
  }
}

(async () => {
  const artifactDir = 'C:/Users/lequa/.gemini/antigravity/brain/8b9144cb-2668-49c0-91f5-580d15aa9973';
  if (!fs.existsSync(artifactDir)) fs.mkdirSync(artifactDir, { recursive: true });

  const server = createApp({ workerToken: 'ui-test' });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port;

  const browser = await getBrowser();
  if (!browser) {
    console.log('Skipping headless visual verification because browser is not available.');
    server.close();
    return;
  }

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));

    console.log('1. Loading Map page...');
    await page.goto(base + '/#ban-do');
    await page.locator('#vietnam-svg').waitFor({ state: 'visible' });

    // Verify map decorations exist
    const cartouche = page.locator('.map-decor-cartouche');
    const dongSon = page.locator('.map-dong-son-motif');
    const compass = page.locator('.map-compass-rose');
    const junks = page.locator('.map-sailing-junks');
    const clouds = page.locator('.map-auspicious-clouds');

    assert.ok(await cartouche.count() > 0, 'Cartouche exists');
    assert.ok(await dongSon.count() > 0, 'Dong Son motif exists');
    assert.ok(await compass.count() > 0, 'Compass rose exists');
    assert.ok(await junks.count() > 0, 'Sailing junks exist');
    assert.ok(await clouds.count() > 0, 'Auspicious clouds exist');

    await page.screenshot({ path: path.join(artifactDir, 'vietnam_map_decorated.png') });
    console.log('Saved: vietnam_map_decorated.png');

    // 2. Click region pin Hue / Central Coast to open zoom / beacons
    console.log('2. Zooming into Hue & Central Coast...');
    const pinHue = page.locator('#pin-hue-trung-bo');
    if (await pinHue.isVisible()) {
      await pinHue.click({ force: true });
    } else {
      await page.evaluate(() => window.zoomToRegion && window.zoomToRegion('hue-trung-bo'));
    }
    await page.waitForTimeout(500);

    // Click Thừa Thiên Huế beacon to open Callout Deck
    console.log('3. Selecting Thua Thien Hue beacon...');
    await page.evaluate(() => {
      if (window.selectCultureProvince) window.selectCultureProvince('tthue');
    });
    await page.locator('#infographic-callout-deck').waitFor({ state: 'visible' });
    assert.equal(await page.locator('#callout-prov-title').textContent(), 'Thừa Thiên Huế');

    // Click "Phối đồ ngay ↗" to test the cinematic transition curtain
    console.log('4. Clicking "Phối đồ ngay ↗" and capturing cinematic transition curtain...');
    const tryBtn = page.locator('#callout-try-btn');
    
    // Trigger transition and capture halfway screenshot
    await tryBtn.click();
    await page.waitForTimeout(180); // while curtain is shut & disc is rotating
    await page.screenshot({ path: path.join(artifactDir, 'cinematic_transition_curtain.png') });
    console.log('Saved: cinematic_transition_curtain.png');

    // Wait for transition to complete into fitting room
    await page.waitForTimeout(700);
    await page.waitForURL('**#thu-do');

    // 5. Verify fitting room backdrop is Hue
    const backdrop = page.locator('#tryon-scenic-backdrop');
    assert.equal(await backdrop.getAttribute('data-scenic-theme'), 'hue');
    const badgeName = page.locator('#scenic-current-name');
    assert.match(await badgeName.textContent(), /Huế/);

    // Scroll to view hero & scenic toolbar with backdrop
    await page.locator('#tryon-scenic-ribbon').scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(artifactDir, 'fitting_room_hue_scenic.png') });
    console.log('Saved: fitting_room_hue_scenic.png');

    // 6. Test switching scenic pill to "Sa Pa & Tây Bắc"
    console.log('6. Switching scenic pill to Sa Pa & Tây Bắc...');
    const btnTayBac = page.locator('.btn-scenic-pill[data-scenic-target="taybac"]');
    await btnTayBac.click();
    await page.waitForTimeout(350);

    assert.equal(await backdrop.getAttribute('data-scenic-theme'), 'taybac');
    assert.match(await badgeName.textContent(), /Tây Bắc/);
    assert.equal(await page.locator('#destination-select').inputValue(), 'laocai');
    await page.screenshot({ path: path.join(artifactDir, 'fitting_room_taybac_scenic.png') });
    console.log('Saved: fitting_room_taybac_scenic.png');

    // 7. Test switching scenic pill to "Phố Cổ & Kinh Bắc"
    console.log('7. Switching scenic pill to Phố Cổ & Kinh Bắc...');
    const btnBacBo = page.locator('.btn-scenic-pill[data-scenic-target="bacbo"]');
    await btnBacBo.click();
    await page.waitForTimeout(350);

    assert.equal(await backdrop.getAttribute('data-scenic-theme'), 'bacbo');
    assert.match(await badgeName.textContent(), /Bắc Bộ/);
    assert.equal(await page.locator('#destination-select').inputValue(), 'hanoi');
    await page.screenshot({ path: path.join(artifactDir, 'fitting_room_bacbo_scenic.png') });
    console.log('Saved: fitting_room_bacbo_scenic.png');

    // 8. Test returning to map with transition
    console.log('8. Returning to map...');
    const backBtn = page.locator('.back-to-map-btn');
    await backBtn.click();
    await page.waitForTimeout(900);
    await page.waitForURL('**#ban-do');
    assert.ok(await page.locator('#vietnam-svg').isVisible(), 'Map is visible again');

    assert.deepEqual(errors, []);
    console.log('ALL TESTS PASSED! Visual evidence saved to artifact directory.');
  } finally {
    await browser.close();
    await new Promise(r => server.close(r));
  }
})().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
