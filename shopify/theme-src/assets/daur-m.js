/* DAUR mobile app layer.
   On screens up to 900px wide the store opens as an app: its own top bar, bottom tab bar, cards, product page and bag.
   It reads the same catalog and the same bag as the desktop storefront (window.DAUR_API), so nothing is kept twice.
   Desktop is never touched: everything here starts only when html.m-on is set by the head script. */
(function () {
  'use strict';
  const H = document.documentElement;
  if (!H.classList.contains('m-on')) return;
  const API = window.DAUR_API, M = window.DAUR_M || {};
  if (!API) { H.classList.remove('m-on'); return; }
  const C = API.C, esc = API.esc, fmt = API.fmt, store = API.store;
  const root = (window.DAUR_SHOPIFY && window.DAUR_SHOPIFY.routes.root || '/').replace(/\/$/, '');
  const asset = (f) => (M.assets || '') + f;
  const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  /* ---------- test cutouts: free Unsplash photos with the background removed, matched to each pair ---------- */
  const CUT = {
    'moc-runner-v1': { 'triple-black': 'moc-runner', oxblood: 'moc-oxblood' },
    'phantom-trainer': { '*': 'phantom' }, 'grid-court-low': { '*': 'grid' }, 'unit-derby-02': { '*': 'derby' },
    'concrete-mid': { '*': 'concrete' }, 'volt-signal': { '*': 'volt' },
    'ward-chelsea': { 'black-waxed': 'ward-black', 'dark-brown': 'ward-brown' },
    'sector-slip': { '*': 'sector' }, 'saddle-tassel': { sand: 'saddle', black: 'saddle-black' }
  };
  const TINTS = ['var(--m-mint)', 'var(--m-sand)', 'var(--m-sky)', 'var(--m-stone)'];
  const TINT_HEX = ['#CFEBDD', '#F3E1C7', '#D3E3F4', '#ECEBE7'];
  const P = () => API.P.filter((p) => !p.hidden);
  const tintOf = (p) => { const i = API.P.indexOf(p); return i < 0 ? 0 : i % 4; };
  function pic(p, v) {
    const m = CUT[p.id];
    if (M.cutouts !== false && m) { const f = m[v.id] || m['*'] || Object.values(m)[0]; if (f) return { src: asset('m-' + f + '.webp'), cut: true }; }
    const s = v.images && v.images[0];
    if (s) return { src: /cdn\.shopify|\/cdn\/shop\//.test(s) ? s + (s.includes('?') ? '&' : '?') + 'width=640' : s, cut: false };
    return { src: asset('m-hero.webp'), cut: true };
  }
  const img = (p, v, cls, alt) => { const x = pic(p, v); return `<img class="${cls}${x.cut ? '' : ' blend'}" src="${esc(x.src)}" alt="${esc(alt == null ? p.name + ', ' + v.color : alt)}" loading="lazy" decoding="async">`; };
  const firstV = (p) => p.variants.find((v) => API.stockOf(v) > 0) || p.variants[0];
  const price = (v) => fmt(v.price) + (API.onSale(v) ? ` <s>${esc(NF(v.compareAt))}</s>` : '');
  const NF = (n) => new Intl.NumberFormat('en-US').format(Math.round(n));
  const notesFor = (pid) => (window.DAUR_FITNOTES || []).filter((n) => n.pid === pid);
  const allNotes = () => (window.DAUR_FITNOTES || []).length;
  const wished = (pid) => API.wish.includes(pid);

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
    shield: '<path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>'
  };
  const ic = (n, sw) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw || 2}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n]}</svg>`;

  /* ---------- wallet: every new visitor sees Rs 500 waiting; it goes to checkout as one discount code ---------- */
  const W = { code: String(M.walletCode || '').trim().toUpperCase(), amt: +M.walletAmount || 500 };
  W.on = () => !!W.code && store.get('mWallet', 'on') === 'on';
  W.set = (v) => store.set('mWallet', v ? 'on' : 'off');

  /* ---------- routes: real store addresses, drawn in place ---------- */
  const COL = { sneakers: 'Sneakers', 'leather-shoes': 'Leather', leather: 'Leather', casual: 'Hybrids', hybrids: 'Hybrids', sale: 'Sale' };
  function parse(u) {
    const url = new URL(u, location.href);
    if (url.origin !== location.origin) return null;
    if (/[?&]view=classic/.test(url.search)) return null;
    const p = url.pathname.replace(root, '') || '/';
    let m;
    if (p === '/' || p === '') return { v: 'home' };
    if ((m = p.match(/^\/collections\/([^/]+)\/?$/))) return { v: 'shop', a: COL[m[1]] || 'All' };
    if (/^\/collections\/?$/.test(p) || /^\/search/.test(p)) return { v: 'shop', a: 'All', q: url.searchParams.get('q') || '' };
    if ((m = p.match(/^\/products\/([^/]+)\/?$/)) && API.prod(m[1]) && !API.prod(m[1]).hidden) return { v: 'product', a: m[1] };
    if (/^\/cart\/?$/.test(p)) return { v: 'bag' };
    if (/^\/pages\/liked\/?$/.test(p)) return { v: 'liked' };
    return null;
  }
  const href = { home: root + '/', shop: (c) => !c || c === 'All' ? root + '/collections/all' : c === 'Sale' ? root + '/collections/sale' : root + '/collections/' + ({ Sneakers: 'sneakers', Leather: 'leather-shoes', Hybrids: 'casual' }[c] || 'all'), product: (h) => root + '/products/' + h, bag: root + '/cart', liked: root + '/pages/liked' };

  /* ---------- shell ---------- */
  const start = parse(location.href);
  const own = !!start;
  if (own) H.classList.add('m-own');
  document.body.insertAdjacentHTML('beforeend', `<div id="mApp">
    <header class="m-top" id="mTop"></header>
    <div class="m-view" id="mView"${own ? '' : ' hidden'}></div>
    <nav class="m-tab" id="mTab" aria-label="App"></nav>
    <div class="m-scrim" id="mScrim"></div>
    <div class="m-sheet" id="mSheet" role="dialog" aria-modal="true" aria-label="Panel"></div>
    <div class="m-toast" id="mToast" role="status" aria-live="polite"></div>
  </div>`);
  const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const view = $('#mView'), top = $('#mTop'), tab = $('#mTab'), sheet = $('#mSheet'), scrim = $('#mScrim'), toastEl = $('#mToast');
  let cur = start || { v: 'page' }, state = {};

  function paintTop() {
    const left = cur.v === 'home' || cur.v === 'shop' || cur.v === 'liked'
      ? `<button class="m-ib" type="button" data-menu aria-label="Open menu">${ic('menu')}</button>`
      : `<button class="m-ib ${cur.v === 'product' ? 'm-solid' : 'm-soft'}" type="button" data-back aria-label="Back">${ic('back', 2.2)}</button>`;
    const mid = cur.v === 'home' || cur.v === 'product' || cur.v === 'shop' || cur.v === 'liked' ? '<span class="m-wm" aria-label="DAUR Supply">DAUR</span>' : `<span class="m-top-t">${esc(cur.v === 'shop' ? 'Shop' : cur.v === 'bag' ? 'Your bag' : cur.v === 'liked' ? 'Liked' : (document.title.split('|')[0] || 'DAUR').trim())}</span>`;
    const right = W.code && !W.used() && cur.v !== 'product' && cur.v !== 'bag'
      ? `<button class="m-chip" type="button" data-wallet aria-label="Rs ${W.amt} in your wallet">${ic('wallet')}<span>${esc(fmt(W.amt))}</span></button>`
      : cur.v === 'product' ? `<a class="m-ib m-solid" href="${href.bag}" data-m aria-label="Bag">${ic('bag')}</a>` : '<span style="width:44px"></span>';
    top.innerHTML = left + mid + right;
    top.style.background = cur.v === 'product' ? 'transparent' : '';
    top.style.backdropFilter = top.style.webkitBackdropFilter = cur.v === 'product' ? 'none' : '';
  }
  W.used = () => false;
  function paintTab() {
    const n = API.cart.reduce((a, l) => a + l.qty, 0);
    const a = (v, h, icon, label) => `<a href="${h}" data-m aria-label="${label}"${cur.v === v ? ' aria-current="page"' : ''}>${ic(icon)}<i></i></a>`;
    tab.innerHTML = `<div class="t-row">${a('home', href.home, 'home', 'Home')}${a('shop', href.shop(), 'search', 'Shop and search')}<span></span>${a('liked', href.liked, 'heart', 'Liked')}<button class="t-btn" type="button" data-menu aria-label="Menu">${ic('grid')}<i></i></button></div>
      <a class="t-bag" href="${href.bag}" data-m aria-label="Bag, ${n} ${n === 1 ? 'pair' : 'pairs'}"${cur.v === 'bag' ? ' aria-current="page"' : ''}>${ic('bag')}<span class="t-n">${n || ''}</span></a>`;
    tab.classList.toggle('m-off', cur.v === 'product');
  }

  /* ---------- cards ---------- */
  function card(p, big) {
    const v = firstV(p), t = tintOf(p);
    const badge = API.onSale(v) ? `<span class="m-badge">${API.pct(v)}% off</span>` : '';
    const inner = `${img(p, v, 'c-img')}${big ? '' : badge}<span class="c-n">${esc(p.name)}</span><span class="c-t">${esc(p.category)}</span><span class="c-p">${price(v)}</span>`;
    return `<div class="${big ? 'm-card' : 'm-tile'}" style="background:${TINTS[t]}"><a href="${href.product(p.id)}" data-m aria-label="${esc(p.name + ', ' + p.category + ', ' + fmt(v.price))}" style="position:absolute;inset:0;border-radius:inherit"></a>${inner}
      <button class="m-heart" type="button" data-wish="${esc(p.id)}" aria-pressed="${wished(p.id)}" aria-label="Save ${esc(p.name)}">${ic('heart')}</button>
      <button class="m-plus" type="button" data-quick="${esc(p.id)}" aria-label="Quick add ${esc(p.name)}"><i>${ic('plus', 2.6)}</i></button></div>`;
  }
  function row(p) {
    const v = firstV(p), t = tintOf(p), x = pic(p, v);
    return `<a class="m-li" href="${href.product(p.id)}" data-m><span class="l-img" style="background:${TINTS[t]}"><img class="${x.cut ? '' : 'blend'}" src="${esc(x.src)}" alt="" loading="lazy"></span><span class="l-t"><b>${esc(p.name)}</b><small>${esc(p.category)} · EU ${esc(p.sizes[0])} to ${esc(p.sizes[p.sizes.length - 1])}</small></span><span class="l-p">${esc(fmt(v.price))}</span></a>`;
  }
  const cats = () => { const s = []; P().forEach((p) => { if (!s.includes(p.category)) s.push(p.category); }); return s; };
  const inCat = (p, c) => !c || c === 'All' || c === 'Popular' || (c === 'Sale' ? p.variants.some(API.onSale) : p.category === c);
  const pills = (list, on, attr, alt) => list.map((c) => `<button class="m-pill${alt ? ' alt' : ''}" type="button" ${attr}="${esc(c)}" aria-pressed="${c === on}">${esc(c)}</button>`).join('');

  /* ---------- views ---------- */
  const V = {};
  V.home = function () {
    const all = P();
    const hero = all.find((p) => p.variants.some(API.onSale) && CUT[p.id]) || all.find((p) => CUT[p.id]) || all[0];
    const hv = hero && firstV(hero);
    const c = state.homeCat || 'Popular';
    const list = all.filter((p) => inCat(p, c));
    const fresh = all.slice().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).filter((p) => p !== hero).slice(0, 3);
    const pc = cats().concat(all.some((p) => p.variants.some(API.onSale)) ? ['Sale'] : []);
    const notes = allNotes();
    view.innerHTML = `${hero ? `<a class="m-banner" href="${href.product(hero.id)}" data-m><span class="b-k">${esc(hero.tag || 'Drop 01')}</span><span class="b-n">${esc(hero.name)}</span><span class="b-go">Shop now</span><span class="b-p">${esc(fmt(hv.price))}${API.onSale(hv) ? `<s>${esc(NF(hv.compareAt))}</s>` : ''}</span>${img(hero, hv, '', hero.name)}</a>` : ''}
      <div class="m-pills" role="group" aria-label="Filter">${pills(['Popular'].concat(pc), c, 'data-hcat')}</div>
      <div class="m-car" aria-label="Pairs">${list.map((p) => card(p, true)).join('') || '<p class="m-mute m-pad">Nothing here yet.</p>'}</div>
      <div class="m-proof" aria-label="What you get"><span>${ic('truck')}${C.delivery.fee && !C.advance.freeAll() ? 'Delivery ' + esc(fmt(C.delivery.fee)) : 'Free delivery'}</span><span>${ic('swap')}${C.exchangeDays || 5} day size swap</span>${notes ? `<span>${ic('note')}${notes} fit notes</span>` : ''}<span>${ic('box')}${esc(C.delivery.days || '2 to 5 days')}</span></div>
      <div class="m-row m-pad" style="margin-top:22px"><h2 class="m-h2">Fresh in</h2><a class="m-link" href="${href.shop()}" data-m>See all</a></div>
      <div class="m-rows">${fresh.map(row).join('')}</div>`;
  };
  V.shop = function () {
    const c = state.shopCat || cur.a || 'All', q = (state.q != null ? state.q : cur.q || '').trim().toLowerCase();
    const list = P().filter((p) => inCat(p, c) && (!q || (p.name + ' ' + p.category + ' ' + p.variants.map((v) => v.color).join(' ')).toLowerCase().includes(q)));
    const pc = ['All'].concat(cats()).concat(P().some((p) => p.variants.some(API.onSale)) ? ['Sale'] : []);
    if (!view.querySelector('.m-search')) {
      view.innerHTML = `<div class="m-row m-pad"><h1 class="m-h1">Shop</h1><span class="m-mute" id="mCount"></span></div>
        <label class="m-search"><span class="m-sr">Search pairs</span>${ic('search')}<input type="search" id="mQ" placeholder="Search pairs" autocomplete="off" enterkeyhint="search" value="${esc(state.q != null ? state.q : cur.q || '')}"></label>
        <div class="m-pills" role="group" aria-label="Filter" id="mSPills"></div><div class="m-grid" id="mGrid"></div>`;
      $('#mQ').addEventListener('input', (e) => { state.q = e.target.value; V.shop(); });
    }
    $('#mSPills').innerHTML = pills(pc, c, 'data-scat', true);
    $('#mCount').textContent = list.length + (list.length === 1 ? ' pair' : ' pairs');
    $('#mGrid').innerHTML = list.map((p) => card(p, false)).join('') || '<p class="m-mute" style="grid-column:span 2">No pairs match. Try another word.</p>';
  };
  V.liked = function () {
    const list = API.wish.map(API.prod).filter((p) => p && !p.hidden);
    view.innerHTML = `<div class="m-pad"><h1 class="m-h1">Liked</h1></div>` + (list.length ? `<div class="m-grid">${list.map((p) => card(p, false)).join('')}</div>`
      : `<div class="m-empty"><img src="${asset('m-volt.webp')}" alt=""><b>Nothing liked yet</b><span class="m-mute">Tap the heart on any pair.</span><a class="m-cta" style="flex:none;width:200px;margin-top:10px" href="${href.shop()}" data-m>Shop now</a></div>`);
  };
  V.product = function () {
    const p = API.prod(cur.a); if (!p) return V.shop();
    if (!state.pv || state.pid !== p.id) { state.pid = p.id; state.pv = firstV(p).id; state.size = null; state.more = false; }
    const v = API.variant(p, state.pv), t = TINT_HEX[tintOf(p) % 4];
    const tint = p.variants.length > 1 ? TINT_HEX[(tintOf(p) + p.variants.indexOf(v)) % 4] : t;
    const notes = notesFor(p.id);
    const first = (p.description || '').split(/(?<=\.)\s/)[0] || '';
    const shots = (v.images || []).slice(0, 6);
    const low = C.lowStockAt || 2;
    const parts = p.name.split(' ');
    const name = parts.length > 1 ? esc(parts.slice(0, -1).join(' ')) + '<br>' + esc(parts[parts.length - 1]) : esc(p.name);
    const save = API.onSale(v) ? v.compareAt - v.price : 0;
    view.innerHTML = `<div class="m-pdp">
      <div class="p-bg1" style="background:${tint}"></div><div class="p-bg2" style="background:${tint}"></div><div class="p-bg3" style="background:${tint}"></div>
      <div class="p-head"><h1 class="p-n">${name}</h1><span class="p-t">${esc(p.category)}</span>${img(p, v, 'p-img')}</div>
      <div class="p-price"><small>Price</small><b>${esc(fmt(v.price))}</b>${save ? `<s>${esc(fmt(v.compareAt))}</s><br><span class="p-save">You keep ${esc(fmt(save))}</span>` : ''}</div>
      <div class="m-sec"><div class="m-row"><h3 style="margin:0">About</h3>${notes.length ? `<button class="m-more" type="button" data-notes style="color:var(--m-green);font-size:13px">${notes.length} fit ${notes.length === 1 ? 'note' : 'notes'}</button>` : ''}</div>
        <p style="margin-top:8px">${esc(state.more ? p.description : first)} ${p.description && p.description !== first || p.specs ? `<button class="m-more" type="button" data-more>${state.more ? 'Less' : 'More'}</button>` : ''}</p>
        ${state.more && p.specs ? `<ul class="m-specs">${Object.keys(p.specs).map((k) => `<li><span>${esc(k)}</span><b>${esc(p.specs[k])}</b></li>`).join('')}</ul>` : ''}</div>
      ${p.variants.length > 1 ? `<div class="m-sec"><h3>Colour <span class="m-colname">${esc(v.color)}</span></h3><div class="m-cols">${p.variants.map((x, i) => { const y = pic(p, x); return `<button class="m-col" type="button" data-pv="${esc(x.id)}" aria-pressed="${x.id === v.id}" aria-label="${esc(x.color)}" style="background:${TINT_HEX[(tintOf(p) + i) % 4]}"><img class="${y.cut ? '' : 'blend'}" src="${esc(y.src)}" alt=""></button>`; }).join('')}</div></div>` : ''}
      <div class="m-sec"><div class="m-row"><h3 style="margin:0">Size (EU)</h3><a class="m-link" href="${root}/pages/policies#size" style="min-height:0">Size guide</a></div>
        <div class="m-sizes" style="margin-top:10px">${p.sizes.map((s) => { const q = (v.stock || {})[s] || 0; return `<button class="m-size${q > 0 && q <= low ? ' low' : ''}" type="button" data-size="${esc(s)}" aria-pressed="${state.size == s}"${q > 0 ? '' : ' disabled'} aria-label="EU ${esc(s)}${q > 0 ? q <= low ? ', only ' + q + ' left' : '' : ', sold out'}">${esc(s)}</button>`; }).join('')}</div>
        ${state.size && (v.stock || {})[state.size] <= low ? `<p class="m-hint">Only ${(v.stock || {})[state.size]} left in EU ${esc(state.size)}</p>` : ''}
        ${C.whatsapp ? `<a class="m-wa" href="https://wa.me/${esc(C.whatsapp)}?text=${encodeURIComponent('Assalam o Alaikum DAUR, which size of ' + p.name + ' should I take?')}" target="_blank" rel="noopener">${ic('chat')}Not sure? Ask us on WhatsApp</a>` : ''}</div>
      ${shots.length ? `<div class="m-sec"><h3>Photos</h3><div class="m-shots">${shots.map((s, i) => `<img src="${esc(/cdn\.shopify|\/cdn\/shop\//.test(s) ? s + (s.includes('?') ? '&' : '?') + 'width=900' : s)}" alt="${esc(p.name + ', ' + v.color + ', photo ' + (i + 1))}" loading="lazy">`).join('')}</div></div>` : ''}
      ${notes.length ? `<div class="m-sec"><h3>Fit notes</h3><div class="m-shots">${notes.slice(0, 8).map((n) => `<div class="m-note"><span class="n-s" aria-label="${n.rating} of 5">${'★'.repeat(Math.max(1, Math.min(5, n.rating)))}</span>${n.title ? `<b>${esc(n.title)}</b>` : ''}<p>${esc(n.body)}</p><small>${esc(n.name)}${n.city ? ', ' + esc(n.city) : ''}${n.size ? ' · EU ' + esc(n.size) : ''}</small></div>`).join('')}</div></div>` : ''}
    </div>`;
    paintBuy(p, v);
  };
  function paintBuy(p, v) {
    let b = $('#mBuy');
    if (!b) { document.getElementById('mApp').insertAdjacentHTML('beforeend', '<div class="m-buy" id="mBuy"></div>'); b = $('#mBuy'); }
    const ok = !!state.size;
    b.innerHTML = `<span class="bb-l">${C.delivery.fee && !C.advance.freeAll() ? 'Delivery ' + esc(fmt(C.delivery.fee)) : 'Free delivery'} · ${esc(C.delivery.days || '2 to 5 days')}</span>
      <div class="bb-r"><button class="m-round" type="button" data-wish="${esc(p.id)}" aria-pressed="${wished(p.id)}" aria-label="Save to Liked">${ic('heart')}</button>
      <button class="m-cta" type="button" data-add aria-disabled="${!ok}">${ok ? 'Add to bag · EU ' + esc(state.size) : 'Pick your size'}</button></div>`;
  }
  V.bag = function () {
    const t = API.totals();
    if (!t.lines.length) {
      view.innerHTML = `<div class="m-empty" style="padding-top:60px"><img src="${asset('m-ward-brown.webp')}" alt=""><b>Your bag is empty</b><span class="m-mute">Pick a pair. Delivery is on us.</span><a class="m-cta" style="flex:none;width:200px;margin-top:10px" href="${href.shop()}" data-m>Shop now</a></div>`;
      return;
    }
    const wal = W.code ? W.on() : false;
    const off = wal ? Math.min(W.amt, t.subtotal) : (t.discount || 0);
    const total = Math.max(0, t.subtotal - off + (t.delivery || 0));
    const dep = C.advance && C.advance.deposits && C.advance.deposits() ? C.advance.due(total) : 0;
    view.innerHTML = `<div class="m-pad" style="display:flex;flex-direction:column;gap:12px">${t.lines.map((d, i) => {
      const x = pic(d.p, d.v), tt = TINT_HEX[tintOf(d.p)];
      return `<div class="m-line" style="background:${tt}"><a class="ln-img" href="${href.product(d.p.id)}" data-m><img class="${x.cut ? '' : 'blend'}" src="${esc(x.src)}" alt="${esc(d.p.name)}"></a>
        <div class="ln-t"><b>${esc(d.p.name)}</b><small>${esc(d.v.color)}${d.p.giving ? '' : ' · EU ' + esc(d.l.size)}</small><span class="ln-p">${esc(fmt(d.total))}</span></div>
        <div class="m-step"><button class="on" type="button" data-qty="${i}" data-d="1" aria-label="Add one">+</button><span>${d.l.qty}</span><button type="button" data-qty="${i}" data-d="-1" aria-label="${d.l.qty > 1 ? 'Remove one' : 'Remove pair'}">&#8722;</button></div></div>`;
    }).join('')}
      ${W.code ? `<button class="m-wallet" type="button" data-wtoggle aria-pressed="${wal}"><span class="w-i">${ic('wallet')}</span><span class="w-t"><b>${esc(fmt(W.amt))} in your wallet</b><small>${wal ? 'Used on this order' : 'Tap to use it before it goes'}</small></span><span class="m-sw" aria-hidden="true"></span></button>` : ''}
      <div class="m-sum"><div><span>Subtotal</span><span>${esc(fmt(t.subtotal))}</span></div>
        ${t.sale ? `<div><span>Sale saving</span><span class="s-g">${esc(fmt(t.sale))} kept</span></div>` : ''}
        ${off ? `<div><span>${wal ? 'Wallet' : 'Code'}</span><span class="s-g">${esc(fmt(off))} off</span></div>` : ''}
        <div><span>Delivery</span><span>${t.delivery ? esc(fmt(t.delivery)) : 'Free'}</span></div><hr><div class="s-tot"><span>Total</span><span>${esc(fmt(total))}</span></div></div>
      ${dep && dep < total ? `<div class="m-dep"><span>Today: ${esc(C.advance.care || 'Care deposit')}<br><small class="m-mute">Rest on delivery</small></span><b>${esc(fmt(dep))}</b></div>` : ''}
      <div class="m-trust"><span>${ic('truck')}Delivery in ${esc(C.delivery.days || '2 to 5 days')}</span><span>${ic('swap')}Size swap within ${C.exchangeDays || 5} days</span><span>${ic('chat')}We confirm every order on WhatsApp</span></div>
      <a class="m-classic" href="${root}/cart?view=classic">Gift wrap, codes and more</a>
    </div>`;
    let b = $('#mBuy');
    if (!b) { document.getElementById('mApp').insertAdjacentHTML('beforeend', '<div class="m-buy" id="mBuy"></div>'); b = $('#mBuy'); }
    b.classList.add('on-bag');
    b.innerHTML = `<div class="bb-r"><button class="m-cta split" type="button" data-checkout><span>Checkout</span><span class="t-pill">${esc(fmt(total))}</span></button></div>`;
  };

  /* ---------- navigation ---------- */
  function render(dir) {
    const old = $('#mBuy'); if (old) old.remove();
    H.classList.toggle('m-pdp-on', cur.v === 'product'); view.classList.toggle('v-bag', cur.v === 'bag');
    const fn = V[cur.v];
    if (fn) {
      view.hidden = false; H.classList.add('m-own');
      if (cur.v !== 'shop' || !view.querySelector('.m-search')) view.innerHTML = '';
      fn();
      view.classList.remove('m-in', 'm-back'); void view.offsetWidth; view.classList.add(dir === 'back' ? 'm-back' : 'm-in');
    }
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
    if (document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) { const vt = document.startViewTransition(run); ['ready', 'finished', 'updateCallbackDone'].forEach((k) => vt[k] && vt[k].catch(() => {})); } else run();
    const t = { home: 'DAUR Supply', shop: 'Shop | DAUR Supply', bag: 'Your bag | DAUR Supply', liked: 'Liked | DAUR Supply' }[r.v];
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
    const L = (h, i, t, cls) => `<a class="${cls || ''}" href="${h}">${ic(i)}<span>${t}</span></a>`;
    openSheet(`<div class="m-row"><span class="m-wm">DAUR</span><span class="m-mute" style="font-size:13px">Same craft. Zero retail markup.</span></div>
      <div class="m-menu">${L(href.shop(), 'search', 'Shop all', 'wide')}${P().some((p) => p.variants.some(API.onSale)) ? L(href.shop('Sale'), 'tag', 'Sale') : ''}${L(root + '/pages/manifesto', 'story', 'Our story')}${L(root + '/pages/offers', 'tag', 'Offers')}${L(root + '/pages/track', 'truck', 'Track order')}${L(root + '/pages/gifts', 'gift', 'Gifts')}${L(root + '/pages/giving', 'heart', 'Our giving')}${L(root + '/pages/contract', 'shield', 'Our promise')}${L(root + '/pages/policies', 'note', 'Policies')}${L(root + '/pages/contact', 'chat', 'Contact')}${L((window.DAUR_SHOPIFY && window.DAUR_SHOPIFY.routes.account) || root + '/account', 'user', 'Account')}</div>
      <a class="m-classic" href="${location.pathname}?view=classic">Open the full website</a>`);
  }
  function walletSheet() {
    openSheet(`<div style="display:flex;flex-direction:column;gap:14px;padding:6px 4px 4px">
      <div class="m-wallet" style="margin:0" aria-hidden="true"><span class="w-i">${ic('wallet')}</span><span class="w-t"><b>${esc(fmt(W.amt))} in your wallet</b><small>Ready for your first order</small></span></div>
      <p style="margin:0;font-size:15px;line-height:1.5">It comes off your total at checkout. One order, one wallet.</p>
      <a class="m-cta" href="${href.shop()}" data-m>Use it now</a></div>`);
  }
  function quick(pid) {
    const p = API.prod(pid); if (!p) return;
    state.qp = pid; state.qv = firstV(p).id; state.qs = null; paintQuick();
  }
  function paintQuick() {
    const p = API.prod(state.qp), v = API.variant(p, state.qv), x = pic(p, v);
    openSheet(`<div class="m-qa"><span class="q-img" style="background:${TINT_HEX[tintOf(p)]}"><img class="${x.cut ? '' : 'blend'}" src="${esc(x.src)}" alt=""></span><span><b style="font-size:18px">${esc(p.name)}</b><br><span class="m-mute">${esc(v.color)}</span><br><b>${esc(fmt(v.price))}</b></span></div>
      ${p.variants.length > 1 ? `<div class="m-cols" style="margin-top:16px">${p.variants.map((y, i) => { const z = pic(p, y); return `<button class="m-col" type="button" data-qv="${esc(y.id)}" aria-pressed="${y.id === v.id}" aria-label="${esc(y.color)}" style="background:${TINT_HEX[(tintOf(p) + i) % 4]}"><img class="${z.cut ? '' : 'blend'}" src="${esc(z.src)}" alt=""></button>`; }).join('')}</div>` : ''}
      <h3 style="font-size:15px;margin:18px 0 10px">Size (EU)</h3><div class="m-sizes">${p.sizes.map((s) => { const q = (v.stock || {})[s] || 0; return `<button class="m-size" type="button" data-qs="${esc(s)}" aria-pressed="${state.qs == s}"${q > 0 ? '' : ' disabled'}>${esc(s)}</button>`; }).join('')}</div>
      <button class="m-cta" type="button" data-qadd style="width:100%;margin-top:18px;flex:none" aria-disabled="${!state.qs}">${state.qs ? 'Add to bag · EU ' + esc(state.qs) : 'Pick your size'}</button>`);
  }
  function add(pid, vid, size) {
    const p = API.prod(pid), v = API.variant(p, vid), cart = API.cart;
    const max = (v.stock || {})[size] || 0, ex = cart.find((l) => l.pid === pid && l.vid === v.id && l.size == size);
    if ((ex ? ex.qty : 0) >= max) { toast('No more stock in EU ' + size); return false; }
    if (ex) ex.qty += 1; else cart.push({ pid, vid: v.id, size: +size, qty: 1 });
    store.set('cart', cart);
    try { navigator.vibrate && navigator.vibrate(12); } catch (e) { /* no vibration */ }
    paintTab();
    const b = $('.t-bag', tab); if (b) { b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); }
    toast(p.name + ', EU ' + size + ' added', 'View bag', href.bag);
    return true;
  }

  /* ---------- checkout: the bag goes to Shopify, with the wallet or the code applied ---------- */
  async function checkout(btn) {
    const cart = API.cart; if (!cart.length) return;
    const items = cart.map((l) => { const p = API.prod(l.pid), v = p && API.variant(p, l.vid), id = v && v.sid && v.sid[l.size]; return id ? { id, quantity: l.qty } : null; }).filter(Boolean);
    const code = W.code && W.on() ? W.code : API.coupon || '';
    if (btn) { btn.setAttribute('aria-disabled', 'true'); btn.firstElementChild.textContent = 'Opening checkout'; }
    const J = { 'Content-Type': 'application/json', Accept: 'application/json' };
    try {
      await fetch(root + '/cart/clear.js', { method: 'POST', headers: { Accept: 'application/json' } });
      const r = await fetch(root + '/cart/add.js', { method: 'POST', headers: J, body: JSON.stringify({ items }) });
      if (!r.ok) { const e = await r.json().catch(() => ({})); toast(e.description || 'A size in your bag just sold out.'); if (btn) { btn.removeAttribute('aria-disabled'); btn.firstElementChild.textContent = 'Checkout'; } return; }
      const gift = window.DAUR_GIFT ? window.DAUR_GIFT() : null, giving = cart.some((l) => { const p = API.prod(l.pid); return p && p.giving; });
      const attributes = { 'Slice cause': window.DAUR_SLICE_VOTE ? window.DAUR_SLICE_VOTE() : '', 'Giving pair': giving ? 'Yes, paid in full in advance. Size matched by DAUR. Private proof after handover' : '', Gift: gift ? 'Yes, paid in full in advance' : '', 'Gift packing': gift && gift.pack ? 'Requested' : '', 'Gift for': gift ? String(gift.to || '').slice(0, 40) : '', 'Gift note': gift ? String(gift.note || '').slice(0, 240) : '', 'Opened in': 'Mobile app' };
      await fetch(root + '/cart/update.js', { method: 'POST', headers: J, body: JSON.stringify({ attributes, discount: code }) });
      location.href = code ? root + '/discount/' + encodeURIComponent(code) + '?redirect=' + encodeURIComponent(root + '/checkout') : root + '/checkout';
    } catch (e) {
      toast('Checkout could not open. Please try again.');
      if (btn) { btn.removeAttribute('aria-disabled'); btn.firstElementChild.textContent = 'Checkout'; }
    }
  }

  /* ---------- one listener for every tap ---------- */
  document.getElementById('mApp').addEventListener('click', (e) => {
    const t = e.target.closest('a,button'); if (!t) return;
    const d = t.dataset;
    if (t.tagName === 'A' && d.m !== undefined) { e.preventDefault(); closeSheet(); go(t.getAttribute('href')); return; }
    if (d.menu !== undefined) return menu();
    if (d.back !== undefined) { if (history.state && history.state.m) history.back(); else go(href.home); return; }
    if (d.wallet !== undefined) return walletSheet();
    if (d.wish) { e.preventDefault(); API.toggleWish(d.wish); const on = wished(d.wish); $$(`[data-wish="${d.wish}"]`).forEach((b) => b.setAttribute('aria-pressed', on)); toast(on ? 'Saved to Liked' : 'Removed from Liked', on ? 'See all' : '', href.liked); if (cur.v === 'liked' && !on) render(); return; }
    if (d.quick) { e.preventDefault(); return quick(d.quick); }
    if (d.hcat) { state.homeCat = d.hcat; V.home(); return; }
    if (d.scat) { state.shopCat = d.scat; history.replaceState({ m: 1 }, '', href.shop(d.scat)); V.shop(); return; }
    if (d.pv) { state.pv = d.pv; const p = API.prod(state.pid), v = API.variant(p, d.pv); if (state.size && !((v.stock || {})[state.size] > 0)) state.size = null; V.product(); return; }
    if (d.size) { state.size = d.size; $$('.m-size', view).forEach((b) => b.setAttribute('aria-pressed', b.dataset.size === d.size)); const p = API.prod(state.pid); paintBuy(p, API.variant(p, state.pv)); return; }
    if (d.more !== undefined) { state.more = !state.more; V.product(); return; }
    if (d.notes !== undefined) { const s = $$('.m-sec h3', view).find((h) => h.textContent === 'Fit notes'); if (s) s.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
    if (d.add !== undefined) { if (!state.size) { const s = $('.m-sizes', view); if (s) { s.scrollIntoView({ behavior: 'smooth', block: 'center' }); s.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }], { duration: 260 }); } return; } add(state.pid, state.pv, state.size); return; }
    if (d.qv) { state.qv = d.qv; state.qs = null; paintQuick(); return; }
    if (d.qs) { state.qs = d.qs; paintQuick(); return; }
    if (d.qadd !== undefined) { if (!state.qs) return; if (add(state.qp, state.qv, state.qs)) closeSheet(); return; }
    if (d.qty) { const l = API.cart[+d.qty]; if (!l) return; const p = API.prod(l.pid), v = API.variant(p, l.vid), max = (v.stock || {})[l.size] || 0; l.qty += +d.d; if (l.qty > max) { l.qty = max; toast('No more stock in EU ' + l.size); } if (l.qty <= 0) API.cart.splice(+d.qty, 1); store.set('cart', API.cart); V.bag(); paintTab(); return; }
    if (d.wtoggle !== undefined) { W.set(!W.on()); V.bag(); return; }
    if (d.checkout !== undefined) { checkout(t); return; }
  });
  // the menu button in the bottom bar and the top bar sit outside #mApp's view, but inside #mApp, so the listener above covers them

  /* ---------- welcome: once a session, on the first page a visitor opens ---------- */
  function splash() {
    let seen = false; try { seen = sessionStorage.getItem('daur.mSplash') === '1'; sessionStorage.setItem('daur.mSplash', '1'); } catch (e) { seen = true; }
    if (seen || M.splash === false || cur.v !== 'home' || /[?&](utm_|fbclid|gclid|ttclid)/.test(location.search) && false) return;
    const min = Math.min.apply(null, P().map(API.minPrice));
    document.body.insertAdjacentHTML('beforeend', `<div class="m-splash" id="mSplash" role="dialog" aria-label="Welcome to DAUR Supply">
      <span class="s-ring"></span><span class="s-wm"><b>DAUR</b><small>SUPPLY</small></span>
      <img class="s-img" src="${asset('m-hero.webp')}" alt="">
      <span class="s-live"><i></i>${esc(M.splashTag || 'Drop 01 is live')}</span>
      <h1>Same craft.<br>Zero markup.</h1><p>Men's shoes from ${esc(fmt(min))}</p>
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
  render('in');
  splash();
  // the desktop bag drawer and toasts never open on phones; a change made on another tab is picked up when this tab returns
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { paintTab(); if (cur.v === 'bag') V.bag(); } });
})();
