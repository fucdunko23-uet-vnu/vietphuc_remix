const fs = require('node:fs');
const { DatabaseSync } = require('node:sqlite');
const { CipherAes256CBC } = require('D:/n8n/node_modules/n8n-core/dist/encryption/aes-256-cbc.js');
(async () => {
  const db = new DatabaseSync('D:/n8n/data/.n8n/database.sqlite', { readOnly: true });
  const row = db.prepare('SELECT data FROM credentials_entity WHERE id=?').get('vietPhucGoogleGemini');
  db.close();
  const config = JSON.parse(fs.readFileSync('D:/n8n/data/.n8n/config', 'utf8'));
  const { apiKey } = JSON.parse(new CipherAes256CBC().decrypt(row.data, config.encryptionKey));
  if (process.argv.includes('--fixture')) {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-nano-banana-2.1:generateContent', {
      method: 'POST', headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(180000),
      body: JSON.stringify({ contents: [{ parts: [{ text: 'Create a realistic full-length photo of a fictional adult Vietnamese woman, age 25, shoulder-length dark hair, wearing a plain blue T-shirt, straight dark jeans and sneakers, standing with relaxed arms apart from torso on a light grey studio background. Facing camera, natural expression, clearly visible face and shoes. Natural body proportions, soft even light, no text, no logos. This is a fictional test model for a clothing visualization demo. Portrait aspect ratio 3:4.' }] }], generationConfig: { responseModalities: ['TEXT', 'IMAGE'] } }),
    });
    const body = await response.json();
    const image = body.candidates?.[0]?.content?.parts?.find(p => p.inlineData && !p.thought)?.inlineData;
    if (!response.ok || !image) throw new Error(('Image fixture generation failed: HTTP ' + response.status + ' ' + (body.error?.message || body.candidates?.[0]?.finishReason || 'no image')).replaceAll(apiKey, '[redacted]'));
    const path = require('node:path');
    fs.mkdirSync(path.join(__dirname, 'test-assets'), { recursive: true });
    const output = path.join(__dirname, 'test-assets', 'nguoi-mau-ai.' + (image.mimeType === 'image/jpeg' ? 'jpg' : 'png'));
    fs.writeFileSync(output, Buffer.from(image.data, 'base64'));
    console.log('Generated FICTIONAL Google AI test model: ' + output);
    return;
  }
  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000', { headers: { 'x-goog-api-key': apiKey }, signal: AbortSignal.timeout(20000) });
  const data = await response.json();
  const pattern = process.argv.includes('--veo') ? /veo/ : /image|banana/;
  console.log(JSON.stringify({ status: response.status, models: data.models?.filter(m => pattern.test(m.name)).map(m => ({ name: m.name, methods: m.supportedGenerationMethods })) }));
})().catch(error => { console.error(error.message); process.exitCode = 1; });
