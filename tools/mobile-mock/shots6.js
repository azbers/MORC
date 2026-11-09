// Round 6 screens and the back button test. Usage: node shots6.js <outdir>
const { chromium, devices } = require('playwright');
(async () => {
  const O = process.argv[2] || '.';
  const b = await chromium.launch(); const errs = [];
  const ctx = await b.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 1 });
  await ctx.addInitScript(() => { try { localStorage.setItem('daur.consent', '"all"'); } catch (e) {} });
  const pg = await ctx.newPage(); pg.on('pageerror', (e) => errs.push(e.message));
  const shot = (n) => pg.screenshot({ path: O + '/' + n + '.png' });
  await pg.goto('http://127.0.0.1:8765/', { waitUntil: 'domcontentloaded' }); await pg.waitForTimeout(800); await shot('splash');
  await pg.waitForTimeout(2200);
  // back button: scroll the home page far down, open a pair, come back
  await pg.evaluate(() => scrollTo(0, 2600)); await pg.waitForTimeout(900);
  const y0 = await pg.evaluate(() => scrollY);
  await pg.evaluate(() => { const a = [...document.querySelectorAll('#mView a[href*="/products/"]')].find((x) => x.getBoundingClientRect().top > 80 && x.getBoundingClientRect().top < innerHeight - 100); a.click(); });
  await pg.waitForTimeout(700); const at = await pg.evaluate(() => location.pathname);
  await pg.goBack(); await pg.waitForTimeout(900);
  console.log('back test: was', y0, 'opened', at, 'now', await pg.evaluate(() => location.pathname), 'y', await pg.evaluate(() => scrollY));
  await pg.evaluate(() => DAUR_MX.go('/pages/gifts')); await pg.waitForTimeout(900); await shot('gifts');
  await pg.evaluate(() => scrollBy(0, 560)); await pg.waitForTimeout(700); await shot('gifts-2');
  await pg.evaluate(() => document.querySelector('#mApp .m-act[data-mode=gift]').scrollIntoView({ block: 'center' })); await pg.waitForTimeout(800); await pg.evaluate(() => document.querySelector('#mApp .m-act[data-mode=gift]').click()); await pg.waitForTimeout(250); await shot('gifts-love');
  await pg.evaluate(() => { DAUR_API.cart.length = 0; try { DAUR_API.save && DAUR_API.save(); } catch (e) {} });
  await pg.goto('http://127.0.0.1:8765/', { waitUntil: 'networkidle' }); await pg.waitForTimeout(400);
  await pg.evaluate(() => { localStorage.removeItem('daur.cart'); });
  await pg.click('[data-menu]'); await pg.waitForTimeout(900);
  await pg.evaluate(() => { document.getElementById('mSheet').scrollTop = 900; }); await pg.waitForTimeout(500); await shot('menu-tiles');
  await pg.evaluate(() => { document.getElementById('mSheet').scrollTop = 560; }); await pg.waitForTimeout(300); await shot('menu-acts');
  for (const p of ['pages/about', 'pages/contact', 'blogs/journal', 'pages/giving', 'products/ward-chelsea', 'cart']) {
    await pg.goto('http://127.0.0.1:8765/' + p + '/', { waitUntil: 'networkidle' }); await pg.waitForTimeout(700);
    const n = p.replace(/\//g, '_'); await shot(n);
    await pg.evaluate(() => scrollBy(0, 600)); await pg.waitForTimeout(800); await shot(n + '-2');
    await pg.evaluate(() => scrollBy(0, 600)); await pg.waitForTimeout(800); await shot(n + '-3');
    console.log(p, 'ow', await pg.evaluate(() => document.documentElement.scrollWidth - innerWidth));
  }
  console.log('ERR', errs.join(' | ') || 'none'); await b.close();
})();
