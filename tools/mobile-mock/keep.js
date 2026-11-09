// Screens already seen come back without being rebuilt; tab taps do not rebuild; liked count and cookies. Usage: node keep.js <outdir>
const { chromium, devices } = require('playwright');
(async () => {
  const O = process.argv[2] || '.';
  const b = await chromium.launch(); const errs = [];
  const ctx = await b.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 1 });
  await ctx.addInitScript(() => { try { sessionStorage.setItem('daur.mSplash', '1'); } catch (e) {} });
  const pg = await ctx.newPage(); pg.on('pageerror', (e) => errs.push(e.message));
  await pg.goto('http://127.0.0.1:8765/', { waitUntil: 'networkidle' }); await pg.waitForTimeout(5500);
  // cookie: accept, then a fresh store with only the cookie left must not ask again
  const btn = await pg.$('#ck [data-ck=all]'); if (btn) { await btn.tap(); await pg.waitForTimeout(500); }
  console.log('consent', await pg.evaluate(() => localStorage.getItem('daur.consent')), 'cookie', await pg.evaluate(() => /daur_consent=all/.test(document.cookie)));
  await pg.evaluate(() => localStorage.removeItem('daur.consent'));
  await pg.reload({ waitUntil: 'networkidle' }); await pg.waitForTimeout(5500);
  console.log('banner after clearing storage (want false)', await pg.evaluate(() => !!document.getElementById('ck')), 'restored', await pg.evaluate(() => localStorage.getItem('daur.consent')));
  // mark a node on home, go away and come back: the same node must be there
  await pg.evaluate(() => { document.querySelector('#mView').firstElementChild.dataset.mark = 'kept'; scrollTo(0, 1400); });
  await pg.waitForTimeout(400);
  await pg.evaluate(() => DAUR_MX.go('/pages/gifts')); await pg.waitForTimeout(500);
  await pg.goBack(); await pg.waitForTimeout(700);
  console.log('home kept after back', await pg.evaluate(() => !!document.querySelector('[data-mark=kept]')), 'y', await pg.evaluate(() => scrollY));
  await pg.evaluate(() => DAUR_MX.go('/cart')); await pg.waitForTimeout(400);
  await pg.evaluate(() => document.querySelector('#mTab a[aria-label=Home], #mTab a').click()); await pg.waitForTimeout(600);
  console.log('home kept after tab tap', await pg.evaluate(() => !!document.querySelector('[data-mark=kept]')));
  for (let i = 0; i < 3; i++) { await pg.evaluate(() => document.querySelector('#mTab a').click()); await pg.waitForTimeout(400); }
  console.log('home kept after repeated home taps', await pg.evaluate(() => !!document.querySelector('[data-mark=kept]')), 'y', await pg.evaluate(() => scrollY));
  // liked count
  await pg.evaluate(() => document.querySelector('#mView [data-wish]').click()); await pg.waitForTimeout(300);
  console.log('liked badge', await pg.evaluate(() => (document.querySelector('#mTab .t-lk') || {}).textContent));
  await pg.evaluate(() => DAUR_MX.go('/pages/liked')); await pg.waitForTimeout(500); await pg.screenshot({ path: O + '/liked-tab.png' });
  // carousel still moves after coming back
  await pg.evaluate(() => DAUR_MX.go('/')); await pg.waitForTimeout(300); await pg.evaluate(() => scrollTo(0, 0));
  const s0 = await pg.evaluate(() => (document.querySelector('#mVouch') || document.querySelector('#mPromo')).scrollLeft);
  await pg.waitForTimeout(5000);
  const s1 = await pg.evaluate(() => (document.querySelector('#mVouch') || document.querySelector('#mPromo')).scrollLeft);
  console.log('carousel moves', s0, s1);
  console.log('ERR', errs.join(' | ') || 'none'); await b.close();
})();
