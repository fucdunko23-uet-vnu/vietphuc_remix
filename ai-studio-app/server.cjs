const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { gzip } = require('node:zlib');
const { promisify } = require('node:util');
const compress = promisify(gzip);
const { randomBytes, timingSafeEqual, createHash } = require('node:crypto');
const { createGoogleCaption } = require('./caption.cjs');
const { prepareSelections, preparePhoto, renderOutfitScene, renderDestinationCard } = require('./styling.cjs');
const { createGoogleModerator, assertSelectionText, GuardrailError } = require('./moderation.cjs');
const id = () => randomBytes(24).toString('base64url');
const imageTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const acceptsGzip = req => /(?:^|,)\s*gzip\s*(?:;\s*q=(?!0(?:\.0*)?\s*(?:,|$))\d*(?:\.\d+)?)?\s*(?:,|$)/i.test(req.headers['accept-encoding'] || '');
const equals = (a, b) => {
  const first = Buffer.from(String(a || '')), second = Buffer.from(String(b || ''));
  return first.length > 0 && first.length === second.length && timingSafeEqual(first, second);
};
function createApp({ workerToken = process.env.FLOW_WORKER_TOKEN || '', clock = Date.now, moderate = createGoogleModerator(), caption = createGoogleCaption() } = {}) {
  const assets = new Map();
  const jobs = new Map();
  const captionSessions = new Map();
  let captioning = 0;
  let reviewing = 0;
  let worker = { ready: false, seen: 0, detail: 'Chưa kết nối phiên Flow.' };
  const available = () => Boolean(workerToken && worker.ready && clock() - worker.seen < 45000);
  const collect = () => {
    for (const [key, session] of captionSessions) if (clock() - session.created > 20 * 60000) captionSessions.delete(key);
    for (const [key, job] of jobs) {
      if (clock() - job.created > 20 * 60000) jobs.delete(key);
      else if (['queued', 'running'].includes(job.status) && clock() - job.created > 8 * 60000) {
        job.status = 'failed'; job.photo = null; job.prompts = null;
        job.message = 'Flow chưa trả kết quả trong thời gian chờ. Lượt tạo có thể đã được gửi; hệ thống không tự tạo lại để tránh dùng thêm tín dụng.';
      }
    }
  };
  const server = http.createServer(async (req, res) => {
    collect();
    const url = new URL(req.url, 'http://localhost');
    const send = (status, value) => {
      const content = Buffer.from(JSON.stringify(value));
      const finish = (payload, packed = false) => {
        if (res.destroyed || res.writableEnded) return;
        res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Vary': 'Accept-Encoding', 'Content-Length': payload.length, ...(packed ? { 'Content-Encoding': 'gzip' } : {}) });
        res.end(payload);
      };
      // Compress transport bytes on zlib's worker pool; original photo bytes stay intact.
      if (content.length >= 32768 && acceptsGzip(req)) return compress(content).then(packed => finish(packed, true), () => finish(content));
      finish(content);
    };
    const body = async (limit = 8 * 1024 * 1024) => {
      if (!String(req.headers['content-type']).startsWith('application/json')) throw Object.assign(new Error('Yêu cầu phải là JSON.'), { status: 415 });
      let size = 0; const chunks = [];
      for await (const chunk of req) {
        size += chunk.length;
        if (size > limit) throw Object.assign(new Error('Ảnh hoặc yêu cầu quá lớn.'), { status: 413 });
        chunks.push(chunk);
      }
      try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
      catch { throw Object.assign(new Error('Dữ liệu gửi lên không hợp lệ.'), { status: 400 }); }
    };
    try {
      if (url.pathname === '/healthz') return send(200, { status: 'ok' });
      if (url.pathname === '/api/status' && req.method === 'GET') return send(200, {
        provider: 'Google Flow', ready: available() && moderate.configured !== false,
        message: moderate.configured === false ? 'Chưa cấu hình Google để kiểm tra ảnh. Bạn vẫn có thể xem trước phối đồ.' : available() ? 'Flow đã kết nối — sẵn sàng thử đồ.' : worker.detail || 'Chưa kết nối phiên Flow.',
      });
      if (url.pathname.startsWith('/api/worker/')) {
        if (!workerToken || !equals(req.headers.authorization, 'Bearer ' + workerToken)) return send(401, { error: 'Worker authentication required.' });
        if (url.pathname === '/api/worker/claim' && req.method === 'POST') {
          const state = await body(10000);
          worker = { seen: clock(), ready: state.ready === true, detail: String(state.detail || 'Flow chưa sẵn sàng.').slice(0, 200) };
          if (!worker.ready) return send(200, { job: null });
          if (state.busy === true) return send(200, { job: null });
          if ([...jobs.values()].some(j => j.status === 'running')) return send(200, { job: null });
          const job = [...jobs.values()].find(j => j.status === 'queued');
          if (!job) return send(200, { job: null });
          job.status = 'running'; job.lease = id();
          return send(200, { job: { id: job.id, lease: job.lease, photo: job.photo, prompts: job.prompts } });
        }
        if (url.pathname === '/api/worker/complete' && req.method === 'POST') {
          const data = await body(40 * 1024 * 1024);
          const job = jobs.get(data.id);
          if (!job || job.status !== 'running' || !equals(data.lease, job.lease)) return send(409, { error: 'Job is expired or no longer owned by this worker.' });
          const images = Array.isArray(data.images) ? data.images.slice(0, 2) : [];
          const valid = images.length === 2 && images.every(image => imageTypes.has(image.mimeType) && typeof image.data === 'string' && image.data.length <= 18 * 1024 * 1024 && /^[A-Za-z0-9+/]+={0,2}$/.test(image.data));
          if (data.success === true && !valid) return send(400, { error: 'Expected exactly two valid image payloads.' });
          job.status = data.success === true ? 'succeeded' : 'failed';
          job.images = valid && data.success === true ? images : [];
          job.message = data.success === true ? 'Hai ảnh thử đồ đã sẵn sàng.' : String(data.message || 'Flow chưa tạo được ảnh.').slice(0, 300);
          job.photo = null; job.prompts = null; job.lease = null;
          return send(200, { ok: true });
        }
        return send(404, { error: 'Unknown worker route.' });
      }
      if (url.pathname === '/api/preview' && req.method === 'POST') {
        const raw = (await body(10000)).selection;
        assertSelectionText(raw || {});
        const prep = prepareSelections({ first: () => ({ json: raw || {} }) })[0].json;
        return send(200, { input: prep.input, heritage: prep.heritage, looks: prep.sampleResult.looks.map((look, i) => ({ ...look, svg: prep.input.destination ? renderDestinationCard(prep.input, look, i) : renderOutfitScene({ garment: prep.input.garment, background: prep.input.background, avatar: 'Tóc dài', colors: look.colors.map(c => c.hex), accessory: look.accessory, shoe: look.shoe, sceneId: 'preview-' + i }) })) });
      }
      if (url.pathname === '/api/jobs' && req.method === 'POST') {
        if (!available()) return send(503, { error: 'Chưa kết nối Flow. Chủ ứng dụng cần đăng nhập Flow và bật bộ điều khiển trình duyệt.' });
        if (moderate.configured === false) throw new GuardrailError('MODERATION_UNAVAILABLE', 503);
        if (reviewing + [...jobs.values()].filter(j => ['queued', 'running'].includes(j.status)).length >= 3) return send(429, { error: 'Đang xử lý các ảnh trước. Vui lòng thử lại sau.' });
        reviewing++;
        try {
          const data = await body();
          assertSelectionText(data.selection || {});
          if (!imageTypes.has(data.photo?.mimeType) || typeof data.photo?.data !== 'string' || !/^[A-Za-z0-9+/]+={0,2}$/.test(data.photo.data)) return send(400, { error: 'Chọn ảnh JPG, PNG hoặc WebP hợp lệ.' });
          const buffer = Buffer.from(data.photo.data, 'base64');
          const prepared = await preparePhoto.call({ helpers: { getBinaryDataBuffer: async () => buffer } }, { first: () => ({ json: data.selection || {}, binary: { photo: {} } }) });
          if (!prepared[0].json.valid) return send(400, { error: prepared[0].json.userError });
          const first = prepared[0].json;
          const review = await moderate({ photo: first.photo, input: first.input, garmentGuidance: first.heritage.keep });
          if (review?.approved !== true) throw new GuardrailError('MODERATION_UNAVAILABLE', 503);
          if (req.aborted || res.destroyed) return;
          if (!available()) return send(503, { error: 'Phiên Flow vừa mất kết nối. Ảnh chưa được gửi sang Flow; vui lòng thử lại sau.' });
          const job = { id: id(), token: id(), created: clock(), status: 'queued', photo: first.photo, prompts: prepared.map(i => i.json.aiBody.contents[0].parts[0].text), looks: prepared.map(i => i.json.look), heritage: first.heritage, input: first.input, photoType: first.photoType };
          jobs.set(job.id, job);
          return send(202, { id: job.id, token: job.token, status: job.status });
        } finally { reviewing--; }
      }
      const captionMatch = url.pathname.match(/^\/api\/jobs\/([A-Za-z0-9_-]+)\/caption$/);
      if (captionMatch && req.method === 'POST') {
        const session = captionSessions.get(captionMatch[1]) || jobs.get(captionMatch[1]);
        if (!session || session.status !== 'succeeded' || !equals(req.headers.authorization, 'Bearer ' + session.token)) return send(404, { error: 'Lượt thử đồ đã hết hạn. Bạn vẫn có thể tải ảnh.' });
        const data = await body(2 * 1024 * 1024);
        if (data.photo?.mimeType !== 'image/jpeg' || typeof data.photo.data !== 'string' || !/^[A-Za-z0-9+/]+={0,2}$/.test(data.photo.data) || !Buffer.from(data.photo.data, 'base64').subarray(0, 3).equals(Buffer.from([255,216,255]))) return send(400, { error: 'Ảnh photobooth chưa hợp lệ.' });
        const key = createHash('sha256').update(data.photo.data).digest('hex');
        session.captions ||= new Map();
        if (session.captions.has(key)) return send(200, await session.captions.get(key));
        if (captioning >= 2 || session.captions.size >= 6) return send(429, { error: 'Xin chữ đang bận. Hãy dùng câu hiện có hoặc thử lại sau.' });
        captioning++;
        const pending = Promise.resolve().then(() => caption({ photo: data.photo, input: session.input }));
        session.captions.set(key, pending);
        try { return send(200, await pending); }
        catch { session.captions.delete(key); return send(503, { error: 'Chưa xin được chữ. Bạn vẫn có thể tải ảnh.' }); }
        finally { captioning--; }
      }
      const match = url.pathname.match(/^\/api\/jobs\/([A-Za-z0-9_-]+)$/);
      if (match) {
        const job = jobs.get(match[1]);
        if (!job || !equals(req.headers.authorization, 'Bearer ' + job.token)) return send(404, { error: 'Không tìm thấy lượt thử đồ hoặc lượt này đã hết hạn.' });
        if (req.method === 'DELETE') {
          if (job.status === 'succeeded') captionSessions.set(job.id, { token: job.token, status: job.status, created: job.created, input: job.input, captions: job.captions });
          jobs.delete(job.id); return send(200, { ok: true });
        }
        if (req.method === 'GET') return send(200, { status: job.status, message: job.message, images: job.images, looks: job.status === 'succeeded' ? job.looks : undefined, heritage: job.heritage, input: job.input, photoType: job.photoType });
      }
      if (req.method === 'GET' || req.method === 'HEAD') {
        if (url.pathname === '/favicon.ico') {
          res.writeHead(204);
          return res.end();
        }
        const files = { '/logo.webp': ['logo.webp', 'image/webp'], '/guardrails.js': ['guardrails.js', 'application/javascript; charset=utf-8'], '/garment-preview.js': ['garment-preview.js', 'application/javascript; charset=utf-8'], '/logo.png': ['logo.png', 'image/png'], '/destinations.js': ['destinations.js', 'application/javascript; charset=utf-8'], '/map.js': ['map.js', 'application/javascript; charset=utf-8'], '/site.js': ['site.js', 'application/javascript; charset=utf-8'], '/site.css': ['site.css', 'text/css; charset=utf-8'], '/presets.json': ['presets.json', 'application/json; charset=utf-8'], '/': ['index.html', 'text/html; charset=utf-8'], '/app.js': ['app.js', 'application/javascript; charset=utf-8'], '/style.css': ['style.css', 'text/css; charset=utf-8'] };
        files['/music.js'] = ['music.js', 'application/javascript; charset=utf-8'];
        const file = files[url.pathname];
        const collectionFile = /^\/collection-art\/(?:heritage-(?:[6-9]|1[0-7])|original-[0-9])\.svg$/.test(url.pathname) ? [url.pathname.slice(1), 'image/svg+xml; charset=utf-8'] : null;
        const audioFile = /^\/audio\/(?:overview|bac-bo|tay-bac|hue-trung-bo|tay-nguyen|nam-bo|thu-do|trang-chu|kham-pha|huong-dan|gioi-thieu)\.mp3$/.test(url.pathname) ? [url.pathname.slice(1), 'audio/mpeg'] : null;
        const staticFile = file || collectionFile || audioFile;
        if (staticFile) {
          const location = path.join(__dirname, 'public', staticFile[0]);
          const compressible = !audioFile && (!staticFile[1].startsWith('image/') || staticFile[1].startsWith('image/svg+xml'));
          const stat = await fs.promises.stat(location);
          const version = stat.mtimeMs + ':' + stat.size;
          let asset = assets.get(location);
          if (!asset || asset.version !== version) {
            asset = { version, data: fs.promises.readFile(location) };
            asset.packed = asset.data.then(data => compressible ? compress(data) : data);
            assets.set(location, asset);
          }
          const packed = compressible && acceptsGzip(req);
          const headers = { 'Content-Type': staticFile[1], 'Cache-Control': 'public, max-age=0, must-revalidate', 'Vary': 'Accept-Encoding', 'ETag': 'W/"' + version + '"', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; script-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'self' https://aistudio.google.com https://*.googleusercontent.com" };
          if (req.headers['if-none-match'] === headers.ETag) { res.writeHead(304, headers); return res.end(); }
          const content = await (packed ? asset.packed : asset.data);
          if (audioFile) {
            headers['Accept-Ranges'] = 'bytes';
            if (req.method === 'GET' && req.headers.range && (!req.headers['if-range'] || req.headers['if-range'] === headers.ETag)) {
              const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
              const start = range?.[1] ? Number(range[1]) : Math.max(0, content.length - Number(range?.[2]));
              const end = range?.[1] && range[2] ? Math.min(Number(range[2]), content.length - 1) : content.length - 1;
              if (!range || (!range[1] && !range[2]) || !Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= content.length) {
                res.writeHead(416, { ...headers, 'Content-Range': 'bytes */' + content.length }); return res.end();
              }
              res.writeHead(206, { ...headers, 'Content-Range': `bytes ${start}-${end}/${content.length}`, 'Content-Length': end - start + 1 });
              return res.end(content.subarray(start, end + 1));
            }
          }
          if (packed) headers['Content-Encoding'] = 'gzip';
          headers['Content-Length'] = content.length;
          res.writeHead(200, headers);
          if (req.method === 'HEAD') return res.end();
          return res.end(content);
        }
      }
      send(404, { error: 'Not found.' });
    } catch (error) {
      send(error.status || 400, { error: error.status ? error.message : 'Dữ liệu chưa hợp lệ. Hãy kiểm tra lựa chọn và ảnh tải lên.', ...(error instanceof GuardrailError ? { code: error.code } : {}) });
    }
  });
  return server;
}
if (require.main === module) {
  const server = createApp();
  server.listen(Number(process.env.PORT || 3000), process.env.HOST || '0.0.0.0', () => console.log('Viet phuc Remix listening on port ' + (process.env.PORT || 3000)));
}
module.exports = { createApp };
