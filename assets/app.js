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
  C.advance = Object.assign({ on: false, code: '', deposit: 500 }, C.advance || {});
  /* Care deposit worked out from the order total (Theme settings > Advance payment): "limit:amount" pairs,
     e.g. 3000:500, 8000:1000, 15000:1500. Above the last limit the full amount is paid first.
     required: Cash on Delivery is off, so every order starts with its Care deposit and the rest is paid to the rider. */
  C.advance.tiers = String(C.advance.tiers || '').split(',').map((x) => x.split(':').map((n) => +String(n).replace(/[^\d]/g, ''))).filter((x) => x[0] > 0 && x[1] > 0).sort((a, b) => a[0] - b[0]);
  if (!C.advance.tiers.length) C.advance.tiers = [[3000, 500], [8000, 1000], [15000, 1500]];
  C.advance.fullAbove = C.advance.tiers[C.advance.tiers.length - 1][0];
  // what this order sends first: the tier amount, or the whole total above the last limit
  C.advance.due = (total) => { const t = C.advance.tiers.find(([lim]) => total <= lim); return t ? Math.min(t[1], total) : total; };
  /* The payment rule shared with the phone bag (payPlan in daur-m.js): gifts and Philanthropy pairs are paid in full today;
     a bag of your own pairs is reserved with Rs 500 for one pair or Rs 1,000 for two or more, and the rest is paid at the door.
     own: number of own pairs, covered: value of the gift and Philanthropy pairs, total: order total. */
  C.advance.one = 500; C.advance.more = 1000; C.advance.delCredit = (window.DAUR_M && +window.DAUR_M.deliveryCredit) || 200;
  C.advance.plan = (own, covered, total) => { const now = covered ? Math.min(total, covered) : Math.min(total, own > 1 ? C.advance.more : C.advance.one); return { now: own ? now : total, door: own ? Math.max(0, total - now) : 0, covered: covered > 0, onlyCovered: !own }; };
  // free delivery when every order sends a deposit first: 'all' (every order), 'full' (full advance payment only) or 'none'
  C.advance.free = ['all', 'full', 'none'].includes(C.advance.free) ? C.advance.free : 'all';
  C.advance.freeText = () => C.advance.free === 'all' ? 'Delivery is free on every order.' : C.advance.free === 'full' ? 'Delivery is free when you pay the full amount in advance. Otherwise one flat fee of ' + fmt(C.delivery.fee) + ', free on ' + C.freeDeliveryPairs + ' pairs or more.' : 'Delivery is one flat fee of ' + fmt(C.delivery.fee) + ' for any city, free on ' + C.freeDeliveryPairs + ' pairs or more.';
  C.advance.deposits = () => C.advance.on && C.advance.required;
  C.advance.freeAll = () => C.advance.deposits() && C.advance.free === 'all';
  C.advance.tierText = () => fmt(C.advance.one) + ' for one pair, ' + fmt(C.advance.more) + ' for two or more. Gifts and Philanthropy pairs are covered in full when you order.';
  // the polite name for the token payment that also earns free delivery
  C.advance.care = 'Care deposit';
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
  const pages = { home: 'index.html', shop: 'shop.html', product: 'product.html', cart: 'cart.html', checkout: 'checkout.html', order: 'order.html', manifesto: 'manifesto.html', contract: 'contract.html', track: 'track.html', wishlist: 'wishlist.html', list: 'list.html', feed: 'feed.html', policies: 'policies.html', about: 'about.html', contact: 'contact.html', offers: 'offers.html', gifts: 'gifts.html', runway: 'runway.html', giving: 'giving.html', notfound: '404.html', admin: 'admin.html' };
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
  // the giving pair is hidden from every grid but still resolves for the bag and checkout
  const prod = (id) => P.find((p) => p.id === id) || ALL.find((p) => p.giving && p.id === id);
  const GPAIR = ALL.find((p) => p.giving && p.variants.some((v) => (v.stock || {})[0] > 0)) || null;
  const variant = (p, vid) => p.variants.find((v) => v.id === vid) || p.variants[0];
  const stockOf = (v) => Object.values(v.stock || {}).reduce((a, b) => a + b, 0);
  const onSale = (v) => v.compareAt && v.compareAt > v.price;
  const pct = (v) => onSale(v) ? Math.round((1 - v.price / v.compareAt) * 100) : 0;
  const minPrice = (p) => Math.min(...p.variants.map((v) => v.price));
  const anySale = (p) => p.variants.some(onSale);
  const maxPct = (p) => Math.max(...p.variants.map(pct));
  const audienceLabel = (p) => p.group ? p.audience + ' / ' + p.group : p.audience;
  const lineName = (k) => catLabel[k] || k;
  // Shopify's image server resizes on request. The catalog and brand photos arrive with a width already in the URL
  // (width=1400 or 2400); it is replaced with the width asked for, so a srcset really offers smaller files.
  function cdnW(src, w) {
    if (!/(cdn\.shopify\.com|\/cdn\/shop\/)/.test(src)) return src;
    const b = src.replace(/([?&])(width|height)=\d+&?/g, '$1').replace(/[?&]$/, '');
    return b + (b.includes('?') ? '&' : '?') + 'width=' + w;
  }
  // on a phone the app layer (daur-m.js) draws the screen and this page stays hidden, so its pictures are never fetched
  const APPV = document.documentElement.classList.contains('m-on');
  function visual(p, v, opts) {
    opts = opts || {};
    if (v.images && v.images.length) {
      const k = opts.mode === 'blueprint' ? 1 : opts.index || 0;
      const src = v.images[Math.min(k, v.images.length - 1)];
      // Shopify resizes on request: a phone takes a small file, a wide screen a sharp one. A picture that is only seen
      // on hover or later in a cycle waits (data-src) until it is about to show, so the first screen loads first.
      const cdn = /(cdn\.shopify\.com|\/cdn\/shop\/)/.test(src);
      const at = (w) => cdn ? cdnW(src, w) : src;
      const ss = cdn ? [360, 540, 720, 1000, 1400].map((w) => at(w) + ' ' + w + 'w').join(', ') : '';
      const d = opts.defer ? 'data-' : '';
      return `<img ${d}src="${esc(at(720))}"${ss ? ` ${d}srcset="${esc(ss)}" sizes="${esc(opts.sizes || '(min-width: 1024px) 50vw, 100vw')}"` : ''} alt="${esc(opts.alt != null ? opts.alt : p.name + ' in ' + v.color)}" width="1200" height="1200" ${opts.eager && !APPV ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
    }
    return SHOE.render({ name: p.name, colorway: v.color, silhouette: p.silhouette, palette: v.palette }, opts);
  }
  // the second look of a pair, shown on hover and as a phone scrolls past: its next photo, or the same pair in another colour
  function second(p, v) {
    const ph = (x) => x.images && x.images.length;
    if (ph(v) && v.images.length > 1) return visual(p, v, { index: 1, defer: 1, alt: '', sizes: CARD_SIZES });
    const o = p.variants.find((x) => x !== v && (ph(v) ? ph(x) : !ph(x)));
    if (o) return visual(p, o, ph(v) ? { defer: 1, alt: '', sizes: CARD_SIZES } : {});
    return ph(v) ? '' : visual(p, v, { mode: 'blueprint' });
  }
  const CARD_SIZES = '(min-width: 1024px) 25vw, (min-width: 700px) 33vw, 50vw';
  // a waiting picture starts loading
  function wake(root) {
    (root.matches && root.matches('img[data-src]') ? [root] : $$('img[data-src]', root)).forEach((i) => {
      if (i.dataset.srcset) { i.srcset = i.dataset.srcset; i.removeAttribute('data-srcset'); }
      i.src = i.dataset.src; i.removeAttribute('data-src');
    });
  }

  /* ---------------- state ---------------- */
  let cart = store.get('cart', []);
  let wish = store.get('wish', []);
  let coupon = store.get('coupon', '');
  // a gift order: packing on request, who it is for and the note that goes in the box. A gift is always paid in full in advance.
  let gift = Object.assign({ on: false, pack: true, to: '', note: '' }, store.get('gift', {}));
  const saveGift = () => store.set('gift', gift);
  window.DAUR_GIFT = () => (gift.on && cart.length ? gift : null);
  // the payment plan of this bag, for the order (same attributes the phone bag sends)
  window.DAUR_PLAN = () => { const t = totals(); if (!t.n || !C.advance.deposits()) return null; const p = bagPlan(t); return { now: fmt(p.now), door: p.door ? fmt(p.door) : '', text: (p.covered ? 'Gifts and giving paid now: ' : 'Advance now: ') + fmt(p.now) + '. At the door: ' + fmt(p.door) }; };
  // on Shopify: what the store said about the code in the bag, for this exact bag
  let shopCode = { code: '', sig: '', err: '', saving: 0, note: '' };
  const cartSig = () => cart.map((l) => l.pid + l.vid + l.size + 'x' + l.qty).join('|');
  const saveCart = () => { store.set('cart', cart); store.set('coupon', coupon); paintCounts(); };
  const pairs = () => cart.reduce((a, l) => a + l.qty, 0);
  const hasGiving = () => cart.some((l) => { const p = prod(l.pid); return p && p.giving; });
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
    if (coupon && SHOP) {
      // Shopify checked the code against the real cart (SHOP.checkCode); its answer holds only while the bag is unchanged
      if (shopCode.code === coupon && shopCode.sig === cartSig()) {
        if (shopCode.err) couponErr = shopCode.err;
        else if (shopCode.saving) { discount = shopCode.saving; cp = { label: 'Discount' }; }
      }
    }
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
    const free = n >= C.freeDeliveryPairs || (C.advance.deposits() && C.advance.free === 'all');
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
  // the D symbol of the identity (brand/daur-symbol.svg)
  const DMARK = '<svg class="dm" viewBox="-55 20 234 160" fill="currentColor" aria-hidden="true"><g transform="skewX(-14)"><path d="M20,20 H104 A80,80 0 0 1 104,180 H-10 V144 H104 A44,44 0 0 0 104,56 H56 V128 H20 Z"/></g></svg>';
  // ایک نیا دور (Aik naya daur): the second slogan, set as a gold calligraphy lockup that writes itself in from the right
  const urLock = (cls) => `<div class="ur-lock ${cls || ''}"><span class="ur-cap"><i aria-hidden="true"></i><span class="ur-a">Aik naya daur</span><b>A new era</b><i aria-hidden="true"></i></span></div>`;
  // the empty bag: a paper bag with a pair drawn on it, the laces rising out of the top to become its handles
  const BAG_ART = `<svg class="bag-art" viewBox="0 0 220 300" aria-hidden="true" focusable="false"><g class="ba-sway">
    <path class="ba-lace" pathLength="1" d="M97 154 C 90 128 66 92 74 56 C 82 16 138 16 146 56 C 154 92 130 128 123 154"/>
    <path class="ba-side" d="M186 96 L202 106 L202 280 L186 288 Z"/>
    <path class="ba-front" d="M34 96 H186 V288 H34 Z"/>
    <path class="ba-fold" d="M34 110 H186"/>
    <g class="ba-shoe">
      <path d="M110 120 C 92 120 84 134 85 152 C 86 172 80 188 80 208 C 80 240 94 262 110 262 C 126 262 140 240 140 208 C 140 188 134 172 135 152 C 136 134 128 120 110 120 Z"/>
      <path class="ba-stitch" d="M110 128 C 96 128 91 139 92 153 C 93 172 87 189 87 208 C 87 235 98 254 110 254 C 122 254 133 235 133 208 C 133 189 127 172 128 153 C 129 139 124 128 110 128 Z"/>
      <path d="M99 133 C 99 125 121 125 121 133 C 121 142 116 147 110 147 C 104 147 99 142 99 133 Z"/>
      <path d="M102 147 V 198 Q 110 203 118 198 V 147"/>
      <path d="M97 166 L123 154 M123 166 L97 154 M97 178 L123 166 M123 178 L97 166 M97 190 L123 178 M123 190 L97 178"/>
      <g class="ba-eye"><circle cx="97" cy="154" r="1.9"/><circle cx="123" cy="154" r="1.9"/><circle cx="97" cy="166" r="1.9"/><circle cx="123" cy="166" r="1.9"/><circle cx="97" cy="178" r="1.9"/><circle cx="123" cy="178" r="1.9"/><circle cx="97" cy="190" r="1.9"/><circle cx="123" cy="190" r="1.9"/></g>
      <path d="M88 224 Q 110 240 132 224"/>
    </g>
    <g class="ba-d" transform="translate(101 268) scale(.085)"><g transform="skewX(-14)"><path d="M20,20 H104 A80,80 0 0 1 104,180 H-10 V144 H104 A44,44 0 0 0 104,56 H56 V128 H20 Z"/></g></g>
  </g><ellipse class="ba-shadow" cx="114" cy="294" rx="78" ry="4"/></svg>`;
  // a loaf seen from the side; the last slice is its own piece so the cut can lift it away
  let loafN = 0;
  function loaf(label, cls) {
    // a real looking loaf (bread.webp, a 3D render), warm steam rising and the share of profit beside it
    return `<span class="loaf bread ${cls || ''}" aria-hidden="true"><span class="br-steam"><i></i><i></i><i></i></span><span class="br-img"></span>${label ? `<b class="lf-amt">${esc(label)}</b>` : ''}</span>`;
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
    if (add <= 0) { toast(p.giving ? 'This option is not available right now' : 'No more stock in EU ' + size); return false; }
    if (ex) ex.qty += add; else cart.push({ pid, vid: v.id, size: +size, qty: add });
    saveCart();
    const n = pairs(), fee = C.delivery.fee || 0, gap = C.freeDeliveryPairs - n;
    const ship = !fee || C.advance.freeAll() ? '' : gap === 1 ? ` One more pair and delivery is on us.` : gap <= 0 && n - add < C.freeDeliveryPairs ? ` Delivery is now on us: you keep ${fmt(fee)}.` : '';
    if (p.giving) { toast('A pair for someone in need, added. Thank you.', 'View bag', openBag); return true; }
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
    // with Cash on Delivery switched off, page descriptions speak of the delivery instead
    if (C.advance.required && desc) { const fd = C.advance.freeAll() ? 'free delivery' : 'delivery'; desc = String(desc).replace(/Cash on Delivery to every city, free delivery on 2 pairs/g, fd[0].toUpperCase() + fd.slice(1) + ' to every city').replace(/, free delivery on 2 pairs/g, '').replace(/\b(with|and) Cash on Delivery/g, '$1 ' + fd).replace(/Cash on Delivery checkout/g, 'Checkout').replace(/Cash on Delivery/g, fd[0].toUpperCase() + fd.slice(1)); }
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
  const navItems = [['shop', '', 'Shop all'], ['shop', 'sneakers', 'Sneakers'], ['shop', 'hybrids', 'Casual'], ['shop', 'leather', 'Leather shoes'], ['gifts', '', 'Gifts'], ['shop', 'sale', 'Sale'], ['manifesto', '', 'Our story'], ['contract', '', 'Our promise']];
  const NAV_TOP = 6;
  // every notice in the black bar, with its full sentence and a link for the card that opens from the bar
  function notices() {
    const A = C.advance || {}, ex = C.exchangeDays || 5;
    const list = (C.announce ? [{ t: C.announce, d: '', l: '' }] : []);
    if (A.on && A.required) list.push({ t: A.free === 'all' ? 'Free delivery across Pakistan' : 'Your pair, reserved for you', d: (A.free === 'all' ? 'Every order travels free to any city we deliver to. ' : '') + 'A small ' + A.care + ' confirms your order and counts towards your price: ' + A.tierText() + ' You pay the rest when your pair arrives.', l: link('policies', 'advance'), c: 'How it works' });
    else if (A.on) list.push({ t: 'Free delivery when you pay in advance', d: 'Pay the full amount in advance, or a ' + A.care + ' of ' + fmt(A.deposit) + ' or more, and delivery is free to any city in Pakistan. The deposit comes off what you pay the rider.' + (A.code ? ' Enter code ' + A.code + ' at checkout and send us your payment receipt on WhatsApp.' : ''), l: link('policies', 'advance'), c: 'How it works' });
    if (C.delivery.days) list.push({ t: 'On its way within 24 hours', d: 'Once your order is confirmed, your pair leaves Islamabad within 24 hours on working days. Most cities receive it in ' + C.delivery.days + '; remote areas and public holidays can take a little longer.', l: link('policies', 'shipping'), c: 'Shipping policy' });
    try { liveOffers().filter((o) => o.code).forEach((o) => list.push({ t: 'Code ' + o.code + ': ' + o.title, d: o.details || '', l: link('offers'), c: 'See all offers' })); } catch (e) { /* no offers */ }
    if (!A.required) list.push({ t: 'Cash on Delivery across Pakistan', d: 'Prefer to pay at the door? Pay the rider when the box is in your hands. No card needed.', l: link('contract', 'cod'), c: 'Our promise' });
    if (!A.freeAll()) list.push({ t: 'Free delivery on ' + C.freeDeliveryPairs + ' pairs or more', d: 'Order ' + C.freeDeliveryPairs + ' pairs or more and delivery is free to any city. Otherwise one flat fee of ' + fmt(C.delivery.fee) + '. One saving applies per order.', l: link('shop'), c: 'Shop all' });
    list.push({ t: 'Five days to find the right fit', d: 'If the size is not quite right, message us within ' + ex + ' days of delivery and we will guide you through the exchange. Size exchanges apply to full price pairs that are unworn, boxed and still sealed.', l: link('policies', 'exchange'), c: 'Exchange policy' });
    return list;
  }
  function chrome() {
    // the notices a Pakistani buyer looks for first: one at a time in the black bar, all of them in a card that opens from it
    const NOTES = notices();
    const tbRun = NOTES.map((n, i) => `<span class="tb-msg${i ? '' : ' on'}">${esc(n.t)}</span>`).join('');
    const WORDMARK = '<svg class="wm" viewBox="-22 0 462 100" fill="currentColor" aria-hidden="true"><g transform="skewX(-12)" fill-rule="evenodd"><path d="M0,0 H50 A50,50 0 0 1 50,100 H0 Z M27,25 H50 A25,25 0 0 1 50,75 H27 Z"/><path transform="translate(110 0)" d="M0,100 L36,0 H72 L108,100 H79 L54,28 L29,100 Z"/><path transform="translate(226 0)" d="M0,0 H27 V52 A23,23 0 0 0 73,52 V0 H100 V52 A50,48 0 0 1 0,52 Z"/><path transform="translate(340 0)" d="M0,0 H62 A31,31 0 0 1 80,56 L102,100 H71 L51,62 H27 V100 H0 Z M27,20 H61 A11,11 0 0 1 61,42 H27 Z"/></g></svg>';
    const LOGO = `<a class="logo lg-swap" href="${link('home')}" aria-label="DAUR Supply home"><span class="lg-w">${WORDMARK}<small>SUPPLY</small></span><span class="lg-d">${DMARK}</span></a>`;
    // the black bar already carries the delivery offers, so the grey strip points to the gift guide instead of repeating them
    const strip = ['Gift guide: shoes for the men in your life', link('gifts')];
    // the page holds the header's room from the first paint (.hdr-ph), so nothing moves when the header arrives
    const ph = document.querySelector('.hdr-ph'); if (ph) ph.remove();
    document.body.insertAdjacentHTML('afterbegin', `
      ${hideDefs()}
      <a class="sr-skip" href="#app" style="position:absolute;left:-999px">Skip to content</a>
      ${window.DAUR_TEST_PHOTOS ? '<div class="f-review" role="note">Review theme: sample photos from Unsplash for layout testing. They are not DAUR pairs.</div>' : ''}<button class="tb" id="tbBtn" type="button" aria-expanded="false" aria-controls="tbCard"><span class="tb-run">${tbRun}</span><span class="tb-ch" aria-hidden="true">${ic('chevD')}</span><span class="sr-only">Open all store notices</span></button>
      <div class="tbc" id="tbCard" role="dialog" aria-modal="true" aria-label="Store notices" hidden><div class="tbc-p">
        <button class="tbc-x" type="button" data-tbx aria-label="Close notices">${ic('close')}</button>
        ${NOTES.map((n) => `<section class="tbc-i"><h2>${esc(n.t)}</h2><p>${esc(n.d)}</p>${n.l ? `<a class="u-link" href="${n.l}">${esc(n.c || 'Learn more')}</a>` : ''}</section>`).join('')}
      </div></div>
      <header class="hdr"><div class="wrap">
        <div class="hdr-l"><button class="menu-btn" aria-label="Menu" aria-expanded="false" id="menuBtn"><span></span><span></span><span></span></button>
          <a class="icon-btn hdr-wl" href="${link('wishlist')}">${ic('heart')}<span class="sr-only">Liked pairs</span><span class="dot-count" id="wishCount">0</span></a>${LOGO}</div>
        <nav class="nav" aria-label="Primary">${navItems.slice(0, NAV_TOP).map(([pg, pr, t]) => `<a href="${link(pg, pr)}" data-nav="${pg}.${pr}"${pr === 'sale' ? ' class="nav-sale"' : ''}>${t}</a>`).join('')}</nav>
        <div class="hdr-r">
          <button class="icon-btn" id="searchBtn" aria-label="Search">${ic('search')}</button>
          <a class="icon-btn hdr-wd" href="${link('wishlist')}">${ic('heart')}<span class="sr-only">Liked pairs</span><span class="dot-count" id="wishCount2">0</span></a>
          <button class="icon-btn" id="bagBtn">${ic('bag')}<span class="sr-only">Open bag, pairs:</span><span class="dot-count" id="bagCount">0</span></button>
        </div>
      </div></header>
      <a class="hstrip" href="${strip[1]}"><span>${esc(strip[0])}</span>${ic('arrow')}</a>
      <nav class="mnav" id="mnav" aria-label="Mobile">
        <div class="mnav-h">${LOGO}<button class="mnav-x" type="button" id="mnavX" aria-label="Close menu">${ic('close')}</button></div>
        <div class="mnav-main">${navItems.map(([pg, pr, t]) => `<a href="${link(pg, pr)}"${pr === 'sale' ? ' class="nav-sale"' : ''}>${esc(t)}${pg === 'gifts' ? ic('gift', 'mn-gift') : ''}${ic('chevR', 'mn-ch')}</a>`).join('')}</div>
        <div class="mnav-sub"><a href="${link('track')}">Track order</a><a href="${link('policies', 'returns')}">Return and exchange</a><a href="${link('policies', 'sizes')}">Size guide</a><a href="${link('contract', 'faq')}">FAQ</a><a href="${link('wishlist')}">Liked pairs</a>${SHOP ? '<a href="/pages/contact">Contact us</a>' : `<a href="${link('contact')}">Contact us</a>`}</div>
        <p class="mnav-f">${ic('pin')}Delivering across Pakistan, prices in PKR</p>
      </nav>`);
    document.body.insertAdjacentHTML('beforeend', `
      <footer class="ftr ftr2">
        <div class="f2-hero"><div class="wrap">
          <div class="f2-brand">
            <a class="f2-logo" href="${link('home')}" aria-label="DAUR Supply home">${DMARK}<span class="f2-wm">${WORDMARK}<small>SUPPLY</small></span></a>
            <p class="f2-line">Same local craft. A more considered way to buy.</p>
            ${urLock('ul-ftr')}
          </div>
          <div class="f2-help"><h2>Need a hand finding your fit?</h2><p>Talk to a real person before you order and we will help you choose with confidence. We reply Monday to Saturday, 10 am to 7 pm, and answer later messages the next working day.</p>
            <a class="f2-wa" href="${waChat('Assalam o Alaikum DAUR Supply, I need help choosing my size.')}" target="_blank" rel="noopener">${ic('whatsapp')}<span>Chat with DAUR</span></a></div>
        </div></div>
        <div class="f2-links"><div class="wrap">
          <div class="f2-col"><h2>Shop${ONE ? ' ' + esc(ONE) : ''}</h2>${lineLinks.map(([pg, pr, t]) => `<a href="${link(pg, pr)}">${esc(t)}</a>`).join('')}<a href="${link('gifts')}">Gifts</a><a href="${link('shop', 'sale')}">Sale</a><a href="${link('shop', 'new')}">New in</a></div>
          <div class="f2-col"><h2>Help</h2><a href="${link('contract', 'faq')}">FAQ</a><a href="${link('track')}">Track order</a><a href="${link('policies', 'shipping')}">Shipping policy</a><a href="${link('policies', 'returns')}">Return and exchange</a><a href="${link('policies', 'sizes')}">Size guide</a>${SHOP ? '<a href="/pages/contact">Contact us</a>' : `<a href="${link('contact')}">Contact us</a>`}</div>
          <div class="f2-col"><h2>DAUR</h2><a href="${link('manifesto')}">Our story</a><a href="${link('contract')}">Our promise</a><a href="${link('offers')}">Offers</a><a href="${link('feed')}">The Feed</a>${GIVE.on ? `<a href="${link('giving')}">Our giving</a>` : ''}${SHOP ? '<a href="/pages/about">About us</a><a href="/blogs/journal">Journal</a>' : ''}</div>
          <div class="f2-col"><h2>Policies</h2><a href="${link('policies', 'cancellation')}">Cancellation policy</a><a href="${link('policies', 'exchange')}">Exchange policy</a><a href="${link('policies', 'claims')}">Claim policy</a><a href="${link('policies', 'privacy')}">Privacy policy</a><a href="${link('policies', 'terms')}">Terms of service</a></div>
        </div></div>
        <div class="f2-reach"><div class="wrap">
          <div class="f2-soc">
            <a class="f2-ic wa" href="${waChat('Assalam o Alaikum DAUR Supply, I have a question about an order.')}" target="_blank" rel="noopener" aria-label="WhatsApp">${ic('whatsapp')}</a>
            <a class="f2-ic ig" href="https://www.instagram.com/daursupply" target="_blank" rel="noopener me" aria-label="Instagram">${ic('instagram')}</a>
            <a class="f2-ic fb" href="https://www.facebook.com/daursupply" target="_blank" rel="noopener me" aria-label="Facebook">${ic('facebook')}</a>
          </div>
          <div class="f2-ct"><a href="tel:+${esc(C.whatsapp)}">${ic('phone')}${esc('+' + String(C.whatsapp).replace(/^92(\d{3})(\d+)$/, '92 $1 $2'))}</a><a href="mailto:${esc(C.supportEmail)}">${ic('mail')}${esc(C.supportEmail)}</a><span>${ic('pin')}Dispatch from Islamabad, delivering across Pakistan</span></div>
        </div></div>
        <div class="f2-base"><div class="wrap">
          <span>&copy; 2026 DAUR Supply</span>
          <span class="f2-acts"><a href="${link('track')}">Track order</a><button type="button" id="ftrBag">Your bag (<span id="ftrBagN">0</span>)</button><button type="button" class="ftr-theme" id="themeBtn" aria-pressed="false">Dark mode</button><button class="ftr-top" type="button" id="toTop">Back to top ${ic('chevU')}</button></span>
        </div></div>
      </footer>
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
        <p class="mute" style="font-size:13px">Stand on a sheet of paper, mark your heel and the tip of your longest toe, and measure the distance in centimetres. Choose the closest length in the chart. Between sizes, the larger one is usually more comfortable. Not sure? Message us and we will help you choose. <a class="link" href="${link('policies', 'sizes')}">Full size guide</a></p></div></div>
      <div class="toast" id="toast" role="status" aria-live="polite"><span id="toastT"></span></div>`);

    const menu = (o) => { document.body.classList.toggle('menu-open', o); $('#menuBtn').setAttribute('aria-expanded', o); };
    $('#menuBtn').addEventListener('click', () => menu(!document.body.classList.contains('menu-open')));
    $('#mnavX').addEventListener('click', () => menu(false));
    // the black bar: one notice at a time; a tap opens every notice as a card
    const tbCard = $('#tbCard'), tbBtn = $('#tbBtn');
    const tbOpen = (o) => { tbCard.hidden = !o; tbBtn.setAttribute('aria-expanded', o); document.body.classList.toggle('tbc-open', o); if (o) $('[data-tbx]', tbCard).focus(); };
    tbBtn.addEventListener('click', () => tbOpen(tbCard.hidden));
    tbCard.addEventListener('click', (e) => { if (e.target === tbCard || e.target.closest('[data-tbx]') || e.target.closest('a')) tbOpen(false); });
    const msgs = $$('.tb-msg', tbBtn);
    if (msgs.length > 1 && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      let k = 0;
      setInterval(() => { if (!tbCard.hidden || document.hidden) return; msgs[k].classList.remove('on'); k = (k + 1) % msgs.length; msgs[k].classList.add('on'); }, 4200);
    }
    $('#toTop').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    $('#ftrBag').addEventListener('click', openBag);
    $('#bagBtn').addEventListener('click', openBag);
    $('#bagClose').addEventListener('click', closeBag);
    $('#scrim').addEventListener('click', closeBag);
    $('#searchBtn').addEventListener('click', () => openModal('search'));
    // light leather is the default; the obsidian look stays one tap away and is remembered on this device
    const paintTheme = () => {
      const dark = document.documentElement.dataset.theme === 'dark', b = $('#themeBtn');
      b.textContent = dark ? 'Light mode' : 'Dark mode'; b.setAttribute('aria-pressed', dark);
      const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = dark ? '#0B0B0B' : '#FFFFFF';
    };
    $('#themeBtn').addEventListener('click', () => {
      const dark = document.documentElement.dataset.theme !== 'dark';
      if (dark) document.documentElement.dataset.theme = 'dark'; else delete document.documentElement.dataset.theme;
      try { localStorage.setItem('daur.theme', dark ? 'dark' : 'light'); } catch (e) { /* private mode */ }
      paintTheme();
    });
    paintTheme();
    $$('.modal').forEach((m) => m.addEventListener('click', (e) => { if (e.target === m || e.target.closest('[data-close]')) m.classList.remove('on'); }));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeBag(); menu(false); if (!tbCard.hidden) tbOpen(false); $$('.modal.on').forEach((m) => m.classList.remove('on')); } });
    $('#q').addEventListener('input', runSearch);
    paintCounts();
  }
  // men's sizes: EU, UK and US with the foot length each fits (approximate, a guide only)
  const SIZES = [[39, 5, 6, '24.1 - 24.7', '9.5 - 9.7'], [40, 6, 7, '24.8 - 25.4', '9.8 - 10.0'], [41, 7, 8, '25.5 - 26.0', '10.0 - 10.2'], [42, 8, 9, '26.1 - 26.7', '10.3 - 10.5'], [43, 9, 10, '26.8 - 27.4', '10.6 - 10.8'], [44, 10, 11, '27.5 - 28.0', '10.8 - 11.0'], [45, 11, 12, '28.1 - 28.7', '11.1 - 11.3'], [46, 12, 13, '28.8 - 29.4', '11.3 - 11.6']];
  function sizeTable() {
    const sold = new Set(P.flatMap((p) => p.sizes));
    return `<div class="size-wrap"><table class="size-table"><thead><tr><th>EU</th><th>UK</th><th>US</th><th>Foot length (cm)</th><th>Foot length (inch)</th></tr></thead><tbody>${SIZES.map(([eu, uk, us, cm, inch]) => `<tr${sold.has(eu) ? '' : ' class="off"'}><td><b>${eu}</b></td><td>${uk}</td><td>${us}</td><td>${cm.replace(' - ', ' to ')}</td><td>${inch.replace(' - ', ' to ')}</td></tr>`).join('')}</tbody></table></div>`;
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
    ['#wishCount', '#wishCount2'].forEach((id) => { const w = $(id); if (w) { w.textContent = wish.length; w.classList.toggle('on', wish.length > 0); } });
    const fb = $('#ftrBagN'); if (fb) fb.textContent = n;
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
    if (C.advance.freeAll()) return `<div class="free-meter"><span class="mono"><span class="volt">Delivery is free on every order</span></span></div>`;
    const need = Math.max(0, C.freeDeliveryPairs - n);
    const fee = C.delivery.fee || 0;
    return `<div class="free-meter"><span class="mono">${need ? `Add ${need} more pair${need > 1 ? 's' : ''} and delivery is on us${fee ? `: you keep ${fmt(fee)}` : ''}` : `<span class="volt">Delivery is on us${fee ? `. You keep ${fmt(fee)}` : ''}</span>`}</span><div class="minibar"><i class="v" style="width:${Math.min(100, n / C.freeDeliveryPairs * 100)}%"></i></div></div>`;
  }
  function lineHTML(d, big) {
    const { p, v, l } = d; const max = (v.stock || {})[l.size] || 0;
    return `<div class="line-item" data-line="${l.pid}|${l.vid}|${l.size}">
      <a class="th" href="${p.giving ? link('gifts') + '#give' : link('product', p.id + '~' + v.id)}">${p.giving && !(v.images && v.images.length) ? `<span class="gp-th">${ic('gift')}</span>` : visual(p, v)}</a>
      <div class="li-body"><div class="li-top"><b>${esc(p.name)}</b><span>${fmt(d.total)}</span></div>
      <div class="li-meta">${p.giving ? `Handed over on your behalf, size matched to the person / ${fmt(v.price)} each` : `${esc(v.color)} / EU ${l.size} / ${fmt(v.price)} each ${onSale(v) ? `<span class="strike">${fmt(v.compareAt)}</span>` : ''}`}</div>
      ${l.qty >= max && !p.giving ? `<div class="li-meta volt">Last ${max} in this size</div>` : ''}
      <div class="li-ctl"><div class="qty sm"><button data-q="-1" aria-label="Decrease">&minus;</button><output>${l.qty}</output><button data-q="1" aria-label="Increase" ${l.qty >= max ? 'disabled' : ''}>+</button></div>
      <span style="display:flex;gap:14px">${big && !p.giving ? `<button class="rm" data-mv>Move to liked</button>` : ''}<button class="rm" data-rm>Remove</button></span></div></div></div>`;
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
      if (mv) mv.addEventListener('click', () => { cart.splice(cart.indexOf(l), 1); if (!wish.includes(pid)) wish.push(pid); store.set('wish', wish); saveCart(); rerender(); toast('Moved to liked pairs'); });
    });
  }
  function paintDrawer() {
    const body = $('#dBody'); if (!body) return;
    const t = totals();
    $('#dCount').textContent = t.n ? `(${t.n})` : '';
    if (!t.lines.length) {
      body.innerHTML = bagEmpty(true);
      $('#dFoot').innerHTML = ''; bindCards(body); return;
    }
    body.innerHTML = freeMeter(t.n) + t.lines.map((d) => lineHTML(d)).join('');
    $('#dFoot').innerHTML = `
      ${t.sale ? `<div class="sum-row save"><span>Sale savings</span><span>&minus; ${fmt(t.sale)}</span></div>` : ''}
      <div class="sum-row total"><span>Subtotal</span><span>${fmt(t.subtotal)}</span></div>
      ${keptBox(t)}${SELL.retailAnchor ? `<div class="sum-row mute" style="font-size:12px"><span>Saved against typical retail of ${fmt(C.marketRetail)} a pair</span><span class="volt">${fmt(t.retail - t.subtotal)}</span></div>` : ''}
      <a class="btn volt block" href="${link('checkout')}">Checkout${C.advance.required ? '' : ', Cash on Delivery'} <span class="arr">&rarr;</span></a>
      <a class="btn ghost block" href="${link('cart')}">View full bag</a>`;
    bindLines(body);
  }
  let rerender = () => { paintCounts(); };
  // our picks while the bag is empty: pairs in stock, leather and casual first. Shown as picks, never as best sellers,
  // until real sales say which pairs sell best.
  function picks(n) {
    const ok = P.filter((p) => p.variants.some((v) => stockOf(v) > 0));
    return (ok.length ? ok : P).slice().sort((x, y) => ({ Leather: 0, Hybrids: 1 }[x.category] ?? 2) - ({ Leather: 0, Hybrids: 1 }[y.category] ?? 2)).slice(0, n);
  }
  function bagEmpty(compact) {
    return `<div class="bag-empty${compact ? ' compact' : ''}">
      <div class="be-top"><div class="be-art">${BAG_ART}</div>
        <div class="be-t"><h${compact ? 2 : 1} class="be-h">Your bag is waiting.</h${compact ? 2 : 1}>
        <p class="be-p">Find a pair you will reach for every day. It arrives in ${esc(C.delivery.days || '2 to 5 days')}${C.advance.freeAll() ? ', delivered free' : ''}.</p>
        <div class="be-cta"><a class="btn volt" href="${link('shop')}">Shop all pairs <span class="arr">&rarr;</span></a>${wish.length ? `<a class="btn ghost" href="${link('wishlist')}">Liked pairs (${wish.length})</a>` : `<a class="btn ghost" href="${link('gifts')}">Shop gifts</a>`}</div></div></div>
      <div class="be-picks"><div class="x-hrow"><h2 class="x-h">Our picks for you</h2><a class="u-link" href="${link('shop')}">See all</a></div>
        <div class="grid be-grid">${picks(compact ? 4 : 4).map((p, i) => card(p, i)).join('')}</div></div>
    </div>`;
  }

  /* ---------------- shared blocks ---------------- */
  // marked down pairs carry a tag cut from a hide, hung on a leather thong through a brass eyelet;
  // the shape, grain and stitching live once in #hideDefs (chrome) and every tag reuses them
  const HIDE = 'M38 10C46 14 52 8 60 9C68 8 75 14 83 10C91 6 97 3 102 9C107 14 101 22 106 28C111 34 118 35 117 45C116 55 106 57 106 67C106 77 116 81 114 93C112 104 101 101 97 109C93 117 99 122 88 122C78 122 72 115 60 115C48 115 41 122 31 121C21 120 28 115 23 108C19 100 8 104 6 92C4 80 14 76 14 66C14 56 4 54 3 44C2 34 10 34 15 28C20 22 13 13 18 8C24 2 30 6 38 10Z';
  const hideDefs = () => `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>
    <radialGradient id="hideFill" cx="42%" cy="34%" r="78%"><stop offset="0" stop-color="#D49A62"/><stop offset=".55" stop-color="#B7773F"/><stop offset="1" stop-color="#8A5128"/></radialGradient>
    <filter id="hideGrain" x="0" y="0" width="1" height="1"><feTurbulence type="fractalNoise" baseFrequency=".55" numOctaves="2" seed="7" result="n"/><feDiffuseLighting in="n" surfaceScale="1.3" lighting-color="#fff" result="l"><feDistantLight azimuth="235" elevation="58"/></feDiffuseLighting><feComposite in="l" in2="SourceGraphic" operator="in"/></filter>
    <path id="hideShape" d="${HIDE}"/></defs></svg>`;
  function priceTag(v) {
    return `<span class="ptag2" aria-label="${pct(v)} percent off, save ${fmt(v.compareAt - v.price)}">&minus;${pct(v)}%</span>`;
  }

  // product card, laid out like a big sports store grid: a grey tile with the photo filling it, a square heart,
  // then the price (red when cut, with the original price and the cut beneath), the name, the style and the colours
  function card(p, i, vSel) {
    const v = vSel || p.variants[0];
    const tag = onSale(v) || /^drop/i.test(p.tag || '') ? '' : `<span class="ap-tag">${esc(p.tag)}</span>`;
    const low = stockOf(v) <= 6 && stockOf(v) > 0;
    const url = link('product', p.id + '~' + v.id);
    const nC = p.variants.length;
    return `<article class="card ap-card" data-pid="${p.id}" data-vid="${v.id}">
      <a class="card-media" href="${url}" tabindex="-1" aria-hidden="true">
        <span class="layer rn">${visual(p, v, { sizes: CARD_SIZES })}</span><span class="layer bp">${second(p, v)}</span>${tag}</a>
      <button class="ap-heart" data-wish="${p.id}" aria-pressed="${wish.includes(p.id)}" aria-label="Save ${esc(p.name)} to wishlist">${ic('heart', 'h-o')}${ic('heartFill', 'h-f')}</button>
      <a class="card-body" href="${url}">
        <span class="ap-price${onSale(v) ? ' on-sale' : ''}">${fmt(v.price)}</span>
        ${onSale(v) ? `<span class="ap-was">${fmt(v.compareAt)} Original price <b>&minus;${pct(v)}%</b></span>` : ''}
        <h3 class="ap-name">${esc(p.name)}</h3>
        <span class="ap-cat">${esc(lineName(lineOf(p)))}</span>
        <span class="ap-cat">${nC > 1 ? nC + ' colours' : esc(v.color)}</span>
        ${low ? `<span class="ap-low">Only ${stockOf(v)} pairs left</span>` : ''}
      </a>${addBox(p, v)}${window.DAUR_EXT && window.DAUR_EXT.cardExtra ? `<div class="ap-extra">${window.DAUR_EXT.cardExtra(p)}</div>` : ''}</article>`;
  }
  // add to bag straight from the card: a size list with only the sizes in stock, and a button
  function addBox(p, v) {
    const z = Object.keys(v.stock || {}).filter((k) => (v.stock[k] || 0) > 0).sort((x, y) => x - y);
    return `<div class="ap-add">${z.length ? `<select class="ap-size" aria-label="Size for ${esc(p.name)}"><option value="">Size</option>${z.map((k) => `<option value="${k}">EU ${k}</option>`).join('')}</select><button class="ap-addb" type="button" data-cardadd>Add to bag</button>` : `<span class="ap-sold">Sold out</span>`}</div>`;
  }
  function bindCards(root) {
    $$('.card', root).forEach((c) => {
      const ab = $('[data-cardadd]', c);
      if (ab && !ab.dataset.bound) { ab.dataset.bound = '1'; ab.addEventListener('click', (e) => { e.preventDefault(); const z = $('.ap-size', c); if (!z.value) { toast('Pick a size first'); z.focus(); return; } addToCart(c.dataset.pid, c.dataset.vid, +z.value, 1); }); }
      const w = $('[data-wish]', c);
      if (w && !w.dataset.bound) { w.dataset.bound = '1'; w.addEventListener('click', (e) => { e.preventDefault(); toggleWish(c.dataset.pid); }); }
      // the second look loads when a mouse comes near the card, or when the card scrolls into view on a phone
      if (!c.dataset.wk && $('img[data-src]', c)) {
        c.dataset.wk = '1';
        if (FINE) { c.addEventListener('pointerenter', () => wake(c), { once: true }); c.addEventListener('focusin', () => wake(c), { once: true }); }
        else if (WIO) WIO.observe(c); else wake(c);
      }
    });
  }
  const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const WIO = 'IntersectionObserver' in window ? new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { wake(e.target); WIO.unobserve(e.target); } }), { rootMargin: '200px 0px' }) : null;
  // a WhatsApp chat with the order line, opened with a first line already typed; nothing is collected on the site
  const waChat = (text) => `https://wa.me/${esc(C.whatsapp)}?text=${encodeURIComponent(text)}`;
  // written guides under each collection: real answers to what men here ask before they buy, shown on the page for everyone
  const sizeSpan = () => { const s = P.flatMap((p) => p.sizes).filter((n) => n >= 36); return s.length ? 'EU ' + Math.min(...s) + ' to ' + Math.max(...s) : 'EU sizes'; };
  const GUIDE = {
    all: { e: 'The guide', h: (ONE === 'Men' ? 'Men\'s' : 'Leather') + ' shoes, crafted in Pakistan.', b: [
      ['', 'DAUR Supply is for men who notice the details. The collection brings together leather sneakers and joggers for every day, formal shoes and chelsea boots for the moments that matter, and casual slip ons that move easily between the two. Every pair is checked by hand before it receives the DAUR seal.'],
      ['How to choose', 'For daily wear with jeans or chinos, start with a court low or a trainer. For the office, a wedding or a shalwar kameez, a black derby or a chelsea boot carries the look. For long days on your feet, a moc toe runner gives you leather with a cushioned sole.'],
      ['Sizes, delivery and payment', () => `Pairs run from ${sizeSpan()}. Measure your foot from heel to toe and match it to the size guide; between sizes, the larger one is usually more comfortable. ${C.advance.freeAll() ? 'Delivery is free to every city in Pakistan' : 'We deliver to every city in Pakistan'}, your pair is dispatched within 24 hours of confirmation, and full price pairs can be exchanged for size within 5 days.`]],
      faq: [['Which shoes go best with shalwar kameez?', 'A black or dark brown leather pair keeps it sharp: a chelsea boot or a derby for formal days and weddings, a slip on for Fridays and family visits. A shoe darker than the kameez always looks considered.'],
        ['What is the difference between sneakers and joggers?', 'In Pakistan, joggers usually means sporty sneakers. Our sneakers range covers clean leather court lows for everyday style and lighter trainers for walking and travel.']] },
    sneakers: { e: 'Sneaker guide', h: 'Sneakers and joggers for men.', b: [
      ['', 'Sneakers are the pair you wear most, so they have to look right with everything. The DAUR range runs from clean leather court lows to suede and mesh trainers and a structured high top, each on a rubber sole that we check before the pair is sealed.'],
      ['Leather or mesh?', 'Smooth leather court lows are the most versatile: they dress up with chinos and a shirt, and they wipe clean with a damp cloth. Suede and mesh trainers are lighter and breathe better in the heat, which makes them the better pick for long walks, travel and summer.'],
      ['Fit and care', 'Start with your usual size and check it against the size guide. Wipe leather after wear, brush suede once it is dry, and let a pair rest a day between wears so it keeps its shape.']],
      faq: [['Are DAUR sneakers good for daily use?', 'Yes. They are made for everyday wear on city streets, with rubber outsoles and padded collars. For running and sport, a dedicated performance shoe will serve you better.']] },
    leather: { e: 'Leather guide', h: 'Leather and formal shoes for men.', b: [
      ['', 'A good leather shoe is the quiet signature of a well dressed man. DAUR formal shoes and chelsea boots are made in leather and set on rubber soles that stay comfortable from the morning meeting to the last dinner of a wedding night. Each product page lists the leather as the workshop confirms it.'],
      ['Derby or chelsea?', 'A black derby is the most useful formal shoe a man can own: it works with a suit, with trousers and a blazer, and with a shalwar kameez and waistcoat. A chelsea boot slips on in seconds, looks sharp with slim trousers and jeans, and carries winter and wedding season with ease.'],
      ['Caring for your leather', 'Leather creases where your foot flexes, and that is how it should be. Wipe it clean, condition it every few weeks and keep it away from direct heat, and it will age beautifully.']],
      faq: [['Are these real leather shoes?', 'Yes. Every pair in this range has a leather upper. Each product page lists the upper, lining and sole.'],
        ['Which formal shoes suit a wedding?', 'For the baraat and walima, a polished black derby or a waxed chelsea boot looks sharp with a sherwani, a prince coat or a shalwar kameez and waistcoat.']] },
    hybrids: { e: 'Casual guide', h: 'Casual shoes for men.', b: [
      ['', 'Casual shoes do the most work in a man\'s week. The DAUR casual range sits between a sneaker and a formal shoe: a leather moc toe runner with a cushioned sole and a soft nappa slip on with elastic gores, both easy with jeans, chinos or a shalwar kameez.'],
      ['Built for the whole day', 'Leather uppers breathe and mould to your foot, and rubber soles grip on tile and road. A slip on goes on in a second, which makes it the pair to keep by the door for the mosque, the market and the office.']],
      faq: [['Do leather slip ons stretch?', 'Leather softens and gives a little with wear, so choose a snug fit on day one. Elastic gores keep the shoe secure as it settles.']] },
    sale: { e: 'About the sale', h: 'Men\'s shoes on sale.', b: [
      ['', 'These are reduced prices on current pairs, with the original price shown beside the new one. Sale pairs carry the same checks, the same DAUR seal and the same 30 day defect cover as the rest of the collection. They are offered at their marked price, so size exchanges are not available; our size guide and WhatsApp team will help you choose with confidence.']],
      faq: [['How long does the sale last?', 'Sale prices hold while sizes last. A sold out size is marked sold out on every page.']] },
    new: { e: 'New in', h: 'New arrivals for men.', b: [['', 'The newest pairs to receive the DAUR seal, latest first, each delivered free to every city in Pakistan.']] }
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
      const start = (wait) => { if (!timer) { wake(t); step(); timer = setInterval(step, wait); } };
      const stop = () => { clearInterval(timer); timer = 0; };
      if (hover) { t.addEventListener('pointerenter', () => wake(t), { once: true }); t.addEventListener('mouseenter', () => start(1300)); t.addEventListener('mouseleave', stop); t.addEventListener('focus', () => start(1300)); t.addEventListener('blur', stop); }
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

  const srcset = (src) => /(cdn\.shopify\.com|\/cdn\/shop\/)/.test(src) ? [480, 800, 1200, 1800].map((w) => cdnW(src, w) + ' ' + w + 'w').join(', ') : '';
  function photo(k, alt, o) {
    o = o || {};
    const src = typeof k === 'string' && !/[/.]/.test(k) ? simg(k) : k;
    if (!src) return '';
    const ss = srcset(src);
    return `<img src="${esc(cdnW(src, 1200))}"${ss ? ` srcset="${esc(ss)}" sizes="${esc(o.sizes || '100vw')}"` : ''} alt="${esc(alt || '')}" width="1600" height="1200" ${o.eager && !APPV ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
  }
  const STORY = 'In the workshops of Lahore, Sialkot and Kasur, skilled hands make fine leather shoes every day. Too often that craft reaches the buyer without a name of its own, at a price shaped by labels rather than the work. DAUR exists to offer a more considered way to buy. We work with those workshops, select the pairs we believe deserve a place in the collection, check each one by hand and give it a distinctive DAUR finish.';
  const STORY_HOME = 'DAUR began with a simple idea: good footwear should be thoughtfully chosen, well finished and fairly presented. We work with skilled workshops in Lahore, Sialkot and Kasur, select the pairs we believe deserve a place in the collection, check each one by hand and give it a distinctive DAUR finish.';
  const PILLARS = [
    { i: 'pin', t: 'Chosen at the workshop.', d: 'We select finished pairs from skilled workshops in Lahore, Sialkot and Kasur, and every order supports their craft.' },
    { i: 'check', t: 'Checked by hand.', d: 'Every pair is inspected before it is finished and sent to you.' },
    { i: 'tag', t: 'Honest value.', d: 'You pay for the pair and its finish, and every sale price is measured against a price we have truly charged.' },
    { i: 'spark', t: 'A little good in every pair.', d: 'At least ' + GIVE.pct + '% of our profit goes to people in need each quarter, and we publish every giving.' }
  ];
  const STEPS = [
    { k: 'workshop', i: 'pin', t: 'Selected at the workshop', d: 'We work with workshops in Lahore, Sialkot and Kasur and choose the finished pairs ourselves.' },
    { k: 'checked', i: 'check', t: 'Checked by hand', d: 'We look at the stitching, the leather, the sole and the comfort of every pair. A pair that falls short stays behind.' },
    { k: 'door', i: 'truck', t: 'At your door', d: 'Finished with DAUR laces, lace tag and seal, then dispatched from Islamabad within 24 hours of confirmation. ' + (C.advance.required ? 'A small ' + C.advance.care + ' confirms your order, and the rest is paid when it arrives.' : 'You pay when it arrives.') }
  ];
  // who a pair is for: most pairs are bought for someone else as often as for oneself
  const FOR = [
    { t: 'For yourself', d: 'Sneakers for every day, a derby for the wedding season, an easy slip on for Friday.', l: '', c: 'Shop all pairs' },
    { t: 'For your son', d: 'His first day at a new job, college, the weekend. Clean leather that makes him stand a little taller.', l: 'sneakers', c: 'Shop sneakers' },
    { t: 'For your husband', d: 'A full grain derby or a chelsea boot that looks right with a suit and with shalwar kameez.', l: 'leather', c: 'Shop leather shoes' },
    { t: 'For your father', d: 'Soft leather that slips on easily for Eid, for the mosque and for the long family lunch after.', l: 'hybrids', c: 'Shop casual shoes' },
    { t: 'For a brother or a friend', d: 'For the wedding he is in, or simply because. If the size needs changing, a full price pair can be exchanged within ' + (C.exchangeDays || 5) + ' days.', l: '', c: 'Shop all pairs' }
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
    setMeta(ONE === 'Men' ? 'Men\'s Shoes Online in Pakistan | Leather Shoes & Sneakers | DAUR Supply' : 'Leather Shoes & Sneakers Online in Pakistan | DAUR Supply', (ONE === 'Men' ? 'Men\'s leather shoes, sneakers, chelsea boots and casual shoes' : 'Leather shoes and sneakers') + ' from workshops in Lahore, Sialkot and Kasur, checked pair by pair by DAUR Supply. Cash on Delivery across Pakistan, delivery in ' + (C.delivery.days || '2 to 5 days') + ', 5 day size exchange.', [
      { '@context': 'https://schema.org', '@type': 'OnlineStore', name: 'DAUR Supply', alternateName: 'DAUR', url: C.domain, description: 'Pakistani footwear brand for men: leather shoes, sneakers and chelsea boots, chosen at workshops in Lahore, Sialkot and Kasur, checked by hand and delivered across Pakistan.', areaServed: { '@type': 'Country', name: 'Pakistan' } }]);
    const hero = prod('moc-runner-v1') || P[0], hv = hero.variants[0];
    const drop = P.filter((p) => p.audience === (ONE || 'Men')).slice(0, 8);
    const lines = ONE ? CATS.map((c) => ({ key: c, ps: P.filter((p) => p.category === c) })) : C.audiences.map((a) => ({ key: a, ps: P.filter((p) => p.audience === a) }));
    const tileImg = { Sneakers: 'sneakers', Hybrids: 'casual', Leather: 'leather' };
    const sale = P.filter(anySale);
    // four doors, two by two: the styles, then sale (or new in when nothing is on sale)
    const doors = lines.map((l) => ({ h: link('shop', l.key.toLowerCase()), t: { Sneakers: 'Sneakers', Leather: 'Leather shoes', Hybrids: 'Casual' }[l.key] || lineName(l.key), s: l.ps.length ? 'From ' + fmt(Math.min(...l.ps.map(minPrice))) : '', ps: l.ps, k: tileImg[l.key] }))
      .concat(sale.length ? [{ h: link('shop', 'sale'), t: 'Sale', s: 'Up to ' + Math.max(...sale.map(maxPct)) + '% off', ps: sale }] : [{ h: link('gifts'), t: 'Gifts', s: 'For the men in your life', ps: P }]).slice(0, 4);
    app.innerHTML = `
    <div id="homeRw" class="home-rw"></div>

    <section class="x-sec"><div class="wrap">
      <h2 class="x-h">Choose your style</h2>
      <div class="xd-grid">${doors.map((d, k) => { const vs = d.ps.flatMap((p) => p.variants.slice(0, 2).map((v) => [p, v])).slice(0, 6); const n = d.ps.length; return `<a class="xd f-cyc rv xd-${k}" href="${d.h}">
        <span class="xd-m">${vs.length ? vs.map(([p, v], j) => `<span class="f-cy${j ? '' : ' on'}" data-n="${esc(p.name)}">${visual(p, v, { defer: j > 0, alt: j ? '' : null, sizes: '(min-width: 900px) 25vw, 50vw' })}</span>`).join('') : ''}</span>
        <span class="xd-b"><span class="xd-n">${n} ${n === 1 ? 'style' : 'styles'}</span><span class="xd-t">${esc(d.t)}</span>${d.s ? `<span class="xd-p">${d.s.replace(/^From /, 'From <b>').replace(/^Up to /, 'Up to <b>')}</b></span>` : ''}</span>
        <span class="xd-go" aria-hidden="true">${ic('arrow')}</span></a>`; }).join('')}</div>
    </div></section>

    ${giftBlock()}

    <div id="homeNotes"></div>

    <section class="x-sec" id="drop"><div class="wrap">
      <div class="x-hrow"><h2 class="x-h">Fresh from the bench</h2><a class="u-link" href="${link('shop')}">View all</a></div>
      <div class="grid" id="homeGrid">${drop.map((p, i) => card(p, i)).join('')}</div>
    </div></section>

    <section class="x-sec x-pill" aria-label="What DAUR stands for"><div class="wrap"><ul>
      ${PILLARS.map((x) => `<li class="rv"><span class="f-pi" aria-hidden="true">${ic(x.i)}</span><div><h3>${x.t}</h3><p>${x.d}</p></div></li>`).join('')}
    </ul></div></section>

    <section class="x-sec f-story"><div class="wrap">
      <div class="f-story-h rv"><h2 class="x-h">From the bench to your door</h2><p class="x-sub">Good footwear, thoughtfully chosen.</p>
        <p>${STORY_HOME}</p><a class="u-link" href="${link('manifesto')}">Read our story</a></div>
      <ol class="f-steps">${STEPS.map((s, i) => `<li class="f-step rv"><span class="f-step-m">${simg(s.k) ? photo(s.k, '', { sizes: '(max-width: 700px) 100vw, 33vw' }) : `<span class="f-step-ph">${ic(s.i)}</span>`}</span>
        <span class="mono f-n">0${i + 1}</span><h3>${s.t}</h3><p>${s.d}</p></li>`).join('')}</ol>
    </div></section>

    <section class="x-sec" id="anatomy"><div class="wrap">
      <h2 class="x-h">Why it feels different</h2><p class="x-sub">Tap a point on the drawing to see the details that make a pair distinctly DAUR.</p>
      <div class="anat"><div class="anat-fig"><div class="svgbox">${SHOE.render({ name: hero.name, colorway: hv.color, silhouette: hero.silhouette, palette: hv.palette }, { mode: 'blueprint' })}${ANAT.map((a, i) => `<button class="hs" style="left:${a.x}%;top:${a.y}%" data-hs="${i}" aria-pressed="${i === 0}" aria-label="${esc(a.t)}"><span>${i + 1}</span></button>`).join('')}</div></div>
        <div class="anat-list">${ANAT.map((a, i) => `<div class="anat-item ${i === 0 ? 'open' : ''}" data-ai="${i}"><button aria-expanded="${i === 0}"><span class="n">0${i + 1}</span><span class="t">${esc(a.t)}</span><span class="pm" aria-hidden="true">+</span></button><div class="d"><p>${esc(a.d)}</p></div></div>`).join('')}</div></div>
    </div></section>

    ${GIVE.on ? `<section class="f-slice"><div class="wrap">
      <button class="f-slice-loaf" type="button" data-recut aria-label="Play the cut again">${loaf(GIVE.pct + '%', 'big')}</button>
      <div class="f-slice-t rv"><span class="eyebrow">The slice</span><h2>A slice of every pair is not ours to keep.</h2>
        <p>At least ${GIVE.pct}% of our profit, never added to your price, is pooled each quarter and given to people in need after we check each case ourselves. Every giving is published.</p>
        ${lastGiving()}
        <a class="btn f-light" href="${link('giving')}">How our giving works <span class="arr">&rarr;</span></a></div>
    </div></section>` : ''}

    <div id="ext-stories"></div>

    ${resources()}

    <section class="x-sec x-acc"><div class="wrap">${[['sneakers', 'Sneakers and joggers'], ['leather', 'Leather and formal shoes'], ['hybrids', 'Casual shoes'], ['gifts', 'Gifts he will wear']].filter(([k]) => k === 'gifts' || lines.some((l) => l.key.toLowerCase() === k)).map(([k, t]) => {
      const g = k === 'gifts' ? { b: [['', 'Shoes are one of the few gifts a man uses every day. Choose by the occasion: clean leather sneakers for every day, a leather derby or chelsea boot for weddings and Eid, an easy slip on for the mosque and family visits. Not sure of his size? Look inside a shoe he wears now; the EU size is usually printed on the tongue or under the insole.']] } : GUIDE[k];
      return `<details><summary>${esc(t)}${ic('chevD')}</summary><div>${g.b.map(([h, x]) => `${h ? `<h3>${esc(h)}</h3>` : ''}<p>${esc(typeof x === 'function' ? x() : x)}</p>`).join('')}<a class="u-link" href="${k === 'gifts' ? link('gifts') : link('shop', k)}">Shop ${esc(t.toLowerCase())}</a></div></details>`;
    }).join('')}</div></section>

    <section class="x-seo"><div class="wrap">
      <h2>${ONE === 'Men' ? 'Men\'s shoes' : 'Shoes'}, crafted in Pakistan</h2>
      <p>DAUR Supply is a Pakistani footwear brand${ONE === 'Men' ? ' for men' : ''}. We select leather sneakers, formal shoes, chelsea boots and casual slip ons from workshops in Lahore, Sialkot and Kasur, check every pair by hand and finish it with our signature details: matte cotton laces, an engraved metal lace tag and the Supply Unit seal.</p>
      <p>${C.advance.freeAll() ? 'Delivery is free to' : 'We deliver to'} Karachi, Lahore, Islamabad, Rawalpindi, Faisalabad, Multan, Peshawar, Quetta and every other city our couriers reach. ${C.advance.required ? 'A small ' + esc(C.advance.care) + ' confirms your order and the rest is paid on arrival. ' : ''}We dispatch within 24 hours of confirmation, delivery usually takes ${esc(C.delivery.days || '2 to 5 days')}, and full price pairs can be exchanged for size within ${C.exchangeDays || 5} days.</p>
    </div></section>`;
    // the hero is the line of pairs itself: it never ends, and one click on a pair opens its size, colour and bag
    const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
    runway($('#homeRw'), { head: `<span class="f-kicker">${ONE === 'Men' ? 'Men\'s leather shoes and sneakers' : 'Leather shoes and sneakers'}</span>
      <h1>A new era of<br>everyday footwear.</h1>
      ${urLock('ul-hero')}
      <p>Thoughtfully selected in Pakistan. Finished with the details that make a pair distinctly DAUR.</p>
      <small class="rw-hint mono">${fine ? 'Click a pair to choose your size, or drag to see the next.' : 'Tap a pair to choose your size, or swipe to see the next.'}</small>
      <div class="hero-cta"><a class="btn-box" href="${link('shop')}">Explore the collection ${ic('arrow')}</a><a class="u-link" href="${link('gifts')}">Find a gift</a></div>` });
    bindGifts(app); homeNotes($('#homeNotes')); bindCards(app); bindAnat(app); cutWhenSeen(app); cycleTiles(app);
  };

  /* ---- gifts: a guide by who it is for, and a short shelf that filters in place ---- */
  const GIFT_TABS = [
    // leather and casual pairs first: the ones most often bought for someone else
    ['top', 'Top gifts', (ps) => ps.slice().sort((x, y) => ({ Leather: 0, Hybrids: 1 }[x.category] ?? 2) - ({ Leather: 0, Hybrids: 1 }[y.category] ?? 2))],
    ['under', 'Under ' + fmt(4500), (ps) => ps.filter((p) => minPrice(p) < 4500)],
    ['leather', 'Leather shoes', (ps) => ps.filter((p) => p.category === 'Leather')],
    ['sneakers', 'Sneakers', (ps) => ps.filter((p) => p.category === 'Sneakers')],
    ['hybrids', 'Casual', (ps) => ps.filter((p) => p.category === 'Hybrids')]
  ];
  // the pair that best stands for each person in the guide
  const forPair = (x) => { const ps = x.l ? P.filter((p) => p.category.toLowerCase() === x.l) : P; return ps[0] || P[0]; };
  // up to five looks for one story; the stories that share all pairs start at different pairs
  const forPairs = (x, k) => {
    let ps = x.l ? P.filter((p) => p.category.toLowerCase() === x.l) : P.slice();
    if (!ps.length) ps = P.slice();
    if (!x.l && ps.length > 2) { const o = (k * 3) % ps.length; ps = ps.slice(o).concat(ps.slice(0, o)); }
    const vs = ps.flatMap((p) => p.variants.slice(0, 2).map((v) => [p, v]));
    return vs.slice(0, 5);
  };
  function giftBlock(full) {
    const tabs = GIFT_TABS.filter(([, , f]) => f(P).length);
    return `<section class="x-sec x-gift" id="gifts"><div class="wrap">
      <div class="x-hrow"><h2 class="x-h">${full ? 'Gifts by who they are for' : 'Gift guide'}</h2>${full ? '' : `<a class="u-link" href="${link('gifts')}">All gifts</a>`}</div>
      <div class="x-rail">${FOR.map((x, k) => { const vs = forPairs(x, k); return `<a class="x-story f-cyc rv" href="${link('shop', x.l)}"><span class="x-story-m">${vs.map(([p, v], j) => `<span class="f-cy${j ? '' : ' on'}" data-n="${esc(p.name)}">${visual(p, v, { defer: j > 0, alt: j ? '' : null, sizes: '(min-width: 900px) 25vw, 70vw' })}</span>`).join('')}</span><span class="x-story-b"><h3>${esc(x.t)}</h3><p>${esc(x.d)}</p><span class="u-link">${esc(x.c)}</span></span></a>`; }).join('')}</div>
      <div class="x-tabs" role="tablist" aria-label="Gift shelf">${tabs.map(([k, t], i) => `<button type="button" role="tab" data-gt="${k}" aria-selected="${i === 0}">${esc(t)}</button>`).join('')}</div>
      <div class="grid x-shelf" id="giftShelf">${(tabs[0] ? tabs[0][2](P) : []).slice(0, full ? 12 : 4).map((p, i) => card(p, i)).join('')}</div>
      <div class="f-gift rv"><span class="f-pi" aria-hidden="true">${ic('ruler')}</span><p><b>Not sure of his size?</b> Look inside a pair he wears now; the EU size is usually printed on the tongue or under the insole. Choose the same size, or message us and we will help you decide. Full price pairs can be exchanged within ${C.exchangeDays || 5} days.</p>
        <a class="btn-box ghost" href="${waChat('Assalam o Alaikum DAUR Supply, I am buying a pair as a gift and need help with the size.')}" target="_blank" rel="noopener">${ic('whatsapp')}Get size assistance</a></div>
    </div></section>`;
  }
  // how a gift is sent: packing on request, the giver's own note, and full payment in advance
  function giftServe() {
    return `<section class="x-sec gift-serve"><div class="wrap">
      <div class="x-hrow"><h2 class="x-h">Send it as a gift</h2></div>
      <div class="gs-grid">
        <div class="gs-i rv">${ic('gift')}<h3>Gift packing on request</h3><p>Tick <b>This is a gift</b> in your bag and ask for gift packing. Your pair leaves Islamabad ready to be handed over.</p></div>
        <div class="gs-i rv">${ic('mail')}<h3>Your words, in the box</h3><p>Dedicate the pair to him. Write a personal note in your bag and we place it with the pair, so the first thing he reads is from you.</p></div>
        <div class="gs-i rv">${ic('check')}<h3>Paid in full, nothing at his door</h3><p>Gift orders are paid in full in advance by bank transfer. He receives the pair and your note, never a bill.</p></div>
      </div>
      <div class="gs-cta"><a class="btn volt" href="${link('shop')}">Choose his pair <span class="arr">&rarr;</span></a><a class="btn ghost" href="${waChat('Assalam o Alaikum DAUR Supply, I want to send a pair as a gift with gift packing and a note.')}" target="_blank" rel="noopener">${ic('whatsapp')}Plan a gift on WhatsApp</a></div>
    </div></section>`;
  }
  // "A pair for someone in need": the buyer pays for one pair, DAUR hands it over in person on their behalf in the quarterly
  // giving round and sends them the proof privately. The public page shows totals only. Hidden while the product is not on sale.
  function giveSection() {
    if (!GPAIR) return '';
    const v = GPAIR.variants[0];
    return `<section class="x-sec gift-serve give-pair" id="give"><div class="wrap">
      <div class="x-hrow"><h2 class="x-h">A pair for someone in need</h2></div>
      <p class="aside gp-lead">Some gifts go to people you will never meet. Pay for one pair, and we hand it over in person, on your behalf, to someone in need whom we have checked ourselves, in the size that fits them.</p>
      <div class="gs-grid">
        <div class="gs-i rv">${ic('gift')}<h3>One pair, one person</h3><p>Your pair is set aside for one person under your own giving number, and handed over in the giving round after this quarter closes.</p></div>
        <div class="gs-i rv">${ic('mail')}<h3>The proof, sent to you</h3><p>Within 7 days of the handover we send you the evidence privately on WhatsApp and by email: the date, the city, the pair, and a photo that protects the person's dignity.</p></div>
        <div class="gs-i rv">${ic('check')}<h3>Kept private</h3><p>Our giving page shows totals only: how many pairs were given and in which cities. Your name and the identity of the person who receives the pair stay private.</p></div>
      </div>
      <div class="gs-cta"><button class="btn volt" type="button" data-givepair>Give a pair, ${fmt(v.price)} <span class="arr">&rarr;</span></button><a class="btn ghost" href="${waChat('Assalam o Alaikum DAUR Supply, I would like to give a pair to someone in need.')}" target="_blank" rel="noopener">${ic('whatsapp')}Ask about giving a pair</a></div>
      <p class="form-note gp-fine">Paid in full in advance. We choose a sturdy everyday pair and match the size on the day of the handover. Like every order, it also carries our slice of profit for people in need. Our usual cancellation and refund policy applies until the pair is handed over.</p>
    </div></section>`;
  }
  function bindGive(root) {
    const b = $('[data-givepair]', root); if (!b || !GPAIR) return;
    b.addEventListener('click', () => { addToCart(GPAIR.id, GPAIR.variants[0].id, 0, 1); });
    if (location.hash === '#give') { const s = $('#give', root); if (s) setTimeout(() => s.scrollIntoView({ block: 'start' }), 60); }
  }
  function bindGifts(root) {
    const shelf = $('#giftShelf', root); if (!shelf) return;
    const n = root.dataset.full ? 12 : 4;
    $$('[data-gt]', root).forEach((b) => b.addEventListener('click', () => {
      $$('[data-gt]', root).forEach((x) => x.setAttribute('aria-selected', x === b));
      const f = (GIFT_TABS.find(([k]) => k === b.dataset.gt) || GIFT_TABS[0])[2];
      shelf.innerHTML = f(P).slice(0, n).map((p, i) => card(p, i)).join('');
      bindCards(shelf);
    }));
  }
  V.gifts = function () {
    setMeta('Gifts for Men: Leather Shoes and Sneakers | DAUR Supply', 'Gift guide for the men in your life: leather shoes, sneakers and casual pairs from DAUR Supply, gift packing on request, your own note in the box and delivery across Pakistan.');
    app.dataset.full = '1';
    app.innerHTML = `<section class="phero x-phero"><div class="wrap"><h1>Gifts</h1><p class="aside">For your son, your husband, your father, your brother, your friend. A pair he will wear for years says more than anything wrapped in a shop bag. Choose it, and we bring it to his door in ${esc(C.delivery.days || '2 to 5 days')}.</p></div></section>
      ${giftServe()}
      ${giftBlock(true)}
      ${giveSection()}
      ${resources()}`;
    bindGifts(app); bindCards(app); cycleTiles(app); bindGive(app);
  };

  /* ---- Fit notes on the home page: only approved notes from the store with five hearts, the fullest first ---- */
  function homeNotes(host) {
    if (!host) return;
    const R = window.DAUR_EXT && window.DAUR_EXT.reviews, stars = window.DAUR_EXT && window.DAUR_EXT.stars;
    if (!R || !stars) return;
    const best = R.approved().filter((r) => String(r.id).startsWith('fn-') && r.rating === 5 && prod(r.pid))
      .sort((a, b) => (!!b.photo - !!a.photo) || (!!b.verified - !!a.verified) || (String(b.body).length - String(a.body).length)).slice(0, 5);
    if (!best.length) return;
    host.innerHTML = `<section class="x-sec x-notes"><div class="wrap">
      <div class="x-hrow"><h2 class="x-h">Fit notes</h2><span class="x-sub-s">Five hearts, from people who wear them</span></div>
      <div class="x-rail">${best.map((r) => { const p = prod(r.pid), v = variant(p, r.vid); return `<article class="x-note">
        ${r.photo ? `<img class="x-note-ph" src="${esc(r.photo)}" alt="${esc(p.name)} worn by ${esc(r.name)}" loading="lazy" width="600" height="600">` : ''}
        ${stars(5, 'lg')}${r.title ? `<h3>${esc(r.title)}</h3>` : ''}<p>${esc(String(r.body).length > 220 ? String(r.body).slice(0, 217).replace(/\s+\S*$/, '') + '...' : r.body)}</p>
        <span class="x-note-by">${esc(r.name)}${r.city ? ', ' + esc(r.city) : ''}${r.verified ? ' <span class="mono">Verified buyer</span>' : ''}</span>
        <a class="u-link" href="${link('product', p.id + '~' + v.id)}">${esc(p.name)}</a></article>`; }).join('')}</div>
    </div></section>`;
  }

  /* ---- related reading: Journal guides from the store, with the house guides as a fallback ---- */
  function resources() {
    const J = (Array.isArray(window.DAUR_JOURNAL) ? window.DAUR_JOURNAL : []).filter((a) => a && a.url && a.title).slice(0, 6);
    const own = [
      { title: 'How to find your size', text: 'Mark your heel and longest toe on paper, measure and match it to the chart. Takes two minutes.', url: link('policies', 'sizes'), k: 'guide' },
      { title: 'What every pair promises', text: 'Dispatch, delivery, ' + (C.advance.required ? 'the Care deposit' : 'Cash on Delivery') + ', exchanges and defect cover, in plain words.', url: link('contract'), k: 'door' },
      { title: 'From the bench to your door', text: 'Where our pairs are made, how we check them and why they carry our name.', url: link('manifesto'), k: 'workshop' }
    ];
    const list = J.length ? J : own;
    return `<section class="x-sec x-res"><div class="wrap">
      <div class="x-hrow"><h2 class="x-h">Related reading</h2>${SHOP && J.length ? '<a class="u-link" href="/blogs/journal">The Journal</a>' : ''}</div>
      <div class="x-rail">${list.map((a, i) => { const img = a.image || (a.k && simg(a.k)) || ''; const p = P[i % P.length]; return `<a class="x-art rv" href="${esc(a.url)}"><span class="x-art-m">${img ? `<img src="${esc(cdnW(img, 900))}" alt="" loading="lazy" width="900" height="600">` : p ? visual(p, p.variants[0]) : ''}</span>
        <span class="x-art-b"><h3>${esc(a.title)}</h3><p>${esc(a.text || '')}</p></span></a>`; }).join('')}</div>
    </div></section>`;
  }

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
    { t: 'The leather', d: 'Leather softens to your foot and gains character with wear. We look over every upper before a pair is accepted.', x: 46, y: 57 },
    { t: 'The stitching', d: 'Even, tight stitching is a sign of care. We check every seam, and a pair with a wavy or skipped stitch is set aside.', x: 71, y: 53 },
    { t: 'Matte cotton laces', d: 'Thick matte black woven cotton laces replace the originals. It is often the first detail people notice.', x: 39.5, y: 35.5 },
    { t: 'Engraved dubrae', d: 'A laser engraved DAUR metal tag on the bottom lace row. Our mark sits on the hardware, so the leather can speak for itself.', x: 48, y: 44 },
    { t: 'Supply Unit seal', d: 'A matte black rubber seal on the top eyelet. Keep it on until you are happy with the size; once it comes off, the pair is fully yours.', x: 36.5, y: 56 },
    { t: 'The sole', d: 'A rubber outsole for grip on road and tile. We check where sole meets upper, at the toe and the heel, on every pair.', x: 56, y: 75 }
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
    C.advance.deposits() ? ['Payment', 'Deposit, then delivery', 'A small ' + C.advance.care + ' by bank transfer secures your order: ' + C.advance.tierText() + ' The rest is paid to the rider.'] : ['Payment', 'Cash on Delivery', 'Pay the rider when the box arrives. No card needed.' + (C.advance.on ? ' Or pay in advance, in full or as a ' + C.advance.care + ', and delivery is free.' : '')],
    C.advance.deposits() && C.advance.free === 'all' ? ['Delivery fee', 'Free', 'Free delivery to every city on every order.'] : ['Delivery fee', fmt(C.delivery.fee) + ', or free', 'One flat fee for every city. Free on ' + C.freeDeliveryPairs + ' pairs or more' + (C.advance.on && C.advance.free !== 'none' ? ', or when you pay in full in advance.' : '.')],
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
      all: [ONE === 'Men' ? 'Drop 01 / every men\'s pair' : 'Drop 01 / every pair', 'Thoughtfully selected men\'s shoes, finished with DAUR details.' + (C.advance.freeAll() ? ' Free delivery across Pakistan.' : C.advance.required ? '' : ' Pay when it is in your hands.')],
      sneakers: ['Style 01 / Sneakers', 'For long city days, late chai with friends and everything between.'],
      leather: ['Style 02 / Leather shoes', 'For the day you stand up at a wedding, the first day of a new job, the photo that stays on the wall.'],
      hybrids: ['Style 03 / Casual', 'Jummah, a family lunch, a long drive. One easy pair for all of it.'],
      men: ['Line 01 / Men', 'Leather shoes and sneakers made for the way you move.'],
      women: ['Line 02 / Women', 'Clean lines on a narrower last.'],
      kids: ['Line 03 / Kids', 'First steps in real leather, at a price that makes sense when they outgrow it in six months.'],
      sale: ['Price cuts / live now', 'Same pairs, same checks, a lower price while sizes last.'],
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
        <div class="wrap">
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
  // the moment each pair is made for, taken from its own description; a pair not listed simply shows no line
  const MADE_FOR = {
    'moc-runner-v1': 'Every day of the week, from the office to Jummah.',
    'phantom-trainer': 'Long city days and dark evenings.',
    'grid-court-low': 'Everyday wear that goes with everything you own.',
    'unit-derby-02': 'Tailoring and cargos alike, from the office to the wedding hall.',
    'concrete-mid': 'The days you wear them hard.',
    'volt-signal': 'The days you want to be seen.',
    'ward-chelsea': 'Winter evenings, weddings and everything between.',
    'sector-slip': 'From the office to the dinner table.',
    'saddle-tassel': 'Easy summer days, no socks required.'
  };
  V.product = function (param) {
    const [pid, vid] = (param || '').split('~');
    const p = prod(pid) || (SPA && pid ? null : P[0]);
    if (!p) { V.notfound(); return; } // a pair address that does not exist gets the not found page, never a different pair
    if (p.giving) { location.replace(link('gifts') + '#give'); return; } // the giving pair lives on Gifts, not on a product page
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
          <div class="buy-head"><span class="cw">${esc(lineName(p.category))}</span><h1>${esc(p.name)}</h1>
            <div class="price-row"><span class="now">${fmt(v.price)}</span><span class="pcol">${esc(v.color)}</span>${onSale(v) ? `<span class="was strike">${fmt(v.compareAt)}</span><span class="save">Save ${pct(v)}%</span>` : SELL.retailAnchor ? `<span class="was">Typical retail <span class="strike">${fmt(C.marketRetail)}+</span></span>` : ''}</div>
            ${perWear(v.price)}
            ${GIVE.on ? `<button class="slice-note" id="sliceB" type="button" aria-haspopup="dialog" data-recut>${loaf(GIVE.pct + '%')}<span class="sl-t"><b>A slice of this pair goes to someone in need.</b><span>At least ${GIVE.pct}% of our profit on it. Your price stays the same.</span></span></button>` : ''}
            <p class="blurb">${esc(p.description)}</p>${MADE_FOR[p.id] ? `<p class="made-for"><b>Made for:</b> ${esc(MADE_FOR[p.id])}</p>` : ''}</div>
          <div><div class="field-label"><span>Colour / ${esc(v.color)}</span><span>${p.variants.length} option${p.variants.length > 1 ? 's' : ''}</span></div><div class="vpick2">${p.variants.map((x) => `<button class="vsw" data-v="${x.id}" aria-pressed="${x.id === v.id}" aria-label="${esc(x.color)}" style="--c:${esc(x.hex || '#777')}"><span class="vsw-i">${window.DAUR_KICKS ? window.DAUR_KICKS.svg(window.DAUR_KICKS.kindOf(p), window.DAUR_KICKS.colorsFor(x.hex || '#777')) : ''}</span><span class="vsw-l">${esc(x.color)}</span>${stockOf(x) ? '' : '<span class="vsw-out">Sold out</span>'}</button>`).join('')}</div></div>
          <div><div class="field-label strong"><span>Select size / EU ${size || ''}</span><button id="sgBtn">${ic('ruler')}Size guide</button></div>
            <div class="sizes">${p.sizes.map((s) => { const n = st[s] || 0; return `<button class="size" data-s="${s}" aria-pressed="${size == s}" ${n ? '' : 'data-out="1"'} aria-label="EU ${s}${n ? '' : ', sold out'}">${s}${n && n <= C.lowStockAt ? `<small>${n} LEFT</small>` : ''}${n ? '' : '<small style="color:var(--dim)">SOLD OUT</small>'}</button>`; }).join('')}</div>
            <div id="notify"></div><p class="pdp-help">Not sure about your size? <a class="link" href="${waChat('Assalam o Alaikum DAUR Supply, I need help choosing my size for ' + p.name + '.')}" target="_blank" rel="noopener">Talk to us before ordering</a>. We will help you find the right fit.</p></div>
          <div class="buy-actions"><div class="qty"><button id="qm" aria-label="Decrease quantity">&minus;</button><output id="qv">${qty}</output><button id="qp" aria-label="Increase quantity">+</button></div>
            <button class="btn volt pill-add" id="add">${ic('bag')}<span>${size ? 'Add to bag, ' + fmt(v.price * qty) : 'Select a size'}</span></button>
            <button class="btn ghost block" id="buyNow">${C.advance.required ? 'Buy now' : 'Buy now, pay on delivery'}</button></div>
          ${C.advance.deposits() ? `<p class="pdp-pay">${C.advance.freeAll() ? 'Free delivery across Pakistan. ' : ''}${fmt(C.advance.one)} now reserves this pair, and the rest is paid at your door. It is part of the price, never an extra.</p>` : ''}
          <div class="pdp-acts"><button class="act" data-wish="${p.id}" aria-pressed="${wish.includes(p.id)}" id="wishB">${ic('heart', 'h-o')}${ic('heartFill', 'h-f')}<span>${wish.includes(p.id) ? 'Liked' : 'Like'}</span></button><button class="act" id="shareB">${ic('send')}<span>Share</span></button></div>
          <div id="ext-rvcard"></div>
          <ul class="trust one">${C.advance.deposits() ? `<li>Small ${esc(C.advance.care)}, rest on arrival</li>` : '<li>Cash on Delivery</li>'}<li>Dispatched within 24 hours</li><li>${esc(C.delivery.days)} across Pakistan</li>${C.advance.freeAll() ? '<li>Free delivery</li>' : `<li>Free delivery on ${C.freeDeliveryPairs} pairs</li>${C.advance.on ? '<li>Free delivery with advance payment</li>' : ''}`}<li>${C.exchangeDays || 5} day size exchange</li></ul>
          <div class="acc">
            <details><summary>What it is made of</summary><div class="in specs"><dl>${Object.entries(p.specs || {}).map(([k, x]) => `<div><dt>${esc(k)}</dt><dd>${esc(x)}</dd></div>`).join('')}<div><dt>Colour</dt><dd>${esc(v.color)}</dd></div><div><dt>Code</dt><dd class="mono">${esc(p.id + '-' + v.id).toUpperCase()}</dd></div></dl></div></details>
            <details><summary>In the box</summary><div class="in"><ul class="inbox"><li>The pair, re-laced in thick matte black cotton</li><li>The engraved DAUR lace tag on the bottom lace row</li><li>The Supply Unit seal on the top eyelet</li><li>A shoe box for delivery</li></ul></div></details>
            <details><summary>${C.advance.required ? 'Delivery, payment and exchanges' : 'Delivery, COD and exchanges'}</summary><div class="in"><p>${C.advance.deposits() ? `${C.advance.freeAll() ? 'Delivery is free across Pakistan. ' : ''}A small ${esc(C.advance.care)} confirms your order and counts towards your price; the rest is paid when your pair arrives.` : 'Cash on Delivery across Pakistan. Free delivery on two pairs or more.'} We confirm every order with you by call or WhatsApp before dispatch. If the size is not right, a full price pair can be exchanged within 5 days, unworn and with the seal attached. Sale pairs are offered at their marked price without size exchange, and every pair is covered for manufacturing defects for 30 days. <a class="link" href="${link('contract')}">Our full promise</a></p></div></details>
          </div>
          ${ladder(p, v)}
        </div>
      </div></div>
      <div id="ext-reviews"></div>
      <section class="f-pillars f-pillars-pdp" aria-label="Why DAUR"><div class="wrap"><ul>${PILLARS.map((x) => `<li><span class="f-pi" aria-hidden="true">${ic(x.i)}</span><div><h2>${x.t}</h2><p>${x.d}</p></div></li>`).join('')}</ul></div></section>
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
      $('#shareB').addEventListener('click', () => shareLink(absLink('product', p.id + '~' + v.id), 'DAUR ' + p.name + ' / ' + v.color, `DAUR ${p.name} in ${v.color}, ${fmt(v.price)}.`));
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
    setMeta('Your bag | DAUR Supply', 'Review your DAUR Supply bag. Free delivery across Pakistan.');
    function paint() {
      const t = totals();
      if (!t.lines.length) {
        app.innerHTML = `<div class="wrap">${bagEmpty(false)}</div>`;
        bindCards(app); return;
      }
      app.innerHTML = `<section class="phero"><div class="wrap"><h1>Your bag.</h1><p class="aside">Saved on this device. Your size is reserved once your order is confirmed.</p></div></section>
      <div class="wrap"><div class="two cart-page"><div class="main">${freeMeter(t.n)}${t.lines.map((d) => lineHTML(d, true)).join('')}
        <a class="link" href="${link('shop')}" style="display:inline-block;margin-top:24px">Continue shopping</a></div>
        <aside class="side">${summary(t, true)}<a class="btn volt block" href="${link('checkout')}">Checkout${C.advance.required ? '' : ', Cash on Delivery'} <span class="arr">&rarr;</span></a><p class="form-note">One delivery fee for all of Pakistan, confirmed at checkout.</p></aside></div></div>`;
      bindLines(app); bindPromo(paint); bindVote(app); bindGift(paint);
    }
    rerender = () => { paintCounts(); paint(); };
    paint();
  };
  function summary(t, promo) {
    return `<span class="mono mute">Order summary</span>
      <div class="sum-row"><span>Subtotal, ${t.n} pair${t.n > 1 ? 's' : ''}</span><span>${fmt(t.subtotal)}</span></div>
      ${t.sale ? `<div class="sum-row mute"><span>Before sale</span><span class="strike">${fmt(t.before)}</span></div>` : ''}
      ${promo ? `<div class="promo"><input id="promo" placeholder="Discount code" value="${esc(coupon)}" aria-label="Discount code" autocomplete="off"><button id="promoBtn">${coupon && !t.couponErr ? 'Remove' : 'Apply'}</button></div>${t.couponErr ? `<span class="code-msg err">${esc(t.couponErr)}</span>` : SHOP && coupon && shopCode.code === coupon && shopCode.note ? `<span class="code-msg ok">${esc(shopCode.note)}</span>` : ''}${!t.couponErr && C.advance && C.advance.on && C.advance.code && coupon === C.advance.code ? `<a class="code-msg wa-r" target="_blank" rel="noopener" href="https://wa.me/${esc(C.whatsapp)}?text=${encodeURIComponent('Assalam o Alaikum DAUR, here is my payment receipt for my order')}">${ic('whatsapp')} Send your payment receipt on WhatsApp</a>` : ''}${SHOP ? '<span class="code-msg">Your code goes to checkout with your bag, already applied. Gift card? Enter it on the payment step at checkout.</span>' : ''}` : ''}
      ${t.discount ? `<div class="sum-row save"><span>${esc(coupon)} / ${esc(t.cp.label || 'Discount')}</span><span>&minus; ${fmt(t.discount)}</span></div>${t.cp.phone ? '<p class="form-note">This code is linked to one WhatsApp number. It is checked when you place the order.</p>' : ''}` : ''}
      ${t.free && C.advance.freeAll() ? `<div class="sum-row"><span>Delivery</span><span>${fmt(C.advance.delCredit)}</span></div><div class="sum-row save"><span>Delivery credit</span><span>&minus; ${fmt(C.advance.delCredit)}</span></div>` : `<div class="sum-row"><span>Delivery</span><span>${t.free ? '<span class="volt">Free</span>' : fmt(t.delivery)}</span></div>`}
      ${C.advance.required ? '' : `<div class="sum-row"><span>Cash on Delivery fee</span><span>${fmt(0)}</span></div>`}
      <div class="sum-row total"><span>Total</span><span>${fmt(t.total)}</span></div>
      ${promo && t.n ? giftBox() : ''}
      ${(C.advance.on && C.advance.required || gift.on || hasGiving()) && t.n ? careBox(t) : ''}
      ${hasGiving() ? `<p class="form-note gp-note">${ic('gift')} Your giving pair is handed over on your behalf in the giving round after this quarter closes. We send you the proof privately within 7 days of the handover.</p>` : ''}
      ${keptBox(t)}
      ${GIVE.on && t.n ? `<p class="sum-give">${loaf('', 'mini cut')}<span>A slice of this order goes to someone in need: at least ${GIVE.pct}% of our profit, never added to your total.</span></p>${votePicker()}` : ''}
      ${SELL.retailAnchor ? `<div class="sum-row save"><span>Saved against typical retail</span><span>${fmt(t.retail - t.subtotal + t.discount)}</span></div>` : ''}`;
  }
  // the Care deposit for this exact bag: what is sent first by bank transfer, and what is left for the rider
  // how this exact bag is paid, on the same rule as the phone bag: what is sent today by bank transfer, and what is left for the door
  function bagPlan(t) {
    const isGive = (d) => d.p.giving || d.l.mode === 'give', isOwn = (d) => !isGive(d) && d.l.mode !== 'gift';
    const give = t.lines.filter(isGive), own = gift.on ? [] : t.lines.filter(isOwn);
    const covered = gift.on ? t.total : t.lines.filter((d) => !isOwn(d)).reduce((a, d) => a + d.total, 0);
    return Object.assign(C.advance.plan(own.reduce((a, d) => a + d.l.qty, 0), covered, t.total), { ownPairs: own.reduce((a, d) => a + d.l.qty, 0), nGive: give.reduce((a, d) => a + d.l.qty, 0) });
  }
  function careBox(t) {
    const p = bagPlan(t), one = p.ownPairs === 1;
    const head = gift.on ? 'Your gift, covered today' : p.onlyCovered ? 'Philanthropy, covered today' : p.covered ? 'Philanthropy, covered today' : one ? 'Reserve it today' : 'Reserve them today';
    const note = gift.on ? 'Gift orders are paid in full by bank transfer, so no bill reaches him. Only the pair and your note. If you cancel before dispatch, the payment is refunded in full.'
      : p.onlyCovered ? 'A pair for someone in need is paid in full by bank transfer after you place the order. They receive it with nothing to pay. If you cancel before the handover, our usual cancellation and refund policy applies.'
      : p.covered ? 'The Philanthropy pair is paid today by bank transfer. Your own ' + (one ? 'pair is' : 'pairs are') + ' paid at your door.'
      : 'Your ' + (one ? 'pair' : 'pairs') + ', reserved for you. Send ' + fmt(p.now) + ' by bank transfer after you place the order. It is part of your price, and if you cancel before dispatch it comes back to you in full. Prefer to pay everything today? Tell us on WhatsApp and nothing is left for the door.';
    return `<div class="care-box"><div class="sum-row"><span><b>${head}</b></span><span><b>${fmt(p.now)}</b></span></div>
      <div class="sum-row"><span>${p.door ? (one || !p.ownPairs ? 'When it reaches your door' : 'When they reach your door') : 'Nothing to pay at the door'}</span><span>${fmt(p.door)}</span></div>
      <p class="form-note">${note}</p>
      <a class="code-msg wa-r" target="_blank" rel="noopener" href="https://wa.me/${esc(C.whatsapp)}?text=${encodeURIComponent('Assalam o Alaikum DAUR, here is my payment receipt for my order')}">${ic('whatsapp')} Send your payment receipt on WhatsApp</a></div>`;
  }
  function giftBox() {
    return `<div class="gift-box${gift.on ? ' on' : ''}">
      <label class="gb-t"><input type="checkbox" id="giftOn"${gift.on ? ' checked' : ''}><span class="gb-tx"><b>${ic('gift')}This is a gift</b><small>Ask for gift packing and add your own note for the box. Gifts are paid in full in advance.</small></span></label>
      ${gift.on ? `<div class="gb-f">
        <label class="gb-c"><input type="checkbox" id="giftPack"${gift.pack ? ' checked' : ''}><span>Add gift packing</span></label>
        <label class="gb-l"><span>Who is it for?</span><input id="giftTo" maxlength="40" placeholder="His name" value="${esc(gift.to)}" autocomplete="off"></label>
        <label class="gb-l"><span>Your note <em id="giftN">${240 - gift.note.length}</em></span><textarea id="giftNote" maxlength="240" rows="3" placeholder="Eid Mubarak, Abbu. For every step ahead.">${esc(gift.note)}</textarea></label>
        <p class="form-note">We place your note with the pair. The price stays off the parcel.</p></div>` : ''}
    </div>`;
  }
  function bindGift(cb) {
    const on = $('#giftOn'); if (!on) return;
    on.addEventListener('change', () => { gift.on = on.checked; saveGift(); cb(); toast(gift.on ? 'Marked as a gift: paid in full in advance' : 'Gift removed'); });
    const pk = $('#giftPack'); if (pk) pk.addEventListener('change', () => { gift.pack = pk.checked; saveGift(); });
    const to = $('#giftTo'); if (to) to.addEventListener('input', () => { gift.to = to.value.slice(0, 40); saveGift(); });
    const nt = $('#giftNote'); if (nt) nt.addEventListener('input', () => { gift.note = nt.value.slice(0, 240); saveGift(); $('#giftN').textContent = 240 - gift.note.length; });
  }
  function bindPromo(cb) {
    const b = $('#promoBtn'); if (!b) return;
    const apply = async () => {
      const t = totals();
      if (coupon && !t.couponErr && b.textContent === 'Remove') { coupon = ''; shopCode = { code: '', sig: '', err: '', saving: 0, note: '' }; saveCart(); cb(); toast('Code removed'); if (SHOP && SHOP.checkCode) SHOP.checkCode(''); return; }
      coupon = $('#promo').value.trim().toUpperCase(); saveCart();
      if (SHOP && SHOP.checkCode && coupon) {
        // ask Shopify now, with the pairs in this bag, so the buyer knows at once and never types the code again at checkout
        b.disabled = true; b.textContent = 'Checking';
        const r = await SHOP.checkCode(coupon);
        const adv = C.advance && C.advance.on && C.advance.code && coupon === C.advance.code;
        shopCode = { code: coupon, sig: cartSig(), err: '', saving: 0, note: '' };
        if (r.error) shopCode.err = r.error;
        else if (adv) shopCode.note = 'Free delivery code added. Pay in full or send a ' + C.advance.care + ' of ' + fmt(C.advance.deposit) + ' or more, and send us the receipt on WhatsApp.';
        else if (r.pending) shopCode.note = 'Code saved. It goes to checkout with your bag.';
        else if (!r.found || !r.applicable) shopCode.err = 'This code does not apply to the pairs in your bag. Check the spelling or the conditions on the Offers page.';
        else { shopCode.saving = r.saving; shopCode.note = r.saving ? coupon + ' applied: you save ' + fmt(r.saving) + '.' : coupon + ' applied. Your saving shows at checkout.'; }
        cb();
        toast(shopCode.err ? 'Code not applied' : shopCode.note.split('.')[0]);
        return;
      }
      const t2 = totals(); cb();
      if (coupon && !t2.couponErr) toast(coupon + ' applied');
    };
    b.addEventListener('click', apply);
    $('#promo').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); apply(); } });
  }

  /* ---- checkout ---- */
  V.checkout = function () {
    setMeta('Checkout | DAUR Supply', 'Cash on Delivery checkout for DAUR Supply. Delivery to every city in Pakistan.');
    if (!cart.length) { location.replace(link('cart')); if (SPA) route(); return; }
    const draft = store.get('draft', {});
    app.innerHTML = `<section class="phero"><div class="wrap"><h1>Seal the order.</h1><p class="aside">No card needed: pay the rider at your door, or pay in advance and delivery is free. We confirm by call or WhatsApp, then dispatch within 24 hours.</p></div></section>
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
          <div class="pay-opt"><span class="radio" aria-hidden="true"></span><div>${C.advance.deposits() ? `<b>Bank transfer today: ${fmt(bagPlan(totals()).now)}</b><p>Send it after you place the order and your pair is reserved. ${bagPlan(totals()).door ? 'The rest, ' + fmt(bagPlan(totals()).door) + ', is paid at your door.' : 'Nothing is left to pay at the door.'}</p>` : `<b>Cash on Delivery</b><p>Pay the rider in cash when the box arrives. Keep exact change ready if you can.</p>`}</div><span class="mono volt">Selected</span></div>
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
        subtotal: t.subtotal, discount: t.discount, coupon: t.discount ? coupon : '', delivery: t.delivery || 0, total: t.total, payment: gift.on ? 'Gift, paid in full in advance' : hasGiving() ? 'Paid in full in advance' : C.advance.required ? 'Advance payment' : 'Cash on Delivery', sliceCause: window.DAUR_SLICE_VOTE(), gift: window.DAUR_GIFT() };
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
    app.innerHTML = `<section class="phero"><div class="wrap"><h1>Liked pairs.</h1><p class="aside">Your shortlist, saved on this device. When you are ready, your size is a tap away.</p></div></section>
      <div class="wrap" style="padding-block:32px 96px">${ps.length ? `<div class="grid">${ps.map((p, i) => card(p, i)).join('')}</div>` : `<div class="empty"><span class="mono">Nothing saved yet</span><a class="btn ghost" href="${link('shop')}">Explore the collection</a></div>`}</div>`;
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
      { id: 'why', n: 'Why DAUR', k: 'bench', i: 'spark', h: 'Good footwear, thoughtfully chosen.', big: 'Pakistan makes fine leather shoes. DAUR gives that work a name you can wear with pride.', p: [STORY, 'Daur means era. Aik naya daur is our promise: a new era for the shoes Pakistan makes, and for the men who wear them.'] },
      { id: 'workshops', n: 'The workshops', k: 'workshop', i: 'pin', h: 'Lahore, Sialkot and Kasur.', big: 'Behind every DAUR pair is a bench, a pair of skilled hands and years of practice.', p: ['Every DAUR pair comes from skilled workshops in these three cities. Our part is to select the pairs that deserve a place in the collection, check them one by one and stand behind each with our name.'], note: 'Punjab is one of the centres of Pakistan\'s leather footwear trade, with production mainly in and around Lahore and Sialkot. The country has around 800 tanneries, and a widely cited 2016 report counted more than 500,000 people working in its leather industry.', src: [['SOMO, Leather products from Pakistan, 2021', 'https://www.somo.nl/nl/wp-content/uploads/sites/2/2021/04/Leather-products-from-Pakistan-mapping-paper.pdf']] },
      { id: 'checks', n: 'Our checks', k: 'checked', i: 'check', h: 'Checked before the seal.', big: 'Every pair is looked over by hand before it is finished.', list: ANAT.map((a) => [a.t, a.d]) },
      { id: 'finish', n: 'The DAUR finish', k: 'tools', i: 'tag', h: 'Branded, not labeled.', big: 'Our mark lives on the hardware. The leather does the talking.', list: [['Matte cotton laces', 'Thick matte black woven cotton laces replace the factory laces.'], ['Engraved dubrae', 'A laser engraved DAUR metal tag on the bottom lace row.'], ['Supply Unit seal', 'A matte black rubber seal on the top eyelet. Keep it on until you are sure of the size.']] },
      { id: 'slice', n: 'The slice', k: '', i: 'spark', h: 'A share that is not ours to keep.', big: 'At least ' + GIVE.pct + '% of our profit, never of your price, given every quarter.', p: ['Every pair you buy adds to the slice. We pool it and give it at the end of each quarter to verified cases of need that we check ourselves. Every giving is published on Our giving, with its date and amount, and the people we help keep their dignity.'], quote: true, cta: ['giving', 'How our giving works'] },
      { id: 'word', n: 'Our word', k: '', i: 'shield', h: 'Our commitment to you.', big: 'You deserve to know exactly what you are buying, so we say it plainly.', list: [['Selected, checked and finished by us', 'Skilled workshops make every pair; we select each one, check it by hand and finish it with DAUR details.'], ['Real prices only', 'A crossed out price is always a price we really charged.'], ['Materials on every pair', 'Each product page lists the upper, lining and sole as the workshop confirms them.'], ['A real person to help', 'Every order is confirmed with you by call or WhatsApp before it ships.']] }
    ];
    const pairAt = (i) => { const p = P[(i * 2 + 1) % P.length]; return p ? visual(p, p.variants[0], { sizes: '(min-width: 860px) 45vw, 100vw' }) : ''; };
    const fan = P.slice(0, 3);
    app.innerHTML = `<section class="st-hero"><div class="wrap st-hero-g">
        <div class="st-hero-t"><span class="st-k">Our story</span><h1>Naya daur.</h1>${urLock('ul-story')}
          <p>Good footwear should be thoughtfully chosen, well finished and fairly presented. That is the idea DAUR began with.</p>
          <div class="hero-cta"><a class="btn volt" href="${link('shop')}">Explore the collection <span class="arr">&rarr;</span></a><a class="btn ghost" href="#why" data-jump="why">Read the story</a></div></div>
        <div class="st-hero-m" aria-hidden="true">${simg('bench') ? photo('bench', '', { eager: true, sizes: '(min-width: 860px) 50vw, 100vw' }) : fan.map((p, k) => `<span class="st-fan f${k}">${visual(p, p.variants[0], k ? { alt: '' } : { eager: true })}</span>`).join('')}</div>
      </div></section>
      <nav class="st-nav wrap" aria-label="Chapters">${CH.map((c, i) => `<a href="#${c.id}" data-jump="${c.id}"><b>0${i + 1}</b>${c.n}</a>`).join('')}</nav>
      ${CH.map((c, i) => `<section class="st-ch${i % 2 ? ' alt' : ''}" id="${c.id}"><div class="wrap st-ch-g${i % 2 ? ' rev' : ''}">
        <div class="st-ch-m rv">${c.k && simg(c.k) ? photo(c.k, '', { sizes: '(max-width: 860px) 100vw, 50vw' }) : c.id === 'slice' ? `<span class="st-loaf" data-recut>${loaf(GIVE.pct + '%', 'big')}</span>` : `<span class="st-pair">${pairAt(i)}</span>`}<span class="st-no" aria-hidden="true">0${i + 1}</span></div>
        <div class="st-ch-t rv"><span class="st-k">${ic(c.i)}${c.n}</span><h2>${c.h}</h2><p class="st-big">${c.big}</p>
          ${(c.p || []).map((t) => `<p>${esc(t)}</p>`).join('')}
          ${c.list ? `<div class="st-list">${c.list.map(([x, y]) => `<div class="st-li"><span class="st-li-i">${ic('check')}</span><div><b>${esc(x)}</b><p>${esc(y)}</p></div></div>`).join('')}</div>` : ''}
          ${c.quote ? '<blockquote class="st-q"><p>&ldquo;Charity does not decrease wealth.&rdquo;</p><cite>Prophet Muhammad &#xFDFA;, Sahih Muslim 2588</cite></blockquote>' : ''}
          ${c.note ? `<p class="st-note">${esc(c.note)}</p>` : ''}
          ${c.src ? `<p class="st-src">Source: ${c.src.map(([t, u]) => `<a href="${u}" target="_blank" rel="noopener">${esc(t)}</a>`).join(', ')}</p>` : ''}
          ${c.cta ? `<a class="u-link" href="${link(c.cta[0])}">${c.cta[1]}</a>` : ''}</div>
      </div></section>`).join('')}
      <section class="st-close"><div class="wrap"><div class="st-close-c">
        ${urLock('ul-close')}<h2>Welcome to a new era.</h2>
        <p>Every pair checked by hand, ${C.advance.freeAll() ? 'delivered free across Pakistan' : 'delivered across Pakistan'}, with a ${C.exchangeDays || 5} day size exchange on full price pairs.</p>
        <div class="hero-cta"><a class="btn volt" href="${link('shop')}">Explore the collection <span class="arr">&rarr;</span></a><a class="btn ghost" href="${link('contract')}">Our promise</a></div>
      </div></div></section>`;
    cutWhenSeen(app);
  };

  /* ---- about ---- */
  const PHONE = () => { const n = String(C.whatsapp || ''); return n.startsWith('92') ? '0' + n.slice(2, 5) + ' ' + n.slice(5) : n; };
  V.about = function () {
    setMeta('About DAUR Supply | Pakistani Men\'s Shoe Brand, Dispatched from Islamabad', 'DAUR Supply is a Pakistani footwear brand for men: leather sneakers, formal shoes and chelsea boots from workshops in Lahore, Sialkot and Kasur, dispatched from Islamabad with free delivery across Pakistan.');
    const hero = prod('moc-runner-v1') || P[0], hv = hero.variants[0];
    const facts = [
      ['The brand', 'DAUR Supply', 'A Pakistani footwear brand for men, sold online at daursupply.com.'],
      ['The name', 'Daur, an era', 'From the Urdu word for an era. Our line is Aik naya daur, a new era.'],
      ['What we sell', 'Men\'s shoes', 'Leather sneakers, formal shoes, chelsea boots and casual slip ons, crafted in Pakistan.'],
      ['Made in', 'Lahore, Sialkot, Kasur', 'Finished pairs chosen from the workshops, then checked by hand, pair by pair.'],
      ['Dispatch', 'Islamabad', 'Every order leaves Islamabad within 24 hours of confirmation, with free delivery across Pakistan.'],
      C.advance.deposits() ? ['Payment', 'Deposit, then delivery', 'A small ' + C.advance.care + ' confirms your order and the rest is paid on arrival.'] : ['Payment', 'Cash on Delivery', 'To every city in Pakistan our couriers reach. Free delivery on ' + C.freeDeliveryPairs + ' pairs.'],
      ['After delivery', '5 day exchange', 'Full price pairs can be exchanged for size within 5 days, and manufacturing defects are covered for 30 days.']
    ];
    app.innerHTML = `<section class="phero"><div class="wrap"><span class="eyebrow">About DAUR Supply</span><h1>Named for<br>an era.</h1><p class="aside">Daur means an era in Urdu. Ours is Aik naya daur, a new era: Pakistani craft, worn with pride.</p></div></section>

    <section class="sheet x ab-intro" id="hero"><div class="hero-light"></div><div class="wrap ab-grid">
      <div class="ab-copy rv"><span class="eyebrow">Who we are</span>
        <p class="big">DAUR Supply is a Pakistani footwear brand for men. We select finished pairs from skilled workshops in Lahore, Sialkot and Kasur, check every one by hand and give it a distinctive DAUR finish.</p>
        <p>Thick matte black cotton laces, an engraved metal lace tag and the DAUR seal: that is how you know a pair is ours. The leather does the rest.</p>
        <div class="hero-cta"><a class="btn volt" href="${link('shop')}">Explore the collection <span class="arr">&rarr;</span></a><a class="btn ghost" href="${link('manifesto')}">Read our story</a></div></div>
      <div class="hero-stage ab-stage" id="stage" aria-label="${esc(hero.name)}, move over the pair to see its construction">
        <div class="layer float">${visual(hero, hv)}</div>
        <div class="layer bp">${visual(hero, hv, { mode: 'blueprint' })}</div>
        <div class="ring" data-label="X-RAY / THE CRAFT INSIDE"></div>
      </div>
    </div></section>

    <section class="sheet x"><div class="wrap ab-plain rv">
      <span class="eyebrow">In one line</span>
      <p class="ab-line">${facts.map(([k, v, d]) => d).join(' ')}</p>
    </div></section>

    <section class="sheet x"><div class="wrap"><div class="signup closer">
      <h2>Questions first? Talk to a real person.</h2>
      <div class="closer-r"><p>WhatsApp or call ${esc(PHONE())}, or email ${esc(C.supportEmail)}. We confirm every order with you before it ships.</p>
        <div class="hero-cta"><a class="btn volt" href="${waChat('Assalam o Alaikum DAUR Supply, I have a question.')}" target="_blank" rel="noopener">${ic('whatsapp')}Chat with DAUR</a><a class="btn ghost" href="${link('contact')}">All contact options</a></div></div>
    </div></div></section>`;
    bindLens($('#stage'), $('#hero'));
  };

  /* ---- contact ---- */
  V.contact = function () {
    setMeta('Contact DAUR Supply | WhatsApp, Phone and Email', 'Contact DAUR Supply on WhatsApp or phone ' + PHONE() + ', or email ' + C.supportEmail + '. Dispatched from Islamabad with free delivery across Pakistan.');
    const ch = [
      ['whatsapp', 'WhatsApp', PHONE(), 'The quickest way to reach us for sizing, orders and exchanges.', waChat('Assalam o Alaikum DAUR Supply, I have a question.'), true],
      ['phone', 'Call', PHONE(), 'Same number as WhatsApp.', 'tel:+' + C.whatsapp],
      ['mail', 'Email', C.supportEmail, 'For anything that needs photos or detail.', 'mailto:' + C.supportEmail],
      ['instagram', 'Instagram', '@daursupply', 'New pairs and fit checks. Message us any time.', 'https://www.instagram.com/daursupply'],
      ['facebook', 'Facebook', 'facebook.com/daursupply', 'Message us any time.', 'https://www.facebook.com/daursupply']
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
    app.innerHTML = `<section class="phero"><div class="wrap"><span class="eyebrow">Contact</span><h1>We are here to help<br>you find your fit.</h1><p class="aside">Questions about sizing, an order or a particular pair? Talk to a real person. We are happy to help, Monday to Saturday, 10 am to 7 pm.</p></div></section>

    <section class="sheet x"><div class="wrap ct-grid">
      <div class="ct-list">${ch.map(([i, k, v, d, href, main], n) => `<a class="ct-card rv${main ? ' main' : ''}" href="${href}"${/^https/.test(href) ? ' target="_blank" rel="noopener"' : ''} style="--d:${n * 0.06}s"><span class="ct-ic">${ic(i)}</span><span class="ct-k mono">${k}</span><b class="ct-v">${esc(v)}</b><span class="ct-d">${d}</span><span class="ct-go" aria-hidden="true">${ic('arrow')}</span></a>`).join('')}</div>
      <div class="ct-art">${polArt('contact')}</div>
    </div></section>

    <section class="sheet x"><div class="wrap">
      ${head('Already ordered?', 'Your answer may be one tap away.')}
      <div class="ct-help">${[['truck', 'Track your order', 'Where your pair is right now.', link('track')], ['swap', 'Exchanges and sizing', '5 day size exchange, 30 day defect cover, size guide.', link('contract')], ['shield', 'Policies', 'Delivery, ' + (C.advance.required ? 'payment' : 'Cash on Delivery') + ', returns and privacy.', link('policies')]].map(([i, t, d, h]) => `<a class="ct-help-i rv" href="${h}"><span class="ct-ic">${ic(i)}</span><b>${t}</b><span>${d}</span><span class="arr">&rarr;</span></a>`).join('')}</div>
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
        <p class="rw-note">${C.advance.freeAll() ? 'Free delivery anywhere in Pakistan, 5 day size exchange.' : 'Add a second pair and delivery is free anywhere in Pakistan. ' + (C.advance.required ? '' : 'Cash on Delivery, ') + '5 day size exchange.'}</p>`;
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
      if (C.advance.freeAll()) list.push({ id: 'free-delivery', title: 'Free delivery on every order', code: '', details: 'Delivery anywhere in Pakistan is free on every order. No code needed.' });
      else list.push({ id: 'free-delivery', title: 'Free delivery on ' + (C.freeDeliveryPairs === 2 ? 'two' : C.freeDeliveryPairs) + ' pairs', code: '', details: 'Order ' + C.freeDeliveryPairs + ' pairs or more and delivery anywhere in Pakistan is free. No code needed.', min: 0, ends: null, sort: 50 });
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
    app.innerHTML = `<section class="phero gv-hero"><div class="wrap"><span class="eyebrow">The Slice / at least ${GIVE.pct}% of profit</span><h1>A little good goes a long way.</h1>
      <p class="aside">Every pair we sell carries a share that is not ours to keep. We cut it from our profit, never from your price, and give it to people in need.</p>
      <button class="gv-loaf" type="button" data-recut aria-label="Play the cut again">${loaf(GIVE.pct + '%')}</button></div></section>

    <section class="sheet x"><div class="wrap">
      ${head('How it works', 'Same price. A slice set aside.')}
      <div class="steps gv-steps">${[['You buy a pair', 'At the same price as always. Nothing is added for charity.'], ['We cut the slice', `At least ${GIVE.pct}% of the profit we make on that pair, worked out on the price you finally pay, less the cost of the pair, packaging, delivery and payment fees.`], ['We give it every quarter', 'The slices are pooled and given each quarter, so the help is large enough to matter, to verified cases of need after our own checks.'], ['We publish it', 'Date, amount and the case appear on this page and on our social pages once each giving is made.']].map(([t, d], i) => `<div class="step rv"><span class="n">${String(i + 1).padStart(2, '0')}</span><h3>${t}</h3><p>${d}</p></div>`).join('')}</div>
    </div></section>

    ${quarterHTML()}

    ${pairsGivenHTML()}

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
  // pairs given on behalf of buyers (Content > Metaobjects > Giving round): totals and cities only, never names or faces
  function pairsGivenHTML() {
    const R = (Array.isArray(window.DAUR_GIVING_ROUNDS) ? window.DAUR_GIVING_ROUNDS : []).filter((r) => r && +r.pairs > 0).sort((a, b) => String(b.round).localeCompare(String(a.round)));
    const n = R.reduce((a, r) => a + Math.floor(+r.pairs), 0);
    if (!n) return '';
    const lab = (k) => { const m = String(k).match(/^(\d{4})-Q([1-4])$/); return m ? MONTHS[(m[2] - 1) * 3] + ' to ' + MONTHS[(m[2] - 1) * 3 + 2] + ' ' + m[1] : String(k); };
    return `<section class="sheet x"><div class="wrap">
      ${head('Pairs given / on behalf of our buyers', `${n} pair${n === 1 ? '' : 's'} handed over so far.`, '', 'Buyers pay for a pair on our Gifts page, and we hand it over in person to someone in need. Each buyer receives the proof privately; here we show totals only.')}
      <div class="gv-rec">${R.map((r) => `<article class="gv-item rv"><span class="mono mute">${esc(lab(r.round))}</span><b>${Math.floor(+r.pairs)} pair${+r.pairs === 1 ? '' : 's'}</b>${r.cities ? `<h3>${esc(r.cities)}</h3>` : ''}${r.note ? `<p>${esc(r.note)}</p>` : ''}</article>`).join('')}</div>
      <a class="link" href="${link('gifts')}#give">Give a pair</a>
    </div></section>`;
  }
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
      ${GIVE.causes.length > 1 ? `<div class="gv-vote"><h3>Buyers choose where it goes.</h3><p>Vote in your bag before checkout. The cause with the most votes from this quarter's buyers receives the slice. If causes tie, or no votes are cast, the slice is shared equally.</p>
        ${total ? `<ul class="gv-bars">${GIVE.causes.map((c) => { const v = +votes[c] || 0; const pc = Math.round(v / total * 100); return `<li><span>${esc(c)}</span><b>${pc}%</b><i style="--w:${pc}%"></i></li>`; }).join('')}</ul><p class="mono mute">${total} vote${total === 1 ? '' : 's'} so far</p>` : ''}
        ${votePicker()}</div>` : ''}
    </div></section>`;
  }
  V.offers = function () {
    setMeta('Offers and Discount Codes | DAUR Supply', 'Live DAUR Supply discount codes, ' + (C.advance.freeAll() ? 'free delivery on every order' : 'free delivery on two pairs') + ' and men\'s shoes on sale in Pakistan, with Cash on Delivery.');
    const offers = liveOffers();
    const sale = P.filter((p) => p.variants.some(onSale)).map((p) => [p, p.variants.find(onSale)]);
    const best = sale.length ? Math.max(...sale.map(([, v]) => pct(v))) : 0;
    const count = offers.length + (sale.length ? 1 : 0);
    const applyHref = (code) => SHOP ? '/discount/' + encodeURIComponent(code) + '?redirect=' + encodeURIComponent('/collections/all') : link('shop');
    const card = (o, i) => `<article class="of-card rv${o.code ? ' has-code' : ''}" style="--d:${i * 0.08}s">
        <span class="of-ic">${ic(o.code ? 'ticket' : 'truck')}</span>
        <span class="of-k">${o.code ? 'Code' : 'Automatic'}${o.min ? `<em>On ${fmt(o.min)} or more</em>` : ''}</span>
        <h3>${esc(o.title)}</h3>
        ${o.details ? `<p>${esc(o.details)}</p>` : ''}
        ${o.code ? `<div class="of-code"><button class="of-copy" type="button" data-code="${esc(o.code)}" aria-label="Copy code ${esc(o.code)}"><b>${esc(o.code)}</b><span class="mono">Copy</span></button>
          <a class="btn volt" href="${applyHref(o.code)}">${SHOP ? 'Apply and shop' : 'Find your pair'} <span class="arr">&rarr;</span></a></div>` : `<a class="btn ghost" href="${link('shop')}">Shop the collection <span class="arr">&rarr;</span></a>`}
        ${o.ends ? `<span class="of-end mono" data-ends="${esc(o.ends)}">${untilText(o.ends)}</span>` : ''}
        <i class="of-notch l" aria-hidden="true"></i><i class="of-notch r" aria-hidden="true"></i>
      </article>`;
    app.innerHTML = `<section class="phero of-hero"><div class="wrap"><span class="eyebrow">${count} live</span><h1>Current offers.</h1><p class="aside">Every code and offer live in our store today. A pair you save on keeps the same checks, finish and seal as every other. ${C.advance.required ? (C.advance.freeAll() ? 'Free delivery across Pakistan.' : '') : 'Cash on Delivery on every order.'}</p></div>
      <div class="of-float" aria-hidden="true">${['%', 'Rs', '%', 'Rs', '%'].map((t, i) => `<span style="--i:${i}">${t}</span>`).join('')}</div></section>

    <section class="sheet x"><div class="wrap">
      ${head('Codes and deals', offers.length ? 'Use it at checkout.' : 'No codes right now.', '', offers.length ? (C.advance.freeAll() ? 'One code per order, and delivery stays free on every order.' : 'One saving applies per order: codes and free delivery do not stack, so the bigger saving is the one you get.') : 'There is no live code at the moment. Sale pairs below are already reduced, no code needed.')}
      ${offers.length ? `<div class="of-grid">${offers.map(card).join('')}</div>` : ''}
    </div></section>

    ${sale.length ? `<section class="sheet x"><div class="wrap">
      ${head('On sale now', 'Already reduced.', `<a class="link" href="${link('shop', 'sale')}">All sale pairs</a>`, 'No code needed: the price you see is the price you pay. Sale pairs are offered at their marked price without size exchange, and each keeps its 30 day defect cover.')}
      <div class="grid">${sale.map(([p, v], i) => card_(p, i, v)).join('')}</div>
    </div></section>` : ''}

    <section class="sheet x"><div class="wrap">
      ${head('How it works', 'Three steps to your saving.')}
      <div class="steps of-steps">${[['Pick your pairs', C.advance.freeAll() ? 'Add your size to the bag. Delivery is free on every order.' : 'Add your size to the bag. Two pairs or more and delivery is free.'], ['Use the code', 'Tap Apply and shop, or type the code at checkout. One saving per order.'], C.advance.required ? ['Reserve your pair', 'A small ' + C.advance.care + ' confirms your order. Your pair leaves Islamabad and the rest is paid when it arrives.'] : ['Pay on delivery', 'We confirm your order with you, dispatch from Islamabad, and you pay in cash at your door.']].map(([t, d], i) => `<div class="step rv"><span class="n">${String(i + 1).padStart(2, '0')}</span><h3>${t}</h3><p>${d}</p></div>`).join('')}</div>
    </div></section>

    <section class="sheet x"><div class="wrap"><div class="signup closer">
      <h2>Be first to the next code.</h2>
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
    app.innerHTML = `<section class="phero nf-hero"><div class="wrap"><span class="eyebrow">404 / Page not found</span><h1>Off the<br>map.</h1><p class="aside">This page has moved on, but every pair is still here.</p></div>
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
      n.textContent = v ? (hits.length ? `${hits.length} pair${hits.length === 1 ? '' : 's'} match "${v}"` : `No pair matches "${v}". Here is the collection instead.`) : 'A few pairs to start with';
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
      ${!ps.length && terms ? `<p class="nf-note mono mute">A few pairs to start with</p><div class="grid nf-grid">${P.slice(0, 4).map((p, i) => card(p, i)).join('')}</div>` : ''}
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
    if (kind === 'contact') return `<figure class="pa pa-con" aria-hidden="true">${map([['Wherever you are', 52, 52]])}<span class="pa-chat">${ic('whatsapp')}<i></i><i></i><i></i></span><figcaption>Chat with DAUR</figcaption></figure>`;
    return '';
  }
  V.policies = function (param) {
    setMeta('Shipping, Exchange, Return and Privacy Policies | DAUR Supply', 'DAUR Supply shipping, cancellation, exchange, return, claim and privacy policies, the men\'s size guide and our terms of service for orders across Pakistan.');
    const mail = `<a class="link" href="mailto:${esc(C.supportEmail)}">${esc(C.supportEmail)}</a>`;
    const wa = `<a class="link" target="_blank" rel="noopener" href="https://wa.me/${esc(C.whatsapp)}">WhatsApp</a>`;
    const phone = '+' + String(C.whatsapp).replace(/^92(\d{3})(\d+)$/, '92 $1 $2');
    const tel = `<a class="link" href="tel:+${esc(C.whatsapp)}">${esc(phone)}</a>`;
    const ex = C.exchangeDays || 5, A = C.advance || {};
    const S = [
      ['shipping', 'Shipping policy', `<p><b>Your DAUR pair, on its way.</b> ${A.freeAll() ? 'We offer complimentary delivery across Pakistan. ' : ''}Once your order is confirmed${A.required ? ' and the ' + esc(A.care) + ' has arrived' : ''}, we prepare your pair for dispatch from Islamabad.</p><ul>
        <li><b>Where.</b> We deliver to every city and town in Pakistan that our courier partners reach. Orders are dispatched from Islamabad.</li>
        <li><b>Confirmation.</b> We confirm every order with you by call or WhatsApp.</li>
        <li><b>Dispatch.</b> Your pair is checked, sealed and handed to the courier within 24 hours of confirmation. Orders confirmed on a Sunday or public holiday leave on the next working day.</li>
        <li><b>Delivery time.</b> Delivery takes ${esc(C.delivery.days || '2 to 5 days')} after dispatch in most cities. Remote areas, weather and public holidays can take a little longer.</li>
        <li><b>Delivery fee.</b> ${A.freeAll() ? 'Delivery is free on every order, to any city our courier reaches.' : `One flat fee of ${fmt(C.delivery.fee)} for any city. Delivery is free on ${C.freeDeliveryPairs} pairs or more${A.on ? ', and free on any order you pay for in advance' : ''}.`}</li>
        ${A.on ? `<li><b>${A.required ? 'Payment before dispatch' : 'Free delivery on advance payment'}.</b> ${A.required ? `A small ${esc(A.care)} by bank transfer confirms your order, and the remaining balance is paid on arrival.` : `Pay the full amount in advance, or a ${esc(A.care)} of ${fmt(A.deposit)} or more, and delivery is free.`} See <a class="link" href="#advance" data-jump="advance">how it works</a>.</li>` : ''}
        <li><b>One saving per order.</b> ${A.freeAll() ? 'One discount code per order. Delivery stays free.' : 'Free delivery and a discount code do not combine. The saving that is bigger for you applies.'}</li>
        <li><b>Tracking.</b> At dispatch you receive the courier name, tracking number and tracking link on WhatsApp. They also show on the <a class="link" href="${link('track')}">Track order</a> page.</li></ul>`],
      ...(A.on && A.required ? [['advance', 'Advance payment and ' + A.care, `<p><b>Your pair, reserved for you.</b> We keep ordering simple. A small ${esc(A.care)} confirms your order and reserves your pair. It counts towards your purchase, and you pay the remaining balance when your order arrives.</p>
        <div class="size-wrap"><table class="size-table care-t"><thead><tr><th>Your order</th><th>Paid today</th></tr></thead><tbody><tr><td>One pair for you</td><td><b>${fmt(A.one)}</b></td></tr><tr><td>Two or more pairs for you</td><td><b>${fmt(A.more)}</b></td></tr><tr><td>Gifts and Philanthropy pairs</td><td><b>Their full price</b></td></tr></tbody></table></div><ol>
        <li>Place your order and choose bank transfer at checkout. Your bag shows the exact ${esc(A.care)} for your order.</li>
        <li>Send the ${esc(A.care)}, or the full amount if you prefer, to the bank account shown when you order. We also share the details on WhatsApp.</li>
        <li>Send us your payment receipt on ${wa} with your order number.</li>
        <li>We confirm the payment and email your updated order, showing what you have paid and the balance due on arrival. Then we prepare your pair for dispatch.</li></ol>
        <ul><li>Your pair is dispatched once the ${esc(A.care)} reaches us, and we will remind you on WhatsApp if it has not arrived.</li>
        <li>If you cancel before dispatch, your ${esc(A.care)} or advance payment is refunded in full to the account you paid from, within 3 working days.</li></ul>`]] : A.on ? [['advance', 'Advance payment and ' + A.care, `<p>Delivery is free when you pay for your order in advance. You can pay the full amount, or a smaller ${esc(A.care)} of ${fmt(A.deposit)} or more that reserves your pair. The ${esc(A.care)} is part of your payment: it comes off the amount you pay the rider.</p><ol>
        <li>Place your order${A.code ? ` and enter code <b>${esc(A.code)}</b> at checkout` : ''}.</li>
        <li>Pay the full amount, or a ${esc(A.care)} of ${fmt(A.deposit)} or more, to the bank account shown when you place the order. We also send the details on WhatsApp.</li>
        <li>Send us your payment receipt on ${wa} with your order number.</li>
        <li>We check the payment, take the delivery fee off your order and send you an updated email showing what you have paid and anything left to pay the rider.</li></ol>
        <ul><li>If no payment reaches us, the order stays Cash on Delivery with the normal delivery fee, and we tell you before dispatch.</li>
        <li>If you cancel before dispatch, your advance payment or ${esc(A.care)} is refunded in full to the account you paid from, within 3 working days.</li>
        <li>Free delivery and a discount code do not combine. The saving that is bigger for you applies.</li></ul>`]] : []),
      ['cancellation', 'Cancellation policy', `<p><b>Changed your mind? That is fine.</b> You can cancel any order free of charge until it is handed to the courier. Reply to your confirmation on ${wa} or call ${tel} with your order number.</p><ul>
        <li><b>Paid in advance.</b> If you sent a ${esc(A.care)} or paid in full and cancel before dispatch, we refund it in full to the account you paid from, within 3 working days.</li>
        <li><b>After dispatch.</b> Once your pair is on its way, it has entered the delivery process. If you need help with the order, contact us and our team will guide you; our <a class="link" href="#exchange" data-jump="exchange">exchange</a> and <a class="link" href="#claims" data-jump="claims">claim</a> policies apply once it is delivered.</li>
        <li><b>${A.required ? 'At delivery' : 'Refusing a parcel'}.</b> ${A.required ? 'If something about a confirmed order has changed, please message us before the rider arrives, so we can help without a return journey for the parcel.' : 'Please do not refuse a confirmed Cash on Delivery parcel at the door. It costs two courier legs, and repeat refusals lose access to Cash on Delivery.'}</li>
        <li><b>If we need to cancel.</b> On rare occasions, such as a size selling out or a price shown in error, we may need to cancel an order. We will tell you straight away, and any payment is refunded in full.</li></ul>`],
      ['exchange', 'Exchange policy', `<p><b>The right fit matters.</b> We want you to enjoy wearing your pair. If the size is not quite right, our team will guide you through the exchange.</p><ul>
        <li><b>Within ${ex} days.</b> Message us within ${ex} days of delivery with your order number.</li>
        <li><b>Condition.</b> The pair should be unworn outside, in its original box, with the Supply Unit seal attached.</li>
        <li><b>Sending it back.</b> We share our return address on WhatsApp, and you send the pair with the courier of your choice. The return courier for a size exchange is arranged at the customer's cost. We check the pair within 1 working day of its arrival and dispatch your new size within 24 hours.</li>
        <li><b>If your size is sold out.</b> We refund the item price to your bank account or mobile wallet within 3 working days.</li>
        <li><b>Sale pairs.</b> Our reduced price pairs are offered at their marked price, so size exchanges are not available on sale purchases. Product quality claims remain covered under our <a class="link" href="#claims" data-jump="claims">claim policy</a>.</li></ul>`],
      ['returns', 'Return and exchange', `<p><b>Help, whatever the reason.</b> A short overview; the full detail is in the exchange and claim policies.</p><ul>
        <li><b>A different size.</b> See our <a class="link" href="#exchange" data-jump="exchange">exchange policy</a>: ${ex} days from delivery, unworn, with the seal attached.</li>
        <li><b>A wrong or damaged pair.</b> Tell us within 48 hours of delivery with photos, and we will send the right pair. When the mistake is ours, so is the return courier.</li>
        <li><b>A manufacturing defect.</b> Covered for 30 days from delivery under our <a class="link" href="#claims" data-jump="claims">claim policy</a>. Send photos on ${wa}.</li>
        <li><b>Refunds.</b> When a refund is due, we pay the item price to your bank account or mobile wallet within 3 working days of the returned pair reaching us and passing its check.</li>
        <li><b>What is not covered.</b> Everyday wear, scuffs, water or accidental damage, pairs worn outside, pairs without their seal, and returns of pairs that fit well and have no fault.</li></ul>`],
      ['claims', 'Claim policy', `<p><b>We will make it right.</b> If something arrives differently from what you ordered, or your pair has a covered manufacturing issue, please contact us. We will review it and help resolve it.</p><ul>
        <li><b>What is covered.</b> A wrong pair, a pair damaged in transit, a missing item, or a stitching or sole defect within 30 days of delivery.</li>
        <li><b>When to tell us.</b> Wrong, damaged or missing items within 48 hours of delivery; manufacturing defects within 30 days.</li>
        <li><b>What to send.</b> Your order number and clear photos of the pair, the box and the courier label. An unboxing video is helpful where you have one. Send them on ${wa}, by phone at ${tel} or by email to ${mail}.</li>
        <li><b>What happens next.</b> We reply within 1 working day and, if needed, arrange for the pair to come back. When the mistake is ours, we cover the return courier. We then replace the pair, or refund it if a replacement is not available. If the courier lost or damaged the parcel, we take it up with them ourselves.</li>
        <li><b>Not covered.</b> Everyday wear, scuffs, water or accidental damage, and claims made after the time limits above.</li></ul>`],
      ['sizes', 'Size guide', `<p><b>Find your fit.</b> Men's sizes. Find your EU size by the length of your foot.</p>${sizeTable()}
        <h3>Measurement instructions</h3><p>To find your correct DAUR size, follow these simple steps:</p>
        <ol><li>Place a sheet of paper on a flat floor and stand on it with your heel against a wall.</li><li>Mark the tip of your longest toe.</li><li>Measure from the heel to the mark in centimetres.</li><li>Choose the closest length in the chart. Between sizes, the larger one is usually more comfortable.</li></ol>
        <p>Measurements are a guide. Not sure? Message us on ${wa} or call ${tel} and we will help you choose. Full price pairs can be exchanged for size within ${ex} days of delivery, as per our <a class="link" href="#exchange" data-jump="exchange">exchange policy</a>.</p>`],
      A.on && A.required ? ['cod', 'Paying the rest on delivery', `<p><b>Simple on arrival.</b></p><ul><li>After your ${esc(A.care)}, you pay the remaining balance to the rider when your parcel arrives; your updated order email shows the exact amount.</li><li>Gifts and Philanthropy pairs are paid in full when you order, so there is nothing to pay on arrival for them.</li><li>Most couriers do not allow a parcel to be opened before payment, so we suggest recording a short unboxing video; if anything is not right, our claim policy applies.</li></ul>`] : ['cod', 'Cash on Delivery', `<ul><li>Pay the rider in cash when the parcel is delivered. No card is needed and there is no Cash on Delivery surcharge.</li>${A.on ? `<li>Prefer to pay first? Pay in full or send a ${esc(A.care)} of ${fmt(A.deposit)} or more and delivery is free. The deposit comes off what you pay the rider.</li>` : ''}<li>Please keep the exact amount shown on your confirmation ready for the rider.</li><li>Most couriers do not allow a parcel to be opened before payment. Record an unboxing video; if anything is wrong, our claim policy applies.</li></ul>`],
      ['privacy', 'Privacy policy', `<p>We collect only what is needed to deliver your order and to answer you when you write to us.</p><ul>
        <li><b>What we collect.</b> Your name, mobile number, delivery address, city and, if you give it, your email address. If you pay in advance, the name and reference on your payment. Fit notes keep the name, city and photo you chose to share.</li>
        <li><b>Why.</b> To confirm and deliver orders, check payments, handle exchanges, claims and refunds, and answer your questions.</li>
        <li><b>Who we share it with.</b> ${SHOP ? 'Our store runs on Shopify, which holds order details on our behalf. Apart from Shopify, only' : 'Only'} the courier delivering your parcel receives your name, number and address. We never sell or rent your details.</li>
        <li><b>WhatsApp messages.</b> We message you only about your order, or in reply to a message you sent us. Reply STOP at any time and we will stop messaging you.</li>
        <li><b>Stored on your device.</b> Your bag, liked pairs and recent orders are saved in your own browser so they survive a refresh. Clearing your browser data removes them. ${SHOP ? 'Shopify sets the cookies the bag and checkout need, and basic store analytics.' : 'We do not use advertising trackers.'}</li>
        <li><b>Your choices.</b> Ask us to show, correct or delete the details we hold about you on ${wa} or at ${mail}.</li></ul>`],
      ['terms', 'Terms of service', `<p>These terms apply to every order placed on this website. By placing an order you agree to them.</p><ul>
        <li><b>Who we are.</b> DAUR Supply is the trading name of this online store, a Pakistani footwear brand. Our shoes are made by independent workshops in Pakistan, checked by our team and finished with DAUR hardware. We do not sell products of other brands and never present our pairs as theirs.</li>
        <li><b>Orders.</b> An order is a request to buy. It becomes a contract once we confirm it with you by phone call or WhatsApp. We may decline or cancel an order if stock runs out, the price shown was clearly wrong, the details cannot be confirmed, or the order looks fraudulent. If that happens you pay nothing.</li>
        <li><b>Prices.</b> All prices are in Pakistani rupees and include our packaging and hardware, and any tax that applies. Delivery is free on every order. The price you pay is the total on your confirmation.</li>
        <li><b>Product details.</b> We describe and picture every pair as accurately as we can. Leather is natural, so small differences in grain and shade from one pair to the next are normal and are not defects.</li>
        <li><b>Codes and offers.</b> ${A.freeAll() ? 'One discount code applies per order, and delivery stays free.' : 'One saving applies per order: either free delivery or one discount code, whichever saves you more.'} Gift offers are added on top. Personal codes work only for the pairs and WhatsApp number they were issued for, and only until their end date. Codes have no cash value.</li>
        <li><b>Payment.</b> ${A.on && A.required ? 'Every order starts with a ' + esc(A.care) + ', or the full amount, by bank transfer to the account we share. The remaining balance is paid to the courier rider on delivery. Gifts and Philanthropy pairs are paid in full in advance.' : `Pay in cash to the courier rider on delivery${A.on ? ', or in advance, in full or as a ' + esc(A.care) + ', by bank transfer to the account we share' : ''}. Customers who repeatedly refuse confirmed parcels without a reason may lose access to Cash on Delivery.`}</li>
        <li><b>Reviews and content.</b> Fit notes and photos you submit must be your own and honest. We read every note before it is published and may decline ones that are abusive, off topic or not about the product.</li>
        <li><b>Liability.</b> Our responsibility for an order is limited to the amount paid for it. Nothing in these terms removes rights you have under the consumer protection laws of Pakistan.</li>
        <li><b>Law.</b> These terms are governed by the laws of Pakistan.</li></ul>`],
      ['contact', 'Contact', `<p>Questions about an order, these policies or your data: ${wa} or call ${tel}, or email ${mail}. Please include your order number.</p>`]
    ];
    app.innerHTML = `<section class="phero x-phero"><div class="wrap"><h1>Policies</h1><p class="aside">Everything about delivery, payment, exchanges and claims, written clearly so you can order with confidence. Last updated 6 November 2026.</p></div></section>
      <div class="wrap"><div class="terms">
        <nav>${S.map(([id, t]) => `<a href="#${id}" data-jump="${id}">${t}</a>`).join('')}</nav>
        <div class="body">${S.map(([id, t, body]) => `<section class="clause" id="${id}"><div class="c policy"><h2>${t}</h2>${body}</div></section>`).join('')}</div></div></div>`;
    const go = param === 'refunds' ? 'returns' : param;
    if (go) { const t = document.getElementById(go); if (t) setTimeout(() => t.scrollIntoView(), 30); }
  };

  /* ---- contract ---- */
  V.contract = function (param) {
    setMeta(C.advance.required ? 'Our Promise: Delivery, Payment & Exchanges | DAUR Supply' : 'Our Promise: Delivery, Cash on Delivery & Exchanges | DAUR Supply', (C.advance.required ? 'Free delivery to every city in Pakistan, a small Care deposit' : 'Delivery to every city in Pakistan, Cash on Delivery') + ', dispatch within 24 hours, 5 day size exchanges, 30 day defect cover and the EU to UK shoe size guide.');
    const faq = [
      ['Is DAUR a brand?', 'Yes. DAUR Supply is a Pakistani footwear brand. We select finished pairs from workshops in Pakistan, check each one and finish it with DAUR details: matte cotton laces, the engraved dubrae and the Supply Unit seal. We do not sell products of other brands.'],
      ['Are the shoes real leather?', 'Each product page lists the upper, lining and sole of that pair. Our formal shoes and chelsea boots have leather uppers, and sneakers list their leather, suede or mesh parts.'],
      ['Can I open the parcel before paying?', 'Most couriers do not allow a parcel to be opened before payment. We suggest recording a short unboxing video; if anything is not right, send it to us on WhatsApp and we will help under our claim policy.'],
      ['How do I pick my size?', 'Stand on a sheet of paper, mark your heel and longest toe, and measure the distance in centimetres. Match it to the size guide; between sizes, the larger one is usually more comfortable. Not sure? Message us and we will help.'],
      ['I am buying for someone else. How do I choose the size?', 'Look inside a pair he wears now; the EU size is usually printed on the tongue or under the insole, so choose the same. If it needs changing, a full price pair can be exchanged within ' + (C.exchangeDays || 5) + ' days, unworn with the seal attached. We are happy to help you choose on WhatsApp.'],
      ['Can I send a pair to someone else\'s address?', 'Yes. Enter their name, number and address at checkout. ' + (C.advance.deposits() ? 'You send the ' + C.advance.care + ' and the person receiving the parcel pays the remaining balance, so do let them know the amount. To send it fully paid, mark it as a gift in your bag.' : 'If the order is Cash on Delivery, the person who receives the parcel pays the rider, so please let them know the amount first. To send it fully paid, pay in advance and delivery is free.')],
      ['Do you deliver to my city?', 'Yes. We deliver ' + (C.advance.freeAll() ? 'free ' : '') + 'to every city and town in Pakistan that our courier reaches, usually in ' + C.delivery.days + (C.advance.freeAll() ? '.' : ', for ' + fmt(C.delivery.fee) + ', or free on ' + C.freeDeliveryPairs + ' pairs or more.')],
      ['How long does delivery take?', 'Your pair is dispatched within 24 hours of confirmation and usually arrives in ' + C.delivery.days + '. Remote areas and public holidays can take a little longer.'],
      ...(GIVE.on ? [['Where does the 5% go?', 'At least ' + GIVE.pct + '% of the profit we make on every pair is set aside, never added to your price. Every quarter we give it to one verified case of need, chosen by the votes of that quarter\'s buyers, and publish the record on the Our giving page.']] : []),
      ...(C.advance.deposits() ? [['How does payment work?', 'A small ' + C.advance.care + ' by bank transfer confirms your order: ' + C.advance.tierText() + ' It counts towards your price, the rest is paid when your pair arrives, and it is refunded in full if you cancel before dispatch. ' + C.advance.freeText()], ['What does the ' + C.advance.care + ' do for me?', 'It reserves your size from the moment you order and lets us prepare your pair straight away. It is part of your price, never an extra.']] : C.advance.on ? [['Is delivery free if I pay in advance?', 'Yes. Pay the full amount, or a ' + C.advance.care + ' of ' + fmt(C.advance.deposit) + ' or more, by bank transfer' + (C.advance.code ? ' and enter code ' + C.advance.code + ' at checkout' : '') + '. Send us the receipt on WhatsApp; we check it, take the delivery fee off and email you the updated order. The deposit comes off what you pay the rider.'], ['What is the ' + C.advance.care + '?', 'A small payment of ' + fmt(C.advance.deposit) + ' or more that you send before dispatch. It is part of your payment, not an extra charge, and it is refunded in full if you cancel before dispatch.']] : []),
      ['Can I cancel my order?', 'Yes, free of charge until your pair is handed to the courier. Reply to your confirmation on WhatsApp or call us with your order number.'],
      ['How do I use a coupon code?', C.advance.freeAll() ? 'Enter it in the bag and it goes to checkout already applied. One code per order, and delivery stays free. Gift offers are added on top.' : 'Enter it in the bag or at checkout. One saving applies per order: free delivery or your code, whichever saves you more. Gift offers are added on top.']
    ];
    app.innerHTML = `<section class="phero"><div class="wrap"><span class="eyebrow">Our promise</span><h1>The details you can count on.</h1><p class="aside">Everything we promise with every pair, in one place. If anything falls short, message us and we will make it right.</p></div></section>
      <div class="wrap"><div class="terms">
        <nav><a href="#dispatch" data-jump="dispatch">01 Dispatch</a><a href="#delivery" data-jump="delivery">02 Delivery</a><a href="#cod" data-jump="cod">03 ${C.advance.deposits() ? 'Payment' : 'Cash on Delivery'}</a><a href="#exchanges" data-jump="exchanges">04 Exchanges</a><a href="#defects" data-jump="defects">05 Defects</a>${GIVE.on ? '<a href="#slice" data-jump="slice">06 The slice</a>' : ''}<a href="#sizing" data-jump="sizing">${GIVE.on ? '07' : '06'} Size guide</a><a href="#faq" data-jump="faq">${GIVE.on ? '08' : '07'} FAQ</a></nav>
        <div class="body">
          <section class="clause" id="dispatch"><span class="no">01 / Dispatch</span><div class="c"><h2>Confirmed with you, then on its way.</h2><p>We confirm every order with you by call or WhatsApp. Once it is confirmed${C.advance.required ? ' and your ' + esc(C.advance.care) + ' has arrived' : ''}, your pair is checked, laced, sealed and handed to the courier within 24 hours. Orders confirmed on a Sunday or public holiday leave on the next working day.</p></div></section>
          <section class="clause" id="delivery"><span class="no">02 / Delivery</span><div class="c"><h2>${C.advance.freeAll() ? 'Complimentary delivery to every city.' : 'Every city in Pakistan. One flat fee.'}</h2>
            <div class="city-grid"><div><b>Where</b><span>Every city and town our courier reaches</span></div><div><b>How long</b><span>${C.delivery.days} after dispatch</span></div><div><b>Fee</b><span>${C.advance.freeAll() ? 'Free on every order' : `${fmt(C.delivery.fee)} / free on ${C.freeDeliveryPairs}+ pairs`}</span></div></div>
            <p>At dispatch, your courier name, tracking number and tracking link arrive on WhatsApp. You can also follow your order from the <a class="link" href="${link('track')}">Track order</a> page.</p></div></section>
          <section class="clause" id="cod"><span class="no">03 / ${C.advance.deposits() ? 'Payment' : 'Cash on Delivery'}</span><div class="c">${C.advance.deposits() ? `<h2>Your pair, reserved for you.</h2><ul><li>A small ${esc(C.advance.care)} by bank transfer confirms your order: ${esc(C.advance.tierText())}</li><li>It is part of your price, not an extra charge. You pay the remaining balance when your order arrives${C.advance.freeAll() ? ', and delivery is free' : ''}.</li><li>Gifts and Philanthropy pairs are covered in full when you order, so the person receiving them has nothing to pay.</li><li>If you cancel before dispatch, your deposit or advance payment is refunded in full. <a class="link" href="${link('policies', 'advance')}">How it works</a></li><li>If you will not be available on the day, reply to your WhatsApp confirmation and we will reschedule.</li></ul>` : `<h2>Pay when the box is in your hands.</h2><ul><li>No card needed and there is no COD surcharge. Advance payment is never required.</li>${C.advance.on ? `<li>Prefer to pay first? Pay in full, or send a ${esc(C.advance.care)} of ${fmt(C.advance.deposit)} or more, and delivery is free. <a class="link" href="${link('policies', 'advance')}">How it works</a></li>` : ''}<li>Pay the rider the exact total shown on your confirmation.</li><li>If you will not be available, reply to the WhatsApp confirmation and we will reschedule.</li><li>Refusing a confirmed parcel without a reason costs us two courier legs. Repeat refusals lose COD access.</li></ul>`}</div></section>
          <section class="clause" id="exchanges"><span class="no">04 / Exchanges</span><div class="c"><h2>The right fit matters.</h2><ul><li>If the size is not quite right, message us within 5 days of delivery with your order number and we will guide you through the exchange.</li><li>Please keep the pair unworn outside, in its original box, with the Supply Unit seal attached.</li><li>We share our return address on WhatsApp and you send the pair with the courier of your choice; the return courier for a size exchange is arranged at the customer's cost. We check the pair within 1 working day of its arrival and dispatch your new size within 24 hours.</li><li>If your size is sold out, we refund the item price to your bank or wallet account within 3 working days.</li><li>Our reduced price pairs are offered at their marked price, so size exchanges are not available on sale purchases. Product quality claims remain covered under our claim policy.</li></ul></div></section>
          <section class="clause" id="defects"><span class="no">05 / Defects</span><div class="c"><h2>We will make it right.</h2><p>If stitching opens or a sole separates in normal wear within 30 days of delivery, send us photos on WhatsApp. We will replace the pair, or refund it if a replacement is not available. Everyday wear, scuffs and accidental damage are not manufacturing defects.</p></div></section>
          ${GIVE.on ? `<section class="clause" id="slice"><span class="no">06 / The slice</span><div class="c"><h2>A slice of every pair is not ours to keep.</h2><ul><li>At least ${GIVE.pct}% of the profit we make on every pair is set aside for people in need. It is a share of our profit, never added to your price.</li><li>Every quarter the slices are given together to one verified case of need, after our own checks.</li><li>Buyers vote in the bag for the cause. The most chosen cause receives the quarter's slice. If causes tie, or no votes are cast, the slice is shared equally.</li><li>Date, amount and the case are published on <a class="link" href="${link('giving')}">Our giving</a> and on our social pages, and every buyer of the quarter is told where it went.</li></ul></div></section>` : ''}
          <section class="clause" id="sizing"><span class="no">${GIVE.on ? '07' : '06'} / Size guide</span><div class="c"><h2>Measure, then match.</h2>${sizeTable()}<p>Stand on a sheet of paper, mark your heel and the tip of your longest toe, and measure the distance in centimetres. Choose the closest length in the chart. Between sizes, the larger one is usually more comfortable. Not sure? Message us and we will help you choose. <a class="link" href="${link('policies', 'sizes')}">Full size guide</a></p></div></section>
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
    delete app.dataset.full;
    (V[page] || V.home)(param);
    hook('after', { page, param });
    markNav(page, param);
    reveal();
    if (!(page === 'contract' && param)) window.scrollTo(0, 0);
  }
  window.DAUR_API = { C, P, ALL, SPA, SHOP, absLink, totals, get cart() { return cart; }, get coupon() { return coupon; }, $, $$, esc, fmt, store, link, prod, variant, stockOf, onSale, pct, minPrice, visual, setMeta, head, card, bindCards, toast, openModal, addToCart, toggleWish, reveal, current, get wish() { return wish; },
    // draws another storefront view into #app without a page load (the phone app layer uses it to open pages instantly)
    draw(page, param) { if (!V[page] || /^(list|runway)$/.test(page)) return false; document.body.dataset.page = page; delete app.dataset.full; V[page](param || ''); hook('after', { page, param: param || '' }); return true; } };
  const EXT = window.DAUR_EXT || { views: {}, hooks: {} };
  Object.assign(V, EXT.views);
  const hook = (name, arg) => (EXT.hooks[name] || []).forEach((fn) => fn(arg));
  chrome();
  route();
  // the next page starts loading the moment a finger touches a link or a mouse rests on it, so it opens almost at once
  (function prefetch() {
    const seen = new Set(), slow = navigator.connection && (navigator.connection.saveData || /2g/.test(navigator.connection.effectiveType || ''));
    const go = (e) => {
      const a = e.target.closest && e.target.closest('a[href]'); if (!a || slow) return;
      const u = new URL(a.href, location.href);
      if (u.origin !== location.origin || u.hash && u.pathname === location.pathname || /\/(cart|checkout|account|checkouts)\b/.test(u.pathname) || a.target === '_blank') return;
      const k = u.pathname + u.search; if (seen.has(k) || seen.size > 40) return; seen.add(k);
      const l = document.createElement('link'); l.rel = 'prefetch'; l.href = k; document.head.appendChild(l);
    };
    document.addEventListener('pointerover', (e) => { if (e.pointerType === 'mouse') { clearTimeout(go.t); go.t = setTimeout(() => go(e), 80); } }, { passive: true });
    document.addEventListener('touchstart', go, { passive: true });
  })();
  // cookies: the bag, liked pairs and choices are kept on this phone so every visit picks up where it stopped.
  // The first visit asks once; the answer is remembered and passed to Shopify's own consent record.
  (function cookies() {
    if (store.get('consent', '')) return;
    const ask = () => {
      document.body.insertAdjacentHTML('beforeend', `<div class="ck" id="ck" role="dialog" aria-live="polite" aria-label="Cookies"><div class="ck-t"><b>Faster on every visit.</b> We use cookies to keep your bag and liked pairs ready, remember your choices and learn which pages help shoppers most. <a href="${link('policies', 'privacy')}">Privacy policy</a></div><div class="ck-b"><button type="button" class="btn volt" data-ck="all">Accept all</button><button type="button" class="btn ghost" data-ck="ess">Essential only</button></div></div>`);
      const box = $('#ck');
      requestAnimationFrame(() => box.classList.add('on'));
      box.addEventListener('click', (e) => {
        const b = e.target.closest('[data-ck]'); if (!b) return;
        const all = b.dataset.ck === 'all';
        store.set('consent', all ? 'all' : 'essential');
        const set = () => { try { window.Shopify.customerPrivacy.setTrackingConsent({ analytics: all, marketing: all, preferences: true, sale_of_data: false }, () => {}); } catch (err) { /* consent API not on this page */ } };
        if (window.Shopify && window.Shopify.customerPrivacy) set();
        else if (window.Shopify && window.Shopify.loadFeatures) window.Shopify.loadFeatures([{ name: 'consent-tracking-api', version: '0.1' }], (err) => { if (!err) set(); });
        box.classList.remove('on'); setTimeout(() => box.remove(), 400);
      });
    };
    // asked after the page is showing, so it never holds up the first screen
    setTimeout(() => (window.requestIdleCallback ? requestIdleCallback(ask, { timeout: 4000 }) : ask()), 2500);
  })();
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
