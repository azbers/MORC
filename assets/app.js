/* DAUR Supply storefront.
   Runs as separate HTML pages (data-page on <body>) or as a single file
   preview (window.DAUR_MODE = 'spa', routes in the URL hash).
   Without a backend, the bag, wishlist and orders are kept in this
   browser's storage. See README.md for the production setup. */
(function () {
  'use strict';
  const C = window.DAUR_CONFIG;
  // on Shopify (theme/snippets/daur-data.liquid) the catalog and settings come from the store itself
  const SHOP = window.DAUR_SHOPIFY || null;
  // sample photos never show on the live theme, even if the review setting was left on when it was published
  try { if (window.Shopify && window.Shopify.theme && window.Shopify.theme.role === 'main') window.DAUR_TEST_PHOTOS = null; } catch (e) { /* keep */ }
  // the admin panel saves catalog edits in this browser; they replace the file catalog here
  if (!SHOP) try { const saved = JSON.parse(localStorage.getItem('daur.catalog') || 'null'); if (Array.isArray(saved) && saved.length) window.DAUR_PRODUCTS = saved; } catch (e) { /* storage blocked */ }
  // admin settings (Supply Control > Settings) override the file defaults
  C.fileWhatsapp = C.whatsapp;
  if (SHOP) C.followUp = Object.assign({ maxDiscount: 15, minProfit: 500, codeDays: 7, remindAfter: 2, priceDrop: true, askWhatsapp: true }, C.followUp || {});
  else try {
    const st = JSON.parse(localStorage.getItem('daur.settings') || 'null') || {};
    if (st.whatsapp) C.whatsapp = st.whatsapp;
    if (st.supportEmail) C.supportEmail = st.supportEmail;
    if (st.lowStockAt != null) C.lowStockAt = +st.lowStockAt;
    if (st.freeDeliveryPairs != null) C.freeDeliveryPairs = +st.freeDeliveryPairs;
    if (st.deliveryFee != null) C.delivery.fee = +st.deliveryFee;
    if (st.deliveryDays) C.delivery.days = st.deliveryDays;
    C.announce = st.announce || '';
    C.followUp = Object.assign({ maxDiscount: 15, minProfit: 500, codeDays: 7, remindAfter: 2, priceDrop: true, askWhatsapp: true }, st.followUp || {});
    const cps = JSON.parse(localStorage.getItem('daur.coupons') || 'null');
    if (cps && typeof cps === 'object') C.coupons = cps; // Admin > Discounts manages the codes
  } catch (e) { /* storage blocked */ }
  // Pakistani mobile numbers in one shape: 923XXXXXXXXX
  C.normPhone = (v) => { let d = String(v || '').replace(/\D/g, ''); if (d.startsWith('0092')) d = d.slice(2); if (d.startsWith('03')) d = '92' + d.slice(1); else if (d.startsWith('3') && d.length === 10) d = '92' + d; return /^923\d{9}$/.test(d) ? d : null; };
  const ic = (n, c) => (window.DAUR_ICON ? window.DAUR_ICON(n, c) : '');
  const ALL = window.DAUR_PRODUCTS;
  // only the lines on sale now (data.js audiences) reach the shop, and a line with no pairs is never shown
  C.audiences = (C.audiences || ['Men']).filter((a) => ALL.some((p) => !p.hidden && p.audience === a));
  const P = ALL.filter((p) => !p.hidden && C.audiences.includes(p.audience));
  // a review theme can carry sample photos (Unsplash) per pair to test layouts before real photos exist; never on the live theme
  if (window.DAUR_TEST_PHOTOS && window.DAUR_TEST_PHOTOS.products) ALL.forEach((p) => { const t = window.DAUR_TEST_PHOTOS.products[p.id]; if (t && t.length) p.variants.forEach((v) => { v.images = t.slice(); }); });
  // with one line the shop is organised by style (Sneakers, Leather, Hybrids) instead of by audience
  const ONE = C.audiences.length === 1 ? C.audiences[0] : null;
  const CATS = [...new Set(P.map((p) => p.category))].sort((a, b) => P.filter((p) => p.category === b).length - P.filter((p) => p.category === a).length);
  const catLabel = { Hybrids: 'Casual', Leather: 'Leather shoes' };
  const lineOf = (p) => ONE ? p.category : p.audience;
  const lineKey = (p) => lineOf(p).toLowerCase();
  const SPA = window.DAUR_MODE === 'spa';
  // links in shares, flex cards and messages follow whatever domain the site is served from;
  // data.js domain is only the fallback for the single file preview
  try { if (!SPA && !SHOP && /^https?:$/.test(location.protocol)) C.domain = (location.origin + location.pathname.replace(/\/[^/]*$/, '')).replace(/\/$/, ''); } catch (e) { /* keep data.js domain */ }
  const SHOE = window.DAUR_SHOE;
  const app = document.getElementById('app');

  /* ---------------- utilities ---------------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const NF = new Intl.NumberFormat('en-US'); // one formatter, reused: toLocaleString builds a new one on every call
  const fmt = (n) => C.currency + ' ' + NF.format(Math.round(n));
  const store = {
    get(k, d) { try { const v = localStorage.getItem('daur.' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('daur.' + k, JSON.stringify(v)); } catch (e) { /* storage blocked */ } if (SHOP && SHOP.forward) SHOP.forward(k, v); }
  };
  // phones show two pairs a row; the toggle in the shop toolbar switches to one pair a row with sizes (remembered)
  function gridOne(v) {
    if (v === undefined) return document.documentElement.classList.contains('grid-1');
    document.documentElement.classList.toggle('grid-1', v);
    try { localStorage.setItem('daur.grid', v ? '1' : '2'); } catch (e) { /* storage blocked */ }
  }
  const pages = { home: 'index.html', shop: 'shop.html', product: 'product.html', cart: 'cart.html', checkout: 'checkout.html', order: 'order.html', manifesto: 'manifesto.html', contract: 'contract.html', track: 'track.html', wishlist: 'wishlist.html', list: 'list.html', feed: 'feed.html', policies: 'policies.html', about: 'about.html', contact: 'contact.html', offers: 'offers.html', runway: 'runway.html', giving: 'giving.html', notfound: '404.html', admin: 'admin.html' };
  function link(page, param) {
    if (SHOP) return SHOP.link(page, param);
    if (SPA) return '#' + page + (param ? '.' + param : '');
    return pages[page] + (param ? '#' + param : '');
  }
  // full address of a page, for share links and messages
  function absLink(page, param) {
    if (SHOP) return C.domain + link(page, param);
    return C.domain + '/' + pages[page] + (param ? '#' + param : '');
  }
  function current() {
    if (SPA) {
      const h = location.hash.slice(1);
      const i = h.indexOf('.');
      const page = (i < 0 ? h : h.slice(0, i)) || 'home';
      return { page: pages[page] ? page : 'notfound', param: i < 0 ? '' : h.slice(i + 1) };
    }
    return { page: document.body.dataset.page || 'home', param: decodeURIComponent(location.hash.slice(1)) || (SHOP && SHOP.param) || '' };
  }

  /* ---------------- catalog helpers ---------------- */
  const prod = (id) => P.find((p) => p.id === id);
  const variant = (p, vid) => p.variants.find((v) => v.id === vid) || p.variants[0];
  const stockOf = (v) => Object.values(v.stock || {}).reduce((a, b) => a + b, 0);
  const onSale = (v) => v.compareAt && v.compareAt > v.price;
  const pct = (v) => onSale(v) ? Math.round((1 - v.price / v.compareAt) * 100) : 0;
  const minPrice = (p) => Math.min(...p.variants.map((v) => v.price));
  const anySale = (p) => p.variants.some(onSale);
  const maxPct = (p) => Math.max(...p.variants.map(pct));
  const audienceLabel = (p) => p.group ? p.audience + ' / ' + p.group : p.audience;
  const lineName = (k) => catLabel[k] || k;
  function visual(p, v, opts) {
    opts = opts || {};
    if (v.images && v.images.length) {
      const k = opts.mode === 'blueprint' ? 1 : opts.index || 0;
      const src = v.images[Math.min(k, v.images.length - 1)];
      return `<img src="${esc(/(cdn\.shopify\.com|\/cdn\/shop\/)/.test(src) && !/[?&]width=/.test(src) ? src + (src.includes('?') ? '&' : '?') + 'width=1000' : src)}" alt="${esc(p.name + ' in ' + v.color)}" width="1200" height="1200" loading="lazy" decoding="async">`;
    }
    return SHOE.render({ name: p.name, colorway: v.color, silhouette: p.silhouette, palette: v.palette }, opts);
  }

  /* ---------------- state ---------------- */
  let cart = store.get('cart', []);
  let wish = store.get('wish', []);
  let coupon = store.get('coupon', '');
  const saveCart = () => { store.set('cart', cart); store.set('coupon', coupon); paintCounts(); };
  const pairs = () => cart.reduce((a, l) => a + l.qty, 0);
  function lineData(l) {
    const p = prod(l.pid); if (!p) return null;
    const v = variant(p, l.vid);
    return { p, v, l, total: v.price * l.qty, was: (onSale(v) ? v.compareAt : v.price) * l.qty };
  }
  function totals(city) {
    const lines = cart.map(lineData).filter(Boolean);
    const subtotal = lines.reduce((a, d) => a + d.total, 0);
    const before = lines.reduce((a, d) => a + d.was, 0);
    let discount = 0, couponErr = '', cp = null;
    if (coupon && SHOP) { /* Shopify checks and applies the code at checkout */ }
    else if (coupon) {
      cp = C.coupons[coupon];
      const used = cp && cp.limit ? store.get('orders', []).filter((o) => o.coupon === coupon && o.status !== 'Cancelled').length : 0;
      // codes made for one customer only count the pairs they were made for
      const base = cp && cp.pids && cp.pids.length ? lines.filter((d) => cp.pids.includes(d.p.id)).reduce((a, d) => a + d.total, 0) : subtotal;
      if (!cp || cp.active === false) couponErr = 'That code is not active.';
      else if (cp.expires && new Date(cp.expires + 'T23:59:59') < new Date()) couponErr = 'That code has expired.';
      else if (cp.limit && used >= cp.limit) couponErr = 'That code has been fully used.';
      else if (!base) couponErr = 'This code is for other pairs.';
      else if (subtotal < (cp.min || 0)) couponErr = 'This code needs a subtotal of ' + fmt(cp.min) + '.';
      else discount = cp.type === 'percent' ? Math.round(base * cp.value / 100) : Math.min(cp.value, base);
    }
    const n = pairs();
    const free = n >= C.freeDeliveryPairs;
    const delivery = !n || free ? 0 : C.delivery.fee; // one flat fee for all of Pakistan
    const total = subtotal - discount + (delivery || 0);
    const retail = n * C.marketRetail;
    // what the buyer keeps: only money that really stays in their pocket (sale cut, code, delivery we carry)
    const shipKept = n && free ? C.delivery.fee : 0;
    const kept = before - subtotal + discount + shipKept;
    return { lines, subtotal, before, sale: before - subtotal, discount, couponErr, cp, delivery, free, total, retail, n, shipKept, kept };
  }
  /* ---- the slice: at least 5% of our profit on every pair goes to people in need ----
     C.give.on switches it everywhere, C.give.pct is the share of profit (at least 5).
     The share is of our profit, never of the price, and nothing is added to the price.
     Slices are pooled and given every quarter to verified cases; the records go on the Our giving page. */
  /* ---- selling: honest price framing, switched in Theme settings > Selling ----
     retailAnchor: the typical retail comparison; ladder: where a pair sits in the line (real prices of
     real pairs, dearest first); perWear: price per wear at this many days a week for a year (0 hides it). */
  const SELL = Object.assign({ retailAnchor: false, ladder: true, perWear: 3 }, C.sell || {});
  const GIVE = Object.assign({ on: true, pct: 5, causes: ['School fees', 'Medical bills', 'Food rations'], quarter: null }, C.give || {});
  GIVE.causes = (GIVE.causes || []).map((x) => String(x).trim()).filter(Boolean).slice(0, 4);
  // calendar quarter, for example "October to December 2026"; the giving happens at its end
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const quarterOf = (d) => { d = d || new Date(); const q = Math.floor(d.getMonth() / 3); return { key: d.getFullYear() + '-Q' + (q + 1), label: MONTHS[q * 3] + ' to ' + MONTHS[q * 3 + 2] + ' ' + d.getFullYear() }; };
  // the buyer's vote for this quarter's cause; it travels with the order (cart attribute "Slice cause" on Shopify)
  const sliceVote = (v) => { if (v === undefined) { const x = store.get('sliceVote', ''); return GIVE.causes.includes(x) ? x : ''; } store.set('sliceVote', v); };
  window.DAUR_SLICE_VOTE = () => (GIVE.on ? sliceVote() : '');
  function votePicker() {
    if (!GIVE.on || GIVE.causes.length < 2) return '';
    const cur = sliceVote();
    return `<fieldset class="sl-vote"><legend>Where should this quarter's slice go? <span>Your vote travels with your order.</span></legend>
      <div class="sl-opts">${GIVE.causes.map((c) => `<button type="button" class="sl-opt" data-vote="${esc(c)}" aria-pressed="${c === cur}">${esc(c)}</button>`).join('')}</div></fieldset>`;
  }
  function bindVote(root) {
    $$('.sl-opt', root || document).forEach((b) => b.addEventListener('click', () => {
      const v = b.getAttribute('aria-pressed') === 'true' ? '' : b.dataset.vote;
      sliceVote(v);
      $$('.sl-opt', root || document).forEach((x) => x.setAttribute('aria-pressed', x.dataset.vote === v));
      if (v) toast('Your vote: ' + v + '. Thank you.');
    }));
  }
  // a loaf seen from the side; the last slice is its own piece so the cut can lift it away
  let loafN = 0;
  function loaf(label, cls) {
    const k = 'lf' + (++loafN);
    const shape = 'M8 53 Q3 53 3 46 C2 30 12 12 34 8 C48 5 72 5 88 8 C108 12 118 28 117 46 Q117 53 111 53 Z';
    return `<svg class="loaf ${cls || ''}" viewBox="0 0 120 60" aria-hidden="true" focusable="false"><defs>
      <linearGradient id="${k}c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C98A4B"/><stop offset=".55" stop-color="#A4642F"/><stop offset="1" stop-color="#6E3E1C"/></linearGradient>
      <clipPath id="${k}a"><rect x="0" y="0" width="96" height="60"/></clipPath><clipPath id="${k}b"><rect x="96" y="0" width="24" height="60"/></clipPath></defs>
      <g class="lf-body" clip-path="url(#${k}a)"><path d="${shape}" fill="url(#${k}c)"/><path d="M26 18 q8 -4 14 3 M48 13 q8 -4 14 3 M70 13 q8 -4 14 3" fill="none" stroke="#F0D3A6" stroke-width="2.4" stroke-linecap="round" opacity=".75"/><rect class="lf-face" x="90" y="7" width="6" height="46" rx="1.5" fill="#F3E2C3"/></g>
      <g class="lf-slice" clip-path="url(#${k}b)"><path d="${shape}" fill="url(#${k}c)"/><rect class="lf-face" x="96" y="7" width="6" height="46" rx="1.5" fill="#F3E2C3"/></g>
      <g class="lf-crumbs" fill="#C98A4B"><circle cx="94.5" cy="54" r="1.3"/><circle cx="97.5" cy="55" r="1"/><circle cx="96" cy="53.5" r=".8"/></g>
      <line class="lf-knife" x1="96" y1="-2" x2="96" y2="58" pathLength="1"/>
      ${label ? `<text class="lf-amt" x="113" y="2" text-anchor="end">${esc(label)}</text>` : ''}
    </svg>`;
  }
  // the knife keeps cutting, live, while a loaf is on screen: the slice comes away with its share, goes, and the loaf is whole again.
  // Off screen it rests. With reduced motion the loaf simply shows the slice already cut. A tap starts the cut again.
  function cutWhenSeen(root) {
    const els = $$('.loaf:not(.mini)', root || document);
    if (!els.length) return;
    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) { els.forEach((e) => e.classList.add('cut')); return; }
    const io = new IntersectionObserver((es) => es.forEach((e) => e.target.classList.toggle('live', e.isIntersecting)), { threshold: 0.35 });
    els.forEach((e) => io.observe(e));
    els.forEach((e) => { const b = e.closest('[data-recut]'); if (b) b.addEventListener('click', () => { e.classList.toggle('live', false); void e.getBoundingClientRect(); e.classList.add('live'); }); });
  }
  function openSlice() {
    let m = document.getElementById('sliceSheet');
    if (!m) {
      document.body.insertAdjacentHTML('beforeend', '<div class="modal slice-m" id="sliceSheet" role="dialog" aria-modal="true" aria-label="The slice"><div class="panel"></div></div>');
      m = document.getElementById('sliceSheet');
      m.addEventListener('click', (e) => { if (e.target === m || e.target.closest('[data-close]')) m.classList.remove('on'); });
    }
    $('.panel', m).innerHTML = `<div class="field-label"><span>The slice</span><button class="x-btn" data-close>Close</button></div>
      <div class="sl-hero" data-recut>${loaf(GIVE.pct + '%', 'big')}</div>
      <h2 class="sl-h">A slice of this pair is not ours to keep.</h2>
      <p>On every pair we sell, we set aside at least ${GIVE.pct}% of the profit we make, not of the price you pay, and give it to verified cases of need that we check ourselves.</p>
      <ul class="sl-list"><li><b>Your price stays the same.</b> The slice comes out of our side, never added to yours.</li><li><b>Given every quarter.</b> We pool the slices and give them each quarter to verified cases of need, after our own checks.</li><li><b>Buyers choose the cause.</b> In your bag you can vote for where this quarter's slice goes. The cause with the most votes from buyers gets it.</li><li><b>Published in full.</b> The details of every giving go on this site and on our social pages, and every buyer of the quarter hears where their slice went.</li><li><b>No marketing budget.</b> The slice is given, not spent on ads.</li></ul>
      <blockquote class="hadith"><p>&ldquo;Charity does not decrease wealth.&rdquo;</p><cite>Prophet Muhammad &#xFDFA;, Sahih Muslim 2588</cite></blockquote>
      <a class="link" href="${link('giving')}">How our giving works</a>`;
    m.classList.add('on');
    cutWhenSeen(m);
  }
  function addToCart(pid, vid, size, qty) {
    const p = prod(pid), v = variant(p, vid);
    const max = (v.stock || {})[size] || 0;
    const ex = cart.find((l) => l.pid === pid && l.vid === v.id && l.size == size);
    const have = ex ? ex.qty : 0;
    const add = Math.min(qty || 1, max - have);
    if (add <= 0) { toast('No more stock in EU ' + size); return false; }
    if (ex) ex.qty += add; else cart.push({ pid, vid: v.id, size: +size, qty: add });
    saveCart();
    const n = pairs(), fee = C.delivery.fee || 0, gap = C.freeDeliveryPairs - n;
    const ship = !fee ? '' : gap === 1 ? ` One more pair and delivery is on us.` : gap <= 0 && n - add < C.freeDeliveryPairs ? ` Delivery is now on us: you keep ${fmt(fee)}.` : '';
    toast(ship ? `EU ${size} added.${ship}` : GIVE.on ? `${p.name}, EU ${size} added. A slice of it goes to someone in need.` : `${p.name}, EU ${size} added`, 'View bag', openBag);
    return true;
  }
  function toggleWish(pid) {
    const i = wish.indexOf(pid);
    // remember the price at the moment of the like, so a later price drop can be flagged
    const meta = store.get('wishMeta', {});
    if (i < 0) { wish.push(pid); const p = prod(pid); if (p) meta[pid] = { price: minPrice(p), at: new Date().toISOString() }; toast('Added to your liked pairs'); } else { wish.splice(i, 1); delete meta[pid]; toast('Removed from your liked pairs'); }
    store.set('wish', wish); store.set('wishMeta', meta); paintCounts();
    if (i < 0) hook('liked', { pid, count: wish.length });
    $$(`[data-wish="${pid}"]`).forEach((b) => b.setAttribute('aria-pressed', wish.includes(pid)));
  }
  function pushRecent(pid) {
    const r = store.get('recent', []).filter((x) => x !== pid);
    r.unshift(pid); store.set('recent', r.slice(0, 8));
  }

  /* ---------------- meta / SEO ---------------- */
  function setMeta(title, desc, ld) {
    if (!/DAUR Supply/.test(title)) title += ' | DAUR Supply';
    document.title = title;
    let m = $('meta[name="description"]');
    if (!m) { m = document.createElement('meta'); m.name = 'description'; document.head.appendChild(m); }
    m.content = desc;
    let og = $('meta[property="og:title"]'); if (og) og.content = title;
    let od = $('meta[property="og:description"]'); if (od) od.content = desc;
    let s = $('#ld-page');
    if (s) s.remove();
    // on Shopify the theme prints the structured data with the page itself (snippets/daur-ld.liquid), so search engines read it without running scripts
    if (ld && !SHOP) { s = document.createElement('script'); s.type = 'application/ld+json'; s.id = 'ld-page'; s.textContent = JSON.stringify(ld); document.head.appendChild(s); }
  }
  function crumbsLd(trail) {
    return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [['Home', absLink('home')]].concat(trail).map(([name, url], i) => Object.assign({ '@type': 'ListItem', position: i + 1, name }, url ? { item: url } : {})) };
  }

  /* ---------------- chrome ---------------- */
  const lineLinks = (ONE ? CATS : C.audiences).map((a) => ['shop', a.toLowerCase(), lineName(a)]);
  // the menu stays short: the styles live in the Shop all filters, and Offers and the Feed live in the footer
  const navItems = [['shop', '', 'Shop all'], ['shop', 'sneakers', 'Sneakers'], ['shop', 'hybrids', 'Casual'], ['shop', 'leather', 'Leather shoes'], ['shop', 'sale', 'Sale'], ['manifesto', '', 'Our story'], ['contract', '', 'Our promise']];
  const NAV_TOP = 5;
  function chrome() {
    // three promises a Pakistani buyer looks for first, held still so they can be read
    const tb = (C.announce ? [esc(C.announce)] : []).concat(['Cash on Delivery across Pakistan', 'Free delivery on ' + C.freeDeliveryPairs + ' pairs or more', C.exchangeDays ? C.exchangeDays + ' day size exchange' : '5 day size exchange']);
    // every live code from Content > Metaobjects > Offer rides in the bar and opens the Offers page
    let codes = [];
    try { codes = liveOffers().filter((o) => o.code).map((o) => `<a class="f-tb-code" href="${link('offers')}">Code <b>${esc(o.code)}</b>: ${esc(o.title)}</a>`); } catch (e) { codes = []; }
    const tbAll = codes.concat(tb), tbRun = tbAll.map((t) => `<span class="f-tb">${t}</span>`).join('<i aria-hidden="true">/</i>') + '<i aria-hidden="true">/</i>';
    const WORDMARK = '<svg class="wm" viewBox="-22 0 462 100" fill="currentColor" aria-hidden="true"><g transform="skewX(-12)" fill-rule="evenodd"><path d="M0,0 H50 A50,50 0 0 1 50,100 H0 Z M27,25 H50 A25,25 0 0 1 50,75 H27 Z"/><path transform="translate(110 0)" d="M0,100 L36,0 H72 L108,100 H79 L54,28 L29,100 Z"/><path transform="translate(226 0)" d="M0,0 H27 V52 A23,23 0 0 0 73,52 V0 H100 V52 A50,48 0 0 1 0,52 Z"/><path transform="translate(340 0)" d="M0,0 H62 A31,31 0 0 1 80,56 L102,100 H71 L51,62 H27 V100 H0 Z M27,20 H61 A11,11 0 0 1 61,42 H27 Z"/></g></svg>';
    // the page holds the header's room from the first paint (.hdr-ph), so nothing moves when the header arrives
    const ph = document.querySelector('.hdr-ph'); if (ph) ph.remove();
    document.body.insertAdjacentHTML('afterbegin', `
      ${hideDefs()}<div class="gridlines" aria-hidden="true"><div class="wrap"><span></span><span></span><span></span><span></span></div></div>
      <a class="sr-skip" href="#app" style="position:absolute;left:-999px">Skip to content</a>
      ${window.DAUR_TEST_PHOTOS ? '<div class="f-review" role="note">Review theme: sample photos from Unsplash for layout testing. They are not DAUR pairs.</div>' : ''}<div class="ticker f-tbar f-run" aria-label="Store notices"><div class="f-run-t">${tbRun}<span class="f-run-copy" aria-hidden="true">${tbRun}</span></div></div>
      <header class="hdr"><div class="wrap">
        <nav class="nav" aria-label="Primary">${navItems.slice(0, NAV_TOP).map(([pg, pr, t]) => `<a href="${link(pg, pr)}" data-nav="${pg}.${pr}"${pr === 'sale' ? ' class="nav-sale"' : ''}>${pr === 'sale' ? '<i aria-hidden="true"></i>' : ''}${t}</a>`).join('')}</nav>
        <button class="menu-btn" aria-label="Menu" aria-expanded="false" id="menuBtn"><span></span><span></span></button>
        <a class="logo" href="${link('home')}" aria-label="DAUR Supply home">${WORDMARK}<small>SUPPLY</small></a>
        <div class="hdr-r">
          <a class="nav-a link-hide mono mute" href="${link('manifesto')}" data-nav="manifesto.">Our story</a>
          <button class="icon-btn" id="themeBtn" aria-label="Switch to dark leather" aria-pressed="false">${ic('moon')}</button>
          <button class="icon-btn" id="searchBtn" aria-label="Search">${ic('search')}</button>
          <a class="icon-btn" href="${link('wishlist')}">${ic('heart')}<span class="sr-only">Liked pairs</span><span class="dot-count" id="wishCount">0</span></a>
          <button class="icon-btn" id="bagBtn">${ic('bag')}<span class="sr-only">Open bag, pairs:</span><span class="dot-count" id="bagCount">0</span></button>
        </div>
      </div></header>
      <nav class="mnav" aria-label="Mobile">${navItems.concat([['track', '', 'Track order']]).map(([pg, pr, t], i) => `<a href="${link(pg, pr)}"${pr === 'sale' ? ' class="nav-sale"' : ''}>${t}<span>0${i + 1}</span></a>`).join('')}</nav>`);
    document.body.insertAdjacentHTML('beforeend', `
      <footer class="ftr"><div class="wrap">
        <div class="ftr-brand"><a class="logo" href="${link('home')}" aria-label="DAUR Supply home">${WORDMARK}<small>SUPPLY</small></a>
          <p>${ONE === 'Men' ? 'Men\'s leather shoes and sneakers, crafted in Pakistan and finished with the DAUR mark. Made to be worn every day, paid for on delivery.' : 'Leather shoes and sneakers, crafted in Pakistan and finished with the DAUR mark. Made to be worn every day, paid for on delivery.'}</p>
          <div class="ftr-social"><a class="ilink" href="https://www.instagram.com/daursupply" target="_blank" rel="noopener me">${ic('instagram')}Instagram</a><a class="ilink" href="https://www.facebook.com/daursupply" target="_blank" rel="noopener me">${ic('facebook')}Facebook</a></div></div>
        <div class="ftr-col"><h2>Shop${ONE ? ' ' + esc(ONE) : ''}</h2>${lineLinks.map(([pg, pr, t]) => `<a href="${link(pg, pr)}">${esc(t)}</a>`).join('')}<a href="${link('shop', 'sale')}">Sale</a><a href="${link('shop', 'new')}">New in</a></div>
        <div class="ftr-col"><h2>Help</h2><a href="${link('contract', 'delivery')}">Delivery and COD</a><a href="${link('contract', 'exchanges')}">Exchanges</a><a href="${link('contract', 'sizing')}">Size guide</a><a href="${link('track')}">Track order</a><a href="${link('contract', 'faq')}">FAQ</a></div>
        <div class="ftr-col"><h2>House</h2><a href="${link('offers')}">Offers</a><a href="${link('feed')}">The Feed</a><a href="${link('manifesto')}">Our story</a><a href="${link('contract')}">Our promise</a>${GIVE.on ? `<a href="${link('giving')}">Our giving</a>` : ''}${SHOP ? '<a href="/pages/about">About us</a><a href="/pages/contact">Contact</a><a href="/blogs/journal">Journal</a>' : ''}<a href="${link('wishlist')}">Liked pairs</a><a href="${link('policies', 'terms')}">Terms of service</a><a href="${link('policies', 'privacy')}">Privacy policy</a><a href="${link('policies', 'refunds')}">Returns and refunds</a></div>
        <div class="ftr-col"><h2>Reach</h2><a class="ilink" href="https://wa.me/${esc(C.whatsapp)}?text=${encodeURIComponent('Assalam o Alaikum DAUR Supply, I have a question about an order.')}" target="_blank" rel="noopener">${ic('whatsapp')}Chat on WhatsApp</a><a class="ilink" href="tel:+${esc(C.whatsapp)}">${ic('phone')}${esc('0' + String(C.whatsapp).replace(/^92/, '').replace(/^(\d{3})(\d+)$/, '$1 $2'))}</a><span class="ilink">${ic('mail')}${esc(C.supportEmail)}</span><span class="ilink">${ic('pin')}Dispatch from Islamabad, delivering across Pakistan</span></div>
        <div class="ftr-big" aria-hidden="true">DAUR</div>
        <div class="ftr-base"><span>&copy; 2026 DAUR Supply. Crafted in Pakistan.</span><span>Payment: Cash on Delivery</span><span>Naya daur.</span></div>
      </div></footer>
      <div class="scrim" id="scrim"></div>
      <aside class="drawer" id="drawer" aria-label="Bag" aria-hidden="true" inert>
        <div class="drawer-h"><span class="mono">Your bag <span id="dCount"></span></span><button class="x-btn" id="bagClose">Close</button></div>
        <div class="drawer-b" id="dBody"></div>
        <div class="drawer-f" id="dFoot"></div>
      </aside>
      <div class="modal" id="search" role="dialog" aria-label="Search"><div class="panel">
        <div class="field-label"><span>Search DAUR</span><button class="x-btn" data-close>Close</button></div>
        <div class="inline-field"><input id="q" type="search" placeholder="Try black, derby, chelsea, sale" autocomplete="off"><button data-close>Esc</button></div>
        <div id="qres" class="mini-items" style="border:0"></div></div></div>
      <div class="modal" id="sizeGuide" role="dialog" aria-label="Size guide"><div class="panel">
        <div class="field-label"><span>Size guide</span><button class="x-btn" data-close>Close</button></div>${sizeTable()}
        <p class="mute" style="font-size:13px">Measure your foot heel to toe while standing, then pick the size whose length is equal or just above. Between sizes on leather pairs, go up.</p></div></div>
      <div class="toast" id="toast" role="status" aria-live="polite"><span id="toastT"></span></div>`);

    $('#menuBtn').addEventListener('click', () => { const o = document.body.classList.toggle('menu-open'); $('#menuBtn').setAttribute('aria-expanded', o); });
    $('#bagBtn').addEventListener('click', openBag);
    $('#bagClose').addEventListener('click', closeBag);
    $('#scrim').addEventListener('click', closeBag);
    $('#searchBtn').addEventListener('click', () => openModal('search'));
    // light leather is the default; the obsidian look stays one tap away and is remembered on this device
    const paintTheme = () => {
      const dark = document.documentElement.dataset.theme === 'dark', b = $('#themeBtn');
      b.innerHTML = ic(dark ? 'sun' : 'moon'); b.setAttribute('aria-pressed', dark); b.setAttribute('aria-label', dark ? 'Switch to light leather' : 'Switch to dark leather');
      const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = dark ? '#0c0907' : '#F5EEE4';
    };
    $('#themeBtn').addEventListener('click', () => {
      const dark = document.documentElement.dataset.theme !== 'dark';
      if (dark) document.documentElement.dataset.theme = 'dark'; else delete document.documentElement.dataset.theme;
      try { localStorage.setItem('daur.theme', dark ? 'dark' : 'light'); } catch (e) { /* private mode */ }
      paintTheme();
    });
    paintTheme();
    $$('.modal').forEach((m) => m.addEventListener('click', (e) => { if (e.target === m || e.target.closest('[data-close]')) m.classList.remove('on'); }));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeBag(); $$('.modal.on').forEach((m) => m.classList.remove('on')); } });
    $('#q').addEventListener('input', runSearch);
    paintCounts();
  }
  function sizeTable() {
    const sold = new Set(P.flatMap((p) => p.sizes));
    const rows = [[20, 12.5], [21, 13], [22, 13.5], [23, 14.5], [24, 15], [25, 15.5], [36, 22.5], [37, 23.5], [38, 24], [39, 25], [40, 25.5], [41, 26.5], [42, 27], [43, 28], [44, 28.5], [45, 29.5]].filter(([eu]) => sold.has(eu));
    const range = (eu) => eu < 30 ? 'Kids' : eu < 40 ? 'Women' : 'Men';
    return `<div style="overflow-x:auto"><table class="size-table"><thead><tr><th>EU</th><th>Foot length</th><th>UK</th>${ONE ? '' : '<th>Range</th>'}</tr></thead><tbody>${rows.map(([eu, cm]) => `<tr><td>${eu}</td><td>${cm} cm</td><td>${eu >= 36 ? (eu - 33.5).toFixed(1).replace('.0', '') : (eu - 16.5).toFixed(1).replace('.0', '') + ' C'}</td>${ONE ? '' : `<td>${range(eu)}</td>`}</tr>`).join('')}</tbody></table></div>`;
  }
  function openModal(id) { const m = $('#' + id); m.classList.add('on'); const i = $('input', m); if (i) setTimeout(() => i.focus(), 50); }
  function runSearch() {
    const q = $('#q').value.trim().toLowerCase();
    const res = $('#qres');
    if (!q) { res.innerHTML = ''; return; }
    const hits = [];
    P.forEach((p) => p.variants.forEach((v) => {
      const hay = [p.name, v.color, p.category, p.audience, p.group, p.description, onSale(v) ? 'sale' : ''].join(' ').toLowerCase();
      if (q.split(/\s+/).every((w) => hay.includes(w))) hits.push([p, v]);
    }));
    res.innerHTML = hits.length ? hits.slice(0, 8).map(([p, v]) => `<a class="mini-item" href="${link('product', p.id + '~' + v.id)}"><span class="th">${visual(p, v)}</span><span><b>${esc(p.name)}</b><br><span class="meta">${esc(v.color)} / ${esc(audienceLabel(p))}</span></span><span class="num">${fmt(v.price)}</span></a>`).join('') : '<p class="mute">No pair matches that yet. Try black, leather or sneakers.</p>';
  }
  function paintCounts() {
    const n = pairs();
    const b = $('#bagCount'); if (b) { b.textContent = n; b.classList.toggle('on', n > 0); }
    const w = $('#wishCount'); if (w) w.textContent = wish.length;
    paintDrawer();
  }
  function openBag() { paintDrawer(); document.body.classList.add('bag-open'); const d = $('#drawer'); d.setAttribute('aria-hidden', 'false'); d.inert = false; }
  function closeBag() { document.body.classList.remove('bag-open'); const d = $('#drawer'); if (d) { d.setAttribute('aria-hidden', 'true'); d.inert = true; } }
  let toastTimer;
  function toast(msg, action, fn) {
    const t = $('#toast'); if (!t) return;
    t.innerHTML = `${ic('check', 'tk')}<span>${esc(msg)}</span>` + (action ? `<button>${esc(action)}</button>` : '');
    if (action) $('button', t).onclick = () => { t.classList.remove('on'); fn(); };
    t.classList.add('on'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('on'), 3200);
  }
  // share sheet: every option is a plain link or a direct tap, so nothing depends on browser permissions
  function shareLink(url, title, text) {
    let m = document.getElementById('shareSheet');
    if (!m) { document.body.insertAdjacentHTML('beforeend', '<div class="modal share-m" id="shareSheet" role="dialog" aria-modal="true" aria-label="Share"><div class="panel"></div></div>'); m = document.getElementById('shareSheet'); }
    const msg = (text || title) + '\n' + url, e = encodeURIComponent;
    const panel = m.querySelector('.panel');
    panel.innerHTML = `<div class="field-label"><span>Share this pair</span><button class="x-btn" data-close>Close</button></div>
      <b class="share-t">${esc(title)}</b>
      <div class="share-g">
        <a class="share-o wa" href="https://wa.me/?text=${e(msg)}" target="_blank" rel="noopener">${ic('whatsapp')}<span>WhatsApp</span></a>
        <a class="share-o" href="https://www.facebook.com/sharer/sharer.php?u=${e(url)}" target="_blank" rel="noopener">${ic('share')}<span>Facebook</span></a>
        <a class="share-o" href="https://twitter.com/intent/tweet?text=${e(title)}&url=${e(url)}" target="_blank" rel="noopener">${ic('send')}<span>X</span></a>
        <a class="share-o" href="mailto:?subject=${e(title)}&body=${e(msg)}">${ic('mail')}<span>Email</span></a>
        ${navigator.share ? `<button class="share-o" data-native>${ic('arrow')}<span>More apps</span></button>` : ''}
      </div>
      <div class="share-copy"><input readonly value="${esc(url)}" aria-label="Link"><button class="btn volt" data-copy>Copy link</button></div>`;
    const close = () => m.classList.remove('on');
    m.onclick = (ev) => { if (ev.target === m || ev.target.closest('[data-close]')) close(); };
    const inp = panel.querySelector('input');
    panel.querySelector('[data-copy]').onclick = () => {
      const done = () => { toast('Link copied'); panel.querySelector('[data-copy]').textContent = 'Copied'; };
      const manual = () => { inp.focus(); inp.select(); try { if (document.execCommand('copy')) { done(); return; } } catch (er) { /* blocked */ } toast('Press Ctrl+C to copy the selected link'); };
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, manual); else manual();
    };
    const nat = panel.querySelector('[data-native]');
    if (nat) nat.onclick = () => navigator.share({ title, text: text || title, url }).catch((er) => { if (!er || er.name !== 'AbortError') toast('This browser blocked the app list. Use the options above.'); });
    m.classList.add('on');
  }
  // "You kept": the real money that stays with the buyer on this bag, line by line, never a made up figure
  function keptBox(t) {
    const rows = [];
    if (t.sale) rows.push(['Sale prices', t.sale]);
    if (t.discount) rows.push([coupon || 'Code', t.discount]);
    if (t.shipKept) rows.push(['Delivery on us', t.shipKept]);
    if (!rows.length) return '';
    return `<div class="kept" role="status"><div class="kept-h"><span>You kept</span><b class="num">${fmt(t.kept)}</b></div><ul>${rows.map(([k, x]) => `<li><span>${esc(k)}</span><span class="num">${fmt(x)}</span></li>`).join('')}</ul></div>`;
  }
  // price per wear, as an honest conditional: this price, worn this many days a week for one year
  function perWear(price) {
    if (!(SELL.perWear > 0) || !price) return '';
    const d = SELL.perWear;
    return `<p class="per-wear mono">About ${fmt(Math.round(price / (d * 52)))} a wear, worn ${d} day${d > 1 ? 's' : ''} a week for a year</p>`;
  }
  // where this pair sits in the line: real prices of real pairs, dearest first, this pair in the middle when it can be
  function ladder(p, v) {
    if (!SELL.ladder) return '';
    const rows = P.filter((x) => x.audience === p.audience && x.variants.some(stockOf)).map((x) => ({ x, price: x.id === p.id ? v.price : minPrice(x) }));
    if (!rows.some((r) => r.x.id === p.id)) rows.push({ x: p, price: v.price });
    if (rows.length < 3) return '';
    rows.sort((a, b) => b.price - a.price || a.x.name.localeCompare(b.x.name));
    const i = rows.findIndex((r) => r.x.id === p.id);
    const from = Math.max(0, Math.min(i - 1, rows.length - 3));
    const pick = rows.slice(from, from + 3);
    return `<div class="ladder"><div class="field-label"><span>Where it sits in the line</span><span>Real prices, dearest first</span></div><ol>${pick.map((r) => {
      const me = r.x.id === p.id, d = r.price - v.price;
      return `<li${me ? ' class="me" aria-current="true"' : ''}>${me ? `<span class="ld-n">${esc(r.x.name)}</span>` : `<a class="ld-n" href="${link('product', r.x.id)}">${esc(r.x.name)}</a>`}<span class="ld-t mono">${me ? 'This pair' : esc(lineName(r.x.category))}</span><span class="ld-p num">${fmt(r.price)}</span>${me ? '' : `<span class="ld-d mono">${d > 0 ? '+' : '&minus;'}${fmt(Math.abs(d))}</span>`}</li>`;
    }).join('')}</ol></div>`;
  }
  function freeMeter(n) {
    const need = Math.max(0, C.freeDeliveryPairs - n);
    const fee = C.delivery.fee || 0;
    return `<div class="free-meter"><span class="mono">${need ? `Add ${need} more pair${need > 1 ? 's' : ''} and delivery is on us${fee ? `: you keep ${fmt(fee)}` : ''}` : `<span class="volt">Delivery is on us${fee ? `. You keep ${fmt(fee)}` : ''}</span>`}</span><div class="minibar"><i class="v" style="width:${Math.min(100, n / C.freeDeliveryPairs * 100)}%"></i></div></div>`;
  }
  function lineHTML(d, big) {
    const { p, v, l } = d; const max = (v.stock || {})[l.size] || 0;
    return `<div class="line-item" data-line="${l.pid}|${l.vid}|${l.size}">
      <a class="th" href="${link('product', p.id + '~' + v.id)}">${visual(p, v)}</a>
      <div class="li-body"><div class="li-top"><b>${esc(p.name)}</b><span>${fmt(d.total)}</span></div>
      <div class="li-meta">${esc(v.color)} / EU ${l.size} / ${fmt(v.price)} each ${onSale(v) ? `<span class="strike">${fmt(v.compareAt)}</span>` : ''}</div>
      ${l.qty >= max ? `<div class="li-meta volt">Last ${max} in this size</div>` : ''}
      <div class="li-ctl"><div class="qty sm"><button data-q="-1" aria-label="Decrease">&minus;</button><output>${l.qty}</output><button data-q="1" aria-label="Increase" ${l.qty >= max ? 'disabled' : ''}>+</button></div>
      <span style="display:flex;gap:14px">${big ? `<button class="rm" data-mv>Move to liked</button>` : ''}<button class="rm" data-rm>Remove</button></span></div></div></div>`;
  }
  function bindLines(root) {
    $$('[data-line]', root).forEach((row) => {
      const [pid, vid, size] = row.dataset.line.split('|');
      const l = cart.find((x) => x.pid === pid && x.vid === vid && String(x.size) === size);
      if (!l) return;
      $$('[data-q]', row).forEach((b) => b.addEventListener('click', () => {
        const max = (variant(prod(pid), vid).stock || {})[size] || 0;
        l.qty = Math.max(0, Math.min(max, l.qty + +b.dataset.q));
        if (!l.qty) cart.splice(cart.indexOf(l), 1);
        saveCart(); rerender();
      }));
      $('[data-rm]', row).addEventListener('click', () => { cart.splice(cart.indexOf(l), 1); saveCart(); rerender(); toast('Removed from bag'); });
      const mv = $('[data-mv]', row);
      if (mv) mv.addEventListener('click', () => { cart.splice(cart.indexOf(l), 1); if (!wish.includes(pid)) wish.push(pid); store.set('wish', wish); saveCart(); rerender(); toast('Moved to wishlist'); });
    });
  }
  function paintDrawer() {
    const body = $('#dBody'); if (!body) return;
    const t = totals();
    $('#dCount').textContent = t.n ? `(${t.n})` : '';
    if (!t.lines.length) {
      body.innerHTML = `<div class="empty"><span class="mono">The bag is empty</span><a class="btn ghost" href="${link('shop')}">Browse Drop 01</a></div>`;
      $('#dFoot').innerHTML = ''; return;
    }
    body.innerHTML = freeMeter(t.n) + t.lines.map((d) => lineHTML(d)).join('');
    $('#dFoot').innerHTML = `
      ${t.sale ? `<div class="sum-row save"><span>Sale savings</span><span>&minus; ${fmt(t.sale)}</span></div>` : ''}
      <div class="sum-row total"><span>Subtotal</span><span>${fmt(t.subtotal)}</span></div>
      ${keptBox(t)}${SELL.retailAnchor ? `<div class="sum-row mute" style="font-size:12px"><span>Saved against typical retail of ${fmt(C.marketRetail)} a pair</span><span class="volt">${fmt(t.retail - t.subtotal)}</span></div>` : ''}
      <a class="btn volt block" href="${link('checkout')}">Checkout, Cash on Delivery <span class="arr">&rarr;</span></a>
      <a class="btn ghost block" href="${link('cart')}">View full bag</a>`;
    bindLines(body);
  }
  let rerender = () => { paintCounts(); };

  /* ---------------- shared blocks ---------------- */
  // marked down pairs carry a tag cut from a hide, hung on a leather thong through a brass eyelet;
  // the shape, grain and stitching live once in #hideDefs (chrome) and every tag reuses them
  const HIDE = 'M38 10C46 14 52 8 60 9C68 8 75 14 83 10C91 6 97 3 102 9C107 14 101 22 106 28C111 34 118 35 117 45C116 55 106 57 106 67C106 77 116 81 114 93C112 104 101 101 97 109C93 117 99 122 88 122C78 122 72 115 60 115C48 115 41 122 31 121C21 120 28 115 23 108C19 100 8 104 6 92C4 80 14 76 14 66C14 56 4 54 3 44C2 34 10 34 15 28C20 22 13 13 18 8C24 2 30 6 38 10Z';
  const hideDefs = () => `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>
    <radialGradient id="hideFill" cx="42%" cy="34%" r="78%"><stop offset="0" stop-color="#D49A62"/><stop offset=".55" stop-color="#B7773F"/><stop offset="1" stop-color="#8A5128"/></radialGradient>
    <filter id="hideGrain" x="0" y="0" width="1" height="1"><feTurbulence type="fractalNoise" baseFrequency=".55" numOctaves="2" seed="7" result="n"/><feDiffuseLighting in="n" surfaceScale="1.3" lighting-color="#fff" result="l"><feDistantLight azimuth="235" elevation="58"/></feDiffuseLighting><feComposite in="l" in2="SourceGraphic" operator="in"/></filter>
    <path id="hideShape" d="${HIDE}"/></defs></svg>`;
  function priceTag(v) {
    return `<span class="ptag" aria-label="${pct(v)} percent off, save ${fmt(v.compareAt - v.price)}"><svg class="ptag-thong" viewBox="0 0 40 70" aria-hidden="true"><path d="M20 0C20 28 11 40 13 56C14 65 26 65 27 56C29 40 20 28 20 0" fill="none" stroke="#4A2A18" stroke-width="3.4" stroke-linecap="round"/><path d="M20 0C20 28 11 40 13 56" fill="none" stroke="#A36A3C" stroke-width="1.1" stroke-linecap="round" opacity=".85"/></svg>
      <span class="ptag-b"><svg class="ptag-hide" viewBox="0 0 120 124" aria-hidden="true"><use href="#hideShape" fill="url(#hideFill)" stroke="#5A3420" stroke-width="1.6"/><use href="#hideShape" filter="url(#hideGrain)" class="ptag-grain"/><use href="#hideShape" fill="none" stroke="#F3DCC0" stroke-opacity=".55" stroke-width=".9" stroke-dasharray="2.6 2.2" transform="translate(60 64) scale(.86) translate(-60 -64)"/><circle cx="60" cy="22" r="5.4" fill="#C9A063" stroke="#6B4A22" stroke-width="1.2"/><circle cx="60" cy="22" r="2.8" fill="#2B1A12"/></svg>
      <b>&minus;${pct(v)}%</b><small>Save ${fmt(v.compareAt - v.price)}</small><em>Sale</em></span></span>`;
  }
  function card(p, i, vSel) {
    const v = vSel || p.variants[0];
    const sz = p.sizes.map((s) => { const n = (v.stock || {})[s] || 0; return `<button class="size" data-s="${s}" ${n ? '' : 'disabled aria-disabled="true"'} aria-pressed="false" aria-label="EU ${s}${n ? '' : ', sold out'}">${s}</button>`; }).join('');
    const tag = onSale(v) || /^drop/i.test(p.tag || '') ? '' : `<span class="chip ${p.tag === 'Limited' ? 'v' : ''}">${esc(p.tag)}</span>`;
    const ratio = v.price / C.marketRetail * 100;
    const pw = SELL.perWear > 0 ? Math.round(v.price / (SELL.perWear * 52)) : 0;
    const low = stockOf(v) <= 6 && stockOf(v) > 0;
    return `<article class="card" data-pid="${p.id}" data-vid="${v.id}">
      <a class="card-media" href="${link('product', p.id + '~' + v.id)}"><span class="sr-only">${esc(p.name)} ${esc(v.color)}</span>
        <span aria-hidden="true">${onSale(v) ? priceTag(v) : `<span class="tag">${tag}</span>`}</span><span class="idx" aria-hidden="true">${String(i + 1).padStart(2, '0')} / ${esc(lineName(lineOf(p))).toUpperCase()}</span>
        <span class="layer rn">${visual(p, v)}</span><span class="layer bp">${visual(p, v, { mode: 'blueprint' })}</span></a>
      <div class="card-body">
        <div class="card-top"><h3><a href="${link('product', p.id + '~' + v.id)}">${esc(p.name)}</a></h3><span class="price">${fmt(v.price)}</span></div>
        ${window.DAUR_EXT && window.DAUR_EXT.cardExtra ? window.DAUR_EXT.cardExtra(p) : ''}
        <div class="card-sub"><span>${esc(v.color)}</span>${onSale(v) ? `<span class="was strike">${fmt(v.compareAt)}</span>` : SELL.retailAnchor ? `<span class="was">Retail <span class="strike">${Math.round(C.marketRetail).toLocaleString('en-US')}+</span></span>` : pw ? `<span class="was">About ${fmt(pw)} a wear</span>` : ''}</div>
        <div class="swatches">${p.variants.map((x) => `<button class="sw-b" style="--c:${x.hex}" data-v="${x.id}" aria-pressed="${x.id === v.id}" aria-label="${esc(x.color)}"></button>`).join('')}<span class="mono mute" style="font-size:10px">${p.variants.length} colour${p.variants.length > 1 ? 's' : ''}</span></div>
        ${SELL.retailAnchor ? `<div class="minibar" title="Our price against typical retail"><i class="v" style="width:${ratio}%"></i></div>` : ''}
        <div class="sizes">${sz}</div>
        <div class="card-acts"><button class="card-add" data-add>${stockOf(v) ? 'Select size' : 'Sold out'}</button><button class="card-add wish-b" data-wish="${p.id}" aria-pressed="${wish.includes(p.id)}" aria-label="Save to wishlist">${ic('heart', 'h-o')}${ic('heartFill', 'h-f')}</button></div>
        ${low ? `<span class="mono volt" style="font-size:10px">Only ${stockOf(v)} pairs left</span>` : ''}
      </div></article>`;
  }
  function bindCards(root) {
    $$('.card', root).forEach((c) => {
      let size = null;
      const pid = c.dataset.pid;
      $$('.size', c).forEach((b) => b.addEventListener('click', () => {
        $$('.size', c).forEach((x) => x.setAttribute('aria-pressed', 'false'));
        b.setAttribute('aria-pressed', 'true'); size = b.dataset.s;
        const a = $('[data-add]', c); a.textContent = 'Add EU ' + size + ' to bag'; a.classList.remove('err');
      }));
      $('[data-add]', c).addEventListener('click', () => {
        const a = $('[data-add]', c);
        if (!size) { a.textContent = 'Pick a size first'; a.classList.add('err'); return; }
        if (addToCart(pid, c.dataset.vid, size, 1)) { a.textContent = 'Added'; setTimeout(() => { a.textContent = 'Add EU ' + size + ' to bag'; }, 1400); }
      });
      $('[data-wish]', c).addEventListener('click', () => toggleWish(pid));
      // hovering a swatch previews the pair in that colour, clicking keeps it
      const media = $('.card-media', c);
      const preview = (vid) => {
        const p = prod(pid), x = variant(p, vid); if (!x) return;
        const rn = $('.layer.rn', media), bp = $('.layer.bp', media);
        rn.innerHTML = visual(p, x); bp.innerHTML = visual(p, x, { mode: 'blueprint' });
        rn.classList.remove('swap'); void rn.offsetWidth; rn.classList.add('swap');
        const sub = $('.card-sub span', c); if (sub) sub.textContent = x.color;
      };
      const sws = $$('.sw-b', c);
      sws.forEach((b) => b.addEventListener('mouseenter', () => { c.classList.add('pv'); if (b.dataset.v !== c.dataset.prev) { c.dataset.prev = b.dataset.v; preview(b.dataset.v); } }));
      if (sws.length) sws[0].parentNode.addEventListener('mouseleave', () => { c.classList.remove('pv'); if (c.dataset.prev && c.dataset.prev !== c.dataset.vid) { c.dataset.prev = c.dataset.vid; preview(c.dataset.vid); } });
      $$('.sw-b', c).forEach((b) => b.addEventListener('click', () => {
        const p = prod(pid); const i = $$('.card', c.parentNode).indexOf(c);
        const tmp = document.createElement('div'); tmp.innerHTML = card(p, i, variant(p, b.dataset.v));
        const nc = tmp.firstElementChild; c.replaceWith(nc); bindCards({ querySelectorAll: () => [nc] });
      }));
    });
  }
  // a WhatsApp chat with the order line, opened with a first line already typed; nothing is collected on the site
  const waChat = (text) => `https://wa.me/${esc(C.whatsapp)}?text=${encodeURIComponent(text)}`;
  // written guides under each collection: real answers to what men here ask before they buy, shown on the page for everyone
  const sizeSpan = () => { const s = P.flatMap((p) => p.sizes).filter((n) => n >= 36); return s.length ? 'EU ' + Math.min(...s) + ' to ' + Math.max(...s) : 'EU sizes'; };
  const GUIDE = {
    all: { e: 'The guide', h: (ONE === 'Men' ? 'Men\'s' : 'Leather') + ' shoes, crafted in Pakistan.', b: [
      ['', 'DAUR Supply makes shoes for men who notice the details. The collection covers leather sneakers and joggers for every day, full grain formal shoes and chelsea boots for the moments that matter, and casual slip ons that move between the two. Every pair is checked by hand before it earns the DAUR seal.'],
      ['How to choose', 'For daily wear with jeans or chinos, start with a court low or a trainer. For the office, a wedding or a shalwar kameez, a black derby or a chelsea boot carries the look. For long days on your feet, a moc toe runner gives you leather with a cushioned sole.'],
      ['Sizes, delivery and payment', () => `Pairs run in ${sizeSpan()}. Measure your foot heel to toe and match it to the size guide; between sizes, go up. We deliver to every city in Pakistan with Cash on Delivery, dispatch within 24 hours of confirming your order, and offer a 5 day size exchange on full price pairs.`]],
      faq: [['Which shoes go best with shalwar kameez?', 'A black or dark brown leather pair keeps it sharp: a chelsea boot or a derby for formal days and weddings, a slip on for Fridays and family visits. A shoe darker than the kameez always looks considered.'],
        ['What is the difference between sneakers and joggers?', 'In Pakistan, joggers usually means sporty sneakers. Our sneakers range covers clean leather court lows for everyday style and lighter trainers for walking and travel.']] },
    sneakers: { e: 'Sneaker guide', h: 'Sneakers and joggers for men.', b: [
      ['', 'Sneakers are the pair you wear most, so they have to look right with everything. The DAUR range runs from clean leather court lows to suede and mesh trainers and a structured high top, each on a rubber sole that is bonded and pull tested before it is sealed.'],
      ['Leather or mesh?', 'Smooth leather court lows are the most versatile: they dress up with chinos and a shirt, and they wipe clean with a damp cloth. Suede and mesh trainers are lighter and breathe better in the heat, which makes them the better pick for long walks, travel and summer.'],
      ['Fit and care', 'Start with your usual size and check it against the size guide. Wipe leather after wear, brush suede once it is dry, and let a pair rest a day between wears so it keeps its shape.']],
      faq: [['Are DAUR sneakers good for daily use?', 'Yes. They are built for everyday wear on city streets, with rubber outsoles and padded collars. For running and sport, choose a dedicated performance shoe.']] },
    leather: { e: 'Leather guide', h: 'Leather and formal shoes for men.', b: [
      ['', 'A good leather shoe is the quiet signature of a well dressed man. DAUR formal shoes and chelsea boots are cut from full grain leather, the top grade of the hide, and set on rubber soles that stay comfortable from the morning meeting to the last dinner of a wedding night.'],
      ['Derby or chelsea?', 'A black derby is the most useful formal shoe a man can own: it works with a suit, with trousers and a blazer, and with a shalwar kameez and waistcoat. A chelsea boot slips on in seconds, looks sharp with slim trousers and jeans, and carries winter and wedding season with ease.'],
      ['Caring for full grain', 'Leather creases where your foot flexes. That is how it should be. Wipe it clean, condition it every few weeks and keep it out of direct heat, and the leather will age into something better.']],
      faq: [['Are these real leather shoes?', 'Yes. The upper of every pair in this range is full grain leather, listed in the specs of each product along with the lining and sole.'],
        ['Which formal shoes suit a wedding?', 'For the baraat and walima, a polished black derby or a waxed chelsea boot looks sharp with a sherwani, a prince coat or a shalwar kameez and waistcoat.']] },
    hybrids: { e: 'Casual guide', h: 'Casual shoes for men.', b: [
      ['', 'Casual shoes do the most work in a man\'s week. The DAUR casual range sits between a sneaker and a formal shoe: a full grain moc toe runner with a cushioned sole and a soft nappa slip on with elastic gores, both easy with jeans, chinos or a shalwar kameez.'],
      ['Built for the whole day', 'Leather uppers breathe and mould to your foot, and rubber soles grip on tile and road. A slip on goes on in a second, which makes it the pair to keep by the door for the mosque, the market and the office.']],
      faq: [['Do leather slip ons stretch?', 'Leather softens and gives a little with wear, so choose a snug fit on day one. Elastic gores keep the shoe secure as it settles.']] },
    sale: { e: 'About the sale', h: 'Men\'s shoes on sale.', b: [
      ['', 'These are price cuts on current pairs, with the original price shown beside the new one. Sale pairs carry the same checks, the same DAUR seal and the same 30 day defect cover as the rest of the collection. Sale pairs cannot be exchanged for size, so please check the size guide before you order.']],
      faq: [['How long does the sale last?', 'Sale prices hold while sizes last. A sold out size is marked sold out on every page.']] },
    new: { e: 'New in', h: 'New arrivals for men.', b: [['', 'The newest pairs to earn the DAUR seal, with the latest first. Every one ships with Cash on Delivery to every city in Pakistan.']] }
  };
  GUIDE.men = GUIDE.all;
  function guide(g) {
    if (!g) return '';
    return `<section class="sheet x guide"><div class="wrap"><div class="guide-g">
      <div class="guide-h rv"><span class="eyebrow">${esc(g.e)}</span><h2>${esc(g.h)}</h2>${g.img && simg(g.img) ? `<figure class="guide-fig">${photo(g.img, g.alt || '', { sizes: '(max-width: 860px) 100vw, 40vw' })}</figure>` : ''}</div>
      <div class="guide-b">${g.b.map(([h, t]) => `${h ? `<h3>${esc(h)}</h3>` : ''}<p>${esc(typeof t === 'function' ? t() : t)}</p>`).join('')}
        ${g.faq ? `<div class="faq">${g.faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>` : ''}
        ${g.l ? `<div class="guide-l">${g.l.map(([u, t]) => `<a class="chip" href="${u}">${esc(t)} ${ic('arrow')}</a>`).join('')}</div>` : ''}</div>
    </div></div></section>`;
  }
  // "Find your pair" tiles: hovering a tile walks through the pairs of that style; on a phone each tile walks on its own while it is on screen
  function cycleTiles(root) {
    const calm = matchMedia('(prefers-reduced-motion: reduce)').matches, hover = matchMedia('(hover: hover) and (pointer: fine)').matches;
    $$('.f-cyc', root).forEach((t) => {
      const items = $$('.f-cy', t), dots = $$('.f-cy-d i', t), name = $('.f-cy-n', t);
      if (items.length < 2) return;
      let i = 0, timer = 0;
      const step = () => {
        const prev = items[i]; i = (i + 1) % items.length;
        prev.classList.remove('on'); prev.classList.add('off');
        setTimeout(() => prev.classList.remove('off'), 700);
        items[i].classList.add('on');
        dots.forEach((d, j) => d.classList.toggle('on', j === i));
        if (name) name.textContent = items[i].dataset.n;
      };
      const start = (wait) => { if (!timer) { step(); timer = setInterval(step, wait); } };
      const stop = () => { clearInterval(timer); timer = 0; };
      if (hover) { t.addEventListener('mouseenter', () => start(1300)); t.addEventListener('mouseleave', stop); t.addEventListener('focus', () => start(1300)); t.addEventListener('blur', stop); }
      else if (!calm && 'IntersectionObserver' in window) new IntersectionObserver(([e]) => { if (e.isIntersecting) start(2600); else stop(); }, { threshold: 0.5 }).observe(t);
    });
  }
  function head(eyebrow, title, aside, lede) {
    return `<div class="shead rv"><span class="eyebrow">${eyebrow}</span><h2>${title}</h2>${aside ? `<div class="aside">${aside}</div>` : ''}${lede ? `<p class="lede">${lede}</p>` : ''}</div>`;
  }

  /* ---- brand foundation: the story, the four pillars and the photographs that carry them ----
     Real photos are set in Theme settings > Brand photos (C.img). A review theme may also carry sample photos
     (window.DAUR_TEST_PHOTOS, Unsplash, for layout testing only); they never load on the live theme. */
  const TP = window.DAUR_TEST_PHOTOS || null;
  const simg = (k) => (C.img && C.img[k]) || (TP && TP.site && TP.site[k]) || '';
  // Shopify's image server resizes on request, so phones download a small file and wide screens a sharp one
  const cdnW = (src, w) => /(cdn\.shopify\.com|\/cdn\/shop\/)/.test(src) && !/[?&]width=/.test(src) ? src + (src.includes('?') ? '&' : '?') + 'width=' + w : src;
  const srcset = (src) => /(cdn\.shopify\.com|\/cdn\/shop\/)/.test(src) ? [480, 800, 1200, 1800].map((w) => cdnW(src, w) + ' ' + w + 'w').join(', ') : '';
  function photo(k, alt, o) {
    o = o || {};
    const src = typeof k === 'string' && !/[/.]/.test(k) ? simg(k) : k;
    if (!src) return '';
    const ss = srcset(src);
    return `<img src="${esc(cdnW(src, 1200))}"${ss ? ` srcset="${esc(ss)}" sizes="${esc(o.sizes || '100vw')}"` : ''} alt="${esc(alt || '')}" width="1600" height="1200" ${o.eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
  }
  const STORY = 'In the workshops of Lahore, Sialkot and Kasur, skilled hands make fine leather shoes every day. Too often that work leaves the bench without a name, and the buyer pays for a label instead. DAUR exists to change that. We visit the workshops, choose finished pairs at the bench, check every pair by hand, finish it with our own hardware and bring it to your door at an honest price.';
  const PILLARS = [
    { i: 'pin', t: 'Local craft', d: 'Chosen at the bench in Lahore, Sialkot and Kasur. The money stays with Pakistani craftspeople.' },
    { i: 'check', t: 'Checked by hand', d: 'Six checks on every pair, from the flex of the upper to the bond of the sole, before it earns the DAUR seal.' },
    { i: 'tag', t: 'Honest price', d: 'You pay for the shoe, not for a label. Real prices only, and a sale price is always a price we really charged.' },
    { i: 'spark', t: 'The slice', d: 'At least 5% of our profit, given every quarter to verified people in need, and published.' }
  ];
  const STEPS = [
    { k: 'workshop', i: 'pin', t: 'Chosen at the bench', d: 'We visit workshops in Lahore, Sialkot and Kasur and choose finished pairs where they are made.' },
    { k: 'checked', i: 'check', t: 'Checked by hand', d: 'Stitching, leather grain, sole bond and comfort, pair by pair. A pair that fails a check does not ship.' },
    { k: 'door', i: 'truck', t: 'At your door', d: 'Finished with our hardware, sealed, boxed and dispatched from Islamabad within 24 hours. You pay when it reaches you.' }
  ];
  function lastGiving() {
    const rec = (Array.isArray(window.DAUR_GIVING) ? window.DAUR_GIVING : []).filter((r) => r && +r.amount > 0).sort((a, b) => String(b.date).localeCompare(String(a.date)));
    if (!rec.length) return '<p class="f-slice-note mono">The first giving is published at the end of this quarter.</p>';
    const r = rec[0], d = new Date(r.date + 'T12:00:00');
    return `<p class="f-slice-note mono">Latest: ${esc(fmt(+r.amount))}${r.where ? ' to ' + esc(r.where) : ''}${isNaN(d) ? '' : ', ' + esc(d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }))}</p>`;
  }

  /* ---------------- views ---------------- */
  const V = {};

  V.home = function () {
    setMeta(ONE === 'Men' ? 'Men\'s Shoes Online in Pakistan | Leather Shoes & Sneakers | DAUR Supply' : 'Leather Shoes & Sneakers Online in Pakistan | DAUR Supply', (ONE === 'Men' ? 'Men\'s leather shoes, sneakers, chelsea boots and casual shoes' : 'Leather shoes and sneakers') + ' from workshops in Lahore, Sialkot and Kasur, checked pair by pair by DAUR Supply. Cash on Delivery across Pakistan, dispatch within 24 hours, 5 day size exchange.', [
      { '@context': 'https://schema.org', '@type': 'OnlineStore', name: 'DAUR Supply', alternateName: 'DAUR', url: C.domain, description: 'Pakistani footwear brand for men: leather shoes, sneakers and chelsea boots, chosen at workshops in Lahore, Sialkot and Kasur, checked by hand and delivered across Pakistan with Cash on Delivery.', areaServed: { '@type': 'Country', name: 'Pakistan' } }]);
    const hero = prod('moc-runner-v1') || P[0], hv = hero.variants[0];
    const drop = P.filter((p) => p.audience === (ONE || 'Men')).slice(0, 8);
    const lines = ONE ? CATS.map((c) => ({ key: c, ps: P.filter((p) => p.category === c) })) : C.audiences.map((a) => ({ key: a, ps: P.filter((p) => p.audience === a) }));
    const tileImg = { Sneakers: 'sneakers', Hybrids: 'casual', Leather: 'leather' };
    app.innerHTML = `
    <div id="homeRw" class="home-rw"></div>

    <section class="f-pillars" aria-label="What DAUR stands for"><div class="wrap"><ul>
      ${PILLARS.map((x) => `<li class="rv"><span class="f-pi" aria-hidden="true">${ic(x.i)}</span><div><h2>${x.t}</h2><p>${x.d}</p></div></li>`).join('')}
    </ul></div></section>

    <section class="sheet f-sec"><div class="wrap">
      ${head(ONE ? 'Shop by style' : 'Shop by line', 'Find your pair.', `<a class="link" href="${link('shop')}">Shop all</a>`)}
      <div class="f-tiles">${lines.map((l) => {
        const k = tileImg[l.key], from = l.ps.length ? Math.min(...l.ps.map(minPrice)) : 0, p0 = l.ps[0];
        const vs = l.ps.flatMap((p) => p.variants.slice(0, 2).map((v) => [p, v])).slice(0, 6);
        return `<a class="f-tile f-cyc rv" href="${link('shop', l.key.toLowerCase())}"><span class="f-tile-m">${p0 ? `<span class="f-tile-draw">${vs.map(([p, v], j) => `<span class="f-cy${j ? '' : ' on'}" data-n="${esc(p.name)}">${visual(p, v)}</span>`).join('')}</span>` : k && simg(k) ? photo(k, '', { sizes: '(max-width: 700px) 100vw, 33vw' }) : ''}</span>${vs.length > 1 ? `<span class="f-cy-n mono" aria-hidden="true">${esc(vs[0][0].name)}</span><span class="f-cy-d" aria-hidden="true">${vs.map((_, j) => `<i${j ? '' : ' class="on"'}></i>`).join('')}</span>` : ''}
          <span class="f-tile-t"><b>${esc({ Sneakers: 'Sneakers', Leather: 'Leather shoes', Hybrids: 'Casual' }[l.key] || lineName(l.key))}</b><span>${l.ps.length} style${l.ps.length === 1 ? '' : 's'}${from ? ', from ' + fmt(from) : ''}</span></span><span class="f-tile-a" aria-hidden="true">${ic('arrow')}</span></a>`;
      }).join('')}</div>
    </div></section>

    <section class="sheet f-sec" id="drop"><div class="wrap">
      ${head('The collection', 'Every pair, checked by hand.', `<a class="link" href="${link('shop')}">Filter and sort</a>`)}
      <div class="grid" id="homeGrid">${drop.map((p, i) => card(p, i)).join('')}</div>
    </div></section>

    <section class="sheet f-sec f-story"><div class="wrap">
      <div class="f-story-h rv"><span class="eyebrow">From the bench to your door</span><h2>Real craft has a home. It is here.</h2>
        <p>${STORY}</p><a class="link" href="${link('manifesto')}">Read our story</a></div>
      <ol class="f-steps">${STEPS.map((s, i) => `<li class="f-step rv"><span class="f-step-m">${simg(s.k) ? photo(s.k, '', { sizes: '(max-width: 700px) 100vw, 33vw' }) : `<span class="f-step-ph">${ic(s.i)}</span>`}</span>
        <span class="mono f-n">0${i + 1}</span><h3>${s.t}</h3><p>${s.d}</p></li>`).join('')}</ol>
    </div></section>

    <section class="sheet f-sec" id="anatomy"><div class="wrap">
      ${head('The craft, up close', 'Every detail, earned.', '', 'Tap a point on the drawing. Every DAUR pair passes the same six checks before it earns our seal.')}
      <div class="anat"><div class="anat-fig"><div class="svgbox">${SHOE.render({ name: hero.name, colorway: hv.color, silhouette: hero.silhouette, palette: hv.palette }, { mode: 'blueprint' })}${ANAT.map((a, i) => `<button class="hs" style="left:${a.x}%;top:${a.y}%" data-hs="${i}" aria-pressed="${i === 0}" aria-label="${esc(a.t)}"><span>${i + 1}</span></button>`).join('')}</div></div>
        <div class="anat-list">${ANAT.map((a, i) => `<div class="anat-item ${i === 0 ? 'open' : ''}" data-ai="${i}"><button aria-expanded="${i === 0}"><span class="n">0${i + 1}</span><span class="t">${esc(a.t)}</span><span class="pm" aria-hidden="true">+</span></button><div class="d"><p>${esc(a.d)}</p></div></div>`).join('')}</div></div>
    </div></section>

    ${GIVE.on ? `<section class="f-slice"><div class="wrap">
      <button class="f-slice-loaf" type="button" data-recut aria-label="Play the cut again">${loaf(GIVE.pct + '%', 'big')}</button>
      <div class="f-slice-t rv"><span class="eyebrow">The slice</span><h2>A slice of every pair is not ours to keep.</h2>
        <p>At least ${GIVE.pct}% of our profit, never added to your price, is pooled and given every quarter to verified people in need. We check every case ourselves and publish every giving.</p>
        ${lastGiving()}
        <a class="btn f-light" href="${link('giving')}">How our giving works <span class="arr">&rarr;</span></a></div>
    </div></section>` : ''}

    <div id="ext-stories"></div>

    ${guide({ e: 'DAUR Supply', h: (ONE === 'Men' ? 'Men\'s shoes' : 'Shoes') + ', crafted in Pakistan.', img: 'guide', alt: 'A pair of brown leather dress shoes', b: [
      ['', `DAUR Supply is a Pakistani footwear brand${ONE === 'Men' ? ' for men' : ''}. We choose leather sneakers, formal shoes, chelsea boots and casual slip ons at workshops in Lahore, Sialkot and Kasur, check every pair by hand and finish it with our own hardware: matte cotton laces, an engraved metal lace tag and the Supply Unit seal.`],
      ['Delivered to your city', 'Order online and pay on delivery in Karachi, Lahore, Islamabad, Rawalpindi, Faisalabad, Multan, Peshawar, Quetta and every other city our couriers reach. Dispatch within 24 hours of confirming your order, with a 5 day size exchange on unworn pairs.']],
      l: lines.map((l) => [link('shop', l.key.toLowerCase()), { Sneakers: 'Sneakers & joggers', Leather: 'Leather & formal shoes', Hybrids: 'Casual shoes' }[l.key] || lineName(l.key)]) })}

    <section class="sheet f-sec"><div class="wrap"><div class="signup closer">
      <h2>Your next pair, at your door.</h2>
      <div class="closer-r"><p>Pick your size tonight. We confirm by call or WhatsApp, dispatch within 24 hours and you pay the rider when the box is in your hands. Free delivery on ${C.freeDeliveryPairs} pairs.</p>
        <div class="hero-cta"><a class="btn volt" href="${link('shop')}">Shop the collection <span class="arr">&rarr;</span></a><a class="btn ghost" href="${waChat('Assalam o Alaikum DAUR Supply, I would like help choosing a pair.')}" target="_blank" rel="noopener">${ic('whatsapp')}Ask on WhatsApp</a></div></div>
    </div></div></section>`;
    // the hero is the line of pairs itself: it never ends, and one click on a pair opens its size, colour and bag
    const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
    runway($('#homeRw'), { head: `<span class="f-kicker">${ONE === 'Men' ? 'Men\'s leather shoes and sneakers' : 'Leather shoes and sneakers'} / Naya daur</span>
      <h1>Pakistan's craft,<br>chosen by hand.</h1>
      <p>${fine ? 'Click a pair to choose your size. Drag or scroll sideways to see the next.' : 'Tap a pair to choose your size. Swipe to see the next.'}</p>
      <div class="hero-cta"><a class="btn ghost" href="${link('shop')}">Shop all <span class="arr">&rarr;</span></a><a class="link" href="${link('manifesto')}">Our story</a></div>` });
    bindCards(app); bindAnat(app); cutWhenSeen(app); cycleTiles(app);
  };

  // the x-ray lens and tilt on a drawn pair (home hero, about page)
  function bindLens(st, hero_) {
    if (!st || !hero_) return;
    const mv = (e) => {
      const r = st.getBoundingClientRect(); const pt = e.touches ? e.touches[0] : e;
      // under a finger the lens rides a little above the touch point, so the x-ray is not hidden by the finger itself
      const lift = e.pointerType && e.pointerType !== 'mouse' ? 56 : 0;
      st.style.setProperty('--lx', (pt.clientX - r.left) + 'px'); st.style.setProperty('--ly', (pt.clientY - r.top - lift) + 'px');
      const hr = hero_.getBoundingClientRect();
      (hero_.querySelector('.hero-light') || hero_).style.setProperty('--mx', (pt.clientX - hr.left) + 'px');
      (hero_.querySelector('.hero-light') || hero_).style.setProperty('--my', (pt.clientY - hr.top) + 'px');
    };
    // a mouse shows the lens while it is over the pair; a finger shows it where it touches and while it slides,
    // and the lens stays a moment after the finger lifts instead of vanishing at once
    let lensT = 0;
    const lensOn = () => { clearTimeout(lensT); st.classList.add('lens'); };
    const lensOff = (e) => { if (e.pointerType === 'mouse') { st.classList.remove('lens'); tilt(0, 0); } else { clearTimeout(lensT); lensT = setTimeout(() => st.classList.remove('lens'), 1600); } };
    st.addEventListener('pointermove', (e) => { if (e.pointerType !== 'mouse') lensOn(); mv(e); });
    st.addEventListener('pointerdown', (e) => { lensOn(); mv(e); });
    st.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') lensOn(); });
    st.addEventListener('pointerleave', lensOff); st.addEventListener('pointercancel', lensOff);
    // the pair turns toward the pointer (or the tilt of the phone), so it reads as an object, not a drawing
    const tilt = (x, y) => { st.style.setProperty('--ry', (x * 16).toFixed(2) + 'deg'); st.style.setProperty('--rx', (-y * 10).toFixed(2) + 'deg'); };
    st.addEventListener('pointermove', (e) => { const r = st.getBoundingClientRect(); tilt((e.clientX - r.left) / r.width - .5, (e.clientY - r.top) / r.height - .5); });
    if (window.DeviceOrientationEvent && matchMedia('(pointer: coarse)').matches) {
      const onTilt = (e) => { if (e.gamma == null) return; tilt(Math.max(-1, Math.min(1, e.gamma / 30)) / 2, Math.max(-1, Math.min(1, (e.beta - 40) / 30)) / 2); };
      window.addEventListener('deviceorientation', onTilt);
      // iPhone asks once before a page may read the tilt
      if (DeviceOrientationEvent.requestPermission) st.addEventListener('click', () => DeviceOrientationEvent.requestPermission().catch(() => {}), { once: true });
      const stop = () => { window.removeEventListener('deviceorientation', onTilt); window.removeEventListener('hashchange', stop); };
      window.addEventListener('hashchange', stop);
    }
  }

  // the delivery van is itself a sneaker, in house colours, with the day's parcels strapped to the heel
  const VAN = `<svg viewBox="0 0 170 92" focusable="false">
    <g class="van-dust"><circle cx="6" cy="76" r="3"/><circle cx="-4" cy="72" r="2.2"/><circle cx="-12" cy="77" r="1.6"/></g>
    <g class="van-load"><rect x="30" y="6" width="26" height="20" rx="1.5" fill="#C89B5E" stroke="#6B4A22"/><path d="M43 6v20M30 13h26" stroke="#8A4B22" stroke-width="1.6"/><rect x="58" y="12" width="22" height="16" rx="1.5" fill="#D9B07A" stroke="#6B4A22"/><path d="M69 12v16" stroke="#8A4B22" stroke-width="1.6"/><rect x="36" y="-10" width="18" height="15" rx="1.5" fill="#B97A47" stroke="#6B4A22"/><path d="M45 -10v15" stroke="#6B3F25" stroke-width="1.4"/><path d="M28 28h56" stroke="#2A1C14" stroke-width="2.2" stroke-linecap="round"/></g>
    <path d="M14 66C12 46 18 30 34 30H76C90 30 96 20 106 20H116C125 20 128 29 132 35C145 39 158 47 158 60V66Z" fill="#2A1C14"/>
    <path d="M106 20C112 26 118 30 132 35" fill="none" stroke="#B97A47" stroke-width="2"/>
    <path d="M100 30l10 4M97 36l12 4M94 42l12 4" stroke="#F5EEE4" stroke-width="2" stroke-linecap="round"/>
    <path d="M22 54C40 48 70 48 92 54" fill="none" stroke="#F5EEE4" stroke-opacity=".35" stroke-dasharray="3 3"/>
    <text x="30" y="47" fill="#F5EEE4" font-family="JetBrains Mono, monospace" font-size="10" font-weight="700" letter-spacing="1">DAUR</text>
    <rect x="8" y="64" width="154" height="9" rx="4.5" fill="#F5EEE4" stroke="#2A1C14" stroke-width="1.4"/>
    <g class="van-wheel" style="transform-origin:42px 76px"><circle cx="42" cy="76" r="10" fill="#1A120D"/><circle cx="42" cy="76" r="4" fill="#C89B5E"/><path d="M42 67v18M33 76h18" stroke="#3A2418" stroke-width="2"/></g>
    <g class="van-wheel" style="transform-origin:130px 76px"><circle cx="130" cy="76" r="10" fill="#1A120D"/><circle cx="130" cy="76" r="4" fill="#C89B5E"/><path d="M130 67v18M121 76h18" stroke="#3A2418" stroke-width="2"/></g>
  </svg>`;
  const ANAT = [
    { t: 'Full grain leather upper', d: 'Pebbled full grain hide that softens to your foot and ages with character. We bend every upper at the flex point and check for cracking before it is accepted.', x: 46, y: 57 },
    { t: 'Moc toe hand stitching', d: 'Double needle stitching with tight, even spacing. A wavy or skipped stitch is an instant reject at our checking table.', x: 71, y: 53 },
    { t: 'Re-laced in matte cotton', d: 'Thick matte black woven cotton laces replace the thin ones. It is the detail people notice first.', x: 39.5, y: 35.5 },
    { t: 'Engraved dubrae', d: 'A laser engraved DAUR metal tag on the bottom lace row. Branded, not labeled: our mark sits on the hardware and lets the leather do the talking.', x: 48, y: 44 },
    { t: 'Supply Unit seal', d: 'A matte black rubber seal on the top eyelet. Cut it off and the pair is yours. Leave it on and it tells people where you shop.', x: 36.5, y: 56 },
    { t: 'Dual density sole', d: 'A rubber outsole bonded to a softer midsole, for grip outside and cushion underfoot. We pull test the bond at toe and heel, and any gap sends the pair back.', x: 56, y: 75 }
  ];
  // the headline is written out slowly, one line after another, by a small shoe used as a pen
  function magicType(h) {
    if (!h || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const K = window.DAUR_KICKS;
    const pen = K ? K.svg('runner', { upper: '#2A1C14', sole: '#F5EEE4', accent: '#B97A47', line: '#F5EEE4' }) : '';
    const rows = $$('.row', h);
    // each line sits in a window (.ink) that slides open while the words inside slide the other way: a left to right reveal done with transforms only, so it runs on the GPU
    rows.forEach((r) => { const ink = document.createElement('span'), inner = document.createElement('span'); ink.className = 'ink'; inner.className = 'ink-i'; while (r.firstChild) inner.appendChild(r.firstChild); ink.appendChild(inner); r.appendChild(ink); });
    h.classList.add('writing');
    const go = () => {
      if (h.dataset.w) return; h.dataset.w = '1';
      // phones get a quicker pen, so the promise is readable within the first second or two
      const narrow = innerWidth < 700;
      let at = 0;
      const ws = rows.map((r) => $('.ink', r).offsetWidth); // read every width first, then write, so the page is measured once
      rows.forEach((r, k) => {
        const w = ws[k], dur = narrow ? Math.max(.9, Math.min(1.2, w / 380)) : Math.max(1.1, w / 520);
        r.insertAdjacentHTML('beforeend', `<i class="pen" aria-hidden="true">${pen}</i>`);
        r.style.setProperty('--w', w + 'px'); r.style.setProperty('--d', dur + 's'); r.style.setProperty('--at', at + 's');
        at += dur + .15;
      });
      h.classList.add('go');
      setTimeout(() => { h.classList.remove('writing', 'go'); h.classList.add('written'); $$('.pen', h).forEach((p) => p.remove()); }, at * 1000 + 700);
    };
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(go); setTimeout(go, 250); } else go();
  }
  function bindAnat(root) {
    const pick = (i) => {
      $$('.hs', root).forEach((h) => h.setAttribute('aria-pressed', h.dataset.hs == i));
      $$('.anat-item', root).forEach((it) => { const o = it.dataset.ai == i; it.classList.toggle('open', o); $('button', it).setAttribute('aria-expanded', o); });
    };
    $$('.hs', root).forEach((h) => h.addEventListener('click', () => pick(h.dataset.hs)));
    $$('.anat-item > button', root).forEach((b) => b.addEventListener('click', () => pick(b.parentNode.dataset.ai)));
  }
  const PK_CITIES = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta', 'Gujranwala', 'Sialkot', 'Hyderabad', 'Bahawalpur', 'Sargodha', 'Sukkur', 'Abbottabad', 'Mardan', 'Gujrat', 'Sheikhupura', 'Jhelum', 'Sahiwal', 'Okara', 'Rahim Yar Khan', 'Dera Ghazi Khan', 'Larkana', 'Mirpur', 'Muzaffarabad', 'Gilgit', 'Skardu', 'Swat', 'Gwadar'];
  const CONTRACT = [
    ['Dispatch', 'Within 24 hours', 'We call or WhatsApp to confirm every COD order, then hand it to the courier within 24 hours.'],
    ['Delivery', 'All of Pakistan', 'Every city and town the courier reaches, in ' + C.delivery.days + ' after dispatch.'],
    ['Payment', 'Cash on Delivery', 'Pay the rider when the box arrives. No card, no advance, no wallet needed.'],
    ['Delivery fee', fmt(C.delivery.fee) + ', or free', 'One flat fee for every city. Free on ' + C.freeDeliveryPairs + ' pairs or more.'],
    ['Exchange', '5 days, unworn', 'Wrong size? Send it back unworn with the seal attached and we swap it once it reaches us. Sale pairs are final for size.'],
    ['Defects', '30 days', 'Stitching or sole failure in normal wear within 30 days and we replace the pair or refund it. No argument.']
  ];

  /* ---- shop ---- */
  const presets = { sale: { sale: true }, new: { sort: 'new' } };
  C.audiences.forEach((a) => { presets[a.toLowerCase()] = { aud: a }; });
  if (ONE) CATS.forEach((c) => { presets[c.toLowerCase()] = { cat: c }; });
  V.shop = function (param) {
    const pre = presets[param] || {};
    const F = { aud: pre.aud || 'All', group: 'All', cat: pre.cat || 'All', colors: [], size: null, price: 'all', sale: !!pre.sale, instock: false, sort: pre.sort || 'featured', q: '' };
    const title = pre.cat ? lineName(pre.cat) : pre.aud ? pre.aud : pre.sale ? 'Sale' : pre.sort ? 'New in' : ONE ? 'All ' + ONE.toLowerCase() : 'All drops';
    // the heading names the style the way Pakistani shoppers search for it ("joggers" are sneakers, "formal" means leather)
    const h1 = { Sneakers: 'Sneakers & joggers', 'Leather shoes': 'Leather & formal shoes', Casual: 'Casual shoes', 'All men': "Men's shoes" }[title] || title;
    const fromP = Math.min(...P.filter((p) => (!pre.aud || p.audience === pre.aud) && (!pre.cat || p.category === pre.cat)).map(minPrice));
    const from = isFinite(fromP) ? ' From ' + fmt(fromP) + '.' : '';
    // titles follow how Pakistani shoppers search: product type, "for men", "price in Pakistan"
    const SEO = {
      Men: ['Shoes for Men in Pakistan | Leather Shoes, Sneakers & Boots', `Men's leather shoes, sneakers, chelsea boots and casual shoes, crafted in Pakistan.${from} Cash on Delivery to every city, free delivery on 2 pairs.`],
      Women: ["Women's Sneakers & Leather Shoes in Pakistan", `Women's sneakers and leather shoes, crafted in Pakistan.${from} Cash on Delivery to every city, free delivery on 2 pairs.`],
      Kids: ['Kids Shoes Online in Pakistan', `Kids and baby leather shoes and sneakers, crafted in Pakistan.${from} Cash on Delivery to every city.`],
      Sale: ["Men's Shoes Sale in Pakistan | Leather Shoes & Sneakers", 'Real price cuts on leather shoes and sneakers. Same checks, same DAUR seal, Cash on Delivery to every city in Pakistan.'],
      'New in': [ONE === 'Men' ? "New Arrivals | Men's Shoes in Pakistan" : "New Arrivals | Men's & Women's Shoes in Pakistan", 'The newest leather shoes and sneakers from DAUR Supply, with Cash on Delivery across Pakistan.'],
      'All drops': ['Leather Shoes & Sneakers Online in Pakistan', `Leather shoes and sneakers, crafted in Pakistan.${from} Filter by style, size, colour and price. Cash on Delivery to every city.`],
      'All men': ['Shoes for Men in Pakistan | Leather Shoes, Sneakers & Boots', `Men's leather shoes, sneakers, chelsea boots and casual shoes, crafted in Pakistan.${from} Cash on Delivery to every city, free delivery on 2 pairs.`],
      Sneakers: ['Sneakers & Joggers for Men Price in Pakistan', `Men's leather sneakers, trainers and high tops, crafted in Pakistan.${from} Cash on Delivery to every city, free delivery on 2 pairs.`],
      'Leather shoes': ['Leather Formal Shoes & Chelsea Boots for Men in Pakistan', `Full grain leather derby shoes and chelsea boots for men, for the office, weddings and shalwar kameez.${from} Cash on Delivery across Pakistan.`],
      Casual: ['Casual Shoes for Men Price in Pakistan | Leather Slip Ons', `Men's casual leather shoes: moc toe runners and slip ons for jeans, chinos and shalwar kameez.${from} Cash on Delivery to every city.`]
    }[title] || [title + ' | Shoes in Pakistan', 'Shoes crafted in Pakistan, with Cash on Delivery to every city.'];
    setMeta(SEO[0], SEO[1], crumbsLd([[h1, pre.aud || pre.cat || pre.sale || pre.sort ? link('shop', param) : null]]));
    const colorFam = (c) => c.split('/')[0].trim().replace(/^(Triple|Black Full Grain|Black Waxed|Black Nappa)$/i, 'Black').replace(/^Triple Black$/i, 'Black');
    const allColors = [...new Set(P.flatMap((p) => p.variants.map((v) => colorFam(v.color))))];
    const hexOf = (c) => { for (const p of P) for (const v of p.variants) if (colorFam(v.color) === c) return v.hex || '#333'; return '#333'; };
    const set = P.filter((p) => (!pre.aud || p.audience === pre.aud) && (!pre.cat || p.category === pre.cat) && (!pre.sale || anySale(p)));
    const vs = set.flatMap((p) => p.variants.filter((v) => !pre.sale || onSale(v)).map((v) => [p, v]));
    const HERO = {
      all: [ONE === 'Men' ? 'Drop 01 / every men\'s pair' : 'Drop 01 / every pair', 'Leather shoes and sneakers crafted in Pakistan, checked pair by pair and finished with the DAUR mark. Pay when it reaches you.'],
      sneakers: ['Style 01 / Sneakers', 'Court lows, trainers and high tops in real leather. Clean from every angle, with soles bonded and pull tested before a pair is sealed.'],
      leather: ['Style 02 / Leather shoes', 'Full grain derby shoes and waxed chelsea boots. The pairs you reach for when the day matters.'],
      hybrids: ['Style 03 / Casual', 'Moc toe runners, slip ons and loafers. The ease of a sneaker with a sharper finish, all day long.'],
      men: ['Line 01 / Men', 'Leather shoes and sneakers made for the way you move.'],
      women: ['Line 02 / Women', 'Clean lines on a narrower last.'],
      kids: ['Line 03 / Kids', 'First steps in real leather, at a price that makes sense when they outgrow it in six months.'],
      sale: ['Price cuts / live now', 'Real price cuts on real leather, while sizes last.'],
      new: ['Just landed', 'The newest pairs to earn the DAUR seal.']
    };
    const hk = param && HERO[param] ? param : 'all';
    const prices = vs.map(([, v]) => v.price);
    const stats = pre.sale
      ? [['Up to', Math.max(0, ...vs.map(([, v]) => pct(v))), '% off'], ['Pairs cut', vs.length, ''], ['From', prices.length ? Math.min(...prices) : 0, '', true]]
      : [['Styles', set.length, ''], ['Colours', vs.length, ''], ['From', prices.length ? Math.min(...prices) : 0, '', true], ['Sizes', set.length ? Math.min(...set.flatMap((p) => p.sizes)) + ' to ' + Math.max(...set.flatMap((p) => p.sizes)) : 'None', ' EU']];
    const parade = vs.length ? vs.concat(vs, vs).slice(0, Math.max(10, vs.length * 2)) : [];
    let li = 0;
    const letters = (t) => t.split(' ').map((w) => `<span class="w">${[...w].map((ch) => `<span class="ch" style="--i:${li++}">${esc(ch)}</span>`).join('')}</span>`).join('<span class="sp"> </span>');
    app.innerHTML = `
      <section class="shero shero-${hk}">
        <div class="shero-bg" aria-hidden="true"><div class="shero-mq">${(title + ' + ').repeat(8)}</div></div>
        <div class="wrap"><nav class="crumbs" aria-label="Breadcrumb"><a href="${link('home')}">Home</a><span>/</span>${pre.aud || pre.cat || pre.sale || pre.sort ? `<a href="${link('shop')}">Shop</a><span>/</span><span>${esc(h1)}</span>` : `<span>${esc(h1)}</span>`}</nav>
          <div class="shero-grid"><div class="shero-t"><span class="eyebrow">${HERO[hk][0]}</span><h1 class="split" aria-label="${esc(h1)}">${letters(h1)}</h1><p>${HERO[hk][1]}</p></div>
          <div class="shero-stats">${stats.map(([k, n, suf, money]) => `<div><span class="mono">${k}</span><b class="num">${money ? C.currency + ' ' : ''}${typeof n === 'number' ? `<span data-count="${n}">${n.toLocaleString('en-US')}</span>` : n}${suf}</b></div>`).join('')}</div></div></div>
        ${parade.length ? `<div class="parade" aria-hidden="true"><div class="parade-track">${parade.map(([p, v], i) => `<a class="pd" href="${link('product', p.id + '~' + v.id)}" tabindex="-1" style="--d:${(i % 5) * -0.7}s">${visual(p, v)}${pre.sale ? `<em>&minus;${pct(v)}%</em>` : ''}</a>`).join('')}</div></div>` : ''}
      </section>
      <section><div class="wrap">
        <div class="toolbar">
          ${ONE ? `<div class="filters" id="fAud">${['All'].concat(CATS).map((c) => `<button class="fbtn" data-cat="${c}" aria-pressed="${F.cat === c}">${c === 'All' ? 'All' : lineName(c)}</button>`).join('')}</div>` : `<div class="filters" id="fAud">${['All'].concat(C.audiences).map((a) => `<button class="fbtn" data-aud="${a}" aria-pressed="${F.aud === a}">${a}</button>`).join('')}</div>`}
          <div class="tool-r"><button class="fbtn" id="fToggle" aria-expanded="false" aria-controls="fpanel">${ic('sliders')}Filters <span id="fN"></span></button>
            <label class="sr" for="sort" style="position:absolute;left:-999px">Sort</label><select class="select" id="sort">
            ${[['featured', 'Featured'], ['new', 'Newest'], ['low', 'Price, low to high'], ['high', 'Price, high to low'], ['saving', 'Biggest saving']].map(([v, t]) => `<option value="${v}" ${F.sort === v ? 'selected' : ''}>${t}</option>`).join('')}</select>
            <button class="fbtn fview" id="fView" type="button" aria-pressed="${gridOne()}" aria-label="One pair per row with sizes"><svg viewBox="0 0 20 20" aria-hidden="true"><g class="v2"><rect x="2" y="2" width="7" height="7" rx="1.5"/><rect x="11" y="2" width="7" height="7" rx="1.5"/><rect x="2" y="11" width="7" height="7" rx="1.5"/><rect x="11" y="11" width="7" height="7" rx="1.5"/></g><g class="v1"><rect x="2" y="2" width="16" height="9" rx="1.5"/><path d="M2 14.5h16M2 17.5h10"/></g></svg></button></div>
        </div>
        <div class="shop">
          <aside class="fpanel" id="fpanel" aria-label="Filters">
            <div class="fsheet-h"><span class="fsheet-grab" aria-hidden="true"></span><b>Filters</b><button class="fsheet-x" id="fClose" type="button" aria-label="Close filters">${ic('close')}</button></div>
            <div class="fgrp"><span class="field-label"><span>${ic('search')}Search</span></span><input class="finput" id="fq" type="search" placeholder="Name, colour, style"></div>
            <div class="fgrp" id="gGroup"></div>
            <div class="fgrp fg-style"><span class="field-label"><span>${ic('tag')}Style</span></span><div class="filters">${['All', ...CATS].map((c) => `<button class="fbtn" data-cat="${c}" aria-pressed="${c === F.cat}">${c === 'All' ? 'All' : lineName(c)}</button>`).join('')}</div></div>
            <div class="fgrp"><span class="field-label"><span>${ic('spark')}Colour</span></span><div class="filters cols">${allColors.map((c) => `<button class="fbtn col-chip" data-col="${esc(c)}" aria-pressed="false" style="--c:${esc(hexOf(c))}"><span class="cc-i">${window.DAUR_KICKS ? window.DAUR_KICKS.svg('runner', window.DAUR_KICKS.colorsFor(hexOf(c))) : ''}</span>${esc(c)}</button>`).join('')}</div></div>
            <div class="fgrp"><span class="field-label"><span>${ic('ruler')}Size (EU)</span></span><div class="sizes" id="fSizes"></div></div>
            <div class="fgrp"><span class="field-label"><span>${ic('cash')}Price</span></span><div class="filters">${[['all', 'Any'], ['u4', 'Under 4,000'], ['4to5', '4,000 to 5,000'], ['o5', 'Over 5,000']].map(([v, t]) => `<button class="fbtn" data-pr="${v}" aria-pressed="${v === 'all'}">${t}</button>`).join('')}</div></div>
            <div class="fgrp"><label class="chk"><input type="checkbox" id="fSale" ${F.sale ? 'checked' : ''}> On sale only</label><label class="chk"><input type="checkbox" id="fStock"> In stock in my size</label></div>
            <button class="fclear" id="fClear">${ic('close')}Clear all filters</button>
            <div class="fsheet-f"><button class="fbtn" id="fReset" type="button">Clear</button><button class="btn volt" id="fDone" type="button">Show pairs</button></div>
          </aside>
          <div class="fscrim" id="fScrim" aria-hidden="true"></div>
          <div class="shop-main"><div class="active" id="active"></div><div id="results"></div></div>
        </div>
      </div></section>
      ${guide(GUIDE[hk] || GUIDE.all)}`;
    const sizesFor = () => [...new Set(P.filter((p) => F.aud === 'All' || p.audience === F.aud).flatMap((p) => p.sizes))].sort((a, b) => a - b);
    function paintSide() {
      const groups = [...new Set(P.filter((p) => p.audience === F.aud && p.group).map((p) => p.group))];
      $('#gGroup').innerHTML = groups.length ? `<span class="field-label"><span>${F.aud}</span></span><div class="filters">${['All'].concat(groups).map((g) => `<button class="fbtn" data-grp="${g}" aria-pressed="${F.group === g}">${g}</button>`).join('')}</div>` : '';
      $$('[data-grp]').forEach((b) => b.addEventListener('click', () => { F.group = b.dataset.grp; paintSide(); paint(); }));
      $('#fSizes').innerHTML = sizesFor().map((s) => `<button class="size" data-fs="${s}" aria-pressed="${F.size == s}">${s}</button>`).join('');
      $$('[data-fs]').forEach((b) => b.addEventListener('click', () => { F.size = F.size == b.dataset.fs ? null : +b.dataset.fs; paintSide(); paint(); }));
    }
    function match() {
      const out = [];
      P.forEach((p, idx) => {
        if (F.aud !== 'All' && p.audience !== F.aud) return;
        if (F.group !== 'All' && p.group !== F.group) return;
        if (F.cat !== 'All' && p.category !== F.cat) return;
        if (F.q) { const hay = [p.name, p.category, p.audience, p.group, p.description, ...p.variants.map((v) => v.color)].join(' ').toLowerCase(); if (!F.q.toLowerCase().split(/\s+/).every((w) => hay.includes(w))) return; }
        let vs = p.variants.slice();
        if (F.colors.length) vs = vs.filter((v) => F.colors.includes(colorFam(v.color)));
        if (F.sale) vs = vs.filter(onSale);
        if (F.price === 'u4') vs = vs.filter((v) => v.price < 4000);
        if (F.price === '4to5') vs = vs.filter((v) => v.price >= 4000 && v.price <= 5000);
        if (F.price === 'o5') vs = vs.filter((v) => v.price > 5000);
        if (F.size) vs = vs.filter((v) => p.sizes.includes(F.size) && (!F.instock || (v.stock[F.size] || 0) > 0));
        else if (F.instock) vs = vs.filter((v) => stockOf(v) > 0);
        if (!vs.length) return;
        out.push({ p, v: vs[0], idx });
      });
      const S = { featured: (a, b) => a.idx - b.idx, new: (a, b) => b.p.createdAt.localeCompare(a.p.createdAt), low: (a, b) => a.v.price - b.v.price, high: (a, b) => b.v.price - a.v.price, saving: (a, b) => pct(b.v) - pct(a.v) || (C.marketRetail - a.v.price) - (C.marketRetail - b.v.price) };
      return out.sort(S[F.sort]);
    }
    function paint() {
      const r = match();
      const chips = [];
      if (F.aud !== 'All') chips.push(['aud', F.aud]);
      if (F.group !== 'All') chips.push(['group', F.group]);
      if (F.cat !== 'All') chips.push(['cat', lineName(F.cat)]);
      F.colors.forEach((c) => chips.push(['col', c]));
      if (F.size) chips.push(['size', 'EU ' + F.size]);
      if (F.price !== 'all') chips.push(['price', $(`[data-pr="${F.price}"]`).textContent]);
      if (F.sale) chips.push(['sale', 'On sale']);
      if (F.instock) chips.push(['instock', 'In stock']);
      if (F.q) chips.push(['q', '“' + F.q + '”']);
      $('#fN').textContent = chips.length ? '(' + chips.length + ')' : '';
      $('#fDone').textContent = r.length ? `Show ${r.length} pair${r.length === 1 ? '' : 's'}` : 'No pairs match';
      $('#active').innerHTML = `<span class="count">${r.length} result${r.length === 1 ? '' : 's'}</span>` + chips.map(([k, t]) => `<button class="chip x-chip" data-x="${k}" data-v="${esc(t)}">${esc(t)} &times;</button>`).join('');
      $$('[data-x]').forEach((b) => b.addEventListener('click', () => {
        const k = b.dataset.x;
        if (k === 'aud') F.aud = 'All'; if (k === 'group') F.group = 'All'; if (k === 'cat') F.cat = 'All';
        if (k === 'col') F.colors = F.colors.filter((c) => c !== b.dataset.v); if (k === 'size') F.size = null;
        if (k === 'price') F.price = 'all'; if (k === 'sale') F.sale = false; if (k === 'instock') F.instock = false; if (k === 'q') F.q = '';
        sync(); paintSide(); paint();
      }));
      $('#results').innerHTML = r.length ? `<h2 class="sr-only">${r.length} pair${r.length === 1 ? '' : 's'}</h2><div class="grid">${r.map((x, i) => card(x.p, i, x.v)).join('')}</div>` : `<div class="empty"><span class="mono">Nothing matches those filters</span><button class="btn ghost" id="emptyClear">Clear filters</button></div>`;
      bindCards($('#results'));
      if (window.DAUR_EXT && window.DAUR_EXT.peek) window.DAUR_EXT.peek($('#results'));
      const ec = $('#emptyClear'); if (ec) ec.addEventListener('click', clearAll);
      reveal();
    }
    function sync() {
      $$('[data-aud]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.aud === F.aud));
      $$('[data-cat]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.cat === F.cat));
      $$('[data-col]').forEach((b) => b.setAttribute('aria-pressed', F.colors.includes(b.dataset.col)));
      $$('[data-pr]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.pr === F.price));
      $('#fSale').checked = F.sale; $('#fStock').checked = F.instock; $('#fq').value = F.q; $('#sort').value = F.sort;
    }
    function clearAll() { Object.assign(F, { aud: 'All', group: 'All', cat: 'All', colors: [], size: null, price: 'all', sale: false, instock: false, q: '' }); sync(); paintSide(); paint(); }
    $$('[data-aud]').forEach((b) => b.addEventListener('click', () => { F.aud = b.dataset.aud; F.group = 'All'; F.size = null; sync(); paintSide(); paint(); }));
    $$('[data-cat]').forEach((b) => b.addEventListener('click', () => { F.cat = b.dataset.cat; sync(); paint(); }));
    $$('[data-col]').forEach((b) => b.addEventListener('click', () => { const c = b.dataset.col; F.colors = F.colors.includes(c) ? F.colors.filter((x) => x !== c) : F.colors.concat(c); sync(); paint(); }));
    $$('[data-pr]').forEach((b) => b.addEventListener('click', () => { F.price = b.dataset.pr; sync(); paint(); }));
    $('#fSale').addEventListener('change', (e) => { F.sale = e.target.checked; paint(); });
    $('#fStock').addEventListener('change', (e) => { F.instock = e.target.checked; paint(); });
    $('#fq').addEventListener('input', (e) => { F.q = e.target.value.trim(); paint(); });
    $('#sort').addEventListener('change', (e) => { F.sort = e.target.value; paint(); });
    $('#fClear').addEventListener('click', clearAll);
    // on phones the panel is a bottom sheet over the grid; on wide screens it is the sidebar
    const sheet = () => matchMedia('(max-width: 860px)').matches;
    const home_ = $('.shop');
    const setOpen = (o) => {
      const s = o && sheet();
      // as a sheet it sits above the header, so it moves to the page root while open
      const back = () => { const fp = $('#fpanel'); if (fp && !fp.classList.contains('open') && fp.parentNode !== home_) { home_.prepend(fp); fp.after($('#fScrim')); } };
      if (s) { document.body.append($('#fpanel'), $('#fScrim')); void $('#fpanel').offsetWidth; } else setTimeout(back, o ? 0 : 460);
      $('#fpanel').classList.toggle('open', o); $('#fToggle').setAttribute('aria-expanded', o);
      document.documentElement.classList.toggle('sheet-open', s);
      $('#fScrim').classList.toggle('on', s);
      $('#fpanel').style.transform = '';
      if (s) { $('#fpanel').scrollTop = 0; $('#fClose').focus({ preventScroll: true }); } else if (!o && sheet()) $('#fToggle').focus({ preventScroll: true });
    };
    $('#fToggle').addEventListener('click', () => setOpen(!$('#fpanel').classList.contains('open')));
    $('#fClose').addEventListener('click', () => setOpen(false));
    $('#fDone').addEventListener('click', () => { setOpen(false); const r = $('#results'); if (r && r.getBoundingClientRect().top < 0) r.scrollIntoView({ block: 'start' }); });
    $('#fScrim').addEventListener('click', () => setOpen(false));
    $('#fReset').addEventListener('click', clearAll);
    const esc_ = (e) => { if (e.key === 'Escape' && $('#fpanel') && $('#fpanel').classList.contains('open') && sheet()) setOpen(false); };
    document.addEventListener('keydown', esc_);
    addEventListener('hashchange', function off() { document.documentElement.classList.remove('sheet-open'); document.removeEventListener('keydown', esc_); removeEventListener('hashchange', off); [$('#fpanel'), $('#fScrim')].forEach((x) => x && x.parentNode === document.body && x.remove()); });
    // pull the sheet down by its handle to close it
    const grab = $('.fsheet-h');
    let y0 = null, dy = 0;
    grab.addEventListener('pointerdown', (e) => { if (!sheet() || e.target.closest('button')) return; y0 = e.clientY; dy = 0; grab.setPointerCapture(e.pointerId); $('#fpanel').classList.add('drag'); });
    grab.addEventListener('pointermove', (e) => { if (y0 == null) return; dy = Math.max(0, e.clientY - y0); $('#fpanel').style.transform = `translateY(${dy}px)`; });
    const drop = () => { if (y0 == null) return; y0 = null; $('#fpanel').classList.remove('drag'); if (dy > 90) setOpen(false); else $('#fpanel').style.transform = ''; };
    grab.addEventListener('pointerup', drop); grab.addEventListener('pointercancel', drop);
    $('#fView').addEventListener('click', () => { const one = !gridOne(); gridOne(one); $('#fView').setAttribute('aria-pressed', one); });
    paintSide(); paint();
  };

  /* ---- product ---- */
  V.product = function (param) {
    const [pid, vid] = (param || '').split('~');
    const p = prod(pid) || (SPA && pid ? null : P[0]);
    if (!p) { V.notfound(); return; } // a pair address that does not exist gets the not found page, never a different pair
    let v = variant(p, vid);
    let size = null, qty = 1, view = 0, views = [];
    pushRecent(p.id);
    const meta = () => setMeta(p.seo ? p.seo.title : `${p.name} ${v.color} | ${lineName(p.category)} for Men, Price in Pakistan`, p.seo ? p.seo.description : p.description, [{
      '@context': 'https://schema.org', '@type': 'ProductGroup', name: 'DAUR ' + p.name, description: p.description, brand: { '@type': 'Brand', name: 'DAUR Supply' }, productGroupID: p.id, variesBy: ['https://schema.org/color', 'https://schema.org/size'],
      hasVariant: p.variants.map((x) => ({ '@type': 'Product', name: `DAUR ${p.name} ${x.color}`, color: x.color, sku: p.id + '-' + x.id, offers: { '@type': 'Offer', priceCurrency: 'PKR', price: x.price, availability: stockOf(x) ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock', url: absLink('product', p.id + '~' + x.id) } }))
    }, crumbsLd([[lineName(lineOf(p)), absLink('shop', lineKey(p))], ['DAUR ' + p.name, absLink('product', p.id)]])]);
    function paint() {
      meta();
      views = v.images && v.images.length ? v.images.map((_, i) => ({ l: 'Photo ' + (i + 1), h: visual(p, v, { index: i }) })) : [{ l: 'Side', h: visual(p, v, { index: 0 }) }, { l: 'Blueprint', h: visual(p, v, { mode: 'blueprint' }), grid: true }, { l: 'Lacing', h: v.images && v.images[1] ? visual(p, v, { index: 1 }) : visual(p, v, { viewBox: '200 70 220 150' }) }, { l: 'Hardware', h: v.images && v.images[2] ? visual(p, v, { index: 2 }) : visual(p, v, { mode: 'blueprint', viewBox: '220 90 160 110' }), grid: true }];
      if (view >= views.length) view = 0;
      const st = v.stock || {};
      const related = P.filter((x) => x.id !== p.id && x.audience === p.audience).sort((a, b) => (b.category === p.category) - (a.category === p.category)).slice(0, 4);
      const recent = store.get('recent', []).filter((x) => x !== p.id).map(prod).filter(Boolean).slice(0, 4);
      app.innerHTML = `
      <div class="wrap pdp-wrap">
      <div class="pdp">
        <div class="gallery">
          <div class="gal-main stage" id="galMain"><span class="stage-badge">${esc(lineName(p.category))}</span>${onSale(v) ? priceTag(v) : ''}<span class="stage-glow" aria-hidden="true"></span><span class="stage-shadow" aria-hidden="true"></span>
            <div class="gal-track" id="galTrack" role="region" tabindex="0" aria-label="Photos of ${esc(p.name)}${views.length > 1 ? `, ${views.length} in all. Swipe or use the arrow keys` : ''}">${views.map((x, i) => `<div class="gal-slide${x.grid ? ' grid-bg' : ''}" role="group" aria-label="${i + 1} of ${views.length}"><div class="zoomable">${i ? x.h : x.h.replace('loading="lazy"', 'fetchpriority="high"')}</div></div>`).join('')}</div>
            ${views.length > 1 ? `<span class="gal-edge l" aria-hidden="true"></span><span class="gal-edge r" aria-hidden="true"></span><div class="gal-dots">${views.map((x, i) => `<button class="gal-dot" type="button" data-view="${i}" aria-current="${i === view}" aria-label="Show photo ${i + 1} of ${views.length}"></button>`).join('')}</div>` : ''}</div>
        </div>
        <div class="buy">
          <div class="buy-head"><span class="cw">${esc(audienceLabel(p))} / ${esc(lineName(p.category))} / ${esc(p.tag)}</span><h1>${esc(p.name)}</h1>
            <div class="price-row"><span class="now">${fmt(v.price)}</span><span class="pcol">${esc(v.color)}</span>${onSale(v) ? `<span class="was strike">${fmt(v.compareAt)}</span><span class="save">Save ${pct(v)}%</span>` : SELL.retailAnchor ? `<span class="was">Typical retail <span class="strike">${fmt(C.marketRetail)}+</span></span>` : ''}</div>
            ${perWear(v.price)}
            ${GIVE.on ? `<button class="slice-note" id="sliceB" type="button" aria-haspopup="dialog" data-recut>${loaf(GIVE.pct + '%')}<span class="sl-t"><b>A slice of this pair goes to someone in need.</b><span>At least ${GIVE.pct}% of our profit on it. Your price stays the same.</span></span></button>` : ''}
            <p class="blurb">${esc(p.description)}</p></div>
          <div><div class="field-label"><span>Colour / ${esc(v.color)}</span><span>${p.variants.length} option${p.variants.length > 1 ? 's' : ''}</span></div><div class="vpick2">${p.variants.map((x) => `<button class="vsw" data-v="${x.id}" aria-pressed="${x.id === v.id}" aria-label="${esc(x.color)}" style="--c:${esc(x.hex || '#777')}"><span class="vsw-i">${window.DAUR_KICKS ? window.DAUR_KICKS.svg(window.DAUR_KICKS.kindOf(p), window.DAUR_KICKS.colorsFor(x.hex || '#777')) : ''}</span><span class="vsw-l">${esc(x.color)}</span>${stockOf(x) ? '' : '<span class="vsw-out">Sold out</span>'}</button>`).join('')}</div></div>
          <div><div class="field-label strong"><span>Select size / EU ${size || ''}</span><button id="sgBtn">${ic('ruler')}Size guide</button></div>
            <div class="sizes">${p.sizes.map((s) => { const n = st[s] || 0; return `<button class="size" data-s="${s}" aria-pressed="${size == s}" ${n ? '' : 'data-out="1"'} aria-label="EU ${s}${n ? '' : ', sold out'}">${s}${n && n <= C.lowStockAt ? `<small>${n} LEFT</small>` : ''}${n ? '' : '<small style="color:var(--dim)">SOLD OUT</small>'}</button>`; }).join('')}</div>
            <div id="notify"></div></div>
          <div class="buy-actions"><div class="qty"><button id="qm" aria-label="Decrease quantity">&minus;</button><output id="qv">${qty}</output><button id="qp" aria-label="Increase quantity">+</button></div>
            <button class="btn volt pill-add" id="add">${ic('bag')}<span>${size ? 'Add to bag, ' + fmt(v.price * qty) : 'Select a size'}</span></button>
            <button class="btn ghost block" id="buyNow">Buy now, pay on delivery</button></div>
          <div class="pdp-acts"><button class="act" data-wish="${p.id}" aria-pressed="${wish.includes(p.id)}" id="wishB">${ic('heart', 'h-o')}${ic('heartFill', 'h-f')}<span>${wish.includes(p.id) ? 'Liked' : 'Like'}</span></button><button class="act" id="shareB">${ic('send')}<span>Share</span></button></div>
          <ul class="trust"><li>Dispatch in 24 hours</li><li>5 day size exchange</li><li>Free delivery on 2 pairs</li><li>Cash on Delivery</li></ul>
          <div id="ext-rvcard"></div>
          <div class="specs"><h2 class="specs-h">Specs</h2><dl>${Object.entries(p.specs || {}).map(([k, x]) => `<div><dt>${esc(k)}</dt><dd>${esc(x)}</dd></div>`).join('')}<div><dt>Colour</dt><dd>${esc(v.color)}</dd></div><div><dt>Code</dt><dd class="mono">${esc(p.id + '-' + v.id).toUpperCase()}</dd></div></dl></div>
          <div class="ship-est"><div>${ic('box')}<span class="k">Dispatch</span><span class="v">Within 24 hours</span></div><div>${ic('pin')}<span class="k">Delivery to</span><span class="v">All of Pakistan</span></div><div>${ic('truck')}<span class="k">Arrives in</span><span class="v">${C.delivery.days}</span></div></div>
          <div class="acc">
            <details><summary>In the box</summary><div class="in"><ul class="inbox"><li>The pair, re-laced in thick matte black cotton</li><li>Laser engraved DAUR dubrae on the bottom lace row</li><li>Matte black rubber Supply Unit seal</li><li>Grid tissue wrap and the manifest card</li><li>Heavy matte black corrugated box</li></ul></div></details>
            <details><summary>Delivery, COD and exchanges</summary><div class="in"><p>Cash on Delivery across Pakistan. We confirm every order by call or WhatsApp before dispatch. Free delivery on two pairs or more. Five day size exchange on unworn full price pairs with the seal attached. Sale pairs are final for size; defects are covered for 30 days on every pair. <a class="link" href="${link('contract')}">Our full promise</a></p></div></details>
          </div>
          ${ladder(p, v)}
        </div>
      </div></div>
      <section class="f-pillars f-pillars-pdp" aria-label="Why DAUR"><div class="wrap"><ul>${PILLARS.map((x) => `<li><span class="f-pi" aria-hidden="true">${ic(x.i)}</span><div><h2>${x.t}</h2><p>${x.d}</p></div></li>`).join('')}</ul></div></section>
      <div id="ext-reviews"></div>
      ${related.length ? `<section class="sheet x"><div class="wrap">${head('Complete the rotation', ONE ? 'More pairs like this.' : 'More from ' + esc(p.audience) + '.')}<div class="grid">${related.map((x, i) => card(x, i)).join('')}</div></div></section>` : ''}
      ${recent.length ? `<section class="sheet x"><div class="wrap">${head('Recently viewed', 'Still thinking?')}<div class="grid">${recent.map((x, i) => card(x, i)).join('')}</div></div></section>` : ''}
      <div class="sticky-buy" id="stickyBuy"><div><b>${esc(p.name)}</b><span class="mono mute">${esc(v.color)} / ${fmt(v.price)}</span></div><button class="btn volt" id="stickyAdd">${size ? 'Add EU ' + size : 'Choose size'}</button></div>`;
      bind();
    }
    function bind() {
      bindCards(app);
      hook('pdp', { p, v });
      const g = $('#galMain'), tr = $('#galTrack'), dots = $$('.gal-dot', g);
      const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
      const zoomOf = () => tr.children[view] && tr.children[view].firstElementChild;
      const unzoom = () => { $$('.zoomable', tr).forEach((z) => { z.style.transform = ''; }); g.classList.remove('zooming'); };
      // the lines follow the finger: each one grows as its photo slides in, live while swiping
      const live = () => {
        const f = tr.scrollLeft / Math.max(1, tr.clientWidth), n = Math.max(0, Math.min(views.length - 1, Math.round(f)));
        dots.forEach((d, i) => d.style.setProperty('--a', Math.max(0, 1 - Math.abs(f - i)).toFixed(3)));
        if (n !== view) { view = n; unzoom(); dots.forEach((d, i) => d.setAttribute('aria-current', i === view)); }
      };
      let lf = 0;
      tr.addEventListener('scroll', () => { if (!lf) lf = requestAnimationFrame(() => { lf = 0; live(); }); }, { passive: true });
      if (view) tr.scrollLeft = view * tr.clientWidth; // a repaint (size, quantity) keeps the photo the shopper was looking at
      live();
      const show = (i) => { i = (i + views.length) % views.length; tr.scrollTo({ left: i * tr.clientWidth, behavior: calm ? 'auto' : 'smooth' }); };
      dots.forEach((b) => b.addEventListener('click', () => show(+b.dataset.view)));
      // resting the mouse near the far left or right edge turns to the previous or next photo on its own
      let edge = 0, edgeT = 0;
      const setEdge = (d) => {
        if (d === edge) return;
        edge = d; clearTimeout(edgeT);
        g.classList.toggle('edge-l', d < 0); g.classList.toggle('edge-r', d > 0);
        const step = (wait) => { edgeT = setTimeout(() => { if (!edge) return; show(view + edge); step(1300); }, wait); };
        if (d) step(380);
      };
      g.addEventListener('pointermove', (e) => {
        if (views.length > 1 && e.pointerType === 'mouse') {
          const x = (e.clientX - g.getBoundingClientRect().left) / g.offsetWidth;
          const d = x < 0.14 ? -1 : x > 0.86 ? 1 : 0;
          setEdge(d);
          if (d) { unzoom(); return; }
        }
      });
      g.addEventListener('pointerleave', () => setEdge(0));
      g.addEventListener('pointermove', (e) => { if (edge || e.pointerType !== 'mouse' || e.target.closest('.gal-dots')) return; const z = zoomOf(); if (!z) return; const r = g.getBoundingClientRect(); z.style.transformOrigin = `${(e.clientX - r.left) / r.width * 100}% ${(e.clientY - r.top) / r.height * 100}%`; z.style.transform = 'scale(1.6)'; g.classList.add('zooming'); g.style.setProperty('--gx', (e.clientX - r.left) / r.width * 100 + '%'); g.style.setProperty('--gy', (e.clientY - r.top) / r.height * 100 + '%'); });
      g.addEventListener('pointerleave', unzoom);
      $$('.vsw').forEach((b) => b.addEventListener('click', () => { v = variant(p, b.dataset.v); size = null; qty = 1; history.replaceState(null, '', SPA ? link('product', p.id + '~' + v.id) : '#' + p.id + '~' + v.id); paint(); }));
      $$('.buy .size').forEach((b) => b.addEventListener('click', () => {
        if (b.dataset.out) { size = null; soldOut(+b.dataset.s); return; }
        size = +b.dataset.s; qty = Math.min(qty, v.stock[size]); paint();
      }));
      $('#qm').addEventListener('click', () => { qty = Math.max(1, qty - 1); $('#qv').textContent = qty; upd(); });
      $('#qp').addEventListener('click', () => { const max = size ? v.stock[size] : 5; if (qty >= max) { toast(size ? `Only ${max} in EU ${size}` : 'Pick a size first'); return; } qty++; $('#qv').textContent = qty; upd(); });
      const upd = () => { $('#add span').textContent = size ? 'Add to bag, ' + fmt(v.price * qty) : 'Select a size'; };
      const need = () => { if (!size) { toast('Pick a size first'); $('.buy .sizes').animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }], 300); return true; } return false; };
      $('#add').addEventListener('click', () => { if (need()) return; addToCart(p.id, v.id, size, qty); });
      $('#stickyAdd').addEventListener('click', () => { if (need()) { $('.buy .sizes').scrollIntoView({ behavior: 'smooth', block: 'center' }); return; } addToCart(p.id, v.id, size, qty); });
      $('#buyNow').addEventListener('click', () => { if (need()) return; if (addToCart(p.id, v.id, size, qty)) location.href = link('checkout'); });
      $('#wishB').addEventListener('click', () => { toggleWish(p.id); $('#wishB span').textContent = wish.includes(p.id) ? 'Liked' : 'Like'; });
      $('#shareB').addEventListener('click', () => shareLink(absLink('product', p.id + '~' + v.id), 'DAUR ' + p.name + ' / ' + v.color, `DAUR ${p.name} in ${v.color}, ${fmt(v.price)} with Cash on Delivery.`));
      $('#sgBtn').addEventListener('click', () => openModal('sizeGuide'));
      const sl = $('#sliceB'); if (sl) { sl.addEventListener('click', openSlice); cutWhenSeen(sl.parentNode); }
      const sb = $('#stickyBuy'), bt = $('#add');
      const io = new IntersectionObserver(([en]) => sb.classList.toggle('on', !en.isIntersecting && en.boundingClientRect.top < 0));
      io.observe(bt);
      reveal();
    }
    // a sold out size says so plainly and offers a chat with the team, without asking for a number
    function soldOut(s) {
      $('#notify').innerHTML = `<p class="form-note sold">EU ${s} in ${esc(v.color)} is sold out right now. <a class="link" href="${waChat(`Assalam o Alaikum DAUR Supply, is ${p.name} in ${v.color}, EU ${s} coming back?`)}" target="_blank" rel="noopener">Ask us on WhatsApp</a> about a restock, or pick another colour.</p>`;
    }
    paint();
  };

  /* ---- cart ---- */
  V.cart = function () {
    setMeta('Your bag | DAUR Supply', 'Review your DAUR Supply bag. Cash on Delivery across Pakistan.');
    function paint() {
      const t = totals();
      if (!t.lines.length) {
        app.innerHTML = `<section class="phero"><div class="wrap"><span class="eyebrow">Bag</span><h1>Empty.</h1><p class="aside">Nothing sealed yet.</p></div></section><div class="wrap"><div class="empty"><a class="btn volt" href="${link('shop')}">Shop Drop 01 <span class="arr">&rarr;</span></a>${wish.length ? `<a class="link" href="${link('wishlist')}">Open your wishlist (${wish.length})</a>` : ''}</div></div>`;
        return;
      }
      app.innerHTML = `<section class="phero"><div class="wrap"><span class="eyebrow">Bag / ${t.n} pair${t.n > 1 ? 's' : ''}</span><h1>Your bag.</h1><p class="aside">Saved on this device. A size is held for you once the order is placed.</p></div></section>
      <div class="wrap"><div class="two cart-page"><div class="main">${freeMeter(t.n)}${t.lines.map((d) => lineHTML(d, true)).join('')}
        <a class="link" href="${link('shop')}" style="display:inline-block;margin-top:24px">Continue shopping</a></div>
        <aside class="side">${summary(t, true)}<a class="btn volt block" href="${link('checkout')}">Checkout, Cash on Delivery <span class="arr">&rarr;</span></a><p class="form-note">One delivery fee for all of Pakistan, confirmed at checkout.</p></aside></div></div>`;
      bindLines(app); bindPromo(paint); bindVote(app);
    }
    rerender = () => { paintCounts(); paint(); };
    paint();
  };
  function summary(t, promo) {
    return `<span class="mono mute">Order summary</span>
      <div class="sum-row"><span>Subtotal, ${t.n} pair${t.n > 1 ? 's' : ''}</span><span>${fmt(t.subtotal)}</span></div>
      ${t.sale ? `<div class="sum-row mute"><span>Before sale</span><span class="strike">${fmt(t.before)}</span></div>` : ''}
      ${promo ? `<div class="promo"><input id="promo" placeholder="Coupon code" value="${esc(coupon)}" aria-label="Coupon code" autocomplete="off"><button id="promoBtn">${coupon && !t.couponErr ? 'Remove' : 'Apply'}</button></div>${t.couponErr ? `<span class="mono" style="color:var(--danger);font-size:10.5px">${esc(t.couponErr)}</span>` : ''}` : ''}
      ${t.discount ? `<div class="sum-row save"><span>${esc(coupon)} / ${esc(t.cp.label || 'Discount')}</span><span>&minus; ${fmt(t.discount)}</span></div>${t.cp.phone ? '<p class="form-note">This code is linked to one WhatsApp number. It is checked when you place the order.</p>' : ''}` : ''}
      <div class="sum-row"><span>Delivery</span><span>${t.free ? '<span class="volt">Free</span>' : fmt(t.delivery)}</span></div>
      <div class="sum-row"><span>Cash on Delivery fee</span><span>${fmt(0)}</span></div>
      <div class="sum-row total"><span>Total</span><span>${fmt(t.total)}</span></div>
      ${keptBox(t)}
      ${GIVE.on && t.n ? `<p class="sum-give">${loaf('', 'mini cut')}<span>A slice of this order goes to someone in need: at least ${GIVE.pct}% of our profit, never added to your total.</span></p>${votePicker()}` : ''}
      ${SELL.retailAnchor ? `<div class="sum-row save"><span>Saved against typical retail</span><span>${fmt(t.retail - t.subtotal + t.discount)}</span></div>` : ''}`;
  }
  function bindPromo(cb) {
    const b = $('#promoBtn'); if (!b) return;
    const apply = () => {
      const t = totals();
      if (coupon && !t.couponErr && b.textContent === 'Remove') { coupon = ''; saveCart(); cb(); toast('Code removed'); return; }
      coupon = $('#promo').value.trim().toUpperCase(); saveCart();
      const t2 = totals(); cb();
      if (coupon && !t2.couponErr) toast(SHOP ? coupon + ' saved. It is applied at checkout' : coupon + ' applied');
    };
    b.addEventListener('click', apply);
    $('#promo').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); apply(); } });
  }

  /* ---- checkout ---- */
  V.checkout = function () {
    setMeta('Checkout | DAUR Supply', 'Cash on Delivery checkout for DAUR Supply. Delivery to every city in Pakistan.');
    if (!cart.length) { location.replace(link('cart')); if (SPA) route(); return; }
    const draft = store.get('draft', {});
    app.innerHTML = `<section class="phero"><div class="wrap"><span class="eyebrow">Checkout / Cash on Delivery</span><h1>Seal the order.</h1><p class="aside">No card, no advance. We confirm by call or WhatsApp, then dispatch within 24 hours.</p></div></section>
      <div class="wrap"><form class="two" id="co" novalidate><div class="main">
        <fieldset><legend><span>01</span> Contact</legend>
          <div class="f-row"><div class="f"><label for="name">Full name</label><input id="name" name="name" autocomplete="name" required><span class="err"></span></div>
          <div class="f"><label for="phone">Mobile number</label><input id="phone" name="phone" inputmode="tel" autocomplete="tel" placeholder="03XX XXXXXXX" required><span class="err"></span></div></div>
          <div class="f"><label for="email">Email (optional, for the receipt)</label><input id="email" name="email" type="email" autocomplete="email"><span class="err"></span></div>
          <fieldset class="via"><legend>Confirm my order and send updates by</legend><div class="via-opts">${[['whatsapp', 'WhatsApp'], ['call', 'Phone call'], ['email', 'Email']].map(([k, l], i) => `<label class="via-o"><input type="radio" name="via" value="${k}" ${i ? '' : 'checked'}><span>${ic(k === 'whatsapp' ? 'whatsapp' : k === 'call' ? 'phone' : 'mail')}${l}</span></label>`).join('')}</div></fieldset>
          <label class="chk"><input type="checkbox" name="waUpdates" checked> Send order updates on WhatsApp to this number</label>
        </fieldset>
        <fieldset><legend><span>02</span> Delivery address</legend>
          <div class="f-row"><div class="f"><label for="city">City</label><input id="city" name="city" list="pkCities" autocomplete="address-level2" placeholder="Any city or town in Pakistan" required><datalist id="pkCities">${PK_CITIES.map((c) => `<option value="${c}">`).join('')}</datalist><span class="err"></span></div>
          <div class="f"><label for="area">Area / sector / town</label><input id="area" name="area" placeholder="For example F-7, DHA Phase 6, Gulberg III" required><span class="err"></span></div></div>
          <div class="f"><label for="address">House, street, building</label><input id="address" name="address" autocomplete="street-address" required><span class="err"></span></div>
          <div class="f-row"><div class="f"><label for="landmark">Nearest landmark (optional)</label><input id="landmark" name="landmark"></div><div class="f"><label for="postal">Postal code (optional)</label><input id="postal" name="postal" inputmode="numeric" autocomplete="postal-code"></div></div>
          <div class="f"><label for="note">Note for the rider (optional)</label><textarea id="note" name="note" placeholder="Best time to call, gate number"></textarea></div>
        </fieldset>
        <fieldset><legend><span>03</span> Payment</legend>
          <div class="pay-opt"><span class="radio" aria-hidden="true"></span><div><b>Cash on Delivery</b><p>Pay the rider in cash when the box arrives. Keep exact change ready if you can.</p></div><span class="mono volt">Selected</span></div>
          <div class="note-box">By placing this order you agree to <a class="link" href="${link('contract')}">our promise and terms</a>. Refusing a confirmed COD parcel without reason may remove COD for future orders.</div>
        </fieldset>
      </div>
      <aside class="side" id="coSide"></aside></form></div>`;
    const f = $('#co');
    ['name', 'phone', 'email', 'city', 'area', 'address', 'landmark', 'postal', 'note'].forEach((k) => { if (draft[k] && f[k]) f[k].value = draft[k]; });
    f.addEventListener('input', () => { const d = {}; ['name', 'phone', 'email', 'city', 'area', 'address', 'landmark', 'postal', 'note'].forEach((k) => d[k] = f[k] ? f[k].value : ''); store.set('draft', d); });
    const side = () => {
      const t = totals(f.city.value);
      $('#coSide').innerHTML = `<div class="mini-items">${t.lines.map((d) => `<div class="mini-item"><span class="th">${visual(d.p, d.v)}<em>${d.l.qty}</em></span><span><b>${esc(d.p.name)}</b><br><span class="meta">${esc(d.v.color)} / EU ${d.l.size}</span></span><span class="num">${fmt(d.total)}</span></div>`).join('')}</div>
        ${summary(t, true)}<p class="form-note">Delivered anywhere in Pakistan in ${C.delivery.days} after dispatch.</p>
        <button class="btn volt block" type="submit" id="place">Place order, pay ${fmt(t.total)} on delivery</button><a class="link" href="${link('cart')}" style="justify-self:start">Edit bag</a>`;
      bindPromo(side); bindVote(app);
    };
    rerender = () => { paintCounts(); side(); };
    f.city.addEventListener('change', side);
    side();
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      let ok = true;
      const err = (k, m) => { const w = f[k].closest('.f'); w.classList.toggle('bad', !!m); $('.err', w).textContent = m || ''; if (m) ok = false; };
      err('name', f.name.value.trim().length < 3 ? 'Enter your full name.' : '');
      const ph = f.phone.value.replace(/[^\d+]/g, '');
      err('phone', /^(\+?92|0)?3\d{9}$/.test(ph) ? '' : 'Enter a Pakistani mobile number, for example 0300 1234567.');
      err('email', f.email.value && !/^\S+@\S+\.\S+$/.test(f.email.value) ? 'Check the email address.' : f.via.value === 'email' && !f.email.value.trim() ? 'Add your email, or choose WhatsApp or a phone call above.' : '');
      err('city', f.city.value.trim().length > 1 ? '' : 'Enter your city or town.');
      err('area', f.area.value.trim() ? '' : 'Enter the area or sector.');
      err('address', f.address.value.trim().length < 6 ? 'Enter the house and street.' : '');
      const tc = totals(f.city.value);
      if (ok && tc.discount && tc.cp.phone && C.normPhone(ph) !== tc.cp.phone) err('phone', 'Code ' + coupon + ' was made for a different WhatsApp number. Use that number or remove the code.');
      if (!ok) { const b = $('.f.bad'); if (b) b.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
      const t = totals(f.city.value);
      const id = 'DAUR-' + Date.now().toString(36).toUpperCase().slice(-5) + Math.floor(Math.random() * 90 + 10);
      const order = { id, at: new Date().toISOString(), status: 'Placed', customer: { name: f.name.value.trim(), phone: ph, email: f.email.value.trim(), via: f.via.value, waUpdates: f.waUpdates.checked },
        address: { city: f.city.value.trim(), area: f.area.value.trim(), address: f.address.value.trim(), landmark: f.landmark.value.trim(), postal: f.postal.value.trim(), note: f.note.value.trim() },
        items: t.lines.map((d) => ({ pid: d.p.id, name: d.p.name, color: d.v.color, size: d.l.size, qty: d.l.qty, price: d.v.price })),
        subtotal: t.subtotal, discount: t.discount, coupon: t.discount ? coupon : '', delivery: t.delivery || 0, total: t.total, payment: 'Cash on Delivery', sliceCause: window.DAUR_SLICE_VOTE() };
      const orders = store.get('orders', []); orders.unshift(order); store.set('orders', orders);
      t.lines.forEach((d) => { d.v.received = d.v.received || Object.assign({}, d.v.stock); d.v.stock[d.l.size] = Math.max(0, (d.v.stock[d.l.size] || 0) - d.l.qty); });
      store.set('catalog', ALL);

      cart = []; coupon = ''; saveCart(); store.set('draft', {});
      location.href = link('order', id);
      if (SPA) route();
    });
  };

  /* ---- order confirmation ---- */
  function waText(o) {
    return `Order ${o.id}\n` + o.items.map((i) => `${i.qty} x ${i.name} ${i.color} EU ${i.size}`).join('\n') + `\nTotal ${fmt(o.total)} COD\n${o.customer.name}, ${o.address.address}, ${o.address.area}, ${o.address.city}`;
  }
  V.order = function (param) {
    const o = store.get('orders', []).find((x) => x.id === param);
    setMeta('Order placed | DAUR Supply', 'Your DAUR Supply order is confirmed.');
    if (!o) { app.innerHTML = `<section class="phero"><div class="wrap"><span class="eyebrow">Order</span><h1>Not found.</h1><p class="aside">That order is not stored on this device. <a class="link" href="${link('track')}">Track an order</a></p></div></section>`; return; }
    app.innerHTML = `<section class="phero"><div class="wrap"><span class="eyebrow">Order received</span><h1>Welcome to the new daur.</h1><p class="aside">Thank you, ${esc(o.customer.name.split(' ')[0])}. Keep your order number.</p></div></section>
      <div class="wrap"><div class="confirm"><div class="main">
        <div><span class="mono mute">Order number</span><div class="order-id">${esc(o.id)}</div></div>
        <div class="timeline">
          <div class="on"><span class="n">01</span><div><b>Order placed</b><p>${new Date(o.at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</p></div></div>
          <div><span class="n">02</span><div><b>Confirmation call or WhatsApp</b><p>We confirm the size and address on ${esc(o.customer.phone)} before anything ships.</p></div></div>
          <div><span class="n">03</span><div><b>Sealed and dispatched</b><p>Within 24 hours of confirmation. Tracking number sent on WhatsApp.</p></div></div>
          <div><span class="n">04</span><div><b>Delivered, pay ${fmt(o.total)} in cash</b><p>${esc(o.address.address)}, ${esc(o.address.area)}, ${esc(o.address.city)}</p></div></div>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn volt" href="https://wa.me/${C.whatsapp}?text=${encodeURIComponent(waText(o))}" target="_blank" rel="noopener">Confirm on WhatsApp now <span class="arr">&rarr;</span></a><a class="btn ghost" href="${link('track', o.id)}">Track this order</a><a class="btn ghost" href="${link('shop')}">Keep shopping</a></div>
        <p class="form-note">Preview build: without a store backend this order is saved in this browser only. Tap Confirm on WhatsApp to send it to the order line.</p>
      </div><aside class="side two-side" style="border:1px solid var(--line);padding:24px;display:grid;gap:14px;background:var(--ink-2)">
        <span class="mono mute">Items</span>${o.items.map((i) => { const p = prod(i.pid); const v = p ? p.variants.find((x) => x.color === i.color) || p.variants[0] : null; return `<div class="mini-item"><span class="th">${p ? visual(p, v) : ''}<em>${i.qty}</em></span><span><b>${esc(i.name)}</b><br><span class="meta">${esc(i.color)} / EU ${i.size}</span></span><span class="num">${fmt(i.price * i.qty)}</span></div>`; }).join('')}
        <div class="sum-row"><span>Subtotal</span><span>${fmt(o.subtotal)}</span></div>${o.discount ? `<div class="sum-row save"><span>${esc(o.coupon)}</span><span>&minus; ${fmt(o.discount)}</span></div>` : ''}
        <div class="sum-row"><span>Delivery</span><span>${o.delivery ? fmt(o.delivery) : 'Free'}</span></div><div class="sum-row total"><span>Pay on delivery</span><span>${fmt(o.total)}</span></div></aside></div></div>`;
  };

  /* ---- track ---- */
  V.track = function (param) {
    setMeta('Track your order | DAUR Supply', 'Track a DAUR Supply Cash on Delivery order with your order number or mobile number.');
    app.innerHTML = `<section class="phero"><div class="wrap"><span class="eyebrow">Track</span><h1>Where is my pair.</h1><p class="aside">Type your order number or the mobile number you ordered with. Either one is enough.</p></div></section>
      <div class="wrap" style="padding-block:40px 96px"><form class="track-one" id="tf" novalidate>
        <div class="f-ic">${ic('search')}<input id="tq" placeholder="DAUR-XXXXXXX or 03XX XXXXXXX" autocomplete="off" aria-label="Order number or mobile number"></div>
        <button class="btn volt" type="submit">Track</button></form><div id="tres"></div></div>`;
    const STEPS = ['Placed', 'Confirmed', 'Dispatched', 'Out for delivery', 'Delivered'];
    const when = (d) => new Date(d).toLocaleString('en-PK', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
    const cardOf = (o) => {
      const off = ['Returned', 'Exchanged', 'Cancelled'].includes(o.status);
      const at = Math.max(0, STEPS.indexOf(o.status));
      const hist = (o.history || []).slice().reverse();
      const c = o.courier || {};
      return `<article class="tcard">
        <header><div><span class="mono mute">Order</span><b class="mono">${esc(o.id)}</b></div><div><span class="mono mute">Placed</span><b>${when(o.at)}</b></div><div><span class="mono mute">Cash on Delivery</span><b>${fmt(o.total)}</b></div><span class="chip ${o.status === 'Delivered' ? 'v' : ''}">${esc(o.status)}</span></header>
        ${off ? `<p class="form-note">This order is marked ${esc(o.status.toLowerCase())}. Message us on WhatsApp if that is not what you expected.</p>` : `<ol class="tline">${STEPS.map((st, k) => `<li class="${k < at ? 'done' : k === at ? 'now' : ''}"><i></i><span>${st}</span></li>`).join('')}</ol>`}
        <div class="tcour">${c.url || c.no ? `<div><span class="mono mute">Courier</span><b>${esc(c.name || 'Courier')}</b>${c.no ? `<span class="mono">Tracking no. ${esc(c.no)}</span>` : ''}${c.note ? `<p>${esc(c.note)}</p>` : ''}${c.at ? `<small class="mute">Updated ${when(c.at)}</small>` : ''}</div>${c.url ? `<a class="btn volt" href="${esc(c.url)}" target="_blank" rel="noopener">${ic('pin')}Live location on courier site</a>` : ''}` : `<div><span class="mono mute">Courier</span><p>Your courier name, tracking number and live tracking link appear here as soon as the parcel is dispatched. We also send them on WhatsApp.</p></div>`}</div>
        <div class="tgrid"><div><span class="mono mute">Items</span>${o.items.map((i) => { const p = prod(i.pid); const v = p && variant(p, i.vid); return `<div class="titem">${p ? `<span class="th">${visual(p, v)}</span>` : ''}<span><b>${esc(i.name)}</b><small>${esc(i.color || '')} / EU ${i.size} / qty ${i.qty}</small></span><span class="num">${fmt(i.price * i.qty)}</span></div>`; }).join('')}
          <p class="mute">Subtotal ${fmt(o.subtotal)}${o.discount ? `, code ${esc(o.coupon)} minus ${fmt(o.discount)}` : ''}, delivery ${o.delivery ? fmt(o.delivery) : 'free'}</p></div>
          <div><span class="mono mute">Delivering to</span><p>${esc(o.customer.name)}<br>${esc(o.address.address)}, ${esc(o.address.area)}, ${esc(o.address.city)}</p>
          ${hist.length ? `<span class="mono mute">Updates</span><ul class="thist">${hist.map((h) => `<li><b>${esc(h.status)}</b>${h.note ? ' / ' + esc(h.note) : ''}<small>${when(h.at)}</small></li>`).join('')}</ul>` : ''}
          <a class="link" target="_blank" rel="noopener" href="https://wa.me/${esc(C.whatsapp)}?text=${encodeURIComponent('Assalam o Alaikum DAUR Supply, I have a question about order ' + o.id)}">Ask about this order on WhatsApp</a></div></div>
      </article>`;
    };
    const run = (q) => {
      q = (q || '').trim(); if (!q) { $('#tres').innerHTML = ''; return; }
      const all = store.get('orders', []);
      const phone = /^[+\d\s-]+$/.test(q) ? C.normPhone(q) : null;
      const hits = phone ? all.filter((o) => C.normPhone(o.customer.phone) === phone) : all.filter((o) => o.id === q.toUpperCase().replace(/\s/g, '') || o.id === 'DAUR-' + q.toUpperCase().replace(/^DAUR-?/, ''));
      $('#tres').innerHTML = hits.length ? `<p class="mono mute" style="margin:26px 0 14px">${hits.length} order${hits.length > 1 ? 's' : ''} found</p>` + hits.map(cardOf).join('')
        : `<div class="note-box" style="margin-top:24px">${phone || /^\d/.test(q) ? 'No orders found for that mobile number.' : 'No order found with that number.'} Orders are matched on the device they were placed from until the store goes live with its order system. <a class="link" target="_blank" rel="noopener" href="https://wa.me/${esc(C.whatsapp)}?text=${encodeURIComponent('Assalam o Alaikum DAUR Supply, please share the status of my order: ' + q)}">Ask on WhatsApp</a></div>`;
    };
    $('#tf').addEventListener('submit', (e) => { e.preventDefault(); run($('#tq').value); });
    if (param) { $('#tq').value = param; run(param); }
  };

  /* ---- wishlist ---- */
  V.wishlist = function () {
    setMeta('Liked pairs | DAUR Supply', 'The DAUR Supply pairs you liked.');
    const ps = wish.map(prod).filter(Boolean);
    app.innerHTML = `<section class="phero"><div class="wrap"><span class="eyebrow">Liked / ${ps.length}</span><h1>Liked pairs.</h1><p class="aside">Your shortlist, saved on this device. When you are ready, your size is a tap away.</p></div></section>
      <div class="wrap" style="padding-block:32px 96px">${ps.length ? `<div class="grid">${ps.map((p, i) => card(p, i)).join('')}</div>` : `<div class="empty"><span class="mono">Nothing saved yet</span><a class="btn ghost" href="${link('shop')}">Browse the catalog</a></div>`}</div>`;
    bindCards(app);
  };

  /* ---- old alert list address ---- */
  // the alert sign up was retired; anyone arriving on its old address lands in the shop instead
  V.list = function () { location.replace(link('shop')); if (SPA) route(); };

  /* ---- manifesto ---- */
  // home "Shop by line" card: one pair at rest, the line fans out on hover with honest price tags
  function lineCard(l, i) {
    const ps = l.ps, a = lineName(l.key);
    const pairs = ps.length ? [[ps[0], ps[0].variants[0]]] : []; // one hero pair per line keeps every card clean
    const tag = { Men: 'Made for the way you move.', Women: 'Clean lines, quiet confidence.', Kids: 'Real leather for small feet.', Sneakers: 'Real leather, street ready.', Leather: 'Full grain, made for occasions.', Hybrids: 'All day leather comfort.' }[l.key] || 'Crafted in Pakistan.';
    const from = ps.length ? Math.min(...ps.map(minPrice)) : 0;
    return `<a class="line-card" href="${link('shop', l.key.toLowerCase())}" style="--n:${pairs.length}">
      <span class="lc-badge">${ps.length} style${ps.length === 1 ? '' : 's'}</span><span class="lc-no mono">${ONE ? 'Style' : 'Line'} 0${i + 1} / DAUR</span>
      <span class="lc-big" aria-hidden="true" style="--len:${(ONE ? l.key.replace('Hybrids', 'Casual') : a).length}">${esc(ONE ? l.key.replace('Hybrids', 'Casual') : a)}</span>
      <span class="lc-stage">${pairs.map(([p, v], k) => `<span class="lc-shoe s${k}"><span class="lc-art">${visual(p, v)}${k === 0 ? `<span class="lc-bp">${visual(p, v, { mode: 'blueprint' })}</span><span class="lc-seal">Crafted in Pakistan / DAUR sealed</span>` : ''}</span>${k < 3 ? `<span class="lc-tag"><b>${esc(p.name)}</b><em>${fmt(v.price)}</em>${SELL.retailAnchor ? `<s>${fmt(C.marketRetail)}+</s>` : ''}</span>` : ''}</span>`).join('')}</span>
      <span class="lc-foot"><span class="lc-t">${esc(a)}</span><span class="lc-line">${tag} From ${fmt(from)}.</span></span>
      <span class="lc-cta">Shop ${esc(a.toLowerCase())} ${ic('arrow')}</span>
    </a>`;
  }
  V.manifesto = function () {
    setMeta('Our Story | Men\'s Shoes Crafted in Pakistan | DAUR Supply', 'DAUR Supply chooses men\'s leather shoes and sneakers at workshops in Lahore, Sialkot and Kasur, checks every pair by hand, finishes it with its own hardware and gives at least 5% of profit every quarter.');
    const CH = [
      { id: 'why', n: 'Why DAUR', k: 'bench', h: 'Real craft has a home. It is here.', big: 'Pakistan makes fine leather shoes. DAUR gives that work a name you can trust.', p: [STORY, 'Daur means era. Naya daur is our promise: a new era for the shoes Pakistan makes, and for the men who wear them.'] },
      { id: 'workshops', n: 'The workshops', k: 'workshop', h: 'Lahore, Sialkot and Kasur.', big: 'Every DAUR pair is chosen at a workshop in one of these three cities.', p: ['Punjab is one of the centres of Pakistan\'s leather footwear trade, with production mainly in and around Lahore and Sialkot. The country has around 800 tanneries, and a widely cited 2016 report counted more than 500,000 people working in its leather industry.', 'We do not own these workshops and we do not claim to make the shoes ourselves. Our work is to find the best of what they make, choose it pair by pair and stand behind it with our name.'], src: [['SOMO, Leather products from Pakistan, 2021', 'https://www.somo.nl/nl/wp-content/uploads/sites/2/2021/04/Leather-products-from-Pakistan-mapping-paper.pdf']] },
      { id: 'checks', n: 'Our checks', k: 'checked', h: 'Six checks before the seal.', big: 'If a pair is not right, it does not ship.', list: ANAT.map((a) => [a.t, a.d]) },
      { id: 'finish', n: 'The DAUR finish', k: 'tools', h: 'Branded, not labeled.', big: 'Our mark lives on the hardware, not across the shoe.', list: [['Matte cotton laces', 'Thick matte black woven cotton laces replace the factory laces.'], ['Engraved dubrae', 'A laser engraved DAUR metal tag on the bottom lace row.'], ['Supply Unit seal', 'A matte black rubber seal on the top eyelet. Keep it on until you are sure of the size.'], ['The box', 'A sturdy box, tissue wrap and a card that explains how your pair reached you.']] },
      { id: 'slice', n: 'The slice', k: '', h: 'A share that is not ours to keep.', big: 'At least ' + GIVE.pct + '% of our profit, never of your price, given every quarter.', p: ['We pool the slice from every pair and give it at the end of each quarter to verified cases of need that we check ourselves. Every giving is published on Our giving, with its date and amount. We never show the faces of the people we help.'], quote: true, cta: ['giving', 'How our giving works'] },
      { id: 'claims', n: 'What we do not claim', k: '', h: 'Honest, even about our limits.', big: 'Trust is built on what we can show, so we leave out what we cannot.', list: [['Not handmade by DAUR', 'Skilled workshops make the pairs. We choose, check and finish them.'], ['No green claims', 'We do not call our shoes carbon free or eco friendly. We cannot prove it yet.'], ['No invented discounts', 'A crossed out price is always a price we really charged.'], ['Leather stated per pair', 'Each product page lists the upper, lining and sole as the workshop confirms them.']] }
    ];
    app.innerHTML = `<section class="f-hero f-hero-s${simg('bench') ? ' has-photo' : ''}"><div class="f-hero-media" aria-hidden="true">${photo('bench', '', { eager: true })}</div>
      <div class="wrap f-hero-in"><span class="f-kicker">Our story</span><h1>Naya daur.</h1><p>Pakistan's craft, chosen by hand and brought to your door.</p></div></section>
      <nav class="f-chips wrap" aria-label="Chapters">${CH.map((c, i) => `<a href="#${c.id}" data-jump="${c.id}"><span class="mono">0${i + 1}</span>${c.n}</a>`).join('')}</nav>
      ${CH.map((c, i) => `<section class="sheet f-sec f-ch${i % 2 ? ' rev' : ''}" id="${c.id}"><div class="wrap f-ch-g">
        <div class="f-ch-m rv">${c.k && simg(c.k) ? photo(c.k, '', { sizes: '(max-width: 860px) 100vw, 50vw' }) : c.id === 'slice' ? `<span class="f-ch-loaf" data-recut>${loaf(GIVE.pct + '%', 'big')}</span>` : `<span class="f-ch-n">0${i + 1}</span>`}</div>
        <div class="f-ch-t rv"><span class="eyebrow">0${i + 1} / ${c.n}</span><h2>${c.h}</h2><p class="big">${c.big}</p>
          ${(c.p || []).map((t) => `<p>${esc(t)}</p>`).join('')}
          ${c.list ? `<dl class="f-list">${c.list.map(([a, b]) => `<div><dt>${esc(a)}</dt><dd>${esc(b)}</dd></div>`).join('')}</dl>` : ''}
          ${c.quote ? '<blockquote class="hadith"><p>&ldquo;Charity does not decrease wealth.&rdquo;</p><cite>Prophet Muhammad &#xFDFA;, Sahih Muslim 2588</cite></blockquote>' : ''}
          ${c.src ? `<p class="f-src mono">Source: ${c.src.map(([t, u]) => `<a class="link" href="${u}" target="_blank" rel="noopener">${esc(t)}</a>`).join(', ')}</p>` : ''}
          ${c.cta ? `<a class="link" href="${link(c.cta[0])}">${c.cta[1]}</a>` : ''}</div>
      </div></section>`).join('')}
      <section class="sheet f-sec"><div class="wrap"><div class="signup closer"><h2>Welcome to the new daur.</h2><div class="closer-r"><p>Every pair is checked by hand, paid for on delivery and covered by a 5 day size exchange.</p><div class="hero-cta"><a class="btn volt" href="${link('shop')}">Shop the collection <span class="arr">&rarr;</span></a><a class="btn ghost" href="${link('contract')}">Our promise</a></div></div></div></div></section>
      <div class="wrap credits"><span class="mono mute">Credits</span><p>Footer shoe icons from <a class="link" href="https://www.flaticon.com" target="_blank" rel="noopener">Flaticon</a>, recoloured for DAUR Supply.</p></div>`;
    cutWhenSeen(app);
  };

  /* ---- about ---- */
  const PHONE = () => { const n = String(C.whatsapp || ''); return n.startsWith('92') ? '0' + n.slice(2, 5) + ' ' + n.slice(5) : n; };
  V.about = function () {
    setMeta('About DAUR Supply | Pakistani Men\'s Shoe Brand, Dispatched from Islamabad', 'DAUR Supply is a Pakistani footwear brand for men: leather sneakers, formal shoes and chelsea boots from workshops in Lahore, Sialkot and Kasur, dispatched from Islamabad with Cash on Delivery.');
    const hero = prod('moc-runner-v1') || P[0], hv = hero.variants[0];
    const facts = [
      ['The brand', 'DAUR Supply', 'A Pakistani footwear brand for men, sold online at daursupply.com.'],
      ['The name', '<bdi lang="ur">دور</bdi>, an era', 'From the Urdu word for an era. Our line is Naya daur.'],
      ['What we sell', 'Men\'s shoes', 'Leather sneakers, formal shoes, chelsea boots and casual slip ons, crafted in Pakistan.'],
      ['Made in', 'Lahore, Sialkot, Kasur', 'Finished pairs chosen from the workshops, then checked by hand, pair by pair.'],
      ['Dispatch', 'Islamabad', 'Every order leaves from Islamabad within 24 hours of confirmation.'],
      ['Payment', 'Cash on Delivery', 'To every city in Pakistan our couriers reach. Free delivery on ' + C.freeDeliveryPairs + ' pairs.'],
      ['After delivery', '5 day exchange', 'Size exchange within 5 days, defects covered for 30 days.']
    ];
    app.innerHTML = `<section class="phero"><div class="wrap"><span class="eyebrow">About DAUR Supply</span><h1>Named for<br>an era.</h1><p class="aside"><bdi lang="ur">دور</bdi> means an era in Urdu. Ours is Naya daur: Pakistani craft, worn with pride.</p></div></section>

    <section class="sheet x ab-intro" id="hero"><div class="hero-light"></div><div class="wrap ab-grid">
      <div class="ab-copy rv"><span class="eyebrow">Who we are</span>
        <p class="big">DAUR Supply is a Pakistani footwear brand for men. We choose finished pairs from workshops in Lahore, Sialkot and Kasur, check every one by hand and finish it with our own hardware.</p>
        <p>Thick matte black cotton laces, an engraved metal lace tag and the DAUR seal: that is how you know a pair is ours. The leather does the rest.</p>
        <div class="hero-cta"><a class="btn volt" href="${link('shop')}">Shop the collection <span class="arr">&rarr;</span></a><a class="btn ghost" href="${link('manifesto')}">Read our story</a></div></div>
      <div class="hero-stage ab-stage" id="stage" aria-label="${esc(hero.name)}, move over the pair to see its construction">
        <div class="layer float">${visual(hero, hv)}</div>
        <div class="layer bp">${visual(hero, hv, { mode: 'blueprint' })}</div>
        <div class="ring" data-label="X-RAY / THE CRAFT INSIDE"></div>
      </div>
    </div></section>

    <section class="sheet x"><div class="wrap">
      ${head('In plain words', 'DAUR, at a glance.')}
      <div class="ctable">${facts.map(([k, v, d], i) => `<div class="crow rv"><span class="k">${ic(['spark', 'bolt', 'box', 'pin', 'truck', 'cash', 'swap'][i])}${k}</span><span class="v">${v}</span><span class="d">${d}</span></div>`).join('')}</div>
    </div></section>

    <div class="marquee" aria-hidden="true"><div class="marquee-track">${[0, 1].map(() => '<span>Lahore</span><i>+</i><span class="o">Sialkot</span><i>+</i><span>Kasur</span><i>+</i><span class="o">Dispatched from Islamabad</span><i>+</i><span>Naya daur</span><i>+</i>').join('')}</div></div>

    <section class="sheet x"><div class="wrap">
      ${head('Bench to doorstep', 'How a pair reaches you.')}
      <div class="van-road" aria-hidden="true"><div class="van">${VAN}</div></div>
      <div class="steps">${[['Chosen', 'We visit workshops in Lahore, Sialkot and Kasur and choose finished pairs at the bench.'], ['Checked', 'Stitching, leather grain, sole bond and comfort, checked pair by pair.'], ['Re-laced', 'Thick matte black cotton laces go in, with the engraved DAUR lace tag.'], ['Sealed', 'The DAUR seal is clipped to the top eyelet and the pair is boxed.'], ['Delivered', 'We confirm with you, dispatch from Islamabad within 24 hours, and you pay on delivery.']].map(([t, d], i) => `<div class="step"><span class="n">${String(i + 1).padStart(2, '0')}</span><h3>${t}</h3><p>${d}</p></div>`).join('')}</div>
    </div></section>

    <section class="sheet x"><div class="wrap"><div class="signup closer">
      <h2>Questions first? Ask a person.</h2>
      <div class="closer-r"><p>WhatsApp or call ${esc(PHONE())}, or email ${esc(C.supportEmail)}. Every order is confirmed with you before it ships.</p>
        <div class="hero-cta"><a class="btn volt" href="${waChat('Assalam o Alaikum DAUR Supply, I have a question.')}" target="_blank" rel="noopener">${ic('whatsapp')}Chat on WhatsApp</a><a class="btn ghost" href="${link('contact')}">All contact options</a></div></div>
    </div></div></section>`;
    bindLens($('#stage'), $('#hero'));
  };

  /* ---- contact ---- */
  V.contact = function () {
    setMeta('Contact DAUR Supply | WhatsApp, Phone and Email', 'Contact DAUR Supply on WhatsApp or phone ' + PHONE() + ', or email ' + C.supportEmail + '. Orders dispatched from Islamabad with Cash on Delivery across Pakistan.');
    const ch = [
      ['whatsapp', 'WhatsApp', PHONE(), 'Fastest for sizing, orders and exchanges.', waChat('Assalam o Alaikum DAUR Supply, I have a question.'), true],
      ['phone', 'Call', PHONE(), 'Same number as WhatsApp.', 'tel:+' + C.whatsapp],
      ['mail', 'Email', C.supportEmail, 'For anything that needs photos or detail.', 'mailto:' + C.supportEmail],
      ['instagram', 'Instagram', '@daursupply', 'Drops and fit checks. Messages open.', 'https://www.instagram.com/daursupply'],
      ['facebook', 'Facebook', 'facebook.com/daursupply', 'Messages open.', 'https://www.facebook.com/daursupply']
    ];
    const form = SHOP ? `<form class="ct-form rv" method="post" action="/contact#ct-form" id="ct-form" accept-charset="UTF-8">
        <input type="hidden" name="form_type" value="contact"><input type="hidden" name="utf8" value="&#10003;">
        <span class="eyebrow">Write to us</span>
        <label><span>Name</span><input name="contact[name]" autocomplete="name" required></label>
        <label><span>Phone or WhatsApp</span><input name="contact[phone]" type="tel" autocomplete="tel" inputmode="tel"></label>
        <label><span>Email</span><input name="contact[email]" type="email" autocomplete="email" required></label>
        <label class="full"><span>Message</span><textarea name="contact[body]" rows="4" required placeholder="Order number, pair, size or question"></textarea></label>
        <button class="btn volt" type="submit">Send message <span class="arr">&rarr;</span></button>
      </form>` : '';
    app.innerHTML = `<section class="phero"><div class="wrap"><span class="eyebrow">Contact</span><h1>Talk to<br>a person.</h1><p class="aside">Dispatched from Islamabad, delivered across Pakistan. We are an online store, so every order starts here or on WhatsApp.</p></div></section>

    <section class="sheet x"><div class="wrap ct-grid">
      <div class="ct-list">${ch.map(([i, k, v, d, href, main], n) => `<a class="ct-card rv${main ? ' main' : ''}" href="${href}"${/^https/.test(href) ? ' target="_blank" rel="noopener"' : ''} style="--d:${n * 0.06}s"><span class="ct-ic">${ic(i)}</span><span class="ct-k mono">${k}</span><b class="ct-v">${esc(v)}</b><span class="ct-d">${d}</span><span class="ct-go" aria-hidden="true">${ic('arrow')}</span></a>`).join('')}</div>
      <div class="ct-art">${polArt('contact')}</div>
    </div></section>

    <section class="sheet x"><div class="wrap">
      ${head('Already ordered?', 'The answer may be one tap away.')}
      <div class="ct-help">${[['truck', 'Track your order', 'Where your pair is right now.', link('track')], ['swap', 'Exchanges and sizing', '5 day size exchange, 30 day defect cover, size guide.', link('contract')], ['shield', 'Policies', 'Delivery, Cash on Delivery, returns and privacy.', link('policies')]].map(([i, t, d, h]) => `<a class="ct-help-i rv" href="${h}"><span class="ct-ic">${ic(i)}</span><b>${t}</b><span>${d}</span><span class="arr">&rarr;</span></a>`).join('')}</div>
    </div></section>

    ${form ? `<section class="sheet x"><div class="wrap ct-form-w">${form}</div></section>` : ''}`;
    if (SHOP && /contact_posted=true/.test(location.search)) toast('Message sent. We will reply soon.');
  };

  /* ---- runway ---- */
  // every pair stands on one studio floor. The chosen pair steps forward and the others fall back out of focus;
  // Inspect clears the floor, puts numbered points on the pair and opens its details beside it.
  // A colour shows its own cut out photo when a product image has alt text starting "Runway:" (transparent PNG,
  // side profile, toe to the right); every other pair is drawn live, so the floor always reads as one set.
  const RW_ST = 226; // top of the sole line in the drawing (shoe.js)
  function rwDetails(p) {
    const S = (SHOE.SHAPES || {})[p.silhouette] || (SHOE.SHAPES || {}).court, sp = p.specs || {}, ST = RW_ST;
    const said = (k, fallback) => sp[k] ? sp[k].replace(/\.?$/, '. ') + fallback : fallback;
    const out = [{ t: 'The upper', d: said('Upper', 'Bent at the flex point and checked for cracks and loose grain before we accept the pair.'), x: S.laced ? 352 : S.loafer ? 170 : S.chelsea || S.slip ? 380 : 300, y: (S.ey + ST) / 2 + (S.laced ? 14 : S.chelsea ? 20 : 8) }];
    out.push(S.moc ? { t: 'Moc toe stitching', d: said('Stitch', 'Tight, even spacing all round the toe. A wavy or skipped stitch is a reject at our checking table.'), x: 440, y: (S.ey + S.toe + 30) / 2 }
      : { t: 'Stitching', d: said('Stitch', 'Even, tight stitching at the toe and heel. A wavy or skipped stitch is a reject at our checking table.'), x: 470, y: (ST - 6 + S.toe + 18) / 2 - 4 });
    if (S.laced) {
      // the same points shoe.js uses: the first and last eyelets
      const x0 = S.tx + 20, y0 = S.ty + 18, x1 = S.ex - 8, y1 = S.ey + 9;
      out.push({ t: 'Laces and dubrae', d: 'Thick matte black woven cotton laces replace the factory pair, with the laser engraved DAUR dubrae on the bottom row.', x: x1, y: y1 - 5 });
      out.push({ t: 'Supply Unit seal', d: 'A matte black rubber seal on the top eyelet. Keep it on until you are sure of the size: exchanges need it attached.', x: x0 - 3, y: y0 + 59 });
    } else if (S.chelsea) {
      out.push({ t: 'Elastic side gussets', d: 'Stretch panels on both sides, so the boot slips on without laces and holds the ankle snug.', x: 270, y: (S.dipY + ST - 52) / 2 });
      out.push({ t: 'Pull tab', d: 'A heel loop to pull the boot on, stitched into the back seam.', x: 95, y: S.heel - 14 });
    } else if (S.slip) {
      out.push({ t: 'Elastic gore', d: 'A stretch insert under the vamp, so the shoe slips on and still holds your foot.', x: S.tx - 14, y: S.ty + 16 });
    } else if (S.loafer) {
      out.push({ t: 'Saddle strap and tassels', d: 'A stitched saddle strap across the vamp, finished with a knotted tassel pair.', x: S.tx + 44, y: S.ty + 30 });
    }
    out.push({ t: 'The sole', d: said('Sole', 'Bonded to the upper and pull tested at toe and heel. Any gap sends the pair back.'), x: 300, y: ST + S.sole * 0.62 });
    if (out.length < 5 && sp.Lining) out.splice(1, 0, { t: 'Lining', d: sp.Lining.replace(/\.?$/, '.') + ' Felt along the collar, where your heel sits.', x: 122, y: S.heel + 16 });
    // where each point sits: in the drawing (per cent of the drawing box) and as a share of the shoe's own outline, for photos
    const T = Math.min(S.heel - (S.chelsea ? 28 : 4), S.ty - 22), B = ST + S.sole + (S.derby ? 12 : 0);
    return out.slice(0, 5).map((o) => Object.assign(o, { dx: (30 + 0.84 * o.x - 62) / 4.76, dy: (o.y - 30) / 2.82, fx: (o.x - 70) / 4.96, fy: (o.y - T) / (B - T) * 100 }));
  }
  const rwArt = (p, v, vb) => v.runway ? `<img src="${esc(v.runway)}" alt="" draggable="false" decoding="async">` : SHOE.render({ name: p.name, colorway: v.color, silhouette: p.silhouette, palette: v.palette }, vb ? { viewBox: vb } : {});
  // a close crop of one detail, for its row in the panel
  function rwThumb(p, v, o) {
    if (v.runway) return `<span class="rw-th-i" style="background-image:url('${esc(v.runway)}');background-position:${o.fx.toFixed(1)}% ${o.fy.toFixed(1)}%" aria-hidden="true"></span>`;
    const X = 30 + 0.84 * o.x, Y = o.y;
    return rwArt(p, v, `${(X - 76).toFixed(1)} ${(Y - 57).toFixed(1)} 152 114`);
  }
  let rwModelJs = null;
  const rwModelViewer = () => rwModelJs || (rwModelJs = new Promise((ok, no) => {
    if (window.customElements && customElements.get('model-viewer')) return ok();
    const s = document.createElement('script'); s.type = 'module'; s.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js';
    s.onload = () => ok(); s.onerror = () => { rwModelJs = null; no(); }; document.head.appendChild(s);
  }));

  // the Runway lives in the home page hero now; the old page address sends visitors there
  V.runway = function () { location.replace(link('home')); if (SPA) route(); };

  // the line of pairs, drawn into any host. It never ends: after the last pair comes the first again.
  // One click on a pair opens what you need to buy it (colour, size, add to bag, like); the checked details
  // and the numbered points on the pair only appear when asked for.
  function runway(host, opt) {
    opt = opt || {};
    const list = P.slice();
    if (!host || !list.length) return;
    const n = list.length, ring = (i) => ((i % n) + n) % n;
    // the shortest way round the ring from pair a to pair i
    const off = (i, from) => { let d = ring(i) - from; if (d > n / 2) d -= n; else if (d < -n / 2) d += n; return d; };
    const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let lite = document.documentElement.classList.contains('lite');
    const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
    const vs = list.map((p) => p.variants.find(stockOf) || p.variants[0]);
    let a = 0, mode = 'browse', pin = -1, size = null, dets = [], detOpen = false, gpos = 0;
    const pairHTML = (p, i) => `<button class="rw-pair" type="button" data-i="${i}" aria-label="${esc(p.name)}, ${esc(vs[i].color)}"><span class="rw-tilt"><span class="rw-zoom"><span class="rw-face">${rwArt(p, vs[i])}</span><span class="rw-pins"></span></span></span></button>`;
    const likeB = (pid, cls) => `<button class="rw-like ${cls || ''}" type="button" data-wish="${pid}" aria-pressed="${wish.includes(pid)}" aria-label="Like this pair">${ic('heart', 'h-o')}${ic('heartFill', 'h-f')}</button>`;
    host.innerHTML = `<section class="rw rw-home" id="rw" aria-roledescription="carousel" aria-label="Every DAUR pair, one after another">
      <div class="rw-stage" id="rwStage" tabindex="0">
        <div class="rw-floor" aria-hidden="true"><i class="rw-grid" id="rwGrid"></i></div>
        <div class="rw-head wrap">${opt.head || ''}</div>
        <div class="rw-line" id="rwLine">${list.map(pairHTML).join('')}</div>
        <div class="rw-call" id="rwCall" aria-live="polite"></div>
        <div class="rw-3d" id="rw3d" hidden></div>
      </div>
      <div class="rw-bar wrap">
        <div class="rw-now" aria-live="polite"><span class="mono" id="rwN"></span><b id="rwName"></b><span class="mono" id="rwPrice"></span></div>
        <div class="rw-ticks" role="tablist" aria-label="Pairs in the line">${list.map((p, i) => `<button type="button" role="tab" data-t="${i}" aria-label="${esc(p.name)}"><i></i></button>`).join('')}</div>
        <div class="rw-acts">${calm ? '' : `<button class="rw-arr rw-pp" type="button" id="rwPlay" aria-pressed="false" aria-label="Pause the line">${ic('pause', 'pp-pa')}${ic('play', 'pp-pl')}</button>`}<button class="rw-arr" type="button" id="rwPrev" aria-label="Previous pair">${ic('arrow')}</button><button class="rw-arr r" type="button" id="rwNext" aria-label="Next pair">${ic('arrow')}</button><span class="rw-like-w" id="rwLikeW"></span><button class="btn volt" type="button" id="rwGo">Choose this pair</button></div>
      </div>
      <aside class="rw-panel" id="rwPanel" aria-label="Choose your size and colour" hidden></aside>
    </section>`;

    const rw = $('#rw', host), stage = $('#rwStage', host), line = $('#rwLine', host), panel = $('#rwPanel', host), call = $('#rwCall', host), grid = $('#rwGrid', host), box3d = $('#rw3d', host);
    const pairs = $$('.rw-pair', line), ticks = $$('[data-t]', rw);
    const alive = () => document.body.contains(rw);
    let W = 0, fw = 0, narrow = false, pw = 0, goneT = 0;
    const measure = () => {
      W = stage.clientWidth; narrow = W < 961;
      pw = narrow ? 0 : Math.min(430, Math.round(W * 0.36));
      fw = narrow ? Math.min(W * 0.9, 560) : Math.min((W - pw) * 0.66, 720);
      rw.style.setProperty('--fw', Math.round(fw) + 'px'); rw.style.setProperty('--pw', pw + 'px');
    };
    // the camera: where each pair stands for the pair in front, measured the short way round the ring
    function place(stagger) {
      pairs.forEach((el, i) => {
        const d = off(i, a), ad = Math.abs(d), sg = Math.sign(d);
        let x, z, s = 1, r = 0, o, b;
        if (mode === 'inspect' && d) { x = sg * (W * 0.55 + ad * 60); z = -900; o = 0; b = lite ? 0 : 12; }
        else if (!d) { x = mode === 'inspect' && !narrow ? -pw / 2 : 0; z = 0; s = mode === 'inspect' ? (narrow ? 1.1 : 1.08) : 1; o = 1; b = 0; }
        else { x = sg * (fw * (narrow ? 0.58 : 0.6) + (ad - 1) * fw * (narrow ? 0.34 : 0.4)); z = -ad * (narrow ? 420 : 380); r = -sg * 14; o = ad > 3 ? 0 : [1, 0.9, 0.62, 0.34][ad]; b = lite ? 0 : Math.min(ad * 2.4, 7.2); }
        // a pair that wraps from one end of the line to the other travels unseen
        const wrapped = el._d != null && Math.abs(d - el._d) > n / 2 && !stagger;
        el._d = d;
        if (wrapped) { el.style.transition = 'none'; el.style.opacity = 0; void el.offsetWidth; }
        el.style.setProperty('--x', x.toFixed(1) + 'px'); el.style.setProperty('--z', z + 'px'); el.style.setProperty('--s', s); el.style.setProperty('--r', r + 'deg');
        if (wrapped) { void el.offsetWidth; el.style.transition = ''; }
        el.style.opacity = o;
        el.style.filter = b ? `blur(${b}px)` : 'none';
        el.style.zIndex = 50 - ad; el.style.transitionDelay = stagger ? (ad * 0.09).toFixed(2) + 's' : '';
        el.classList.toggle('on', !d); el.tabIndex = o ? 0 : -1; el.setAttribute('aria-hidden', o ? 'false' : 'true');
        if (o) el.style.visibility = '';
        el.setAttribute('aria-label', `${list[i].name}, ${vs[i].color}. ${mode === 'inspect' && !d ? 'Chosen' : 'Choose this pair'}`);
      });
      // pairs that have faded out leave the picture entirely once they are gone, so the browser stops drawing them
      clearTimeout(goneT); goneT = setTimeout(() => pairs.forEach((el) => { if (el.style.opacity === '0') el.style.visibility = 'hidden'; }), stagger ? 1900 : 950);
      grid.style.setProperty('--gx', (-gpos * 72) + 'px');
      ticks.forEach((t, i) => t.setAttribute('aria-selected', i === a));
      const p = list[a], v = vs[a];
      $('#rwN', rw).textContent = String(a + 1).padStart(2, '0') + ' / ' + String(n).padStart(2, '0');
      $('#rwName', rw).textContent = p.name;
      $('#rwPrice', rw).textContent = fmt(v.price) + (onSale(v) ? ' / was ' + fmt(v.compareAt) : '');
      $('#rwGo', rw).textContent = mode === 'inspect' ? 'Back to the line' : 'Choose this pair';
      const lw = $('#rwLikeW', rw);
      if (lw.dataset.pid !== p.id) { lw.dataset.pid = p.id; lw.innerHTML = likeB(p.id, 'rw-arr'); $('[data-wish]', lw).addEventListener('click', (e) => { e.stopPropagation(); hold(); toggleWish(p.id); }); }
    }
    // a little depth for the pair in front: a few darker copies behind the face give it thickness when it turns
    function depth() {
      $$('.rw-sl', line).forEach((x) => x.remove());
      if (lite || calm) return;
      const z = $('.rw-zoom', pairs[a]), face = $('.rw-face', pairs[a]);
      for (let k = 5; k >= 1; k--) { const sl = document.createElement('span'); sl.className = 'rw-sl'; sl.style.setProperty('--k', k); sl.setAttribute('aria-hidden', 'true'); sl.innerHTML = face.innerHTML; z.insertBefore(sl, face); }
    }
    // the numbered points sit on the pair only while its details are open
    function pinsFor(i) {
      const el = pairs[i], p = list[i], v = vs[i], wrap = $('.rw-pins', el);
      dets = rwDetails(p);
      if (!detOpen) { wrap.innerHTML = ''; return; }
      wrap.innerHTML = dets.map((o, k) => `<button class="rw-pin" type="button" data-pin="${k}" style="--i:${k};left:${(v.runway ? o.fx : o.dx).toFixed(2)}%;top:${(v.runway ? o.fy : o.dy).toFixed(2)}%" aria-label="Detail ${k + 1}: ${esc(o.t)}" aria-pressed="false"><span>${k + 1}</span></button>`).join('');
      $$('.rw-pin', wrap).forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); choose(+b.dataset.pin === pin ? -1 : +b.dataset.pin); }));
    }
    function choose(k) {
      pin = k;
      const el = pairs[a], zm = $('.rw-zoom', el), o = dets[k];
      $$('.rw-pin', el).forEach((b) => b.setAttribute('aria-pressed', +b.dataset.pin === k));
      $$('[data-row]', panel).forEach((r) => r.setAttribute('aria-pressed', +r.dataset.row === k));
      if (k < 0 || !o) { zm.style.setProperty('--zs', 1); call.classList.remove('on'); return; }
      const v = vs[a];
      zm.style.transformOrigin = `${(v.runway ? o.fx : o.dx).toFixed(2)}% ${(v.runway ? o.fy : o.dy).toFixed(2)}%`;
      zm.style.setProperty('--zs', narrow ? 1.4 : 1.5);
      call.innerHTML = `<span class="mono">${String(k + 1).padStart(2, '0')} / ${String(dets.length).padStart(2, '0')}</span><b>${esc(o.t)}</b><p>${esc(o.d)}</p><div class="rw-call-a"><button type="button" data-cn="-1" aria-label="Previous detail">${ic('arrow')}</button><button type="button" data-cn="1" aria-label="Next detail">${ic('arrow')}</button><button type="button" class="mono" data-cx>Close</button></div>`;
      call.classList.add('on');
      $$('[data-cn]', call).forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); choose((pin + +b.dataset.cn + dets.length) % dets.length); }));
      $('[data-cx]', call).addEventListener('click', (e) => { e.stopPropagation(); choose(-1); });
      const row = $(`[data-row="${k}"]`, panel); if (row && !narrow && row.scrollIntoView) row.scrollIntoView({ block: 'nearest', behavior: calm ? 'auto' : 'smooth' });
    }
    // what you need to buy the pair comes first; the checked details wait behind one tap
    function paintPanel() {
      const p = list[a], v = vs[a], st = v.stock || {};
      const keep = Math.max(0, C.marketRetail - v.price);
      panel.innerHTML = `<div class="rw-pn-h"><span class="eyebrow">${esc(lineName(p.category))} / ${String(a + 1).padStart(2, '0')} of ${String(n).padStart(2, '0')}</span><div class="rw-pn-a">${likeB(p.id, 'rw-x')}<button class="rw-x" type="button" id="rwX" aria-label="Back to the line">&times;</button></div></div>
        <h2>${esc(p.name)}</h2><p class="rw-pn-sub mono">${esc(v.color)}</p>
        <div class="rw-math">${onSale(v) ? `<div><span class="k">Sale price</span><b class="num">${fmt(v.price)}</b></div><div><span class="k">Was</span><span class="num strike">${fmt(v.compareAt)}</span></div><div><span class="k">You save</span><b class="num">${fmt(v.compareAt - v.price)}</b></div>`
          : SELL.retailAnchor ? `<div><span class="k">DAUR price</span><b class="num">${fmt(v.price)}</b></div><div><span class="k">Typical retail</span><span class="num strike">${fmt(C.marketRetail)}+</span></div><div><span class="k">You keep</span><b class="num">${fmt(keep)}+</b></div>` : `<div><span class="k">DAUR price</span><b class="num">${fmt(v.price)}</b></div><div><span class="k">Delivery</span><b class="num">Free on ${C.freeDeliveryPairs}</b></div><div><span class="k">Pay</span><b class="num">On delivery</b></div>`}</div>
        ${p.variants.length > 1 ? `<div class="rw-cols"><div class="field-label"><span>Colour / ${esc(v.color)}</span></div><div class="swatches">${p.variants.map((x) => `<button class="sw-b" type="button" style="--c:${esc(x.hex || '#777')}" data-rv="${x.id}" aria-pressed="${x.id === v.id}" aria-label="${esc(x.color)}"></button>`).join('')}</div></div>` : ''}
        <div class="rw-size"><div class="field-label strong"><span>Size / EU ${size || ''}</span><button type="button" id="rwSg">${ic('ruler')}Size guide</button></div>
          <div class="sizes">${p.sizes.map((s) => { const q = st[s] || 0; return `<button class="size" type="button" data-s="${s}" aria-pressed="${size == s}" ${q ? '' : 'disabled aria-disabled="true"'} aria-label="EU ${s}${q ? '' : ', sold out'}">${s}</button>`; }).join('')}</div></div>
        <button class="btn volt block" type="button" id="rwAdd">${ic('bag')}<span>${size ? 'Add EU ' + size + ' to bag, ' + fmt(v.price) : stockOf(v) ? 'Select a size' : 'Sold out in this colour'}</span></button>
        <details class="rw-dd"${detOpen ? ' open' : ''}><summary><span>What we check on this pair</span><span class="mono">${dets.length} points</span></summary>
          <ol class="rw-dets">${dets.map((o, k) => `<li><button type="button" data-row="${k}" aria-pressed="${k === pin}"><span class="rw-th">${rwThumb(p, v, o)}<i>${k + 1}</i></span><span class="rw-dt"><b>${esc(o.t)}</b><span>${esc(o.d)}</span></span></button></li>`).join('')}</ol></details>
        <div class="rw-more">${p.model ? `<button class="btn ghost" type="button" id="rw3dB">Turn it in 3D</button>` : ''}<a class="link" href="${link('product', p.id + '~' + v.id)}">Full details</a></div>
        <p class="rw-note">Add a second pair and delivery is free anywhere in Pakistan. Cash on Delivery, 5 day size exchange.</p>`;
      $('#rwX', panel).addEventListener('click', () => setMode('browse'));
      $('[data-wish]', panel).addEventListener('click', () => toggleWish(p.id));
      $('.rw-dd', panel).addEventListener('toggle', (e) => {
        const o = e.target.open; if (o === detOpen) return;
        detOpen = o; if (!o) choose(-1); pinsFor(a);
      });
      $$('[data-row]', panel).forEach((b) => b.addEventListener('click', () => choose(+b.dataset.row === pin ? -1 : +b.dataset.row)));
      $$('[data-rv]', panel).forEach((b) => b.addEventListener('click', () => {
        vs[a] = variant(p, b.dataset.rv); size = null;
        $('.rw-face', pairs[a]).innerHTML = rwArt(p, vs[a]); depth(); pinsFor(a); prepPhoto(a); paintPanel(); place(); if (pin >= 0) choose(pin);
      }));
      $$('.rw-size .size', panel).forEach((b) => b.addEventListener('click', () => { size = +b.dataset.s; const y = panel.scrollTop; paintPanel(); panel.scrollTop = y; }));
      $('#rwSg', panel).addEventListener('click', () => openModal('sizeGuide'));
      $('#rwAdd', panel).addEventListener('click', () => {
        if (!stockOf(v)) return;
        if (!size) { toast('Pick a size first'); const sz = $('.rw-size .sizes', panel); if (sz.animate) sz.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }], 300); return; }
        addToCart(p.id, v.id, size, 1);
      });
      const b3 = $('#rw3dB', panel); if (b3) b3.addEventListener('click', () => open3d(p));
    }
    // opening a detail from the pair itself opens the details list too
    const openDets = () => { if (detOpen) return; detOpen = true; const dd = $('.rw-dd', panel); if (dd) dd.open = true; pinsFor(a); };
    // a real 3D file (a GLB added to the product's media in Shopify) turns under the finger; nothing is loaded until asked
    function open3d(p) {
      box3d.hidden = false; box3d.innerHTML = `<p class="mono">Loading the 3D model</p>`;
      rwModelViewer().then(() => {
        box3d.innerHTML = `<model-viewer src="${esc(p.model)}" alt="3D model of ${esc(p.name)}" camera-controls touch-action="pan-y" auto-rotate shadow-intensity="1" exposure="1" interaction-prompt="none"></model-viewer><button class="rw-x" type="button" aria-label="Close the 3D model">&times;</button>`;
        $('.rw-x', box3d).addEventListener('click', close3d);
      }).catch(() => { box3d.innerHTML = '<p class="mono">The 3D model could not load. Please try again.</p>'; setTimeout(close3d, 2200); });
    }
    function close3d() { box3d.hidden = true; box3d.innerHTML = ''; }
    function prepPhoto(i) {
      const im = $('.rw-face img', pairs[i]); if (!im) return;
      const fit = () => { if (im.naturalWidth) pairs[i].style.setProperty('--ar', (im.naturalWidth / im.naturalHeight).toFixed(3)); };
      if (im.complete) fit(); else im.addEventListener('load', fit, { once: true });
    }
    function setMode(m) {
      if (m === mode) return;
      mode = m; pin = -1; size = null; detOpen = false;
      rw.classList.toggle('inspect', m === 'inspect');
      close3d();
      const zm = $('.rw-zoom', pairs[a]); zm.style.setProperty('--zs', 1); call.classList.remove('on');
      if (m === 'inspect') { pinsFor(a); paintPanel(); panel.hidden = false; requestAnimationFrame(() => panel.classList.add('on')); }
      else { panel.classList.remove('on'); setTimeout(() => { if (mode === 'browse') panel.hidden = true; }, 450); $$('.rw-pins', line).forEach((w) => { w.innerHTML = ''; }); hold(); }
      place();
      if (m === 'inspect' && narrow) setTimeout(() => { const r = stage.getBoundingClientRect(); if (r.top < 0 || r.top > 80) window.scrollTo({ top: scrollY + r.top - 70, behavior: calm ? 'auto' : 'smooth' }); }, 60);
    }
    // moving along the line, round and round; with a pair chosen, the next pair opens straight into its options
    function go(i) {
      const d = off(i, a);
      if (!d) return;
      const keep = mode === 'inspect';
      $$('.rw-tilt', line).forEach((t) => { t.style.transform = ''; });
      if (keep) { const zm = $('.rw-zoom', pairs[a]); zm.style.setProperty('--zs', 1); $('.rw-pins', pairs[a]).innerHTML = ''; call.classList.remove('on'); close3d(); pin = -1; size = null; }
      a = ring(a + d); gpos += d;
      if (keep) { pinsFor(a); const y = panel.scrollTop; paintPanel(); panel.scrollTop = narrow ? y : 0; }
      place(); depth();
    }
    // the line moves on by itself, slowly, until someone touches it; it rests while the pointer is over it,
    // while a pair is open, while it is off screen or the tab is hidden, and never moves for reduced motion
    let paused = false, over = false, seen = true, quietTill = 0;
    const hold = () => { quietTill = Date.now() + 9000; };
    const pp = $('#rwPlay', rw);
    if (pp) pp.addEventListener('click', (e) => { e.stopPropagation(); paused = !paused; pp.setAttribute('aria-pressed', paused); pp.setAttribute('aria-label', paused ? 'Play the line' : 'Pause the line'); });
    if (!calm) {
      const auto = setInterval(() => {
        if (!alive()) { clearInterval(auto); return; }
        if (paused || over || !seen || mode !== 'browse' || document.hidden || Date.now() < quietTill || sx != null) return;
        go(a + 1);
      }, 4200);
      if (fine) { stage.addEventListener('pointerenter', () => { over = true; }); stage.addEventListener('pointerleave', () => { over = false; }); }
      stage.addEventListener('focusin', () => { over = true; }); stage.addEventListener('focusout', () => { over = false; });
      if ('IntersectionObserver' in window) new IntersectionObserver((es) => { seen = es[0].isIntersecting; }, { threshold: 0.35 }).observe(stage);
    }
    // one click on any pair opens its options; a click anywhere around it closes them again
    pairs.forEach((el, i) => el.addEventListener('click', (e) => {
      if (moved) return;
      e.stopPropagation(); hold();
      if (i !== a) go(i);
      if (mode !== 'inspect') setMode('inspect');
    }));
    stage.addEventListener('click', (e) => {
      if (moved || mode !== 'inspect') return;
      if (e.target.closest('.rw-pair.on, .rw-call, .rw-3d, .rw-head a')) return;
      setMode('browse');
    });
    ticks.forEach((t) => t.addEventListener('click', () => { hold(); go(+t.dataset.t); }));
    $('#rwPrev', rw).addEventListener('click', () => { hold(); go(a - 1); });
    $('#rwNext', rw).addEventListener('click', () => { hold(); go(a + 1); });
    $('#rwGo', rw).addEventListener('click', () => { hold(); setMode(mode === 'inspect' ? 'browse' : 'inspect'); });
    stage.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); hold(); go(a + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); hold(); go(a - 1); }
      else if (e.key === 'Escape') { if (pin >= 0) choose(-1); else setMode('browse'); }
    });
    // dragging (finger or mouse) slides the whole line with the pointer, and letting go settles on the nearest pair
    let sx = null, sy = 0, dx = 0, moved = false, dragging = false;
    const stepW = () => fw * (narrow ? 0.58 : 0.6);
    stage.addEventListener('pointerdown', (e) => {
      if (e.button > 0 || e.target.closest('.rw-3d, .rw-call, .rw-head a')) return;
      sx = e.clientX; sy = e.clientY; dx = 0; moved = false; dragging = false;
    });
    stage.addEventListener('pointermove', (e) => {
      if (sx == null) return;
      dx = e.clientX - sx; const dy = e.clientY - sy;
      if (!dragging) { if (Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(dy) * 1.2) return; dragging = true; hold(); rw.classList.add('dragging'); try { stage.setPointerCapture(e.pointerId); } catch (er) { /* fine */ } }
      line.style.transform = `translate3d(${(dx * 0.9).toFixed(1)}px, 0, 0)`;
    });
    const release = () => {
      if (sx == null) return; sx = null;
      if (!dragging) return;
      dragging = false; rw.classList.remove('dragging'); moved = true; setTimeout(() => { moved = false; }, 80); hold();
      const steps = Math.round(-dx / stepW()) || (Math.abs(dx) > 44 ? (dx < 0 ? 1 : -1) : 0);
      line.style.transform = '';
      if (steps) go(a + steps);
    };
    stage.addEventListener('pointerup', release); stage.addEventListener('pointercancel', release);
    // a trackpad or a sideways mouse wheel (or Shift and the wheel) moves along the line; up and down still scroll the page
    let wAcc = 0, wLock = 0;
    stage.addEventListener('wheel', (e) => {
      const x = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.shiftKey ? e.deltaY : 0;
      if (!x) return;
      e.preventDefault(); hold();
      if (Date.now() < wLock) return;
      wAcc += x;
      if (Math.abs(wAcc) > 50) { go(a + (wAcc > 0 ? 1 : -1)); wAcc = 0; wLock = Date.now() + 420; }
    }, { passive: false });
    // the pair in front turns a little toward the mouse, so it reads as an object rather than a picture
    if (fine && !calm) {
      let raf = 0;
      stage.addEventListener('pointermove', (e) => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0; const r = stage.getBoundingClientRect(), t = $('.rw-tilt', pairs[a]); if (!t) return;
          const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
          t.style.transform = `rotateY(${(x * (mode === 'inspect' ? 14 : 22)).toFixed(2)}deg) rotateX(${(-y * 8).toFixed(2)}deg)`;
        });
      });
      stage.addEventListener('pointerleave', () => { const t = $('.rw-tilt', pairs[a]); if (t) t.style.transform = ''; });
    }
    let rt = 0;
    const onResize = () => { if (!alive()) { removeEventListener('resize', onResize); return; } clearTimeout(rt); rt = setTimeout(() => { const was = narrow; measure(); place(); if (was !== narrow && pin >= 0) choose(pin); }, 120); };
    addEventListener('resize', onResize);
    measure();
    pairs.forEach((_, i) => prepPhoto(i));
    // the line walks in from the back of the studio the first time it is seen
    if (calm) { place(); depth(); }
    else {
      rw.classList.add('rw-in');
      pairs.forEach((el) => { el.style.setProperty('--x', '0px'); el.style.setProperty('--z', '-1600px'); el.style.setProperty('--s', 1); el.style.setProperty('--r', '0deg'); el.style.opacity = 0; });
      requestAnimationFrame(() => requestAnimationFrame(() => { place(true); depth(); setTimeout(() => { rw.classList.remove('rw-in'); pairs.forEach((el) => { el.style.transitionDelay = ''; }); }, 1500); }));
    }
    // a device that cannot keep up with the walk in (slow frames) gets the same floor without blur and depth copies
    if (!lite) {
      const fr = []; let last = 0;
      const probe = (t) => { if (last) fr.push(t - last); last = t; if (fr.length < 40 && alive()) requestAnimationFrame(probe); else if (fr.length) { fr.sort((x, y) => x - y); if (fr[fr.length >> 1] > 34) { lite = true; rw.classList.add('rw-lite'); place(); depth(); } } };
      requestAnimationFrame(probe);
    }
  }

  /* ---- offers ---- */
  // live codes come from Shopify (Content > Metaobjects > Offer, printed as window.DAUR_OFFERS); the static preview builds them from data.js
  function liveOffers() {
    const now = Date.now();
    let list = Array.isArray(window.DAUR_OFFERS) ? window.DAUR_OFFERS.slice() : null;
    if (!list) {
      list = Object.entries(C.coupons || {}).map(([code, c], i) => ({ id: code.toLowerCase(), title: c.label || code, code, details: (c.type === 'percent' ? c.value + '% off' : fmt(c.value) + ' off') + ' your order' + (c.min ? ' of ' + fmt(c.min) + ' or more' : '') + '.', min: c.min || 0, ends: null, sort: i + 1 }));
      list.push({ id: 'free-delivery', title: 'Free delivery on ' + (C.freeDeliveryPairs === 2 ? 'two' : C.freeDeliveryPairs) + ' pairs', code: '', details: 'Order ' + C.freeDeliveryPairs + ' pairs or more and delivery anywhere in Pakistan is free. No code needed.', min: 0, ends: null, sort: 50 });
    }
    return list.filter((o) => !o.ends || new Date(o.ends).getTime() > now).sort((a, b) => (a.sort || 99) - (b.sort || 99));
  }
  const untilText = (iso) => {
    const ms = new Date(iso).getTime() - Date.now(); if (!(ms > 0)) return '';
    const d = Math.floor(ms / 864e5), h = Math.floor(ms / 36e5) % 24, m = Math.floor(ms / 6e4) % 60;
    return d >= 7 ? 'Ends ' + new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Ends in ' + (d ? d + 'd ' : '') + h + 'h ' + m + 'm';
  };
  /* ---- our giving: how the slice works, and the record of every giving once there is one ----
     Records come from Shopify (Content > Metaobjects > Giving record, printed as window.DAUR_GIVING).
     With no record yet the page explains the pledge only and promises nothing it cannot show. */
  V.giving = function () {
    setMeta('Our Giving: At Least 5% of Profit to People in Need | DAUR Supply', 'On every DAUR Supply pair we set aside at least ' + GIVE.pct + '% of our profit, never added to your price, and give it every quarter to verified cases of need in Pakistan.');
    const rec = (Array.isArray(window.DAUR_GIVING) ? window.DAUR_GIVING : []).filter((r) => r && +r.amount > 0).sort((a, b) => String(b.date).localeCompare(String(a.date)));
    const sum = rec.reduce((a, r) => a + +r.amount, 0);
    const day = (d) => { const x = new Date(d + 'T12:00:00'); return isNaN(x) ? '' : x.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); };
    app.innerHTML = `<section class="phero gv-hero"><div class="wrap"><span class="eyebrow">Our giving / at least ${GIVE.pct}% of profit</span><h1>The slice.</h1>
      <p class="aside">Every pair we sell carries a share that is not ours to keep. We cut it from our profit, never from your price, and give it to people in need.</p>
      <button class="gv-loaf" type="button" data-recut aria-label="Play the cut again">${loaf(GIVE.pct + '%')}</button></div></section>

    <section class="sheet x"><div class="wrap">
      ${head('How it works', 'Same price. A slice set aside.')}
      <div class="steps gv-steps">${[['You buy a pair', 'At the same price as always. Nothing is added for charity.'], ['We cut the slice', `At least ${GIVE.pct}% of the profit we make on that pair, worked out on the price you finally pay.`], ['We give it every quarter', 'The slices are pooled and given each quarter, so the help is large enough to matter, to verified cases of need after our own checks.'], ['We publish it', 'Date, amount and the case, on this page and on our social pages. It is never a marketing budget.']].map(([t, d], i) => `<div class="step rv"><span class="n">${String(i + 1).padStart(2, '0')}</span><h3>${t}</h3><p>${d}</p></div>`).join('')}</div>
    </div></section>

    ${quarterHTML()}

    ${rec.length ? `<section class="sheet x"><div class="wrap">
      ${head('The record', fmt(sum) + ' given so far.', '', 'Every giving we make is listed here with its date and amount.')}
      <div class="gv-rec">${rec.map((r) => `<article class="gv-item rv">${r.photo ? `<img src="${esc(r.photo)}" alt="${esc(r.where || 'Giving record')}" loading="lazy" width="600" height="450">` : ''}<span class="mono mute">${esc(day(r.date))}</span><b>${esc(fmt(+r.amount))}</b>${r.where ? `<h3>${esc(r.where)}</h3>` : ''}${r.note ? `<p>${esc(r.note)}</p>` : ''}</article>`).join('')}</div>
    </div></section>` : ''}

    <section class="sheet x"><div class="wrap"><div class="gv-why">
      <blockquote class="hadith"><p>&ldquo;Charity does not decrease wealth.&rdquo;</p><cite>Prophet Muhammad &#xFDFA;, Sahih Muslim 2588</cite></blockquote>
      <p>We follow the way of the early Muslim traders: honest goods, a fair margin, and a share of every gain returned to people in need. The people we give to are our neighbours, not a campaign, and every case is treated with dignity.</p>
      <a class="btn volt" href="${link('shop')}" style="justify-self:start">Shop the collection <span class="arr">&rarr;</span></a></div></div></section>`;
    cutWhenSeen(app);
    bindVote(app);
    const pile = $('.gv-pile', app);
    if (pile && 'IntersectionObserver' in window) { const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { pile.classList.add('on'); io.disconnect(); } }, { threshold: 0.3 }); io.observe(pile); } else if (pile) pile.classList.add('on');
    reveal();
  };
  // this quarter: a slice for every pair sold so far and the buyers' votes, both counted from real orders
  // (shop metafields daur.slice_quarter / slice_pairs / slice_votes, refreshed by a daily routine); nothing shows until there is a count for the current quarter
  function quarterHTML() {
    const q = quarterOf();
    const Q = GIVE.quarter && GIVE.quarter.key === q.key ? GIVE.quarter : null;
    const n = Q ? Math.max(0, Math.floor(+Q.pairs || 0)) : 0;
    const votes = Q && Q.votes ? Q.votes : {};
    const total = GIVE.causes.reduce((a, c) => a + (+votes[c] || 0), 0);
    const shown = Math.min(n, 120);
    return `<section class="sheet x"><div class="wrap">
      ${head('This quarter / ' + q.label, n ? `${n} slice${n === 1 ? '' : 's'} so far.` : 'The loaf for this quarter.', '', n ? 'One slice for every pair bought this quarter. At the end of the quarter they are given together, to one verified case of need.' : 'Every pair bought this quarter adds a slice. At the end of the quarter they are given together, to one verified case of need.')}
      ${n ? `<div class="gv-pile" aria-label="${n} slices">${Array.from({ length: shown }, (_, i) => `<i style="--i:${i}"></i>`).join('')}${n > shown ? `<span class="mono">+ ${n - shown}</span>` : ''}</div>` : ''}
      ${GIVE.causes.length > 1 ? `<div class="gv-vote"><h3>Buyers choose where it goes.</h3><p>Vote in your bag before checkout. The cause with the most votes from this quarter's buyers receives the slice.</p>
        ${total ? `<ul class="gv-bars">${GIVE.causes.map((c) => { const v = +votes[c] || 0; const pc = Math.round(v / total * 100); return `<li><span>${esc(c)}</span><b>${pc}%</b><i style="--w:${pc}%"></i></li>`; }).join('')}</ul><p class="mono mute">${total} vote${total === 1 ? '' : 's'} so far</p>` : ''}
        ${votePicker()}</div>` : ''}
    </div></section>`;
  }
  V.offers = function () {
    setMeta('Offers and Discount Codes | DAUR Supply', 'Live DAUR Supply discount codes, free delivery on two pairs and men\'s shoes on sale in Pakistan, with Cash on Delivery.');
    const offers = liveOffers();
    const sale = P.filter((p) => p.variants.some(onSale)).map((p) => [p, p.variants.find(onSale)]);
    const best = sale.length ? Math.max(...sale.map(([, v]) => pct(v))) : 0;
    const count = offers.length + (sale.length ? 1 : 0);
    const applyHref = (code) => SHOP ? '/discount/' + encodeURIComponent(code) + '?redirect=' + encodeURIComponent('/collections/all') : link('shop');
    const card = (o, i) => `<article class="of-card rv${o.code ? ' has-code' : ''}" style="--d:${i * 0.08}s">
        <span class="of-ic">${ic(o.code ? 'ticket' : 'truck')}</span>
        <span class="of-k mono">${o.code ? 'Code' : 'Automatic'}${o.min ? ' / min ' + fmt(o.min) : ''}</span>
        <h3>${esc(o.title)}</h3>
        ${o.details ? `<p>${esc(o.details)}</p>` : ''}
        ${o.code ? `<div class="of-code"><button class="of-copy" type="button" data-code="${esc(o.code)}" aria-label="Copy code ${esc(o.code)}"><b>${esc(o.code)}</b><span class="mono">Copy</span></button>
          <a class="btn volt" href="${applyHref(o.code)}">${SHOP ? 'Apply and shop' : 'Shop now'} <span class="arr">&rarr;</span></a></div>` : `<a class="btn ghost" href="${link('shop')}">Shop the collection <span class="arr">&rarr;</span></a>`}
        ${o.ends ? `<span class="of-end mono" data-ends="${esc(o.ends)}">${untilText(o.ends)}</span>` : ''}
        <i class="of-notch l" aria-hidden="true"></i><i class="of-notch r" aria-hidden="true"></i>
      </article>`;
    app.innerHTML = `<section class="phero of-hero"><div class="wrap"><span class="eyebrow">Offers / ${count} live</span><h1>Offers.</h1><p class="aside">Every live code and deal in one place, straight from our store.${best ? ` Pairs up to ${best}% off.` : ''} Cash on Delivery on every order.</p></div>
      <div class="of-float" aria-hidden="true">${['%', 'Rs', '%', 'Rs', '%'].map((t, i) => `<span style="--i:${i}">${t}</span>`).join('')}</div></section>

    <section class="sheet x"><div class="wrap">
      ${head('Codes and deals', offers.length ? 'Use it at checkout.' : 'No codes right now.', '', offers.length ? 'One saving applies per order: codes and free delivery do not stack, so the bigger saving is the one you get.' : 'There is no live code at the moment. Sale pairs below are already reduced, no code needed.')}
      ${offers.length ? `<div class="of-grid">${offers.map(card).join('')}</div>` : ''}
    </div></section>

    ${sale.length ? `<div class="marquee" aria-hidden="true"><div class="marquee-track">${[0, 1].map(() => sale.map(([p, v]) => `<span>${esc(p.name)}</span><i>+</i><span class="o">${pct(v)}% off</span><i>+</i>`).join('')).join('')}</div></div>
    <section class="sheet x"><div class="wrap">
      ${head('On sale now', 'Already reduced.', `<a class="link" href="${link('shop', 'sale')}">All sale pairs</a>`, 'No code needed: the price you see is the price you pay. Sale pairs are final for size, and defects are still covered for 30 days.')}
      <div class="grid">${sale.map(([p, v], i) => card_(p, i, v)).join('')}</div>
    </div></section>` : ''}

    <section class="sheet x"><div class="wrap">
      ${head('How it works', 'Three steps to the saving.')}
      <div class="steps of-steps">${[['Pick your pairs', 'Add your size to the bag. Two pairs or more and delivery is free.'], ['Use the code', 'Tap Apply and shop, or type the code at checkout. One saving per order.'], ['Pay on delivery', 'We confirm your order with you, dispatch from Islamabad, and you pay in cash at your door.']].map(([t, d], i) => `<div class="step rv"><span class="n">${String(i + 1).padStart(2, '0')}</span><h3>${t}</h3><p>${d}</p></div>`).join('')}</div>
    </div></section>

    <section class="sheet x"><div class="wrap"><div class="signup closer">
      <h2>First to hear about the next code.</h2>
      <div class="closer-r"><p>New codes and drops go out on Instagram first. Questions about a code? Ask on WhatsApp ${esc(PHONE())}.</p>
        <div class="hero-cta"><a class="btn volt" href="https://www.instagram.com/daursupply" target="_blank" rel="noopener">${ic('instagram')}Follow @daursupply</a><a class="btn ghost" href="${waChat('Assalam o Alaikum DAUR Supply, I have a question about a discount code.')}" target="_blank" rel="noopener">${ic('whatsapp')}Ask on WhatsApp</a></div></div>
    </div></div></section>`;
    bindCards(app);
    $$('.of-copy', app).forEach((b) => b.addEventListener('click', () => {
      const code = b.dataset.code;
      const done = () => { b.classList.add('ok'); $('.mono', b).textContent = 'Copied'; toast('Code ' + code + ' copied'); setTimeout(() => { b.classList.remove('ok'); $('.mono', b).textContent = 'Copy'; }, 1800); };
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(code).then(done, () => toast('Code: ' + code)); else toast('Code: ' + code);
    }));
    const ends = $$('[data-ends]', app);
    if (ends.length) { const tick = () => { if (!document.body.contains(ends[0])) return clearInterval(t); ends.forEach((e) => { e.textContent = untilText(e.dataset.ends) || 'Ended'; }); }; const t = setInterval(tick, 30000); }
  };
  const card_ = (p, i, v) => card(p, i, v);

  /* ---- not found (404) and search ---- */
  // one search helper for the 404 page and the search page: every word must appear in the pair's name, colour, style or line
  const findPairs = (q) => {
    const ws = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!ws.length) return [];
    return P.filter((p) => p.variants.some((v) => { const hay = [p.name, v.color, p.category, p.audience, p.group, p.description, onSale(v) ? 'sale' : ''].join(' ').toLowerCase(); return ws.every((w) => hay.includes(w)); }));
  };
  const QUICK = () => [['bag', 'Shop all pairs', 'Every style, size and colour.', link('shop')], ['truck', 'Track an order', 'Where your pair is right now.', link('track')], ['whatsapp', 'Ask a person', 'WhatsApp ' + PHONE() + '.', link('contact')]];
  const quickLinks = () => `<div class="ct-help">${QUICK().map(([i, t, d, h]) => `<a class="ct-help-i rv" href="${h}"><span class="ct-ic">${ic(i)}</span><b>${t}</b><span>${d}</span><span class="arr">&rarr;</span></a>`).join('')}</div>`;
  function searchBox(id, value, hint) {
    return `<form class="nf-search" id="${id}F" role="search" ${SHOP ? 'action="/search" method="get"' : ''}><label class="sr-only" for="${id}">Search DAUR</label>
      <span class="nf-ic">${ic('search')}</span><input id="${id}" name="q" type="search" value="${esc(value || '')}" placeholder="${hint}" autocomplete="off"><button class="btn volt" type="submit">Search</button></form>`;
  }
  V.notfound = function () {
    setMeta('Page not found | DAUR Supply', 'This address does not lead to a page on DAUR Supply. Search the collection or go to the shop.');
    let path = '';
    try { path = decodeURIComponent(location.pathname + (SPA ? location.hash : '')); } catch (e) { path = location.pathname; }
    const guess = (path.split(/[\/#.?]/).filter(Boolean).pop() || '').replace(/[-_+]+/g, ' ').replace(/\b(html?|products?|collections?|pages?|notfound)\b/gi, '').trim().slice(0, 40);
    const start = guess && findPairs(guess).length ? guess : '';
    app.innerHTML = `<section class="phero nf-hero"><div class="wrap"><span class="eyebrow">404 / Page not found</span><h1>Off the<br>map.</h1><p class="aside">This address does not lead anywhere${path && path.length < 60 ? `: <code class="nf-path">${esc(path)}</code>` : ''}. The pairs are all still here.</p></div>
      <div class="nf-num" aria-hidden="true"><span>4</span><span class="o">0</span><span>4</span></div></section>
    <section class="sheet x"><div class="wrap">
      ${searchBox('nfq', start, 'Try black, derby, chelsea, sale')}
      <p class="nf-note mono mute" id="nfN" aria-live="polite"></p>
      <div class="grid nf-grid" id="nfG"></div>
    </div></section>
    <section class="sheet x"><div class="wrap">${head('Or go straight to', 'Where to next.')}${quickLinks()}</div></section>`;
    const q = $('#nfq'), g = $('#nfG'), n = $('#nfN');
    const paint = () => {
      const v = q.value.trim(), hits = v ? findPairs(v) : P.slice(0, 4);
      n.textContent = v ? (hits.length ? `${hits.length} pair${hits.length === 1 ? '' : 's'} match "${v}"` : `No pair matches "${v}". Here is the collection instead.`) : 'Pairs people open first';
      g.innerHTML = (hits.length ? hits : P.slice(0, 4)).slice(0, 8).map((p, i) => card(p, i)).join('');
      bindCards(g); reveal();
    };
    q.addEventListener('input', paint);
    $('#nfqF').addEventListener('submit', (e) => { if (!SHOP || !q.value.trim()) { e.preventDefault(); paint(); } });
    paint();
  };
  // Shopify search results page: the server lists the matches (snippets in sections/daur-main.liquid); pairs are drawn as cards, Journal guides as a list
  V.search = function () {
    const plain = app.querySelector('.daur-plain'); if (!plain) return;
    const terms = (plain.dataset.terms || '').trim();
    const handles = $$('.daur-results li[data-type="product"]', plain).map((li) => li.dataset.handle);
    const ps = handles.map(prod).filter(Boolean);
    const arts = $$('.daur-results li[data-type="article"], .daur-results li[data-type="page"]', plain).map((li) => { const a = li.querySelector('a'); return [a.getAttribute('href'), a.textContent, li.dataset.type]; });
    setMeta(terms ? `Search: ${terms} | DAUR Supply` : 'Search | DAUR Supply', 'Search DAUR Supply men\'s shoes, sneakers and Journal guides.');
    const total = ps.length + arts.length;
    app.innerHTML = `<section class="phero"><div class="wrap"><span class="eyebrow">Search${terms ? ` / ${total} result${total === 1 ? '' : 's'}` : ''}</span><h1>${terms ? `&ldquo;${esc(terms)}&rdquo;` : 'Find your pair.'}</h1><p class="aside">${terms ? (total ? 'Pairs first, then guides from the Journal.' : 'Nothing matched those words. Try a colour, a style or a material.') : 'Search by colour, style or material.'}</p></div></section>
    <section class="sheet x"><div class="wrap">${searchBox('sq', terms, 'Try black, derby, chelsea, sale')}
      ${ps.length ? `<div class="grid nf-grid">${ps.map((p, i) => card(p, i)).join('')}</div>` : ''}
      ${arts.length ? `${head('From the Journal', 'Guides that match.')}<div class="ct-help sr-list">${arts.map(([h, t, ty]) => `<a class="ct-help-i rv" href="${esc(h)}"><span class="ct-ic">${ic(ty === 'article' ? 'bookmark' : 'link')}</span><b>${esc(t)}</b><span>${ty === 'article' ? 'Journal guide' : 'Page'}</span><span class="arr">&rarr;</span></a>`).join('')}</div>` : ''}
      ${!ps.length && terms ? `<p class="nf-note mono mute">Pairs people open first</p><div class="grid nf-grid">${P.slice(0, 4).map((p, i) => card(p, i)).join('')}</div>` : ''}
    </div></section>
    <section class="sheet x"><div class="wrap">${head('Or go straight to', 'Where to next.')}${quickLinks()}</div></section>`;
    bindCards(app);
  };

  /* ---- policies ---- */
  // moving side art built from the owner's icons (assets/polart.js); empty when that file is absent
  const CITY = [['Karachi', 31, 85], ['Quetta', 30, 50], ['Multan', 58, 57], ['Lahore', 76, 50], ['Islamabad', 69, 29], ['Peshawar', 58, 24]];
  function polArt(kind) {
    const A = window.DAUR_POLART; if (!A) return '';
    const L = (src, cls) => `<img class="pl ${cls}" src="${src}" alt="" draggable="false">`;
    const map = (pins) => `<div class="pa-map">${L(A.mapFill, 'fill')}${L(A.map, 'line')}
      <svg class="pa-route" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polyline points="${CITY.map(([, x, y]) => x + ',' + y).join(' ')}"/></svg>
      ${(pins || CITY).map(([n, x, y], i) => `<span class="pa-dot" style="left:${x}%;top:${y}%;--d:${i * 0.35}s"><i></i><em>${n}</em></span>`).join('')}</div>`;
    // shipping and contact keep the map; the van, refund and Cash on Delivery art were taken out at the owner's request
    if (kind === 'shipping') return `<figure class="pa pa-ship" aria-hidden="true">${map()}<figcaption>Every city in Pakistan</figcaption></figure>`;
    if (kind === 'contact') return `<figure class="pa pa-con" aria-hidden="true">${map([['Wherever you are', 52, 52]])}<span class="pa-chat">${ic('whatsapp')}<i></i><i></i><i></i></span><figcaption>We answer on WhatsApp</figcaption></figure>`;
    return '';
  }
  V.policies = function (param) {
    setMeta('Terms, Privacy and Refund Policy | DAUR Supply', 'DAUR Supply terms of service, privacy policy, shipping, Cash on Delivery, returns, exchanges and refunds for orders across Pakistan.');
    const mail = `<a class="link" href="mailto:${esc(C.supportEmail)}">${esc(C.supportEmail)}</a>`;
    const wa = `<a class="link" target="_blank" rel="noopener" href="https://wa.me/${esc(C.whatsapp)}">WhatsApp</a>`;
    const S = [
      ['terms', 'Terms of service', `<p>These terms apply to every order placed on this website. By placing an order you agree to them.</p><ul>
        <li><b>Who we are.</b> DAUR Supply is a Pakistani footwear brand. Our shoes are made by independent workshops in Pakistan, checked by our team and finished with DAUR hardware. We do not sell products of other brands and never present our pairs as theirs.</li>
        <li><b>Orders.</b> An order is a request to buy. It becomes a contract once we confirm it with you by phone call or WhatsApp. We may decline or cancel an order if stock runs out, the price shown was clearly wrong, the details cannot be confirmed, or the order looks fraudulent. If that happens you pay nothing.</li>
        <li><b>Prices.</b> All prices are in Pakistani rupees and include our packaging and hardware, and any tax that applies. The delivery fee is shown at checkout. The price you pay is the total on your confirmation.</li>
        <li><b>Product details.</b> We describe and picture every pair as accurately as we can. Leather is natural, so small differences in grain and shade from one pair to the next are normal and are not defects.</li>
        <li><b>Codes and offers.</b> One saving applies per order: either free delivery or one discount code, whichever saves you more. Gift offers are added on top. Personal codes work only for the pairs and WhatsApp number they were issued for, and only until their end date. Codes have no cash value.</li>
        <li><b>Cash on Delivery.</b> Payment is made to the courier rider when the parcel is delivered. Customers who repeatedly refuse confirmed parcels without a reason may lose access to Cash on Delivery.</li>
        <li><b>Reviews and content.</b> Reviews and photos you submit must be your own and honest. We read every review before it is published and may decline ones that are abusive, off topic or not about the product.</li>
        <li><b>Liability.</b> Our responsibility for an order is limited to the amount paid for it. Nothing in these terms removes rights you have under the consumer protection laws of Pakistan.</li>
        <li><b>Law.</b> These terms are governed by the laws of Pakistan.</li></ul>`],
      ['privacy', 'Privacy policy', `<p>We collect only what is needed to deliver your order and to answer you when you write to us.</p><ul>
        <li><b>What we collect.</b> Your name, mobile number, delivery address, city and, if you give it, your email address. Reviews keep the name, city and photo you chose to share.</li>
        <li><b>Why.</b> To confirm and deliver orders, handle exchanges and refunds, and answer your questions.</li>
        <li><b>Who we share it with.</b> ${SHOP ? 'Our store runs on Shopify, which holds order details on our behalf. Apart from Shopify, only' : 'Only'} the courier delivering your parcel receives your name, number and address. We never sell or rent your details.</li>
        <li><b>WhatsApp messages.</b> We message you only about your order, or in reply to a message you sent us. Reply STOP at any time and we stop.</li>
        <li><b>Stored on your device.</b> Your bag, liked pairs and recent orders are saved in your own browser so they survive a refresh. Clearing your browser data removes them. ${SHOP ? 'Shopify sets the cookies the bag and checkout need, and basic store analytics.' : 'We do not use advertising trackers.'}</li>
        <li><b>Your choices.</b> Ask us to show, correct or delete the details we hold about you on ${wa} or at ${mail}.</li></ul>`],
      ['shipping', 'Shipping and delivery', `<ul>
        <li>We deliver to every city and town in Pakistan that our courier partners reach.</li>
        <li>Orders are confirmed, inspected, sealed and handed to the courier within 24 hours of confirmation.</li>
        <li>Delivery usually takes ${esc(C.delivery.days)} after dispatch. Remote areas and public holidays can take longer.</li>
        <li>The delivery fee is ${fmt(C.delivery.fee)} for any city, and free on ${C.freeDeliveryPairs} pairs or more.</li>
        <li>At dispatch you receive the courier name, tracking number and live tracking link on WhatsApp. They also show on the <a class="link" href="${link('track')}">Track order</a> page.</li></ul>`],
      ['refunds', 'Returns, exchanges and refunds', `<ul>
        <li><b>Size exchange.</b> Message us within 5 days of delivery. The pair must be unworn outside, in its original box, with the Supply Unit seal attached. Send it back to us with the courier of your choice; once it reaches us and passes the check, your new size is dispatched.</li>
        <li><b>Sale pairs.</b> Sale pairs cannot be exchanged for size. Defects within 30 days are still covered.</li>
        <li><b>Defects.</b> If stitching opens or a sole separates in normal wear within 30 days of delivery, send photos on WhatsApp and we replace the pair or refund it.</li>
        <li><b>Wrong or damaged item.</b> If the pair you received is not the one you ordered, or arrives damaged, tell us within 48 hours with photos. A short unboxing video helps us settle it fast.</li>
        <li><b>Refunds.</b> When a replacement is not available, we refund the item price to your bank account or mobile wallet once the returned pair reaches us and is checked. Delivery fees are refunded when the mistake was ours.</li>
        <li><b>Not covered.</b> Normal wear, scuffs, water damage, misuse and pairs without their seal.</li></ul>`],
      ['cod', 'Cash on Delivery', `<ul><li>No advance payment and no card are needed, and there is no Cash on Delivery surcharge.</li><li>Please keep the exact amount shown on your confirmation ready for the rider.</li><li>Most couriers do not allow a parcel to be opened before payment. Record an unboxing video; if anything is wrong, our exchange and defect terms apply.</li></ul>`],
      ['contact', 'Contact', `<p>Questions about an order, these terms or your data: ${wa}, or email ${mail}. Please include your order number.</p>`]
    ];
    app.innerHTML = `<section class="phero"><div class="wrap"><span class="eyebrow">Policies</span><h1>The fine print, in plain words.</h1><p class="aside">Last updated 28 October 2026.</p></div></section>
      <div class="wrap"><div class="terms">
        <nav>${S.map(([id, t], i) => `<a href="#${id}" data-jump="${id}">0${i + 1} ${t}</a>`).join('')}</nav>
        <div class="body">${S.map(([id, t, body], i) => { const art = polArt(id); return `<section class="clause" id="${id}"><span class="no">0${i + 1} / ${t}</span><div class="c policy ${art ? 'has-art' : ''}"><div><h2>${t}</h2>${body}</div>${art}</div></section>`; }).join('')}</div></div></div>`;
    if (param) { const t = document.getElementById(param); if (t) setTimeout(() => t.scrollIntoView(), 30); }
  };

  /* ---- contract ---- */
  V.contract = function (param) {
    setMeta('Our Promise: Delivery, Cash on Delivery & Exchanges | DAUR Supply', 'Delivery to every city in Pakistan, Cash on Delivery, dispatch within 24 hours, 5 day size exchanges, 30 day defect cover and the EU to UK shoe size guide.');
    const faq = [
      ['Is DAUR a brand?', 'Yes. DAUR Supply is our own Pakistani brand. Every pair is made in Pakistani workshops, checked by our team and finished with DAUR hardware: the engraved dubrae on the laces and the Supply Unit seal. We do not sell copies or products of other brands.'],
      ['Are the shoes real leather?', 'Each product page lists the upper, lining and sole of that pair. Our leather shoes and chelsea boots are full grain leather; sneakers list their leather, suede or mesh parts in the specs.'],
      ['Can I open the parcel before paying?', 'This depends on the courier, and most do not allow it. Record a short unboxing video. If anything is wrong, send it to us on WhatsApp and the defect and exchange terms apply.'],
      ['How do I pick my size?', 'Use the size guide on any product page. Our leather pairs run true to size; if you are between sizes, go up.'],
      ['Do you deliver to my city?', 'Yes. We deliver to every city and town in Pakistan that our courier reaches, in ' + C.delivery.days + ', for ' + fmt(C.delivery.fee) + ', or free on ' + C.freeDeliveryPairs + ' pairs or more.'],
      ['How long does delivery take?', 'We dispatch within 24 hours of confirming your order. Delivery then takes ' + C.delivery.days + ' in most cities. Remote areas and public holidays can take longer.'],
      ...(GIVE.on ? [['Where does the 5% go?', 'At least ' + GIVE.pct + '% of the profit we make on every pair is set aside, never added to your price. Every quarter we give it to one verified case of need, chosen by the votes of that quarter\'s buyers, and publish the record on the Our giving page.']] : []),
      ['How do I use a coupon code?', 'Enter it in the bag or at checkout. One saving applies per order: free delivery or your code, whichever saves you more. Gift offers are added on top.']
    ];
    app.innerHTML = `<section class="phero"><div class="wrap"><span class="eyebrow">Our promise</span><h1>What every pair promises.</h1><p class="aside">Printed on the manifest card in every box. If we break a line, we make it right.</p></div></section>
      <div class="wrap"><div class="terms">
        <nav><a href="#dispatch" data-jump="dispatch">01 Dispatch</a><a href="#delivery" data-jump="delivery">02 Delivery</a><a href="#cod" data-jump="cod">03 Cash on Delivery</a><a href="#exchanges" data-jump="exchanges">04 Exchanges</a><a href="#defects" data-jump="defects">05 Defects</a>${GIVE.on ? '<a href="#slice" data-jump="slice">06 The slice</a>' : ''}<a href="#sizing" data-jump="sizing">${GIVE.on ? '07' : '06'} Size guide</a><a href="#faq" data-jump="faq">${GIVE.on ? '08' : '07'} FAQ</a></nav>
        <div class="body">
          <section class="clause" id="dispatch"><span class="no">01 / Dispatch</span><div class="c"><h2>Confirmed, then out within 24 hours.</h2><p>Every order is confirmed by phone call or WhatsApp before it ships. Once confirmed, the pair is inspected, re-laced, sealed and handed to the courier within 24 hours. Orders confirmed on Sunday or a public holiday dispatch the next working day.</p></div></section>
          <section class="clause" id="delivery"><span class="no">02 / Delivery</span><div class="c"><h2>Every city in Pakistan. One flat fee.</h2>
            <div class="city-grid"><div><b>Where</b><span>Every city and town our courier reaches</span></div><div><b>How long</b><span>${C.delivery.days} after dispatch</span></div><div><b>Fee</b><span>${fmt(C.delivery.fee)} / free on ${C.freeDeliveryPairs}+ pairs</span></div></div>
            <p>Your courier name, tracking number and live tracking link arrive on WhatsApp at dispatch, and show on the <a class="link" href="${link('track')}">Track order</a> page.</p></div></section>
          <section class="clause" id="cod"><span class="no">03 / Cash on Delivery</span><div class="c"><h2>Pay when the box is in your hands.</h2><ul><li>No advance payment and no card needed. There is no COD surcharge.</li><li>Pay the rider the exact total shown on your confirmation.</li><li>If you will not be available, reply to the WhatsApp confirmation and we will reschedule.</li><li>Refusing a confirmed parcel without a reason costs us two courier legs. Repeat refusals lose COD access.</li></ul></div></section>
          <section class="clause" id="exchanges"><span class="no">04 / Exchanges</span><div class="c"><h2>Five days to swap the size.</h2><ul><li>Message us within 5 days of delivery with your order number.</li><li>The pair must be unworn outside, in the original box, with the Supply Unit seal still attached.</li><li>Send it back to us with the courier of your choice. Once it reaches us and passes the check, your new size is dispatched.</li><li>If the size you need is sold out, we refund the item price to your bank or wallet account.</li><li>Sale pairs cannot be exchanged for size. Defects within 30 days are still covered.</li></ul></div></section>
          <section class="clause" id="defects"><span class="no">05 / Defects</span><div class="c"><h2>30 days on stitching and sole.</h2><p>If stitching opens or a sole separates in normal wear within 30 days of delivery, send photos on WhatsApp. We replace the pair, or refund it if no replacement is available. Wear and tear, scuffs and misuse are not defects.</p></div></section>
          ${GIVE.on ? `<section class="clause" id="slice"><span class="no">06 / The slice</span><div class="c"><h2>A slice of every pair is not ours to keep.</h2><ul><li>At least ${GIVE.pct}% of the profit we make on every pair is set aside for people in need. It is a share of our profit, never added to your price.</li><li>Every quarter the slices are given together to one verified case of need, after our own checks.</li><li>Buyers vote in the bag for the cause. The most chosen cause receives the quarter's slice.</li><li>Date, amount and the case are published on <a class="link" href="${link('giving')}">Our giving</a> and on our social pages, and every buyer of the quarter is told where it went.</li></ul></div></section>` : ''}
          <section class="clause" id="sizing"><span class="no">${GIVE.on ? '07' : '06'} / Size guide</span><div class="c"><h2>Measure, then match.</h2>${sizeTable()}<p>Measure your foot heel to toe while standing. Pick the size whose length is equal to or just above your measurement.</p></div></section>
          <section class="clause" id="faq"><span class="no">${GIVE.on ? '08' : '07'} / FAQ</span><div class="c faq">${faq.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join('')}</div></section>
        </div></div></div>`;
    if (param) { const t = document.getElementById(param); if (t) setTimeout(() => t.scrollIntoView(), 30); }
  };

  /* ---------------- motion ---------------- */
  function reveal() {
    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.remove('pre'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -40px' });
    // measured after the first frame is on screen, so the first paint never waits on it
    requestAnimationFrame(() => setTimeout(() => $$('.rv').forEach((el) => { if (!el.isConnected) return; const r = el.getBoundingClientRect(); if (r.top > innerHeight) { el.classList.add('pre'); io.observe(el); } }), 0));
  }
  function markNav(page, param) {
    $$('[data-nav]').forEach((a) => {
      const [pg, pr] = a.dataset.nav.split('.');
      a.toggleAttribute('aria-current', pg === page && (pr || '') === (page === 'shop' ? (param || '') : ''));
      if (a.hasAttribute('aria-current')) a.setAttribute('aria-current', 'page');
    });
  }

  /* ---------------- router ---------------- */
  function route() {
    const { page, param } = current();
    rerender = () => { paintCounts(); };
    closeBag(); document.body.classList.remove('menu-open');
    $$('.modal.on').forEach((m) => m.classList.remove('on'));
    if (SPA) document.body.dataset.page = page;
    (V[page] || V.home)(param);
    hook('after', { page, param });
    markNav(page, param);
    reveal();
    if (!(page === 'contract' && param)) window.scrollTo(0, 0);
  }
  window.DAUR_API = { C, P, ALL, SPA, SHOP, absLink, totals, get cart() { return cart; }, get coupon() { return coupon; }, $, $$, esc, fmt, store, link, prod, variant, stockOf, onSale, pct, minPrice, visual, setMeta, head, card, bindCards, toast, openModal, addToCart, toggleWish, reveal, current, get wish() { return wish; } };
  const EXT = window.DAUR_EXT || { views: {}, hooks: {} };
  Object.assign(V, EXT.views);
  const hook = (name, arg) => (EXT.hooks[name] || []).forEach((fn) => fn(arg));
  chrome();
  route();
  window.addEventListener('hashchange', () => {
    const { page, param } = current();
    if (!SPA && page === 'contract') { const t = document.getElementById(param); if (t) t.scrollIntoView(); return; }
    route();
  });
  document.addEventListener('click', (e) => {
    const j = e.target.closest('[data-jump]');
    if (!j) return;
    e.preventDefault();
    const t = document.getElementById(j.dataset.jump);
    if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  window.addEventListener('storage', (e) => { if (e.key === 'daur.cart') { cart = store.get('cart', []); paintCounts(); } });
})();
