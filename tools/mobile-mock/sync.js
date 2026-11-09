const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 1 });
  await ctx.addInitScript(() => { try { localStorage.setItem('daur.consent', '"all"'); sessionStorage.setItem('daur.mSplash', '1'); } catch (e) {} });
  const pg = await ctx.newPage(); const errs = []; const docs = [];
  pg.on('pageerror', (e) => errs.push(e.message));
  pg.on('request', (r) => { if (r.resourceType() === 'document' || r.resourceType() === 'fetch') docs.push(r.resourceType() + ' ' + r.url().replace('http://127.0.0.1:8765', '')); });
  await pg.goto('http://127.0.0.1:8765/', { waitUntil: 'networkidle' });
  await pg.evaluate(() => { window.__mark = 1; });
  await pg.waitForTimeout(3500);
  const step = async (label, fn) => {
    const t0 = Date.now(); await fn(); await pg.waitForTimeout(400);
    const r = await pg.evaluate(() => ({ alive: window.__mark === 1, path: location.pathname, h: (document.querySelector('#mView h1, #mView .m-h1') || {}).textContent, n: document.querySelectorAll('#mView *').length, skel: !!document.querySelector('#mView .m-skel[aria-busy]'), title: document.title }));
    console.log(label, Date.now() - t0 + 'ms', JSON.stringify(r));
  };
  await step('go faq', () => pg.evaluate(() => DAUR_MX && DAUR_MX.go ? DAUR_MX.go('/pages/faq') : (history.pushState({}, '', '/pages/faq'), dispatchEvent(new PopStateEvent('popstate')))));
  await step('go journal', () => pg.evaluate(() => DAUR_MX && DAUR_MX.go ? DAUR_MX.go('/blogs/journal') : (history.pushState({}, '', '/blogs/journal'), dispatchEvent(new PopStateEvent('popstate')))));
  await step('back', () => pg.goBack());
  await step('back2', () => pg.goBack());
  // tap a link inside a remote page
  await step('to faq again', () => pg.evaluate(() => { history.pushState({ m: 1 }, '', '/pages/faq'); dispatchEvent(new PopStateEvent('popstate')); }));
  const link = await pg.evaluate(() => { const a = [...document.querySelectorAll('#mView a[href]')].find((a) => !a.dataset.m && a.origin === location.origin && !/^#/.test(a.getAttribute('href'))); return a ? a.getAttribute('href') : null; });
  console.log('link in faq', link);
  if (link) await step('tap link', () => pg.click(`#mView a[href="${link}"]`));
  // first landing on a remote page, then away and back
  const p2 = await ctx.newPage(); p2.on('pageerror', (e) => errs.push('p2 ' + e.message));
  await p2.goto('http://127.0.0.1:8765/pages/faq/', { waitUntil: 'networkidle' }); await p2.waitForTimeout(600);
  const h1 = await p2.evaluate(() => document.querySelectorAll('#mView *').length);
  await p2.evaluate(() => { history.pushState({ m: 1 }, '', '/collections/all'); dispatchEvent(new PopStateEvent('popstate')); });
  await p2.waitForTimeout(300); await p2.goBack(); await p2.waitForTimeout(500);
  const h2 = await p2.evaluate(() => document.querySelectorAll('#mView *').length);
  console.log('landing faq nodes', h1, 'after back', h2);
  console.log('requests', docs.join('\n  '));
  console.log('errors', errs.join(' | ') || 'none');
  await b.close();
})();
