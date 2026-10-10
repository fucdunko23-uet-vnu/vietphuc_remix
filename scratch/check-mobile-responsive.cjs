const assert = require('node:assert/strict');
const { chromium } = require('D:/n8n/node_modules/playwright-core');
const { createApp } = require('../ai-studio-app/server.cjs');
(async () => {
 const server = createApp(); await new Promise(r => server.listen(0, '127.0.0.1', r));
 const base = process.argv[2] || `http://127.0.0.1:${server.address().port}`;
 const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
 try {
  const page = await browser.newPage({ hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const [width, height] of [[320,844],[390,844],[430,932],[844,390]]) {
   await page.setViewportSize({ width, height });
   await page.goto(base + '/?dia-diem=laocai#thu-do');
   await page.locator('#menu-toggle').click();
   await page.locator('#site-nav [href="#huong-dan"]').click();
   await page.waitForURL('**#huong-dan');
   await page.locator('#menu-toggle').click();
   await page.locator('#site-nav [href="#thu-do"]').click();
   await page.waitForURL('**#thu-do');
   for (const step of [1,2,3,4]) {
    await page.evaluate(step => window.goToStep(step), step);
    await page.waitForTimeout(450);
    const layout = await page.evaluate(() => ({
     overflow: document.documentElement.scrollWidth > innerWidth,
     inputSizes: [...document.querySelectorAll('[data-page="thu-do"] select,[data-page="thu-do"] textarea')].filter(e => e.checkVisibility()).map(e => parseFloat(getComputedStyle(e).fontSize)),
     previewPosition: getComputedStyle(document.querySelector('.workspace-preview-col')).position
    }));
    assert.equal(layout.overflow, false); assert(layout.inputSizes.every(n => n >= 16));
    assert.equal(layout.previewPosition, 'static');
   }
   await page.screenshot({path:`output/mobile-steps-${width}.png`});
   await page.goto(base + '/#ban-do');
   await page.waitForFunction(() => typeof window.zoomToRegion === 'function');
   await page.evaluate(() => window.zoomToRegion('tay-bac', 'laocai'));
   await page.locator('#infographic-callout-deck').waitFor({state:'visible'});
   const map = await page.evaluate(() => {
    const deck = document.querySelector('#infographic-callout-deck').getBoundingClientRect();
    const back = document.querySelector('#btn-back-overview').getBoundingClientRect();
    const menu = document.querySelector('.map-site-menu').getBoundingClientRect();
    return { deck: {x:deck.x,y:deck.y,right:deck.right,bottom:deck.bottom,height:deck.height}, backRight:back.right,menuLeft:menu.left,
     bodyHeight:document.querySelector('.callout-boxes-container').clientHeight, overflow:document.documentElement.scrollWidth > innerWidth };
   });
   console.log('Map layout:', width, JSON.stringify(map));
   await page.screenshot({path:`output/mobile-map-${width}.png`});
   assert.equal(map.overflow, false); assert(map.deck.x >= 0 && map.deck.right <= width + 1 && map.deck.bottom <= height + 1);
   assert(map.bodyHeight > 100); assert(map.backRight <= map.menuLeft);
   await page.screenshot({path:`output/mobile-map-${width}.png`});
   await page.locator('#callout-close-btn').click();
   await page.locator('#btn-back-overview').click();
   console.log('PASS mobile navigation, four steps, zoomed map:', width, height);
  }
  assert.deepEqual(errors, []);
 } finally { await browser.close(); await new Promise(r => server.close(r)); }
})().catch(e => { console.error(e); process.exitCode = 1; });
