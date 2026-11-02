/* Our Collection: places the section rendered by sections/daur-collection.liquid under the home
   hero and stages it. The page scroll moves the looks: the centre look is large, the previous and
   next wait smaller at the sides, partly in view. Swipe, arrow keys, the buttons and a tap on a side
   look also move it. Reduced motion, Lite mode, Save-Data or a missing API leave the plain sequence. */
(function () {
  'use strict';
  const EXT = window.DAUR_EXT = window.DAUR_EXT || { views: {}, hooks: {} };
  (EXT.hooks.after = EXT.hooks.after || []);

  // the storefront redraws #app, so the section is taken out first and put back on the home view
  const src = document.querySelector('[data-oc]');
  let wrap = src ? (src.closest('.shopify-section') || src) : null;
  if (wrap) wrap.remove();

  const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches
    || document.documentElement.classList.contains('lite')
    || (navigator.connection && navigator.connection.saveData)
    || !('IntersectionObserver' in window) || !window.requestAnimationFrame
    || !CSS.supports('position', 'sticky');

  let stop = null;

  function place() {
    if (!wrap) return;
    const hero = document.getElementById('hero');
    const slot = document.getElementById('ext-collection');
    if (slot) slot.replaceWith(wrap);
    else if (hero) hero.after(wrap);
    else return;
    wrap.classList.add('oc-placed');
    stage(wrap.querySelector('[data-oc]') || wrap);
  }

  function stage(root) {
    if (stop) { stop(); stop = null; }
    if (!root || !root.matches('[data-oc]')) return;
    const looks = Array.from(root.querySelectorAll('.oc-look'));
    root.classList.remove('oc-live', 'oc-still');
    if (looks.length < 2 || still()) { root.classList.add('oc-still'); return; }

    const track = root.querySelector('.oc-track');
    const ctl = root.querySelector('.oc-ctl');
    const count = root.querySelector('.oc-count b');
    const bar = root.querySelector('.oc-bar i');
    const N = looks.length;
    const pad = (i) => String(i + 1).padStart(2, '0');
    root.classList.add('oc-live');
    if (ctl) ctl.hidden = false;
    looks.forEach((li, i) => { li.dataset.ocI = i; });

    let pos = -1, active = -1, raf = 0, inView = false, wide = false;
    const range = () => Math.max(1, track.offsetHeight - innerHeight);
    const topOf = () => track.getBoundingClientRect().top + scrollY;

    function paint() {
      raf = 0;
      wide = innerWidth >= 900;
      const t = Math.min(1, Math.max(0, -track.getBoundingClientRect().top / range()));
      const p = t * (N - 1);
      if (Math.abs(p - pos) < 0.0005) return;
      pos = p;
      const gap = wide ? 31 : 60;               // vw between looks
      looks.forEach((li, i) => {
        const d = i - p, a = Math.abs(d), near = Math.min(a, 1), far = Math.max(0, Math.min(a - 1, 1));
        if (a > 2.2) { li.classList.add('oc-far'); return; }
        li.classList.remove('oc-far');
        const s = 1 - near * (wide ? 0.44 : 0.3) - far * 0.12;
        const x = Math.sign(d) * (near * gap + far * gap * 0.55);
        const y = near * (wide ? -17 : 3);        // side looks sit higher on wide screens, clear of the details panel
        const fig = li.firstElementChild;
        fig.style.transform = `translate3d(${x.toFixed(2)}vw, ${y.toFixed(2)}svh, 0) scale(${s.toFixed(4)})`;
        fig.style.opacity = (1 - near * 0.38 - far * 0.62).toFixed(3);
        fig.style.zIndex = String(10 - Math.round(a * 4));
        fig.style.setProperty('--oc-side', near.toFixed(3));
      });
      const now = Math.round(p);
      if (now !== active) {
        active = now;
        looks.forEach((li, i) => {
          const on = i === active;
          li.classList.toggle('is-on', on);
          li.querySelector('.oc-info').toggleAttribute('inert', !on);
          li.querySelector('.oc-info').setAttribute('aria-hidden', String(!on));
        });
        if (count) count.textContent = pad(active);
      }
      if (bar) bar.style.transform = `scaleX(${((p + 1) / N).toFixed(4)})`;
    }
    const ask = () => { if (inView && !raf) raf = requestAnimationFrame(paint); };

    // where the page must be for look i to sit in the centre
    const go = (i) => {
      i = Math.max(0, Math.min(N - 1, i));
      window.scrollTo({ top: topOf() + (range() * i) / (N - 1) + 1, behavior: 'smooth' });
    };

    const io = new IntersectionObserver(([e]) => { inView = e.isIntersecting; if (inView) { pos = -1; ask(); } }, { rootMargin: '200px 0px' });
    io.observe(track);

    // swipe across the stage to move one look; an upward swipe simply scrolls the page
    let sx = 0, sy = 0, st = 0;
    const pin = root.querySelector('.oc-pin');
    const tStart = (e) => { const t = e.touches[0]; sx = t.clientX; sy = t.clientY; st = Date.now(); };
    const tEnd = (e) => {
      const t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
      if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy) * 1.3 && Date.now() - st < 900) go(active + (dx < 0 ? 1 : -1));
    };
    const click = (e) => {
      const b = e.target.closest('[data-oc-go]');
      if (b) { go(active + Number(b.dataset.ocGo)); return; }
      const f = e.target.closest('.oc-look:not(.is-on) .oc-frame');
      if (f) { e.preventDefault(); go(Number(f.closest('.oc-look').dataset.ocI)); }
    };
    const key = (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      if (e.target.closest('input, textarea, select')) return;
      e.preventDefault(); go(active + (e.key === 'ArrowRight' ? 1 : -1));
    };
    // settle on the nearest look once the page stops, where the browser reports it
    const settle = () => {
      if (!inView || pos < 0) return;
      const r = track.getBoundingClientRect();
      if (r.top > 0 || r.bottom < innerHeight) return;
      const off = pos - Math.round(pos);
      if (Math.abs(off) > 0.04 && Math.abs(off) < 0.45) go(Math.round(pos));
    };

    pin.addEventListener('touchstart', tStart, { passive: true });
    pin.addEventListener('touchend', tEnd, { passive: true });
    root.addEventListener('click', click);
    root.addEventListener('keydown', key);
    addEventListener('scroll', ask, { passive: true });
    addEventListener('resize', ask, { passive: true });
    if ('onscrollend' in window) addEventListener('scrollend', settle);
    pin.tabIndex = -1;
    paint();

    stop = () => {
      io.disconnect();
      pin.removeEventListener('touchstart', tStart); pin.removeEventListener('touchend', tEnd);
      root.removeEventListener('click', click); root.removeEventListener('keydown', key);
      removeEventListener('scroll', ask); removeEventListener('resize', ask);
      removeEventListener('scrollend', settle);
      if (raf) cancelAnimationFrame(raf);
    };
  }

  EXT.hooks.after.push(({ page }) => {
    if (page !== 'home') { if (stop) { stop(); stop = null; } return; }
    place();
  });

  // theme editor: a changed setting redraws the section in place
  document.addEventListener('shopify:section:load', (e) => {
    const s = e.target.querySelector && e.target.querySelector('[data-oc]');
    if (!s) return;
    wrap = e.target; wrap.classList.add('oc-placed');
    stage(s);
  });
  document.addEventListener('shopify:block:select', (e) => {
    const li = e.target.closest && e.target.closest('.oc-look');
    const root = li && li.closest('[data-oc].oc-live');
    if (!root) return;
    const track = root.querySelector('.oc-track'), N = root.querySelectorAll('.oc-look').length;
    const i = Number(li.dataset.ocI);
    window.scrollTo({ top: track.getBoundingClientRect().top + scrollY + ((track.offsetHeight - innerHeight) * i) / Math.max(1, N - 1) + 1 });
  });
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', () => { const s = document.querySelector('[data-oc]'); if (s) stage(s); });
})();
