// Round 5 screens: splash, home gift and give, menu, wallet card, DAUR pages. Usage: node shots5.js <outdir>
const { chromium, devices } = require('playwright');
(async () => {
  const O = process.argv[2] || '.';
  const b = await chromium.launch(); const errs = [];
  const ctx = await b.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 1 });
  await ctx.addInitScript(() => { try { localStorage.setItem('daur.consent', '"all"'); } catch (e) {} });
  const pg = await ctx.newPage(); pg.on('pageerror', (e) => errs.push(e.message));
  await pg.goto('http://127.0.0.1:8765/', { waitUntil: 'domcontentloaded' }); await pg.waitForTimeout(700);
  await pg.screenshot({ path: O + '/splash.png' });
  await pg.waitForTimeout(2200);
  await pg.evaluate(() => document.querySelector('.r5-for').scrollIntoView({ block: 'start' })); await pg.waitForTimeout(300);
  await pg.evaluate(() => scrollBy(0, -70)); await pg.waitForTimeout(200);
  await pg.screenshot({ path: O + '/home-for.png' });
  await pg.evaluate(() => scrollTo(0, 0)); await pg.click('[data-menu]'); await pg.waitForTimeout(500);
  await pg.screenshot({ path: O + '/menu1.png' });
  for (const [i, y] of [[2, 650], [3, 1300], [4, 1950]]) { await pg.evaluate((yy) => { document.getElementById('mSheet').scrollTop = yy; }, y); await pg.waitForTimeout(150); await pg.screenshot({ path: O + '/menu' + i + '.png' }); }
  const ow = await pg.evaluate(() => { const s = document.getElementById('mSheet'); return [...s.querySelectorAll('*')].filter((e) => { const r = e.getBoundingClientRect(); return r.width && (r.right > innerWidth + 1 || r.left < -1) && !e.closest('.r5-tile,.r5-mcard'); }).slice(0, 4).map((e) => e.className); });
  console.log('menu overflow', JSON.stringify(ow));
  for (const p of ['pages/offers', 'pages/manifesto', 'pages/contract', 'pages/contact', 'blogs/journal', 'pages/faq', 'pages/policies']) {
    await pg.goto('http://127.0.0.1:8765/' + p + '/', { waitUntil: 'networkidle' }); await pg.waitForTimeout(500);
    const n = p.replace(/\//g, '_');
    await pg.screenshot({ path: O + '/' + n + '.png' });
    await pg.evaluate(() => scrollBy(0, 640)); await pg.waitForTimeout(200); await pg.screenshot({ path: O + '/' + n + '-2.png' });
    console.log(p, 'ow', await pg.evaluate(() => document.documentElement.scrollWidth - innerWidth));
  }
  console.log('ERR', errs.join(' | ') || 'none'); await b.close();
})();
