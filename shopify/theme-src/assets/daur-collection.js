/* Our Collection: places the section rendered by sections/daur-collection.liquid under the home
   hero and stages it. The looks sit on a sideways track: the centre look is large, the previous
   and next wait smaller at the sides, partly in view. Swipe, trackpad, mouse drag, arrow keys,
   the buttons or a tap on a side look move it. The page itself is never held: an up or down
   scroll always scrolls the page. Reduced motion, Lite mode, Save-Data or a missing API leave
   the plain sequence. The heart saves the pair to Liked items. */
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
    || !window.requestAnimationFrame || !CSS.supports('scroll-snap-type', 'x mandatory');

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

  // Liked items: the storefront keeps the list; the button follows it
  function likes(root) {
    const api = window.DAUR_API;
    root.querySelectorAll('[data-oc-like]').forEach((b) => {
      const h = b.dataset.wish;
      if (!api || !api.toggleWish || (api.prod && !api.prod(h))) return;   // pair not in the storefront catalog
      const paint = () => { const on = api.wish.includes(h); b.setAttribute('aria-pressed', String(on)); b.querySelector('.oc-like-t').textContent = on ? 'Liked' : 'Like'; };
      b.hidden = false; paint();
      b.onclick = (e) => { e.preventDefault(); api.toggleWish(h); paint(); };
    });
  }

  function stage(root) {
    if (stop) { stop(); stop = null; }
    if (!root || !root.matches('[data-oc]')) return;
    likes(root);
    const list = root.querySelector('.oc-looks');
    const looks = Array.from(root.querySelectorAll('.oc-look'));
    const panel = root.querySelector('.oc-panel');
    root.classList.remove('oc-live', 'oc-still');
    // details go back inside their looks for the plain sequence
    looks.forEach((li) => { const el = li._ocInfo; if (el && el.parentNode !== li) li.appendChild(el); if (el) { el.removeAttribute('inert'); el.removeAttribute('aria-hidden'); } });
    if (looks.length < 2 || still()) { root.classList.add('oc-still'); return; }

    const ctl = root.querySelector('.oc-ctl');
    const count = root.querySelector('.oc-count b');
    const bar = root.querySelector('.oc-bar i');
    const N = looks.length;
    const pad = (i) => String(i + 1).padStart(2, '0');
    root.classList.add('oc-live');
    if (ctl) ctl.hidden = false;
    // one details panel beside the track, showing the centre look
    const infos = looks.map((li, i) => { const el = li.querySelector('.oc-info') || li._ocInfo; li._ocInfo = el; li.dataset.ocI = i; panel.appendChild(el); return el; });

    let active = -1, raf = 0;
    const step = () => (looks[1] ? looks[1].offsetLeft - looks[0].offsetLeft : list.clientWidth) || 1;

    function paint() {
      raf = 0;
      const wide = innerWidth >= 900;
      const p = Math.min(N - 1, Math.max(0, list.scrollLeft / step()));
      looks.forEach((li, i) => {
        const d = i - p, a = Math.abs(d), near = Math.min(a, 1), far = Math.max(0, Math.min(a - 1, 1));
        li.classList.toggle('oc-far', a > 2.2);
        if (a > 2.2) return;
        const s = 1 - near * (wide ? 0.44 : 0.3) - far * 0.12;
        const x = -Math.sign(d) * far * (wide ? 4 : 8);     // second neighbours tuck in a little
        const y = near * (wide ? -17 : 3);                   // side looks sit higher on wide screens, clear of the details
        const fig = li.firstElementChild;
        fig.style.transform = `translate3d(${x.toFixed(2)}vw, ${y.toFixed(2)}svh, 0) scale(${s.toFixed(4)})`;
        fig.style.opacity = (1 - near * 0.38 - far * 0.62).toFixed(3);
        li.style.zIndex = String(10 - Math.round(a * 4));
        fig.style.setProperty('--oc-side', near.toFixed(3));
      });
      const now = Math.round(p);
      if (now !== active) {
        active = now;
        looks.forEach((li, i) => li.classList.toggle('is-on', i === active));
        infos.forEach((el, i) => { const on = i === active; el.classList.toggle('is-on', on); el.toggleAttribute('inert', !on); el.setAttribute('aria-hidden', String(!on)); });
        if (count) count.textContent = pad(active);
      }
      if (bar) bar.style.transform = `scaleX(${((p + 1) / N).toFixed(4)})`;
    }
    const ask = () => { if (!raf) raf = requestAnimationFrame(paint); };
    const go = (i) => { i = Math.max(0, Math.min(N - 1, i)); list.scrollTo({ left: i * step(), behavior: 'smooth' }); };

    // mouse drag (touch and trackpads scroll the track natively)
    let drag = null, dragged = false;
    const down = (e) => { if (e.pointerType !== 'mouse' || e.button !== 0) return; drag = { x: e.clientX, l: list.scrollLeft, moved: false }; };
    const move = (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      if (!drag.moved && Math.abs(dx) > 6) { drag.moved = true; list.classList.add('is-drag'); }
      if (drag.moved) list.scrollLeft = drag.l - dx;
    };
    const up = () => {
      if (!drag) return;
      const moved = drag.moved; drag = null;
      if (moved) { list.classList.remove('is-drag'); go(Math.round(list.scrollLeft / step())); dragged = true; setTimeout(() => { dragged = false; }, 0); }
    };
    const click = (e) => {
      if (dragged) { e.preventDefault(); e.stopPropagation(); return; }
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

    list.addEventListener('scroll', ask, { passive: true });
    addEventListener('resize', ask, { passive: true });
    list.addEventListener('pointerdown', down);
    addEventListener('pointermove', move);
    addEventListener('pointerup', up);
    root.addEventListener('click', click, true);
    root.addEventListener('keydown', key);
    list.tabIndex = 0;
    list.scrollLeft = 0;
    paint();

    stop = () => {
      list.removeEventListener('scroll', ask); removeEventListener('resize', ask);
      list.removeEventListener('pointerdown', down); removeEventListener('pointermove', move); removeEventListener('pointerup', up);
      root.removeEventListener('click', click, true); root.removeEventListener('keydown', key);
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
    const list = li && li.closest('.oc-live .oc-looks');
    if (list) list.scrollTo({ left: li.offsetLeft - list.querySelector('.oc-look').offsetLeft });
  });
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', () => { const s = document.querySelector('[data-oc]'); if (s) stage(s); });
})();
