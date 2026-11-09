/* Saves every voucher picture from export.html as PNG.
   Usage, from the repo root:
     python3 -m http.server 8767 --bind 127.0.0.1 &
     node tools/vouchers/export.js <output folder>
   For each offer it writes <offer>-post-1080x1350.png (Instagram and Facebook feed), <offer>-story-1080x1920.png
   (stories and WhatsApp status) and <offer>-card.png (the voucher alone on a clear background). */
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const out = path.resolve(process.argv[2] || 'voucher-pictures');
  require('fs').mkdirSync(out, { recursive: true });
  const base = 'http://127.0.0.1:8767/tools/vouchers/export.html';
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1600, height: 2000 }, deviceScaleFactor: 1 });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(base, { waitUntil: 'networkidle' });
  const keys = await p.evaluate(() => window.CARD_KEYS);
  for (const k of keys) {
    for (const [size, name] of [['post', 'post-1080x1350'], ['story', 'story-1080x1920'], ['card', 'card']]) {
      await p.goto(`${base}?card=${k}&size=${size}`, { waitUntil: 'networkidle' });
      await p.evaluate(() => document.fonts.ready);
      await p.waitForTimeout(150);
      await p.locator('#cv').screenshot({ path: path.join(out, `${k}-${name}.png`), omitBackground: size === 'card' });
      console.log('saved', `${k}-${name}.png`);
    }
  }
  if (errs.length) console.log('page errors:', errs.join(' | '));
  await b.close();
})();
