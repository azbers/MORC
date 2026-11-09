const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 1 });
  await ctx.addInitScript(()=>{try{localStorage.setItem('daur.consent','"all"');sessionStorage.setItem('daur.mSplash','1')}catch(e){}});
  const out = process.argv[2]; const list = process.argv[3]==null?[]:process.argv[3].split(',').filter(x=>x!=null);
  const pages = list.length ? list : ['','collections/all','products/ward-chelsea','cart','pages/manifesto','pages/contract','pages/track','pages/liked','pages/feed','pages/policies','pages/about','pages/contact','pages/offers','pages/giving','pages/gifts','pages/faq','blogs/journal','404'];
  for (const p of pages) {
    const pg = await ctx.newPage(); const errs=[];
    pg.on('pageerror', e => errs.push(e.message));
    await pg.goto('http://127.0.0.1:8765/' + p + (p? '/' : ''), { waitUntil: 'networkidle' }); await pg.waitForTimeout(700);
    const n = (p || 'home').replace(/\//g, '_');
    await pg.screenshot({ path: `${out}/${n}.png` });
    if (process.env.FULL) await pg.screenshot({ path: `${out}/${n}-full.png`, fullPage: true });
    const info = await pg.evaluate(() => {
      const ow = document.documentElement.scrollWidth - innerWidth;
      const bad = [...document.querySelectorAll('body *')].filter(e => { const r = e.getBoundingClientRect(); const s=getComputedStyle(e); return r.width && s.visibility!=='hidden' && s.display!=='none' && (r.right > innerWidth + 1 || r.left < -1) && e.closest('#mApp') && !e.closest('.m-car,.m-pills,.m-proof,.m-shots,[hidden],.m-sheet,.gv-rail,.gv-stats,.m-cols,.pg-table') ; }).slice(0, 4).map(e => e.tagName + '.' + String(e.className).slice(0,40) + ' ' + Math.round(e.getBoundingClientRect().right));
      const tx = [...document.querySelectorAll('button, a.btn, .m-cta, .m-pill')].filter(e => e.offsetParent && e.scrollWidth > e.clientWidth + 2).slice(0,4).map(e => e.tagName+'.'+String(e.className).slice(0,30)+': '+e.textContent.trim().slice(0,30));
      return { ow, bad, tx };
    });
    console.log(n, JSON.stringify(info), errs.join(' | '));
    await pg.close();
  }
  await b.close();
})();
