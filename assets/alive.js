/* DAUR motion layer. Everything here is decoration on top of a working
   store: a shoe cursor that faces the way it travels, the falling shoe pile
   above the footer, the liquid fill on the footer letters, scroll progress,
   card tilt, magnetic buttons and counters. Respects reduced motion and only
   swaps the cursor on devices with a real mouse. */
(function () {
  'use strict';
  const EXT = window.DAUR_EXT = window.DAUR_EXT || { views: {}, hooks: {} };
  EXT.hooks = EXT.hooks || {};
  const on = (name, fn) => { (EXT.hooks[name] = EXT.hooks[name] || []).push(fn); };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;

  const KX = () => window.DAUR_KICKS;
  // a sneaker sole print, heel at the left, toe at the right
  const PRINT = '<svg viewBox="0 0 30 12" aria-hidden="true"><path d="M2 6c0-2.4 1.6-4 4-4 2.2 0 3.4 1.2 3.4 4S8.2 10 6 10C3.6 10 2 8.4 2 6zM12 6c0-2.8 2.6-4.4 7-4.4 5.2 0 9 1.8 9 4.4s-3.8 4.4-9 4.4c-4.4 0-7-1.6-7-4.4z"/><path d="M15 4v4M18.4 3.6v4.8M21.8 3.8v4.4M25 4.6v2.8M4.4 4.4v3.2M7 4.2v3.6" class="tr"/></svg>';

  /* ---------------- shoe cursor with footsteps ---------------- */
  function cursor() {
    if (!fine || reduce || document.getElementById('shoeCur') || !KX()) return;
    document.documentElement.classList.add('shoe-cursor');
    const shoe = KX().svg('runner', { upper: '#EDEBE4', sole: '#ffffff', accent: '#B97A47', line: '#0b0b0b' }, 'sc-svg');
    document.body.insertAdjacentHTML('beforeend', `<div id="steps" aria-hidden="true"></div><div id="shoeCur" aria-hidden="true"><div class="sc-shoe">${shoe}</div></div>`);
    const el = document.getElementById('shoeCur'), inner = el.firstElementChild, steps = document.getElementById('steps');
    let x = 0, y = 0, face = 1, tilt = 0, want = 0, seen = false, raf = 0, lx = 0, ly = 0, dist = 0, foot = 1, lastStep = 0;
    const HOT = 'a,button,[role="button"],label,select,summary,.size,.sw-b,.card-media,[data-jump],.vsw,.line-card';
    const TEXT = 'input:not([type="checkbox"]):not([type="radio"]):not([type="color"]):not([type="range"]),textarea,[contenteditable="true"]';
    function frame() {
      tilt += (want - tilt) * 0.2; want *= 0.86;
      inner.style.transform = `scaleX(${face}) rotate(${tilt.toFixed(2)}deg)`;
      raf = Math.abs(tilt) > 0.05 || Math.abs(want) > 0.05 ? requestAnimationFrame(frame) : 0;
    }
    function step(px, py, ang) {
      const now = performance.now(); if (now - lastStep < 60) return; lastStep = now;
      if (steps.childElementCount > 26) steps.firstElementChild.remove();
      foot = -foot;
      const ox = Math.cos(ang + Math.PI / 2) * 6 * foot, oy = Math.sin(ang + Math.PI / 2) * 6 * foot;
      const s = document.createElement('i'); s.className = 'fstep'; s.innerHTML = PRINT;
      s.style.transform = `translate(${(px + ox).toFixed(1)}px,${(py + oy).toFixed(1)}px) rotate(${(ang * 180 / Math.PI).toFixed(1)}deg)${foot < 0 ? ' scaleY(-1)' : ''}`;
      steps.appendChild(s); setTimeout(() => s.remove(), 1300);
    }
    addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      x = e.clientX; y = e.clientY;
      if (!seen) { seen = true; lx = x; ly = y; el.classList.add('on'); }
      el.style.transform = `translate3d(${x}px,${y}px,0)`;
      const dx = x - lx, dy = y - ly, d = Math.hypot(dx, dy);
      if (Math.abs(dx) > 1.5) face = dx > 0 ? 1 : -1;
      want = Math.max(-22, Math.min(22, dy * 1.6)) * face;
      dist += d; lx = x; ly = y;
      const t = e.target instanceof Element ? e.target : null;
      const text = t && t.closest(TEXT);
      el.classList.toggle('hot', !!(t && !text && t.closest(HOT)));
      el.classList.toggle('txt', !!text);
      if (dist > 30 && d > 0.5 && !text) { dist = 0; step(x - Math.cos(Math.atan2(dy, dx)) * 22, y + 2, Math.atan2(dy, dx)); }
      if (!raf) raf = requestAnimationFrame(frame);
    }, { passive: true });
    addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse') { el.classList.remove('tap'); void el.offsetWidth; el.classList.add('tap'); } });
    document.addEventListener('mouseleave', () => { el.classList.remove('on'); seen = false; });
  }

  /* ---------------- shoes falling from the sky into a pile above the footer ---------------- */
  function pit() {
    const big = document.querySelector('.ftr-big');
    if (!big || document.getElementById('pit') || !KX()) return;
    // the pairs land on the big footer letters themselves, so no extra band of page is needed
    big.insertAdjacentHTML('beforebegin', '<div class="pit" id="pit" aria-hidden="true"><canvas></canvas></div>');
    const box = big, cv = document.querySelector('#pit canvas'), cx = cv.getContext('2d');
    const prods = (window.DAUR_API ? window.DAUR_API.P : window.DAUR_PRODUCTS) || [];
    const looks = [];
    prods.forEach((p) => p.variants.forEach((v) => looks.push({ kind: KX().kindOf(p), hex: v.hex || '#777' })));
    ['#CCFF00', '#EDEBE4', '#ff3b5c', '#2b4a7a', '#d8a3ad', '#a8794f'].forEach((h, i) => looks.push({ kind: KX().kinds[i % KX().kinds.length], hex: h }));
    // pre render every look once as an image
    const own = (window.DAUR_PILE || []).map((x) => { const img = new Image(); img.src = x.src; img.r = x.r; return img; });
    const sprites = own.length ? own : looks.map((l) => {
      const accent = l.hex.toLowerCase() === '#ccff00' ? '#0b0b0b' : '#CCFF00';
      const img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(KX().svg(l.kind, KX().colorsFor(l.hex, accent)).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="80" '));
      return img;
    });
    // the canvas covers the screen so pairs can fall from the top of it; the world is measured from the pit's top left corner
    let W = 0, H = 0, VW = 0, VH = 0, dpr = 1, shoes = [], raf = 0, visible = false, armed = true, calm = 0, timers = [], R = { left: 0, top: 0 };
    const ptr = { x: -999, y: -999, vx: 0, t: 0 };
    function size() {
      const r = box.getBoundingClientRect(); dpr = Math.min(2, devicePixelRatio || 1);
      W = r.width; H = r.height; VW = innerWidth; VH = innerHeight;
      cv.width = VW * dpr; cv.height = VH * dpr; cv.style.width = VW + 'px'; cv.style.height = VH + 'px';
    }
    function drop() {
      timers.forEach(clearTimeout); timers = []; shoes = [];
      const n = W < 600 ? 14 : W < 1100 ? 15 : 16;
      const order = [...Array(n).keys()].sort(() => Math.random() - 0.5); // spread across the word, in random order
      for (let i = 0; i < n; i++) {
        timers.push(setTimeout(() => {
          const img = sprites[Math.floor(Math.random() * sprites.length)], r = img.r || 0.625;
          const w = (W < 600 ? 58 : W < 1100 ? 100 : 128) * (0.85 + Math.random() * 0.35) * (r > 0.8 ? 0.82 : 1), h = w * r * 0.9;
          shoes.push({ x: w / 2 + ((order[i] + 0.2 + Math.random() * 0.6) / n) * (W - w), y: -box.getBoundingClientRect().top - h - Math.random() * 120, vx: (Math.random() - 0.5) * 1.2, vy: 1 + Math.random() * 2, w, h, r, img, f: Math.random() < 0.5 ? -1 : 1, a: 0, ph: Math.random() * 6.28, air: true });
          wake();
        }, reduce ? 0 : i * 110 + Math.random() * 160));
      }
    }
    function step(t) {
      const floor = H - 4;
      for (const s of shoes) {
        if (performance.now() - ptr.t < 500) { // walking through: shoves pairs sideways, never spins them
          const dx = s.x - ptr.x, dy = s.y - ptr.y, rx = s.w / 2 + 22, ry = s.h / 2 + 24;
          if (Math.abs(dx) < rx && Math.abs(dy) < ry) {
            const dir = dx === 0 ? (ptr.vx >= 0 ? 1 : -1) : Math.sign(dx);
            const k = 1 - Math.abs(dx) / rx;
            s.vx += dir * (0.6 + k * 1.6) + ptr.vx * 0.12;
            if (k > 0.6 && !s.air) s.vy -= 0.8;
          }
        }
        s.vy += 0.38; s.vx *= s.air ? 0.995 : 0.9; s.vy *= 0.995;
        if (s.air) s.vx += Math.sin(t / 380 + s.ph) * 0.03; // a light drift on the way down
        s.x += s.vx; s.y += s.vy;
        if (s.y + s.h / 2 > floor) { s.y = floor - s.h / 2; s.vy = s.vy > 2 ? -s.vy * 0.22 : 0; s.air = false; }
        if (s.x - s.w / 2 < 0) { s.x = s.w / 2; s.vx = Math.abs(s.vx) * 0.4; }
        if (s.x + s.w / 2 > W) { s.x = W - s.w / 2; s.vx = -Math.abs(s.vx) * 0.4; }
      }
      for (let it = 0; it < 3; it++) for (let i = 0; i < shoes.length; i++) for (let j = i + 1; j < shoes.length; j++) {
        const a = shoes[i], b = shoes[j], dx = b.x - a.x, dy = b.y - a.y;
        const ox = (a.w + b.w) / 2 * 0.86 - Math.abs(dx), oy = (a.h + b.h) / 2 * 0.82 - Math.abs(dy);
        if (ox <= 0 || oy <= 0) continue;
        const tall = Math.min(a.y, b.y) < H * (W < 600 ? 0.2 : 0.36); // never let a tower grow over the links above
        if (oy < ox && !tall) { // stacked: the upper one rests on the lower one
          const top = dy > 0 ? a : b, bot = dy > 0 ? b : a;
          top.y -= oy * 0.8; bot.y += oy * 0.2;
          if (top.vy > bot.vy) { const v = (top.vy + bot.vy) / 2; top.vy = v; bot.vy = v; }
          top.vx = top.vx * 0.9 + bot.vx * 0.1; top.air = false;
        } else { // side by side: the push passes along
          const sx = Math.sign(dx) || 1; a.x -= sx * ox / 2; b.x += sx * ox / 2;
          const rv = (b.vx - a.vx) * sx;
          if (rv < 0) { const imp = -rv * 0.6; a.vx -= sx * imp; b.vx += sx * imp; }
        }
      }
      for (const s of shoes) { const tgt = Math.max(-0.28, Math.min(0.28, s.vx * 0.05)) + (s.air ? Math.sin(performance.now() / 300 + s.ph) * 0.08 : 0); s.a += (tgt - s.a) * 0.15; }
    }
    function draw() {
      R = box.getBoundingClientRect();
      cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, VW, VH); cx.translate(R.left, R.top);
      for (const s of shoes) {
        if (!s.img.complete) continue;
        cx.save(); cx.translate(s.x, s.y); cx.rotate(s.a); cx.scale(s.f, 1);
        cx.drawImage(s.img, -s.w / 2, -s.w * s.r / 2, s.w, s.w * s.r);
        cx.restore();
      }
    }
    function loop(t) {
      step(t); draw();
      const moving = shoes.some((s) => s.air || Math.abs(s.vx) + Math.abs(s.vy) > 0.06);
      calm = moving ? 0 : calm + 1;
      raf = visible && (calm < 30 || timers.length > shoes.length) ? requestAnimationFrame(loop) : 0;
    }
    function wake() { calm = 0; if (!raf && visible) raf = requestAnimationFrame(loop); }
    addEventListener('pointermove', (e) => {
      if (!visible) return;
      const r = box.getBoundingClientRect(), nx = e.clientX - r.left, ny = e.clientY - r.top, t = performance.now();
      if (ny < -40 && !shoes.some((s) => Math.abs(s.x - nx) < s.w && Math.abs(s.y - ny) < s.h * 1.4)) { ptr.t = 0; return; }
      ptr.vx = ptr.t && t - ptr.t < 100 ? Math.max(-14, Math.min(14, nx - ptr.x)) : 0;
      ptr.x = nx; ptr.y = ny; ptr.t = t; wake();
    }, { passive: true });
    addEventListener('scroll', () => { if (visible && !raf) requestAnimationFrame(draw); }, { passive: true });
    const io = new IntersectionObserver(([en]) => {
      visible = en.isIntersecting; cv.style.display = visible ? 'block' : 'none';
      if (visible && armed) { armed = false; size(); drop(); }
      if (!en.isIntersecting && en.boundingClientRect.top > innerHeight) armed = true; // they fall again next time
      if (visible) wake();
    }, { threshold: 0.2 });
    io.observe(box);
    let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { const oldW = W; size(); if (Math.abs(W - oldW) > 80) drop(); else wake(); }, 150); });
  }

  /* ---------------- footer letters: each character fills on its own ---------------- */
  function bigWord() {
    const big = document.querySelector('.ftr-big');
    if (!big || big.dataset.split) return;
    big.dataset.split = 1;
    big.innerHTML = [...big.textContent].map((c, i) => `<span class="fb-ch${c === '.' ? ' dot' : ''}" style="--i:${i}">${c}</span>`).join('');
    big.removeAttribute('aria-hidden'); big.setAttribute('role', 'img'); big.setAttribute('aria-label', 'DAUR');
    big.querySelectorAll('.fb-ch').forEach((ch) => {
      ch.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') ch.classList.add('on'); });
      ch.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') ch.classList.remove('on'); });
      ch.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') { ch.classList.add('on'); clearTimeout(ch._t); ch._t = setTimeout(() => ch.classList.remove('on'), 1800); } });
    });
  }
  /* ---------------- small life everywhere ---------------- */
  function progress() {
    if (document.getElementById('scrollBar')) return;
    document.body.insertAdjacentHTML('beforeend', '<div id="scrollBar" aria-hidden="true"></div>');
    const b = document.getElementById('scrollBar');
    let q = 0;
    const paint = () => { q = 0; const h = document.documentElement.scrollHeight - innerHeight; b.style.transform = `scaleX(${h > 0 ? Math.min(1, scrollY / h) : 0})`; };
    addEventListener('scroll', () => { if (!q) q = requestAnimationFrame(paint); }, { passive: true });
    paint();
  }
  function tilt() {
    if (!fine || reduce) return;
    let cur = null;
    document.addEventListener('pointermove', (e) => {
      const m = e.target instanceof Element ? e.target.closest('.card-media, .pdp-media .gal-main, .pd') : null;
      if (cur && cur !== m) { cur.style.removeProperty('--rx'); cur.style.removeProperty('--ry'); cur.classList.remove('tilting'); }
      cur = m; if (!m) return;
      const r = m.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
      m.classList.add('tilting'); m.style.setProperty('--rx', (-py * 7).toFixed(2) + 'deg'); m.style.setProperty('--ry', (px * 9).toFixed(2) + 'deg');
      m.style.setProperty('--mx', ((px + 0.5) * 100).toFixed(1) + '%'); m.style.setProperty('--my', ((py + 0.5) * 100).toFixed(1) + '%');
    }, { passive: true });
  }
  function magnets() {
    if (!fine || reduce) return;
    let cur = null;
    document.addEventListener('pointermove', (e) => {
      const b = e.target instanceof Element ? e.target.closest('.btn, .icon-btn, .reel-act .ra') : null;
      if (cur && cur !== b) cur.style.transform = '';
      cur = b; if (!b) return;
      const r = b.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      b.style.transform = `translate(${(dx * 0.16).toFixed(1)}px,${(dy * 0.22).toFixed(1)}px)`;
    }, { passive: true });
  }
  function counters(root) {
    const els = [...(root || document).querySelectorAll('[data-count]:not([data-counted])')];
    if (!els.length) return;
    const run = (el) => {
      el.dataset.counted = 1; const end = +el.dataset.count; if (reduce || !end) return;
      const t0 = performance.now(), dur = 1100;
      const tick = (t) => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(end * e).toLocaleString('en-US'); if (k < 1) requestAnimationFrame(tick); };
      el.textContent = '0'; requestAnimationFrame(tick);
    };
    if (!('IntersectionObserver' in window)) { els.forEach((el) => { el.dataset.counted = 1; }); return; }
    const io = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { run(en.target); io.unobserve(en.target); } }), { threshold: 0.4 });
    els.forEach((el) => io.observe(el));
  }
  function bagBump() {
    const watch = (id) => {
      const el = document.getElementById(id); if (!el) return;
      let last = el.textContent;
      new MutationObserver(() => {
        if (el.textContent === last) return;
        const up = +el.textContent > +last; last = el.textContent;
        el.classList.toggle('on', +el.textContent > 0);
        if (up) { const b = el.closest('.icon-btn'); b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); }
      }).observe(el, { childList: true, characterData: true, subtree: true });
      el.classList.toggle('on', +el.textContent > 0);
    };
    watch('bagCount'); watch('wishCount');
  }

  // sections marked .rail pin while the page scrolls and slide their cards sideways
  let rails = [];
  function railMeasure() {
    rails = [...document.querySelectorAll('section.rail')].map((sec) => {
      const view = sec.querySelector('.rail-view'), track = sec.querySelector('.rail-track'), pin = sec.querySelector('.rail-pin');
      track.style.transform = '';
      const hdr = document.querySelector('.hdr'); sec.style.setProperty('--rail-top', (hdr ? hdr.offsetHeight : 0) + 'px');
      const cs = getComputedStyle(view);
      // slide until the last card sits inside the right gutter
      const travel = Math.max(0, track.offsetWidth + parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight) - view.clientWidth);
      const on = travel > 8 && !reduce;
      sec.classList.toggle('rail-on', on);
      sec.style.height = on ? (pin.offsetHeight + travel) + 'px' : '';
      return { sec, track, bar: sec.querySelector('.rail-bar i'), travel, on, off: hdr ? hdr.offsetHeight : 0 };
    });
    railMove();
  }
  function railMove() {
    rails.forEach((r) => {
      if (!r.on) return;
      const top = r.sec.getBoundingClientRect().top;
      const k = Math.min(1, Math.max(0, (r.off - top) / r.travel));
      r.track.style.transform = `translate3d(${-k * r.travel}px,0,0)`;
      if (r.bar) r.bar.style.transform = `scaleX(${k})`;
    });
  }
  let railBound = false;
  function rail() {
    railMeasure();
    if (railBound) return; railBound = true;
    addEventListener('scroll', () => requestAnimationFrame(railMove), { passive: true });
    addEventListener('resize', railMeasure);
    addEventListener('load', railMeasure);
  }

  // native select menus ignore the dark theme on some systems, so .select gets a drawn menu
  function dropdowns(root) {
    (root || document).querySelectorAll('select.select:not([data-dd])').forEach((sel) => {
      sel.dataset.dd = '1';
      const wrap = document.createElement('span'); wrap.className = 'dd';
      const btn = document.createElement('button'); btn.type = 'button'; btn.className = sel.className + ' dd-btn';
      btn.setAttribute('aria-haspopup', 'listbox'); btn.setAttribute('aria-expanded', 'false');
      const lab = sel.id && document.querySelector(`label[for="${sel.id}"]`); btn.setAttribute('aria-label', (lab ? lab.textContent : sel.getAttribute('aria-label') || 'Choose') + ', ' + (sel.selectedOptions[0] || {}).textContent);
      const list = document.createElement('ul'); list.className = 'dd-list'; list.setAttribute('role', 'listbox');
      sel.parentNode.insertBefore(wrap, sel); wrap.append(sel, btn, list); sel.classList.add('dd-native'); sel.tabIndex = -1; sel.setAttribute('aria-hidden', 'true');
      let act = 0;
      const paint = () => {
        const o = sel.selectedOptions[0]; btn.textContent = o ? o.textContent : '';
        list.innerHTML = [...sel.options].map((x, k) => `<li role="option" data-k="${k}" aria-selected="${x.selected}" class="${k === act ? 'cur' : ''}">${x.textContent.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))}</li>`).join('');
      };
      // keep the drawn menu in step when code sets the value directly
      const desc = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
      Object.defineProperty(sel, 'value', { get() { return desc.get.call(this); }, set(v) { desc.set.call(this, v); paint(); }, configurable: true });
      const close = () => { wrap.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); };
      const open = () => { document.querySelectorAll('.dd.open').forEach((d) => d !== wrap && d.classList.remove('open')); act = sel.selectedIndex; paint(); wrap.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); };
      const pick = (k) => { if (sel.selectedIndex !== k) { sel.selectedIndex = k; sel.dispatchEvent(new Event('change', { bubbles: true })); } paint(); close(); btn.focus(); };
      btn.addEventListener('click', () => (wrap.classList.contains('open') ? close() : open()));
      list.addEventListener('click', (e) => { const li = e.target.closest('li'); if (li) pick(+li.dataset.k); });
      btn.addEventListener('keydown', (e) => {
        const n = sel.options.length;
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (!wrap.classList.contains('open')) open(); else { act = (act + (e.key === 'ArrowDown' ? 1 : n - 1)) % n; paint(); } }
        else if ((e.key === 'Enter' || e.key === ' ') && wrap.classList.contains('open')) { e.preventDefault(); pick(act); }
        else if (e.key === 'Escape' || e.key === 'Tab') close();
      });
      document.addEventListener('pointerdown', (e) => { if (!wrap.contains(e.target)) close(); });
      paint();
    });
  }

  let booted = false;
  on('after', () => {
    if (!booted) { booted = true; cursor(); pit(); bigWord(); progress(); tilt(); magnets(); bagBump(); }
    const app = document.getElementById('app');
    if (app && !reduce) { app.classList.remove('pg-in'); void app.offsetWidth; app.classList.add('pg-in'); }
    counters(app);
    rail();
    dropdowns(app);
  });
})();
