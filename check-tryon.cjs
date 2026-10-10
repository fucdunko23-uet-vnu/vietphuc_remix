const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const wf = JSON.parse(fs.readFileSync(path.join(__dirname, 'Viet-phuc-Thu-do.n8n.json'), 'utf8'));
const sample = { ...JSON.parse(fs.readFileSync(path.join(__dirname, 'demo-input.json'), 'utf8')), 'Kiểu ảnh': 'Ảnh toàn thân' };
const prepareCode = wf.nodes.find(n => n.name === 'Chuẩn bị ảnh và trang phục').parameters.jsCode;
const renderCode = wf.nodes.find(n => n.name === 'Tạo trang ảnh thử đồ').parameters.jsCode;
const png = Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), Buffer.alloc(100)]);
const prepare = (raw = sample, buffer = png, binary = { photo: {} }) => vm.runInNewContext(`(async function(){${prepareCode}\n}).call({helpers})`, {
  $input: { first: () => ({ json: raw, binary }) }, helpers: { getBinaryDataBuffer: async () => buffer }, Buffer,
}, { timeout: 2000 });
const render = (prepared, incoming) => vm.runInNewContext(`(function(){${renderCode}\n})()`, {
  $: () => ({ all: () => prepared }), $input: { all: () => incoming },
}, { timeout: 2000 })[0].json;
(async () => {
  const prepared = await prepare();
  assert.equal(prepared.length, 2);
  assert.ok(prepared.every(i => i.json.valid));
  assert.equal(prepared[0].json.aiBody.contents[0].parts[1].inlineData.data, png.toString('base64'));
  assert.notEqual(prepared[0].json.look.colors[0].hex, prepared[1].json.look.colors[0].hex);
  const portrait = await prepare({ ...sample, 'Kiểu ảnh': 'Ảnh khuôn mặt' });
  assert.match(portrait[0].json.aiBody.contents[0].parts[0].text, /not a reconstruction/);
  for (const p of [await prepare(sample, png, {}), await prepare(sample, png, { a: {}, b: {} }), await prepare(sample, Buffer.alloc(6 * 1024 * 1024)), await prepare(sample, Buffer.from('<svg>not a photo</svg>')), await prepare({ ...sample, 'Kiểu ảnh': 'bad' })]) assert.equal(p[0].json.valid, false);
  const reply = { json: { candidates: [{ finishReason: 'STOP', content: { parts: [{ inlineData: { mimeType: 'image/png', data: png.toString('base64') } }] } }] } };
  const success = render(prepared, [reply, reply]);
  assert.equal(success.imageCount, 2); assert.equal(success.status, 'success');
  assert.equal((success.html.match(/class="tryon-image"/g) || []).length, 2);
  assert.equal((success.html.match(/class="download"/g) || []).length, 2);
  const partial = render(prepared, [reply, { json: { error: { code: 429 } } }]);
  assert.equal(partial.imageCount, 1); assert.equal(partial.status, 'partial'); assert.match(partial.html, /hạn mức/);
  const blocked = render(prepared, [{ json: { candidates: [{ finishReason: 'SAFETY' }] } }, { json: {} }]);
  assert.equal(blocked.imageCount, 0); assert.equal(blocked.status, 'image-generation-failed');
  const bad = await prepare(sample, Buffer.from('not image'));
  assert.equal(render(bad, bad).status, 'invalid-upload');
  assert.equal(wf.settings.saveDataSuccessExecution, 'none');
  assert.equal(wf.settings.saveDataErrorExecution, 'none');
  assert.ok(!wf.nodes.some(n => n.credentials));
  console.log('PASS photo workflow: original bytes forwarded, two distinct outfits, portrait/full-body prompts, invalid/oversized uploads, successful/partial/refused image outputs, download links and private execution settings.');
})().catch(error => { console.error(error); process.exitCode = 1; });
