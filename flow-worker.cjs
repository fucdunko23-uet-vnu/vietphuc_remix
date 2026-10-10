const fs = require('node:fs');
const { chromium } = require('D:/n8n/node_modules/playwright-core');
const configPath = process.env.VIET_PHUC_CONFIG || 'D:/n8n/flow-automation/worker-config.json';
const pause = ms => new Promise(r => setTimeout(r, ms));
async function createImages(page, job, report = console.log) {
  page.setDefaultTimeout(30000);
  await page.keyboard.press('Escape');
  const home = page.getByRole('button', { name: 'Trang chủ', exact: true });
  if (await home.isVisible()) await home.click();
  await page.getByRole('button', { name: /Dự án mới|New project/ }).click();
  const settings = page.getByRole('button', { name: 'Điều kiện kích hoạt cài đặt', exact: true });
  await settings.waitFor();
  const welcome = page.getByRole('button', { name: 'Bắt đầu', exact: true });
  if (await welcome.isVisible()) await welcome.click();
  await settings.click();
  await page.getByRole('radio', { name: /Hình ảnh/ }).click();
  await page.getByRole('radio', { name: /3:4/ }).click();
  await page.getByRole('radio', { name: 'x1', exact: true }).click();
  await page.keyboard.press('Escape');
  if (!(await settings.innerText()).includes('Nano Banana')) throw new Error('Flow chưa ở chế độ tạo ảnh Nano Banana.');
  const title = page.getByLabel('Văn bản có thể chỉnh sửa', { exact: true });
  await title.fill('Việt phục Remix — ' + new Date().toLocaleString('vi-VN'));
  await title.press('Enter');
  const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[job.photo.mimeType];
  const filename = 'viet-phuc-' + job.id.slice(0, 10) + '.' + ext;
  const add = page.getByRole('button', { name: 'Thêm thành phần vào ô nhập câu lệnh', exact: true });
  await add.click();
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: /Tải nội dung nghe nhìn lên/ }).click();
  await (await chooser).setFiles({ name: filename, mimeType: job.photo.mimeType, buffer: Buffer.from(job.photo.data, 'base64') });
  const asset = page.getByRole('option', { name: new RegExp(filename.replace('.', '\\.')) });
  await asset.waitFor({ timeout: 90000 });
  await asset.click({ timeout: 90000 });
  const confirmIngredient = async () => {
    await pause(500);
    const confirm = page.getByRole('button', { name: 'Thêm vào câu lệnh', exact: true });
    if (await confirm.isVisible()) await confirm.click({ timeout: 90000 });
    await page.getByRole('button', { name: 'Thành phần', exact: true }).waitFor();
  };
  await confirmIngredient();
  // Upload cards appear asynchronously after the ingredient picker closes.
  // Wait for the reference tile and explicitly exclude uploads from results.
  await page.locator('flow-grid-tile-container').filter({ has: page.locator('img[data-media-id]') }).first().waitFor({ timeout: 90000 });
  const images = [];
  for (let i = 0; i < 2; i++) {
    if (!(await page.getByRole('button', { name: 'Thành phần', exact: true }).count())) {
      await add.click(); await asset.click();
      await confirmIngredient();
    }
    await page.locator('[contenteditable=true]').fill(job.prompts[i]);
    const before = await page.locator('img[data-media-id]').evaluateAll(es => es.map(e => e.getAttribute('data-media-id')));
    await page.getByRole('button', { name: 'Bắt đầu tạo', exact: true }).click();
    report('Đã gửi phương án ' + (i + 1) + '/2 tới Flow.');
    const start = Date.now(); let source;
    while (Date.now() - start < 180000) {
      await pause(3000);
      source = await page.locator('img[data-media-id]').evaluateAll((es, args) => es.filter(e => !args.old.includes(e.getAttribute('data-media-id')) && e.naturalWidth > 100 && !e.closest('flow-grid-tile-container')?.getAttribute('aria-label')?.startsWith('viet-phuc-')).map(e => e.src)[0], { old: before });
      if (source) break;
      const text = await page.locator('body').innerText();
      if (/unusual activity|verify you are human|không thể tạo|generation failed|something went wrong|vi phạm chính sách/i.test(text)) throw new Error('Flow yêu cầu kiểm tra hoặc không tạo được ảnh. Mở cửa sổ Flow để xem thông báo.');
    }
    if (!source) throw new Error('Flow chưa trả ảnh trong 3 phút. Không tự gửi lại lượt tạo.');
    const response = await page.request.get(source);
    if (!response.ok()) throw new Error('Không tải được ảnh kết quả từ Flow.');
    const bytes = await response.body();
    const mimeType = response.headers()['content-type']?.split(';')[0];
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(mimeType)) throw new Error('Flow trả định dạng ảnh không hỗ trợ.');
    images.push({ mimeType, data: bytes.toString('base64') });
    report('Đã nhận ảnh ' + (i + 1) + '/2.');
  }
  return images;
}
async function main() {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const base = new URL(config.appUrl);
  if (base.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(base.hostname)) throw new Error('Ứng dụng cần HTTPS.');
  const post = async (route, body) => {
    const r = await fetch(new URL(route, base), { method: 'POST', headers: { 'Content-Type': 'application/json', authorization: 'Bearer ' + config.workerToken }, body: JSON.stringify(body), signal: AbortSignal.timeout(30000) });
    if (!r.ok) throw new Error('Kết nối ứng dụng HTTP ' + r.status);
    return r.json();
  };
  console.log('Bộ kết nối Flow đang chạy. Giữ Chrome đăng nhập Flow.');
  // Reuse the authenticated CDP session. Reattaching every poll repeatedly
  // initializes all Studio/Flow tabs and can interfere with file chooser events.
  let browser;
  while (true) {
    try {
      if (!browser?.isConnected()) browser = await chromium.connectOverCDP(config.cdpUrl || 'http://127.0.0.1:9223', { timeout: 15000 });
      const page = browser.contexts()[0].pages().find(p => p.url().startsWith('https://flow.google.com/'));
      if (!page || !(await page.getByRole('button', { name: /Trang chủ|Dự án mới|New project/ }).count())) throw new Error('Đăng nhập và mở tab Flow trước khi chạy.');
      if (await page.getByText(/Không thể kết nối với dịch vụ reCAPTCHA/).first().isVisible()) throw new Error('Google Flow chưa kết nối được reCAPTCHA. Mở tab Flow và tải lại trang.');
      const { job } = await post('/api/worker/claim', { ready: true, detail: '' });
      if (job) {
        // Heartbeats do not claim another job while this lease is running.
        const heartbeat = setInterval(() => post('/api/worker/claim', { ready: true, busy: true }).catch(() => {}), 15000);
        let result;
        try { result = { success: true, images: await createImages(page, job) }; }
        catch (error) { result = { success: false, message: 'Bộ kết nối Flow: ' + error.message.split('\n')[0] }; }
        finally { clearInterval(heartbeat); }
        await post('/api/worker/complete', { id: job.id, lease: job.lease, ...result });
        console.log(result.success ? 'Hoàn tất hai ảnh thử đồ.' : result.message);
      }
    } catch (error) {
      console.log(error.message.split('\n')[0]);
      const detail = /reCAPTCHA|Đăng nhập và mở tab Flow/.test(error.message) ? error.message.split('\n')[0] : 'Bộ kết nối Flow đang chờ phiên Chrome hoặc kết nối ứng dụng.';
      await post('/api/worker/claim', { ready: false, detail }).catch(() => {});
      if (browser && !browser.isConnected()) browser = undefined;
    }
    await pause(4000);
  }
}
if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { createImages };
