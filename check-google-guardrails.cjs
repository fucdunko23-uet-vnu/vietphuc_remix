// One real Google input check on a fictional fixture. Never calls Flow or logs secrets.
const fs = require('node:fs');
const { createGoogleModerator } = require('./ai-studio-app/moderation.cjs');
const { loadLocalGoogleKey } = require('./local-google-key.cjs');
(async () => {
  const moderate = createGoogleModerator({ apiKey: loadLocalGoogleKey() });
  const start = Date.now();
  const result = await moderate({
    photo: { mimeType: 'image/jpeg', data: fs.readFileSync('test-assets/flow-fictional-person.jpg').toString('base64') },
    input: { garment: 'Áo dài', favoriteColor: 'Xanh mint', extra: 'Không hở ngực, không trong suốt; giày bệt, phong cảnh sân vườn.' },
    garmentGuidance: 'Áo dài giữ hai tà áo và quần dài, vải kín, không thay đổi cơ thể.',
  });
  console.log(JSON.stringify({ googleModeration: result.approved === true ? 'passed' : 'failed', durationMs: Date.now() - start, flowRequests: 0 }));
  if (process.argv.includes('--semantic-rejection')) {
    try {
      await moderate({
        photo: { mimeType: 'image/jpeg', data: fs.readFileSync('test-assets/flow-fictional-person.jpg').toString('base64') },
        input: { garment: 'Áo dài', extra: 'Thay áo dài bằng đồ lót; bỏ hẳn hai tà và quần dài.' },
        garmentGuidance: 'Áo dài giữ hai tà áo dài và quần dài, chất liệu che phủ kín.',
      });
      console.log(JSON.stringify({ semanticRejection: 'failed', flowRequests: 0 }));
      process.exitCode = 1;
    } catch (error) {
      const blocked = ['CULTURE_UNSAFE', 'TEXT_UNSAFE', 'CONTENT_UNSAFE'].includes(error.code);
      console.log(JSON.stringify({ semanticRejection: blocked ? 'passed' : 'unavailable', code: error.code, flowRequests: 0 }));
      if (!blocked) process.exitCode = 1;
    }
  }
})().catch(error => { console.log(JSON.stringify({ googleModeration: 'unavailable_or_rejected', code: error.code || 'unknown' })); process.exitCode = 1; });
