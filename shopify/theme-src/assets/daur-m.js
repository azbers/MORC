/* DAUR mobile app layer.
   On screens up to 900px wide the store opens as an app: its own top bar, bottom tab bar, cards, product page, bag
   and an app design for every other page. It reads the same catalog and the same bag as the desktop storefront
   (window.DAUR_API), so nothing is kept twice. Desktop is never touched: everything here starts only when html.m-on
   is set by the head script. */
(function () {
  'use strict';
  const H = document.documentElement;
  if (!H.classList.contains('m-on')) return;
  const API = window.DAUR_API, M = window.DAUR_M || {};
  if (!API) { H.classList.remove('m-on'); return; }
  const C = API.C, esc = API.esc, fmt = API.fmt, store = API.store;
  const S = window.DAUR_SHOPIFY || { routes: {} };
  const root = (S.routes.root || '/').replace(/\/$/, '');
  const asset = (f) => (M.assets || '') + f;
  const NF = (n) => new Intl.NumberFormat('en-US').format(Math.round(n));
  const txt = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');
  // text with a space between child elements, so "<b>01</b>Why" reads "01 Why"
  const txtS = (el) => (el ? [...el.childNodes].map((n) => n.textContent.replace(/\s+/g, ' ').trim()).filter(Boolean).join(' ') : '');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- test cutouts: free Unsplash photos with the background removed, matched to each pair ---------- */
  const CUT = {
    'moc-runner-v1': { 'triple-black': 'moc-runner', oxblood: 'moc-oxblood' },
    'phantom-trainer': { '*': 'phantom' }, 'grid-court-low': { '*': 'grid' }, 'unit-derby-02': { '*': 'derby' },
    'concrete-mid': { '*': 'concrete' }, 'volt-signal': { '*': 'volt' },
    'ward-chelsea': { 'black-waxed': 'ward-black', 'dark-brown': 'ward-brown' },
    'sector-slip': { '*': 'sector' }, 'saddle-tassel': { sand: 'saddle', black: 'saddle-black' }
  };
  const CUTS = ['volt', 'phantom', 'ward-brown', 'moc-oxblood', 'grid', 'derby', 'sector', 'moc-runner', 'concrete', 'ward-black'];
  // five bright tints, held together by the espresso ink and brass of the brand
  const TINT = ['#BDF0D6', '#FFD8A6', '#C2DCFF', '#FFCFC6', '#DDD1FF'];
  const P = () => API.P.filter((p) => !p.hidden && !p.giving);
  const tintOf = (p) => { const i = API.P.indexOf(p); return i < 0 ? 0 : i % TINT.length; };
  const tn = (i) => TINT[((i % TINT.length) + TINT.length) % TINT.length];
  function pic(p, v) {
    const m = CUT[p.id];
    if (M.cutouts !== false && m) { const f = m[v.id] || m['*'] || Object.values(m)[0]; if (f) return { src: asset('m-' + f + '.webp'), cut: true }; }
    const s = v.images && v.images[0];
    if (s) return { src: sized(s, 640), cut: false };
    return { src: asset('m-hero.webp'), cut: true };
  }
  const sized = (s, w) => /cdn\.shopify|\/cdn\/shop\//.test(s) ? s + (s.includes('?') ? '&' : '?') + 'width=' + w : s;
  const img = (p, v, cls, alt) => { const x = pic(p, v); return `<img class="${cls}${x.cut ? '' : ' blend'}" src="${esc(x.src)}" alt="${esc(alt == null ? p.name + ', ' + v.color : alt)}" loading="lazy" decoding="async">`; };
  const firstV = (p) => p.variants.find((v) => API.stockOf(v) > 0) || p.variants[0];
  const price = (v) => esc(fmt(v.price)) + (API.onSale(v) ? ` <s>${esc(NF(v.compareAt))}</s>` : '');
  const notesFor = (pid) => (window.DAUR_FITNOTES || []).filter((n) => n.pid === pid);
  const allNotes = () => (window.DAUR_FITNOTES || []).length;
  const wished = (pid) => API.wish.includes(pid);
  const minP = () => Math.min.apply(null, P().map(API.minPrice));
  const freeDel = () => !(C.delivery.fee && !(C.advance && C.advance.freeAll && C.advance.freeAll()));
  const delTxt = () => freeDel() ? 'Free delivery' : 'Delivery ' + fmt(C.delivery.fee);
  const days = () => C.delivery.days || '2 to 5 days';
  const GIVE = Object.assign({ on: true, pct: 5, causes: ['School fees', 'Medical bills', 'Food rations'] }, C.give || {});
  GIVE.causes = (GIVE.causes || []).map((x) => String(x).trim()).filter(Boolean).slice(0, 4);

  /* ---------- the logo: the DAUR wordmark and the D mark take turns, as on the desktop header ---------- */
  const DMARK = '<svg class="dm" viewBox="-55 20 234 160" fill="currentColor" aria-hidden="true"><g transform="skewX(-14)"><path d="M20,20 H104 A80,80 0 0 1 104,180 H-10 V144 H104 A44,44 0 0 0 104,56 H56 V128 H20 Z"/></g></svg>';
  const WORDMARK = '<svg class="wm" viewBox="-22 0 462 100" fill="currentColor" aria-hidden="true"><g transform="skewX(-12)" fill-rule="evenodd"><path d="M0,0 H50 A50,50 0 0 1 50,100 H0 Z M27,25 H50 A25,25 0 0 1 50,75 H27 Z"/><path transform="translate(110 0)" d="M0,100 L36,0 H72 L108,100 H79 L54,28 L29,100 Z"/><path transform="translate(226 0)" d="M0,0 H27 V52 A23,23 0 0 0 73,52 V0 H100 V52 A50,48 0 0 1 0,52 Z"/><path transform="translate(340 0)" d="M0,0 H62 A31,31 0 0 1 80,56 L102,100 H71 L51,62 H27 V100 H0 Z M27,20 H61 A11,11 0 0 1 61,42 H27 Z"/></g></svg>';
  const logo = (still) => `<a class="m-logo${still ? ' still' : ''}" href="${root}/" data-m aria-label="DAUR Supply home"><span class="lg-w">${WORDMARK}<small>SUPPLY</small></span><span class="lg-d">${DMARK}</span></a>`;

  /* ---------- icons (stroke) ---------- */
  const I = {
    menu: '<path d="M3 7h18"/><path d="M3 12h12"/><path d="M3 17h18"/>',
    back: '<path d="M19 12H5"/><path d="M11 6l-6 6 6 6"/>',
    arrow: '<path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>',
    bag: '<path d="M6 8h12l-1 12H7z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    home: '<path d="M4 11l8-7 8 7v9h-5v-6h-6v6H4z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
    grid: '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
    plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
    wallet: '<rect x="3" y="6" width="18" height="14" rx="3"/><path d="M16 13h2"/><path d="M3 10h18"/>',
    truck: '<path d="M3 7h11v10H3z"/><path d="M14 10h4l3 3v4h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
    swap: '<path d="M4 12a8 8 0 0 1 14-5l2 2"/><path d="M20 4v5h-5"/><path d="M20 12a8 8 0 0 1-14 5l-2-2"/><path d="M4 20v-5h5"/>',
    note: '<path d="M5 4h14v12l-4 4H5z"/><path d="M9 9h6"/><path d="M9 13h4"/>',
    chat: '<path d="M4 20l1.5-4A8 8 0 1 1 9 19z"/>',
    story: '<path d="M4 5h7v14H4z"/><path d="M13 5h7v14h-7z"/>',
    tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="8" cy="8" r="1.5"/>',
    box: '<path d="M3 8l9-5 9 5v8l-9 5-9-5z"/><path d="M3 8l9 5 9-5"/><path d="M12 13v8"/>',
    gift: '<rect x="3" y="9" width="18" height="12" rx="2"/><path d="M12 9v12"/><path d="M3 13h18"/><path d="M12 9c-2-4-6-4-6-1s6 1 6 1 6 2 6-1-4-3-6 1"/>',
    hand: '<path d="M2 15h4l5 3h6a2 2 0 0 0 0-4h-4"/><path d="M6 15l3-2h4a2 2 0 0 1 0 4"/><path d="M17 14l3.5-2a1.6 1.6 0 0 1 2 2.4L17 19"/>',
    shield: '<path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    pin: '<path d="M12 21s7-6 7-12a7 7 0 0 0-14 0c0 6 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V4H4v12h4"/>',
    share: '<path d="M12 3v13"/><path d="M7 8l5-5 5 5"/><path d="M5 13v7h14v-7"/>',
    check: '<path d="M5 12l5 5 9-10"/>',
    chev: '<path d="M6 9l6 6 6-6"/>',
    book: '<path d="M4 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4z"/><path d="M20 4h-6a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h7z"/>',
    spark: '<path d="M12 3v4"/><path d="M12 17v4"/><path d="M3 12h4"/><path d="M17 12h4"/><path d="M6 6l2.5 2.5"/><path d="M15.5 15.5L18 18"/><path d="M18 6l-2.5 2.5"/><path d="M8.5 15.5L6 18"/>',
    x: '<path d="M6 6l12 12"/><path d="M18 6L6 18"/>'
  };
  const ic = (n, sw) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw || 2}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n] || ''}</svg>`;

  /* ---------- wallet: every new visitor sees the wallet amount waiting; it goes to checkout as one discount code ---------- */
  const W = { code: String(M.walletCode || '').trim().toUpperCase(), amt: +M.walletAmount || 350 };
  W.on = () => !!W.code && store.get('mWallet', 'on') === 'on';
  W.set = (v) => { store.set('mWallet', v ? 'on' : 'off'); if (v) store.set('mCode', ''); };
  // a code picked on the Offers page; only one discount goes to checkout, so it switches the wallet off
  const CODE = { get: () => String(store.get('mCode', '') || ''), set: (c) => { store.set('mCode', c || ''); if (c) store.set('mWallet', 'off'); } };
  const GIFT = { get: () => Object.assign({ to: '', note: '', pack: true }, store.get('mGift', {})), set: (g) => store.set('mGift', g) };

  /* ---------- routes: real store addresses, drawn in place ---------- */
  const COL = { sneakers: 'Sneakers', 'leather-shoes': 'Leather', leather: 'Leather', casual: 'Hybrids', hybrids: 'Hybrids', sale: 'Sale' };
  const NATIVE = { giving: 'giving', gifts: 'gifts', offers: 'offers', feed: 'feed', liked: 'liked' };
  function parse(u) {
    const url = new URL(u, location.href);
    if (url.origin !== location.origin) return null;
    if (/[?&]view=classic/.test(url.search)) return null;
    const p = url.pathname.replace(root, '') || '/';
    let m;
    if (p === '/' || p === '') return { v: 'home' };
    if ((m = p.match(/^\/collections\/([^/]+)\/?$/))) return { v: 'shop', a: COL[m[1]] || 'All' };
    if (/^\/collections\/?$/.test(p) || /^\/search\/?$/.test(p)) return { v: 'shop', a: 'All', q: url.searchParams.get('q') || '' };
    if ((m = p.match(/^\/products\/([^/]+)\/?$/)) && API.prod(m[1]) && !API.prod(m[1]).hidden && !API.prod(m[1]).giving) return { v: 'product', a: m[1] };
    if ((m = p.match(/^\/products\/([^/]+)\/?$/)) && API.prod(m[1]) && API.prod(m[1]).giving) return { v: 'giving' };
    if (/^\/cart\/?$/.test(p)) return { v: 'bag' };
    if ((m = p.match(/^\/pages\/([^/]+)\/?$/)) && NATIVE[m[1]]) return { v: NATIVE[m[1]] };
    return null;
  }
  const href = {
    home: root + '/', bag: root + '/cart', liked: root + '/pages/liked', giving: root + '/pages/giving', gifts: root + '/pages/gifts', offers: root + '/pages/offers', feed: root + '/pages/feed',
    shop: (c) => !c || c === 'All' ? root + '/collections/all' : c === 'Sale' ? root + '/collections/sale' : root + '/collections/' + ({ Sneakers: 'sneakers', Leather: 'leather-shoes', Hybrids: 'casual' }[c] || 'all'),
    product: (h) => root + '/products/' + h
  };
  const TITLE = { bag: 'Your bag', giving: 'Give a pair', gifts: 'Gifts', offers: 'Offers', feed: 'The Feed', liked: 'Liked' };
  const PAGE_T = { manifesto: 'Our story', contract: 'Our promise', track: 'Track order', policies: 'Policies', about: 'About us', contact: 'Contact', notfound: 'Not found', search: 'Search', list: 'Alerts', runway: 'Runway' };

  /* ---------- shell ---------- */
  const start = parse(location.href) || { v: 'page' };
  H.classList.add('m-own');
  document.body.insertAdjacentHTML('beforeend', `<div id="mApp">
    <header class="m-top" id="mTop"></header>
    <main class="m-view" id="mView"></main>
    <nav class="m-tab" id="mTab" aria-label="App"></nav>
    <div class="m-scrim" id="mScrim"></div>
    <div class="m-sheet" id="mSheet" role="dialog" aria-modal="true" aria-label="Panel"></div>
    <div class="m-toast" id="mToast" role="status" aria-live="polite"></div>
  </div>`);
  const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const app = $('#mApp'), view = $('#mView'), top = $('#mTop'), tab = $('#mTab'), sheet = $('#mSheet'), scrim = $('#mScrim'), toastEl = $('#mToast');
  let cur = start, state = {};

  function paintTop() {
    const v = cur.v;
    const brand = v === 'home' || v === 'shop' || v === 'liked' || v === 'product';
    const left = v === 'home' || v === 'shop'
      ? `<button class="m-ib" type="button" data-menu aria-label="Open menu">${ic('menu')}</button>`
      : `<button class="m-ib ${v === 'product' ? 'm-solid' : 'm-soft'}" type="button" data-back aria-label="Back">${ic('back', 2.2)}</button>`;
    const title = TITLE[v] || state.pageTitle || (document.title.split('|')[0] || '').trim() || 'DAUR Supply';
    const mid = brand ? logo() : `<span class="m-top-t">${esc(title)}</span>`;
    const n = API.cart.reduce((a, l) => a + l.qty, 0);
    const right = (v === 'home' || v === 'shop') && W.code
      ? `<button class="m-chip" type="button" data-wallet aria-label="${esc(fmt(W.amt))} in your wallet">${ic('wallet')}<span>${esc(fmt(W.amt))}</span></button>`
      : v === 'bag' ? '<span class="m-ib" aria-hidden="true"></span>'
        : `<a class="m-ib ${v === 'product' ? 'm-solid' : 'm-soft'} m-bagbtn" href="${href.bag}" data-m aria-label="Bag, ${n} ${n === 1 ? 'pair' : 'pairs'}">${ic('bag')}${n ? `<i>${n}</i>` : ''}</a>`;
    top.innerHTML = left + mid + right;
    top.classList.toggle('clear', v === 'product' || v === 'giving');
  }
  function paintTab() {
    const n = API.cart.reduce((a, l) => a + l.qty, 0);
    const a = (v, h, icon, label) => `<a href="${h}" data-m aria-label="${label}"${cur.v === v ? ' aria-current="page"' : ''}>${ic(icon)}<i></i></a>`;
    tab.innerHTML = `<div class="t-row">${a('home', href.home, 'home', 'Home')}${a('shop', href.shop(), 'search', 'Shop and search')}<span></span>${a('liked', href.liked, 'heart', 'Liked')}<button class="t-btn" type="button" data-menu aria-label="Menu">${ic('grid')}<i></i></button></div>
      <a class="t-bag" href="${href.bag}" data-m aria-label="Bag, ${n} ${n === 1 ? 'pair' : 'pairs'}"${cur.v === 'bag' ? ' aria-current="page"' : ''}>${ic('bag')}<span class="t-n">${n || ''}</span></a>`;
    tab.classList.toggle('m-off', cur.v === 'product');
  }

  /* ---------- cards ---------- */
  function card(p, big, mode) {
    const v = firstV(p), t = tintOf(p);
    const badge = API.onSale(v) ? `<span class="m-badge">${API.pct(v)}% off</span>` : '';
    const inner = `${img(p, v, 'c-img')}${big ? '' : badge}<span class="c-n">${esc(p.name)}</span><span class="c-t">${esc(p.category)}</span><span class="c-p">${price(v)}</span>`;
    const act = mode === 'gift' ? `<button class="m-act" type="button" data-quick="${esc(p.id)}" data-mode="gift">${ic('gift')}<span>Gift</span></button>`
      : mode === 'give' ? `<button class="m-act g" type="button" data-quick="${esc(p.id)}" data-mode="give">${ic('hand')}<span>Give</span></button>`
        : `<button class="m-plus" type="button" data-quick="${esc(p.id)}" aria-label="Quick add ${esc(p.name)}"><i>${ic('plus', 2.6)}</i></button>`;
    return `<div class="${big ? 'm-card' : 'm-tile'}" style="--tn:${TINT[t]}"><a href="${href.product(p.id)}" data-m class="c-link" aria-label="${esc(p.name + ', ' + p.category + ', ' + fmt(v.price))}"></a>${inner}
      <button class="m-heart" type="button" data-wish="${esc(p.id)}" aria-pressed="${wished(p.id)}" aria-label="Save ${esc(p.name)}">${ic('heart')}</button>${act}</div>`;
  }
  function row(p) {
    const v = firstV(p), t = tintOf(p), x = pic(p, v);
    return `<a class="m-li" href="${href.product(p.id)}" data-m><span class="l-img" style="--tn:${TINT[t]}"><img class="${x.cut ? '' : 'blend'}" src="${esc(x.src)}" alt="" loading="lazy"></span><span class="l-t"><b>${esc(p.name)}</b><small>${esc(p.category)} · EU ${esc(p.sizes[0])} to ${esc(p.sizes[p.sizes.length - 1])}</small></span><span class="l-p">${esc(fmt(v.price))}</span></a>`;
  }
  const cats = () => { const s = []; P().forEach((p) => { if (!s.includes(p.category)) s.push(p.category); }); return s; };
  const inCat = (p, c) => !c || c === 'All' || c === 'Popular' || (c === 'Sale' ? p.variants.some(API.onSale) : p.category === c);
  const pills = (list, on, attr, alt) => list.map((c) => `<button class="m-pill${alt ? ' alt' : ''}" type="button" ${attr}="${esc(c)}" aria-pressed="${c === on}">${esc(c)}</button>`).join('');
  const hasSale = () => P().some((p) => p.variants.some(API.onSale));

  /* ---------- views ---------- */
  const V = {};
  V.home = function () {
    const all = P();
    const hero = all.find((p) => p.variants.some(API.onSale) && CUT[p.id]) || all.find((p) => CUT[p.id]) || all[0];
    const hv = hero && firstV(hero);
    const c = state.homeCat || 'Popular';
    const list = all.filter((p) => inCat(p, c));
    const fresh = all.slice().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).filter((p) => p !== hero).slice(0, 3);
    const pc = cats().concat(hasSale() ? ['Sale'] : []);
    const notes = allNotes();
    view.innerHTML = `${hero ? `<a class="m-banner" href="${href.product(hero.id)}" data-m><span class="b-dm">${DMARK}</span><span class="b-k">${esc(hero.tag || 'Drop 01')}</span><span class="b-n">${esc(hero.name)}</span><span class="b-row"><span class="b-go">Shop now</span><span class="b-p">${esc(fmt(hv.price))}${API.onSale(hv) ? `<s>${esc(NF(hv.compareAt))}</s>` : ''}</span></span>${img(hero, hv, '', hero.name)}</a>` : ''}
      <div class="m-pills" role="group" aria-label="Filter">${pills(['Popular'].concat(pc), c, 'data-hcat')}</div>
      <div class="m-car" aria-label="Pairs">${list.map((p) => card(p, true)).join('') || '<p class="m-mute m-pad">Nothing here yet.</p>'}</div>
      <div class="m-proof" aria-label="What you get"><span>${ic('truck')}${esc(delTxt())}</span><span>${ic('swap')}${C.exchangeDays || 5} day size swap</span>${notes ? `<span>${ic('note')}${notes} fit notes</span>` : ''}<span>${ic('box')}${esc(days())}</span></div>
      <div class="m-duo m-pad"><a class="m-duo-a gift" href="${href.gifts}" data-m>${ic('gift')}<b>Gift a pair</b><small>Your note in the box</small></a><a class="m-duo-a give" href="${href.giving}" data-m>${ic('hand')}<b>Give a pair</b><small>Handed over in person</small></a></div>
      <div class="m-row m-pad" style="margin-top:24px"><h2 class="m-h2">Fresh in</h2><a class="m-link" href="${href.shop()}" data-m>See all</a></div>
      <div class="m-rows">${fresh.map(row).join('')}</div>`;
  };
  V.shop = function () {
    const c = state.shopCat || cur.a || 'All', q = (state.q != null ? state.q : cur.q || '').trim().toLowerCase();
    const list = P().filter((p) => inCat(p, c) && (!q || (p.name + ' ' + p.category + ' ' + p.variants.map((v) => v.color).join(' ')).toLowerCase().includes(q)));
    const pc = ['All'].concat(cats()).concat(hasSale() ? ['Sale'] : []);
    if (!view.querySelector('.m-search')) {
      view.innerHTML = `<div class="m-row m-pad"><h1 class="m-h1">Shop</h1><span class="m-mute" id="mCount"></span></div>
        <label class="m-search"><span class="m-sr">Search pairs</span>${ic('search')}<input type="search" id="mQ" placeholder="Search pairs" autocomplete="off" enterkeyhint="search" value="${esc(state.q != null ? state.q : cur.q || '')}"></label>
        <div class="m-pills" role="group" aria-label="Filter" id="mSPills"></div><div class="m-grid" id="mGrid"></div>`;
      $('#mQ').addEventListener('input', (e) => { state.q = e.target.value; V.shop(); });
    }
    $('#mSPills').innerHTML = pills(pc, c, 'data-scat', true);
    $('#mCount').textContent = list.length + (list.length === 1 ? ' pair' : ' pairs');
    $('#mGrid').innerHTML = list.map((p) => card(p, false)).join('') || '<p class="m-mute" style="grid-column:1/-1">No pairs match. Try another word.</p>';
  };
  V.liked = function () {
    const list = API.wish.map(API.prod).filter((p) => p && !p.hidden && !p.giving);
    view.innerHTML = `<div class="m-pad"><h1 class="m-h1">Liked</h1></div>` + (list.length ? `<div class="m-grid">${list.map((p) => card(p, false)).join('')}</div>`
      : `<div class="m-empty"><img src="${asset('m-volt.webp')}" alt=""><b>Nothing liked yet</b><span class="m-mute">Tap the heart on any pair.</span><a class="m-cta solo" href="${href.shop()}" data-m>Shop now</a></div>`);
  };

  const MODES = [['me', 'For me', 'bag'], ['gift', 'Gift', 'gift'], ['give', 'Give', 'hand']];
  V.product = function () {
    const p = API.prod(cur.a); if (!p) return V.shop();
    if (!state.pv || state.pid !== p.id) { state.pid = p.id; state.pv = firstV(p).id; state.size = null; state.more = false; state.mode = 'me'; }
    const v = API.variant(p, state.pv);
    const tint = tn(tintOf(p) + p.variants.indexOf(v));
    const notes = notesFor(p.id);
    const first = (p.description || '').split(/(?<=\.)\s/)[0] || '';
    const shots = (v.images || []).slice(0, 6);
    const low = C.lowStockAt || 2;
    const parts = p.name.split(' ');
    const name = parts.length > 1 ? esc(parts.slice(0, -1).join(' ')) + '<br>' + esc(parts[parts.length - 1]) : esc(p.name);
    const save = API.onSale(v) ? v.compareAt - v.price : 0;
    const give = state.mode === 'give';
    view.innerHTML = `<div class="m-pdp" style="--tn:${tint}">
      <div class="p-bg1"></div><div class="p-bg2"></div><div class="p-bg3"></div>
      <div class="p-head"><h1 class="p-n">${name}</h1><span class="p-t">${esc(p.category)}</span>${img(p, v, 'p-img')}</div>
      <div class="p-price"><small>Price</small><b>${esc(fmt(v.price))}</b>${save ? `<s>${esc(fmt(v.compareAt))}</s><br><span class="p-save">You keep ${esc(fmt(save))}</span>` : ''}</div>
      <div class="m-sec"><div class="m-seg" role="group" aria-label="Who is this pair for">${MODES.map(([k, l, i]) => `<button type="button" data-pmode="${k}" aria-pressed="${state.mode === k}">${ic(i)}<span>${l}</span></button>`).join('')}</div>
        ${state.mode === 'gift' ? `<p class="m-modenote">${ic('gift')}<span>Packed as a gift, with your note inside. Paid in full, nothing to pay at his door.</span></p>` : give ? `<p class="m-modenote g">${ic('hand')}<span>We match the size to the person and hand it over in person. You get a private photo.</span></p>` : ''}</div>
      <div class="m-sec"><div class="m-row"><h3 style="margin:0">About</h3>${notes.length ? `<button class="m-more" type="button" data-notes>${notes.length} fit ${notes.length === 1 ? 'note' : 'notes'}</button>` : ''}</div>
        <p style="margin-top:8px">${esc(state.more ? p.description : first)} ${p.description && p.description !== first || p.specs ? `<button class="m-more" type="button" data-more>${state.more ? 'Less' : 'More'}</button>` : ''}</p>
        ${state.more && p.specs ? `<ul class="m-specs">${Object.keys(p.specs).map((k) => `<li><span>${esc(k)}</span><b>${esc(p.specs[k])}</b></li>`).join('')}</ul>` : ''}</div>
      ${p.variants.length > 1 ? `<div class="m-sec"><h3>Colour <span class="m-colname">${esc(v.color)}</span></h3><div class="m-cols">${p.variants.map((x, i) => { const y = pic(p, x); return `<button class="m-col" type="button" data-pv="${esc(x.id)}" aria-pressed="${x.id === v.id}" aria-label="${esc(x.color)}" style="--tn:${tn(tintOf(p) + i)}"><img class="${y.cut ? '' : 'blend'}" src="${esc(y.src)}" alt=""></button>`; }).join('')}</div></div>` : ''}
      ${give ? '' : `<div class="m-sec"><div class="m-row"><h3 style="margin:0">Size (EU)</h3><a class="m-link" href="${root}/pages/policies#size" style="min-height:0">Size guide</a></div>
        <div class="m-sizes" style="margin-top:10px">${p.sizes.map((s) => { const q = (v.stock || {})[s] || 0; return `<button class="m-size${q > 0 && q <= low ? ' low' : ''}" type="button" data-size="${esc(s)}" aria-pressed="${state.size == s}"${q > 0 ? '' : ' disabled'} aria-label="EU ${esc(s)}${q > 0 ? q <= low ? ', only ' + q + ' left' : '' : ', sold out'}">${esc(s)}</button>`; }).join('')}</div>
        ${state.size && (v.stock || {})[state.size] <= low ? `<p class="m-hint">Only ${(v.stock || {})[state.size]} left in EU ${esc(state.size)}</p>` : ''}
        ${C.whatsapp ? `<a class="m-wa" href="https://wa.me/${esc(C.whatsapp)}?text=${encodeURIComponent('Assalam o Alaikum DAUR, which size of ' + p.name + ' should I take?')}" target="_blank" rel="noopener">${ic('chat')}Not sure? Ask us on WhatsApp</a>` : ''}</div>`}
      ${shots.length ? `<div class="m-sec"><h3>Photos</h3><div class="m-shots">${shots.map((s, i) => `<img src="${esc(sized(s, 900))}" alt="${esc(p.name + ', ' + v.color + ', photo ' + (i + 1))}" loading="lazy">`).join('')}</div></div>` : ''}
      ${notes.length ? `<div class="m-sec"><h3 id="mNotes">Fit notes</h3><div class="m-shots">${notes.slice(0, 8).map((n) => `<div class="m-note"><span class="n-s" aria-label="${n.rating} of 5">${'★'.repeat(Math.max(1, Math.min(5, n.rating)))}</span>${n.title ? `<b>${esc(n.title)}</b>` : ''}<p>${esc(n.body)}</p><small>${esc(n.name)}${n.city ? ', ' + esc(n.city) : ''}${n.size ? ' · EU ' + esc(n.size) : ''}</small></div>`).join('')}</div></div>` : ''}
    </div>`;
    paintBuy(p, v);
  };
  function buyBar() {
    let b = $('#mBuy');
    if (!b) { app.insertAdjacentHTML('beforeend', '<div class="m-buy" id="mBuy"></div>'); b = $('#mBuy'); }
    return b;
  }
  function paintBuy(p, v) {
    const b = buyBar();
    const give = state.mode === 'give', ok = give || !!state.size;
    const label = give ? 'Give this pair' : !state.size ? 'Pick your size' : (state.mode === 'gift' ? 'Add as gift' : 'Add to bag') + ' · EU ' + state.size;
    b.innerHTML = `<span class="bb-l">${esc(fmt(v.price))} · ${esc(delTxt())} · ${esc(days())}</span>
      <div class="bb-r"><button class="m-round" type="button" data-wish="${esc(p.id)}" aria-pressed="${wished(p.id)}" aria-label="Save to Liked">${ic('heart')}</button>
      <button class="m-cta${give ? ' give' : ''}" type="button" data-add aria-disabled="${!ok}"><span>${esc(label)}</span></button></div>`;
  }

  V.bag = function () {
    const t = API.totals();
    if (!t.lines.length) {
      view.innerHTML = `<div class="m-empty" style="padding-top:60px"><img src="${asset('m-ward-brown.webp')}" alt=""><b>Your bag is empty</b><span class="m-mute">${freeDel() ? 'Delivery is free to every city.' : 'Pick a pair.'}</span><a class="m-cta solo" href="${href.shop()}" data-m>Shop now</a></div>`;
      buyBar().remove();
      return;
    }
    const wal = W.on(), code = !wal && CODE.get();
    const off = wal ? Math.min(W.amt, t.subtotal) : 0;
    const total = Math.max(0, t.subtotal - off + (t.delivery || 0));
    const dep = C.advance && C.advance.deposits && C.advance.deposits() ? C.advance.due(total) : 0;
    const lines = API.cart;
    const hasGift = lines.some((l) => l.mode === 'gift'), hasGive = lines.some((l) => l.mode === 'give');
    const g = GIFT.get();
    view.innerHTML = `<div class="m-pad m-bag">${t.lines.map((d, i) => {
      const x = pic(d.p, d.v), mode = lines[i] && lines[i].mode;
      return `<div class="m-line" style="--tn:${TINT[tintOf(d.p)]}"><a class="ln-img" href="${href.product(d.p.id)}" data-m><img class="${x.cut ? '' : 'blend'}" src="${esc(x.src)}" alt="${esc(d.p.name)}"></a>
        <div class="ln-t">${mode === 'gift' ? `<span class="ln-tag">${ic('gift')}Gift</span>` : mode === 'give' ? `<span class="ln-tag g">${ic('hand')}Giving</span>` : ''}<b>${esc(d.p.name)}</b><small>${esc(d.v.color)} · ${mode === 'give' ? 'Size matched by DAUR' : 'EU ' + esc(d.l.size)}</small><span class="ln-p">${esc(fmt(d.total))}</span></div>
        <div class="m-step"><button class="on" type="button" data-qty="${i}" data-d="1" aria-label="Add one">+</button><span>${d.l.qty}</span><button type="button" data-qty="${i}" data-d="-1" aria-label="${d.l.qty > 1 ? 'Remove one' : 'Remove pair'}">&#8722;</button></div></div>`;
    }).join('')}
      ${hasGift ? `<div class="m-giftbox"><div class="m-row"><b>${ic('gift')}Gift details</b><small class="m-mute">Goes in the box</small></div>
        <label><span>For</span><input id="mGTo" maxlength="40" placeholder="His name" value="${esc(g.to)}"></label>
        <label><span>Your note</span><textarea id="mGNote" maxlength="240" rows="3" placeholder="Eid Mubarak, Abbu. From Ali">${esc(g.note)}</textarea></label>
        <button class="m-tog" type="button" data-gpack aria-pressed="${g.pack}"><span>Gift packing</span><span class="m-sw" aria-hidden="true"></span></button></div>` : ''}
      ${hasGive ? `<div class="m-givebox">${ic('hand')}<span><b>Thank you.</b> We match the size, hand the pair over in person and send you a private photo.</span></div>` : ''}
      ${W.code ? `<button class="m-wallet" type="button" data-wtoggle aria-pressed="${wal}"><span class="w-i">${ic('wallet')}</span><span class="w-t"><b>${esc(fmt(W.amt))} in your wallet</b><small>${wal ? 'Used on this order' : 'Tap to use it on this order'}</small></span><span class="m-sw" aria-hidden="true"></span></button>` : ''}
      ${code ? `<div class="m-codeline">${ic('tag')}<span>Code <b>${esc(code)}</b> goes to checkout</span><button type="button" data-uncode aria-label="Remove code">${ic('x')}</button></div>` : ''}
      <div class="m-sum"><div><span>Subtotal</span><span>${esc(fmt(t.subtotal))}</span></div>
        ${t.sale ? `<div><span>Sale saving</span><span class="s-g">${esc(fmt(t.sale))} kept</span></div>` : ''}
        ${off ? `<div><span>Wallet</span><span class="s-g">${esc(fmt(off))} off</span></div>` : ''}
        <div><span>Delivery</span><span>${t.delivery ? esc(fmt(t.delivery)) : 'Free'}</span></div><hr><div class="s-tot"><span>Total</span><span>${esc(fmt(total))}</span></div></div>
      ${dep && dep < total && !hasGift && !hasGive ? `<div class="m-dep"><span>Today: ${esc(C.advance.care || 'Care deposit')}<br><small class="m-mute">Rest on delivery</small></span><b>${esc(fmt(dep))}</b></div>` : ''}
      ${GIVE.on && GIVE.causes.length > 1 ? `<div class="m-vote"><b>Where should this quarter's slice go?</b><small class="m-mute">At least ${GIVE.pct}% of our profit. Your vote travels with your order.</small><div class="m-vote-o">${GIVE.causes.map((c) => `<button type="button" data-vote="${esc(c)}" aria-pressed="${store.get('sliceVote', '') === c}">${esc(c)}</button>`).join('')}</div></div>` : ''}
      <div class="m-trust"><span>${ic('truck')}Delivery in ${esc(days())}</span><span>${ic('swap')}Size swap within ${C.exchangeDays || 5} days</span><span>${ic('chat')}We confirm every order on WhatsApp</span></div>
    </div>`;
    const to = $('#mGTo'), note = $('#mGNote');
    if (to) to.addEventListener('input', () => GIFT.set(Object.assign(GIFT.get(), { to: to.value })));
    if (note) note.addEventListener('input', () => GIFT.set(Object.assign(GIFT.get(), { note: note.value })));
    const b = buyBar();
    b.classList.add('on-bag');
    b.innerHTML = `<div class="bb-r"><button class="m-cta split" type="button" data-checkout><span>Checkout</span><span class="t-pill">${esc(fmt(total))}</span></button></div>`;
  };

  /* ---------- give a pair: any pair, handed over in person ---------- */
  const PH = (n) => asset('m-g-' + n + '.webp');
  const rounds = () => (window.DAUR_GIVING_ROUNDS || []);
  function quarterEnd() { const d = new Date(); const q = Math.floor(d.getMonth() / 3); const e = new Date(d.getFullYear(), q * 3 + 3, 0); return e.getDate() + ' ' + e.toLocaleString('en-GB', { month: 'short' }) + ' ' + e.getFullYear(); }
  function handover(p) {
    // real open hands, and the chosen pair settling into them, then a heart rising
    const v = p && firstV(p), x = p ? pic(p, v) : { src: asset('m-sector.webp'), cut: true };
    return `<div class="m-hand" role="img" aria-label="A pair of shoes placed into open hands"><img class="h-ph" src="${PH('hands')}" alt="" loading="lazy"><img class="h-shoe${x.cut ? '' : ' blend'}" src="${esc(x.src)}" alt=""><span class="h-glow"></span><span class="h-heart">${ic('heart')}</span><span class="h-sp a"></span><span class="h-sp b"></span><span class="h-sp c"></span></div>`;
  }
  V.giving = function () {
    const all = P();
    if (!state.gp || !API.prod(state.gp)) state.gp = (all.find((p) => p.id === 'sector-slip') || all[0] || {}).id;
    const gp = API.prod(state.gp), gv = gp && firstV(gp);
    const R = rounds(), given = R.reduce((a, r) => a + (+r.pairs || 0), 0);
    const cities = [...new Set(R.map((r) => String(r.cities || '')).join(',').split(',').map((s) => s.trim()).filter(Boolean))];
    const vote = store.get('sliceVote', '');
    view.innerHTML = `<div class="m-gv">
      <section class="gv-hero"><img class="gv-ph" src="${PH('boy-hill')}" alt="A smiling boy on a green hillside" fetchpriority="high"><span class="gv-dots" aria-hidden="true">${'<i></i>'.repeat(14)}</span>
        <div class="gv-t"><span class="m-kick">${ic('hand')}Give a pair</span><h1>One pair.<br>One person.<br>By hand.</h1><p>Pick any pair. We match the size and hand it over in person.</p><a class="m-cta gold" href="#gvPick" data-jump>Choose a pair</a></div></section>
      <div class="gv-stats">${given ? `<span><b>${NF(given)}</b><small>pairs given</small></span><span><b>${cities.length || 1}</b><small>${cities.length === 1 ? 'city' : 'cities'}</small></span>` : `<span><b>Round 1</b><small>handover after ${esc(quarterEnd())}</small></span>`}<span><b>7 days</b><small>to your private photo</small></span><span><b>${esc(fmt(minP()))}</b><small>pairs from</small></span></div>
      <section class="gv-card gv-anim">${handover(gp)}<b>From your hands to theirs.</b></section>
      <section class="gv-pick" id="gvPick"><h2 class="m-h2 m-pad">Choose the pair</h2>
        <div class="gv-rail">${all.map((p) => { const v = firstV(p), x = pic(p, v); return `<button class="gv-p" type="button" data-gp="${esc(p.id)}" aria-pressed="${p.id === state.gp}" style="--tn:${TINT[tintOf(p)]}"><img class="${x.cut ? '' : 'blend'}" src="${esc(x.src)}" alt=""><b>${esc(p.name)}</b><small>${esc(fmt(v.price))}</small></button>`; }).join('')}</div>
        ${gp ? `<div class="gv-sel" style="--tn:${TINT[tintOf(gp)]}">${img(gp, gv, 'gv-sel-i')}<div><b>${esc(gp.name)}</b><small>${esc(gv.color)} · size matched by DAUR</small><span>${esc(fmt(gv.price))}</span></div></div>
        <button class="m-hold" type="button" id="mHold" data-pid="${esc(gp.id)}"><span class="hold-r" aria-hidden="true"></span><span class="hold-t">${ic('hand')}Hold to give</span></button><p class="m-mute gv-hint">Press and hold. Or tap twice.</p>` : ''}</section>
      <section class="gv-steps m-pad"><h2 class="m-h2">How it reaches them</h2>
        ${[['heart', 'You pick a pair', 'Full price. Nothing added.'], ['user', 'We match the size', 'To the person who receives it.'], ['hand', 'Handed over in person', 'In the round after the quarter closes.'], ['camera', 'A private photo, to you', 'Within 7 days of the handover.']].map(([i, h, p], k) => `<div class="gv-step" style="--tn:${tn(k)}"><span class="gv-n">${ic(i)}</span><span><b>${h}</b><small>${p}</small></span><em>0${k + 1}</em></div>`).join('')}</section>
      <section class="gv-faces"><h2 class="m-h2 m-pad">Who a pair can reach</h2>
        <div class="gv-mosaic">${['girl-red', 'boys-corn', 'old-man', 'boy-smile', 'girl-fire', 'boy-pot'].map((n, i) => `<img class="f${i}" src="${PH(n)}" alt="" loading="lazy">`).join('')}</div></section>
      ${GIVE.on ? `<section class="gv-slice"><span class="m-kick">${ic('spark')}The Slice</span><h2>At least ${GIVE.pct}% of our profit, every quarter.</h2><p>From every order, never added to your price.</p>
        ${GIVE.causes.length > 1 ? `<div class="m-vote-o">${GIVE.causes.map((c) => `<button type="button" data-vote="${esc(c)}" aria-pressed="${vote === c}">${esc(c)}</button>`).join('')}</div><small>Your vote travels with your next order.</small>` : ''}
        <blockquote>“Charity does not decrease wealth.”<cite>Sahih Muslim 2588</cite></blockquote></section>` : ''}
      <a class="gv-out" href="${href.gifts}" data-m><img src="${PH('hands')}" alt=""><span><b>Sending to family instead?</b><small>Gift a pair with your note inside</small></span>${ic('arrow')}</a>
    </div>`;
    bindHold();
    observeIn();
  };
  function bindHold() {
    const b = $('#mHold'); if (!b) return;
    let t0 = 0, raf = 0, done = false, taps = 0, tapT;
    const LEN = 1100;
    const set = (p) => b.style.setProperty('--p', Math.min(1, p));
    const finish = () => {
      done = true; set(1); b.classList.add('ok');
      const pid = b.dataset.pid, p = API.prod(pid);
      if (p && add(pid, firstV(p).id, null, 'give')) burst(b);
      setTimeout(() => { b.classList.remove('ok', 'go'); set(0); done = false; }, 1600);
    };
    const tick = () => { const p = (performance.now() - t0) / LEN; set(p); if (p >= 1) { finish(); return; } raf = requestAnimationFrame(tick); };
    b.addEventListener('pointerdown', (e) => { if (done) return; e.preventDefault(); b.classList.add('go'); t0 = performance.now(); raf = requestAnimationFrame(tick); try { navigator.vibrate && navigator.vibrate(8); } catch (x) { /* no vibration */ } });
    const stop = () => { if (done) return; cancelAnimationFrame(raf); b.classList.remove('go'); set(0); };
    b.addEventListener('pointerup', stop); b.addEventListener('pointerleave', stop); b.addEventListener('pointercancel', stop);
    b.addEventListener('contextmenu', (e) => e.preventDefault());
    // a double tap or the keyboard gives at once, so no one needs to hold
    b.addEventListener('click', (e) => { if (done) return; if (e.detail === 0) { finish(); return; } taps += 1; clearTimeout(tapT); tapT = setTimeout(() => { taps = 0; }, 420); if (taps >= 2) { taps = 0; finish(); } });
  }
  function burst(el) {
    if (reduce) return;
    const r = el.getBoundingClientRect();
    for (let i = 0; i < 14; i++) {
      const h = document.createElement('span'); h.className = 'm-burst'; h.innerHTML = ic('heart');
      h.style.left = (r.left + r.width / 2) + 'px'; h.style.top = (r.top + r.height / 2) + 'px';
      const a = (Math.PI * 2 * i) / 14, d = 70 + Math.random() * 60;
      h.style.setProperty('--x', Math.cos(a) * d + 'px'); h.style.setProperty('--y', (Math.sin(a) * d - 40) + 'px');
      document.body.appendChild(h); setTimeout(() => h.remove(), 1100);
    }
  }
  function observeIn() {
    const els = $$('.gv-mosaic img, .gv-step, .pg-sec, .gf-f, .fd-post', view);
    if (!('IntersectionObserver' in window) || reduce) return;
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -30px' });
    els.forEach((e) => { if (e.getBoundingClientRect().top > innerHeight) { e.classList.add('pre'); io.observe(e); } });
  }

  /* ---------- gifts ---------- */
  V.gifts = function () {
    const all = P(), hero = all.find((p) => p.id === 'ward-chelsea') || all[0], hv = hero && firstV(hero);
    view.innerHTML = `<div class="m-gf">
      <section class="gf-hero"><div class="gf-box" aria-hidden="true"><span class="gf-lid"></span><span class="gf-base"><i></i></span>${hero ? img(hero, hv, 'gf-shoe', '') : ''}<span class="gf-sp s1"></span><span class="gf-sp s2"></span><span class="gf-sp s3"></span></div>
        <span class="m-kick">${ic('gift')}Gifts</span><h1>Gift a pair.</h1><p>Your note inside. Size swap in ${C.exchangeDays || 5} days.</p></section>
      <div class="gf-facts">${[['gift', 'Gift packing', 'On request'], ['note', 'Your note', 'Up to 240 letters'], ['shield', 'Paid in full', 'Nothing at his door']].map(([i, b, s], k) => `<span class="gf-f" style="--tn:${tn(k + 1)}">${ic(i)}<b>${b}</b><small>${s}</small></span>`).join('')}</div>
      <div class="m-row m-pad" style="margin-top:22px"><h2 class="m-h2">Pick the pair</h2><span class="m-mute">${all.length} pairs</span></div>
      <div class="m-grid">${all.map((p) => card(p, false, 'gift')).join('')}</div>
      <a class="gv-out" href="${href.giving}" data-m style="margin-top:26px"><img src="${PH('boys-corn')}" alt=""><span><b>Give one to someone in need</b><small>Handed over in person</small></span>${ic('arrow')}</a>
    </div>`;
    observeIn();
  };

  /* ---------- offers ---------- */
  V.offers = function () {
    const offers = (window.DAUR_OFFERS || []).filter((o) => o.code).sort((a, b) => (a.sort || 99) - (b.sort || 99));
    const sale = P().filter((p) => p.variants.some(API.onSale));
    const wal = W.on(), code = CODE.get();
    const left = (e) => { if (!e) return ''; const d = Math.ceil((new Date(e) - new Date()) / 864e5); return d > 0 && d <= 14 ? `${d} ${d === 1 ? 'day' : 'days'} left` : ''; };
    view.innerHTML = `<div class="m-of">
      ${W.code ? `<section class="of-wallet"><span class="b-dm">${DMARK}</span><span class="m-kick">${ic('wallet')}Your wallet</span><b class="of-amt">${esc(fmt(W.amt))}</b><small>Comes off your first order at checkout.</small>
        <button class="m-tog light" type="button" data-wtoggle aria-pressed="${wal}"><span>${wal ? 'On for your next order' : 'Switch on'}</span><span class="m-sw" aria-hidden="true"></span></button></section>` : ''}
      <div class="m-pad"><h2 class="m-h2" style="margin-top:24px">Codes</h2></div>
      <div class="of-list">${offers.length ? offers.map((o, i) => `<div class="of-t" style="--tn:${tn(i + 1)}"><div class="of-l"><span class="of-code">${esc(o.code)}</span><b>${esc(o.title || '')}</b>${o.details ? `<small>${esc(o.details)}</small>` : ''}${o.min ? `<small>On ${esc(fmt(o.min))} and up</small>` : ''}${left(o.ends) ? `<em>${left(o.ends)}</em>` : ''}</div>
        <div class="of-r"><button type="button" data-copy="${esc(o.code)}" aria-label="Copy ${esc(o.code)}">${ic('copy')}</button><button type="button" class="use" data-code="${esc(o.code)}" aria-pressed="${!wal && code === o.code}">${!wal && code === o.code ? 'Added' : 'Use'}</button></div></div>`).join('')
        : `<p class="m-mute m-pad">No codes right now. Sale prices below need no code.</p>`}</div>
      ${sale.length ? `<div class="m-row m-pad" style="margin-top:24px"><h2 class="m-h2">Already reduced</h2><a class="m-link" href="${href.shop('Sale')}" data-m>All sale</a></div><div class="m-grid">${sale.map((p) => card(p, false)).join('')}</div>` : ''}
      <p class="m-mute m-pad of-one">One discount per order. The bigger saving is always the one we keep.</p>
    </div>`;
  };

  /* ---------- the feed: every pair as a post ---------- */
  V.feed = function () {
    const all = P(), notes = allNotes();
    const facts = [['truck', delTxt() + '.', 'To every city in Pakistan, in ' + days() + '.'], ['swap', (C.exchangeDays || 5) + ' day size swap.', 'Wrong size? We swap it.'], ['pin', 'Lahore. Sialkot. Kasur.', 'Where every pair is made.']];
    if (notes) facts.push(['note', notes + ' fit notes.', 'From buyers, shown on every pair.']);
    let k = 0;
    view.innerHTML = `<div class="m-fd"><div class="m-pad"><h1 class="m-h1">The Feed</h1><p class="m-mute" style="margin:4px 0 0">New pairs and price cuts.</p></div>
      ${all.map((p, i) => { const v = firstV(p); const post = `<article class="fd-post"><div class="fd-top"><span class="fd-av">${DMARK}</span><span><b>daursupply</b><small>${esc(p.category)}</small></span>${API.onSale(v) ? `<em>${API.pct(v)}% off</em>` : ''}</div>
        <a class="fd-media" href="${href.product(p.id)}" data-m style="--tn:${TINT[tintOf(p)]}">${img(p, v, 'fd-img')}</a>
        <div class="fd-acts"><button type="button" data-wish="${esc(p.id)}" aria-pressed="${wished(p.id)}" aria-label="Like ${esc(p.name)}">${ic('heart')}</button><button type="button" data-share="${esc(p.id)}" aria-label="Share ${esc(p.name)}">${ic('share')}</button><a class="m-cta sm" href="${href.product(p.id)}" data-m>${price(v)}</a></div>
        <p class="fd-cap"><b>${esc(p.name)}</b> ${esc((p.description || '').split(/(?<=\.)\s/)[0] || '')}</p></article>`;
        const f = i % 2 === 1 && facts[k] ? facts[k++] : null;
        return post + (f ? `<article class="fd-post fd-fact" style="--tn:${tn(k + 1)}">${ic(f[0])}<b>${esc(f[1])}</b><small>${esc(f[2])}</small></article>` : '');
      }).join('')}</div>`;
    observeIn();
  };

  /* ---------- every other page: the storefront draws it (hidden), the app rebuilds its words in app cards ----------
     Words, links, steps, tables and questions are read from the drawn page; forms and other live controls are moved
     across as they are, so they keep working. Nothing on these pages is written twice. */
  const isKick = (el) => el.matches('.eyebrow,.st-k,.no,.mono,.kicker,.ct-k,.j-meta,.lbl') && txt(el).length < 70 && !el.querySelector('p,h1,h2,h3,div,ul');
  function skip(el) {
    const t = el.tagName;
    if (/^(SVG|SCRIPT|STYLE|TEMPLATE|NOSCRIPT|CANVAS|LINK|META|BUTTON|IFRAME)$/.test(t)) return true;
    if (el.hidden || el.getAttribute('aria-hidden') === 'true') return true;
    if (el.matches('.sr-only,.sr-skip,.crumbs,.ur-lock,.of-float,.nf-num,.hero-stage,.st-hero-m,.st-ch-m,.gv-loaf,.ct-art,.hero-light,.x-story-m,.ap-heart,.ap-add,.ap-extra,.daur-loader')) return true;
    if (!txt(el) && !el.querySelector('img,input,select,textarea') && t !== 'IMG' && t !== 'HR') return true;
    return false;
  }
  function inl(node) {
    let o = '';
    node.childNodes.forEach((c) => {
      if (c.nodeType === 3) { o += esc(c.textContent); return; }
      if (c.nodeType !== 1 || skip(c) && c.tagName !== 'BR') return;
      const t = c.tagName;
      if (c.matches('.arr')) return;
      if (t === 'BR') o += '<br>';
      else if (t === 'A') { const h = c.getAttribute('href') || ''; const ext = /^https?:/i.test(h) && !h.includes(location.host); o += `<a href="${esc(h)}"${ext ? ' target="_blank" rel="noopener"' : ''}>${inl(c)}</a>`; }
      else if (t === 'B' || t === 'STRONG') o += '<b>' + inl(c) + '</b>';
      else if (t === 'EM' || t === 'I') o += '<i>' + inl(c) + '</i>';
      else if (t === 'S' || t === 'DEL') o += '<s>' + inl(c) + '</s>';
      else if (/^(P|DIV|LI|H\d)$/.test(t)) o += ' ' + inl(c) + ' ';
      else o += inl(c);
    });
    return o.replace(/\s+/g, ' ');
  }
  const prodOf = (el) => { const a = el.matches('a[href*="/products/"]') ? el : el.querySelector('a[href*="/products/"]'); const m = a && (a.getAttribute('href') || '').match(/\/products\/([^/?#~]+)/); const p = m && API.prod(m[1]); return p && !p.hidden && !p.giving ? p : null; };
  function tileOf(el) {
    const hs = el.querySelectorAll('h2,h3,h4');
    let h = hs.length === 1 ? hs[0] : null;
    if (!h && !hs.length && el.matches('a,li')) h = el.querySelector('b,strong');
    if (!h || txt(el).length > 640 || el.querySelector('table,form,details,ul ul')) return null;
    const n = el.querySelector('.n,.trk-n,.no,.st-no');
    const kick = [...el.querySelectorAll('.mono,.ct-k,.eyebrow,.j-meta')].find((k) => k !== n && !k.contains(h) && !(n && k.contains(n)));
    const im = [...el.querySelectorAll('img')].find((i) => !i.closest('svg'));
    const rest = [...el.querySelectorAll('p,span,small,div,li')].filter((x) => x !== h && !x.contains(h) && !h.contains(x) && x !== n && x !== kick && !(kick && kick.contains(x)) && !x.querySelector('p,span,small,div,li') && !x.matches('.arr,.ct-go,.j-go,.ct-ic') && txt(x)).map(inl).filter((s) => s.trim());
    const link = el.matches('a[href]') ? el.getAttribute('href') : (el.querySelectorAll('a[href]').length === 1 || el.querySelector('a.j-go')) ? (el.querySelector('a.j-go') || el.querySelector('a[href]')).getAttribute('href') : '';
    return { t: 'tile', n: n ? txt(n) : '', k: kick && kick !== h ? txt(kick) : '', h: inl(h), p: rest.join('<br>'), img: im ? (im.currentSrc || im.getAttribute('src') || im.dataset.src) : '', href: link };
  }
  function harvest(src) {
    const pg = { kick: '', title: '', aside: '', ctas: [], chips: [], secs: [] };
    let sec = null, kick = '', pend = '';
    const open = (id) => { sec = { kick: '', title: '', id: id || '', blocks: [] }; pg.secs.push(sec); };
    const blocks = () => { if (!sec) open(pend); return sec.blocks; };
    const started = () => pg.secs.some((s) => s.title || s.blocks.length);
    const push = (b) => {
      const bl = blocks(), last = bl[bl.length - 1];
      if (b.t === 'tile' || b.t === 'prod') { const g = b.t === 'tile' ? 'tiles' : 'prods'; if (last && last.t === g) last.items.push(b); else bl.push({ t: g, items: [b] }); }
      else if (b.t === 'cta') { if (last && last.t === 'ctas') last.items.push(b); else bl.push({ t: 'ctas', items: [b] }); }
      else bl.push(b);
    };
    const live = (c) => /^(FORM|FIELDSET|SELECT|INPUT|TEXTAREA)$/.test(c.tagName) || c.matches('.sl-vote') || (c.querySelector('input,select,textarea') && !c.querySelector('h1,h2,section,article'));
    function walk(el) {
      for (const c of [...el.children]) {
        if (skip(c)) continue;
        const t = c.tagName;
        if (c.id) pend = c.id;
        if (t === 'SECTION' || c.matches('.clause')) { if (!sec || sec.title || sec.blocks.length) open(c.id); else if (c.id) sec.id = c.id; walk(c); continue; }
        const p = (t === 'ARTICLE' || c.matches('.card')) && prodOf(c);
        if (p) { push({ t: 'prod', id: p.id }); continue; }
        if (t === 'H1' && !pg.title) { pg.title = inl(c).trim(); pg.kick = kick || (sec && !sec.title && !sec.blocks.length ? sec.kick : ''); if (sec && !sec.title && !sec.blocks.length) sec.kick = ''; kick = ''; continue; }
        if (/^H[12]$/.test(t)) { if (!sec || sec.title || sec.blocks.length) open(pend); sec.title = inl(c).trim(); sec.kick = kick || sec.kick; if (!sec.id) sec.id = c.id || pend; kick = ''; pend = ''; continue; }
        if (isKick(c)) { const k = txt(c); if (sec && !sec.title && !sec.blocks.length) sec.kick = k; else kick = k; continue; }
        if (live(c)) { c.querySelectorAll('.rv').forEach((x) => x.classList.remove('rv', 'pre')); push({ t: 'node', el: c }); continue; }
        if (t === 'P' || (t === 'DIV' && c.matches('.aside,.lede'))) {
          const h = inl(c).trim(); if (!h) continue;
          if (pg.title && !pg.aside && !started() && h.length < 420) { pg.aside = h; continue; }
          push({ t: 'p', h, big: c.matches('.big,.st-big,.lede,.ab-line') }); continue;
        }
        if (t === 'A' && c.matches('.btn,.link,.j-go')) { const b = { t: 'cta', h: c.getAttribute('href') || '#', l: txt(c).replace(/[→←]/g, '').trim(), ghost: !c.matches('.volt') }; if (!b.l) continue; if (!started()) pg.ctas.push(b); else push(b); continue; }
        if (t === 'NAV' || (c.querySelectorAll(':scope > a[href^="#"]').length >= 3)) {
          const as = [...c.querySelectorAll('a[href]')];
          if (as.length && as.every((a) => (a.getAttribute('href') || '').startsWith('#'))) { pg.chips = as.map((a) => ({ h: a.getAttribute('href'), l: txtS(a) })); continue; }
          if (as.length) { as.forEach((a) => push({ t: 'cta', h: a.getAttribute('href'), l: txt(a), ghost: true })); continue; }
        }
        if (t === 'UL' || t === 'OL') {
          const lis = [...c.children].filter((li) => li.tagName === 'LI' && !skip(li));
          if (lis.some((li) => prodOf(li))) { lis.forEach((li) => { const q = prodOf(li); if (q) push({ t: 'prod', id: q.id }); }); continue; }
          if (lis.length && lis.every((li) => tileOf(li) && li.children.length > 1)) { lis.forEach((li) => push(tileOf(li))); continue; }
          if (lis.length && lis.every((li) => li.children.length === 1 && li.firstElementChild.tagName === 'A' && txt(li) === txt(li.firstElementChild))) { lis.forEach((li) => push({ t: 'cta', h: li.firstElementChild.getAttribute('href'), l: txt(li), ghost: true })); continue; }
          push({ t: 'list', ordered: t === 'OL', items: lis.map((li) => inl(li).trim()).filter(Boolean) }); continue;
        }
        if (t === 'TABLE') { push({ t: 'table', rows: [...c.rows].map((r) => [...r.cells].map((x) => ({ h: x.tagName === 'TH', v: inl(x).trim() }))) }); continue; }
        if (t === 'BLOCKQUOTE') { const ci = c.querySelector('cite'); push({ t: 'quote', h: inl(c.querySelector('p') || c).replace(ci ? esc(txt(ci)) : '\u0000', '').trim(), cite: txt(ci) }); continue; }
        if (t === 'DETAILS') { const s = c.querySelector('summary'); const box = document.createElement('div'); [...c.children].forEach((x) => { if (x !== s) box.appendChild(x.cloneNode(true)); }); const sub = harvest(box); push({ t: 'acc', s: txt(s), blocks: sub.secs.reduce((a, x) => a.concat(x.title ? [{ t: 'h3', h: x.title }] : [], x.blocks), []).concat(sub.aside ? [{ t: 'p', h: sub.aside }] : []) }); continue; }
        if (t === 'IMG') { const s = c.currentSrc || c.getAttribute('src') || c.dataset.src; if (s && !/\.svg/.test(s)) push({ t: 'img', src: s, alt: c.alt || '' }); continue; }
        if (t === 'H3' || t === 'H4' || t === 'H5') { push({ t: 'h3', h: inl(c).trim() }); continue; }
        if (t === 'HR') continue;
        const tile = /^(DIV|LI|ARTICLE|A)$/.test(t) && !c.querySelector('h1,h2:not(:only-of-type)') && tileOf(c);
        if (tile && (c.querySelectorAll('h2').length === 0 || t === 'ARTICLE')) { push(tile); continue; }
        if (t === 'A') { const l = txt(c); if (l) push({ t: 'cta', h: c.getAttribute('href') || '#', l, ghost: true }); continue; }
        const kids = [...c.children], linkRow = kids.length > 1 && kids.every((k) => k.tagName === 'A'), richLink = kids.some((k) => k.tagName === 'A' && (k.matches('.btn,.link') || k.children.length > 1));
        if (!linkRow && !richLink && (!c.children.length || [...c.childNodes].every((n) => n.nodeType === 3 || /^(A|B|STRONG|EM|I|BR|SPAN|SMALL|S|CODE|TIME)$/.test(n.tagName)))) {
          const h = inl(c).trim(); if (!h) continue;
          if (t === 'SPAN' && h.length < 40 && !c.querySelector('a')) { kick = h; continue; }
          if (pg.title && !pg.aside && !started() && h.length < 420) { pg.aside = h; continue; }
          push({ t: 'p', h }); continue;
        }
        walk(c);
      }
    }
    walk(src);
    pg.secs = pg.secs.filter((s) => s.title || s.blocks.length);
    pg.secs.forEach((s) => { if (!s.title && s.kick) { s.title = esc(s.kick); s.kick = ''; } });
    return pg;
  }
  function blocksHtml(bl, nodes) {
    return bl.map((b) => {
      if (b.t === 'p') return `<p${b.big ? ' class="big"' : ''}>${b.h}</p>`;
      if (b.t === 'h3') return `<h3>${b.h}</h3>`;
      if (b.t === 'list') return `<${b.ordered ? 'ol' : 'ul'} class="pg-list">${b.items.map((i) => `<li>${i}</li>`).join('')}</${b.ordered ? 'ol' : 'ul'}>`;
      if (b.t === 'tiles') {
        const short = b.items.length > 1 && b.items.every((x) => !x.img && (x.h + x.p).length < 110);
        return `<div class="pg-tiles${short && b.items.length % 2 === 0 ? ' two' : ''}">${b.items.map((x, i) => { const tag = x.href ? 'a' : 'div'; return `<${tag} class="pg-tile${x.img ? ' has-img' : ''}"${x.href ? ` href="${esc(x.href)}"${/^https?:/i.test(x.href) && !x.href.includes(location.host) ? ' target="_blank" rel="noopener"' : ''}` : ''} style="--tn:${tn(i + 1)}">${x.img ? `<img src="${esc(x.img)}" alt="" loading="lazy">` : ''}${x.n ? `<em>${esc(x.n)}</em>` : ''}${x.k ? `<small class="k">${esc(x.k)}</small>` : ''}<b>${x.h}</b>${x.p ? `<span>${x.p}</span>` : ''}${x.href ? `<i class="go">${ic('arrow')}</i>` : ''}</${tag}>`; }).join('')}</div>`;
      }
      if (b.t === 'prods') return `<div class="m-grid pg-grid">${b.items.map((x) => card(API.prod(x.id), false)).join('')}</div>`;
      if (b.t === 'ctas') return `<div class="pg-ctas">${b.items.map((x, i) => `<a class="${i === 0 && !x.ghost ? 'm-cta' : 'm-ghost'}" href="${esc(x.h)}"${parse(x.h) ? ' data-m' : ''}>${esc(x.l)}</a>`).join('')}</div>`;
      if (b.t === 'table') return `<div class="pg-table" tabindex="0"><table>${b.rows.map((r) => `<tr>${r.map((c) => `<${c.h ? 'th' : 'td'}>${c.v}</${c.h ? 'th' : 'td'}>`).join('')}</tr>`).join('')}</table></div>`;
      if (b.t === 'quote') return `<blockquote class="pg-q">${b.h}${b.cite ? `<cite>${esc(b.cite)}</cite>` : ''}</blockquote>`;
      if (b.t === 'acc') return `<details class="pg-acc in"><summary><b>${esc(b.s)}</b>${ic('chev')}</summary><div>${blocksHtml(b.blocks, nodes)}</div></details>`;
      if (b.t === 'img') return `<img class="pg-img" src="${esc(b.src)}" alt="${esc(b.alt)}" loading="lazy">`;
      if (b.t === 'node') { nodes.push(b.el); return `<div class="pg-node" data-node="${nodes.length - 1}"></div>`; }
      return '';
    }).join('');
  }
  V.page = function () {
    const src = document.getElementById('app'); if (!src) return;
    const page = document.body.dataset.page || 'page';
    const pg = harvest(src);
    const words = pg.secs.reduce((a, s) => a + s.blocks.reduce((x, b) => x + JSON.stringify(b.h || b.items || '').length, 0), 0);
    const fold = !/^(manifesto|about|giving|gifts|offers|feed)$/.test(page) && pg.secs.length >= 4 && words > 2400;
    const nodes = [];
    const cut = CUTS[[...location.pathname].reduce((a, ch) => a + ch.charCodeAt(0), 0) % CUTS.length];
    const plain = (pg.title || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    state.pageTitle = PAGE_T[page] || plain.split(/[.:]/)[0].slice(0, 30) || 'DAUR Supply';
    const hi = [...location.pathname].reduce((a, ch) => a + ch.charCodeAt(0), 0);
    view.innerHTML = `<div class="m-pg">
      <section class="pg-hero" style="--tn:${tn(hi)};--tn2:${tn(hi + 2)}"><img class="pg-cut" src="${asset('m-' + cut + '.webp')}" alt=""><span class="pg-blob" aria-hidden="true"></span>
        ${pg.kick ? `<span class="m-kick">${esc(pg.kick)}</span>` : ''}<h1>${pg.title || esc(state.pageTitle)}</h1>${pg.aside ? `<p>${pg.aside}</p>` : ''}
        ${pg.ctas.length ? `<div class="pg-ctas">${pg.ctas.slice(0, 2).map((x, i) => `<a class="${i === 0 ? 'm-cta' : 'm-ghost'}" href="${esc(x.h)}"${parse(x.h) ? ' data-m' : ''}>${esc(x.l)}</a>`).join('')}</div>` : ''}</section>
      ${pg.chips.length ? `<div class="m-pills pg-chips">${pg.chips.map((c) => `<a class="m-pill alt" href="${esc(c.h)}" data-jump="${esc(c.h.slice(1))}">${esc(c.l)}</a>`).join('')}</div>` : ''}
      ${pg.secs.map((s, i) => fold
        ? `<details class="pg-sec pg-acc"${s.id ? ` id="${esc(s.id)}"` : ''}${i === 0 ? ' open' : ''} style="--tn:${tn(i)}"><summary><span>${s.kick ? `<small>${esc(s.kick)}</small>` : ''}<b>${s.title || 'More'}</b></span>${ic('chev')}</summary><div>${blocksHtml(s.blocks, nodes)}</div></details>`
        : `<section class="pg-sec${i % 3 === 1 ? ' tint' : ''}"${s.id ? ` id="${esc(s.id)}"` : ''} style="--tn:${tn(i)}">${s.kick ? `<span class="m-kick">${esc(s.kick)}</span>` : ''}${s.title ? `<h2>${s.title}</h2>` : ''}${blocksHtml(s.blocks, nodes)}</section>`).join('')}
      <div class="pg-help"><a href="https://wa.me/${esc(C.whatsapp || '')}" target="_blank" rel="noopener">${ic('chat')}<span><b>Questions?</b><small>WhatsApp ${esc(String(C.whatsapp || '').replace(/^92/, '0').replace(/(\d{4})(\d{7})/, '$1 $2'))}</small></span>${ic('arrow')}</a></div>
    </div>`;
    nodes.forEach((n, i) => { const ph = view.querySelector(`[data-node="${i}"]`); if (ph) ph.appendChild(n); });
    $$('img', view).forEach((im) => im.addEventListener('error', () => { im.style.display = 'none'; }, { once: true }));
    observeIn();
    if (location.hash) { const t = document.getElementById(decodeURIComponent(location.hash.slice(1))); if (t && view.contains(t)) { if (t.tagName === 'DETAILS') t.open = true; setTimeout(() => t.scrollIntoView({ block: 'start' }), 60); } }
  };

  /* ---------- navigation ---------- */
  function render(dir) {
    const old = $('#mBuy'); if (old) old.remove();
    H.classList.toggle('m-pdp-on', cur.v === 'product');
    H.dataset.mv = cur.v;
    view.className = 'm-view v-' + cur.v;
    const fn = V[cur.v] || V.page;
    if (cur.v !== 'shop' || !view.querySelector('.m-search')) view.innerHTML = '';
    fn();
    if (dir) { view.classList.remove('m-in', 'm-back'); void view.offsetWidth; view.classList.add(dir === 'back' ? 'm-back' : 'm-in'); }
    paintTop(); paintTab();
  }
  function go(u, push) {
    const r = parse(u);
    if (!r) { location.href = u; return; }
    const same = r.v === cur.v && r.a === cur.a;
    if (r.v !== cur.v && r.v === 'shop') state.q = r.q != null ? r.q : null;
    if (r.v === 'shop') state.shopCat = r.a;
    cur = r;
    if (push !== false && !same) history.pushState({ m: 1 }, '', u);
    if (r.v === 'shop' && view.querySelector('.m-search') && same) { V.shop(); return; }
    if (r.v !== 'shop') view.innerHTML = '';
    const run = () => { render(push === false ? 'back' : 'in'); window.scrollTo(0, 0); };
    if (document.startViewTransition && !reduce) { const vt = document.startViewTransition(run); ['ready', 'finished', 'updateCallbackDone'].forEach((k) => vt[k] && vt[k].catch(() => {})); } else run();
    const t = { home: 'DAUR Supply', shop: 'Shop | DAUR Supply' }[r.v] || (TITLE[r.v] ? TITLE[r.v] + ' | DAUR Supply' : '');
    if (t) document.title = t; else if (r.v === 'product') document.title = API.prod(r.a).name + ' | DAUR Supply';
  }
  window.addEventListener('popstate', () => { const r = parse(location.href); if (r) { cur = r; render('back'); } else location.reload(); });

  /* ---------- sheets and toast ---------- */
  function openSheet(html) { sheet.innerHTML = '<div class="m-grab"></div>' + html; sheet.classList.add('on'); scrim.classList.add('on'); }
  function closeSheet() { sheet.classList.remove('on'); scrim.classList.remove('on'); }
  scrim.addEventListener('click', closeSheet);
  let sy = null;
  sheet.addEventListener('touchstart', (e) => { sy = sheet.scrollTop <= 0 ? e.touches[0].clientY : null; }, { passive: true });
  sheet.addEventListener('touchmove', (e) => { if (sy != null && e.touches[0].clientY - sy > 70) { sy = null; closeSheet(); } }, { passive: true });
  let tt;
  function toast(msg, action, url) {
    toastEl.innerHTML = `<span>${esc(msg)}</span>` + (action ? `<a href="${url}" data-m>${esc(action)}</a>` : '');
    toastEl.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => toastEl.classList.remove('on'), 2800);
  }
  function menu() {
    const L = (h, i, t, cls) => `<a class="${cls || ''}" href="${h}"${parse(h) ? ' data-m' : ''}>${ic(i)}<span>${t}</span></a>`;
    openSheet(`<div class="m-row m-menu-h">${logo(true)}<span class="m-mute">Lahore · Sialkot · Kasur</span></div>
      <div class="m-menu">${L(href.shop(), 'search', 'Shop all', 'wide')}${hasSale() ? L(href.shop('Sale'), 'tag', 'Sale') : ''}${L(href.offers, 'wallet', 'Offers')}${L(href.gifts, 'gift', 'Gifts')}${L(href.giving, 'hand', 'Give a pair', 'give')}${L(root + '/pages/track', 'truck', 'Track order')}${L(root + '/pages/manifesto', 'story', 'Our story')}${L(href.feed, 'camera', 'The Feed')}${L(root + '/blogs/journal', 'book', 'Journal')}${L(root + '/pages/contract', 'shield', 'Our promise')}${L(root + '/pages/policies', 'note', 'Policies')}${L(root + '/pages/contact', 'chat', 'Contact')}${L(S.routes.account || root + '/account', 'user', 'Account')}</div>
      <a class="m-classic" href="${location.pathname}?view=classic">Open the full website</a>`);
  }
  function walletSheet() {
    openSheet(`<div class="m-wsheet"><div class="of-wallet sm"><span class="b-dm">${DMARK}</span><span class="m-kick">${ic('wallet')}Your wallet</span><b class="of-amt">${esc(fmt(W.amt))}</b><small>Ready for your first order</small></div>
      <p>It comes off your total at checkout. One wallet per customer.</p>
      <a class="m-cta" href="${href.shop()}" data-m>Use it now</a></div>`);
  }
  function quick(pid, mode) {
    const p = API.prod(pid); if (!p) return;
    state.qp = pid; state.qv = firstV(p).id; state.qs = null; state.qm = mode || 'me'; paintQuick();
  }
  function paintQuick() {
    const p = API.prod(state.qp), v = API.variant(p, state.qv), x = pic(p, v), give = state.qm === 'give';
    const label = give ? 'Give this pair' : !state.qs ? 'Pick your size' : (state.qm === 'gift' ? 'Add as gift' : 'Add to bag') + ' · EU ' + state.qs;
    openSheet(`<div class="m-qa"><span class="q-img" style="--tn:${TINT[tintOf(p)]}"><img class="${x.cut ? '' : 'blend'}" src="${esc(x.src)}" alt=""></span><span class="q-t">${state.qm !== 'me' ? `<span class="ln-tag${give ? ' g' : ''}">${ic(give ? 'hand' : 'gift')}${give ? 'Giving' : 'Gift'}</span>` : ''}<b>${esc(p.name)}</b><span class="m-mute">${esc(v.color)}</span><b>${esc(fmt(v.price))}</b></span></div>
      ${p.variants.length > 1 ? `<div class="m-cols" style="margin-top:16px">${p.variants.map((y, i) => { const z = pic(p, y); return `<button class="m-col" type="button" data-qv="${esc(y.id)}" aria-pressed="${y.id === v.id}" aria-label="${esc(y.color)}" style="--tn:${tn(tintOf(p) + i)}"><img class="${z.cut ? '' : 'blend'}" src="${esc(z.src)}" alt=""></button>`; }).join('')}</div>` : ''}
      ${give ? `<p class="m-modenote g" style="margin-top:16px">${ic('hand')}<span>We match the size to the person and send you a private photo after the handover.</span></p>`
        : `<h3 class="q-h">Size (EU)</h3><div class="m-sizes">${p.sizes.map((s) => { const q = (v.stock || {})[s] || 0; return `<button class="m-size" type="button" data-qs="${esc(s)}" aria-pressed="${state.qs == s}"${q > 0 ? '' : ' disabled'}>${esc(s)}</button>`; }).join('')}</div>`}
      <button class="m-cta wide${give ? ' give' : ''}" type="button" data-qadd aria-disabled="${!give && !state.qs}"><span>${esc(label)}</span></button>`);
  }
  // a pair for someone in need is reserved in the size we hold most of; DAUR swaps it to the right size before the handover
  const giveSize = (v) => { const s = Object.keys(v.stock || {}).sort((a, b) => (v.stock[b] || 0) - (v.stock[a] || 0))[0]; return s && v.stock[s] > 0 ? +s : null; };
  function add(pid, vid, size, mode) {
    mode = mode || 'me';
    const p = API.prod(pid), v = API.variant(p, vid), cart = API.cart;
    if (mode === 'give') size = giveSize(v);
    if (size == null) { toast('This pair is sold out right now'); return false; }
    const max = (v.stock || {})[size] || 0, ex = cart.find((l) => l.pid === pid && l.vid === v.id && l.size == size && (l.mode || 'me') === mode);
    const used = cart.filter((l) => l.pid === pid && l.vid === v.id && l.size == size).reduce((a, l) => a + l.qty, 0);
    if (used >= max) { toast(mode === 'give' ? 'This pair is sold out right now' : 'No more stock in EU ' + size); return false; }
    if (ex) ex.qty += 1; else cart.push(Object.assign({ pid, vid: v.id, size: +size, qty: 1 }, mode !== 'me' ? { mode } : {}));
    store.set('cart', cart);
    try { navigator.vibrate && navigator.vibrate(12); } catch (e) { /* no vibration */ }
    paintTab(); paintTop();
    const b = $('.t-bag', tab); if (b) { b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); }
    toast(mode === 'give' ? p.name + ', to give. Thank you.' : p.name + (mode === 'gift' ? ' as a gift' : ', EU ' + size) + ' added', 'View bag', href.bag);
    return true;
  }

  /* ---------- checkout: the bag goes to Shopify, with the wallet or one code applied ---------- */
  async function checkout(btn) {
    const cart = API.cart; if (!cart.length) return;
    const items = cart.map((l) => {
      const p = API.prod(l.pid), v = p && API.variant(p, l.vid), id = v && v.sid && v.sid[l.size]; if (!id) return null;
      const properties = l.mode === 'give' ? { Giving: 'A pair for someone in need', Size: 'Matched by DAUR to the person' } : l.mode === 'gift' ? { Gift: 'Yes' } : undefined;
      return properties ? { id, quantity: l.qty, properties } : { id, quantity: l.qty };
    }).filter(Boolean);
    const code = W.on() ? W.code : CODE.get() || API.coupon || '';
    const lbl = btn && btn.querySelector('span');
    if (btn) { btn.setAttribute('aria-disabled', 'true'); if (lbl) lbl.textContent = 'Opening checkout'; }
    const reset = () => { if (btn) { btn.removeAttribute('aria-disabled'); if (lbl) lbl.textContent = 'Checkout'; } };
    const J = { 'Content-Type': 'application/json', Accept: 'application/json' };
    try {
      await fetch(root + '/cart/clear.js', { method: 'POST', headers: { Accept: 'application/json' } });
      const r = await fetch(root + '/cart/add.js', { method: 'POST', headers: J, body: JSON.stringify({ items }) });
      if (!r.ok) { const e = await r.json().catch(() => ({})); toast(e.description || 'A size in your bag just sold out.'); reset(); return; }
      const g = GIFT.get(), gift = cart.some((l) => l.mode === 'gift'), giving = cart.some((l) => l.mode === 'give' || (API.prod(l.pid) || {}).giving);
      const attributes = { 'Slice cause': window.DAUR_SLICE_VOTE ? window.DAUR_SLICE_VOTE() : '', 'Giving pair': giving ? 'Yes, paid in full in advance. Size matched by DAUR. Private proof after handover' : '', Gift: gift ? 'Yes, paid in full in advance' : '', 'Gift packing': gift && g.pack ? 'Requested' : '', 'Gift for': gift ? String(g.to || '').slice(0, 40) : '', 'Gift note': gift ? String(g.note || '').slice(0, 240) : '', 'Opened in': 'Mobile app' };
      await fetch(root + '/cart/update.js', { method: 'POST', headers: J, body: JSON.stringify({ attributes, discount: code }) });
      location.href = code ? root + '/discount/' + encodeURIComponent(code) + '?redirect=' + encodeURIComponent(root + '/checkout') : root + '/checkout';
    } catch (e) { toast('Checkout could not open. Please try again.'); reset(); }
  }

  /* ---------- one listener for every tap ---------- */
  app.addEventListener('click', (e) => {
    const t = e.target.closest('a,button,summary'); if (!t) return;
    const d = t.dataset;
    if (d.jump !== undefined) { e.preventDefault(); const el = document.getElementById(d.jump || (t.getAttribute('href') || '').slice(1)); if (el) { if (el.tagName === 'DETAILS') el.open = true; el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); } return; }
    if (t.tagName === 'A' && d.m !== undefined) { e.preventDefault(); closeSheet(); go(t.getAttribute('href')); return; }
    if (t.tagName === 'A' && view.contains(t) && /^#./.test(t.getAttribute('href') || '')) { const el = document.getElementById(t.getAttribute('href').slice(1)); if (el) { e.preventDefault(); if (el.tagName === 'DETAILS') el.open = true; el.scrollIntoView({ behavior: 'smooth', block: 'start' }); } return; }
    if (d.menu !== undefined) return menu();
    if (d.back !== undefined) { if (history.state && history.state.m) history.back(); else if (document.referrer && new URL(document.referrer).origin === location.origin && history.length > 1) history.back(); else go(href.home); return; }
    if (d.wallet !== undefined) return walletSheet();
    if (d.wish) { e.preventDefault(); API.toggleWish(d.wish); const on = wished(d.wish); $$(`[data-wish="${d.wish}"]`).forEach((b) => b.setAttribute('aria-pressed', on)); toast(on ? 'Saved to Liked' : 'Removed from Liked', on ? 'See all' : '', href.liked); if (cur.v === 'liked' && !on) render(); return; }
    if (d.quick) { e.preventDefault(); return quick(d.quick, d.mode); }
    if (d.hcat) { state.homeCat = d.hcat; V.home(); return; }
    if (d.scat) { state.shopCat = d.scat; history.replaceState({ m: 1 }, '', href.shop(d.scat)); V.shop(); return; }
    if (d.pmode) { state.mode = d.pmode; V.product(); return; }
    if (d.pv) { state.pv = d.pv; const p = API.prod(state.pid), v = API.variant(p, d.pv); if (state.size && !((v.stock || {})[state.size] > 0)) state.size = null; V.product(); return; }
    if (d.size) { state.size = d.size; $$('.m-size', view).forEach((b) => b.setAttribute('aria-pressed', b.dataset.size === d.size)); const p = API.prod(state.pid); paintBuy(p, API.variant(p, state.pv)); return; }
    if (d.more !== undefined) { state.more = !state.more; V.product(); return; }
    if (d.notes !== undefined) { const s = $('#mNotes'); if (s) s.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
    if (d.add !== undefined) {
      if (state.mode !== 'give' && !state.size) { const s = $('.m-sizes', view); if (s) { s.scrollIntoView({ behavior: 'smooth', block: 'center' }); s.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }], { duration: 260 }); } return; }
      if (add(state.pid, state.pv, state.size, state.mode) && state.mode === 'give') burst(t); return;
    }
    if (d.qv) { state.qv = d.qv; state.qs = null; paintQuick(); return; }
    if (d.qs) { state.qs = d.qs; paintQuick(); return; }
    if (d.qadd !== undefined) { if (state.qm !== 'give' && !state.qs) return; if (add(state.qp, state.qv, state.qs, state.qm)) { if (state.qm === 'give') burst(t); closeSheet(); } return; }
    if (d.qty) { const l = API.cart[+d.qty]; if (!l) return; const p = API.prod(l.pid), v = API.variant(p, l.vid), max = (v.stock || {})[l.size] || 0; const others = API.cart.filter((x) => x !== l && x.pid === l.pid && x.vid === l.vid && x.size == l.size).reduce((a, x) => a + x.qty, 0); l.qty += +d.d; if (l.qty + others > max) { l.qty = Math.max(0, max - others); toast('No more stock in this size'); } if (l.qty <= 0) API.cart.splice(+d.qty, 1); store.set('cart', API.cart); V.bag(); paintTab(); paintTop(); return; }
    if (d.wtoggle !== undefined) { W.set(!W.on()); if (cur.v === 'bag') V.bag(); else if (cur.v === 'offers') V.offers(); toast(W.on() ? fmt(W.amt) + ' goes to your next checkout' : 'Wallet saved for later'); return; }
    if (d.uncode !== undefined) { CODE.set(''); V.bag(); return; }
    if (d.code) { const on = CODE.get() === d.code && !W.on(); CODE.set(on ? '' : d.code); V.offers(); toast(on ? 'Code removed' : d.code + ' goes to your checkout. Wallet saved for later.'); return; }
    if (d.copy) { const c = d.copy; const ok = () => toast(c + ' copied'); if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(c).then(ok, ok); else ok(); return; }
    if (d.vote) { const on = t.getAttribute('aria-pressed') === 'true'; store.set('sliceVote', on ? '' : d.vote); $$('[data-vote]', view).forEach((b) => b.setAttribute('aria-pressed', !on && b.dataset.vote === d.vote)); if (!on) toast('Vote saved: ' + d.vote); return; }
    if (d.gpack !== undefined) { const g = GIFT.get(); g.pack = !g.pack; GIFT.set(g); t.setAttribute('aria-pressed', g.pack); return; }
    if (d.gp) { state.gp = d.gp; const y = window.scrollY; V.giving(); window.scrollTo(0, y); return; }
    if (d.share) { const p = API.prod(d.share); const u = location.origin + href.product(p.id); if (navigator.share) navigator.share({ title: p.name, url: u }).catch(() => {}); else if (navigator.clipboard) navigator.clipboard.writeText(u).then(() => toast('Link copied')); return; }
    if (d.checkout !== undefined) { checkout(t); return; }
  });

  /* ---------- welcome: once a session, on the first page a visitor opens ---------- */
  function splash() {
    let seen = false; try { seen = sessionStorage.getItem('daur.mSplash') === '1'; sessionStorage.setItem('daur.mSplash', '1'); } catch (e) { seen = true; }
    if (seen || M.splash === false || cur.v !== 'home') return;
    document.body.insertAdjacentHTML('beforeend', `<div class="m-splash" id="mSplash" role="dialog" aria-label="Welcome to DAUR Supply">
      <span class="s-ring"></span><span class="s-ring r2"></span><span class="s-wm">${WORDMARK}<small>SUPPLY</small></span>
      <img class="s-img" src="${asset('m-hero.webp')}" alt="">
      <span class="s-live"><i></i>${esc(M.splashTag || 'Drop 01 is live')}</span>
      <h1>Aik naya daur.</h1><p>From ${esc(fmt(minP()))} · ${esc(delTxt())} · ${C.exchangeDays || 5} day size swap</p>
      <span class="s-notch"></span><button class="s-go" type="button" aria-label="Enter the store">${ic('arrow', 2.2)}</button>
      ${W.code ? `<span class="s-wallet">${ic('wallet')}${esc(fmt(W.amt))} is waiting in your wallet</span>` : ''}</div>`);
    const s = $('#mSplash');
    const out = () => { s.classList.add('out'); setTimeout(() => s.remove(), 600); };
    s.querySelector('.s-go').addEventListener('click', out);
    let y0 = null;
    s.addEventListener('touchstart', (e) => { y0 = e.touches[0].clientY; }, { passive: true });
    s.addEventListener('touchmove', (e) => { if (y0 != null && y0 - e.touches[0].clientY > 60) { y0 = null; out(); } }, { passive: true });
  }

  /* ---------- start ---------- */
  render();
  splash();
  // a page the storefront draws a moment later (a slow answer from the store) is read again once it changes
  if (cur.v === 'page' && 'MutationObserver' in window) {
    const src = document.getElementById('app');
    let tm; const mo = new MutationObserver(() => { clearTimeout(tm); tm = setTimeout(() => { if (src.querySelector('h1,h2,p')) { mo.disconnect(); render(); } }, 120); });
    if (src) { mo.observe(src, { childList: true }); setTimeout(() => mo.disconnect(), 4000); }
  }
  // the clear top bar over a photo turns solid once the page scrolls under it
  let sol = false;
  const solid = () => { const v = window.scrollY > 40; if (v !== sol) { sol = v; top.classList.toggle('solid', v); } };
  window.addEventListener('scroll', solid, { passive: true }); solid();
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { paintTab(); paintTop(); if (cur.v === 'bag') V.bag(); } });
})();
