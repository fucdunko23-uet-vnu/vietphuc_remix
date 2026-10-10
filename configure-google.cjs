// Local setup helper. The API key is received only through the child process environment.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { DatabaseSync } = require('node:sqlite');
const { CipherAes256CBC } = require('D:/n8n/node_modules/n8n-core/dist/encryption/aes-256-cbc.js');
const root = 'D:/n8n';
const key = (process.env.VIET_PHUC_GEMINI_KEY || '').trim();
delete process.env.VIET_PHUC_GEMINI_KEY;

(async () => {
  assert.ok(key.length >= 20, 'No Gemini key supplied through the secure local setup.');
  const db = new DatabaseSync(root + '/data/.n8n/database.sqlite', { readOnly: true });
  const saved = db.prepare('SELECT id,name,nodes,connections,settings FROM workflow_entity WHERE id=?').get('vietPhucRemixStudio');
  db.close();
  assert.ok(saved, 'The Studio workflow must be installed first.');
  const wf = { ...saved, nodes: JSON.parse(saved.nodes), connections: JSON.parse(saved.connections), settings: JSON.parse(saved.settings), active: false };
  const prepare = wf.nodes.find(n => n.name === 'Chuẩn bị dữ liệu');
  prepare.parameters.jsCode = prepare.parameters.jsCode.replace("mimeType: 'application/json'", "mimeType: 'APPLICATION_JSON'");
  const sample = JSON.parse(fs.readFileSync(path.join(__dirname, 'demo-input.json'), 'utf8'));
  const prep = new Function('$input', prepare.parameters.jsCode)({ first: () => ({ json: sample }) })[0].json;
  const response = await fetch(prep.aiUrl, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify(prep.aiBody), signal: AbortSignal.timeout(60000),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(`Google API: HTTP ${response.status}, status ${body.error?.status || 'unknown'}. ${String(body.error?.message || '').slice(0, 1200)} The existing demo remains enabled.`);
  const render = wf.nodes.find(n => n.name === 'Tạo thẻ kết quả');
  prep.useAI = true;
  const result = new Function('$', '$input', render.parameters.jsCode)(() => ({ first: () => ({ json: prep }) }), { first: () => ({ json: body }) })[0].json;
  assert.equal(result.source, 'ai', 'Google response did not contain two complete explanations.');

  const credentialId = 'vietPhucGoogleGemini';
  const credentialName = 'Google Gemini - Viet phuc Remix';
  const config = JSON.parse(fs.readFileSync(root + '/data/.n8n/config', 'utf8'));
  const cipher = new CipherAes256CBC();
  const data = cipher.encrypt(JSON.stringify({ host: 'https://generativelanguage.googleapis.com', apiKey: key }), config.encryptionKey);
  assert.equal(JSON.parse(cipher.decrypt(data, config.encryptionKey)).apiKey, key);
  fs.writeFileSync(root + '/temp/viet-phuc-google-credential.json', JSON.stringify([{ id: credentialId, name: credentialName, type: 'googlePalmApi', data }]));
  assert.match(prepare.parameters.jsCode, /const USE_AI = (false|true);/);
  prepare.parameters.jsCode = prepare.parameters.jsCode.replace(/const USE_AI = (false|true);/, 'const USE_AI = true;');
  wf.nodes.find(n => n.name === 'AI tạo gợi ý').credentials = { googlePalmApi: { id: credentialId, name: credentialName } };
  fs.writeFileSync(root + '/temp/viet-phuc-studio-ai-import.json', JSON.stringify(wf));
  fs.writeFileSync(root + '/workflows/Viet-phuc-Remix-Studio/validation-google.json', JSON.stringify({
    checkedAt: new Date().toISOString(), model: prep.aiUrl.split('/models/')[1].split(':')[0],
    directGoogleCall: 'passed', explanations: result.looks.map(l => l.reason),
    workflowEndToEnd: 'pending',
  }, null, 2));
  console.log('PASS Google: two valid explanations received. Encrypted credential and workflow prepared for import.');
})().catch(error => { console.error(String(error.message).replaceAll(key || 'NO_KEY', '[redacted]')); process.exitCode = 1; });
