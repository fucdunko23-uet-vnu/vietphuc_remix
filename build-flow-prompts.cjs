// Prepare an offline handoff to Google Flow. This does not call an API or use credits.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const directory = 'D:/n8n/workflows/Viet-phuc-Flow';
fs.mkdirSync(directory, { recursive: true });
const workflow = JSON.parse(fs.readFileSync(path.join(__dirname, 'Viet-phuc-Thu-do.n8n.json'), 'utf8'));
const code = workflow.nodes.find(n => n.name === 'Chuẩn bị ảnh và trang phục').parameters.jsCode;
const sample = { ...JSON.parse(fs.readFileSync(path.join(__dirname, 'demo-input.json'), 'utf8')), 'Kiểu ảnh': 'Ảnh toàn thân' };
const fixture = fs.readFileSync(path.join(__dirname, 'test-assets', 'anh-minh-hoa-kiem-thu.png'));
(async () => {
  const prepared = await vm.runInNewContext(`(async function(){${code}\n}).call({helpers})`, {
    $input: { first: () => ({ json: sample, binary: { photo: {} } }) },
    helpers: { getBinaryDataBuffer: async () => fixture }, Buffer,
  });
  if (!prepared.every(i => i.json.valid)) throw new Error('Unable to prepare sample styling prompts.');
  for (const item of prepared) {
    const prompt = item.json.aiBody.contents[0].parts[0].text;
    fs.writeFileSync(path.join(directory, `Prompt-ban-phoi-${item.json.index + 1}.txt`), prompt + '\n');
  }
  fs.writeFileSync(path.join(directory, 'Lua-chon-mau.json'), JSON.stringify(sample, null, 2));
  console.log('Prepared 2 sample prompts for Flow. No images uploaded and no credits spent.');
})().catch(error => { console.error(error.message); process.exitCode = 1; });
