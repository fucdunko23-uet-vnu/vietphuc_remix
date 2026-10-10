const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { createApp } = require('./ai-studio-app/server.cjs');

async function getBrowser() {
  const { chromium } = require('D:/n8n/node_modules/playwright-core');
  return await chromium.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true
  });
}

(async () => {
  const artifactDir = 'C:/Users/lequa/.gemini/antigravity/brain/8b9144cb-2668-49c0-91f5-580d15aa9973';
  if (!fs.existsSync(artifactDir)) fs.mkdirSync(artifactDir, { recursive: true });

  const server = createApp({ workerToken: 'stepper-verify' });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port;

  const browser = await getBrowser();
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));

    console.log('1. Loading Fitting Room (#thu-do)...');
    await page.goto(base + '/#thu-do', { waitUntil: 'networkidle' });
    await page.locator('#styling-form').waitFor({ state: 'visible' });

    // Verify Stepper Navigation & 4 Knots
    console.log('2. Verifying Stepper Silk Navigation & Knots...');
    const silkTrack = page.locator('.stepper-silk-track');
    const knots = page.locator('.stepper-knot-btn');
    assert.equal(await knots.count(), 4, 'Has 4 Stepper knots');
    assert.ok(await silkTrack.count() > 0, 'Silk track exists');

    // Click Knots
    await page.locator('#step-btn-2').click();
    await page.waitForTimeout(150);
    assert.ok(await page.locator('#step-btn-2').evaluate(el => el.classList.contains('is-active')), 'Step 2 active');

    await page.locator('#step-btn-1').click();
    await page.waitForTimeout(150);

    // Click a destination card (e.g. Huế)
    console.log('3. Selecting Heritage Destination (Huế)...');
    const hueCard = page.locator('.dest-card[data-dest-key="tthue"]');
    if (await hueCard.count() > 0) {
      await hueCard.click();
    } else {
      await page.locator('#destination-select').selectOption('tthue');
    }
    await page.waitForTimeout(300);

    // Verify Live Preview Card is reactive
    console.log('4. Verifying Reactive Live Preview Card...');
    const liveCard = page.locator('.live-preview-card');
    assert.ok(await liveCard.count() > 0, 'Live preview card exists in split-screen');
    const liveDestTag = await page.locator('#pv-dest-spec').innerText();
    assert.match(liveDestTag, /Huế|Thừa Thiên/i, 'Live destination matches selection');

    // Select garment & color in Step 2
    await page.locator('#step-btn-2').click();
    await page.waitForTimeout(150);
    await page.locator('#garment-select').selectOption('Áo Nhật Bình');
    await page.locator('#color-input').fill('Đỏ thắm hoa hải đường');
    await page.locator('#color-input').dispatchEvent('input');
    await page.waitForTimeout(200);

    const liveGarmentTag = await page.locator('#pv-garment-spec').innerText();
    assert.equal(liveGarmentTag, 'Áo Nhật Bình');

    // Screenshot Desktop Split-screen
    const desktopScreenshotPath = path.join(artifactDir, 'fitting_room_stepper_desktop.png');
    await page.screenshot({ path: desktopScreenshotPath, fullPage: false });
    console.log('Saved: fitting_room_stepper_desktop.png');

    // 5. Verify Mobile Viewport
    console.log('5. Testing Mobile Viewport (390x844)...');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(200);
    const mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    assert.ok(mobileOverflow, 'No mobile overflow');

    const mobileScreenshotPath = path.join(artifactDir, 'fitting_room_stepper_mobile.png');
    await page.screenshot({ path: mobileScreenshotPath, fullPage: false });
    console.log('Saved: fitting_room_stepper_mobile.png');

    // 6. Test Spotlight Mode
    console.log('6. Testing Spotlight Mode in AI Results...');
    await page.setViewportSize({ width: 1440, height: 950 });
    await page.locator('#preview').click();
    await page.locator('#results').waitFor({ state: 'visible' });

    // By default upon receiving results, Spotlight is ON to highlight garments
    let isSpotlight = await page.locator('#results').evaluate(el => el.classList.contains('has-spotlight'));
    assert.ok(isSpotlight, 'Spotlight is ON by default upon result generation');

    const btnSpotlight = page.locator('#btn-toggle-spotlight');
    assert.ok(await btnSpotlight.count() > 0, 'Spotlight toggle button exists');
    
    // Toggle OFF
    await btnSpotlight.click();
    await page.waitForTimeout(150);
    isSpotlight = await page.locator('#results').evaluate(el => el.classList.contains('has-spotlight'));
    assert.equal(isSpotlight, false, 'Spotlight toggled OFF successfully');

    // Toggle back ON
    await btnSpotlight.click();
    await page.waitForTimeout(150);
    isSpotlight = await page.locator('#results').evaluate(el => el.classList.contains('has-spotlight'));
    assert.equal(isSpotlight, true, 'Spotlight toggled back ON successfully');

    await page.locator('#results').scrollIntoViewIfNeeded();
    const spotlightScreenshotPath = path.join(artifactDir, 'fitting_room_spotlight_results.png');
    await page.screenshot({ path: spotlightScreenshotPath, fullPage: false });
    console.log('Saved: fitting_room_spotlight_results.png');

    // 7. Test Photobooth Modal & Draggable Monogram Seal Stamp
    console.log('7. Testing Photobooth Studio with Monogram & Draggable Seal Stamp...');
    await page.evaluate(() => {
      const dummyB64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
      window.currentResultsData = {
        mode: 'flow',
        data: {
          looks: [
            { title: 'Bản phối Hoàng Cung', outfit: 'Nhật Bình cách tân', colors: ['#C5A059', '#1A4D3E'], tags: ['Trang trọng', 'Di sản'] },
            { title: 'Bản phối Đương Đại', outfit: 'Áo ngũ thân tay chẽn', colors: ['#9DCCBA', '#F6F2E9'], tags: ['Thanh lịch', 'Đời sống'] }
          ],
          images: [
            { mimeType: 'image/png', data: dummyB64 },
            { mimeType: 'image/png', data: dummyB64 }
          ],
          input: {
            garment: 'Áo Ngũ Thân',
            background: 'Cố đô Huế'
          },
          heritage: { title: 'Áo Ngũ Thân', period: 'Thời Nguyễn' }
        }
      };
      window.openPhotoboothStudio('ootd', 0);
    });
    await page.locator('#photobooth-modal').waitFor({ state: 'visible' });

    // Personalize seal with 2 characters
    const sealInput = page.locator('#pb-seal-text');
    await sealInput.fill('AN');
    await sealInput.dispatchEvent('input');
    await page.waitForTimeout(200);

    // Click bottom-right corner preset
    await page.locator('#btn-seal-br').click();
    await page.waitForTimeout(200);

    // Verify draggable seal element is visible and interactive
    const draggableSeal = page.locator('#draggable-seal-stamp');
    assert.ok(await draggableSeal.isVisible(), 'Draggable seal is visible');
    assert.equal(await draggableSeal.innerText(), 'AN', 'Draggable seal reflects personalized monogram');

    // Drag the seal stamp
    const sealBox = await draggableSeal.boundingBox();
    if (sealBox) {
      await page.mouse.move(sealBox.x + sealBox.width / 2, sealBox.y + sealBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(sealBox.x - 60, sealBox.y - 80);
      await page.mouse.up();
      await page.waitForTimeout(200);
    }

    const photoboothScreenshotPath = path.join(artifactDir, 'fitting_room_photobooth_seal.png');
    await page.screenshot({ path: photoboothScreenshotPath, fullPage: false });
    console.log('Saved: fitting_room_photobooth_seal.png');

    assert.deepEqual(errors, [], 'No uncaught exceptions');
    console.log('SUCCESS: All 4 Pillars verified and documented with visual screenshots!');

  } finally {
    await browser.close();
    await new Promise(r => server.close(r));
  }
})().catch(e => {
  console.error(e);
  process.exitCode = 1;
});
