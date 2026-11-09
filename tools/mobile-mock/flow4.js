// Round 4 checkout flow: two gift pairs, one giving pair, one own pair, through the new product page and bag
const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 1, reducedMotion: 'reduce' });
  await ctx.addInitScript(() => { try { localStorage.setItem('daur.consent', '"all"'); sessionStorage.setItem('daur.mSplash', '1'); } catch (e) {} });
  const pg = await ctx.newPage(); const errs = []; pg.on('pageerror', (e) => errs.push(e.message));
  const posts = [];
  await pg.route('**/cart/*.js', async (r) => { posts.push([r.request().url().split('/').pop(), r.request().postData()]); await r.fulfill({ status: 200, contentType: 'application/json', body: '{}' }); });
  await pg.route('**/discount/**', (r) => r.fulfill({ status: 200, body: 'ok' })); await pg.route('**/checkout', (r) => r.fulfill({ status: 200, body: 'ok' }));
  const O = process.argv[2] || '.';
  await pg.goto('http://127.0.0.1:8765/products/ward-chelsea/', { waitUntil: 'networkidle' }); await pg.waitForTimeout(400);
  const buy = async (mode, size) => { await pg.click(`#mApp [data-pxfor="${mode}"]`); if (size) await pg.click(`#mApp [data-pxsize="${size}"]`); await pg.click('#mApp [data-pxbuy]'); await pg.waitForTimeout(1800); };
  await buy('gift', '42'); await buy('gift', '43'); await buy('give'); await buy('me', '41');
  console.log('cart lines', await pg.evaluate(() => DAUR_API.cart.length), 'pairs', await pg.evaluate(() => DAUR_API.cart.reduce((a, l) => a + l.qty, 0)));
  await pg.goto('http://127.0.0.1:8765/cart/', { waitUntil: 'networkidle' }); await pg.waitForTimeout(300);
  await pg.screenshot({ path: O + '/bag.png', fullPage: true });
  for (const h of await pg.$$('#mApp [data-xopen][aria-expanded=false]')) await h.click();
  for (const el of await pg.$$('#mApp [data-xf]')) { const f = await el.getAttribute('data-xf'); await el.fill(f === 'phone' ? '03001234567' : f === 'note' ? 'Eid Mubarak' : 'Test ' + f); }
  const pay = await pg.$$eval('#mApp [data-pay]', (a) => a.map((x) => x.dataset.pay)); console.log('pay options', pay.join(','));
  await pg.screenshot({ path: O + '/bag-filled.png', fullPage: true });
  await pg.evaluate(() => document.activeElement && document.activeElement.blur()); await pg.waitForTimeout(400);
  console.log('checkout rect', JSON.stringify(await pg.$eval('#mApp [data-checkout]', (e) => { const r = e.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), vh: innerHeight, bar: getComputedStyle(document.getElementById('mBuy')).transform }; })));
  await pg.$eval('#mApp [data-checkout]', (e) => e.click()); await pg.waitForTimeout(500);
  if (await pg.$('[data-xnaggo]')) { console.log('reminder sheet shown'); await pg.click('[data-xnaggo]'); await pg.waitForTimeout(800); }
  posts.forEach((p) => console.log(p[0], (p[1] || '').slice(0, 2000)));
  console.log('ERR', errs.join(' | ') || 'none'); await b.close();
})();
