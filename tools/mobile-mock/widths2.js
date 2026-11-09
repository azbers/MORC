const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const pages = ['','collections/all','products/ward-chelsea','cart','pages/manifesto','pages/contract','pages/track','pages/policies','pages/about','pages/contact','pages/offers','pages/giving','pages/gifts','pages/feed','pages/faq','blogs/journal','404'];
  for (const W of [320, 375, 412, 600, 768, 900, 901]) {
    const ctx = await b.newContext({ viewport: { width: W, height: 800 }, isMobile: W < 901, hasTouch: true, deviceScaleFactor: 1 });
    await ctx.addInitScript(()=>{try{localStorage.setItem('daur.consent','"all"');sessionStorage.setItem('daur.mSplash','1');localStorage.setItem('daur.cart',JSON.stringify([{pid:'ward-chelsea',vid:'black-waxed',size:42,qty:1,mode:'gift'},{pid:'sector-slip',vid:'black-nappa',size:41,qty:1}]))}catch(e){}});
    const res = [];
    for (const p of pages) {
      const pg = await ctx.newPage(); const errs = []; pg.on('pageerror', e => { if (!/Transition was aborted/.test(e.message)) errs.push(e.message); });
      await pg.goto('http://127.0.0.1:8765/' + p + (p ? '/' : ''), { waitUntil: 'networkidle' }); await pg.waitForTimeout(350);
      const r = await pg.evaluate(() => {
        const ow = document.documentElement.scrollWidth - innerWidth;
        const on = document.documentElement.classList.contains('m-on');
        const vis = (e) => { const s = getComputedStyle(e); return e.offsetParent !== null && s.visibility !== 'hidden'; };
        const tx = [...document.querySelectorAll('#mApp button, #mApp a, #mApp b, #mApp h1, #mApp h2, #mApp span')].filter(e => vis(e) && e.scrollWidth > e.clientWidth + 2 && getComputedStyle(e).overflow !== 'hidden' && getComputedStyle(e).textOverflow !== 'ellipsis' && !e.closest('.m-car,.m-pills,.m-proof,.m-shots,.gv-rail,.gv-stats,.m-cols,.pg-table,.pg-chips')).slice(0, 3).map(e => e.tagName + '.' + String(e.className).slice(0, 24) + ':' + e.textContent.trim().slice(0, 24));
        // anything sticking out of the screen on the right that is not a scroll rail or a decoration
        const out = [...document.querySelectorAll('#mApp *')].filter(e => { if (!vis(e)) return false; const r = e.getBoundingClientRect(); return r.width && r.right > innerWidth + 1 && !e.closest('.m-car,.m-pills,.m-proof,.m-shots,.gv-rail,.gv-stats,.m-cols,.pg-table,.pg-chips,.pg-hero,.gv-hero,.m-banner,.m-pdp .p-img,.of-wallet,.gf-hero,.m-sheet'); }).slice(0, 3).map(e => e.tagName + '.' + String(e.className).slice(0, 24));
        return { on, ow, tx, out };
      });
      if (r.ow || r.tx.length || r.out.length || errs.length || (W < 901) !== r.on) res.push((p || 'home') + ' ' + JSON.stringify(r) + ' ' + errs.join('|'));
      await pg.close();
    }
    console.log(W, res.length ? '\n  ' + res.join('\n  ') : 'clean');
    await ctx.close();
  }
  await b.close();
})();
