/* DAUR Supply core script: drawers and modals, header, mega menu, announcement, reveal,
   cart (Shopify AJAX API + Section Rendering), predictive search, footer accordions, cookie choice.
   No libraries. Every feature works as a plain link or form without this file. */
(() => {
  'use strict';
  const D = (window.DAUR = window.DAUR || {});
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const T = D.t || {};
  const R = D.routes || { root: '/', cart: '/cart' };
  const root = (R.root || '/').replace(/\/$/, '');

  /* toast and live messages */
  let toastTimer;
  D.toast = (msg) => {
    const el = $('[data-toast]');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('is-on'), 3200);
  };

  /* ---------- drawers and modals: focus trap, Escape, overlay, scroll lock, focus return ---------- */
  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  const overlay = $('[data-overlay]');
  let openEl = null;
  let lastTrigger = null;

  const lock = (on) => {
    if (on) {
      const w = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.paddingRight = w > 0 ? w + 'px' : '';
      document.body.classList.add('is-locked');
    } else {
      document.body.style.paddingRight = '';
      document.body.classList.remove('is-locked');
    }
  };

  D.open = (id, trigger) => {
    const el = document.getElementById(id);
    if (!el) return false;
    if (openEl && openEl !== el) D.close(false);
    lastTrigger = trigger || document.activeElement;
    openEl = el;
    el.classList.add('is-open');
    if (el.matches('[data-drawer]') && overlay) overlay.classList.add('is-open');
    const inner = $('.overlay', el); if (inner) inner.classList.add('is-open');
    $$('[aria-controls="' + id + '"]').forEach((b) => b.setAttribute('aria-expanded', 'true'));
    lock(true);
    document.dispatchEvent(new CustomEvent('daur:open', { detail: { id } }));
    requestAnimationFrame(() => {
      const first = el.querySelector('[data-autofocus]') || el.querySelector('input[type="search"]') || el.querySelector(FOCUSABLE);
      (first || el).focus({ preventScroll: true });
    });
    return true;
  };

  D.close = (restore = true) => {
    if (!openEl) return;
    const el = openEl;
    const id = el.id;
    el.classList.remove('is-open');
    if (overlay) overlay.classList.remove('is-open');
    const inner = $('.overlay', el); if (inner) inner.classList.remove('is-open');
    $$('[aria-controls="' + id + '"]').forEach((b) => b.setAttribute('aria-expanded', 'false'));
    openEl = null;
    lock(false);
    document.dispatchEvent(new CustomEvent('daur:close', { detail: { id } }));
    if (restore && lastTrigger && document.contains(lastTrigger)) lastTrigger.focus({ preventScroll: true });
  };

  document.addEventListener('click', (e) => {
    const opener = e.target.closest('[data-open]');
    if (opener) {
      if (D.open(opener.getAttribute('data-open'), opener)) e.preventDefault();
      return;
    }
    if (e.target.closest('[data-close]') || e.target === overlay) { e.preventDefault(); D.close(); }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (openEl) { D.close(); return; }
      if (mega && mega.classList.contains('is-open')) { setMega(false); megaBtn && megaBtn.focus(); }
    }
    if (e.key === 'Tab' && openEl) {
      const f = $$(FOCUSABLE, openEl).filter((n) => n.offsetParent !== null || n === document.activeElement);
      if (!f.length) { e.preventDefault(); return; }
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === openEl)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------- header: sticky border, gentle compact on scroll ---------- */
  const header = $('[data-header]');
  if (header) {
    let ticking = false;
    const onScroll = () => {
      const y = window.scrollY;
      header.classList.toggle('is-stuck', y > 4);
      header.classList.toggle('is-compact', y > 120);
      ticking = false;
    };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    onScroll();
  }

  /* ---------- mega menu: click or hover with intent, Escape, focus leaving closes ---------- */
  const mega = $('[data-mega]');
  const megaBtn = $('[data-mega-toggle]');
  const setMega = (on) => {
    if (!mega || !megaBtn) return;
    mega.classList.toggle('is-open', on);
    megaBtn.setAttribute('aria-expanded', on ? 'true' : 'false');
  };
  if (mega && megaBtn) {
    let hoverTimer;
    const fine = matchMedia('(hover: hover) and (pointer: fine)');
    megaBtn.addEventListener('click', () => setMega(!mega.classList.contains('is-open')));
    const enter = () => { if (!fine.matches) return; clearTimeout(hoverTimer); hoverTimer = setTimeout(() => setMega(true), 120); };
    const leave = () => { if (!fine.matches) return; clearTimeout(hoverTimer); hoverTimer = setTimeout(() => setMega(false), 180); };
    megaBtn.parentElement.addEventListener('mouseenter', enter);
    megaBtn.parentElement.addEventListener('mouseleave', leave);
    mega.addEventListener('mouseenter', () => clearTimeout(hoverTimer));
    mega.addEventListener('mouseleave', leave);
    header.addEventListener('focusout', (e) => { if (!header.contains(e.relatedTarget)) setMega(false); });
    document.addEventListener('click', (e) => { if (!e.target.closest('[data-header]')) setMega(false); });
  }

  /* ---------- phone menu accordions ---------- */
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-accordion]');
    if (!b) return;
    const panel = document.getElementById(b.getAttribute('aria-controls'));
    const on = b.getAttribute('aria-expanded') !== 'true';
    b.setAttribute('aria-expanded', on ? 'true' : 'false');
    if (panel) panel.hidden = !on;
  });

  /* ---------- announcement: slow turn, pauses on hover, focus and reduced motion ---------- */
  $$('[data-announcement]').forEach((bar) => {
    const msgs = $$('.announcement__msg', bar);
    const secs = parseInt(bar.dataset.interval || '0', 10);
    if (msgs.length < 2 || !secs || reduced()) return;
    let i = 0, paused = false;
    const show = (n) => msgs.forEach((m, k) => m.setAttribute('aria-hidden', k === n ? 'false' : 'true'));
    ['mouseenter', 'focusin', 'touchstart'].forEach((ev) => bar.addEventListener(ev, () => { paused = true; }, { passive: true }));
    ['mouseleave', 'focusout'].forEach((ev) => bar.addEventListener(ev, () => { paused = false; }));
    setInterval(() => { if (paused || document.hidden) return; i = (i + 1) % msgs.length; show(i); }, secs * 1000);
  });

  /* ---------- reveal: fade and rise once, content is visible if this never runs ---------- */
  const revealEls = $$('[data-reveal], .hero');
  if (document.documentElement.classList.contains('js-reveal') && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
    }), { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    revealEls.forEach((el) => io.observe(el));
  } else {
    document.documentElement.classList.remove('js-reveal');
  }

  /* ---------- cart ---------- */
  const cartSections = () => {
    const ids = ['cart-drawer'];
    if ($('[data-main-cart]')) ids.push($('[data-main-cart]').dataset.sectionId);
    return ids;
  };
  const status = (msg) => { const s = $('[data-cart-status]'); if (s) s.textContent = msg; };

  const renderSections = (sections) => {
    if (!sections) return;
    if (sections['cart-drawer']) {
      const doc = new DOMParser().parseFromString(sections['cart-drawer'], 'text/html');
      const fresh = doc.querySelector('[data-cart-drawer]');
      const cur = $('[data-cart-drawer]');
      if (fresh && cur) {
        const wasOpen = cur.classList.contains('is-open');
        const active = document.activeElement && cur.contains(document.activeElement) ? document.activeElement : null;
        const activeKey = active && active.closest('[data-key]') ? active.closest('[data-key]').dataset.key : null;
        const activeRole = active ? (active.hasAttribute('data-qty-input') ? 'input' : active.className) : null;
        cur.innerHTML = fresh.innerHTML;
        if (wasOpen) cur.classList.add('is-open');
        if (wasOpen && openEl === cur) {
          let target = null;
          if (activeKey) {
            const line = cur.querySelector('[data-key="' + activeKey + '"]');
            if (line) target = activeRole === 'input' ? line.querySelector('[data-qty-input]') : line.querySelector('.qty button:not([disabled])');
          }
          (target || cur.querySelector('[data-close]')).focus({ preventScroll: true });
        }
      }
    }
    const main = $('[data-main-cart]');
    if (main && sections[main.dataset.sectionId]) {
      const doc = new DOMParser().parseFromString(sections[main.dataset.sectionId], 'text/html');
      const fresh = doc.querySelector('[data-main-cart]');
      if (fresh) main.innerHTML = fresh.innerHTML;
    }
  };

  const setCount = (n) => {
    $$('[data-cart-count]').forEach((c) => { c.textContent = n; c.hidden = n === 0; });
    $$('[data-cart-label]').forEach((l) => { l.textContent = (l.textContent || '').replace(/\d+/, n); });
  };

  const post = async (url, body) => {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { const err = new Error(data.description || data.message || T.error || 'Something went wrong.'); err.data = data; throw err; }
    return data;
  };

  D.cart = {
    async add(items, button) {
      const data = await post(root + '/cart/add.js', { items, sections: cartSections(), sections_url: location.pathname });
      renderSections(data.sections);
      const cart = await fetch(root + '/cart.js').then((r) => r.json());
      setCount(cart.item_count);
      status(T.added || 'Added to your bag.');
      D.open('CartDrawer', button);
      return data;
    },
    async change(line, quantity) {
      const lineEl = $('[data-cart-drawer] [data-line="' + line + '"]') || $('[data-main-cart] [data-line="' + line + '"]');
      if (lineEl) lineEl.classList.add('is-updating');
      try {
        const data = await post(root + '/cart/change.js', { line, quantity, sections: cartSections(), sections_url: location.pathname });
        renderSections(data.sections);
        setCount(data.item_count);
        status(T.updated || 'Bag updated.');
      } catch (err) {
        if (lineEl) lineEl.classList.remove('is-updating');
        D.toast(err.message);
      }
    },
    async code(discount) {
      const data = await post(root + '/cart/update.js', { discount, sections: cartSections(), sections_url: location.pathname });
      renderSections(data.sections);
      return data;
    },
  };

  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-qty]');
    if (!b || b.disabled) return;
    const line = b.closest('[data-line]');
    if (!line) return;
    e.preventDefault();
    D.cart.change(parseInt(line.dataset.line, 10), Math.max(0, parseInt(b.dataset.qty, 10) || 0));
  });
  document.addEventListener('change', (e) => {
    const inp = e.target.closest('[data-qty-input]');
    if (!inp) return;
    const line = inp.closest('[data-line]');
    const q = Math.max(0, parseInt(inp.value, 10) || 0);
    D.cart.change(parseInt(line.dataset.line, 10), q);
  });
  document.addEventListener('submit', async (e) => {
    const f = e.target.closest('[data-code-form]');
    if (!f) return;
    e.preventDefault();
    const inp = f.querySelector('input[name="discount"]');
    const code = (inp.value || '').trim().toUpperCase();
    if (!code) { inp.setAttribute('aria-invalid', 'true'); D.toast(T.codeEmpty || 'Enter a code first.'); inp.focus(); return; }
    const btn = f.querySelector('button');
    btn.classList.add('is-loading');
    try {
      const cart = await fetch(root + '/cart.js').then((r) => r.json());
      const existing = (cart.discount_codes || []).map((d) => d.code).filter((c) => c.toUpperCase() !== code);
      await D.cart.code([code].concat(existing).join(','));
    } catch (err) { D.toast(err.message); }
    btn.classList.remove('is-loading');
  });
  document.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-code-remove]');
    if (!b) return;
    e.preventDefault();
    const drop = b.dataset.codeRemove.toUpperCase();
    try {
      const cart = await fetch(root + '/cart.js').then((r) => r.json());
      const keep = (cart.discount_codes || []).map((d) => d.code).filter((c) => c.toUpperCase() !== drop);
      await D.cart.code(keep.join(','));
    } catch (err) { D.toast(err.message); }
  });
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-checkout]');
    if (b) b.classList.add('is-loading');
  });
  window.addEventListener('pageshow', () => $$('[data-checkout].is-loading').forEach((b) => b.classList.remove('is-loading')));

  /* add to bag forms (product page, quick view): loading, one submit at a time, clear errors */
  document.addEventListener('submit', async (e) => {
    const form = e.target.closest('[data-product-form]');
    if (!form) return;
    e.preventDefault();
    const btn = form.querySelector('[type="submit"]');
    if (form.dataset.busy === '1') return;
    if (typeof form.daurValidate === 'function' && !form.daurValidate()) return;
    const id = form.querySelector('[name="id"]').value;
    const qty = parseInt((form.querySelector('[name="quantity"]') || {}).value || '1', 10);
    form.dataset.busy = '1';
    btn.classList.add('is-loading');
    btn.setAttribute('aria-busy', 'true');
    const err = form.querySelector('[data-form-error]');
    if (err) { err.hidden = true; err.textContent = ''; }
    try {
      await D.cart.add([{ id: parseInt(id, 10), quantity: qty }], btn);
    } catch (ex) {
      if (err) { err.hidden = false; err.textContent = ex.message; } else D.toast(ex.message);
    } finally {
      form.dataset.busy = '0';
      btn.classList.remove('is-loading');
      btn.removeAttribute('aria-busy');
    }
  });

  /* ---------- predictive search ---------- */
  const sForm = $('[data-predictive-form]');
  if (sForm) {
    const input = $('[data-predictive-input]', sForm);
    const out = $('[data-predictive-results]');
    const live = $('[data-predictive-status]');
    const clear = $('[data-search-clear]', sForm);
    const initial = out.innerHTML;
    let timer, ctrl, active = -1;
    const options = () => $$('[role="option"]', out);
    const setActive = (n) => {
      const o = options();
      o.forEach((el) => el.setAttribute('aria-selected', 'false'));
      active = n;
      if (o[n]) { o[n].setAttribute('aria-selected', 'true'); input.setAttribute('aria-activedescendant', o[n].id); o[n].scrollIntoView({ block: 'nearest' }); }
      else input.removeAttribute('aria-activedescendant');
    };
    const run = async (q) => {
      if (ctrl) ctrl.abort();
      if (!q) { out.innerHTML = initial; input.setAttribute('aria-expanded', 'false'); clear.hidden = true; live.textContent = ''; return; }
      clear.hidden = false;
      ctrl = new AbortController();
      live.textContent = T.searching || 'Searching';
      try {
        const url = root + '/search/suggest?q=' + encodeURIComponent(q) + '&resources[type]=product,collection,page,article,query&resources[limit]=8&resources[options][unavailable_products]=last&section_id=predictive-search';
        const html = await fetch(url, { signal: ctrl.signal }).then((r) => r.text());
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const body = doc.querySelector('.search-suggest');
        out.innerHTML = body ? body.outerHTML : initial;
        input.setAttribute('aria-expanded', 'true');
        active = -1;
        const n = body ? parseInt(body.dataset.count || '0', 10) : 0;
        live.textContent = (T.results || '{{ count }} products found').replace('{{ count }}', n);
      } catch (err) { if (err.name !== 'AbortError') live.textContent = ''; }
    };
    input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(() => run(input.value.trim()), 220); });
    input.addEventListener('keydown', (e) => {
      const o = options();
      if (e.key === 'ArrowDown' && o.length) { e.preventDefault(); setActive(Math.min(active + 1, o.length - 1)); }
      else if (e.key === 'ArrowUp' && o.length) { e.preventDefault(); setActive(Math.max(active - 1, -1)); }
      else if (e.key === 'Enter' && active > -1 && o[active]) { e.preventDefault(); location.href = o[active].href; }
    });
    sForm.addEventListener('reset', () => setTimeout(() => { run(''); input.focus(); }, 0));
    document.addEventListener('daur:open', (e) => { if (e.detail.id === 'SearchModal' && input.value) run(input.value.trim()); });
  }

  /* ---------- footer: accordions on phones, open columns on desktop ---------- */
  const foot = $$('[data-footer-acc]');
  if (foot.length) {
    const mq = matchMedia('(min-width: 990px)');
    const sync = () => foot.forEach((d) => { if (mq.matches) d.setAttribute('open', ''); else d.removeAttribute('open'); });
    sync();
    mq.addEventListener('change', sync);
    foot.forEach((d) => d.querySelector('summary').addEventListener('click', (e) => { if (mq.matches) e.preventDefault(); }));
  }

  /* ---------- page headings get anchors so footer links like /pages/policies#exchange-policy land ---------- */
  $$('.rte h2, .rte h3').forEach((h) => {
    if (h.id) return;
    const id = h.textContent.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    if (id && !document.getElementById(id)) h.id = id;
  });
  if (location.hash) { const t = document.getElementById(decodeURIComponent(location.hash.slice(1))); if (t) setTimeout(() => t.scrollIntoView(), 0); }

  /* ---------- journal: links to guides that are not published yet become plain text ---------- */
  $$('[data-article-body]').forEach((body) => {
    const live = new Set((body.dataset.live || '').split(',').filter(Boolean));
    const prefix = '/blogs/' + body.dataset.blog + '/';
    $$('a[href]', body).forEach((a) => {
      let u; try { u = new URL(a.getAttribute('href'), location.origin); } catch (e) { return; }
      if (u.origin !== location.origin) return;
      const path = u.pathname.replace(root, '');
      if (!path.startsWith(prefix)) return;
      const handle = path.slice(prefix.length).split('/')[0];
      if (handle && !live.has(handle)) { const s = document.createElement('span'); s.textContent = a.textContent; a.replaceWith(s); }
    });
  });

  /* ---------- cookie choice through Shopify's Customer Privacy API ---------- */
  const consent = $('[data-consent]');
  if (consent) {
    let saved = '';
    try { saved = localStorage.getItem('daur.consent') || ''; } catch (e) { /* storage blocked */ }
    if (!saved) consent.hidden = false;
    consent.addEventListener('click', (e) => {
      const b = e.target.closest('[data-consent-choice]');
      if (!b) return;
      const all = b.dataset.consentChoice === 'all';
      try { localStorage.setItem('daur.consent', all ? 'all' : 'essential'); } catch (err) { /* ignore */ }
      const set = () => { try { window.Shopify.customerPrivacy.setTrackingConsent({ analytics: all, marketing: all, preferences: true, sale_of_data: false }, () => {}); } catch (err) { /* not available */ } };
      if (window.Shopify && window.Shopify.customerPrivacy) set();
      else if (window.Shopify && window.Shopify.loadFeatures) window.Shopify.loadFeatures([{ name: 'consent-tracking-api', version: '0.1' }], (err) => { if (!err) set(); });
      consent.hidden = true;
    });
  }

  D.ready = true;
})();
