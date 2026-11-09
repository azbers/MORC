const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 1 });
  await ctx.addInitScript(() => { try { localStorage.setItem('daur.consent', '"all"'); sessionStorage.setItem('daur.mSplash', '1'); } catch (e) {} });
  const pg = await ctx.newPage(); const errs = []; pg.on('pageerror', (e) => errs.push(e.message));
  const posts = [];
  await pg.route('**/cart/*.js', async (r) => { posts.push([r.request().url().split('/').pop(), r.request().postData()]); await r.fulfill({ status: 200, contentType: 'application/json', body: '{}' }); });
  await pg.route('**/discount/**', (r) => r.fulfill({ status: 200, body: 'ok' })); await pg.route('**/checkout', (r) => r.fulfill({ status: 200, body: 'ok' }));
  const O = 'r4/';
  await pg.goto('http://127.0.0.1:8765/products/ward-chelsea/', { waitUntil: 'networkidle' });
  await pg.evaluate(() => document.querySelector('.m-modes').scrollIntoView({ block: 'center' })); await pg.waitForTimeout(200);
  await pg.click('#mApp [data-pmode=gift]'); await pg.waitForTimeout(200); await pg.screenshot({ path: O + 'f-gift.png' });
  await pg.click('#mApp [data-size="42"]'); await pg.click('#mApp [data-add]'); await pg.click('#mApp [data-size="43"]'); await pg.click('#mApp [data-add]');
  await pg.click('#mApp [data-pmode=give]'); await pg.waitForTimeout(150); await pg.screenshot({ path: O + 'f-give.png' }); await pg.click('#mApp [data-add]');
  await pg.click('#mApp [data-pmode=me]'); await pg.click('#mApp [data-size="41"]'); await pg.click('#mApp [data-add]');
  await pg.evaluate(() => document.querySelector('#mApp [data-explain]').click()); await pg.waitForTimeout(400); await pg.screenshot({ path: O + 'f-explain.png' });
  await pg.goto('http://127.0.0.1:8765/cart/', { waitUntil: 'networkidle' }); await pg.waitForTimeout(300);
  await pg.screenshot({ path: O + 'f-bag.png', fullPage: true });
  await pg.click('#mApp [data-checkout]'); await pg.waitForTimeout(400); console.log('missing toast:', await pg.textContent('#mToast'));
  const ins = await pg.$$('#mApp [data-gd]'); console.log('fields', ins.length);
  for (const el of ins) { const f = await el.getAttribute('data-gf'); await el.fill(f === 'phone' ? '03001234567' : f === 'note' ? 'Eid Mubarak' : 'Test ' + f); }
  await pg.click('#mApp [data-pay=full]'); await pg.waitForTimeout(200);
  await pg.click('#mApp [data-checkout]'); await pg.waitForTimeout(800);
  posts.forEach((p) => console.log(p[0], (p[1] || '').slice(0, 1800)));
  console.log('ERR', errs.join(' | ')); await b.close();
})();
