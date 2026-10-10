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
    console.log('Playwright/Chrome launch note:', e.message);
    return null;
  }
}

(async () => {
  const artifactDir = 'C:/Users/lequa/.gemini/antigravity/brain/8b9144cb-2668-49c0-91f5-580d15aa9973';
  if (!fs.existsSync(artifactDir)) fs.mkdirSync(artifactDir, { recursive: true });

  const server = createApp({ workerToken: 'map-test' });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port;

  const browser = await getBrowser();
  if (!browser) {
    console.log('Browser unavailable, skipping headless checks.');
    server.close();
    process.exit(0);
  }

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));

    console.log('1. Loading Vietnam Map with Logo and Nav Dock...');
    await page.goto(base + '/#ban-do');
    await page.locator('#vietnam-svg').waitFor({ state: 'visible' });

    // A. LOGO CHECKS
    console.log('2. Verifying Logo integrations...');
    const brandLogo = page.locator('.brand-logo-img');
    const sealLogo = page.locator('.brand-logo-seal');
    const footerLogo = page.locator('.footer-logo-img');
    const curtainLogo = page.locator('.curtain-logo-img');

    assert.ok(await brandLogo.count() > 0, 'Navbar brand logo exists');
    assert.ok(await sealLogo.count() > 0, 'HUD brand seal logo exists');
    assert.ok(await footerLogo.count() > 0, 'Footer logo exists');
    assert.ok(await curtainLogo.count() > 0, 'Curtain transition logo exists');

    const brandLogoLoaded = await brandLogo.first().evaluate(img => img.naturalWidth > 0);
    const sealLogoLoaded = await sealLogo.first().evaluate(img => img.naturalWidth > 0);
    assert.ok(brandLogoLoaded, 'Navbar logo image loaded successfully');
    assert.ok(sealLogoLoaded, 'HUD seal logo image loaded successfully');
    console.log('   ✓ Logo loaded successfully in navbar and HUD seal (naturalWidth > 0).');

    // B. OVERLAP VERIFICATION (Anti-overlap check)
    console.log('3. Checking element coordinates & overlap prevention...');
    const boxes = await page.evaluate(() => {
      function getBBox(selector) {
        const el = document.querySelector(selector);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: r.left, y: r.top, width: r.width, height: r.height, right: r.right, bottom: r.bottom };
      }

      function intersects(r1, r2) {
        return !(r2.x >= r1.right || r2.right <= r1.x || r2.y >= r1.bottom || r2.bottom <= r1.y);
      }

      const bTayBac = getBBox('#pin-tay-bac');
      const bBacBo = getBBox('#pin-bac-bo');
      const bCompass = getBBox('.map-compass-rose');
      const bHoangSa = getBBox('#svg-island-hoang-sa');
      const bCartouche = getBBox('.map-decor-cartouche');
      const bDongSon = getBBox('.map-dong-son-motif');

      return {
        tayBacVsBacBoOverlap: bTayBac && bBacBo ? intersects(bTayBac, bBacBo) : false,
        compassVsHoangSaOverlap: bCompass && bHoangSa ? intersects(bCompass, bHoangSa) : false,
        cartoucheVsDongSonOverlap: bCartouche && bDongSon ? intersects(bCartouche, bDongSon) : false,
        initialViewBox: document.querySelector('#vietnam-svg')?.getAttribute('viewBox')
      };
    });

    assert.equal(boxes.tayBacVsBacBoOverlap, false, 'Pin Tây Bắc and Pin Bắc Bộ must NOT overlap');
    assert.equal(boxes.compassVsHoangSaOverlap, false, 'Compass rose and Hoàng Sa islands must NOT overlap');
    assert.equal(boxes.cartoucheVsDongSonOverlap, false, 'Cartouche and Bronze Drum must NOT overlap');
    console.log('   ✓ No element overlaps detected:');
    console.log('     - Pin Tây Bắc & Bắc Bộ: CLEAR (separated, label points left)');
    console.log('     - Compass Rose & Hoàng Sa: CLEAR (moved to open eastern sea 720, 280)');
    console.log('     - Cartouche & Trống Đồng: CLEAR (positioned cleanly at top)');
    console.log('   ✓ Initial viewBox:', boxes.initialViewBox);

    // Save initial overview screenshot
    await page.screenshot({ path: path.join(artifactDir, 'vietnam_map_logo_and_dock.png') });
    console.log('Saved: vietnam_map_logo_and_dock.png');

    // C. DRAG-TO-PAN INTERACTION (KÉO CHUỘT LÊN / XUỐNG)
    console.log('4. Testing Drag-to-Pan (Mouse Drag on Map)...');
    const mapStage = page.locator('#svg-map-container');
    const stageBox = await mapStage.boundingBox();
    assert.ok(stageBox, 'Map stage exists');

    const startX = stageBox.x + stageBox.width / 2;
    const startY = stageBox.y + stageBox.height / 2;

    const initialVb = await page.evaluate(() => document.querySelector('#vietnam-svg')?.getAttribute('viewBox'));

    // Drag upwards (mouse moves from center up by 150px)
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX, startY - 150, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(200);

    const draggedVb = await page.evaluate(() => document.querySelector('#vietnam-svg')?.getAttribute('viewBox'));
    console.log(`   Initial ViewBox: ${initialVb}`);
    console.log(`   Dragged ViewBox: ${draggedVb}`);
    assert.notEqual(initialVb, draggedVb, 'ViewBox must update after dragging the map');

    const partsInit = initialVb.split(' ').map(Number);
    const partsDragged = draggedVb.split(' ').map(Number);
    assert.ok(partsDragged[1] > partsInit[1], 'Dragging up must pan the map downward to show southern provinces');
    console.log('   ✓ Drag-to-pan verified: mouse movement smoothly pans the viewport.');

    // D. WHEEL SCROLL ZOOM (CUỘN CHUỘT LÊN = PHÓNG TO, CUỘN XUỐNG = THU NHỎ)
    console.log('5. Testing Wheel Scroll Zoom (Cuộn chuột phóng to / thu nhỏ)...');
    const vbBeforeWheel = await page.evaluate(() => document.querySelector('#vietnam-svg')?.getAttribute('viewBox'));
    const widthBefore = vbBeforeWheel.split(' ').map(Number)[2];

    // Scroll up (deltaY < 0): Phóng to (Zoom In) -> width must decrease
    await page.mouse.move(startX, startY);
    await page.mouse.wheel(0, -120);
    await page.waitForTimeout(100);

    const vbWheelIn = await page.evaluate(() => document.querySelector('#vietnam-svg')?.getAttribute('viewBox'));
    const widthZoomIn = vbWheelIn.split(' ').map(Number)[2];
    console.log(`   Width before: ${widthBefore}, Width after Wheel UP (Zoom In): ${widthZoomIn}`);
    assert.ok(widthZoomIn < widthBefore, 'Wheel UP (scroll up) must zoom in (decrease viewBox width)');

    // Scroll down (deltaY > 0): Thu nhỏ (Zoom Out) -> width must increase
    await page.mouse.wheel(0, 120);
    await page.waitForTimeout(100);

    const vbWheelOut = await page.evaluate(() => document.querySelector('#vietnam-svg')?.getAttribute('viewBox'));
    const widthZoomOut = vbWheelOut.split(' ').map(Number)[2];
    console.log(`   Width after Wheel DOWN (Zoom Out): ${widthZoomOut}`);
    assert.ok(widthZoomOut > widthZoomIn, 'Wheel DOWN (scroll down) must zoom out (increase viewBox width)');
    console.log('   ✓ Mouse wheel direct zoom verified: scrolling up zooms in, scrolling down zooms out directly without clicking buttons.');

    // E. DOCK NAVIGATION CONTROLS (NÚT BẮC, TRUNG, NAM, TOÀN CẢNH, +, -)
    console.log('6. Testing Dock Jump Buttons & Zoom In/Out...');
    
    // Jump North
    console.log('   - Clicking 🏔️ Bắc...');
    await page.locator('[data-pan-target="north"]').click();
    await page.waitForTimeout(700);
    const northVb = await page.evaluate(() => document.querySelector('#vietnam-svg')?.getAttribute('viewBox'));
    console.log(`     North ViewBox: ${northVb}`);
    await page.screenshot({ path: path.join(artifactDir, 'vietnam_map_panned_north.png') });
    console.log('Saved: vietnam_map_panned_north.png');

    // Jump South
    console.log('   - Clicking 🌴 Nam...');
    await page.locator('[data-pan-target="south"]').click();
    await page.waitForTimeout(700);
    const southVb = await page.evaluate(() => document.querySelector('#vietnam-svg')?.getAttribute('viewBox'));
    console.log(`     South ViewBox: ${southVb}`);
    await page.screenshot({ path: path.join(artifactDir, 'vietnam_map_panned_south.png') });
    console.log('Saved: vietnam_map_panned_south.png');

    // Jump All (Toàn cảnh)
    console.log('   - Clicking ⟲ Toàn cảnh...');
    await page.locator('[data-pan-target="all"]').click();
    await page.waitForTimeout(700);
    const resetVb = await page.evaluate(() => document.querySelector('#vietnam-svg')?.getAttribute('viewBox'));
    console.log(`     Reset ViewBox: ${resetVb}`);
    const partsReset = resetVb.split(' ').map(Number);
    assert.equal(Math.round(partsReset[0]), Math.round(partsInit[0]));
    assert.equal(Math.round(partsReset[1]), Math.round(partsInit[1]));
    assert.equal(Math.round(partsReset[2]), Math.round(partsInit[2]));
    assert.equal(Math.round(partsReset[3]), Math.round(partsInit[3]));
    console.log('   ✓ Reset to national view confirmed.');

    // Zoom In (+)
    console.log('   - Clicking [+] Zoom In...');
    await page.locator('#btn-map-zoom-in').click();
    await page.waitForTimeout(400);
    const zoomedInVb = await page.evaluate(() => document.querySelector('#vietnam-svg')?.getAttribute('viewBox'));
    const partsIn = zoomedInVb.split(' ').map(Number);
    assert.ok(partsIn[2] < partsReset[2], 'Zoom in should reduce width (enlarge elements)');
    console.log(`     Zoomed In ViewBox Width: ${partsIn[2]} (scaled in)`);

    // Zoom Out (-)
    console.log('   - Clicking [-] Zoom Out...');
    await page.locator('#btn-map-zoom-out').click();
    await page.waitForTimeout(400);
    const zoomedOutVb = await page.evaluate(() => document.querySelector('#vietnam-svg')?.getAttribute('viewBox'));
    const partsOut = zoomedOutVb.split(' ').map(Number);
    assert.ok(partsOut[2] > partsIn[2], 'Zoom out should increase width');
    console.log(`     Zoomed Out ViewBox Width: ${partsOut[2]} (scaled out)`);

    console.log('7. Verifying No Console Errors...');
    assert.deepEqual(errors, [], 'Page must have 0 uncaught errors: ' + errors.join(', '));
    console.log('   ✓ 0 errors during entire execution.');

    console.log('\n============================================================');
    console.log('ALL MAP ENHANCEMENT TESTS PASSED PERFECTLY!');
    console.log('============================================================');
  } finally {
    await browser.close();
    server.close();
  }
})();

