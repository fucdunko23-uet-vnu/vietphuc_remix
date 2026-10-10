const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('D:/n8n/node_modules/playwright-core');
(async () => {
  const root = path.join(__dirname, 'ai-studio-app');
  const files = ['package.json', 'server.cjs', 'styling.cjs', 'server.test.cjs', 'public/index.html', 'public/style.css', 'public/app.js'];
  const bundle = files.map(file => `\n===== FILE: ${file} =====\n${fs.readFileSync(path.join(root, file), 'utf8')}\n===== END FILE =====\n`).join('');
  const bundlePath = 'D:/n8n/temp/viet-phuc-ai-studio-source.txt';
  fs.writeFileSync(bundlePath, bundle);
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9223');
  try {
    const page = browser.contexts()[0].pages().find(p => p.url().includes('aistudio.google.com'));
    if (!process.argv.includes('--already-attached')) {
    const upload = page.getByRole('menuitem', { name: 'Upload Files', exact: true });
    if (!(await upload.isVisible())) await page.getByRole('button', { name: 'Insert files (text, images, audio, video) into your prompt.', exact: true }).click();
    const choosing = page.waitForEvent('filechooser');
    await upload.click();
    await (await choosing).setFiles(bundlePath);
    }
    await page.locator('textarea').first().fill('Build an app named "Việt phục Remix" from the attached source bundle. Each FILE section is an exact project file: reconstruct those files, preserve the existing polished Vietnamese UI and all server endpoint contracts, run npm test and npm start, and make the preview work. This is a full-stack Node.js app with a static frontend; do not rewrite it into a different template. The image generation provider is an external authenticated Google Flow browser worker, not the Gemini API. Never claim that Flow credits can be used via a Gemini API key. The worker communicates through /api/worker/claim and /api/worker/complete using the server-only FLOW_WORKER_TOKEN secret. Until the real worker connects, show the honest offline status and leave the separately labeled SVG demo available. Do not fake photo results. Keep the worker token out of client code, logs and source files. If no token exists, add FLOW_WORKER_TOKEN to Secrets so I can configure it. Use process.env.PORT || 3000 and listen on 0.0.0.0. This contest demo uses one server process with an in-memory short-lived queue; keep the API contract unchanged and do not add a database or ask for a paid service. Prepare for AI Studio publication.');
    await page.locator('button.build-button').click({timeout:60000});
    await page.waitForTimeout(2000);
    console.log('Submitted source bundle to AI Studio Build. Current URL: ' + page.url());
  } finally { await browser.close(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
