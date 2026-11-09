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
  // delivery is shown at its real cost with a matching credit in the wallet, never as "free"
  const DEL = +M.deliveryCredit || 200;
  const delTxt = () => fmt(DEL) + ' delivery credit';
  const DAUR_ADD = +M.givingAdd || 300; // added by DAUR for every pair given: the delivery it does not spend, plus Rs 100 of its own
  const days = () => C.delivery.days || '2 to 5 days';
  const GIVE = Object.assign({ on: true, pct: 5, causes: ['School fees', 'Medical bills', 'Food rations'] }, C.give || {});
  GIVE.causes = (GIVE.causes || []).map((x) => String(x).trim()).filter(Boolean).slice(0, 4);
  // where to find DAUR: the same accounts the desktop footer links to (TikTok is not claimed yet, so it is left out)
  const WA = String(C.whatsapp || '923199628735');
  const waNice = () => WA.replace(/^92/, '0').replace(/(\d{4})(\d{7})/, '$1 $2');
  const SOC = [['ig', 'Instagram', '@daursupply', 'https://www.instagram.com/daursupply'], ['fb', 'Facebook', 'daursupply', 'https://www.facebook.com/daursupply'],
    ['wa', 'WhatsApp', waNice(), 'https://wa.me/' + WA], ['mail', 'Email', 'contact@daursupply.com', 'mailto:contact@daursupply.com']];
  // the two ways to buy for someone else, kept apart by colour, icon and words everywhere they appear
  const KIND = {
    gift: { label: 'Gift', who: 'For someone you know', icon: 'gift', line: 'GIFT: for someone the buyer knows' },
    give: { label: 'Give', who: 'For someone in need', icon: 'hand', line: 'GIVING: for someone in need, handed over by DAUR' }
  };

  /* ---------- the logo: the DAUR wordmark and the D mark take turns, as on the desktop header ---------- */
  const DMARK = '<svg class="dm" viewBox="-55 20 234 160" fill="currentColor" aria-hidden="true"><g transform="skewX(-14)"><path d="M20,20 H104 A80,80 0 0 1 104,180 H-10 V144 H104 A44,44 0 0 0 104,56 H56 V128 H20 Z"/></g></svg>';
  const WORDMARK = '<svg class="wm" viewBox="-22 0 462 100" fill="currentColor" aria-hidden="true"><g transform="skewX(-12)" fill-rule="evenodd"><path d="M0,0 H50 A50,50 0 0 1 50,100 H0 Z M27,25 H50 A25,25 0 0 1 50,75 H27 Z"/><path transform="translate(110 0)" d="M0,100 L36,0 H72 L108,100 H79 L54,28 L29,100 Z"/><path transform="translate(226 0)" d="M0,0 H27 V52 A23,23 0 0 0 73,52 V0 H100 V52 A50,48 0 0 1 0,52 Z"/><path transform="translate(340 0)" d="M0,0 H62 A31,31 0 0 1 80,56 L102,100 H71 L51,62 H27 V100 H0 Z M27,20 H61 A11,11 0 0 1 61,42 H27 Z"/></g></svg>';
  const logo = (still) => `<a class="m-logo${still ? ' still' : ''}" href="${root}/" data-m aria-label="DAUR Supply home"><span class="lg-w">${WORDMARK}<small>SUPPLY</small></span><span class="lg-d">${DMARK}</span></a>`;

  /* ---------- icons ---------- */
  const I = {
    "menu": "<path d=\"M228,128a12,12,0,0,1-12,12H40a12,12,0,0,1,0-24H216A12,12,0,0,1,228,128ZM40,76H216a12,12,0,0,0,0-24H40a12,12,0,0,0,0,24ZM216,180H40a12,12,0,0,0,0,24H216a12,12,0,0,0,0-24Z\"/>",
    "back": "<path d=\"M228,128a12,12,0,0,1-12,12H69l51.52,51.51a12,12,0,0,1-17,17l-72-72a12,12,0,0,1,0-17l72-72a12,12,0,0,1,17,17L69,116H216A12,12,0,0,1,228,128Z\"/>",
    "arrow": "<path d=\"M224.49,136.49l-72,72a12,12,0,0,1-17-17L187,140H40a12,12,0,0,1,0-24H187L135.51,64.48a12,12,0,0,1,17-17l72,72A12,12,0,0,1,224.49,136.49Z\"/>",
    "bag": "<path d=\"M223.92,208H32.08a8,8,0,0,1-8-8.93l14.25-120a8.06,8.06,0,0,1,8-7.07H209.67a8.06,8.06,0,0,1,8,7.07l14.25,120A8,8,0,0,1,223.92,208Z\" class=\"d\"/><path d=\"M239.89,198.12l-14.26-120a16,16,0,0,0-16-14.12H176a48,48,0,0,0-96,0H46.33a16,16,0,0,0-16,14.12l-14.26,120A16,16,0,0,0,20,210.6a16.13,16.13,0,0,0,12,5.4H223.92A16.13,16.13,0,0,0,236,210.6,16,16,0,0,0,239.89,198.12ZM128,32a32,32,0,0,1,32,32H96A32,32,0,0,1,128,32ZM32,200,46.33,80H80v24a8,8,0,0,0,16,0V80h64v24a8,8,0,0,0,16,0V80h33.75l14.17,120Z\"/>",
    "home": "<path d=\"M216,120v96H152V152H104v64H40V120a8,8,0,0,1,2.34-5.66l80-80a8,8,0,0,1,11.32,0l80,80A8,8,0,0,1,216,120Z\" class=\"d\"/><path d=\"M219.31,108.68l-80-80a16,16,0,0,0-22.62,0l-80,80A15.87,15.87,0,0,0,32,120v96a8,8,0,0,0,8,8h64a8,8,0,0,0,8-8V160h32v56a8,8,0,0,0,8,8h64a8,8,0,0,0,8-8V120A15.87,15.87,0,0,0,219.31,108.68ZM208,208H160V152a8,8,0,0,0-8-8H104a8,8,0,0,0-8,8v56H48V120l80-80,80,80Z\"/>",
    "search": "<path d=\"M232.49,215.51,185,168a92.12,92.12,0,1,0-17,17l47.53,47.54a12,12,0,0,0,17-17ZM44,112a68,68,0,1,1,68,68A68.07,68.07,0,0,1,44,112Z\"/>",
    "heart": "<path d=\"M232,102c0,66-104,122-104,122S24,168,24,102A54,54,0,0,1,78,48c22.59,0,41.94,12.31,50,32,8.06-19.69,27.41-32,50-32A54,54,0,0,1,232,102Z\" class=\"d\"/><path d=\"M178,40c-20.65,0-38.73,8.88-50,23.89C116.73,48.88,98.65,40,78,40a62.07,62.07,0,0,0-62,62c0,70,103.79,126.66,108.21,129a8,8,0,0,0,7.58,0C136.21,228.66,240,172,240,102A62.07,62.07,0,0,0,178,40ZM128,214.8C109.74,204.16,32,155.69,32,102A46.06,46.06,0,0,1,78,56c19.45,0,35.78,10.36,42.6,27a8,8,0,0,0,14.8,0c6.82-16.67,23.15-27,42.6-27a46.06,46.06,0,0,1,46,46C224,155.61,146.24,204.15,128,214.8Z\"/>",
    "grid": "<path d=\"M112,56v48a8,8,0,0,1-8,8H56a8,8,0,0,1-8-8V56a8,8,0,0,1,8-8h48A8,8,0,0,1,112,56Zm88-8H152a8,8,0,0,0-8,8v48a8,8,0,0,0,8,8h48a8,8,0,0,0,8-8V56A8,8,0,0,0,200,48Zm-96,96H56a8,8,0,0,0-8,8v48a8,8,0,0,0,8,8h48a8,8,0,0,0,8-8V152A8,8,0,0,0,104,144Zm96,0H152a8,8,0,0,0-8,8v48a8,8,0,0,0,8,8h48a8,8,0,0,0,8-8V152A8,8,0,0,0,200,144Z\" class=\"d\"/><path d=\"M200,136H152a16,16,0,0,0-16,16v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V152A16,16,0,0,0,200,136Zm0,64H152V152h48v48ZM104,40H56A16,16,0,0,0,40,56v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V56A16,16,0,0,0,104,40Zm0,64H56V56h48v48Zm96-64H152a16,16,0,0,0-16,16v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V56A16,16,0,0,0,200,40Zm0,64H152V56h48v48Zm-96,32H56a16,16,0,0,0-16,16v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V152A16,16,0,0,0,104,136Zm0,64H56V152h48v48Z\"/>",
    "plus": "<path d=\"M228,128a12,12,0,0,1-12,12H140v76a12,12,0,0,1-24,0V140H40a12,12,0,0,1,0-24h76V40a12,12,0,0,1,24,0v76h76A12,12,0,0,1,228,128Z\"/>",
    "wallet": "<path d=\"M224,80V192a8,8,0,0,1-8,8H56a16,16,0,0,1-16-16V56A16,16,0,0,0,56,72H216A8,8,0,0,1,224,80Z\" class=\"d\"/><path d=\"M216,64H56a8,8,0,0,1,0-16H192a8,8,0,0,0,0-16H56A24,24,0,0,0,32,56V184a24,24,0,0,0,24,24H216a16,16,0,0,0,16-16V80A16,16,0,0,0,216,64Zm0,128H56a8,8,0,0,1-8-8V78.63A23.84,23.84,0,0,0,56,80H216Zm-48-60a12,12,0,1,1,12,12A12,12,0,0,1,168,132Z\"/>",
    "truck": "<path d=\"M248,120v64a8,8,0,0,1-8,8H216a24,24,0,0,0-48,0H104a24,24,0,0,0-48,0H32a8,8,0,0,1-8-8V144H184V120Z\" class=\"d\"/><path d=\"M255.42,117l-14-35A15.93,15.93,0,0,0,226.58,72H192V64a8,8,0,0,0-8-8H32A16,16,0,0,0,16,72V184a16,16,0,0,0,16,16H49a32,32,0,0,0,62,0h50a32,32,0,0,0,62,0h17a16,16,0,0,0,16-16V120A7.94,7.94,0,0,0,255.42,117ZM192,88h34.58l9.6,24H192ZM32,72H176v64H32ZM80,208a16,16,0,1,1,16-16A16,16,0,0,1,80,208Zm81-24H111a32,32,0,0,0-62,0H32V152H176v12.31A32.11,32.11,0,0,0,161,184Zm31,24a16,16,0,1,1,16-16A16,16,0,0,1,192,208Zm48-24H223a32.06,32.06,0,0,0-31-24V128h48Z\"/>",
    "swap": "<path d=\"M216,128a88,88,0,1,1-88-88A88,88,0,0,1,216,128Z\" class=\"d\"/><path d=\"M224,48V96a8,8,0,0,1-8,8H168a8,8,0,0,1,0-16h28.69L182.06,73.37a79.56,79.56,0,0,0-56.13-23.43h-.45A79.52,79.52,0,0,0,69.59,72.71,8,8,0,0,1,58.41,61.27a96,96,0,0,1,135,.79L208,76.69V48a8,8,0,0,1,16,0ZM186.41,183.29a80,80,0,0,1-112.47-.66L59.31,168H88a8,8,0,0,0,0-16H40a8,8,0,0,0-8,8v48a8,8,0,0,0,16,0V179.31l14.63,14.63A95.43,95.43,0,0,0,130,222.06h.53a95.36,95.36,0,0,0,67.07-27.33,8,8,0,0,0-11.18-11.44Z\"/>",
    "note": "<path d=\"M200,88l-72,72H96V128l72-72Z\" class=\"d\"/><path d=\"M229.66,58.34l-32-32a8,8,0,0,0-11.32,0l-96,96A8,8,0,0,0,88,128v32a8,8,0,0,0,8,8h32a8,8,0,0,0,5.66-2.34l96-96A8,8,0,0,0,229.66,58.34ZM124.69,152H104V131.31l64-64L188.69,88ZM200,76.69,179.31,56,192,43.31,212.69,64ZM224,128v80a16,16,0,0,1-16,16H48a16,16,0,0,1-16-16V48A16,16,0,0,1,48,32h80a8,8,0,0,1,0,16H48V208H208V128a8,8,0,0,1,16,0Z\"/>",
    "chat": "<path d=\"M224,128A96,96,0,0,1,79.93,211.11h0L42.54,223.58a8,8,0,0,1-10.12-10.12l12.47-37.39h0A96,96,0,1,1,224,128Z\" class=\"d\"/><path d=\"M128,24A104,104,0,0,0,36.18,176.88L24.83,210.93a16,16,0,0,0,20.24,20.24l34.05-11.35A104,104,0,1,0,128,24Zm0,192a87.87,87.87,0,0,1-44.06-11.81,8,8,0,0,0-4-1.08,7.85,7.85,0,0,0-2.53.42L40,216,52.47,178.6a8,8,0,0,0-.66-6.54A88,88,0,1,1,128,216Zm12-88a12,12,0,1,1-12-12A12,12,0,0,1,140,128Zm-44,0a12,12,0,1,1-12-12A12,12,0,0,1,96,128Zm88,0a12,12,0,1,1-12-12A12,12,0,0,1,184,128Z\"/>",
    "story": "<path d=\"M232,56V200H160a32,32,0,0,0-32,32V88a32,32,0,0,1,32-32Z\" class=\"d\"/><path d=\"M232,48H160a40,40,0,0,0-32,16A40,40,0,0,0,96,48H24a8,8,0,0,0-8,8V200a8,8,0,0,0,8,8H96a24,24,0,0,1,24,24,8,8,0,0,0,16,0,24,24,0,0,1,24-24h72a8,8,0,0,0,8-8V56A8,8,0,0,0,232,48ZM96,192H32V64H96a24,24,0,0,1,24,24V200A39.81,39.81,0,0,0,96,192Zm128,0H160a39.81,39.81,0,0,0-24,8V88a24,24,0,0,1,24-24h64ZM160,88h40a8,8,0,0,1,0,16H160a8,8,0,0,1,0-16Zm48,40a8,8,0,0,1-8,8H160a8,8,0,0,1,0-16h40A8,8,0,0,1,208,128Zm0,32a8,8,0,0,1-8,8H160a8,8,0,0,1,0-16h40A8,8,0,0,1,208,160Z\"/>",
    "tag": "<path d=\"M237.66,153,153,237.66a8,8,0,0,1-11.31,0L42.34,138.34A8,8,0,0,1,40,132.69V40h92.69a8,8,0,0,1,5.65,2.34l99.32,99.32A8,8,0,0,1,237.66,153Z\" class=\"d\"/><path d=\"M243.31,136,144,36.69A15.86,15.86,0,0,0,132.69,32H40a8,8,0,0,0-8,8v92.69A15.86,15.86,0,0,0,36.69,144L136,243.31a16,16,0,0,0,22.63,0l84.68-84.68a16,16,0,0,0,0-22.63Zm-96,96L48,132.69V48h84.69L232,147.31ZM96,84A12,12,0,1,1,84,72,12,12,0,0,1,96,84Z\"/>",
    "box": "<path d=\"M128,129.09V232a8,8,0,0,1-3.84-1l-88-48.18a8,8,0,0,1-4.16-7V80.18a8,8,0,0,1,.7-3.25Z\" class=\"d\"/><path d=\"M223.68,66.15,135.68,18a15.88,15.88,0,0,0-15.36,0l-88,48.17a16,16,0,0,0-8.32,14v95.64a16,16,0,0,0,8.32,14l88,48.17a15.88,15.88,0,0,0,15.36,0l88-48.17a16,16,0,0,0,8.32-14V80.18A16,16,0,0,0,223.68,66.15ZM128,32l80.34,44-29.77,16.3-80.35-44ZM128,120,47.66,76l33.9-18.56,80.34,44ZM40,90l80,43.78v85.79L40,175.82Zm176,85.78h0l-80,43.79V133.82l32-17.51V152a8,8,0,0,0,16,0V107.55L216,90v85.77Z\"/>",
    "gift": "<path d=\"M208,128v72a8,8,0,0,1-8,8H56a8,8,0,0,1-8-8V128Z\" class=\"d\"/><path d=\"M216,72H180.92c.39-.33.79-.65,1.17-1A29.53,29.53,0,0,0,192,49.57,32.62,32.62,0,0,0,158.44,16,29.53,29.53,0,0,0,137,25.91a54.94,54.94,0,0,0-9,14.48,54.94,54.94,0,0,0-9-14.48A29.53,29.53,0,0,0,97.56,16,32.62,32.62,0,0,0,64,49.57,29.53,29.53,0,0,0,73.91,71c.38.33.78.65,1.17,1H40A16,16,0,0,0,24,88v32a16,16,0,0,0,16,16v64a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V136a16,16,0,0,0,16-16V88A16,16,0,0,0,216,72ZM149,36.51a13.69,13.69,0,0,1,10-4.5h.49A16.62,16.62,0,0,1,176,49.08a13.69,13.69,0,0,1-4.5,10c-9.49,8.4-25.24,11.36-35,12.4C137.7,60.89,141,45.5,149,36.51Zm-64.09.36A16.63,16.63,0,0,1,96.59,32h.49a13.69,13.69,0,0,1,10,4.5c8.39,9.48,11.35,25.2,12.39,34.92-9.72-1-25.44-4-34.92-12.39a13.69,13.69,0,0,1-4.5-10A16.6,16.6,0,0,1,84.87,36.87ZM40,88h80v32H40Zm16,48h64v64H56Zm144,64H136V136h64Zm16-80H136V88h80v32Z\"/>",
    "hand": "<circle class=\"d\" cx=\"128\" cy=\"58\" r=\"40\"/><circle cx=\"128\" cy=\"58\" r=\"40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"16\"/><path fill-rule=\"evenodd\" d=\"M36,240 V176 a70,70 0 0 1 70,-70 h44 a70,70 0 0 1 70,70 v64 Z M128,243.6 C57.6,198.8 64,141.2 96,134.8 C115.2,132.2 128,147.6 128,157.8 C128,147.6 140.8,132.2 160,134.8 C192,141.2 198.4,198.8 128,243.6 Z\"/><path d=\"M128,227.4 C77.4,195.2 82,153.8 105,149.2 C118.8,147.4 128,158.4 128,165.8 C128,158.4 137.2,147.4 151,149.2 C174,153.8 178.6,195.2 128,227.4 Z\"/>",
    "shield": "<path d=\"M216,56v56c0,96-88,120-88,120S40,208,40,112V56a8,8,0,0,1,8-8H208A8,8,0,0,1,216,56Z\" class=\"d\"/><path d=\"M208,40H48A16,16,0,0,0,32,56v56c0,52.72,25.52,84.67,46.93,102.19,23.06,18.86,46,25.26,47,25.53a8,8,0,0,0,4.2,0c1-.27,23.91-6.67,47-25.53C198.48,196.67,224,164.72,224,112V56A16,16,0,0,0,208,40Zm0,72c0,37.07-13.66,67.16-40.6,89.42A129.3,129.3,0,0,1,128,223.62a128.25,128.25,0,0,1-38.92-21.81C61.82,179.51,48,149.3,48,112l0-56,160,0ZM82.34,141.66a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35a8,8,0,0,1,11.32,11.32l-56,56a8,8,0,0,1-11.32,0Z\"/>",
    "user": "<path d=\"M224,128a95.76,95.76,0,0,1-31.8,71.37A72,72,0,0,0,128,160a40,40,0,1,0-40-40,40,40,0,0,0,40,40,72,72,0,0,0-64.2,39.37h0A96,96,0,1,1,224,128Z\" class=\"d\"/><path d=\"M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24ZM74.08,197.5a64,64,0,0,1,107.84,0,87.83,87.83,0,0,1-107.84,0ZM96,120a32,32,0,1,1,32,32A32,32,0,0,1,96,120Zm97.76,66.41a79.66,79.66,0,0,0-36.06-28.75,48,48,0,1,0-59.4,0,79.66,79.66,0,0,0-36.06,28.75,88,88,0,1,1,131.52,0Z\"/>",
    "camera": "<path d=\"M208,64H176L160,40H96L80,64H48A16,16,0,0,0,32,80V192a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V80A16,16,0,0,0,208,64ZM128,168a36,36,0,1,1,36-36A36,36,0,0,1,128,168Z\" class=\"d\"/><path d=\"M208,56H180.28L166.65,35.56A8,8,0,0,0,160,32H96a8,8,0,0,0-6.65,3.56L75.71,56H48A24,24,0,0,0,24,80V192a24,24,0,0,0,24,24H208a24,24,0,0,0,24-24V80A24,24,0,0,0,208,56Zm8,136a8,8,0,0,1-8,8H48a8,8,0,0,1-8-8V80a8,8,0,0,1,8-8H80a8,8,0,0,0,6.66-3.56L100.28,48h55.43l13.63,20.44A8,8,0,0,0,176,72h32a8,8,0,0,1,8,8ZM128,88a44,44,0,1,0,44,44A44.05,44.05,0,0,0,128,88Zm0,72a28,28,0,1,1,28-28A28,28,0,0,1,128,160Z\"/>",
    "pin": "<path d=\"M128,24a80,80,0,0,0-80,80c0,72,80,128,80,128s80-56,80-128A80,80,0,0,0,128,24Zm0,112a32,32,0,1,1,32-32A32,32,0,0,1,128,136Z\" class=\"d\"/><path d=\"M128,64a40,40,0,1,0,40,40A40,40,0,0,0,128,64Zm0,64a24,24,0,1,1,24-24A24,24,0,0,1,128,128Zm0-112a88.1,88.1,0,0,0-88,88c0,31.4,14.51,64.68,42,96.25a254.19,254.19,0,0,0,41.45,38.3,8,8,0,0,0,9.18,0A254.19,254.19,0,0,0,174,200.25c27.45-31.57,42-64.85,42-96.25A88.1,88.1,0,0,0,128,16Zm0,206c-16.53-13-72-60.75-72-118a72,72,0,0,1,144,0C200,161.23,144.53,209,128,222Z\"/>",
    "copy": "<path d=\"M216,40V168H168V88H88V40Z\" class=\"d\"/><path d=\"M216,32H88a8,8,0,0,0-8,8V80H40a8,8,0,0,0-8,8V216a8,8,0,0,0,8,8H168a8,8,0,0,0,8-8V176h40a8,8,0,0,0,8-8V40A8,8,0,0,0,216,32ZM160,208H48V96H160Zm48-48H176V88a8,8,0,0,0-8-8H96V48H208Z\"/>",
    "share": "<path d=\"M208,200a32,32,0,1,1-32-32A32,32,0,0,1,208,200ZM176,88a32,32,0,1,0-32-32A32,32,0,0,0,176,88Z\" class=\"d\"/><path d=\"M176,160a39.89,39.89,0,0,0-28.62,12.09l-46.1-29.63a39.8,39.8,0,0,0,0-28.92l46.1-29.63a40,40,0,1,0-8.66-13.45l-46.1,29.63a40,40,0,1,0,0,55.82l46.1,29.63A40,40,0,1,0,176,160Zm0-128a24,24,0,1,1-24,24A24,24,0,0,1,176,32ZM64,152a24,24,0,1,1,24-24A24,24,0,0,1,64,152Zm112,72a24,24,0,1,1,24-24A24,24,0,0,1,176,224Z\"/>",
    "check": "<path d=\"M232.49,80.49l-128,128a12,12,0,0,1-17,0l-56-56a12,12,0,1,1,17-17L96,183,215.51,63.51a12,12,0,0,1,17,17Z\"/>",
    "chev": "<path d=\"M216.49,104.49l-80,80a12,12,0,0,1-17,0l-80-80a12,12,0,0,1,17-17L128,159l71.51-71.52a12,12,0,0,1,17,17Z\"/>",
    "book": "<path d=\"M208,32V192H72a24,24,0,0,0-24,24V56A24,24,0,0,1,72,32h40v96l32-24,32,24V32Z\" class=\"d\"/><path d=\"M208,24H72A32,32,0,0,0,40,56V224a8,8,0,0,0,8,8H192a8,8,0,0,0,0-16H56a16,16,0,0,1,16-16H208a8,8,0,0,0,8-8V32A8,8,0,0,0,208,24ZM120,40h48v72L148.79,97.6a8,8,0,0,0-9.6,0L120,112Zm80,144H72a31.82,31.82,0,0,0-16,4.29V56A16,16,0,0,1,72,40h32v88a8,8,0,0,0,12.8,6.4L144,114l27.21,20.4A8,8,0,0,0,176,136a8.1,8.1,0,0,0,3.58-.84A8,8,0,0,0,184,128V40h16Z\"/>",
    "spark": "<path d=\"M194.82,151.43l-55.09,20.3-20.3,55.09a7.92,7.92,0,0,1-14.86,0l-20.3-55.09-55.09-20.3a7.92,7.92,0,0,1,0-14.86l55.09-20.3,20.3-55.09a7.92,7.92,0,0,1,14.86,0l20.3,55.09,55.09,20.3A7.92,7.92,0,0,1,194.82,151.43Z\" class=\"d\"/><path d=\"M197.58,129.06,146,110l-19-51.62a15.92,15.92,0,0,0-29.88,0L78,110l-51.62,19a15.92,15.92,0,0,0,0,29.88L78,178l19,51.62a15.92,15.92,0,0,0,29.88,0L146,178l51.62-19a15.92,15.92,0,0,0,0-29.88ZM137,164.22a8,8,0,0,0-4.74,4.74L112,223.85,91.78,169A8,8,0,0,0,87,164.22L32.15,144,87,123.78A8,8,0,0,0,91.78,119L112,64.15,132.22,119a8,8,0,0,0,4.74,4.74L191.85,144ZM144,40a8,8,0,0,1,8-8h16V16a8,8,0,0,1,16,0V32h16a8,8,0,0,1,0,16H184V64a8,8,0,0,1-16,0V48H152A8,8,0,0,1,144,40ZM248,88a8,8,0,0,1-8,8h-8v8a8,8,0,0,1-16,0V96h-8a8,8,0,0,1,0-16h8V72a8,8,0,0,1,16,0v8h8A8,8,0,0,1,248,88Z\"/>",
    "x": "<path d=\"M208.49,191.51a12,12,0,0,1-17,17L128,145,64.49,208.49a12,12,0,0,1-17-17L111,128,47.51,64.49a12,12,0,0,1,17-17L128,111l63.51-63.52a12,12,0,0,1,17,17L145,128Z\"/>",
    "ig": "<path d=\"M176,32H80A48,48,0,0,0,32,80v96a48,48,0,0,0,48,48h96a48,48,0,0,0,48-48V80A48,48,0,0,0,176,32ZM128,168a40,40,0,1,1,40-40A40,40,0,0,1,128,168Z\" class=\"d\"/><path d=\"M176,24H80A56.06,56.06,0,0,0,24,80v96a56.06,56.06,0,0,0,56,56h96a56.06,56.06,0,0,0,56-56V80A56.06,56.06,0,0,0,176,24Zm40,152a40,40,0,0,1-40,40H80a40,40,0,0,1-40-40V80A40,40,0,0,1,80,40h96a40,40,0,0,1,40,40ZM128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Zm64-84a12,12,0,1,1-12-12A12,12,0,0,1,192,76Z\"/>",
    "fb": "<path d=\"M224,128a96,96,0,1,1-96-96A96,96,0,0,1,224,128Z\" class=\"d\"/><path d=\"M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm8,191.63V152h24a8,8,0,0,0,0-16H136V112a16,16,0,0,1,16-16h16a8,8,0,0,0,0-16H152a32,32,0,0,0-32,32v24H96a8,8,0,0,0,0,16h24v63.63a88,88,0,1,1,16,0Z\"/>",
    "wa": "<path d=\"M128,32A96,96,0,0,0,44.89,176.07L32.42,213.46a8,8,0,0,0,10.12,10.12l37.39-12.47A96,96,0,1,0,128,32Zm24,152a80,80,0,0,1-80-80,32,32,0,0,1,32-32l16,32-12.32,18.47a48.19,48.19,0,0,0,25.85,25.85L152,136l32,16A32,32,0,0,1,152,184Z\" class=\"d\"/><path d=\"M187.58,144.84l-32-16a8,8,0,0,0-8,.5l-14.69,9.8a40.55,40.55,0,0,1-16-16l9.8-14.69a8,8,0,0,0,.5-8l-16-32A8,8,0,0,0,104,64a40,40,0,0,0-40,40,88.1,88.1,0,0,0,88,88,40,40,0,0,0,40-40A8,8,0,0,0,187.58,144.84ZM152,176a72.08,72.08,0,0,1-72-72A24,24,0,0,1,99.29,80.46l11.48,23L101,118a8,8,0,0,0-.73,7.51,56.47,56.47,0,0,0,30.15,30.15A8,8,0,0,0,138,155l14.62-9.74,23,11.48A24,24,0,0,1,152,176ZM128,24A104,104,0,0,0,36.18,176.88L24.83,210.93a16,16,0,0,0,20.24,20.24l34.05-11.35A104,104,0,1,0,128,24Zm0,192a87.87,87.87,0,0,1-44.06-11.81,8,8,0,0,0-6.54-.67L40,216,52.47,178.6a8,8,0,0,0-.66-6.54A88,88,0,1,1,128,216Z\"/>",
    "mail": "<path d=\"M224,56l-96,88L32,56Z\" class=\"d\"/><path d=\"M224,48H32a8,8,0,0,0-8,8V192a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A8,8,0,0,0,224,48ZM203.43,64,128,133.15,52.57,64ZM216,192H40V74.19l82.59,75.71a8,8,0,0,0,10.82,0L216,74.19V192Z\"/>",
    "sort": "<path d=\"M128,128a12,12,0,0,1-12,12H48a12,12,0,0,1,0-24h68A12,12,0,0,1,128,128ZM48,76H180a12,12,0,0,0,0-24H48a12,12,0,0,0,0,24Zm52,104H48a12,12,0,0,0,0,24h52a12,12,0,0,0,0-24Zm132.49-20.49a12,12,0,0,0-17,0L196,179V112a12,12,0,0,0-24,0v67l-19.51-19.52a12,12,0,0,0-17,17l40,40a12,12,0,0,0,17,0l40-40A12,12,0,0,0,232.49,159.51Z\"/>",
    "filter": "<path d=\"M216,80v96H40V80Z\" class=\"d\"/><path d=\"M176,80a8,8,0,0,1,8-8h32a8,8,0,0,1,0,16H184A8,8,0,0,1,176,80ZM40,88H144v16a8,8,0,0,0,16,0V56a8,8,0,0,0-16,0V72H40a8,8,0,0,0,0,16Zm176,80H120a8,8,0,0,0,0,16h96a8,8,0,0,0,0-16ZM88,144a8,8,0,0,0-8,8v16H40a8,8,0,0,0,0,16H80v16a8,8,0,0,0,16,0V152A8,8,0,0,0,88,144Z\"/>",
    "help": "<path d=\"M224,128a96,96,0,1,1-96-96A96,96,0,0,1,224,128Z\" class=\"d\"/><path d=\"M140,180a12,12,0,1,1-12-12A12,12,0,0,1,140,180ZM128,72c-22.06,0-40,16.15-40,36v4a8,8,0,0,0,16,0v-4c0-11,10.77-20,24-20s24,9,24,20-10.77,20-24,20a8,8,0,0,0-8,8v8a8,8,0,0,0,16,0v-.72c18.24-3.35,32-17.9,32-35.28C168,88.15,150.06,72,128,72Zm104,56A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z\"/>",
    "coins": "<path d=\"M240,132c0,19.88-35.82,36-80,36-19.6,0-37.56-3.17-51.47-8.44h0C146.76,156.85,176,142,176,124V96.72h0C212.52,100.06,240,114.58,240,132ZM176,84c0-19.88-35.82-36-80-36S16,64.12,16,84s35.82,36,80,36S176,103.88,176,84Z\" class=\"d\"/><path d=\"M184,89.57V84c0-25.08-37.83-44-88-44S8,58.92,8,84v40c0,20.89,26.25,37.49,64,42.46V172c0,25.08,37.83,44,88,44s88-18.92,88-44V132C248,111.3,222.58,94.68,184,89.57ZM232,132c0,13.22-30.79,28-72,28-3.73,0-7.43-.13-11.08-.37C170.49,151.77,184,139,184,124V105.74C213.87,110.19,232,122.27,232,132ZM72,150.25V126.46A183.74,183.74,0,0,0,96,128a183.74,183.74,0,0,0,24-1.54v23.79A163,163,0,0,1,96,152,163,163,0,0,1,72,150.25Zm96-40.32V124c0,8.39-12.41,17.4-32,22.87V123.5C148.91,120.37,159.84,115.71,168,109.93ZM96,56c41.21,0,72,14.78,72,28s-30.79,28-72,28S24,97.22,24,84,54.79,56,96,56ZM24,124V109.93c8.16,5.78,19.09,10.44,32,13.57v23.37C36.41,141.4,24,132.39,24,124Zm64,48v-4.17c2.63.1,5.29.17,8,.17,3.88,0,7.67-.13,11.39-.35A121.92,121.92,0,0,0,120,171.41v23.46C100.41,189.4,88,180.39,88,172Zm48,26.25V174.4a179.48,179.48,0,0,0,24,1.6,183.74,183.74,0,0,0,24-1.54v23.79a165.45,165.45,0,0,1-48,0Zm64-3.38V171.5c12.91-3.13,23.84-7.79,32-13.57V172C232,180.39,219.59,189.4,200,194.87Z\"/>",
    "lock": "<path d=\"M216,96V208a8,8,0,0,1-8,8H48a8,8,0,0,1-8-8V96a8,8,0,0,1,8-8H208A8,8,0,0,1,216,96Z\" class=\"d\"/><path d=\"M208,80H176V56a48,48,0,0,0-96,0V80H48A16,16,0,0,0,32,96V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V96A16,16,0,0,0,208,80ZM96,56a32,32,0,0,1,64,0V80H96ZM208,208H48V96H208V208Z\"/>",
    "card": "<path d=\"M232,96v96a8,8,0,0,1-8,8H32a8,8,0,0,1-8-8V96Z\" class=\"d\"/><path d=\"M224,48H32A16,16,0,0,0,16,64V192a16,16,0,0,0,16,16H224a16,16,0,0,0,16-16V64A16,16,0,0,0,224,48Zm0,16V88H32V64Zm0,128H32V104H224v88Zm-16-24a8,8,0,0,1-8,8H168a8,8,0,0,1,0-16h32A8,8,0,0,1,208,168Zm-64,0a8,8,0,0,1-8,8H120a8,8,0,0,1,0-16h16A8,8,0,0,1,144,168Z\"/>",
    "seal": "<path d=\"M232,128c0,12.51-17.82,21.95-22.68,33.69-4.68,11.32,1.42,30.65-7.78,39.85s-28.53,3.1-39.85,7.78C150,214.18,140.5,232,128,232s-22-17.82-33.69-22.68c-11.32-4.68-30.65,1.42-39.85-7.78s-3.1-28.53-7.78-39.85C41.82,150,24,140.5,24,128s17.82-22,22.68-33.69C51.36,83,45.26,63.66,54.46,54.46S83,51.36,94.31,46.68C106.05,41.82,115.5,24,128,24S150,41.82,161.69,46.68c11.32,4.68,30.65-1.42,39.85,7.78s3.1,28.53,7.78,39.85C214.18,106.05,232,115.5,232,128Z\" class=\"d\"/><path d=\"M225.86,102.82c-3.77-3.94-7.67-8-9.14-11.57-1.36-3.27-1.44-8.69-1.52-13.94-.15-9.76-.31-20.82-8-28.51s-18.75-7.85-28.51-8c-5.25-.08-10.67-.16-13.94-1.52-3.56-1.47-7.63-5.37-11.57-9.14C146.28,23.51,138.44,16,128,16s-18.27,7.51-25.18,14.14c-3.94,3.77-8,7.67-11.57,9.14C88,40.64,82.56,40.72,77.31,40.8c-9.76.15-20.82.31-28.51,8S41,67.55,40.8,77.31c-.08,5.25-.16,10.67-1.52,13.94-1.47,3.56-5.37,7.63-9.14,11.57C23.51,109.72,16,117.56,16,128s7.51,18.27,14.14,25.18c3.77,3.94,7.67,8,9.14,11.57,1.36,3.27,1.44,8.69,1.52,13.94.15,9.76.31,20.82,8,28.51s18.75,7.85,28.51,8c5.25.08,10.67.16,13.94,1.52,3.56,1.47,7.63,5.37,11.57,9.14C109.72,232.49,117.56,240,128,240s18.27-7.51,25.18-14.14c3.94-3.77,8-7.67,11.57-9.14,3.27-1.36,8.69-1.44,13.94-1.52,9.76-.15,20.82-.31,28.51-8s7.85-18.75,8-28.51c.08-5.25.16-10.67,1.52-13.94,1.47-3.56,5.37-7.63,9.14-11.57C232.49,146.28,240,138.44,240,128S232.49,109.73,225.86,102.82Zm-11.55,39.29c-4.79,5-9.75,10.17-12.38,16.52-2.52,6.1-2.63,13.07-2.73,19.82-.1,7-.21,14.33-3.32,17.43s-10.39,3.22-17.43,3.32c-6.75.1-13.72.21-19.82,2.73-6.35,2.63-11.52,7.59-16.52,12.38S132,224,128,224s-9.15-4.92-14.11-9.69-10.17-9.75-16.52-12.38c-6.1-2.52-13.07-2.63-19.82-2.73-7-.1-14.33-.21-17.43-3.32s-3.22-10.39-3.32-17.43c-.1-6.75-.21-13.72-2.73-19.82-2.63-6.35-7.59-11.52-12.38-16.52S32,132,32,128s4.92-9.15,9.69-14.11,9.75-10.17,12.38-16.52c2.52-6.1,2.63-13.07,2.73-19.82.1-7,.21-14.33,3.32-17.43S70.51,56.9,77.55,56.8c6.75-.1,13.72-.21,19.82-2.73,6.35-2.63,11.52-7.59,16.52-12.38S124,32,128,32s9.15,4.92,14.11,9.69,10.17,9.75,16.52,12.38c6.1,2.52,13.07,2.63,19.82,2.73,7,.1,14.33.21,17.43,3.32s3.22,10.39,3.32,17.43c.1,6.75.21,13.72,2.73,19.82,2.63,6.35,7.59,11.52,12.38,16.52S224,124,224,128,219.08,137.15,214.31,142.11ZM173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34Z\"/>",
    "clock": "<path d=\"M224,128a96,96,0,1,1-96-96A96,96,0,0,1,224,128Z\" class=\"d\"/><path d=\"M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm64-88a8,8,0,0,1-8,8H128a8,8,0,0,1-8-8V72a8,8,0,0,1,16,0v48h48A8,8,0,0,1,192,128Z\"/>",
    "phone": "<path d=\"M223.94,174.08A48.33,48.33,0,0,1,176,216,136,136,0,0,1,40,80,48.33,48.33,0,0,1,81.92,32.06a8,8,0,0,1,8.3,4.8l21.13,47.2a8,8,0,0,1-.66,7.53L89.32,117a7.93,7.93,0,0,0-.54,7.81c8.27,16.93,25.77,34.22,42.75,42.41a7.92,7.92,0,0,0,7.83-.59l25-21.3a8,8,0,0,1,7.59-.69l47.16,21.13A8,8,0,0,1,223.94,174.08Z\" class=\"d\"/><path d=\"M222.37,158.46l-47.11-21.11-.13-.06a16,16,0,0,0-15.17,1.4,8.12,8.12,0,0,0-.75.56L134.87,160c-15.42-7.49-31.34-23.29-38.83-38.51l20.78-24.71c.2-.25.39-.5.57-.77a16,16,0,0,0,1.32-15.06l0-.12L97.54,33.64a16,16,0,0,0-16.62-9.52A56.26,56.26,0,0,0,32,80c0,79.4,64.6,144,144,144a56.26,56.26,0,0,0,55.88-48.92A16,16,0,0,0,222.37,158.46ZM176,208A128.14,128.14,0,0,1,48,80,40.2,40.2,0,0,1,82.87,40a.61.61,0,0,0,0,.12l21,47L83.2,111.86a6.13,6.13,0,0,0-.57.77,16,16,0,0,0-1,15.7c9.06,18.53,27.73,37.06,46.46,46.11a16,16,0,0,0,15.75-1.14,8.44,8.44,0,0,0,.74-.56L168.89,152l47,21.05h0s.08,0,.11,0A40.21,40.21,0,0,1,176,208Z\"/>",
    "pkg": "<path d=\"M128,129.09V232a8,8,0,0,1-3.84-1l-88-48.18a8,8,0,0,1-4.16-7V80.18a8,8,0,0,1,.7-3.25Z\" class=\"d\"/><path d=\"M223.68,66.15,135.68,18a15.88,15.88,0,0,0-15.36,0l-88,48.17a16,16,0,0,0-8.32,14v95.64a16,16,0,0,0,8.32,14l88,48.17a15.88,15.88,0,0,0,15.36,0l88-48.17a16,16,0,0,0,8.32-14V80.18A16,16,0,0,0,223.68,66.15ZM128,32l80.34,44-29.77,16.3-80.35-44ZM128,120,47.66,76l33.9-18.56,80.34,44ZM40,90l80,43.78v85.79L40,175.82Zm176,85.78h0l-80,43.79V133.82l32-17.51V152a8,8,0,0,0,16,0V107.55L216,90v85.77Z\"/>",
    "chevr": "<path d=\"M184.49,136.49l-80,80a12,12,0,0,1-17-17L159,128,87.51,56.49a12,12,0,1,1,17-17l80,80A12,12,0,0,1,184.49,136.49Z\"/>",
    "quote": "<path d=\"M108,72v72H40a8,8,0,0,1-8-8V72a8,8,0,0,1,8-8h60A8,8,0,0,1,108,72Zm108-8H156a8,8,0,0,0-8,8v64a8,8,0,0,0,8,8h68V72A8,8,0,0,0,216,64Z\" class=\"d\"/><path d=\"M100,56H40A16,16,0,0,0,24,72v64a16,16,0,0,0,16,16h60v8a32,32,0,0,1-32,32,8,8,0,0,0,0,16,48.05,48.05,0,0,0,48-48V72A16,16,0,0,0,100,56Zm0,80H40V72h60ZM216,56H156a16,16,0,0,0-16,16v64a16,16,0,0,0,16,16h60v8a32,32,0,0,1-32,32,8,8,0,0,0,0,16,48.05,48.05,0,0,0,48-48V72A16,16,0,0,0,216,56Zm0,80H156V72h60Z\"/>",
    "star": "<path d=\"M229.06,108.79l-48.7,42,14.88,62.79a8.4,8.4,0,0,1-12.52,9.17L128,189.09,73.28,222.74a8.4,8.4,0,0,1-12.52-9.17l14.88-62.79-48.7-42A8.46,8.46,0,0,1,31.73,94L95.64,88.8l24.62-59.6a8.36,8.36,0,0,1,15.48,0l24.62,59.6L224.27,94A8.46,8.46,0,0,1,229.06,108.79Z\" class=\"d\"/><path d=\"M239.18,97.26A16.38,16.38,0,0,0,224.92,86l-59-4.76L143.14,26.15a16.36,16.36,0,0,0-30.27,0L90.11,81.23,31.08,86a16.46,16.46,0,0,0-9.37,28.86l45,38.83L53,211.75a16.38,16.38,0,0,0,24.5,17.82L128,198.49l50.53,31.08A16.4,16.4,0,0,0,203,211.75l-13.76-58.07,45-38.83A16.43,16.43,0,0,0,239.18,97.26Zm-15.34,5.47-48.7,42a8,8,0,0,0-2.56,7.91l14.88,62.8a.37.37,0,0,1-.17.48c-.18.14-.23.11-.38,0l-54.72-33.65a8,8,0,0,0-8.38,0L69.09,215.94c-.15.09-.19.12-.38,0a.37.37,0,0,1-.17-.48l14.88-62.8a8,8,0,0,0-2.56-7.91l-48.7-42c-.12-.1-.23-.19-.13-.5s.18-.27.33-.29l63.92-5.16A8,8,0,0,0,103,91.86l24.62-59.61c.08-.17.11-.25.35-.25s.27.08.35.25L153,91.86a8,8,0,0,0,6.75,4.92l63.92,5.16c.15,0,.24,0,.33.29S224,102.63,223.84,102.73Z\"/>"
    };
  // Phosphor icons (MIT licence): two tone, so the soft fill carries the colour of whatever button holds them
  const ic = (n) => `<svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">${I[n] || ''}</svg>`;

  /* ---------- wallet: every new visitor sees the wallet amount waiting; it goes to checkout as one discount code ---------- */
  const W = { code: String(M.walletCode || '').trim().toUpperCase(), amt: +M.walletAmount || 350 };
  W.on = () => !!W.code && store.get('mWallet', 'on') === 'on';
  W.set = (v) => { store.set('mWallet', v ? 'on' : 'off'); };
  // a code picked in the wallet; it replaces the welcome credit once the bag reaches its minimum (one discount per order)
  const CODE = { get: () => String(store.get('mCode', '') || ''), set: (c) => { store.set('mCode', c || ''); } };
  const GIFT = { get: () => Object.assign({ to: '', note: '', pack: true }, store.get('mGift', {})), set: (g) => store.set('mGift', g) };

  /* ---------- routes: real store addresses, drawn in place ---------- */
  const COL = { sneakers: 'Sneakers', 'leather-shoes': 'Leather', leather: 'Leather', casual: 'Hybrids', hybrids: 'Hybrids', sale: 'Sale' };
  const NATIVE = { giving: 'giving', gifts: 'gifts', offers: 'offers', feed: 'feed', liked: 'liked' };
  const DRAWN = { manifesto: 'manifesto', contract: 'contract', track: 'track', policies: 'policies', about: 'about', contact: 'contact' };
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
    // pages the storefront draws from its own code open in place, with no page load
    if ((m = p.match(/^\/pages\/([^/]+)\/?$/)) && DRAWN[m[1]] && API.draw) return { v: 'page', a: DRAWN[m[1]], hash: url.hash };
    // every other content page (policy pages, the Journal and its guides, search) is fetched in the background and drawn in place
    if (/^\/(pages\/[^/]+|blogs\/[^?#]+|policies\/[^/]+|search)\/?$/.test(p) && !/^\/pages\/(alerts|runway)\/?$/.test(p) && window.DOMParser && window.fetch) return { v: 'page', remote: url.pathname + url.search, hash: url.hash };
    return null;
  }
  const href = {
    home: root + '/', bag: root + '/cart', liked: root + '/pages/liked', giving: root + '/pages/giving', gifts: root + '/pages/gifts', offers: root + '/pages/offers', feed: root + '/pages/feed',
    shop: (c) => !c || c === 'All' ? root + '/collections/all' : c === 'Sale' ? root + '/collections/sale' : root + '/collections/' + ({ Sneakers: 'sneakers', Leather: 'leather-shoes', Hybrids: 'casual' }[c] || 'all'),
    product: (h) => root + '/products/' + h
  };
  const TITLE = { bag: 'Your bag', giving: 'Philanthropy', gifts: 'Gifts', offers: 'Wallet', feed: 'The Feed', liked: 'Liked', offline: 'Offline' };
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
      : `<button class="m-ib m-soft" type="button" data-back aria-label="Back">${ic('back', 2.2)}</button>`;
    const title = TITLE[v] || state.pageTitle || (document.title.split('|')[0] || '').trim() || 'DAUR Supply';
    const mid = brand ? logo() : `<span class="m-top-t">${esc(title)}</span>`;
    const n = API.cart.reduce((a, l) => a + l.qty, 0);
    const cred = DEL + (W.on() ? W.amt : 0);
    const right = (v === 'home' || v === 'shop')
      ? `<a class="m-chip" href="${href.offers}" data-m aria-label="${esc(fmt(cred))} in credits, open your wallet">${ic('wallet')}<span>${esc(fmt(cred))}</span></a>`
      : v === 'bag' ? '<span class="m-ib" aria-hidden="true"></span>'
        : `<a class="m-ib m-soft m-bagbtn" href="${href.bag}" data-m aria-label="Bag, ${n} ${n === 1 ? 'pair' : 'pairs'}">${ic('bag')}${n ? `<i>${n}</i>` : ''}</a>`;
    top.innerHTML = left + mid + right;
    top.classList.toggle('clear', v === 'giving');
  }
  function paintTab() {
    const n = API.cart.reduce((a, l) => a + l.qty, 0);
    const a = (v, h, icon, label) => `<a href="${h}" data-m aria-label="${label}"${cur.v === v ? ' aria-current="page"' : ''}>${ic(icon)}<i></i></a>`;
    tab.innerHTML = `<div class="t-row">${a('home', href.home, 'home', 'Home')}${a('shop', href.shop(), 'search', 'Shop and search')}<a class="t-bag" href="${href.bag}" data-m aria-label="Bag, ${n} ${n === 1 ? 'pair' : 'pairs'}"${cur.v === 'bag' ? ' aria-current="page"' : ''}>${ic('bag')}<span class="t-n">${n || ''}</span><i></i></a>${a('liked', href.liked, 'heart', 'Liked')}<button class="t-btn" type="button" data-menu aria-label="Menu">${ic('grid')}<i></i></button></div>`;
    tab.classList.toggle('m-off', cur.v === 'product' || (cur.v === 'bag' && API.cart.length > 0));
  }

  /* ---------- cards ---------- */
  function card(p, big, mode) {
    const v = firstV(p), t = tintOf(p);
    const badge = API.onSale(v) ? `<span class="m-badge">${API.pct(v)}% off</span>` : '';
    const inner = `${img(p, v, 'c-img')}${big ? '' : badge}<span class="c-n">${esc(p.name)}</span><span class="c-t">${esc(p.category)}</span><span class="c-p">${price(v)}</span>`;
    const act = mode === 'gift' ? `<button class="m-act" type="button" data-quick="${esc(p.id)}" data-mode="gift">${ic('gift')}<span>Gift</span></button>`
      : mode === 'give' ? `<button class="m-act g" type="button" data-quick="${esc(p.id)}" data-mode="give">${ic('hand')}<span>Sponsor</span></button>`
        : `<button class="m-plus" type="button" data-quick="${esc(p.id)}" aria-label="Quick add ${esc(p.name)}"><i>${ic('plus', 2.6)}</i></button>`;
    return `<div class="${big ? 'm-card' : 'm-tile'}" style="--tn:${TINT[t]}"><a href="${href.product(p.id)}" data-m class="c-link" aria-label="${esc(p.name + ', ' + p.category + ', ' + fmt(v.price))}"></a>${inner}
      <button class="m-heart" type="button" data-wish="${esc(p.id)}" aria-pressed="${wished(p.id)}" aria-label="Save ${esc(p.name)}">${ic('heart')}</button>${act}</div>`;
  }
  function row(p) {
    const v = firstV(p), t = tintOf(p), x = pic(p, v);
    return `<div class="m-li"><a class="c-link" href="${href.product(p.id)}" data-m aria-label="${esc(p.name + ', ' + fmt(v.price))}"></a><span class="l-img" style="--tn:${TINT[t]}"><img class="${x.cut ? '' : 'blend'}" src="${esc(x.src)}" alt="" loading="lazy"></span><span class="l-t"><b>${esc(p.name)}</b><small>${esc(p.category)} · EU ${esc(p.sizes[0])} to ${esc(p.sizes[p.sizes.length - 1])}</small><span class="l-p">${price(v)}</span></span><button class="l-add" type="button" data-quick="${esc(p.id)}" aria-label="Add ${esc(p.name)} to bag">${ic('bag')}</button></div>`;
  }
  const cats = () => { const s = []; P().forEach((p) => { if (!s.includes(p.category)) s.push(p.category); }); return s; };
  const inCat = (p, c) => !c || c === 'All' || c === 'Popular' || (c === 'Sale' ? p.variants.some(API.onSale) : p.category === c);
  const pills = (list, on, attr, alt) => list.map((c) => `<button class="m-pill${alt ? ' alt' : ''}" type="button" ${attr}="${esc(c)}" aria-pressed="${c === on}">${esc(c)}</button>`).join('');
  const hasSale = () => P().some((p) => p.variants.some(API.onSale));

  /* ---------- small shared pieces ---------- */
  // gift and give, side by side: gold for someone you know, green for someone in need
  // gift or give: two cards that say plainly who the pair is for and what happens next
  const duo = (k, sm) => { const g = k === 'gift'; return `<a class="r5-card ${k}${sm ? ' sm' : ''}" href="${g ? href.gifts : href.giving}" data-m><span class="r5-rib">${g ? 'Your note inside' : 'DAUR adds ' + esc(fmt(DAUR_ADD))}</span><span class="r5-ic">${ic(g ? 'gift' : 'hand')}</span><b class="r5-t">${g ? 'Gift a pair' : 'Philanthropy'}</b><small class="r5-who">${g ? 'For someone you know' : 'A pair for someone in need'}</small>${sm ? '' : `<span class="r5-p">${g ? 'You pick the style and size. Your note goes in the box, sent to his door.' : 'We match the size and hand it over with care, in person. A private photo reaches you.'}</span>`}<span class="r5-go">${g ? 'Choose a gift' : 'Sponsor a pair'}${ic('arrow')}</span></a>`; };
  const ticker = () => { const t = [[ 'truck', delTxt() ], ['swap', (C.exchangeDays || 5) + ' day size swap'], ['pin', 'Made in Lahore, Sialkot, Kasur'], ['chat', 'Every order confirmed on WhatsApp']].map(([i, x]) => `<span>${ic(i)}${esc(x)}</span>`).join('');
    return `<div class="m-tick" aria-label="What you get"><div class="tk-in">${t}<span aria-hidden="true" class="tk-dup">${t}</span></div></div>`; };
  const socRow = (cls) => `<div class="m-soc ${cls || ''}">${SOC.map(([k, n, h, u]) => `<a class="s-${k}" href="${u}"${k === 'mail' ? '' : ' target="_blank" rel="noopener me"'} aria-label="${n}: ${esc(h)}">${ic(k)}</a>`).join('')}</div>`;
  const follow = () => `<section class="m-follow"><span class="m-kick">${ic('spark')}Find us</span><b>Follow DAUR Supply</b>
    <div class="f-list">${SOC.map(([k, n, h, u]) => `<a class="s-${k}" href="${u}"${k === 'mail' ? '' : ' target="_blank" rel="noopener me"'}><span class="f-i">${ic(k)}</span><span><b>${n}</b><small>${esc(h)}</small></span>${ic('arrow')}</a>`).join('')}</div></section>`;

  /* ---------- views ---------- */
  const V = {};
  const saving = (p) => Math.max.apply(null, p.variants.map((v) => API.onSale(v) ? v.compareAt - v.price : 0));
  /* ---------- home: offers that run out, then pairs that never stop ---------- */
  function offerSlides() {
    const out = [];
    const daysLeft = (e) => { if (!e) return 0; const d = Math.ceil((new Date(e) - new Date()) / 864e5); return d > 0 ? d : 0; };
    if (W.code && W.on()) out.push({ k: 'Waiting in your wallet', big: fmt(W.amt), l: 'Yours on your first order. It goes to waste if you never use it.', cta: 'Use it now', h: href.offers });
    coupons().forEach((c) => { const d = daysLeft(c.ends); out.push({ k: d ? (d === 1 ? 'Last day' : 'Ends in ' + d + ' days') : 'Live now', big: fmt(c.amt) + ' off', l: (c.min ? 'On orders of ' + fmt(c.min) + ' or more. ' : '') + 'Code ' + c.code + ', applied for you.', cta: 'See the offer', h: href.offers }); });
    P().filter((p) => p.variants.some(API.onSale)).sort((x, y) => saving(y) - saving(x)).slice(0, 3).forEach((p) => { const v = p.variants.find(API.onSale); out.push({ k: 'Price cut · ' + API.pct(v) + '% off', big: fmt(v.compareAt - v.price) + ' off', l: p.name + ', now ' + fmt(v.price) + ' instead of ' + fmt(v.compareAt) + '.', cta: 'Grab it', h: href.product(p.id), p, v }); });
    out.push({ k: 'On every order', big: fmt(DEL), l: 'Delivery credit. Your pair travels to any city in Pakistan on us.', cta: 'Shop all', h: href.shop() });
    return out;
  }
  function promo() {
    const sl = offerSlides();
    return `<section class="m-promo" aria-roledescription="carousel" aria-label="Offers"><div class="pr-track" id="mPromo">${sl.map((x, i) => `<a class="pr-s" href="${x.h}" data-m aria-label="${esc(x.big + ', ' + x.l)}"><span class="pr-k">${ic(i === 0 && x.cta === 'Use it now' ? 'wallet' : x.p ? 'tag' : 'clock')}${esc(x.k)}</span><b class="pr-big">${esc(x.big)}</b><span class="pr-l">${esc(x.l)}</span><span class="pr-go">${esc(x.cta)}${ic('arrow')}</span>${x.p ? img(x.p, x.v, 'pr-img', '') : `<span class="pr-dm">${DMARK}</span>`}</a>`).join('')}</div>
      <div class="pr-dots" aria-hidden="true">${sl.map((x, i) => `<i${i ? '' : ' class="on"'}></i>`).join('')}</div></section>`;
  }
  function bindPromo() {
    const t = $('#mPromo'); if (!t) return;
    const dots = $$('.pr-dots i', view), n = t.children.length; let i = 0, hold = false, tm;
    const mark = () => { const k = Math.round(t.scrollLeft / Math.max(1, t.clientWidth)); if (k !== i) { i = k; dots.forEach((d, j) => d.classList.toggle('on', j === i)); } };
    t.addEventListener('scroll', () => { cancelAnimationFrame(tm); tm = requestAnimationFrame(mark); }, { passive: true });
    ['touchstart', 'pointerdown'].forEach((ev) => t.addEventListener(ev, () => { hold = true; clearTimeout(t._r); t._r = setTimeout(() => { hold = false; }, 6000); }, { passive: true }));
    if (reduce || n < 2) return;
    clearInterval(V._promo);
    V._promo = setInterval(() => { if (!t.isConnected) { clearInterval(V._promo); return; } if (hold || document.hidden) return; t.scrollTo({ left: ((i + 1) % n) * t.clientWidth, behavior: 'smooth' }); }, 4200);
  }
  // after Fresh in the home page keeps going: sale, each style, then more pairs, batch after batch
  const shuffle = (a, seed) => { const r = a.slice(); let x = seed || 7; for (let k = r.length - 1; k > 0; k--) { x = (x * 9301 + 49297) % 233280; const j = Math.floor(x / 233280 * (k + 1)); [r[k], r[j]] = [r[j], r[k]]; } return r; };
  function homeBlock(k) {
    const all = P();
    const plan = [];
    if (hasSale()) plan.push(['On sale now', all.filter((p) => p.variants.some(API.onSale)), href.shop('Sale')]);
    cats().forEach((c) => plan.push([c, all.filter((p) => p.category === c), href.shop(c)]));
    if (k < plan.length) return plan[k];
    const round = k - plan.length;
    if (round >= 4) return null;
    return [['More for you', 'Picked for you', 'Worth a second look', 'Before you go'][round], shuffle(all, round + 3), href.shop()];
  }
  function moreHome() {
    const box = $('#mMore'); if (!box) return;
    const k = +(box.dataset.k || 0), b = homeBlock(k);
    if (!b) { box.insertAdjacentHTML('beforeend', `<div class="m-end"><b>You have seen every pair.</b><span class="m-mute">New pairs land here first.</span><a class="m-cta solo" href="${href.shop()}" data-m>Shop all</a></div>`); $('#mMoreSent') && $('#mMoreSent').remove(); return; }
    box.dataset.k = k + 1;
    if (b[1].length) box.insertAdjacentHTML('beforeend', `<div class="m-row m-pad" style="margin-top:28px"><h2 class="m-h2">${esc(b[0])}</h2><a class="m-link" href="${b[2]}" data-m>See all</a></div><div class="m-grid">${b[1].map((p) => card(p, false)).join('')}</div>`);
    else moreHome();
  }
  function bindMore() {
    const s = $('#mMoreSent'); if (!s || !('IntersectionObserver' in window)) { for (let i = 0; i < 4; i++) moreHome(); return; }
    const near = () => { const x = $('#mMoreSent'); return x && x.getBoundingClientRect().top < innerHeight + 600; };
    const io = new IntersectionObserver((es) => { if (!es[0].isIntersecting) return; let n = 0; do { moreHome(); n++; } while (near() && n < 2); if (!$('#mMoreSent')) io.disconnect(); }, { rootMargin: '600px 0px' });
    io.observe(s);
    // the observer only speaks on a change, so a long scroll checks again
    const chk = () => { if (!$('#mMoreSent') || cur.v !== 'home') { window.removeEventListener('scroll', chk); return; } if (near()) moreHome(); };
    window.addEventListener('scroll', chk, { passive: true });
  }
  V.home = function () {
    const all = P();
    const c = state.homeCat || 'All';
    const list = all.filter((p) => inCat(p, c));
    const fresh = all.slice().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 3);
    const pc = ['All'].concat(cats()).concat(hasSale() ? ['Sale'] : []);
    view.innerHTML = `${promo()}
      <div class="m-pills" role="group" aria-label="Filter">${pc.map((x) => `<button class="m-pill${x === 'Sale' ? ' sale' : ''}" type="button" data-hcat="${esc(x)}" aria-pressed="${x === c}">${x === 'Sale' ? ic('tag') : ''}${esc(x)}</button>`).join('')}</div>
      <div class="m-car" aria-label="Pairs">${list.map((p) => card(p, true)).join('') || '<p class="m-mute m-pad">Nothing here yet.</p>'}</div>
      ${ticker()}
      <section class="r5-for m-pad"><div class="r5-for-h"><h2 class="m-h2">Buying for someone else?</h2><button class="m-link" type="button" data-explain>${ic('help')}Which one?</button></div>
      <div class="r5-duo">${duo('gift')}${duo('give')}</div></section>
      <div class="m-row m-pad" style="margin-top:24px"><h2 class="m-h2">Fresh in</h2><a class="m-link" href="${href.shop()}" data-m>See all</a></div>
      <div class="m-rows">${fresh.map(row).join('')}</div>
      <div id="mMore" data-k="0"></div><div id="mMoreSent" class="m-skel" aria-hidden="true"><div class="sk-row"><div class="sk sk-c"></div><div class="sk sk-c"></div></div></div>`;
    bindPromo(); bindMore();
  };
  /* ---------- shop: search, style, sort and filter ---------- */
  const SORTS = [['feat', 'Featured'], ['new', 'Newest'], ['low', 'Price: low to high'], ['high', 'Price: high to low'], ['save', 'Biggest saving']];
  const PRICES = [['u4', 'Under Rs 4,000', (n) => n < 4000], ['m4', 'Rs 4,000 to 4,500', (n) => n >= 4000 && n <= 4500], ['o4', 'Above Rs 4,500', (n) => n > 4500]];
  const FAM = [['Black', /black|jet|onyx/i], ['Brown', /brown|tan|chocolate|coffee|cognac|oxblood|burgundy|maroon/i], ['White', /white|cream|ivory|off/i], ['Grey', /grey|gray|stone|ash|concrete/i], ['Sand', /sand|beige|khaki|camel/i], ['Other colours', /./]];
  const fam = (c) => (FAM.find(([, r]) => r.test(c || '')) || ['Other colours'])[0];
  const F = () => (state.f = state.f || { sizes: [], cols: [], price: '', sale: false, stock: false });
  const fCount = () => { const f = F(); return f.sizes.length + f.cols.length + (f.price ? 1 : 0) + (f.sale ? 1 : 0) + (f.stock ? 1 : 0); };
  function shopList(c, q, f) {
    let list = P().filter((p) => inCat(p, c) && (!q || (p.name + ' ' + p.category + ' ' + p.variants.map((v) => v.color).join(' ')).toLowerCase().includes(q)));
    if (f.sizes.length) list = list.filter((p) => p.variants.some((v) => f.sizes.some((z) => ((v.stock || {})[z] || 0) > 0)));
    if (f.cols.length) list = list.filter((p) => p.variants.some((v) => f.cols.includes(fam(v.color))));
    if (f.price) { const t = PRICES.find((x) => x[0] === f.price); if (t) list = list.filter((p) => t[2](API.minPrice(p))); }
    if (f.sale) list = list.filter((p) => p.variants.some(API.onSale));
    if (f.stock) list = list.filter((p) => p.variants.some((v) => API.stockOf(v) > 0));
    const s = state.sort || 'feat';
    if (s === 'new') list.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    if (s === 'low') list.sort((a, b) => API.minPrice(a) - API.minPrice(b));
    if (s === 'high') list.sort((a, b) => API.minPrice(b) - API.minPrice(a));
    if (s === 'save') list.sort((a, b) => saving(b) - saving(a));
    return list;
  }
  const shopNow = () => { const c = state.shopCat || cur.a || 'All', q = (state.q != null ? state.q : cur.q || '').trim().toLowerCase(); return { c, q, list: shopList(c, q, F()) }; };
  V.shop = function () {
    const { c, list } = shopNow();
    const pc = ['All'].concat(cats()).concat(hasSale() ? ['Sale'] : []);
    if (!view.querySelector('.m-search')) {
      view.innerHTML = `<div class="m-row m-pad"><h1 class="m-h1">Shop</h1><span class="m-mute" id="mCount"></span></div>
        <label class="m-search"><span class="m-sr">Search pairs</span>${ic('search')}<input type="search" id="mQ" placeholder="Search pairs, colours, styles" autocomplete="off" enterkeyhint="search" value="${esc(state.q != null ? state.q : cur.q || '')}"></label>
        <div class="m-tools m-pad" id="mTools"></div>
        <div class="m-pills" role="group" aria-label="Style" id="mSPills"></div><div class="m-applied m-pad" id="mApplied"></div><div class="m-grid" id="mGrid"></div>`;
      $('#mQ').addEventListener('input', (e) => { state.q = e.target.value; V.shop(); });
    }
    const n = fCount(), so = (SORTS.find((x) => x[0] === (state.sort || 'feat')) || SORTS[0])[1];
    $('#mTools').innerHTML = `<button type="button" class="m-tool" data-sortsheet aria-haspopup="dialog">${ic('sort')}<span><small>Sort</small>${esc(so)}</span></button><button type="button" class="m-tool${n ? ' on' : ''}" data-filtersheet aria-haspopup="dialog">${ic('filter')}<span><small>Filter</small>${n ? n + ' on' : 'Size, colour, price'}</span></button>`;
    $('#mSPills').innerHTML = pills(pc, c, 'data-scat', true);
    const f = F(), chips = [].concat(f.sizes.map((z) => ['size:' + z, 'EU ' + z]), f.cols.map((x) => ['col:' + x, x]), f.price ? [['price:', PRICES.find((x) => x[0] === f.price)[1]]] : [], f.sale ? [['sale:', 'On sale']] : [], f.stock ? [['stock:', 'In stock']] : []);
    $('#mApplied').innerHTML = chips.length ? chips.map(([k, l]) => `<button type="button" data-funset="${esc(k)}" aria-label="Remove ${esc(l)}">${esc(l)}${ic('x', 2.4)}</button>`).join('') + '<button type="button" class="clr" data-fclear>Clear all</button>' : '';
    $('#mCount').textContent = list.length + (list.length === 1 ? ' pair' : ' pairs');
    const qq = (state.q != null ? state.q : cur.q || '').trim();
    const sugg = cats().concat(['Black', 'Brown']).slice(0, 5), pop = P().slice(0, 4);
    $('#mGrid').innerHTML = list.map((p) => card(p, false)).join('') || `<div class="m-none" style="grid-column:1/-1"><span class="n-i">${ic('search')}</span><b>${qq ? 'No pairs match “' + esc(qq) + '”' : 'No pairs match these filters'}</b><span class="m-mute">${n ? 'Try fewer filters, or one of these:' : 'Try one of these:'}</span>
        <div class="n-chips">${sugg.map((x) => `<button type="button" data-try="${esc(x)}">${esc(x)}</button>`).join('')}</div>
        ${n ? '<button type="button" class="m-ghost" data-fclear>Clear filters</button>' : ''}
        <a class="m-wa" href="https://wa.me/${esc(WA)}?text=${encodeURIComponent('Assalam o Alaikum DAUR, I am looking for ' + (qq || 'a pair') + '.')}" target="_blank" rel="noopener">${ic('wa')}Tell us what you want on WhatsApp</a></div>
      ${pop.length ? `<h2 class="m-h2" style="grid-column:1/-1;margin:18px 0 0">Popular right now</h2>${pop.map((p) => card(p, false)).join('')}` : ''}`;
  };
  function sortSheet() {
    const s = state.sort || 'feat';
    openSheet(`<h3 class="sh-h">Sort by</h3><div class="m-opts">${SORTS.map(([k, l]) => `<button type="button" data-sort="${k}" aria-pressed="${s === k}"><span>${esc(l)}</span><i>${ic('check', 2.6)}</i></button>`).join('')}</div>`);
  }
  function filterSheet() {
    const f = F(), all = P();
    const sizes = [...new Set(all.reduce((a, p) => a.concat(p.sizes), []))].sort((x, y) => x - y);
    const cols = FAM.map((x) => x[0]).filter((k) => all.some((p) => p.variants.some((v) => fam(v.color) === k)));
    const { list } = shopNow();
    const chip = (attr, val, on, label) => `<button type="button" class="m-fchip" ${attr}="${esc(val)}" aria-pressed="${on}">${esc(label)}</button>`;
    openSheet(`<div class="m-row"><h3 class="sh-h" style="margin:0">Filter</h3>${fCount() ? '<button type="button" class="m-link" data-fclear>Clear all</button>' : ''}</div>
      <h4 class="sh-k">Size (EU)</h4><div class="m-fchips">${sizes.map((z) => chip('data-fsize', z, f.sizes.includes(String(z)), z)).join('')}</div>
      <h4 class="sh-k">Colour</h4><div class="m-fchips">${cols.map((k) => chip('data-fcol', k, f.cols.includes(k), k)).join('')}</div>
      <h4 class="sh-k">Price</h4><div class="m-fchips">${PRICES.map(([k, l]) => chip('data-fprice', k, f.price === k, l)).join('')}</div>
      <h4 class="sh-k">Only show</h4><div class="m-fchips">${chip('data-fsale', '1', f.sale, 'On sale')}${chip('data-fstock', '1', f.stock, 'In stock')}</div>
      <button type="button" class="m-cta wide" data-fapply><span>Show ${list.length} ${list.length === 1 ? 'pair' : 'pairs'}</span></button>`);
  }
  V.liked = function () {
    const list = API.wish.map(API.prod).filter((p) => p && !p.hidden && !p.giving);
    view.innerHTML = `<div class="m-pad"><h1 class="m-h1">Liked</h1></div>` + (list.length ? `<div class="m-grid">${list.map((p) => card(p, false)).join('')}</div>`
      : `<div class="m-empty"><img src="${asset('m-volt.webp')}" alt=""><b>Nothing liked yet</b><span class="m-mute">Tap the heart on any pair to keep it here.</span><a class="m-cta solo" href="${href.shop()}" data-m>Shop now</a></div>
        <div class="m-row m-pad" style="margin-top:22px"><h2 class="m-h2">Worth a look</h2></div><div class="m-grid">${P().slice(0, 4).map((p) => card(p, false)).join('')}</div>`);
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
    const save = API.onSale(v) ? v.compareAt - v.price : 0;
    const give = state.mode === 'give';
    view.innerHTML = `<div class="m-pdp" style="--tn:${tint}">
      <div class="p-stage"><span class="p-ring" aria-hidden="true"></span>${img(p, v, 'p-img')}<span class="p-cat">${esc(p.category)}</span>${save ? `<span class="p-stk">Save<br>${esc(NF(save))}</span>` : ''}</div>
      <div class="p-info"><h1 class="p-n">${esc(p.name)}</h1><div class="p-pr"><b>${esc(fmt(v.price))}</b>${save ? `<s>${esc(fmt(v.compareAt))}</s><span class="p-save">You keep ${esc(fmt(save))}</span>` : ''}</div>
        <p class="p-meta">${ic('truck')}${esc(delTxt())} · ${esc(days())}</p></div>
      <div class="m-sec"><div class="m-row"><h3 style="margin:0">Who is it for?</h3><button class="m-link" type="button" data-explain>${ic('help')}Gift or Philanthropy?</button></div>
        <div class="m-modes" role="group" aria-label="Who is this pair for">${MODES.map(([k, l, i]) => `<button type="button" class="md-${k}" data-pmode="${k}" aria-pressed="${state.mode === k}"><span class="md-i">${ic(i)}</span><b>${l}</b><small>${k === 'me' ? 'Your size' : KIND[k].who}</small></button>`).join('')}</div>
        ${state.mode === 'gift' ? `<p class="m-modenote">${ic('gift')}<span><b>Gift for someone you know.</b> You pick his size. Gift packing and your note are added in the bag. Paid in full, nothing to pay at his door.</span></p>` : give ? `<p class="m-modenote g">${ic('hand')}<span><b>Sponsor a pair for someone in need.</b> No size needed. DAUR matches the size, hands it over in person, adds ${esc(fmt(DAUR_ADD))} of its own and sends you a private photo.</span></p>` : ''}</div>
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
    const label = give ? 'Sponsor this pair' : !state.size ? 'Pick your size' : (state.mode === 'gift' ? 'Add as gift' : 'Add to bag') + ' · EU ' + state.size;
    b.innerHTML = `<span class="bb-l">${esc(fmt(v.price))} · ${esc(delTxt())} · ${esc(days())}</span>
      <div class="bb-r"><button class="m-round" type="button" data-wish="${esc(p.id)}" aria-pressed="${wished(p.id)}" aria-label="Save to Liked">${ic('heart')}</button>
      <button class="m-cta${give ? ' give' : ''}" type="button" data-add aria-disabled="${!ok}"><span>${esc(label)}</span></button></div>`;
  }

  /* ---------- credits: the welcome credit, the delivery credit and every live code, shown as money in the wallet ----------
     One code goes to checkout (Shopify takes one order discount at a time): the welcome credit, or a code the buyer picks.
     A code only counts once the bag reaches its minimum; until then it shows how much more is needed. */
  const amtOf = (o) => { const m = String((o.title || '') + ' ' + (o.details || '')).match(/Rs\.?\s*([\d,]+)\s*off/i); return m ? +m[1].replace(/,/g, '') : 0; };
  const coupons = () => (window.DAUR_OFFERS || []).filter((o) => o.code && String(o.code).toUpperCase() !== W.code && amtOf(o) > 0 && (!o.ends || new Date(o.ends) > new Date())).map((o) => ({ code: String(o.code).toUpperCase(), amt: amtOf(o), min: +o.min || 0, title: o.title || '', ends: o.ends })).sort((x, y) => y.amt - x.amt);
  function credits(sub) {
    // the code in use: one the buyer picked if the bag qualifies, otherwise the welcome credit when it is switched on
    const pick = CODE.get(), list = coupons().map((c) => Object.assign(c, { ok: sub >= c.min, need: Math.max(0, c.min - sub) }));
    const chosen = list.find((c) => c.code === pick);
    let use = null;
    if (chosen && chosen.ok) use = { code: chosen.code, amt: Math.min(chosen.amt, sub), label: chosen.code + ' credit' };
    else {
      // nothing picked (or the pick is still locked): the biggest credit the bag qualifies for is used
      const best = list.filter((c) => c.ok && sub > 0).sort((x, y) => y.amt - x.amt)[0];
      if (best && (!W.on() || best.amt > W.amt)) use = { code: best.code, amt: Math.min(best.amt, sub), label: best.code + ' credit', auto: true };
      else if (W.on()) use = { code: W.code, amt: Math.min(W.amt, sub), label: 'Welcome credit' };
    }
    return { list, chosen, use };
  }
  // what is paid now and what at the door: gifts and giving in full; own pairs a fixed advance of Rs 500 (one pair) or Rs 1,000 (more)
  function payPlan(lines, total) {
    const sum = (k) => lines.filter((x) => x.mode === k).reduce((a, x) => a + x.total, 0);
    const own = lines.filter((x) => x.mode === 'me'), ownPairs = own.reduce((a, x) => a + x.qty, 0);
    const full = sum('gift') + sum('give');
    const adv = full ? Math.min(total, full) : Math.min(total, ownPairs > 1 ? 1000 : 500);
    const onlyFull = !own.length;
    const choice = onlyFull ? 'full' : store.get('mPay', 'adv') === 'full' ? 'full' : 'adv';
    const now = choice === 'full' ? total : adv;
    return { adv, full, onlyFull, choice, now, door: Math.max(0, total - now), ownPairs };
  }
  // one set of details per gift pair, or one set for all of them
  const giftUnits = () => { const u = []; API.cart.forEach((l, i) => { if (l.mode === 'gift') for (let j = 0; j < l.qty; j++) u.push({ key: l.pid + '|' + l.vid + '|' + l.size + '|' + j, i, j, l }); }); return u; };
  const GD = { get: () => { const g = Object.assign({ same: false, pack: true, all: {}, each: {} }, store.get('mGift2', {})); return g; }, set: (g) => store.set('mGift2', g) };
  const gdOf = (g, key) => (g.same ? g.all : g.each[key]) || {};
  function giftMissing() {
    const g = GD.get(), u = giftUnits();
    for (const x of u) { const d = gdOf(g, x.key); if (!String(d.to || '').trim() || String(d.phone || '').replace(/\D/g, '').length < 10 || !String(d.addr || '').trim()) return g.same ? 'all' : x.key; if (g.same) break; }
    return '';
  }

  V.bag = function () {
    const t = API.totals();
    if (!t.lines.length) {
      const pick = P().slice(0, 4);
      view.innerHTML = `<div class="m-empty" style="padding-top:40px"><img src="${asset('m-ward-brown.webp')}" alt=""><b>Your bag is empty</b><span class="m-mute">${W.code ? esc(fmt(W.amt + DEL)) + ' in credits is waiting for your first order.' : 'Pick a pair to start.'}</span><a class="m-cta solo" href="${href.shop()}" data-m>Shop now</a></div>
        ${pick.length ? `<div class="m-row m-pad" style="margin-top:28px"><h2 class="m-h2">Start with these</h2><a class="m-link" href="${href.shop()}" data-m>See all</a></div><div class="m-grid">${pick.map((p) => card(p, false)).join('')}</div>` : ''}
        ${API.wish.length ? `<a class="gv-out" href="${href.liked}" data-m style="margin-top:22px"><span class="f-i">${ic('heart')}</span><span><b>${API.wish.length} liked ${API.wish.length === 1 ? 'pair' : 'pairs'}</b><small>Pick up where you left off</small></span>${ic('arrow')}</a>` : ''}`;
      buyBar().remove();
      return;
    }
    const lines = API.cart;
    const L = t.lines.map((d, i) => ({ d, i, mode: (lines[i] && lines[i].mode) || 'me', total: d.total, qty: d.l.qty }));
    const ships = L.some((x) => x.mode !== 'give');
    const cr = credits(t.subtotal), off = cr.use ? cr.use.amt : 0;
    const delivery = ships ? DEL : 0;
    const total = Math.max(0, t.subtotal - off);
    const plan = payPlan(L, total);
    const nGive = L.filter((x) => x.mode === 'give').reduce((a, x) => a + x.qty, 0);
    const g = GD.get(), units = giftUnits();
    const lineHtml = ({ d, i, mode }) => {
      const x = pic(d.p, d.v);
      return `<div class="m-line${mode !== 'me' ? ' k-' + mode : ''}" style="--tn:${TINT[tintOf(d.p)]}"><a class="ln-img" href="${href.product(d.p.id)}" data-m><img class="${x.cut ? '' : 'blend'}" src="${esc(x.src)}" alt="${esc(d.p.name)}"></a>
        <div class="ln-t">${mode === 'gift' ? `<span class="ln-tag">${ic('gift')}Gift</span>` : mode === 'give' ? `<span class="ln-tag g">${ic('hand')}Philanthropy</span>` : ''}<b>${esc(d.p.name)}</b><small>${esc(d.v.color)} · ${mode === 'give' ? 'Size matched by DAUR' : 'EU ' + esc(d.l.size)}</small><span class="ln-p">${esc(fmt(d.total))}</span></div>
        <div class="m-step"><button class="on" type="button" data-qty="${i}" data-d="1" aria-label="Add one">+</button><span>${d.l.qty}</span><button type="button" data-qty="${i}" data-d="-1" aria-label="${d.l.qty > 1 ? 'Remove one' : 'Remove pair'}">&#8722;</button></div></div>`;
    };
    const own = L.filter((x) => x.mode === 'me'), gifts = L.filter((x) => x.mode === 'gift'), gives = L.filter((x) => x.mode === 'give');
    const mixed = gifts.length || gives.length;
    const head = (k) => k === 'me' ? `<div class="bg-h me">${ic('bag')}<b>For you</b><small>${plan.ownPairs} ${plan.ownPairs === 1 ? 'pair' : 'pairs'}</small></div>`
      : `<div class="bg-h ${k}">${ic(KIND[k].icon)}<b>${k === 'gift' ? 'Gifts' : 'Philanthropy'}</b><small>${KIND[k].who}</small></div>`;
    const field = (key, f, label, ph, type, max, val) => `<label><span>${label}</span>${f === 'note' ? `<textarea data-gd="${esc(key)}" data-gf="note" maxlength="240" rows="2" placeholder="${esc(ph)}">${esc(val || '')}</textarea>` : `<input data-gd="${esc(key)}" data-gf="${f}" type="${type}" maxlength="${max}" placeholder="${esc(ph)}" value="${esc(val || '')}"${type === 'tel' ? ' inputmode="tel" autocomplete="off"' : ''}>`}</label>`;
    const form = (key, title) => { const d = key === 'all' ? g.all : (g.each[key] || {}); return `<fieldset class="gd" id="gd-${esc(key.replace(/\W/g, '_'))}"><legend>${title}</legend>
      ${field(key, 'to', 'His name', 'Ali Raza', 'text', 40, d.to)}${field(key, 'phone', 'His phone', '03xx xxxxxxx', 'tel', 15, d.phone)}
      ${field(key, 'addr', 'City and address', 'House, street, area, city', 'text', 160, d.addr)}${field(key, 'note', 'Your note in the box', 'Eid Mubarak, Abbu. From Ali', 'text', 240, d.note)}</fieldset>`; };
    const giftForms = units.length ? `<div class="m-giftbox"><div class="m-row"><b>${ic('note')}Who receives ${units.length === 1 ? 'the gift' : 'each gift'}</b><small class="m-mute">${units.length} ${units.length === 1 ? 'gift' : 'gifts'}</small></div>
      ${units.length > 1 ? `<button class="m-tog" type="button" data-gsame aria-pressed="${g.same}"><span>Same person for all gifts</span><span class="m-sw" aria-hidden="true"></span></button>` : ''}
      ${g.same || units.length === 1 ? form(units.length === 1 ? units[0].key : 'all', units.length === 1 ? 'Gift 1: ' + esc(API.prod(units[0].l.pid).name) : 'All ' + units.length + ' gifts') : units.map((u, k) => form(u.key, 'Gift ' + (k + 1) + ': ' + esc(API.prod(u.l.pid).name) + ', EU ' + esc(u.l.size))).join('')}
      <button class="m-tog" type="button" data-gpack aria-pressed="${g.pack}"><span>Gift packing</span><span class="m-sw" aria-hidden="true"></span></button>
      <small class="m-mute gd-n">We send each gift to the address written here.</small></div>` : '';
    const opt = (k, title, sub, amt) => `<button type="button" class="pay-o" data-pay="${k}" aria-pressed="${plan.choice === k}"><span class="po-r" aria-hidden="true"></span><span class="po-t"><b>${title}</b><small>${sub}</small></span><span class="po-a">${esc(fmt(amt))}</span></button>`;
    const pay = plan.onlyFull
      ? `<div class="m-pay"><h3>${ic('card')}How you pay</h3><div class="pay-o solo" aria-pressed="true"><span class="po-r" aria-hidden="true"></span><span class="po-t"><b>Paid in full now</b><small>${gives.length && !gifts.length ? 'Nothing for anyone to pay later' : 'Nothing to pay at his door'}</small></span><span class="po-a">${esc(fmt(total))}</span></div></div>`
      : `<div class="m-pay"><h3>${ic('card')}How would you like to pay?</h3>
        ${opt('adv', plan.full ? 'Gifts and philanthropy now, the rest at your door' : 'Advance now, the rest at your door', plan.full ? 'Your own pairs are paid when they arrive' : 'Only ' + fmt(plan.adv) + ' now, ' + fmt(Math.max(0, total - plan.adv)) + ' to the rider', plan.adv)}
        ${opt('full', 'Everything now', 'Nothing to pay at your door', total)}</div>`;
    view.innerHTML = `<div class="m-pad m-bag">
      ${own.length ? `${mixed ? head('me') : ''}${own.map(lineHtml).join('')}` : ''}
      ${gifts.length ? `<div class="bg-grp gift">${head('gift')}${gifts.map(lineHtml).join('')}${giftForms}</div>` : ''}
      ${gives.length ? `<div class="bg-grp give">${head('give')}${gives.map(lineHtml).join('')}<div class="m-givebox">${ic('hand')}<span><b>DAUR adds ${esc(fmt(DAUR_ADD * nGive))}.</b> For every pair you sponsor we add ${esc(fmt(DAUR_ADD))}: the ${esc(fmt(DEL))} delivery we do not spend, and ${esc(fmt(DAUR_ADD - DEL))} of our own. You get a private photo after the handover.</span></div></div>` : ''}
      <a class="m-credits" href="${href.offers}" data-m><span class="w-i">${ic('wallet')}</span><span class="w-t"><b>${cr.use ? esc(fmt(off + delivery)) + ' in credits on this order' : 'Your credits'}</b><small>${cr.chosen && !cr.chosen.ok ? 'Add ' + esc(fmt(cr.chosen.need)) + ' more to use ' + esc(cr.chosen.code) : cr.use ? esc(cr.use.label) + (delivery ? ' + delivery credit' : '') : 'Tap to see them'}</small></span>${ic('arrow')}</a>
      <div class="m-sum"><div><span>Pairs</span><span>${esc(fmt(t.subtotal))}</span></div>
        ${t.sale ? `<div><span>Sale saving</span><span class="s-g">${esc(fmt(t.sale))} kept</span></div>` : ''}
        ${ships ? `<div><span>Delivery</span><span>${esc(fmt(DEL))}</span></div><div><span>${ic('truck')}Delivery credit</span><span class="s-g">&#8722; ${esc(fmt(DEL))}</span></div>` : ''}
        ${off ? `<div><span>${ic('wallet')}${esc(cr.use.label)}</span><span class="s-g">&#8722; ${esc(fmt(off))}</span></div>` : ''}
        <hr><div class="s-tot"><span>Total</span><span>${esc(fmt(total))}</span></div></div>
      ${pay}
      <div class="m-now"><span>Today</span><b>${esc(fmt(plan.now))}</b>${plan.door ? `<span>At the door</span><b>${esc(fmt(plan.door))}</b>` : ''}</div>
      ${GIVE.on && GIVE.causes.length > 1 ? `<div class="m-vote"><b>Where should this quarter's slice go?</b><small class="m-mute">At least ${GIVE.pct}% of our profit. Your vote travels with your order.</small><div class="m-vote-o">${GIVE.causes.map((c) => `<button type="button" data-vote="${esc(c)}" aria-pressed="${store.get('sliceVote', '') === c}">${esc(c)}</button>`).join('')}</div></div>` : ''}
      <div class="m-trust"><span>${ic('truck')}Delivery in ${esc(days())}</span><span>${ic('swap')}Size swap within ${C.exchangeDays || 5} days</span><span>${ic('chat')}We confirm every order on WhatsApp</span></div>
    </div>`;
    $$('[data-gd]', view).forEach((el) => el.addEventListener('input', () => { const G = GD.get(), k = el.dataset.gd; const box = k === 'all' ? G.all : (G.each[k] = G.each[k] || {}); box[el.dataset.gf] = el.value; GD.set(G); el.closest('label').classList.remove('bad'); }));
    const b = buyBar();
    b.classList.add('on-bag');
    b.innerHTML = `<div class="bb-r"><button class="m-cta split" type="button" data-checkout><span>Checkout</span><span class="t-pill">${esc(fmt(total))}</span></button></div>`;
    state.plan = plan; state.cr = cr;
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
        <div class="gv-t"><span class="m-kick">${ic('hand')}Philanthropy</span><h1>One pair.<br>One person.<br>By hand.</h1><p>Pick any pair. We match the size, hand it over in person and add ${esc(fmt(DAUR_ADD))} of our own.</p><a class="m-cta gold" href="#gvPick" data-jump>Choose a pair</a></div></section>
      <div class="gv-stats">${given ? `<span><b>${NF(given)}</b><small>pairs given</small></span><span><b>${cities.length || 1}</b><small>${cities.length === 1 ? 'city' : 'cities'}</small></span>` : `<span><b>Round 1</b><small>handover after ${esc(quarterEnd())}</small></span>`}<span><b>7 days</b><small>to your private photo</small></span><span><b>+${esc(fmt(DAUR_ADD))}</b><small>from DAUR per pair</small></span></div>
      <section class="gv-card gv-anim">${handover(gp)}<b>From your hands to theirs.</b></section>
      <section class="gv-pick" id="gvPick"><h2 class="m-h2 m-pad">Choose the pair</h2>
        <div class="gv-rail">${all.map((p) => { const v = firstV(p), x = pic(p, v); return `<button class="gv-p" type="button" data-gp="${esc(p.id)}" aria-pressed="${p.id === state.gp}" style="--tn:${TINT[tintOf(p)]}"><img class="${x.cut ? '' : 'blend'}" src="${esc(x.src)}" alt=""><b>${esc(p.name)}</b><small>${esc(fmt(v.price))}</small></button>`; }).join('')}</div>
        ${gp ? `<div class="gv-sel" style="--tn:${TINT[tintOf(gp)]}">${img(gp, gv, 'gv-sel-i')}<div><b>${esc(gp.name)}</b><small>${esc(gv.color)} · size matched by DAUR</small><span>${esc(fmt(gv.price))}</span></div></div>
        <button class="m-hold" type="button" id="mHold" data-pid="${esc(gp.id)}"><span class="hold-r" aria-hidden="true"></span><span class="hold-t">${ic('hand')}Hold to sponsor</span></button><p class="m-mute gv-hint">Press and hold. Or tap twice.</p>` : ''}</section>
      <section class="gv-steps m-pad"><h2 class="m-h2">How it reaches them</h2>
        ${[['heart', 'You pick a pair', 'DAUR adds ' + fmt(DAUR_ADD) + ' to every pair sponsored.'], ['user', 'We match the size', 'To the person who receives it.'], ['hand', 'Handed over in person', 'In the round after the quarter closes.'], ['camera', 'A private photo, to you', 'Within 7 days of the handover.']].map(([i, h, p], k) => `<div class="gv-step" style="--tn:${tn(k)}"><span class="gv-n">${ic(i)}</span><span><b>${h}</b><small>${p}</small></span><em>0${k + 1}</em></div>`).join('')}</section>
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
  function burst(el, love) {
    if (reduce) return;
    const r = el.getBoundingClientRect();
    if (love) { const p = document.createElement('span'); p.className = 'r6-pulse'; p.style.left = (r.left + r.width / 2) + 'px'; p.style.top = (r.top + r.height / 2) + 'px'; document.body.appendChild(p); setTimeout(() => p.remove(), 900); }
    for (let i = 0; i < 14; i++) {
      const h = document.createElement('span'); h.className = 'm-burst' + (love ? ' love' : ''); h.innerHTML = ic('heart');
      h.style.left = (r.left + r.width / 2) + 'px'; h.style.top = (r.top + r.height / 2) + 'px';
      const a = (Math.PI * 2 * i) / 14, d = 70 + Math.random() * 60;
      h.style.setProperty('--x', Math.cos(a) * d + 'px'); h.style.setProperty('--y', (Math.sin(a) * d - 40) + 'px');
      document.body.appendChild(h); setTimeout(() => h.remove(), 1100);
    }
  }
  function observeIn() {
    const els = $$('.gv-mosaic img, .gv-step, .pg-sec, .gf-f, .fd-post, .r6-row, .r6-steps li, .r6-rt li, .r6-ch, .r6-mk>div', view);
    if (!('IntersectionObserver' in window) || reduce) return;
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -30px' });
    els.forEach((e) => { if (e.getBoundingClientRect().top > innerHeight) { e.classList.add('pre'); io.observe(e); } });
  }

  /* ---------- gifts ---------- */
  V.gifts = function () {
    const all = P();
    const hang = ['m-ward-brown.webp', 'm-moc-oxblood.webp', 'm-saddle.webp'];
    const bow = '<svg class="r6-bow" viewBox="0 0 64 40" aria-hidden="true"><path d="M32 20C22 6 6 4 6 14s16 10 26 6zM32 20c10-14 26-16 26-6s-16 10-26 6z"/><path d="M32 20l-8 18M32 20l8 18" fill="none" stroke-width="4" stroke-linecap="round"/><circle cx="32" cy="20" r="5"/></svg>';
    view.innerHTML = `<div class="m-gf r6-gf">
      <section class="r6-ghero"><div class="r6-hang" aria-hidden="true">${hang.map((h, i) => `<span class="r6-h h${i}"><i class="r6-rib"></i>${bow}<img src="${asset(h)}" alt=""></span>`).join('')}</div>
        <div class="r6-gt"><span class="r6-gk">${ic('gift')}Gifts from DAUR</span><h1>To keep you running through my mind.</h1><p>A pair chosen by you, your note inside, sent to his door with nothing to pay.</p>
        <a class="r6-gift" href="#gfPick" data-jump>${ic('heart')}Choose his pair</a></div></section>
      <ol class="r6-steps">${[['gift', 'You choose', 'The pair and his size'], ['note', 'You write', 'A note of up to 240 letters'], ['box', 'We wrap', 'Gift packing on request'], ['truck', 'He opens', 'At his door, fully paid']].map(([i, b, t], k) => `<li style="--i:${k}"><span>${ic(i)}</span><b>${b}</b><small>${t}</small></li>`).join('')}</ol>
      <div class="r6-swap">${ic('swap')}<span><b>Wrong size? It happens.</b><small>He can swap it within ${C.exchangeDays || 5} days.</small></span></div>
      <div class="m-row m-pad" style="margin-top:26px" id="gfPick"><h2 class="m-h2">Pick the pair</h2><span class="m-mute">${all.length} pairs</span></div>
      <div class="m-grid">${all.map((p) => card(p, false, 'gift')).join('')}</div>
      <a class="r6-phil" href="${href.giving}" data-m><span class="r6-pi">${ic('hand')}</span><span><b>Philanthropy</b><small>A pair for someone in need, handed over with care</small></span>${ic('arrow')}</a>
    </div>`;
    observeIn();
  };

  /* ---------- offers ---------- */
  V.offers = function () {
    const sale = P().filter((p) => p.variants.some(API.onSale));
    const t = API.totals(), sub = t.subtotal || 0, has = t.lines.length > 0;
    const cr = credits(sub), wal = W.on(), pick = CODE.get();
    const inUse = cr.use ? cr.use.code : '';
    const bal = DEL + (cr.use ? (has ? cr.use.amt : (cr.use.code === W.code ? W.amt : (cr.list.find((c) => c.code === cr.use.code) || {}).amt || 0)) : 0);
    const left = (e) => { if (!e) return ''; const d = Math.ceil((new Date(e) - new Date()) / 864e5); return d > 0 && d <= 14 ? `${d} ${d === 1 ? 'day' : 'days'} left` : ''; };
    view.innerHTML = `<div class="m-of">
      <section class="of-wallet"><span class="b-dm">${DMARK}</span><span class="m-kick">${ic('wallet')}Your credits</span><b class="of-amt">${esc(fmt(bal))}</b><small>${has ? 'Ready for the bag you have now.' : 'Ready for your next order.'}</small></section>
      <div class="m-pad"><h2 class="m-h2" style="margin-top:24px">In your wallet</h2></div>
      <div class="of-cr m-pad">
        <div class="cr-row on"><span class="cr-i">${ic('truck')}</span><span class="cr-t"><b>Delivery credit</b><small>Covers the ${esc(fmt(DEL))} delivery on every order that ships</small></span><b class="cr-a">${esc(fmt(DEL))}</b></div>
        ${W.code ? `<button type="button" class="cr-row${inUse === W.code ? ' on' : ''}" data-wtoggle aria-pressed="${wal}"><span class="cr-i">${ic('coins')}</span><span class="cr-t"><b>Welcome credit</b><small>${inUse === W.code ? 'In use on your next order' : inUse && wal ? 'Kept for later while ' + esc(inUse) + ' is in use' : wal ? 'Once per customer' : 'Switched off. Tap to switch on'}</small></span><b class="cr-a">${esc(fmt(W.amt))}</b></button>` : ''}
      </div>
      <div class="m-row m-pad" style="margin-top:26px"><h2 class="m-h2">More credits</h2><span class="m-mute">One per order</span></div>
      <div class="of-list">${cr.list.length ? cr.list.map((c, i) => {
        const on = inUse === c.code, picked = pick === c.code, pctDone = c.min ? Math.min(100, Math.round(sub / c.min * 100)) : 100;
        return `<div class="of-t${c.ok ? '' : ' lock'}${on ? ' on' : ''}" style="--tn:${tn(i + 1)}"><div class="of-l"><b class="of-big">${esc(fmt(c.amt))}</b><span class="of-code">${esc(c.code)}</span><small>${c.min ? 'On orders of ' + esc(fmt(c.min)) + ' or more' : 'On any order'}</small>${left(c.ends) ? `<em>${left(c.ends)}</em>` : ''}
          ${c.ok ? '' : `<span class="of-bar" aria-hidden="true"><i style="width:${pctDone}%"></i></span><small class="of-need">${ic('lock')}${has ? 'Add ' + esc(fmt(c.need)) + ' more to unlock' : 'Unlocks at ' + esc(fmt(c.min))}</small>`}</div>
          <div class="of-r"><button type="button" data-copy="${esc(c.code)}" aria-label="Copy ${esc(c.code)}">${ic('copy')}</button><button type="button" class="use" data-code="${esc(c.code)}" aria-pressed="${picked}">${on ? 'In use' : picked ? 'Picked' : W.code && wal ? 'Use instead' : 'Use'}</button></div></div>`;
      }).join('') : `<div class="m-none"><b>No extra credits right now.</b><span class="m-mute">Your delivery credit and welcome credit still apply. Sale prices below need no code.</span></div>`}</div>
      <p class="m-mute m-pad of-one">One credit per order on top of delivery. A picked credit counts once your bag reaches its amount. Until then, the biggest credit your bag qualifies for is used.</p>
      ${sale.length ? `<div class="m-row m-pad" style="margin-top:24px"><h2 class="m-h2">Already reduced</h2><a class="m-link" href="${href.shop('Sale')}" data-m>All sale</a></div><div class="m-grid">${sale.map((p) => card(p, false)).join('')}</div>` : ''}
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
      if (b.t === 'p') return `<p${b.big && b.h.replace(/<[^>]+>/g, '').length < 170 ? ' class="big"' : ''}>${b.h}</p>`;
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
  // contact: every way to reach a person, with what each is best for
  function contactBody() {
    const row = (cls, i, k, v, t, u, ext) => `<a class="r6-ch ${cls}" href="${u}"${ext ? ' target="_blank" rel="noopener"' : ''}><span class="r6-chi">${ic(i)}</span><span class="r6-cht"><small>${k}</small><b>${esc(v)}</b><em>${t}</em></span>${ic('arrow')}</a>`;
    return `<div class="m-pad r6-contact">
      <div class="r6-chs">${row('wa', 'wa', 'WhatsApp', waNice(), 'Quickest for sizing, orders and exchanges', 'https://wa.me/' + WA, 1)}${row('call', 'phone', 'Call', waNice(), 'Same number as WhatsApp', 'tel:+' + WA)}${row('mail', 'mail', 'Email', 'contact@daursupply.com', 'For anything that needs photos or detail', 'mailto:contact@daursupply.com')}${row('ig', 'ig', 'Instagram', '@daursupply', 'New pairs and fit checks', 'https://www.instagram.com/daursupply', 1)}${row('fb', 'fb', 'Facebook', 'facebook.com/daursupply', 'Message us any time', 'https://www.facebook.com/daursupply', 1)}</div>
      <div class="r6-hours"><span class="r6-hi">${ic('clock')}</span><span><b>Monday to Saturday</b><small>10 am to 7 pm, Pakistan time.</small></span></div>
      <div class="r6-from"><span class="r6-pin">${ic('pin')}</span><span><b>Sent from Islamabad</b><small>An online store. Every pair ships to your door anywhere in Pakistan.</small></span></div></div>`;
  }
  // about: where a pair comes from and how you know it is ours
  function aboutBody() {
    const stop = (n, t, s) => `<li><i>${n}</i><b>${t}</b><small>${s}</small></li>`;
    return `<section class="r6-route m-pad"><span class="r5-no">Where a pair comes from</span><h2 class="m-h2">From the workshop to your door.</h2>
        <ol class="r6-rt">${stop('1', 'Lahore, Sialkot and Kasur', 'Made by workshops we work with directly')}${stop('2', 'Checked by hand', 'Every pair, before it is boxed')}${stop('3', 'Islamabad', 'Packed and sent from here')}${stop('4', 'Your door', '2 to 5 days anywhere in Pakistan')}</ol></section>
      <section class="r6-marks m-pad"><span class="r5-no">How you know it is ours</span><div class="r6-mk">
        <div><svg viewBox="0 0 80 60" aria-hidden="true"><path d="M6,40 C20,20 40,44 52,26 C60,14 70,18 74,24" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"/></svg><b>Thick matte black laces</b><small>Cotton, never shiny</small></div>
        <div><svg viewBox="0 0 80 60" aria-hidden="true"><rect x="22" y="14" width="36" height="34" rx="6" fill="none" stroke="currentColor" stroke-width="5"/><path d="M32,31 h16" stroke="currentColor" stroke-width="5" stroke-linecap="round"/></svg><b>Engraved metal tag</b><small>On the lace</small></div>
        <div><svg viewBox="0 0 80 60" aria-hidden="true"><circle cx="40" cy="30" r="22" fill="none" stroke="currentColor" stroke-width="5"/><path d="M32,20 h8 a10,10 0 0 1 0,20 h-8 z" fill="currentColor"/></svg><b>The DAUR seal</b><small>Stamped on every box</small></div></div></section>
      <section class="r6-nums m-pad">${[['3', 'workshop cities'], [String(C.exchangeDays || 5), 'day size swap'], ['30', 'day defect promise'], [NF(DEL), 'rupee delivery credit']].map(([n, t]) => `<span><b>${n}</b><small>${t}</small></span>`).join('')}</section>`;
  }
  // the Journal: a magazine, not a list of links
  function journal(src, pg) {
    const items = [...src.querySelectorAll('.j-list article')].map((a) => {
      const h = a.querySelector('h2 a'); if (!h) return null;
      const im = a.querySelector('.j-thumb img'), meta = [...a.querySelectorAll('.j-meta span')].map((x) => txt(x));
      return { u: h.getAttribute('href'), t: txt(h), ex: txt(a.querySelector('.j-ex') || { textContent: '' }), img: im ? (im.currentSrc || im.getAttribute('src')) : '', tag: meta.length > 1 ? meta[0] : '', mins: meta[meta.length - 1] || '' };
    }).filter(Boolean);
    if (!items.length) return false;
    const tags = [...src.querySelectorAll('.j-chips a')].map((a) => ({ u: a.getAttribute('href'), l: txt(a), on: a.getAttribute('aria-current') === 'page' }));
    const COV = [['m-saddle-black.webp', 'red'], ['m-ward-brown.webp', 'esp'], ['m-grid.webp', 'crm'], ['m-moc-oxblood.webp', 'grn'], ['m-phantom.webp', 'ink'], ['m-derby.webp', 'crm'], ['m-sector.webp', 'esp'], ['m-volt.webp', 'grn']];
    const cover = (x, i, cls) => x.img ? `<span class="r6-cv ${cls}"><img src="${esc(x.img)}" alt="" loading="lazy"></span>` : `<span class="r6-cv ${cls} v-${COV[i % COV.length][1]}"><img class="cut" src="${asset(COV[i % COV.length][0])}" alt="" loading="lazy"><i>${esc(x.tag || 'Journal')}</i></span>`;
    const lead = items[0], rest = items.slice(1);
    state.pageTitle = 'The DAUR Journal';
    view.innerHTML = `<div class="r6-j">
      <header class="r6-jh m-pad"><span class="r6-jk">The DAUR Journal</span><h1>${pg.title || 'Guides for men who wear their shoes'}</h1><p>${pg.aside || ''}</p></header>
      ${tags.length ? `<nav class="r6-tags" aria-label="Topics">${tags.map((t) => `<a href="${esc(t.u)}"${parse(t.u) ? ' data-m' : ''}${t.on ? ' aria-current="page"' : ''}>${esc(t.l)}</a>`).join('')}</nav>` : ''}
      <a class="r6-lead m-pad" href="${esc(lead.u)}" data-m>${cover(lead, 0, 'big')}<span class="r6-lt"><small>${esc([lead.tag, lead.mins].filter(Boolean).join(' · '))}</small><b>${esc(lead.t)}</b><span>${esc(lead.ex)}</span><em>Read more<i>${ic('arrow')}</i></em></span></a>
      <h2 class="m-h2 m-pad r6-jl">Latest guides</h2>
      <div class="r6-list m-pad">${rest.map((x, i) => `<a class="r6-row" href="${esc(x.u)}" data-m style="--i:${Math.min(i, 8)}">${cover(x, i + 1, 'sm')}<span><small>${esc([x.tag, x.mins].filter(Boolean).join(' · '))}</small><b>${esc(x.t)}</b><em>${esc(x.ex)}</em></span></a>`).join('')}</div>
      <div class="m-pad r5-help"><b>Still a question?</b><span class="m-mute">A real person answers, usually within working hours.</span>${talk()}</div></div>`;
    observeIn();
    return true;
  }
  V.page = function () {
    let src = document.getElementById('app'); if (!src) return;
    let page = document.body.dataset.page || 'page';
    if (cur.remote) {
      // a page from the store, read from the copy fetched in the background (or fetched now, with its shape on screen)
      const doc = DOCS.get(cur.remote);
      if (!doc) { const want = cur.remote; view.innerHTML = skeleton(''); H.classList.add('m-loading'); fetchDoc(want).then(() => { H.classList.remove('m-loading'); if (cur.remote === want) { render(); backTo(); } }, () => { location.href = want; }); return; }
      src = doc.getElementById('app') || doc.querySelector('main') || doc.body; page = 'page';
      if (doc.title) document.title = doc.title;
    } else if (cur.a && document.body.dataset.page !== cur.a) { try { API.draw(cur.a); } catch (e) { location.reload(); return; } page = cur.a; }
    const pg = harvest(src);
    if (/^\/blogs\/[^/]+\/?(tagged\/[^/]+\/?)?$/.test(location.pathname) && journal(src, pg)) return;
    // the storefront has not drawn this page yet: keep its shape on screen until it does
    if (!pg.title && !pg.secs.length) { view.innerHTML = skeleton(PAGE_T[page] || ''); state.pageTitle = PAGE_T[page] || 'DAUR Supply'; return; }
    const words = pg.secs.reduce((a, s) => a + s.blocks.reduce((x, b) => x + JSON.stringify(b.h || b.items || '').length, 0), 0);
    const fold = !/^(manifesto|about|giving|gifts|offers|feed)$/.test(page) && pg.secs.length >= 4 && words > 2400;
    const nodes = [];
    const cut = CUTS[[...location.pathname].reduce((a, ch) => a + ch.charCodeAt(0), 0) % CUTS.length];
    const plain = (pg.title || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    state.pageTitle = PAGE_T[page] || plain.split(/[.:]/)[0].slice(0, 30) || 'DAUR Supply';
    const hi = [...location.pathname].reduce((a, ch) => a + ch.charCodeAt(0), 0);
    const pk = /\/blogs\//.test(location.pathname) ? 'journal' : /\/pages\/faq/.test(location.pathname) ? 'faq' : /\/search/.test(location.pathname) ? 'search' : VIS[page] ? page : 'page';
    const vis = VIS[pk], art = /\/blogs\/[^/]+\/[^/]+/.test(location.pathname);
    view.innerHTML = `<div class="m-pg">
      <section class="pg-hero r5-hero v-${art ? 'crm' : vis[1]}" style="--tn:${tn(hi)};--tn2:${tn(hi + 2)}"><span class="r5-hdm" aria-hidden="true">${DMARK}</span><img class="pg-cut" src="${asset(art ? 'm-' + cut + '.webp' : vis[0])}" alt=""><span class="pg-blob" aria-hidden="true"></span>
        ${pg.kick ? `<span class="m-kick">${esc(pg.kick)}</span>` : ''}<h1>${pg.title || esc(state.pageTitle)}</h1>${pg.aside ? `<p>${pg.aside}</p>` : ''}
        ${pg.ctas.length ? `<div class="pg-ctas">${pg.ctas.slice(0, 2).map((x, i) => `<a class="${i === 0 ? 'm-cta' : 'm-ghost'}" href="${esc(x.h)}"${parse(x.h) ? ' data-m' : ''}>${esc(x.l)}</a>`).join('')}</div>` : ''}</section>
      ${pk === 'contact' ? contactBody() : pk === 'about' ? aboutBody() : ''}
      ${pg.chips.length ? `<div class="m-pills pg-chips">${pg.chips.map((c) => `<a class="m-pill alt" href="${esc(c.h)}" data-jump="${esc(c.h.slice(1))}">${esc(c.l)}</a>`).join('')}</div>` : ''}
      ${(pk === 'contact' ? [] : pg.secs).map((s, i) => fold
        ? `<details class="pg-sec pg-acc"${s.id ? ` id="${esc(s.id)}"` : ''}${i === 0 ? ' open' : ''} style="--tn:${tn(i)}"><summary><span>${s.kick ? `<small>${esc(s.kick)}</small>` : ''}<b>${s.title || 'More'}</b></span>${ic('chev')}</summary><div>${blocksHtml(s.blocks, nodes)}</div></details>`
        : `<section class="pg-sec r5-sec${i % 4 === 2 ? ' dark' : ''}"${s.id ? ` id="${esc(s.id)}"` : ''} style="--tn:${tn(i)}">${s.title ? `<span class="r5-no">${String(i + 1).padStart(2, '0')}</span>` : ''}${s.kick ? `<span class="m-kick">${esc(s.kick)}</span>` : ''}${s.title ? `<h2>${s.title}</h2>` : ''}${blocksHtml(s.blocks, nodes)}</section>`).join('')}
      ${pk === 'contact' ? '' : `${pk === 'about' ? `<div class="m-pad r6-acta"><a class="m-cta" href="${href.shop()}" data-m>Explore the pairs</a><a class="m-ghost" href="${root}/pages/manifesto" data-m>Read our story</a></div>` : ''}<div class="m-pad r5-help"><b>Still a question?</b><span class="m-mute">A real person answers, usually within working hours.</span>${talk()}</div>`}
    </div>`;
    nodes.forEach((n, i) => { const ph = view.querySelector(`[data-node="${i}"]`); if (ph) ph.appendChild(n); });
    $$('img', view).forEach((im) => im.addEventListener('error', () => { im.style.display = 'none'; }, { once: true }));
    observeIn();
    if (location.hash) { const t = document.getElementById(decodeURIComponent(location.hash.slice(1))); if (t && view.contains(t)) { if (t.tagName === 'DETAILS') t.open = true; setTimeout(() => t.scrollIntoView({ block: 'start' }), 60); } }
  };

  /* ---------- background copies of store pages: fetched once, kept for the visit ---------- */
  const FIRST = location.pathname + location.search;
  const DOCS = new Map(), PEND = new Map();
  // the page the visit started on is kept as it arrived, so coming back to it later still shows the store copy
  try { const first = document.getElementById('app'); if (first) { const d = document.implementation.createHTMLDocument(document.title); d.body.appendChild(first.cloneNode(true)); DOCS.set(FIRST, d); } } catch (e) { /* the live page is read instead */ }
  function fetchDoc(u) {
    if (DOCS.has(u)) return Promise.resolve(DOCS.get(u));
    if (PEND.has(u)) return PEND.get(u);
    const p = fetch(u, { credentials: 'same-origin', headers: { Accept: 'text/html' } }).then((r) => { if (!r.ok) throw new Error(r.status); return r.text(); })
      .then((h) => { const d = new DOMParser().parseFromString(h, 'text/html'); DOCS.set(u, d); PEND.delete(u); return d; }, (e) => { PEND.delete(u); throw e; });
    PEND.set(u, p); return p;
  }
  const warmDoc = (h) => { try { const r = parse(h); if (r && r.remote && !DOCS.has(r.remote) && navigator.onLine !== false && !(navigator.connection && navigator.connection.saveData)) fetchDoc(r.remote).catch(() => {}); } catch (e) { /* only a speed up */ } };
  // pair photos are fetched while the shopper looks around, so a product page opens with its pictures ready
  function warmImages() {
    const list = P(); let i = 0;
    const next = (dl) => { while (i < list.length && (!dl || dl.timeRemaining() > 4)) { const p = list[i++], v = firstV(p), x = pic(p, v); const a = new Image(); a.decoding = 'async'; a.src = x.src; (v.images || []).slice(0, 2).forEach((s) => { const b = new Image(); b.src = sized(s, 900); }); } if (i < list.length) idle(next); };
    idle(next);
  }
  const idle = (fn) => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 3000 }) : setTimeout(() => fn(null), 400));

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
  // a placeholder in the shape of the page that is on its way, so the screen is never blank while it loads
  function skeleton(title) {
    return `<div class="m-skel" aria-busy="true" aria-label="Loading"><div class="sk sk-hero"></div>${title ? `<p class="sk-t">${esc(title)}</p>` : '<div class="sk sk-h"></div>'}<div class="sk sk-l"></div><div class="sk sk-l s"></div><div class="sk-row"><div class="sk sk-c"></div><div class="sk sk-c"></div></div><div class="sk sk-l"></div><div class="sk sk-l s"></div></div>`;
  }
  V.offline = function () {
    view.innerHTML = `<div class="m-empty m-off"><span class="n-i">${ic('clock')}</span><b>You are offline</b><span class="m-mute">This page needs the internet. Your bag and liked pairs are saved on this phone.</span>
      <button type="button" class="m-cta solo" data-retry>Try again</button></div>
      <div class="m-pad"><div class="of-cr"><a class="cr-row" href="${href.bag}" data-m><span class="cr-i">${ic('bag')}</span><span class="cr-t"><b>Your bag</b><small>Saved</small></span>${ic('arrow')}</a><a class="cr-row" href="${href.liked}" data-m><span class="cr-i">${ic('heart')}</span><span class="cr-t"><b>Liked</b><small>Saved</small></span>${ic('arrow')}</a><a class="cr-row" href="${href.shop()}" data-m><span class="cr-i">${ic('grid')}</span><span class="cr-t"><b>Shop</b><small>Browse the pairs</small></span>${ic('arrow')}</a></div></div>`;
  };
  function go(u, push) {
    const r = parse(u);
    if (!r) {
      // a page the app does not draw itself: show its shape at once, then let the browser load it
      if (navigator.onLine === false) { state.retry = u; cur = { v: 'offline' }; render('in'); window.scrollTo(0, 0); return; }
      view.innerHTML = skeleton(''); H.classList.add('m-loading'); window.scrollTo(0, 0); location.href = u; return;
    }
    const same = r.v === cur.v && r.a === cur.a && r.remote === cur.remote;
    if (r.v !== cur.v && r.v === 'shop') state.q = r.q != null ? r.q : null;
    if (r.v === 'shop') state.shopCat = r.a;
    cur = r;
    if (push !== false && !same) { keepPlace(); history.pushState({ m: 1 }, '', u); }
    if (r.v === 'shop' && view.querySelector('.m-search') && same) { V.shop(); return; }
    if (r.v !== 'shop') view.innerHTML = '';
    const run = () => { render(push === false ? 'back' : 'in'); window.scrollTo(0, 0); };
    // drawn at once: no snapshot step between the tap and the new screen, so a tap never feels stuck
    run();
    const t = { home: 'DAUR Supply', shop: 'Shop | DAUR Supply' }[r.v] || (TITLE[r.v] ? TITLE[r.v] + ' | DAUR Supply' : '');
    if (t) document.title = t; else if (r.v === 'product') document.title = API.prod(r.a).name + ' | DAUR Supply';
  }
  // every screen remembers where it was: the scroll, and how far the endless home had grown
  try { history.scrollRestoration = 'manual'; } catch (e) { /* older browsers restore on their own */ }
  const PLACE_K = 'daur.mPlace';
  const places = () => { try { return JSON.parse(sessionStorage.getItem(PLACE_K) || '{}'); } catch (e) { return {}; } };
  function keepPlace() {
    const k = location.pathname + location.search, more = $('#mMore');
    const p = places(); p[k] = { y: Math.round(window.scrollY), more: more ? +(more.dataset.k || 0) : 0, cat: state.homeCat || '' };
    const keys = Object.keys(p); if (keys.length > 40) delete p[keys[0]];
    try { sessionStorage.setItem(PLACE_K, JSON.stringify(p)); } catch (e) { /* private mode: no memory */ }
  }
  function backTo() {
    const pl = places()[location.pathname + location.search]; if (!pl) return;
    if (cur.v === 'home') { for (let i = +($('#mMore') || { dataset: {} }).dataset.k || 0; i < pl.more; i++) moreHome(); }
    let n = 0; const go2 = () => { window.scrollTo(0, pl.y); if (Math.abs(window.scrollY - pl.y) > 4 && n++ < 12) requestAnimationFrame(go2); };
    requestAnimationFrame(go2);
  }
  window.addEventListener('popstate', () => { const r = parse(location.href); if (r) { cur = r; const pl = places()[location.pathname + location.search]; if (pl && pl.cat) state.homeCat = pl.cat; render('back'); backTo(); } else location.reload(); });
  window.addEventListener('pagehide', keepPlace);

  /* ---------- sheets and toast ---------- */
  function openSheet(html) { sheet.classList.remove('r5-full'); sheet.innerHTML = '<div class="m-grab"></div>' + html; sheet.classList.add('on'); scrim.classList.add('on'); }
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
  // the menu: wallet card, the shop in big type, gift or give, your things, DAUR, and a way to talk to us
  const VIS = {
    manifesto: ['m-hero.webp', 'esp'], contract: ['m-ward-brown.webp', 'grn'], about: ['m-moc-oxblood.webp', 'red'], contact: ['m-sector.webp', 'ink'],
    policies: ['m-saddle.webp', 'crm'], track: ['m-derby.webp', 'esp'], faq: ['m-grid.webp', 'crm'], journal: ['m-saddle-black.webp', 'red'], search: ['m-volt.webp', 'crm'], page: ['m-phantom.webp', 'ink']
  };
  const talk = (cls) => `<div class="r5-talk ${cls || ''}"><a class="wa" href="https://wa.me/${WA}" target="_blank" rel="noopener">${ic('wa')}<b>WhatsApp</b><small>${esc(waNice())}</small></a><a class="call" href="tel:+${WA}">${ic('phone')}<b>Call</b><small>${esc(waNice())}</small></a><a class="mail" href="mailto:contact@daursupply.com">${ic('mail')}<b>Email</b><small>contact@daursupply.com</small></a></div>`;
  function menu() {
    const n = API.cart.reduce((a, l) => a + l.qty, 0);
    const all = P(), saleN = all.filter((p) => p.variants.some(API.onSale)).length;
    const big = (h, t, sub, cls) => `<a class="r5-nav${cls ? ' ' + cls : ''}" href="${h}" data-m><b>${esc(t)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}${ic('chevr')}</a>`;
    const ILL = {"story": "<svg class=\"r6-ill\" viewBox=\"0 0 160 120\" aria-hidden=\"true\"><path class=\"ln\" d=\"M14,92 C40,70 70,62 104,66 C128,68 146,76 152,88\"/><path class=\"st\" d=\"M20,100 C46,80 76,72 108,76 C130,78 146,84 150,94\"/><path class=\"nd\" d=\"M96,20 L60,96\"/><circle class=\"ey\" cx=\"94\" cy=\"24\" r=\"4\"/><path class=\"th\" d=\"M94,24 C120,10 140,30 128,48 C118,62 100,58 104,78\"/></svg>", "promise": "<svg class=\"r6-ill\" viewBox=\"0 0 160 120\" aria-hidden=\"true\"><g class=\"seal\"><circle cx=\"80\" cy=\"56\" r=\"34\"/><circle cx=\"80\" cy=\"56\" r=\"25\" class=\"in\"/><path class=\"ck\" d=\"M66,57 l10,10 l20,-22\"/></g><path class=\"rb\" d=\"M64,86 l-10,28 l14,-6 l8,12 l6,-30\"/><path class=\"rb\" d=\"M96,86 l10,28 l-14,-6 l-8,12 l-6,-30\"/></svg>", "feed": "<svg class=\"r6-ill\" viewBox=\"0 0 160 120\" aria-hidden=\"true\"><g class=\"pc p1\"><rect x=\"34\" y=\"22\" width=\"56\" height=\"66\" rx=\"4\"/><rect x=\"40\" y=\"28\" width=\"44\" height=\"40\" class=\"ph\"/></g><g class=\"pc p2\"><rect x=\"70\" y=\"18\" width=\"56\" height=\"66\" rx=\"4\"/><rect x=\"76\" y=\"24\" width=\"44\" height=\"40\" class=\"ph\"/><path class=\"sn\" d=\"M80,58 C84,50 92,48 98,48 L104,42 C106,40 110,40 112,42 L116,48 C118,50 118,56 118,58 Z\"/></g></svg>", "journal": "<svg class=\"r6-ill\" viewBox=\"0 0 160 120\" aria-hidden=\"true\"><path class=\"bk\" d=\"M80,30 C64,22 40,22 22,28 V98 C40,92 64,92 80,100 C96,92 120,92 138,98 V28 C120,22 96,22 80,30 Z\"/><path class=\"bk\" d=\"M80,30 V100\"/><path class=\"pg\" d=\"M80,30 C96,22 120,22 138,28 V98 C120,92 96,92 80,100 Z\"/><path class=\"tx\" d=\"M34,44 H68 M34,56 H68 M34,68 H60 M92,44 H126 M92,56 H126\"/></svg>"};
    const tile = (h, k, cls, t, sub, i) => `<a class="r5-tile r6-tile v-${cls}" href="${h}" data-m style="--i:${i}">${ILL[k]}<span><b>${t}</b><small>${sub}</small></span></a>`;
    const act = (h, i, t, badge, c) => `<a class="r5-act ${c || ''}" href="${h}"${parse(h) ? ' data-m' : ''}><span class="r5-ai">${ic(i)}${badge ? `<em>${badge}</em>` : ''}</span><small>${t}</small></a>`;
    const bal = DEL + (W.code && W.on() ? W.amt : 0);
    openSheet(`<div class="r5-menu">
      <div class="r5-mh">${logo(true)}<button class="m-ib m-soft" type="button" data-mclose aria-label="Close menu">${ic('x')}</button></div>
      <a class="r5-mcard" href="${href.offers}" data-m><span class="r5-mc-dm">${DMARK}</span><small>DAUR wallet</small><b>${esc(fmt(bal))}</b><span class="r5-mc-go">In credits, ready to use${ic('arrow')}</span></a>
      <nav class="r5-navs" aria-label="Shop">${big(href.shop(), 'Shop all', all.length + ' pairs')}${saleN ? big(href.shop('Sale'), 'Sale', saleN + (saleN === 1 ? ' pair' : ' pairs') + ' reduced', 'sale') : ''}${cats().map((c) => { const k = all.filter((p) => p.category === c).length; return big(href.shop(c), c, k + (k === 1 ? ' pair' : ' pairs'), 'cat'); }).join('')}</nav>
      <div class="r5-kh"><h4 class="r5-k">For someone else</h4><button type="button" class="m-link" data-explain>${ic('help')}Which one?</button></div>
      <div class="r5-duo">${duo('gift', true)}${duo('give', true)}</div>
      <h4 class="r5-k">Yours</h4>
      <div class="r5-acts">${act(href.bag, 'bag', 'Bag', n || '', 'c-brass')}${act(href.liked, 'heart', 'Liked', '', 'c-red')}${act(root + '/pages/track', 'truck', 'Track', '', 'c-grn')}${act(S.routes.account || root + '/account', 'user', 'Account', '', 'c-ink')}</div>
      <h4 class="r5-k">DAUR</h4>
      <div class="r5-tiles">${tile(root + '/pages/manifesto', 'story', 'esp', 'Our story', 'Stitched in three cities', 0)}${tile(root + '/pages/contract', 'promise', 'grn', 'Our promise', 'What we owe you', 1)}${tile(href.feed, 'feed', 'ink', 'The Feed', 'Pairs in real life', 2)}${tile(root + '/blogs/journal', 'journal', 'red', 'Journal', 'Care, fit and style', 3)}</div>
      <h4 class="r5-k">Talk to us</h4>${talk()}
      <div class="r5-rows"><a href="${root}/pages/contact" data-m>${ic('chat')}<span>Contact and opening hours</span>${ic('chevr')}</a><a href="${root}/pages/policies" data-m>${ic('note')}<span>Delivery, exchange and policies</span>${ic('chevr')}</a><a href="${root}/pages/about" data-m>${ic('story')}<span>About DAUR Supply</span>${ic('chevr')}</a></div>
      ${socRow('menu')}
      <p class="r5-foot">Made in workshops in Lahore, Sialkot and Kasur. Sent from Islamabad.</p>
      <a class="m-classic" href="${location.pathname}?view=classic">Open the full website</a></div>`);
    sheet.classList.add('r5-full');
  }
  // gift or give, side by side, so no one has to guess
  function explain() {
    const row = (i, t) => `<li>${ic(i)}<span>${t}</span></li>`;
    openSheet(`<h3 class="sh-h">Gift or Philanthropy?</h3><p class="m-mute sh-p">Two ways to buy a pair for someone else.</p>
      <div class="m-xp">
        <div class="xp gift"><span class="xp-i">${ic('gift')}</span><b>Gift</b><small>For someone you know</small>
          <ul>${row('check', 'You pick his size')}${row('note', 'Your note in the box')}${row('box', 'Gift packing on request')}${row('truck', 'Sent to the address you enter')}</ul>
          <a class="m-cta gold" href="${href.gifts}" data-m>Gift a pair</a></div>
        <div class="xp give"><span class="xp-i">${ic('hand')}</span><b>Philanthropy</b><small>For someone in need</small>
          <ul>${row('user', 'DAUR matches the size')}${row('hand', 'Handed over in person')}${row('camera', 'A private photo to you')}${row('coins', 'DAUR adds ' + fmt(DAUR_ADD) + ' per pair')}</ul>
          <a class="m-cta give" href="${href.giving}" data-m>Sponsor a pair</a></div>
      </div>
      <p class="sh-foot">${ic('tag')}<span>In your bag and on your order, each pair is marked <b class="t-gift">Gift</b> or <b class="t-give">Philanthropy</b>.</span></p>`);
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
    const label = give ? 'Sponsor this pair' : !state.qs ? 'Pick your size' : (state.qm === 'gift' ? 'Add as gift' : 'Add to bag') + ' · EU ' + state.qs;
    openSheet(`<div class="m-qa"><span class="q-img" style="--tn:${TINT[tintOf(p)]}"><img class="${x.cut ? '' : 'blend'}" src="${esc(x.src)}" alt=""></span><span class="q-t">${state.qm !== 'me' ? `<span class="ln-tag${give ? ' g' : ''}">${ic(give ? 'hand' : 'gift')}${give ? 'Philanthropy' : 'Gift'}</span>` : ''}<b>${esc(p.name)}</b><span class="m-mute">${esc(v.color)}</span><b>${esc(fmt(v.price))}</b></span></div>
      ${p.variants.length > 1 ? `<div class="m-cols" style="margin-top:16px">${p.variants.map((y, i) => { const z = pic(p, y); return `<button class="m-col" type="button" data-qv="${esc(y.id)}" aria-pressed="${y.id === v.id}" aria-label="${esc(y.color)}" style="--tn:${tn(tintOf(p) + i)}"><img class="${z.cut ? '' : 'blend'}" src="${esc(z.src)}" alt=""></button>`; }).join('')}</div>` : ''}
      ${give ? `<p class="m-modenote g" style="margin-top:16px">${ic('hand')}<span>We match the size to the person and send you a private photo after the handover.</span></p>`
        : `<h3 class="q-h">Size (EU)</h3><div class="m-sizes">${p.sizes.map((s) => { const q = (v.stock || {})[s] || 0; return `<button class="m-size" type="button" data-qs="${esc(s)}" aria-pressed="${state.qs == s}"${q > 0 ? '' : ' disabled'}>${esc(s)}</button>`; }).join('')}</div>`}
      <button class="m-cta wide${give ? ' give' : state.qm === 'gift' ? ' r6-gift' : ''}" type="button" data-qadd aria-disabled="${!give && !state.qs}"><span>${esc(label)}</span></button>`);
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

  /* ---------- order labels: the owner reads each line as GIFT, GIVING or the buyer's own pair, in the order and its note ---------- */
  function lineProps(mode, mixed) {
    if (mode === 'give') return { 'Order type': KIND.give.line, Size: 'Matched by DAUR to the person' };
    if (mode === 'gift') return { 'Order type': KIND.gift.line };
    return mixed ? { 'Order type': 'OWN: for the buyer' } : undefined;
  }
  function orderType(cart) {
    const n = (k) => cart.filter((l) => (l.mode || 'me') === k).reduce((a, l) => a + l.qty, 0);
    const parts = [[n('me'), 'OWN'], [n('gift'), 'GIFT'], [n('give'), 'GIVING']].filter((x) => x[0]).map((x) => x[0] + ' ' + x[1]);
    return parts.length === 1 && parts[0].endsWith('OWN') ? '' : parts.join(' + ');
  }
  function orderNote(g, units, nGive) {
    if (!units.length && !nGive) return '';
    const out = [];
    units.forEach((u, k) => { const d = gdOf(g, u.key), p = API.prod(u.l.pid); out.push('GIFT ' + (k + 1) + ': ' + (p ? p.name : '') + ' EU ' + u.l.size + ' for ' + (d.to || '') + ', ' + (d.phone || '') + ', ' + (d.addr || '') + '. Packing: ' + (g.pack ? 'yes' : 'no') + '.' + (d.note ? ' Note: ' + d.note : '')); });
    if (nGive) out.push('GIVING: ' + nGive + (nGive === 1 ? ' pair' : ' pairs') + ' for someone in need. DAUR matches the size, hands it over and adds ' + fmt(DAUR_ADD * nGive) + '. Send the buyer a private photo.');
    return out.join('\n');
  }


  /* ---------- checkout: the bag goes to Shopify, with the wallet or one code applied ---------- */
  async function checkout(btn) {
    const cart = API.cart; if (!cart.length) return;
    // every gift needs who it goes to before checkout opens
    const miss = giftMissing();
    if (miss) {
      const fs = $('#gd-' + miss.replace(/\W/g, '_'), view);
      if (fs) { fs.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }); $$('label', fs).forEach((l) => { const i = l.querySelector('input'); if (i && (i.dataset.gf === 'phone' ? i.value.replace(/\D/g, '').length < 10 : !i.value.trim())) l.classList.add('bad'); }); }
      toast('Add his name, phone and address for each gift'); return;
    }
    const mixed = cart.some((l) => l.mode === 'gift' || l.mode === 'give');
    const g = GD.get(), units = giftUnits();
    const items = [];
    cart.forEach((l) => {
      const p = API.prod(l.pid), v = p && API.variant(p, l.vid), id = v && v.sid && v.sid[l.size]; if (!id) return;
      if (l.mode === 'gift') {
        // one order line per gift pair, each with its own person, so nothing is mixed up when it is packed
        units.filter((u) => u.l === l).forEach((u) => { const d = gdOf(g, u.key); items.push({ id, quantity: 1, properties: Object.assign(lineProps('gift', mixed), { 'Gift for': String(d.to || '').slice(0, 40), 'Gift phone': String(d.phone || '').slice(0, 15), 'Gift address': String(d.addr || '').slice(0, 160), 'Gift note': String(d.note || '').slice(0, 240), 'Gift packing': g.pack ? 'Yes' : 'No' }) }); });
        return;
      }
      const properties = lineProps(l.mode, mixed);
      items.push(properties ? { id, quantity: l.qty, properties } : { id, quantity: l.qty });
    });
    const t = API.totals(), cr = credits(t.subtotal), code = cr.use ? cr.use.code : '';
    const total = Math.max(0, t.subtotal - (cr.use ? cr.use.amt : 0));
    const L = t.lines.map((d, i) => ({ mode: (cart[i] && cart[i].mode) || 'me', total: d.total, qty: d.l.qty }));
    const plan = payPlan(L, total);
    const nGive = L.filter((x) => x.mode === 'give').reduce((a, x) => a + x.qty, 0);
    const ships = L.some((x) => x.mode !== 'give');
    const lbl = btn && btn.querySelector('span');
    if (btn) { btn.setAttribute('aria-disabled', 'true'); if (lbl) lbl.textContent = 'Opening checkout'; }
    const reset = () => { if (btn) { btn.removeAttribute('aria-disabled'); if (lbl) lbl.textContent = 'Checkout'; } };
    const J = { 'Content-Type': 'application/json', Accept: 'application/json' };
    try {
      await fetch(root + '/cart/clear.js', { method: 'POST', headers: { Accept: 'application/json' } });
      const r = await fetch(root + '/cart/add.js', { method: 'POST', headers: J, body: JSON.stringify({ items }) });
      if (!r.ok) { const e = await r.json().catch(() => ({})); toast(e.description || 'A size in your bag just sold out.'); reset(); return; }
      const gift = units.length > 0, giving = nGive > 0;
      const attributes = {
        'Order type': orderType(cart),
        'Payment plan': plan.choice === 'full' ? 'Full payment now: ' + fmt(total) : (plan.full ? 'Gifts and giving paid now: ' : 'Advance now: ') + fmt(plan.now) + '. At the door: ' + fmt(plan.door),
        'Pay now': fmt(plan.now), 'Pay at door': plan.door ? fmt(plan.door) : '',
        'Credits used': [cr.use ? cr.use.label + ' ' + fmt(cr.use.amt) : '', ships ? 'Delivery credit ' + fmt(DEL) : ''].filter(Boolean).join(', '),
        'Slice cause': window.DAUR_SLICE_VOTE ? window.DAUR_SLICE_VOTE() : '',
        'Giving pair': giving ? 'Yes, ' + nGive + ' paid in full in advance. Size matched by DAUR. DAUR adds ' + fmt(DAUR_ADD * nGive) + '. Private proof after handover' : '',
        Gift: gift ? 'Yes, ' + units.length + ' paid in full in advance. Details on each line' : '',
        'Gift packing': gift && g.pack ? 'Requested' : '',
        'Opened in': 'Mobile app'
      };
      const upd = { attributes, discount: code }; const note = orderNote(g, units, nGive); if (note) upd.note = note;
      await fetch(root + '/cart/update.js', { method: 'POST', headers: J, body: JSON.stringify(upd) });
      location.href = code ? root + '/discount/' + encodeURIComponent(code) + '?redirect=' + encodeURIComponent(root + '/checkout') : root + '/checkout';
    } catch (e) { toast(navigator.onLine === false ? 'You are offline. Your bag is saved, so try again when you are back online.' : 'Checkout could not open. Please try again.'); reset(); }
  }

  /* ---------- one listener for every tap ---------- */
  app.addEventListener('click', (e) => {
    const t = e.target.closest('a,button,summary'); if (!t) return;
    const d = t.dataset;
    if (d.mclose !== undefined) { e.preventDefault(); closeSheet(); return; }
    if (d.jump !== undefined) { e.preventDefault(); const el = document.getElementById(d.jump || (t.getAttribute('href') || '').slice(1)); if (el) { if (el.tagName === 'DETAILS') el.open = true; el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); } return; }
    if (t.tagName === 'A' && d.m !== undefined) { e.preventDefault(); closeSheet(); go(t.getAttribute('href')); return; }
    if (t.tagName === 'A' && d.m === undefined && !t.target && !t.hasAttribute('download') && (view.contains(t) || sheet.contains(t)) && t.origin === location.origin && !/^#/.test(t.getAttribute('href') || '') && parse(t.href)) { e.preventDefault(); closeSheet(); go(t.href); return; }
    if (t.tagName === 'A' && view.contains(t) && /^#./.test(t.getAttribute('href') || '')) { const el = document.getElementById(t.getAttribute('href').slice(1)); if (el) { e.preventDefault(); if (el.tagName === 'DETAILS') el.open = true; el.scrollIntoView({ behavior: 'smooth', block: 'start' }); } return; }
    if (d.menu !== undefined) return menu();
    if (d.explain !== undefined) return explain();
    if (d.sortsheet !== undefined) return sortSheet();
    if (d.filtersheet !== undefined) return filterSheet();
    if (d.sort) { state.sort = d.sort; closeSheet(); V.shop(); return; }
    if (d.try) { const c = cats().includes(d.try) ? d.try : null; state.f = null; if (c) { state.shopCat = c; state.q = ''; } else { state.shopCat = 'All'; state.q = d.try; } const q = $('#mQ'); if (q) q.value = state.q; V.shop(); return; }
    if (d.fsize || d.fcol || d.fprice || d.fsale || d.fstock) {
      const f = F(), tg = (arr, v) => { const i = arr.indexOf(v); if (i < 0) arr.push(v); else arr.splice(i, 1); };
      if (d.fsize) tg(f.sizes, d.fsize); if (d.fcol) tg(f.cols, d.fcol); if (d.fprice) f.price = f.price === d.fprice ? '' : d.fprice;
      if (d.fsale) f.sale = !f.sale; if (d.fstock) f.stock = !f.stock;
      const y = sheet.scrollTop; V.shop(); filterSheet(); sheet.scrollTop = y; return;
    }
    if (d.fapply !== undefined) { closeSheet(); V.shop(); return; }
    if (d.fclear !== undefined) { state.f = null; V.shop(); if (sheet.classList.contains('on') && sheet.querySelector('[data-fapply]')) filterSheet(); return; }
    if (d.funset) { const f = F(), [k, v] = d.funset.split(':'); if (k === 'size') f.sizes = f.sizes.filter((x) => x !== v); if (k === 'col') f.cols = f.cols.filter((x) => x !== v); if (k === 'price') f.price = ''; if (k === 'sale') f.sale = false; if (k === 'stock') f.stock = false; V.shop(); return; }
    if (d.back !== undefined) { if (history.state && history.state.m) history.back(); else if (document.referrer && new URL(document.referrer).origin === location.origin && history.length > 1) history.back(); else go(href.home); return; }
    if (d.wallet !== undefined) return walletSheet();
    if (d.wish) { e.preventDefault(); API.toggleWish(d.wish); const on = wished(d.wish); $$(`[data-wish="${d.wish}"]`).forEach((b) => b.setAttribute('aria-pressed', on)); toast(on ? 'Saved to Liked' : 'Removed from Liked', on ? 'See all' : '', href.liked); if (cur.v === 'liked' && !on) render(); return; }
    if (d.quick) { e.preventDefault(); return quick(d.quick, d.mode); }
    if (d.hcat) { state.homeCat = d.hcat; $$('[data-hcat]', view).forEach((b) => b.setAttribute('aria-pressed', b.dataset.hcat === d.hcat)); const all = P().filter((p) => inCat(p, d.hcat)); const car = $('.m-car', view); if (car) { car.innerHTML = all.map((p) => card(p, true)).join('') || '<p class="m-mute m-pad">Nothing here yet.</p>'; car.scrollLeft = 0; } return; }
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
    if (d.wtoggle !== undefined) { W.set(!W.on()); if (cur.v === 'bag') V.bag(); else if (cur.v === 'offers') V.offers(); paintTop(); toast(W.on() ? 'Welcome credit ' + fmt(W.amt) + ' is on' : 'Welcome credit kept for later'); return; }
    if (d.uncode !== undefined) { CODE.set(''); V.bag(); return; }
    if (d.code) { const on = CODE.get() === d.code; CODE.set(on ? '' : d.code); if (cur.v === 'bag') V.bag(); else V.offers(); toast(on ? 'Back to your welcome credit' : d.code + ' picked. It is used once your bag qualifies.'); return; }
    if (d.copy) { const c = d.copy; const ok = () => toast(c + ' copied'); if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(c).then(ok, ok); else ok(); return; }
    if (d.vote) { const on = t.getAttribute('aria-pressed') === 'true'; store.set('sliceVote', on ? '' : d.vote); $$('[data-vote]', view).forEach((b) => b.setAttribute('aria-pressed', !on && b.dataset.vote === d.vote)); if (!on) toast('Vote saved: ' + d.vote); return; }
    if (d.gpack !== undefined) { const g = GD.get(); g.pack = !g.pack; GD.set(g); t.setAttribute('aria-pressed', g.pack); return; }
    if (d.gsame !== undefined) { const g = GD.get(); g.same = !g.same; if (g.same && !g.all.to) { const f = giftUnits()[0]; if (f && g.each[f.key]) g.all = Object.assign({}, g.each[f.key]); } GD.set(g); V.bag(); return; }
    if (d.pay) { store.set('mPay', d.pay); V.bag(); return; }
    if (d.gp) { state.gp = d.gp; const y = window.scrollY; V.giving(); window.scrollTo(0, y); return; }
    if (d.share) { const p = API.prod(d.share); const u = location.origin + href.product(p.id); if (navigator.share) navigator.share({ title: p.name, url: u }).catch(() => {}); else if (navigator.clipboard) navigator.clipboard.writeText(u).then(() => toast('Link copied')); return; }
    if (d.checkout !== undefined) { checkout(t); return; }
    if (d.retry !== undefined) { if (navigator.onLine === false) { toast('Still offline'); return; } location.href = state.retry || location.href; return; }
  });

  /* ---------- welcome: once a session, on the first page a visitor opens ---------- */
  function splash() {
    let seen = false; try { seen = sessionStorage.getItem('daur.mSplash') === '1'; sessionStorage.setItem('daur.mSplash', '1'); } catch (e) { seen = true; }
    if (seen || M.splash === false || cur.v !== 'home') return;
    document.body.insertAdjacentHTML('beforeend', `<div class="m-splash r5-sp" id="mSplash" role="dialog" aria-label="Welcome to DAUR Supply"><span class="r6-sks" aria-hidden="true"><i class="k1"><svg class="r6-sk" viewBox="0 0 200 110" aria-hidden="true"><path d="M12,80 C14,62 30,54 52,52 L78,32 C84,26 96,26 102,32 L120,50 C142,54 170,60 186,72 L186,82 Z"/><path d="M8,82 H188 a8,8 0 0 1 0,16 H16 a8,8 0 0 1 -8,-16 Z"/><path d="M70,42 l12,10 M80,36 l12,10 M90,32 l12,10"/><path d="M150,62 C162,64 174,68 184,74"/><path d="M24,74 C42,66 62,64 84,66" stroke-dasharray="4 5"/></svg></i><i class="k2"><svg class="r6-sk" viewBox="0 0 200 140" aria-hidden="true"><path d="M44,10 H96 V70 C120,72 160,80 180,100 V114 H32 Z"/><path d="M28,114 H184 a6,6 0 0 1 0,14 H34 a6,6 0 0 1 -6,-14 Z"/><path d="M60,18 V64 M80,18 V64"/><path d="M44,10 C40,4 52,2 54,10"/></svg></i><i class="k3"><svg class="r6-sk" viewBox="0 0 200 110" aria-hidden="true"><path d="M12,80 C14,62 30,54 52,52 L78,32 C84,26 96,26 102,32 L120,50 C142,54 170,60 186,72 L186,82 Z"/><path d="M8,82 H188 a8,8 0 0 1 0,16 H16 a8,8 0 0 1 -8,-16 Z"/><path d="M70,42 l12,10 M80,36 l12,10 M90,32 l12,10"/><path d="M150,62 C162,64 174,68 184,74"/><path d="M24,74 C42,66 62,64 84,66" stroke-dasharray="4 5"/></svg></i><i class="k4"><svg class="r6-sk" viewBox="0 0 200 140" aria-hidden="true"><path d="M44,10 H96 V70 C120,72 160,80 180,100 V114 H32 Z"/><path d="M28,114 H184 a6,6 0 0 1 0,14 H34 a6,6 0 0 1 -6,-14 Z"/><path d="M60,18 V64 M80,18 V64"/><path d="M44,10 C40,4 52,2 54,10"/></svg></i></span><span class="r5-sp-in"><span class="r5-sp-wm">${WORDMARK}<sup>SUPPLY</sup></span><b class="r5-sp-line">${esc(M.splashLine || 'Naya DAUR.')}</b></span></div>`);
    const s = $('#mSplash');
    const out = () => { if (s.classList.contains('out')) return; s.classList.add('out'); setTimeout(() => s.remove(), 450); };
    s.addEventListener('click', out);
    // it steps aside by itself, so the store is never held behind it
    setTimeout(() => { if (s.isConnected) out(); }, reduce ? 900 : 1700);
    let y0 = null;
    s.addEventListener('touchstart', (e) => { y0 = e.touches[0].clientY; }, { passive: true });
    s.addEventListener('touchmove', (e) => { if (y0 != null && y0 - e.touches[0].clientY > 60) { y0 = null; out(); } }, { passive: true });
  }

  /* ---------- network: never a blank screen ---------- */
  const net = document.createElement('div'); net.className = 'm-net'; net.setAttribute('role', 'status'); app.appendChild(net);
  const netPaint = () => { const off = navigator.onLine === false; net.innerHTML = off ? `${ic('clock')}<span>Offline. Showing what is saved on this phone.</span>` : ''; net.classList.toggle('on', off); };
  window.addEventListener('offline', netPaint); window.addEventListener('online', () => { netPaint(); toast('Back online'); if (cur.v === 'offline' && state.retry) location.href = state.retry; });
  // a photo that fails on a weak network leaves the tinted card and the pair's name, never a broken image
  view.addEventListener('error', (e) => { const t = e.target; if (t && t.tagName === 'IMG') t.classList.add('m-noimg'); }, true);
  // a page shown again from the browser's back cache drops its loading state
  window.addEventListener('pageshow', (e) => { if (e.persisted) { H.classList.remove('m-loading'); if (view.querySelector('.m-skel')) render(); } });

  /* ---------- shared with the view files ----------
     daur-m-pdp.js (product page) and daur-m-bag.js (bag and payment) load after this file and replace V.product
     and V.bag through window.DAUR_MX, so each area can be worked on in its own file. MX.tap('name', fn) adds a
     handler for buttons that carry data-name; fn returns false to let the built in handlers run as well. */
  const TAPS = {};
  window.DAUR_MX = {
    V, API, C, M, I, ic, esc, fmt, NF, store, asset, txt, sized, pic, img, firstV, price, notesFor, allNotes, wished, minP, delTxt, days, DEL, DAUR_ADD, GIVE,
    WA, waNice, SOC, KIND, MODES, TINT, tn, tintOf, P, CUT, DMARK, WORDMARK, logo, href, root, parse, go, render, paintTop, paintTab, card, row, cats, inCat, hasSale,
    view, app, sheet, $, $$, toast, openSheet, closeSheet, burst, observeIn, buyBar, paintBuy, add, giveSize, quick, explain, skeleton,
    W, CODE, credits, coupons, payPlan, giftUnits, GD, gdOf, giftMissing, checkout, lineProps, orderType, orderNote,
    get cur() { return cur; }, get state() { return state; }, reduce,
    tap: (name, fn) => { TAPS[name] = fn; }
  };
  // every gift button answers with a little love
  app.addEventListener('click', (e) => { const g = e.target.closest('.m-act[data-mode=gift], .px-cta.k-gift, [data-pxfor=gift], .r5-card.gift, .r6-gift, [data-love]'); if (g) burst(g, true); }, true);
  app.addEventListener('click', (e) => {
    const t = e.target.closest('a,button,summary,[data-tap]'); if (!t) return;
    for (const k in TAPS) if (t.dataset[k] !== undefined && TAPS[k](t, e, t.dataset) !== false) { e.stopImmediatePropagation(); return; }
  }, true);

  /* ---------- start: after every deferred view file has loaded ---------- */
  // pages the app cannot draw itself are fetched ahead, so they open as if already there
  function warm() {
    try {
      if (window.HTMLScriptElement && HTMLScriptElement.supports && HTMLScriptElement.supports('speculationrules')) {
        const sr = document.createElement('script'); sr.type = 'speculationrules';
        sr.textContent = JSON.stringify({ prerender: [{ where: { and: [{ href_matches: '/*' }, { not: { href_matches: ['/cart*', '/checkout*', '/account*', '/discount/*'] } }] }, eagerness: 'moderate' }],
          prefetch: [{ urls: [root + '/blogs/journal'], eagerness: 'eager' }] });
        document.head.appendChild(sr);
      } else {
        const done = new Set();
        const pre = (h) => { if (done.has(h)) return; done.add(h); const l = document.createElement('link'); l.rel = 'prefetch'; l.href = h; document.head.appendChild(l); };
        app.addEventListener('touchstart', (e) => { const a = e.target.closest('a[href]'); if (a && !a.hasAttribute('data-m') && a.origin === location.origin && !/\/(cart|checkout|account)/.test(a.pathname)) pre(a.href); }, { passive: true });
      }
    } catch (e) { /* prefetch is only a speed up */ }
  }
  // the cookie question, made small: one line above the tab bar, asked once
  function slimCookies() {
    const fix = (box) => { if (!box || box.dataset.slim) return; box.dataset.slim = '1'; const t = box.querySelector('.ck-t'); if (t) t.innerHTML = 'Cookies keep your bag and likes saved on this phone. <a href="' + root + '/pages/policies#privacy">Privacy</a>'; const a = box.querySelector('[data-ck=all]'), e = box.querySelector('[data-ck=ess]'); if (a) a.textContent = 'Accept'; if (e) e.textContent = 'Only essential'; };
    fix(document.getElementById('ck'));
    if ('MutationObserver' in window) { const mo = new MutationObserver(() => { const b = document.getElementById('ck'); if (b) { fix(b); mo.disconnect(); } }); mo.observe(document.body, { childList: true }); setTimeout(() => mo.disconnect(), 15000); }
  }
  function boot() {
  netPaint();
  try { const nav = performance.getEntriesByType && performance.getEntriesByType('navigation')[0]; if (nav && nav.type === 'back_forward') setTimeout(backTo, 60); } catch (e) { /* only a convenience */ }
  warm();
  // a finger on a link starts fetching its page before the tap ends
  app.addEventListener('touchstart', (e) => { const a = e.target.closest('a[href]'); if (a && a.origin === location.origin) warmDoc(a.href); }, { passive: true });
  app.addEventListener('pointerover', (e) => { const a = e.target.closest && e.target.closest('a[href]'); if (a && a.origin === location.origin) warmDoc(a.href); }, { passive: true });
  idle(() => { warmImages(); [root + '/blogs/journal'].forEach(warmDoc); });
  slimCookies();
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
  }
  if (document.readyState === 'loading' || document.readyState === 'interactive') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
})();
