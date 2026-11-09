// Full length screenshots of every screen and the menu, for a design review. Usage: node review.js <outdir>
const { chromium, devices } = require('playwright');
(async () => {
  const O = process.argv[2] || '.';
  const b = await chromium.launch(); const errs = [];
  const ctx = await b.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 1 });
  await ctx.addInitScript(() => { try { localStorage.setItem('daur.consent', '"all"'); sessionStorage.setItem('daur.mSplash', '1'); } catch (e) {} });
  const pg = await ctx.newPage(); pg.on('pageerror', (e) => errs.push(e.message));
  const pages = ['', 'collections/all', 'products/ward-chelsea', 'cart', 'pages/liked', 'pages/feed', 'pages/offers', 'pages/gifts', 'pages/giving', 'pages/manifesto', 'pages/contract', 'pages/track', 'pages/policies', 'pages/about', 'pages/contact', 'pages/faq', 'blogs/journal', '404'];
  for (const p of pages) {
    await pg.goto('http://127.0.0.1:8765/' + p + (p ? '/' : ''), { waitUntil: 'networkidle' }); await pg.waitForTimeout(600);
    // let every reveal play before the picture
    for (let y = 0; y < 9000; y += 500) { await pg.evaluate((yy) => scrollTo(0, yy), y); await pg.waitForTimeout(90); }
    await pg.evaluate(() => scrollTo(0, 0)); await pg.waitForTimeout(500);
    await pg.screenshot({ path: `${O}/${(p || 'home').replace(/\//g, '_')}.png`, fullPage: true });
  }
  // the bag with pairs in it
  await pg.goto('http://127.0.0.1:8765/products/ward-chelsea/', { waitUntil: 'networkidle' });
  await pg.evaluate(() => { const p = DAUR_API.P[0], v = p.variants[0]; DAUR_API.cart.push({ id: p.id, vid: v.id, size: p.sizes[1], qty: 1 }); try { localStorage.setItem('daur.cart', JSON.stringify(DAUR_API.cart)); } catch (e) {} });
  await pg.goto('http://127.0.0.1:8765/cart/', { waitUntil: 'networkidle' }); await pg.waitForTimeout(600);
  await pg.screenshot({ path: `${O}/cart-full.png`, fullPage: true });
  // the menu, top to bottom
  await pg.goto('http://127.0.0.1:8765/', { waitUntil: 'networkidle' }); await pg.waitForTimeout(400);
  await pg.click('[data-menu]'); await pg.waitForTimeout(1200);
  const H = await pg.evaluate(() => document.getElementById('mSheet').scrollHeight);
  for (let y = 0, i = 0; y < H; y += 600, i++) { await pg.evaluate((yy) => { document.getElementById('mSheet').scrollTop = yy; }, y); await pg.waitForTimeout(250); await pg.screenshot({ path: `${O}/menu-${i}.png` }); }
  await pg.click('[data-mclose]'); await pg.waitForTimeout(300);
  await pg.evaluate(() => document.querySelector('[data-explain]').click()); await pg.waitForTimeout(500); await pg.screenshot({ path: `${O}/explain.png` });
  console.log('ERR', errs.join(' | ') || 'none'); await b.close();
})();
